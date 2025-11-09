# backend/controller/api_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from rooms.models import Room
from .models import (
    ControlUnit, ControlSchedule, ControlParameter,
    ControlStatus, ControlCommand, PLCConfiguration
)
from .serializers import (
    ControlUnitSerializer, ControlUnitDetailSerializer,
    ControlScheduleSerializer, ControlParameterSerializer,
    ControlStatusSerializer, ControlCommandSerializer,
    RoomControlOverviewSerializer, SendCommandSerializer,
    PLCConfigSerializer, LEDControlSerializer
)
from .plc_interface import get_plc_interface


class ControlUnitViewSet(viewsets.ModelViewSet):
    """ViewSet für Steuerungseinheiten"""
    queryset = ControlUnit.objects.all().select_related('room').prefetch_related(
        'parameters', 'schedules', 'current_status'
    )
    serializer_class = ControlUnitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ControlUnitDetailSerializer
        return ControlUnitSerializer
    
    def perform_create(self, serializer):
        """Bei Erstellung den aktuellen Benutzer setzen"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_led(self, request, pk=None):
        """LED Start/Stopp umschalten"""
        control_unit = self.get_object()
        serializer = LEDControlSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            
            # Command erstellen
            command = ControlCommand.objects.create(
                control_unit=control_unit,
                command_type='set_led',
                payload={'status': new_status}
            )
            
            # An SPS senden
            try:
                plc = get_plc_interface(control_unit)
                success = plc.set_led_status(new_status)
                
                if success:
                    # Status aktualisieren oder erstellen
                    status_obj, created = ControlStatus.objects.get_or_create(
                        control_unit=control_unit,
                        defaults={
                            'led_status': new_status,
                            'output_q0_status': new_status,
                            'is_online': True
                        }
                    )
                    
                    if not created:
                        status_obj.led_status = new_status
                        status_obj.output_q0_status = new_status  # Q0 ist mit LED verknüpft
                        status_obj.is_online = True
                        status_obj.save()
                    
                    command.status = 'confirmed'
                    command.confirmed_at = timezone.now()
                    
                    # Control Unit neu laden für aktuelle Daten
                    control_unit.refresh_from_db()
                    
                    # Vollständige Unit-Daten zurückgeben
                    unit_data = ControlUnitSerializer(control_unit).data
                    
                else:
                    command.status = 'failed'
                    command.error_message = 'SPS hat den Befehl nicht akzeptiert'
                
                command.save()
                
                return Response({
                    'success': success,
                    'led_status': new_status,
                    'command_id': str(command.id),
                    'unit': unit_data  # Vollständige Unit-Daten inkl. current_status
                }, status=status.HTTP_200_OK if success else status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                command.status = 'failed'
                command.error_message = str(e)
                command.save()
                
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def save_to_plc(self, request, pk=None):
        """Speichert die aktuelle Konfiguration in der SPS"""
        control_unit = self.get_object()
        
        # Prüfung ob alle notwendigen Daten vorhanden sind
        if not control_unit.plc_address:
            return Response({
                'error': 'Keine SPS-Adresse konfiguriert'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Konfigurationsdaten sammeln
        config_data = {
            'unit_id': str(control_unit.id),
            'unit_type': control_unit.unit_type,
            'name': control_unit.name,
            'parameters': {}
        }
        
        # Parameter hinzufügen
        for param in control_unit.parameters.all():
            config_data['parameters'][param.key] = param.get_typed_value()
        
        # Command erstellen
        command = ControlCommand.objects.create(
            control_unit=control_unit,
            command_type='save_config',
            payload=config_data
        )
        
        try:
            plc = get_plc_interface(control_unit)
            
            # Zuerst authentifizieren
            plc.ensure_authenticated()
            
            # Konfiguration speichern
            success = plc.send_command(command)
            
            if success:
                control_unit.last_sync = timezone.now()
                control_unit.save(update_fields=['last_sync'])
                
                return Response({
                    'success': True,
                    'message': 'Konfiguration erfolgreich in SPS gespeichert',
                    'last_sync': control_unit.last_sync
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Fehler beim Speichern in der SPS'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            command.status = 'failed'
            command.error_message = str(e)
            command.save()
            
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def sync_status(self, request, pk=None):
        """Synchronisiert den Status mit der SPS"""
        control_unit = self.get_object()
        
        try:
            plc = get_plc_interface(control_unit)
            plc.ensure_authenticated()
            
            # LED/Output Status lesen
            output_status = plc.get_output_q0_status()
            
            # Status aktualisieren
            status_obj, created = ControlStatus.objects.get_or_create(
                control_unit=control_unit
            )
            
            if output_status is not None:
                status_obj.led_status = output_status
                status_obj.output_q0_status = output_status
                status_obj.is_online = True
                status_obj.error_message = None
            else:
                status_obj.is_online = False
                status_obj.error_message = 'Keine Antwort von SPS'
            
            status_obj.save()
            
            return Response(ControlStatusSerializer(status_obj).data)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def send_to_plc(self, request, pk=None):
        """Sendet die aktuelle Konfiguration an die SPS"""
        control_unit = self.get_object()
        serializer = SendCommandSerializer(data=request.data)
        
        if serializer.is_valid():
            command_type = serializer.validated_data['command_type']
            parameters = serializer.validated_data['parameters']
            force = serializer.validated_data['force']
            
            # Prüfung ob Unit online ist
            if not force and control_unit.status != 'active':
                return Response(
                    {'error': 'Steuerungseinheit ist nicht aktiv'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Command erstellen
            command = ControlCommand.objects.create(
                control_unit=control_unit,
                command_type=command_type,
                payload={
                    'unit_config': ControlUnitSerializer(control_unit).data,
                    'parameters': parameters
                }
            )
            
            # An SPS senden
            try:
                plc = get_plc_interface(control_unit)
                result = plc.send_command(command)
                
                command.status = 'sent' if result else 'failed'
                command.sent_at = timezone.now()
                command.save()
                
                return Response(
                    ControlCommandSerializer(command).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                command.status = 'failed'
                command.error_message = str(e)
                command.save()
                
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Gibt den aktuellen Status zurück"""
        control_unit = self.get_object()
        
        if hasattr(control_unit, 'current_status'):
            return Response(ControlStatusSerializer(control_unit.current_status).data)
        
        return Response(
            {'error': 'Kein Status verfügbar'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def by_room(self, request):
        """Gruppiert Steuerungseinheiten nach Raum"""
        room_id = request.query_params.get('room_id')
        
        if room_id:
            rooms = Room.objects.filter(id=room_id)
        else:
            rooms = Room.objects.all()
        
        serializer = RoomControlOverviewSerializer(rooms, many=True)
        return Response(serializer.data)


class ControlScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet für Zeitpläne"""
    queryset = ControlSchedule.objects.all().select_related('control_unit')
    serializer_class = ControlScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Aktualisiert mehrere Zeitpläne gleichzeitig"""
        control_unit_id = request.data.get('control_unit_id')
        schedules_data = request.data.get('schedules', [])
        
        if not control_unit_id:
            return Response(
                {'error': 'control_unit_id erforderlich'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            control_unit = ControlUnit.objects.get(id=control_unit_id)
        except ControlUnit.DoesNotExist:
            return Response(
                {'error': 'Steuerungseinheit nicht gefunden'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            # Alte Zeitpläne löschen
            control_unit.schedules.all().delete()
            
            # Neue erstellen
            created_schedules = []
            for schedule_data in schedules_data:
                schedule_data['control_unit'] = control_unit.id
                serializer = ControlScheduleSerializer(data=schedule_data)
                
                if serializer.is_valid():
                    schedule = serializer.save()
                    created_schedules.append(schedule)
                else:
                    transaction.set_rollback(True)
                    return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            return Response(
                ControlScheduleSerializer(created_schedules, many=True).data,
                status=status.HTTP_201_CREATED
            )


class ControlParameterViewSet(viewsets.ModelViewSet):
    """ViewSet für Parameter"""
    queryset = ControlParameter.objects.all().select_related('control_unit')
    serializer_class = ControlParameterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        return queryset


class ControlStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Status (nur lesen)"""
    queryset = ControlStatus.objects.all().select_related('control_unit')
    serializer_class = ControlStatusSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Gibt eine Übersicht aller Status zurück"""
        room_id = request.query_params.get('room_id')
        unit_type = request.query_params.get('unit_type')
        
        queryset = self.get_queryset()
        
        if room_id:
            queryset = queryset.filter(control_unit__room_id=room_id)
        
        if unit_type:
            queryset = queryset.filter(control_unit__unit_type=unit_type)
        
        # Gruppierung nach Status
        overview = {
            'total': queryset.count(),
            'online': queryset.filter(is_online=True).count(),
            'offline': queryset.filter(is_online=False).count(),
            'errors': queryset.exclude(error_message__isnull=True).exclude(error_message='').count(),
            'led_on': queryset.filter(led_status=True).count(),
            'led_off': queryset.filter(led_status=False).count(),
        }
        
        return Response(overview)


class ControlCommandViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Befehle (nur lesen)"""
    queryset = ControlCommand.objects.all().select_related('control_unit')
    serializer_class = ControlCommandSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        control_unit_id = self.request.query_params.get('control_unit')
        status_filter = self.request.query_params.get('status')
        
        if control_unit_id:
            queryset = queryset.filter(control_unit_id=control_unit_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class PLCConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet für globale PLC-Konfiguration"""
    queryset = PLCConfiguration.objects.all()
    serializer_class = PLCConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Gibt immer die Singleton-Instanz zurück"""
        return PLCConfiguration.get_config()