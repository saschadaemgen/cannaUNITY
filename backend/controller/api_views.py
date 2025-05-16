# controller/api_views.py
from rest_framework import viewsets, status, pagination, serializers  # <-- Hier serializers hinzufügen
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from django.db.models import Sum, Avg, F, ExpressionWrapper, fields
from django.db.models.functions import TruncDate
from decimal import Decimal

import datetime
import json

# Korrekte Importe für die Modelle und Serializer
from .models import (
    IrrigationController, IrrigationSchedule,
    LightController, LightSchedule, LightSchedulePoint,
    ControllerLog, ResourceUsage
)
from .serializers import (
    IrrigationControllerSerializer, IrrigationScheduleSerializer,
    LightControllerSerializer, LightScheduleSerializer, LightSchedulePointSerializer,
    ControllerLogSerializer, ResourceUsageSerializer
)
from .mqtt_client import MQTTClient

# Paginierung für APIs
class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class IrrigationControllerViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Bewässerungscontroller mit erweiterten Aktionen.
    """
    queryset = IrrigationController.objects.all().order_by('-created_at')
    serializer_class = IrrigationControllerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def perform_create(self, serializer):
        # Wenn kein created_by_id im Request ist, versuchen wir, den User zu einem Member zuzuordnen
        if 'created_by_id' not in self.request.data:
            try:
                from members.models import Member
                member = Member.objects.get(email=self.request.user.email)
                serializer.save(created_by=member)
            except Member.DoesNotExist:
                # Falls kein Member gefunden wird, ohne created_by speichern
                serializer.save()
        else:
            # Wenn created_by_id im Request ist, überlassen wir die Auflösung dem Serializer
            serializer.save()

    def perform_update(self, serializer):
        # Analog für Updates
        if 'created_by_id' not in self.request.data:
            serializer.save(last_modified_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def manual_irrigation(self, request, pk=None):
        """Manuelle Bewässerung starten"""
        controller = self.get_object()
        
        # Parameter auslesen
        duration = request.data.get('duration', 5)  # Standard: 5 Minuten
        intensity = request.data.get('intensity', 100)  # Standard: 100%
        
        # Validierung
        try:
            duration = int(duration)
            intensity = int(intensity)
            if duration < 1 or duration > 60:
                return Response(
                    {"error": "Dauer muss zwischen 1 und 60 Minuten liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if intensity < 1 or intensity > 100:
                return Response(
                    {"error": "Intensität muss zwischen 1 und 100% liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Ungültige Parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Notfall-Stopp prüfen
        if controller.emergency_stop:
            return Response(
                {"error": "Controller ist im Notfall-Stopp-Modus"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # MQTT-Client initialisieren und Befehl senden
        mqtt_client = MQTTClient()
        
        # Volumenberechnung - Decimal für Datenbank, Float für JSON
        volume_decimal = controller.flow_rate * Decimal(duration) * (Decimal(intensity) / Decimal(100))
        volume_float = float(volume_decimal)  # Als float für JSON
        
        # Befehl vorbereiten - alle Decimal-Werte als float
        mqtt_payload = {
            "action": "manual_irrigation",
            "parameters": {
                "duration": duration,
                "intensity": intensity,
                "volume": volume_float  # Als float für JSON
            },
            "timestamp": timezone.now().isoformat(),
            "request_id": str(timezone.now().timestamp())
        }
        
        # Topic zusammensetzen
        topic = f"{controller.mqtt_topic_prefix}/command"
        
        # Befehl senden
        success = mqtt_client.publish(topic, json.dumps(mqtt_payload))
        
        # Log erstellen
        ControllerLog.objects.create(
            controller_type="irrigation",
            controller_id=controller.id,
            action_type="manual_irrigation",
            value=mqtt_payload["parameters"],
            mqtt_command=json.dumps(mqtt_payload),
            success_status=success
        )
        
        if success:
            # Volumen zum Gesamtverbrauch addieren (als Decimal)
            controller.total_volume_used += volume_decimal
            controller.save(update_fields=['total_volume_used'])
            
            # Ressourcenverbrauch speichern
            today = timezone.now().date()
            resource_usage, created = ResourceUsage.objects.get_or_create(
                controller_type="irrigation",
                controller_id=controller.id,
                resource_type="water",
                date=today,
                defaults={
                    "amount": volume_decimal,
                    "unit": "l"
                }
            )
            
            if not created:
                # Wenn Eintrag schon existiert, Menge aktualisieren (als Decimal)
                resource_usage.amount += volume_decimal
                resource_usage.save(update_fields=['amount'])
            
            return Response({
                "success": True,
                "message": f"Bewässerung gestartet: {duration} Minuten, {intensity}% Intensität, {volume_float:.2f}l Wasser"
            })
        else:
            return Response(
                {"error": "Fehler beim Senden des MQTT-Befehls"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def emergency_stop(self, request, pk=None):
        """Notfall-Stopp ein- oder ausschalten"""
        controller = self.get_object()
        
        # Status ändern
        new_status = request.data.get('status', not controller.emergency_stop)
        controller.emergency_stop = new_status
        controller.save(update_fields=['emergency_stop'])
        
        # MQTT-Befehl senden
        mqtt_client = MQTTClient()
        mqtt_payload = {
            "action": "emergency_stop",
            "parameters": {
                "status": new_status
            },
            "timestamp": timezone.now().isoformat(),
            "request_id": str(timezone.now().timestamp())
        }
        
        topic = f"{controller.mqtt_topic_prefix}/command"
        success = mqtt_client.publish(topic, json.dumps(mqtt_payload))
        
        # Log erstellen
        ControllerLog.objects.create(
            controller_type="irrigation",
            controller_id=controller.id,
            action_type="emergency_stop",
            value={"status": new_status},
            mqtt_command=json.dumps(mqtt_payload),
            success_status=success
        )
        
        return Response({
            "success": True,
            "message": f"Notfall-Stopp {'aktiviert' if new_status else 'deaktiviert'}",
            "emergency_stop": new_status
        })
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Statistiken für den Bewässerungscontroller"""
        controller = self.get_object()
        
        # Zeitraum aus Parametern holen (Standard: letzte 30 Tage)
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
            if days < 1:
                days = 30
        except (ValueError, TypeError):
            days = 30
        
        end_date = timezone.now().date()
        start_date = end_date - datetime.timedelta(days=days)
        
        # Täglicher Wasserverbrauch
        water_usage = ResourceUsage.objects.filter(
            controller_type="irrigation",
            controller_id=controller.id,
            resource_type="water",
            date__gte=start_date,
            date__lte=end_date
        ).values('date').annotate(
            total=Sum('amount')
        ).order_by('date')
        
        # Formatieren für Chart-Daten
        water_usage_data = [{
            "date": item['date'].strftime('%Y-%m-%d'),
            "value": float(item['total'])
        } for item in water_usage]
        
        # Statistiken berechnen
        total_volume = sum(item['value'] for item in water_usage_data)
        avg_daily_volume = total_volume / days if days > 0 else 0
        
        # Aktive Zeitpläne zählen
        active_schedules = IrrigationSchedule.objects.filter(
            controller=controller,
            is_active=True
        ).count()
        
        # Zyklenzahl im Zeitraum
        cycle_count = ControllerLog.objects.filter(
            controller_type="irrigation",
            controller_id=controller.id,
            action_type__in=["irrigation_cycle", "manual_irrigation"],
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Fehlerhafte Aktionen zählen
        error_count = ControllerLog.objects.filter(
            controller_type="irrigation",
            controller_id=controller.id,
            success_status=False,
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Ergebnisse zurückgeben
        return Response({
            "controller_id": str(controller.id),
            "controller_name": controller.name,
            "date_range": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d'),
                "days": days
            },
            "water_usage": {
                "total": total_volume,
                "average_daily": avg_daily_volume,
                "daily_data": water_usage_data
            },
            "active_schedules": active_schedules,
            "cycle_count": cycle_count,
            "error_count": error_count
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Übersichtsdaten für alle Bewässerungscontroller"""
        # Aktive Controller zählen
        active_count = IrrigationController.objects.filter(
            is_active=True
        ).count()
        
        # Verbundene Controller zählen
        connected_count = IrrigationController.objects.filter(
            is_active=True,
            is_connected=True
        ).count()
        
        # Notfall-Stopp aktive Controller zählen
        emergency_count = IrrigationController.objects.filter(
            is_active=True,
            emergency_stop=True
        ).count()
        
        # Gesamter Wasserverbrauch heute
        today = timezone.now().date()
        total_water_today = ResourceUsage.objects.filter(
            controller_type="irrigation",
            resource_type="water",
            date=today
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Raumstatistiken (Anzahl der Controller pro Raum)
        room_stats = IrrigationController.objects.values(
            'room__id', 'room__name'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        room_stats_data = [{
            "room_id": item['room__id'],
            "room_name": item['room__name'] or "Kein Raum",
            "controller_count": item['count']
        } for item in room_stats]
        
        # Aktuelle Alarme (fehlerhafte Logs der letzten 24 Stunden)
        last_24h = timezone.now() - datetime.timedelta(hours=24)
        recent_alarms = ControllerLog.objects.filter(
            controller_type="irrigation",
            success_status=False,
            timestamp__gte=last_24h
        ).order_by('-timestamp')[:5]
        
        alarm_data = ControllerLogSerializer(recent_alarms, many=True).data
        
        return Response({
            "controller_status": {
                "total": IrrigationController.objects.count(),
                "active": active_count,
                "connected": connected_count,
                "emergency_stopped": emergency_count
            },
            "water_usage": {
                "today": float(total_water_today),
                "unit": "l"
            },
            "room_distribution": room_stats_data,
            "recent_alarms": alarm_data
        })


class IrrigationScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Bewässerungszeitpläne.
    """
    queryset = IrrigationSchedule.objects.all()
    serializer_class = IrrigationScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filtern nach Controller (wenn angegeben)
        controller_id = self.request.query_params.get('controller_id', None)
        if controller_id:
            return IrrigationSchedule.objects.filter(controller__id=controller_id)
        return IrrigationSchedule.objects.all()
    
    def perform_create(self, serializer):
        # Controller aus der URL oder Request-Daten holen
        controller_id = self.request.query_params.get('controller_id') or self.request.data.get('controller_id')
        
        if not controller_id:
            raise serializers.ValidationError({"controller_id": "Controller-ID ist erforderlich"})
        
        controller = IrrigationController.objects.get(id=controller_id)
        serializer.save(controller=controller)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Mehrere Zeitpläne auf einmal erstellen"""
        controller_id = request.data.get('controller_id')
        schedules_data = request.data.get('schedules', [])
        
        if not controller_id:
            return Response(
                {"error": "controller_id ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            controller = IrrigationController.objects.get(id=controller_id)
        except IrrigationController.DoesNotExist:
            return Response(
                {"error": f"Controller mit ID {controller_id} nicht gefunden"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created_schedules = []
        for schedule_data in schedules_data:
            serializer = self.get_serializer(data=schedule_data)
            if serializer.is_valid():
                serializer.save(controller=controller)
                created_schedules.append(serializer.data)
            else:
                # Bei Fehler alles rückgängig machen
                IrrigationSchedule.objects.filter(id__in=[s['id'] for s in created_schedules]).delete()
                return Response(
                    {"error": f"Fehler in Zeitplan-Daten: {serializer.errors}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Erfolgreichen Bulk-Import melden
        return Response({
            "success": True,
            "message": f"{len(created_schedules)} Zeitpläne erfolgreich erstellt",
            "schedules": created_schedules
        })


class LightControllerViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Lichtcontroller mit erweiterten Aktionen.
    """
    queryset = LightController.objects.all().order_by('-created_at')
    serializer_class = LightControllerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def manual_light_control(self, request, pk=None):
        """Manuelle Lichtsteuerung"""
        controller = self.get_object()
        
        # Parameter auslesen
        intensity = request.data.get('intensity', 100)  # Standard: 100%
        duration = request.data.get('duration', 0)  # Dauer in Minuten (0 = unbegrenzt)
        spectrum_red = request.data.get('spectrum_red', 100)  # Standard: 100%
        spectrum_blue = request.data.get('spectrum_blue', 100)  # Standard: 100%
        
        # Validierung
        try:
            intensity = int(intensity)
            duration = int(duration)
            spectrum_red = int(spectrum_red)
            spectrum_blue = int(spectrum_blue)
            
            if intensity < 0 or intensity > 100:
                return Response(
                    {"error": "Intensität muss zwischen 0 und 100% liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if duration < 0 or duration > 1440:  # Max. 24 Stunden
                return Response(
                    {"error": "Dauer muss zwischen 0 und 1440 Minuten liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if spectrum_red < 0 or spectrum_red > 100:
                return Response(
                    {"error": "Rot-Spektrum muss zwischen 0 und 100% liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if spectrum_blue < 0 or spectrum_blue > 100:
                return Response(
                    {"error": "Blau-Spektrum muss zwischen 0 und 100% liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Ungültige Parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Notfall-Aus prüfen
        if controller.emergency_off:
            return Response(
                {"error": "Controller ist im Notfall-Aus-Modus"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # MQTT-Client initialisieren und Befehl senden
        mqtt_client = MQTTClient()
        
        # Befehl vorbereiten
        mqtt_payload = {
            "action": "manual_light_control",
            "parameters": {
                "intensity": intensity,
                "duration": duration,
                "spectrum_red": spectrum_red,
                "spectrum_blue": spectrum_blue
            },
            "timestamp": timezone.now().isoformat(),
            "request_id": str(timezone.now().timestamp())
        }
        
        # Topic zusammensetzen
        topic = f"{controller.mqtt_topic_prefix}/command"
        
        # Befehl senden
        success = mqtt_client.publish(topic, json.dumps(mqtt_payload))
        
        # Log erstellen
        ControllerLog.objects.create(
            controller_type="light",
            controller_id=controller.id,
            action_type="manual_light_control",
            value=mqtt_payload["parameters"],
            mqtt_command=json.dumps(mqtt_payload),
            success_status=success
        )
        
        if success:
            return Response({
                "success": True,
                "message": f"Lichteinstellung angepasst: {intensity}% Intensität, Rot {spectrum_red}%, Blau {spectrum_blue}%"
            })
        else:
            return Response(
                {"error": "Fehler beim Senden des MQTT-Befehls"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def emergency_off(self, request, pk=None):
        """Notfall-Aus ein- oder ausschalten"""
        controller = self.get_object()
        
        # Status ändern
        new_status = request.data.get('status', not controller.emergency_off)
        controller.emergency_off = new_status
        controller.save(update_fields=['emergency_off'])
        
        # MQTT-Befehl senden
        mqtt_client = MQTTClient()
        mqtt_payload = {
            "action": "emergency_off",
            "parameters": {
                "status": new_status
            },
            "timestamp": timezone.now().isoformat(),
            "request_id": str(timezone.now().timestamp())
        }
        
        topic = f"{controller.mqtt_topic_prefix}/command"
        success = mqtt_client.publish(topic, json.dumps(mqtt_payload))
        
        # Log erstellen
        ControllerLog.objects.create(
            controller_type="light",
            controller_id=controller.id,
            action_type="emergency_off",
            value={"status": new_status},
            mqtt_command=json.dumps(mqtt_payload),
            success_status=success
        )
        
        return Response({
            "success": True,
            "message": f"Notfall-Aus {'aktiviert' if new_status else 'deaktiviert'}",
            "emergency_off": new_status
        })
    
    @action(detail=True, methods=['post'])
    def advance_cycle_day(self, request, pk=None):
        """Tag im Zyklus manuell erhöhen"""
        controller = self.get_object()
        
        # Tag erhöhen
        new_day = controller.advance_cycle_day()
        
        # MQTT-Befehl senden
        mqtt_client = MQTTClient()
        mqtt_payload = {
            "action": "advance_cycle_day",
            "parameters": {
                "new_day": new_day
            },
            "timestamp": timezone.now().isoformat(),
            "request_id": str(timezone.now().timestamp())
        }
        
        topic = f"{controller.mqtt_topic_prefix}/command"
        success = mqtt_client.publish(topic, json.dumps(mqtt_payload))
        
        return Response({
            "success": True,
            "message": f"Tag im Zyklus erhöht auf {new_day}",
            "current_day_in_cycle": new_day
        })
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Statistiken für den Lichtcontroller"""
        controller = self.get_object()
        
        # Zeitraum aus Parametern holen (Standard: letzte 30 Tage)
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
            if days < 1:
                days = 30
        except (ValueError, TypeError):
            days = 30
        
        end_date = timezone.now().date()
        start_date = end_date - datetime.timedelta(days=days)
        
        # Stromverbrauch
        energy_usage = ResourceUsage.objects.filter(
            controller_type="light",
            controller_id=controller.id,
            resource_type="electricity",
            date__gte=start_date,
            date__lte=end_date
        ).values('date').annotate(
            total=Sum('amount')
        ).order_by('date')
        
        # Formatieren für Chart-Daten
        energy_usage_data = [{
            "date": item['date'].strftime('%Y-%m-%d'),
            "value": float(item['total'])
        } for item in energy_usage]
        
        # Statistiken berechnen
        total_energy = sum(item['value'] for item in energy_usage_data)
        avg_daily_energy = total_energy / days if days > 0 else 0
        
        # Betriebszeit (Stunden pro Tag mit Licht an)
        light_on_logs = ControllerLog.objects.filter(
            controller_type="light",
            controller_id=controller.id,
            action_type="light_state_change",
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).order_by('timestamp')
        
        # Lichteinschaltdauer berechnen (vereinfacht)
        light_on_hours = {}
        for day in (start_date + datetime.timedelta(days=i) for i in range(days)):
            day_str = day.strftime('%Y-%m-%d')
            light_on_hours[day_str] = controller.calculate_daily_light_hours(day)
        
        light_hours_data = [{
            "date": date,
            "value": hours
        } for date, hours in light_on_hours.items()]
        
        # Ergebnisse zurückgeben
        return Response({
            "controller_id": str(controller.id),
            "controller_name": controller.name,
            "date_range": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d'),
                "days": days
            },
            "energy_usage": {
                "total": total_energy,
                "average_daily": avg_daily_energy,
                "daily_data": energy_usage_data,
                "unit": "kWh"
            },
            "light_hours": {
                "daily_data": light_hours_data,
                    "average_daily": sum(item['value'] for item in light_hours_data) / days if days > 0 else 0
            },
            "current_day_in_cycle": controller.current_day_in_cycle,
            "cycle_start_date": controller.cycle_start_date.strftime('%Y-%m-%d')
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Übersichtsdaten für alle Lichtcontroller"""
        # Aktive Controller zählen
        active_count = LightController.objects.filter(
            is_active=True
        ).count()
        
        # Verbundene Controller zählen
        connected_count = LightController.objects.filter(
            is_active=True,
            is_connected=True
        ).count()
        
        # Notfall-Aus aktive Controller zählen
        emergency_count = LightController.objects.filter(
            is_active=True,
            emergency_off=True
        ).count()
        
        # Gesamter Stromverbrauch heute
        today = timezone.now().date()
        total_energy_today = ResourceUsage.objects.filter(
            controller_type="light",
            resource_type="electricity",
            date=today
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Verteilung nach Lichttyp
        light_type_stats = LightController.objects.values(
            'light_type'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        light_type_data = [{
            "type": item['light_type'],
            "type_display": dict(LightController.LIGHT_TYPE_CHOICES).get(item['light_type'], item['light_type']),
            "count": item['count']
        } for item in light_type_stats]
        
        # Verteilung nach Zyklustyp
        cycle_type_stats = LightController.objects.values(
            'cycle_type'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        cycle_type_data = [{
            "type": item['cycle_type'],
            "type_display": dict(LightController.CYCLE_TYPE_CHOICES).get(item['cycle_type'], item['cycle_type']),
            "count": item['count']
        } for item in cycle_type_stats]
        
        # Aktuelle Alarme (fehlerhafte Logs der letzten 24 Stunden)
        last_24h = timezone.now() - datetime.timedelta(hours=24)
        recent_alarms = ControllerLog.objects.filter(
            controller_type="light",
            success_status=False,
            timestamp__gte=last_24h
        ).order_by('-timestamp')[:5]
        
        alarm_data = ControllerLogSerializer(recent_alarms, many=True).data
        
        return Response({
            "controller_status": {
                "total": LightController.objects.count(),
                "active": active_count,
                "connected": connected_count,
                "emergency_off": emergency_count
            },
            "energy_usage": {
                "today": float(total_energy_today),
                "unit": "kWh"
            },
            "light_type_distribution": light_type_data,
            "cycle_type_distribution": cycle_type_data,
            "recent_alarms": alarm_data
        })


class LightScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Lichtzeitpläne.
    """
    queryset = LightSchedule.objects.all()
    serializer_class = LightScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filtern nach Controller (wenn angegeben)
        controller_id = self.request.query_params.get('controller_id', None)
        if controller_id:
            return LightSchedule.objects.filter(controller__id=controller_id)
        return LightSchedule.objects.all()
    
    def perform_create(self, serializer):
        # Controller aus der URL oder Request-Daten holen
        controller_id = self.request.query_params.get('controller_id') or self.request.data.get('controller_id')
        
        if not controller_id:
            raise serializers.ValidationError({"controller_id": "Controller-ID ist erforderlich"})
        
        controller = LightController.objects.get(id=controller_id)
        serializer.save(controller=controller)
    
    @action(detail=True, methods=['post'])
    def clone_to_day(self, request, pk=None):
        """Zeitplan auf einen anderen Tag kopieren"""
        source_schedule = self.get_object()
        target_day = request.data.get('target_day')
        
        if not target_day:
            return Response(
                {"error": "target_day ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_day = int(target_day)
            if target_day < 1:
                return Response(
                    {"error": "target_day muss größer als 0 sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "target_day muss eine Zahl sein"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prüfen, ob bereits ein Zeitplan für den Zieltag existiert
        existing_schedule = LightSchedule.objects.filter(
            controller=source_schedule.controller,
            day_in_cycle=target_day
        ).first()
        
        if existing_schedule:
            # Wenn gewünscht, vorhandenen Zeitplan überschreiben
            overwrite = request.data.get('overwrite', False)
            if not overwrite:
                return Response(
                    {"error": f"Für Tag {target_day} existiert bereits ein Zeitplan. Zum Überschreiben overwrite=true angeben."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Bestehende Zeitpunkte löschen
            LightSchedulePoint.objects.filter(schedule=existing_schedule).delete()
            target_schedule = existing_schedule
            target_schedule.name = f"{source_schedule.name} (Kopie)"
            target_schedule.save()
        else:
            # Neuen Zeitplan erstellen
            target_schedule = LightSchedule.objects.create(
                controller=source_schedule.controller,
                name=f"{source_schedule.name} (Kopie)",
                day_in_cycle=target_day,
                is_active=source_schedule.is_active
            )
        
        # Zeitpunkte kopieren
        points_copied = 0
        for point in LightSchedulePoint.objects.filter(schedule=source_schedule):
            LightSchedulePoint.objects.create(
                schedule=target_schedule,
                time_point=point.time_point,
                intensity=point.intensity,
                spectrum_red=point.spectrum_red,
                spectrum_blue=point.spectrum_blue,
                transition_duration=point.transition_duration
            )
            points_copied += 1
        
        return Response({
            "success": True,
            "message": f"Zeitplan erfolgreich auf Tag {target_day} kopiert",
            "points_copied": points_copied,
            "target_schedule_id": str(target_schedule.id)
        })


class LightSchedulePointViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Lichtzeitplanpunkte.
    """
    queryset = LightSchedulePoint.objects.all()
    serializer_class = LightSchedulePointSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filtern nach Zeitplan (wenn angegeben)
        schedule_id = self.request.query_params.get('schedule_id', None)
        if schedule_id:
            return LightSchedulePoint.objects.filter(schedule__id=schedule_id).order_by('time_point')
        return LightSchedulePoint.objects.all().order_by('schedule', 'time_point')
    
    def perform_create(self, serializer):
        # Zeitplan aus der URL oder Request-Daten holen
        schedule_id = self.request.query_params.get('schedule_id') or self.request.data.get('schedule_id')
        
        if not schedule_id:
            raise serializers.ValidationError({"schedule_id": "Zeitplan-ID ist erforderlich"})
        
        schedule = LightSchedule.objects.get(id=schedule_id)
        serializer.save(schedule=schedule)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Mehrere Zeitpunkte auf einmal erstellen"""
        schedule_id = request.data.get('schedule_id')
        points_data = request.data.get('points', [])
        
        if not schedule_id:
            return Response(
                {"error": "schedule_id ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            schedule = LightSchedule.objects.get(id=schedule_id)
        except LightSchedule.DoesNotExist:
            return Response(
                {"error": f"Zeitplan mit ID {schedule_id} nicht gefunden"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created_points = []
        for point_data in points_data:
            serializer = self.get_serializer(data=point_data)
            if serializer.is_valid():
                serializer.save(schedule=schedule)
                created_points.append(serializer.data)
            else:
                # Bei Fehler alles rückgängig machen
                LightSchedulePoint.objects.filter(id__in=[p['id'] for p in created_points]).delete()
                return Response(
                    {"error": f"Fehler in Zeitpunkt-Daten: {serializer.errors}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Erfolgreichen Bulk-Import melden
        return Response({
            "success": True,
            "message": f"{len(created_points)} Zeitpunkte erfolgreich erstellt",
            "points": created_points
        })
    
    @action(detail=False, methods=['post'])
    def generate_day_cycle(self, request):
        """Automatisch einen Tageszyklus generieren"""
        schedule_id = request.data.get('schedule_id')
        
        if not schedule_id:
            return Response(
                {"error": "schedule_id ist erforderlich"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            schedule = LightSchedule.objects.get(id=schedule_id)
        except LightSchedule.DoesNotExist:
            return Response(
                {"error": f"Zeitplan mit ID {schedule_id} nicht gefunden"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Parameter
        cycle_type = request.data.get('cycle_type', schedule.controller.cycle_type)
        start_hour = request.data.get('start_hour', 6)  # Standard: 6 Uhr morgens
        transition_duration = request.data.get('transition_duration', 30)  # 30 Min Übergang
        max_intensity = request.data.get('max_intensity', 100)
        
        # Validierung
        try:
            start_hour = int(start_hour)
            if start_hour < 0 or start_hour > 23:
                return Response(
                    {"error": "start_hour muss zwischen 0 und 23 liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            transition_duration = int(transition_duration)
            if transition_duration < 0 or transition_duration > 120:
                return Response(
                    {"error": "transition_duration muss zwischen 0 und 120 liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            max_intensity = int(max_intensity)
            if max_intensity < 1 or max_intensity > 100:
                return Response(
                    {"error": "max_intensity muss zwischen 1 und 100 liegen"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Ungültige Parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Lichtstunden basierend auf Zyklustyp
        if cycle_type == 'veg':
            light_hours = 18
        elif cycle_type == 'flower':
            light_hours = 12
        elif cycle_type == 'seedling':
            light_hours = 20
        elif cycle_type == 'clone':
            light_hours = 24
        elif cycle_type == 'custom':
            light_hours = request.data.get('light_hours', 16)
            try:
                light_hours = int(light_hours)
                if light_hours < 1 or light_hours > 24:
                    return Response(
                        {"error": "light_hours muss zwischen 1 und 24 liegen"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "light_hours muss eine Zahl sein"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:  # 'auto' oder Fallback
            light_hours = 16
        
        # Alle bisherigen Zeitpunkte löschen
        LightSchedulePoint.objects.filter(schedule=schedule).delete()
        
        # Zeitpunkte generieren
        points = []
        
        # Sonnenaufgang (Start)
        sunrise = datetime.time(start_hour, 0)
        points.append(
            LightSchedulePoint.objects.create(
                schedule=schedule,
                time_point=sunrise,
                intensity=0,  # Beginnt bei 0
                spectrum_red=80,
                spectrum_blue=60,
                transition_duration=transition_duration
            )
        )
        
        # Volle Helligkeit (nach Übergangszeit)
        full_brightness_time = (
            datetime.datetime.combine(datetime.date.today(), sunrise) + 
            datetime.timedelta(minutes=transition_duration)
        ).time()
        
        points.append(
            LightSchedulePoint.objects.create(
                schedule=schedule,
                time_point=full_brightness_time,
                intensity=max_intensity,
                spectrum_red=100,
                spectrum_blue=100,
                transition_duration=0
            )
        )
        
        # Sonnenuntergang (Beginn)
        sunset_start_dt = (
            datetime.datetime.combine(datetime.date.today(), sunrise) + 
            datetime.timedelta(hours=light_hours - (transition_duration / 60))
        )
        sunset_start = sunset_start_dt.time()
        
        points.append(
            LightSchedulePoint.objects.create(
                schedule=schedule,
                time_point=sunset_start,
                intensity=max_intensity,  # Noch volle Helligkeit
                spectrum_red=100,
                spectrum_blue=70,
                transition_duration=transition_duration
            )
        )
        
        # Komplett dunkel (nach Sonnenuntergang)
        darkness_dt = sunset_start_dt + datetime.timedelta(minutes=transition_duration)
        darkness = darkness_dt.time()
        
        points.append(
            LightSchedulePoint.objects.create(
                schedule=schedule,
                time_point=darkness,
                intensity=0,  # Dunkel
                spectrum_red=0,
                spectrum_blue=0,
                transition_duration=0
            )
        )
        
        return Response({
            "success": True,
            "message": f"Tageszyklus erfolgreich generiert: {light_hours} Stunden Licht",
            "points": LightSchedulePointSerializer(points, many=True).data
        })


class ControllerLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für Controller-Logs (nur Lesen).
    """
    queryset = ControllerLog.objects.all().order_by('-timestamp')
    serializer_class = ControllerLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ControllerLog.objects.all().order_by('-timestamp')
        
        # Filtern nach Controller-Typ
        controller_type = self.request.query_params.get('controller_type', None)
        if controller_type:
            queryset = queryset.filter(controller_type=controller_type)
        
        # Filtern nach Controller-ID
        controller_id = self.request.query_params.get('controller_id', None)
        if controller_id:
            queryset = queryset.filter(controller_id=controller_id)
        
        # Filtern nach Aktionstyp
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filtern nach Erfolg/Fehler
        success = self.request.query_params.get('success', None)
        if success is not None:
            success_bool = success.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(success_status=success_bool)
        
        # Zeitraum-Filter
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Zusammenfassung der Logs"""
        # Filtern nach Controller-Typ und -ID (falls angegeben)
        controller_type = request.query_params.get('controller_type', None)
        controller_id = request.query_params.get('controller_id', None)
        
        queryset = ControllerLog.objects.all()
        if controller_type:
            queryset = queryset.filter(controller_type=controller_type)
        if controller_id:
            queryset = queryset.filter(controller_id=controller_id)
        
        # Zeitraum (Standard: letzte 7 Tage)
        days = request.query_params.get('days', 7)
        try:
            days = int(days)
            if days < 1:
                days = 7
        except (ValueError, TypeError):
            days = 7
        
        start_date = timezone.now() - datetime.timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=start_date)
        
        # Gesamtzahl der Logs
        total_count = queryset.count()
        
        # Erfolgs- und Fehlerrate
        success_count = queryset.filter(success_status=True).count()
        error_count = queryset.filter(success_status=False).count()
        
        # Aktionstypen
        action_types = queryset.values('action_type').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        action_type_data = [{
            "action_type": item['action_type'],
            "count": item['count'],
            "percent": round(item['count'] * 100 / total_count, 1) if total_count > 0 else 0
        } for item in action_types]
        
        # Logs pro Tag
        logs_per_day = queryset.annotate(
            day=TruncDate('timestamp')
        ).values('day').annotate(
            count=models.Count('id')
        ).order_by('day')
        
        logs_per_day_data = [{
            "date": item['day'].strftime('%Y-%m-%d'),
            "count": item['count']
        } for item in logs_per_day]
        
        return Response({
            "date_range": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": timezone.now().strftime('%Y-%m-%d'),
                "days": days
            },
            "total_count": total_count,
            "success_rate": {
                "success_count": success_count,
                "error_count": error_count,
                "success_percent": round(success_count * 100 / total_count, 1) if total_count > 0 else 0
            },
            "action_types": action_type_data,
            "logs_per_day": logs_per_day_data
        })


class ResourceUsageViewSet(viewsets.ModelViewSet):
    """
    ViewSet für Ressourcenverbrauch.
    """
    queryset = ResourceUsage.objects.all().order_by('-date')
    serializer_class = ResourceUsageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ResourceUsage.objects.all().order_by('-date')
        
        # Filtern nach Controller-Typ
        controller_type = self.request.query_params.get('controller_type', None)
        if controller_type:
            queryset = queryset.filter(controller_type=controller_type)
        
        # Filtern nach Controller-ID
        controller_id = self.request.query_params.get('controller_id', None)
        if controller_id:
            queryset = queryset.filter(controller_id=controller_id)
        
        # Filtern nach Ressourcentyp
        resource_type = self.request.query_params.get('resource_type', None)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Zeitraum-Filter
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Zusammenfassung des Ressourcenverbrauchs"""
        # Filtern nach Controller-Typ und -ID (falls angegeben)
        controller_type = request.query_params.get('controller_type', None)
        controller_id = request.query_params.get('controller_id', None)
        
        queryset = ResourceUsage.objects.all()
        if controller_type:
            queryset = queryset.filter(controller_type=controller_type)
        if controller_id:
            queryset = queryset.filter(controller_id=controller_id)
        
        # Zeitraum (Standard: letzte 30 Tage)
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
            if days < 1:
                days = 30
        except (ValueError, TypeError):
            days = 30
        
        end_date = timezone.now().date()
        start_date = end_date - datetime.timedelta(days=days)
        queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
        
        # Gesamtverbrauch nach Ressourcentyp
        resource_totals = queryset.values(
            'resource_type', 'unit'
        ).annotate(
            total=Sum('amount')
        ).order_by('resource_type')
        
        # Kosten nach Ressourcentyp (wo verfügbar)
        cost_totals = queryset.filter(
            cost__isnull=False
        ).values(
            'resource_type'
        ).annotate(
            total_cost=Sum('cost')
        ).order_by('resource_type')
        
        # Täglicher Verbrauch für jede Ressource
        daily_usage = {}
        
        for resource in ['water', 'electricity', 'nutrient', 'co2', 'other']:
            resource_usage = queryset.filter(
                resource_type=resource
            ).values('date').annotate(
                total=Sum('amount')
            ).order_by('date')
            
            daily_usage[resource] = [{
                "date": item['date'].strftime('%Y-%m-%d'),
                "value": float(item['total'])
            } for item in resource_usage]
        
        # Durchschnittlicher Tagesverbrauch
        avg_daily = queryset.values(
            'resource_type'
        ).annotate(
            avg_amount=Avg('amount')
        ).order_by('resource_type')
        
        avg_daily_data = [{
            "resource_type": item['resource_type'],
            "resource_type_display": dict(ResourceUsage._meta.get_field('resource_type').choices).get(
                item['resource_type'], item['resource_type']
            ),
            "avg_daily_amount": float(item['avg_amount'])
        } for item in avg_daily]
        
        return Response({
            "date_range": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d'),
                "days": days
            },
            "resource_totals": [{
                "resource_type": item['resource_type'],
                "resource_type_display": dict(ResourceUsage._meta.get_field('resource_type').choices).get(
                    item['resource_type'], item['resource_type']
                ),
                "total": float(item['total']),
                "unit": item['unit']
            } for item in resource_totals],
            "cost_totals": [{
                "resource_type": item['resource_type'],
                "resource_type_display": dict(ResourceUsage._meta.get_field('resource_type').choices).get(
                    item['resource_type'], item['resource_type']
                ),
                "total_cost": float(item['total_cost'])
            } for item in cost_totals],
            "daily_usage": daily_usage,
            "avg_daily_usage": avg_daily_data
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Mehrere Ressourcenverbrauchseinträge auf einmal erstellen"""
        entries_data = request.data.get('entries', [])
        
        if not entries_data:
            return Response(
                {"error": "Keine Einträge gefunden"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_entries = []
        for entry_data in entries_data:
            serializer = self.get_serializer(data=entry_data)
            if serializer.is_valid():
                serializer.save()
                created_entries.append(serializer.data)
            else:
                # Bei Fehler alles rückgängig machen
                ResourceUsage.objects.filter(id__in=[e['id'] for e in created_entries]).delete()
                return Response(
                    {"error": f"Fehler in Eintragsdaten: {serializer.errors}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Erfolgreichen Bulk-Import melden
        return Response({
            "success": True,
            "message": f"{len(created_entries)} Einträge erfolgreich erstellt",
            "entries": created_entries
        })