from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'capacity', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']