# Datei: unifi_api_debug/serializers.py

from rest_framework import serializers
from .models import NfcDebugLog

class NfcDebugLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NfcDebugLog
        fields = "__all__"
