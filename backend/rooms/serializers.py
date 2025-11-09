# backend/rooms/serializers.py

from rest_framework import serializers
from .models import Room, RoomItemType, RoomItem, Sensor
from unifi_api_debug.services import UnifiAccessService
# NEU: Imports für Protect Sensoren
from unifi_protect.models import ProtectSensor
from unifi_protect.serializers import ProtectSensorSerializer

class RoomSerializer(serializers.ModelSerializer):
    volume = serializers.ReadOnlyField()
    room_type_display = serializers.SerializerMethodField()
    unifi_device_info = serializers.SerializerMethodField()
    # NEU: Protect Sensor Felder
    protect_sensors = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ProtectSensor.objects.all(),
        required=False
    )
    protect_sensors_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'description', 'capacity', 'is_active', 
            'room_type', 'room_type_display', 'pflanzenanzahl',
            'length', 'width', 'height', 'grid_size', 'volume',
            'unifi_device_id', 'unifi_device_info',
            'protect_sensors', 'protect_sensors_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_room_type_display(self, obj):
        return obj.get_room_type_display()
    
    def get_unifi_device_info(self, obj):
        if not obj.unifi_device_id:
            return None
            
        try:
            service = UnifiAccessService()
            devices = service.get_devices()
            
            for device in devices:
                if device.get("id") == obj.unifi_device_id:
                    return {
                        "name": device.get("name"),
                        "alias": device.get("alias"),
                        "type": device.get("type")
                    }
        except Exception as e:
            print(f"Fehler beim Abrufen der Device-Info: {e}")
            
        return None
    
    # NEU: Methode für Protect Sensor Info
    def get_protect_sensors_info(self, obj):
        """Gibt detaillierte Infos zu den zugeordneten Sensoren"""
        try:
            return ProtectSensorSerializer(obj.protect_sensors.all(), many=True).data
        except:
            return []

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = ['id', 'sensor_type', 'data_source', 'last_reading', 'last_updated', 'properties']

class RoomItemTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomItemType
        fields = ['id', 'name', 'category', 'icon', 'default_width', 'default_height', 'allowed_quantities']

class RoomItemSerializer(serializers.ModelSerializer):
    sensors = SensorSerializer(many=True, read_only=True)
    
    class Meta:
        model = RoomItem
        fields = ['id', 'room', 'item_type', 'x_position', 'y_position', 
                 'width', 'height', 'rotation', 'plant_quantity', 
                 'plant_arrangement', 'properties', 'sensors']

class RoomDetailSerializer(serializers.ModelSerializer):
    items = RoomItemSerializer(many=True, read_only=True)
    volume = serializers.ReadOnlyField()
    room_type_display = serializers.SerializerMethodField()
    # NEU: Auch hier die Protect Sensor Felder
    protect_sensors_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'description', 'capacity', 'is_active', 
            'room_type', 'room_type_display', 'pflanzenanzahl',
            'length', 'width', 'height', 'grid_size', 'volume',
            'items', 'created_at', 'unifi_device_id', 'updated_at',
            'protect_sensors', 'protect_sensors_info'  # NEU
        ]
        read_only_fields = ['created_at', 'updated_at']
        
    def get_room_type_display(self, obj):
        return obj.get_room_type_display()
    
    # NEU: Auch hier die Methode
    def get_protect_sensors_info(self, obj):
        """Gibt detaillierte Infos zu den zugeordneten Sensoren"""
        try:
            return ProtectSensorSerializer(obj.protect_sensors.all(), many=True).data
        except:
            return []