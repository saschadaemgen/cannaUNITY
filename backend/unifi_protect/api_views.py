# unifi_protect/api_views.py

from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import ProtectSensor, ProtectSensorHistory
from .serializers import ProtectSensorSerializer, ProtectSensorHistorySerializer
from rest_framework import viewsets, permissions, status
from django.db.models import Q


class ProtectSensorViewSet(viewsets.ModelViewSet):
    """
    ViewSet für UniFi Protect Sensoren.
    Bietet alle CRUD-Operationen für Sensoren und einen speziellen Endpunkt für Verlaufsdaten.
    """
    queryset = ProtectSensor.objects.all().order_by('-last_seen')
    serializer_class = ProtectSensorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Überschriebene get_queryset-Methode, um sicherzustellen,
        dass immer die neuesten Daten abgerufen werden.
        """
        # Stellt sicher, dass keine Daten aus dem Cache verwendet werden
        return ProtectSensor.objects.all().order_by('-last_seen')

    def list(self, request, *args, **kwargs):
        """
        Überschriebene list-Methode, um Cache-Control-Header hinzuzufügen 
        und sicherzustellen, dass aktuelle Daten zurückgegeben werden.
        """
        response = super().list(request, *args, **kwargs)
        
        # Cache-Control-Header hinzufügen
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        
        # Debug-Info hinzufügen
        queryset = self.filter_queryset(self.get_queryset())
        if queryset:
            latest = queryset.first()
            response["X-Latest-Update"] = latest.last_seen.isoformat() if latest else "None"
        
        return response

    def retrieve(self, request, *args, **kwargs):
        """
        Überschriebene retrieve-Methode, um Cache-Control-Header hinzuzufügen.
        """
        response = super().retrieve(request, *args, **kwargs)
        
        # Cache-Control-Header hinzufügen
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        
        return response

    def create(self, request, *args, **kwargs):
        """
        Überschriebene create-Methode, um bestehende Sensoren zu aktualisieren
        und gleichzeitig einen Historieneintrag zu erstellen.
        """
        data = request.data
        sensor_name = data.get("name")
        if not sensor_name:
            return Response({"error": "Name erforderlich"}, status=status.HTTP_400_BAD_REQUEST)

        # Aktueller Zeitstempel
        current_time = timezone.now()
        data['last_seen'] = current_time.isoformat()

        # 1. Hauptsensor aktualisieren/erstellen
        existing = ProtectSensor.objects.filter(name=sensor_name).first()
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
        else:
            serializer = self.get_serializer(data=data)

        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # 2. Historieneintrag erstellen
        try:
            # Prüfen, ob für diesen Sensor und Zeitstempel bereits ein Eintrag existiert
            # (mit 1-Minuten-Toleranz, um doppelte Einträge bei schnellen Updates zu vermeiden)
            min_time = current_time - timedelta(minutes=1)
            max_time = current_time + timedelta(minutes=1)
            
            existing_history = ProtectSensorHistory.objects.filter(
                sensor_name=sensor_name,
                timestamp__gte=min_time,
                timestamp__lte=max_time
            ).first()
            
            if not existing_history:
                # Neuen Historieneintrag erstellen
                history_entry = ProtectSensorHistory.objects.create(
                    sensor_name=sensor_name,
                    timestamp=current_time,
                    temperature=data.get("temperature"),
                    humidity=data.get("humidity"),
                    source="api"
                )
                print(f"Historieneintrag erstellt: {history_entry}")
            else:
                print(f"Historieneintrag existiert bereits für {sensor_name} um {current_time}")
        except Exception as e:
            print(f"Fehler beim Erstellen des Historieneintrags: {e}")
        
        # 3. Erfolgsantwort mit Cache-Control-Headern
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """
        Endpunkt für Verlaufsdaten mit umfassender Debug-Ausgabe und verbesserter Logik.
        Gibt historische Daten für einen bestimmten Sensor zurück.
        """
        print("\n===== HISTORY API-AUFRUF =====")
        print(f"History-Endpunkt aufgerufen für Sensor-ID: {pk}")
        
        try:
            sensor = ProtectSensor.objects.get(pk=pk)
            print(f"Sensor gefunden: {sensor.name} (Typ: {sensor.sensor_type})")
        except ProtectSensor.DoesNotExist:
            print(f"Sensor mit ID {pk} nicht gefunden!")
            return Response({"error": "Sensor nicht gefunden"}, status=status.HTTP_404_NOT_FOUND)

        days = request.GET.get("days")
        start = request.GET.get("start")
        end = request.GET.get("end")
        print(f"Anfrageparameter: days={days}, start={start}, end={end}")

        # Prüfen, ob Historieneinträge für diesen Sensor existieren
        history_count = ProtectSensorHistory.objects.filter(sensor_name=sensor.name).count()
        print(f"Anzahl Historieneinträge für '{sensor.name}': {history_count}")

        now = timezone.now()
        queryset = None
        
        # WICHTIG: Die Abfrage erfolgt nun aus dem ProtectSensorHistory-Modell
        if days:
            try:
                days = int(days)
                since = now - timedelta(days=days)
                print(f"Zeitfilter: Letzte {days} Tage (seit {since.isoformat()})")
                
                queryset = ProtectSensorHistory.objects.filter(
                    sensor_name=sensor.name,
                    timestamp__gte=since
                ).order_by('timestamp')
                
                print(f"Abfrageergebnis: {queryset.count()} Einträge")
            except ValueError:
                print(f"Fehler: Ungültiger days-Wert: {days}")
                return Response({"error": "Ungültiger days-Wert"}, status=status.HTTP_400_BAD_REQUEST)
        elif start and end:
            try:
                # Standardisierte ISO-Format-Behandlung
                start_dt = timezone.datetime.fromisoformat(start.replace('Z', '+00:00'))
                end_dt = timezone.datetime.fromisoformat(end.replace('Z', '+00:00'))
                print(f"Zeitfilter: Von {start_dt.isoformat()} bis {end_dt.isoformat()}")
                
                queryset = ProtectSensorHistory.objects.filter(
                    sensor_name=sensor.name,
                    timestamp__range=(start_dt, end_dt)
                ).order_by('timestamp')
                
                print(f"Abfrageergebnis: {queryset.count()} Einträge")
            except Exception as e:
                print(f"Fehler bei der Zeitumwandlung: {e}")
                return Response({"error": f"Ungültiges Start/End Format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Standard: Letzte 24 Stunden
            since = now - timedelta(days=1)
            print(f"Zeitfilter: Standard (letzte 24 Stunden, seit {since.isoformat()})")
            
            queryset = ProtectSensorHistory.objects.filter(
                sensor_name=sensor.name,
                timestamp__gte=since
            ).order_by('timestamp')
            
            print(f"Abfrageergebnis: {queryset.count()} Einträge")

        # Falls keine Historieneinträge gefunden wurden, fügen wir den aktuellen Sensor als Fallback hinzu
        if not queryset.exists():
            print("KEINE HISTORIENEINTRÄGE gefunden!")
            print("Als Fallback den aktuellen Sensor als einzigen Datenpunkt verwenden...")
            
            # Den aktuellen Sensorwert als Historiendatenpunkt zurückgeben
            history_data = [{
                "timestamp": sensor.last_seen.isoformat(),
                "temperature": sensor.temperature,
                "humidity": sensor.humidity
            }]
        else:
            # Daten für das Diagramm aufbereiten
            history_data = []
            for entry in queryset:
                point = {
                    "timestamp": entry.timestamp.isoformat(),
                    "temperature": entry.temperature,
                    "humidity": entry.humidity
                }
                history_data.append(point)
            
        print(f"Sende {len(history_data)} Datenpunkte zurück")
        
        if history_data:
            print(f"Erster Datenpunkt: {history_data[0]['timestamp']}")
            print(f"Letzter Datenpunkt: {history_data[-1]['timestamp']}")
        
        print("============================\n")

        # Antwort mit Cache-Control-Headern
        response = Response(history_data)
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        
        return response


class ProtectSensorHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet für Sensorhistorie.
    Erlaubt nur Lesezugriff auf die historischen Daten.
    """
    queryset = ProtectSensorHistory.objects.all().order_by('-timestamp')
    serializer_class = ProtectSensorHistorySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """
        Ermöglicht Filterung nach Sensorname und Zeiträumen.
        """
        queryset = ProtectSensorHistory.objects.all().order_by('-timestamp')
        
        # Filterung nach Sensorname
        sensor_name = self.request.query_params.get('sensor_name')
        if sensor_name:
            queryset = queryset.filter(sensor_name=sensor_name)
            
        # Filterung nach Zeitraum
        days = self.request.query_params.get('days')
        if days:
            try:
                days = int(days)
                since = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(timestamp__gte=since)
            except ValueError:
                pass
                
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        Überschriebene list-Methode mit Cache-Control-Headern.
        """
        response = super().list(request, *args, **kwargs)
        
        # Cache-Control-Header hinzufügen
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        
        return response