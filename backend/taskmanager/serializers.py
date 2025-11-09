# backend/taskmanager/serializers.py

from rest_framework import serializers
from .models import TaskType, TaskSchedule, TimeSlot, TaskBooking, TaskExperience
from members.models import Member
from rooms.models import Room

class TaskTypeSerializer(serializers.ModelSerializer):
    """Serializer für Aufgabentypen"""
    
    class Meta:
        model = TaskType
        fields = '__all__'

class TaskTypeSimpleSerializer(serializers.ModelSerializer):
    """Vereinfachter Serializer für Aufgabentypen in verschachtelten Objekten"""
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    
    class Meta:
        model = TaskType
        fields = ['id', 'name', 'difficulty', 'difficulty_display', 'color', 'icon']

class RoomSimpleSerializer(serializers.ModelSerializer):
    """Vereinfachter Serializer für Räume"""
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'room_type', 'room_type_display']

class MemberSimpleSerializer(serializers.ModelSerializer):
    """Vereinfachter Serializer für Mitglieder"""
    full_name = serializers.SerializerMethodField()
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    class Meta:
        model = Member
        fields = ['uuid', 'first_name', 'last_name', 'full_name']

class TimeSlotSerializer(serializers.ModelSerializer):
    """Serializer für Zeitslots"""
    current_bookings_count = serializers.ReadOnlyField()
    is_fully_booked = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = TimeSlot
        fields = '__all__'

class TaskBookingSerializer(serializers.ModelSerializer):
    """Serializer für Aufgabenbuchungen"""
    member_details = MemberSimpleSerializer(source='member', read_only=True)
    time_slot_details = TimeSlotSerializer(source='time_slot', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_past_due = serializers.ReadOnlyField()
    duration_worked = serializers.ReadOnlyField()
    
    class Meta:
        model = TaskBooking
        fields = '__all__'

class TaskBookingCreateSerializer(serializers.ModelSerializer):
    """Serializer für das Erstellen von Buchungen"""
    
    class Meta:
        model = TaskBooking
        fields = ['time_slot', 'member', 'notes']
    
    def validate(self, data):
        time_slot = data['time_slot']
        member = data['member']
        
        # Prüfung ob Slot noch verfügbar
        if time_slot.is_fully_booked:
            raise serializers.ValidationError("Dieser Zeitslot ist bereits vollständig gebucht.")
        
        # Prüfung auf Doppelbuchung
        existing_booking = TaskBooking.objects.filter(
            time_slot=time_slot,
            member=member,
            status__in=['pending', 'confirmed']
        ).exists()
        
        if existing_booking:
            raise serializers.ValidationError("Sie haben bereits eine aktive Buchung für diesen Zeitslot.")
        
        return data

class TimeSlotWithBookingsSerializer(serializers.ModelSerializer):
    """Zeitslot-Serializer mit eingebetteten Buchungen"""
    bookings = TaskBookingSerializer(many=True, read_only=True)
    current_bookings_count = serializers.ReadOnlyField()
    is_fully_booked = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()
    
    class Meta:
        model = TimeSlot
        fields = '__all__'

class TaskScheduleSerializer(serializers.ModelSerializer):
    """Serializer für Aufgabenplanungen"""
    task_type_details = TaskTypeSimpleSerializer(source='task_type', read_only=True)
    room_details = RoomSimpleSerializer(source='room', read_only=True)
    time_slots = TimeSlotWithBookingsSerializer(many=True, read_only=True)
    booked_slots_count = serializers.ReadOnlyField()
    available_slots_count = serializers.ReadOnlyField()
    utilization_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = TaskSchedule
        fields = '__all__'

class TaskScheduleSimpleSerializer(serializers.ModelSerializer):
    """Vereinfachter Serializer für Aufgabenplanungen"""
    task_type_details = TaskTypeSimpleSerializer(source='task_type', read_only=True)
    room_details = RoomSimpleSerializer(source='room', read_only=True)
    booked_slots_count = serializers.ReadOnlyField()
    available_slots_count = serializers.ReadOnlyField()
    utilization_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = TaskSchedule
        fields = [
            'id', 'date', 'start_time', 'end_time', 'max_slots', 
            'task_type_details', 'room_details', 'booked_slots_count',
            'available_slots_count', 'utilization_percentage', 'is_active'
        ]

class TaskScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer für das Erstellen von Aufgabenplanungen"""
    
    class Meta:
        model = TaskSchedule
        fields = [
            'task_type', 'room', 'date', 'start_time', 'end_time', 
            'max_slots', 'max_participants_per_slot', 'notes'
        ]
    
    def create(self, validated_data):
        # Automatisch Zeitslots erstellen
        schedule = super().create(validated_data)
        self._create_time_slots(schedule)
        return schedule
    
    def _create_time_slots(self, schedule):
        """Erstellt automatisch Zeitslots für die Aufgabenplanung"""
        from datetime import datetime, timedelta
        
        current_time = datetime.combine(schedule.date, schedule.start_time)
        end_time = datetime.combine(schedule.date, schedule.end_time)
        
        slot_count = 0
        while current_time < end_time and slot_count < schedule.max_slots:
            slot_end = current_time + timedelta(hours=1)
            
            # Stelle sicher, dass der Slot nicht über die Endzeit hinausgeht
            if slot_end.time() > schedule.end_time:
                slot_end = datetime.combine(schedule.date, schedule.end_time)
            
            TimeSlot.objects.create(
                schedule=schedule,
                start_time=current_time.time(),
                end_time=slot_end.time(),
                max_participants=schedule.max_participants_per_slot
            )
            
            current_time = slot_end
            slot_count += 1

class TaskExperienceSerializer(serializers.ModelSerializer):
    """Serializer für Aufgabenerfahrungen"""
    member_details = MemberSimpleSerializer(source='member', read_only=True)
    task_type_details = TaskTypeSimpleSerializer(source='task_type', read_only=True)
    level = serializers.ReadOnlyField()
    level_name = serializers.ReadOnlyField()
    
    class Meta:
        model = TaskExperience
        fields = '__all__'

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer für Dashboard-Statistiken"""
    total_tasks_today = serializers.IntegerField()
    total_time_slots_today = serializers.IntegerField()
    booked_slots_today = serializers.IntegerField()
    available_slots_today = serializers.IntegerField()
    utilization_rate_today = serializers.FloatField()
    
    # Wöchentliche Statistiken
    tasks_this_week = serializers.IntegerField()
    completed_bookings_this_week = serializers.IntegerField()
    cancelled_bookings_this_week = serializers.IntegerField()
    
    # Top Mitglieder
    most_active_members = MemberSimpleSerializer(many=True)
    
    # Aufgabenverteilung
    task_distribution = serializers.DictField()

class MemberDashboardSerializer(serializers.Serializer):
    """Serializer für mitgliedsspezifische Dashboard-Daten"""
    upcoming_bookings = TaskBookingSerializer(many=True)
    completed_bookings_count = serializers.IntegerField()
    cancelled_bookings_count = serializers.IntegerField()
    total_experience_points = serializers.IntegerField()
    task_experiences = TaskExperienceSerializer(many=True)
    available_tasks_today = TaskScheduleSimpleSerializer(many=True)