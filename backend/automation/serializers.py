from rest_framework import serializers
from .models import PLCDevice, PLCOutput, PLCLog

class PLCDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PLCDevice
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True}
        }

class PLCOutputSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    
    class Meta:
        model = PLCOutput
        fields = '__all__'

class PLCLogSerializer(serializers.ModelSerializer):
    output_name = serializers.CharField(source='output.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PLCLog
        fields = '__all__'