# backend/taskmanager/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import TaskType, TaskSchedule, TimeSlot, TaskBooking, TaskExperience

@admin.register(TaskType)
class TaskTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'difficulty', 'max_slots_per_day', 'requires_training', 'is_active', 'created_at']
    list_filter = ['difficulty', 'requires_training', 'is_active']
    search_fields = ['name', 'description']
    list_editable = ['is_active', 'max_slots_per_day']
    ordering = ['name']
    
    fieldsets = (
        ('Grundinformationen', {
            'fields': ('name', 'description', 'difficulty', 'is_active')
        }),
        ('Einstellungen', {
            'fields': ('max_slots_per_day', 'min_experience_level', 'requires_training')
        }),
        ('Darstellung', {
            'fields': ('icon', 'color')
        }),
    )

class TimeSlotInline(admin.TabularInline):
    model = TimeSlot
    extra = 0
    readonly_fields = ['current_bookings_count', 'available_spots']
    fields = ['start_time', 'end_time', 'max_participants', 'is_blocked', 'block_reason', 'current_bookings_count', 'available_spots']

@admin.register(TaskSchedule)
class TaskScheduleAdmin(admin.ModelAdmin):
    list_display = ['task_type', 'room', 'date', 'start_time', 'end_time', 'booked_slots_count', 'max_slots', 'utilization_percentage', 'is_active']
    list_filter = ['date', 'task_type', 'room', 'is_active']
    search_fields = ['task_type__name', 'room__name']
    date_hierarchy = 'date'
    ordering = ['-date', 'start_time']
    inlines = [TimeSlotInline]
    
    fieldsets = (
        ('Aufgabenplanung', {
            'fields': ('task_type', 'room', 'date')
        }),
        ('Zeitplanung', {
            'fields': ('start_time', 'end_time', 'max_slots', 'max_participants_per_slot')
        }),
        ('Zusätzliche Informationen', {
            'fields': ('notes', 'is_active')
        }),
    )
    
    def utilization_percentage(self, obj):
        percentage = obj.utilization_percentage
        if percentage >= 80:
            color = 'green'
        elif percentage >= 50:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )
    utilization_percentage.short_description = 'Auslastung'

class TaskBookingInline(admin.TabularInline):
    model = TaskBooking
    extra = 0
    readonly_fields = ['booked_at', 'is_past_due']
    fields = ['member', 'status', 'booked_at', 'notes', 'rating']

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['schedule', 'start_time', 'end_time', 'current_bookings_count', 'max_participants', 'is_fully_booked', 'is_blocked']
    list_filter = ['schedule__date', 'schedule__task_type', 'is_blocked']
    search_fields = ['schedule__task_type__name', 'schedule__room__name']
    ordering = ['schedule__date', 'start_time']
    inlines = [TaskBookingInline]
    
    def is_fully_booked(self, obj):
        return obj.is_fully_booked
    is_fully_booked.boolean = True
    is_fully_booked.short_description = 'Vollständig gebucht'

@admin.register(TaskBooking)
class TaskBookingAdmin(admin.ModelAdmin):
    list_display = ['member', 'time_slot_info', 'status', 'booked_at', 'rating', 'is_past_due']
    list_filter = ['status', 'time_slot__schedule__date', 'time_slot__schedule__task_type', 'rating']
    search_fields = ['member__first_name', 'member__last_name', 'time_slot__schedule__task_type__name']
    date_hierarchy = 'booked_at'
    ordering = ['-booked_at']
    
    fieldsets = (
        ('Buchungsinformationen', {
            'fields': ('time_slot', 'member', 'status')
        }),
        ('Zeitstempel', {
            'fields': ('booked_at', 'cancelled_at', 'completed_at'),
            'classes': ['collapse']
        }),
        ('Anwesenheit', {
            'fields': ('check_in_time', 'check_out_time'),
            'classes': ['collapse']
        }),
        ('Bewertung & Notizen', {
            'fields': ('rating', 'work_quality_rating', 'notes', 'supervisor_notes')
        }),
        ('Stornierung', {
            'fields': ('cancellation_reason',),
            'classes': ['collapse']
        }),
    )
    
    readonly_fields = ['booked_at', 'is_past_due', 'duration_worked']
    
    def time_slot_info(self, obj):
        return f"{obj.time_slot.schedule.task_type.name} - {obj.time_slot.start_time}"
    time_slot_info.short_description = 'Zeitslot'
    
    def is_past_due(self, obj):
        return obj.is_past_due
    is_past_due.boolean = True
    is_past_due.short_description = 'Verstrichen'
    
    actions = ['mark_completed', 'mark_cancelled', 'mark_no_show']
    
    def mark_completed(self, request, queryset):
        updated = queryset.filter(status='confirmed').update(status='completed')
        self.message_user(request, f'{updated} Buchungen als abgeschlossen markiert.')
    mark_completed.short_description = 'Als abgeschlossen markieren'
    
    def mark_cancelled(self, request, queryset):
        updated = queryset.filter(status='confirmed').update(status='cancelled')
        self.message_user(request, f'{updated} Buchungen als storniert markiert.')
    mark_cancelled.short_description = 'Als storniert markieren'
    
    def mark_no_show(self, request, queryset):
        updated = queryset.filter(status='confirmed').update(status='no_show')
        self.message_user(request, f'{updated} Buchungen als nicht erschienen markiert.')
    mark_no_show.short_description = 'Als nicht erschienen markieren'

@admin.register(TaskExperience)
class TaskExperienceAdmin(admin.ModelAdmin):
    list_display = ['member', 'task_type', 'level', 'level_name', 'experience_points', 'completed_tasks', 'average_rating', 'is_certified']
    list_filter = ['task_type', 'is_certified']
    search_fields = ['member__first_name', 'member__last_name', 'task_type__name']
    ordering = ['-experience_points']
    
    readonly_fields = ['level', 'level_name']
    
    fieldsets = (
        ('Mitglied & Aufgabe', {
            'fields': ('member', 'task_type')
        }),
        ('Erfahrung', {
            'fields': ('experience_points', 'completed_tasks', 'average_rating', 'level', 'level_name')
        }),
        ('Zertifizierung', {
            'fields': ('is_certified', 'certification_date')
        }),
        ('Zeitstempel', {
            'fields': ('last_completed',),
            'classes': ['collapse']
        }),
    )
    
    def level(self, obj):
        return obj.level
    level.short_description = 'Level'
    
    def level_name(self, obj):
        return obj.level_name
    level_name.short_description = 'Level Name'