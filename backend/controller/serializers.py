# backend/controller/serializers.py

from rest_framework import serializers
from rooms.models import Room
from rooms.serializers import RoomSerializer
from .models import (
    ControlUnit, ControlSchedule, ControlParameter, 
    ControlStatus, ControlCommand, PLCConfiguration
)

class ControlParameterSerializer(serializers.ModelSerializer):
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = ControlParameter
        fields = '__all__'
        read_only_fields = ['control_unit']
    
    def get_typed_value(self, obj):
        return obj.get_typed_value()


class ControlScheduleSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = ControlSchedule
        fields = '__all__'
        read_only_fields = ['control_unit']


class ControlStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControlStatus
        fields = '__all__'
        read_only_fields = ['control_unit', 'last_update']


class ControlCommandSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ControlCommand
        fields = '__all__'
        read_only_fields = ['created_at', 'sent_at', 'confirmed_at']


class ControlUnitSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_type = serializers.CharField(source='room.room_type', read_only=True)
    unit_type_display = serializers.CharField(source='get_unit_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    parameters = ControlParameterSerializer(many=True, read_only=True)
    schedules = ControlScheduleSerializer(many=True, read_only=True)
    current_status = ControlStatusSerializer(read_only=True)
    
    # NEU: Zusätzliche Felder für SPS-Konfiguration
    has_plc_config = serializers.SerializerMethodField()
    is_authenticated = serializers.SerializerMethodField()
    
    class Meta:
        model = ControlUnit
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'plc_auth_token', 'plc_token_expires']
        extra_kwargs = {
            'plc_password': {'write_only': True}  # Passwort nicht im Response anzeigen
        }
    
    def get_has_plc_config(self, obj):
        """Prüft ob PLC-Konfiguration vorhanden ist"""
        return bool(obj.plc_address and obj.plc_username)
    
    def get_is_authenticated(self, obj):
        """Prüft ob ein gültiger Token vorhanden ist"""
        from django.utils import timezone
        return bool(
            obj.plc_auth_token and 
            obj.plc_token_expires and 
            obj.plc_token_expires > timezone.now()
        )


class ControlUnitDetailSerializer(ControlUnitSerializer):
    """Detaillierter Serializer mit allen Relationen"""
    room = RoomSerializer(read_only=True)
    recent_commands = serializers.SerializerMethodField()
    
    def get_recent_commands(self, obj):
        commands = obj.commands.all()[:10]  # Letzte 10 Befehle
        return ControlCommandSerializer(commands, many=True).data


class RoomControlOverviewSerializer(serializers.ModelSerializer):
    """Serializer für Raumübersicht mit allen Steuerungen"""
    control_units = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'room_type', 'control_units']
    
    def get_control_units(self, obj):
        units = obj.control_units.all()
        return ControlUnitSerializer(units, many=True).data


class SendCommandSerializer(serializers.Serializer):
    """Serializer für das Senden von Befehlen an die SPS"""
    command_type = serializers.CharField(max_length=50)
    parameters = serializers.DictField(required=False, default=dict)
    force = serializers.BooleanField(default=False, help_text="Befehl auch bei Fehler senden")


class LEDControlSerializer(serializers.Serializer):
    """Serializer für LED-Kontrolle"""
    status = serializers.BooleanField(required=True, help_text="LED Ein/Aus")


class PLCConfigSerializer(serializers.ModelSerializer):
    """Serializer für globale PLC-Konfiguration"""
    class Meta:
        model = PLCConfiguration
        fields = '__all__'
        extra_kwargs = {
            'default_password': {'write_only': True}
        }