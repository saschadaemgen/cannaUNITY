# unifi_protect/serializers.py

from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import ProtectSensor, ProtectSensorHistory

class ProtectSensorSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = ProtectSensor
        fields = '__all__'

    def get_status(self, obj):
        if not obj.last_seen:
            return "Unbekannt"
        now = timezone.now()
        delta = now - obj.last_seen
        if delta.total_seconds() <= 600:
            return "Online"
        return "Offline"

class ProtectSensorHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectSensorHistory
        fields = '__all__'