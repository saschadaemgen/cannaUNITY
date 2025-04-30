# unifi_protect/serializers.py

from rest_framework import serializers
from .models import ProtectSensor, ProtectSensorHistory

class ProtectSensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectSensor
        fields = '__all__'

class ProtectSensorHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectSensorHistory
        fields = '__all__'