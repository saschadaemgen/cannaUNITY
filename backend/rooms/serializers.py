# backend/rooms/serializers.py

from rest_framework import serializers
from .models import Room, RoomItemType, RoomItem, Sensor

class RoomSerializer(serializers.ModelSerializer):
    volume = serializers.ReadOnlyField()
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'capacity', 'is_active', 
                 'length', 'width', 'height', 'grid_size', 'volume',
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

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
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'capacity', 'is_active', 
                 'length', 'width', 'height', 'grid_size', 'volume',
                 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']