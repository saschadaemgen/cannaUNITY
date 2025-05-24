# backend/logo_bridge/serializers.py
from rest_framework import serializers
from .models import LogoDevice, LogoVariable, LogoCommand, LogoLog

class LogoDeviceSerializer(serializers.ModelSerializer):
    variables_count = serializers.IntegerField(source='variables.count', read_only=True)
    commands_count = serializers.IntegerField(source='commands.count', read_only=True)
    
    class Meta:
        model = LogoDevice
        fields = '__all__'

class LogoVariableSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    
    class Meta:
        model = LogoVariable
        fields = '__all__'

class LogoCommandSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    variables = LogoVariableSerializer(many=True, read_only=True)
    
    class Meta:
        model = LogoCommand
        fields = '__all__'

class LogoLogSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    variable_name = serializers.CharField(source='variable.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LogoLog
        fields = '__all__'