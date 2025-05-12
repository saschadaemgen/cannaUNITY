# controller/serializers.py
from rest_framework import serializers
from .models import (
    IrrigationController, IrrigationSchedule,
    LightController, LightSchedule, LightSchedulePoint,
    ControllerLog, ResourceUsage
)
from rooms.models import Room
from rooms.serializers import RoomSerializer
from members.models import Member
from members.serializers import MemberSerializer

class IrrigationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationSchedule
        fields = ['id', 'day_of_week', 'phase_day', 'start_time', 'duration', 
                 'volume', 'intensity', 'repeated_cycles', 'cycle_pause', 
                 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.day_of_week is not None:
            representation['day_of_week_display'] = instance.get_day_of_week_display()
        return representation


class IrrigationControllerSerializer(serializers.ModelSerializer):
    created_by = MemberSerializer(read_only=True)
    last_modified_by = MemberSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    schedules = IrrigationScheduleSerializer(many=True, read_only=True)
    
    # IDs für Beziehungen
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        source='room',
        write_only=True,
        required=False,
        allow_null=True
    )
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='created_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    last_modified_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='last_modified_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = IrrigationController
        fields = ['id', 'name', 'description', 'is_active', 'is_connected', 
                 'mqtt_topic_prefix', 'room', 'room_id', 'created_by', 
                 'created_by_id', 'last_modified_by', 'last_modified_by_id',
                 'created_at', 'updated_at', 'last_communication', 'pump_type',
                 'water_source', 'flow_rate', 'max_volume_per_day', 
                 'total_volume_used', 'schedule_type', 'sensor_feedback_enabled',
                 'emergency_stop', 'schedules', 'status']
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_communication',
                           'total_volume_used', 'status']
    
    def get_status(self, obj):
        return obj.get_status()
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['pump_type_display'] = instance.get_pump_type_display()
        representation['schedule_type_display'] = instance.get_schedule_type_display()
        representation['controller_type'] = instance.get_controller_type()
        return representation


class LightSchedulePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = LightSchedulePoint
        fields = ['id', 'time_point', 'intensity', 'spectrum_red', 
                 'spectrum_blue', 'transition_duration']
        read_only_fields = ['id']


class LightScheduleSerializer(serializers.ModelSerializer):
    points = LightSchedulePointSerializer(many=True, read_only=True)
    
    class Meta:
        model = LightSchedule
        fields = ['id', 'name', 'day_in_cycle', 'is_active', 
                 'created_at', 'updated_at', 'points']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LightControllerSerializer(serializers.ModelSerializer):
    created_by = MemberSerializer(read_only=True)
    last_modified_by = MemberSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    schedules = LightScheduleSerializer(many=True, read_only=True)
    
    # IDs für Beziehungen
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        source='room',
        write_only=True,
        required=False,
        allow_null=True
    )
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='created_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    last_modified_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(),
        source='last_modified_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = LightController
        fields = ['id', 'name', 'description', 'is_active', 'is_connected', 
                 'mqtt_topic_prefix', 'room', 'room_id', 'created_by', 
                 'created_by_id', 'last_modified_by', 'last_modified_by_id',
                 'created_at', 'updated_at', 'last_communication', 'light_type',
                 'max_power', 'spectrum_type', 'supports_dimming', 
                 'supports_spectrum_control', 'cycle_type', 'current_day_in_cycle',
                 'cycle_start_date', 'auto_increment_day', 'emergency_off',
                 'energy_consumption', 'schedules', 'status']
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_communication',
                           'energy_consumption', 'status']
    
    def get_status(self, obj):
        return obj.get_status()
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['light_type_display'] = instance.get_light_type_display()
        representation['cycle_type_display'] = instance.get_cycle_type_display()
        representation['controller_type'] = instance.get_controller_type()
        return representation


class ControllerLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControllerLog
        fields = ['id', 'controller_type', 'controller_id', 'timestamp', 
                 'action_type', 'value', 'mqtt_command', 'success_status',
                 'error_message']
        read_only_fields = ['id']


class ResourceUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceUsage
        fields = ['id', 'controller_type', 'controller_id', 'resource_type', 
                 'date', 'amount', 'unit', 'cost']
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['resource_type_display'] = instance.get_resource_type_display()
        return representation