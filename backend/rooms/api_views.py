# backend/rooms/api_views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Room, RoomItemType, RoomItem, Sensor
from .serializers import (RoomSerializer, RoomDetailSerializer, 
                         RoomItemTypeSerializer, RoomItemSerializer, 
                         SensorSerializer)
from unifi_protect.models import ProtectSensorHistory
from unifi_protect.serializers import ProtectSensorSerializer 
from django.utils import timezone
from datetime import timedelta

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    # Keine Berechtigungsprüfung für jetzt
    authentication_classes = []
    permission_classes = []
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoomDetailSerializer
        return RoomSerializer
    
    def create(self, request, *args, **kwargs):
        # Prüfe Device-Zuordnung
        device_id = request.data.get('unifi_device_id')
        if device_id:
            existing_room = Room.objects.filter(unifi_device_id=device_id).first()
            if existing_room:
                return Response({
                    'error': f'Device ist bereits Raum "{existing_room.name}" zugeordnet!',
                    'existing_room': {
                        'id': existing_room.id,
                        'name': existing_room.name
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        device_id = request.data.get('unifi_device_id')
        
        if device_id and device_id != instance.unifi_device_id:
            existing_room = Room.objects.filter(
                unifi_device_id=device_id
            ).exclude(id=instance.id).first()
            
            if existing_room:
                return Response({
                    'error': f'Device ist bereits Raum "{existing_room.name}" zugeordnet!',
                    'existing_room': {
                        'id': existing_room.id,
                        'name': existing_room.name
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def sensor_data(self, request, pk=None):
        """Endpoint für Sensordaten eines Raums mit Historie"""
        room = self.get_object()
        sensors_data = []
        
        # Zeitbereich aus Query-Parametern
        days = request.GET.get('days', '1')  # Default 1 Tag
        
        # Standard: letzte X Tage
        now = timezone.now()
        try:
            days = int(days)
            since = now - timedelta(days=days)
        except ValueError:
            return Response({'error': 'Ungültiger days-Wert'}, 
                        status=status.HTTP_400_BAD_REQUEST)
        
        # Debug-Ausgabe
        print(f"\n=== SENSOR DATA für Raum {room.name} ===")
        print(f"Raum ID: {room.id}")
        print(f"Anzahl Sensoren im Raum: {room.protect_sensors.count()}")
        print(f"Zeitbereich: {days} Tage (seit {since})")
        
        # Für jeden Sensor im Raum
        for sensor in room.protect_sensors.all():
            print(f"\n--- Verarbeite Sensor: {sensor.name} (ID: {sensor.id})")
            
            # Historie aus ProtectSensorHistory abrufen
            # WICHTIG: Filtere nach sensor_name, nicht sensor.id!
            history_query = ProtectSensorHistory.objects.filter(
                sensor_name=sensor.name,  # Verwende den Namen!
                timestamp__gte=since
            ).order_by('timestamp')
            
            print(f"SQL Query: ProtectSensorHistory WHERE sensor_name='{sensor.name}' AND timestamp >= '{since}'")
            print(f"Anzahl gefundene Historieneinträge: {history_query.count()}")
            
            # Erste paar Einträge zum Debuggen
            if history_query.exists():
                first_entries = history_query[:3]
                for entry in first_entries:
                    print(f"  - {entry.timestamp}: {entry.temperature}°C / {entry.humidity}%")
            
            # Historie formatieren
            history_data = []
            for entry in history_query[:500]:  # Limit auf 500 Einträge
                history_data.append({
                    'timestamp': entry.timestamp.isoformat(),
                    'temperature': entry.temperature,
                    'humidity': entry.humidity
                })
            
            # Falls keine Historie vorhanden, aktuellen Wert als Fallback
            if not history_data:
                print(f"WARNUNG: Keine Historie gefunden für {sensor.name}, verwende aktuellen Wert")
                if sensor.temperature is not None:
                    history_data.append({
                        'timestamp': sensor.last_seen.isoformat() if sensor.last_seen else now.isoformat(),
                        'temperature': sensor.temperature,
                        'humidity': sensor.humidity
                    })
            
            # Sensordaten mit Historie hinzufügen
            sensor_data = {
                'sensor': {
                    'id': sensor.id,
                    'name': sensor.name,
                    'sensor_type': sensor.sensor_type,
                    'temperature': sensor.temperature,
                    'humidity': sensor.humidity,
                    'last_seen': sensor.last_seen.isoformat() if sensor.last_seen else None,
                    'status': 'Online' if sensor.last_seen and (now - sensor.last_seen).total_seconds() <= 600 else 'Offline'
                },
                'history': history_data
            }
            
            sensors_data.append(sensor_data)
            print(f"Sensor {sensor.name}: {len(history_data)} Datenpunkte hinzugefügt")
        
        print(f"\nGesamtergebnis: {len(sensors_data)} Sensoren mit Daten")
        print("====================================\n")
        
        return Response(sensors_data)  

class RoomItemTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomItemType.objects.all()
    serializer_class = RoomItemTypeSerializer
    authentication_classes = []
    permission_classes = []

class RoomItemViewSet(viewsets.ModelViewSet):
    queryset = RoomItem.objects.all()
    serializer_class = RoomItemSerializer
    authentication_classes = []
    permission_classes = []
    
    def get_queryset(self):
        queryset = RoomItem.objects.all()
        room_id = self.request.query_params.get('room', None)
        if room_id is not None:
            queryset = queryset.filter(room__id=room_id)
        return queryset

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    authentication_classes = []
    permission_classes = []
    
    def get_queryset(self):
        queryset = Sensor.objects.all()
        room_item_id = self.request.query_params.get('room_item', None)
        if room_item_id is not None:
            queryset = queryset.filter(room_item__id=room_item_id)
        return queryset