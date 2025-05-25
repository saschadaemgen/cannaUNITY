# backend/controller/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ControlUnit, ControlSchedule, ControlParameter,
    ControlStatus, ControlCommand
)


class ControlScheduleInline(admin.TabularInline):
    model = ControlSchedule
    extra = 1
    fields = ['weekday', 'start_time', 'end_time', 'target_value', 'secondary_value', 'is_active']


class ControlParameterInline(admin.TabularInline):
    model = ControlParameter
    extra = 1
    fields = ['key', 'value', 'param_type', 'unit', 'description']


@admin.register(ControlUnit)
class ControlUnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'room', 'unit_type', 'status', 'status_indicator', 'last_sync']
    list_filter = ['unit_type', 'status', 'room__room_type']
    search_fields = ['name', 'description', 'room__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    inlines = [ControlScheduleInline, ControlParameterInline]
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('room', 'name', 'unit_type', 'description')
        }),
        ('Status', {
            'fields': ('status', 'last_sync')
        }),
        ('SPS-Konfiguration', {
            'fields': ('plc_address', 'plc_db_number'),
            'classes': ('collapse',)
        }),
        ('Metadaten', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_indicator(self, obj):
        colors = {
            'active': 'green',
            'inactive': 'gray',
            'error': 'red',
            'maintenance': 'orange',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {};">●</span>',
            color
        )
    status_indicator.short_description = 'Status'


@admin.register(ControlStatus)
class ControlStatusAdmin(admin.ModelAdmin):
    list_display = ['control_unit', 'is_online', 'current_value', 'last_update']
    list_filter = ['is_online', 'control_unit__unit_type']
    readonly_fields = ['last_update']


@admin.register(ControlCommand)
class ControlCommandAdmin(admin.ModelAdmin):
    list_display = ['control_unit', 'command_type', 'status', 'created_at', 'sent_at']
    list_filter = ['status', 'command_type', 'created_at']
    readonly_fields = ['id', 'created_at', 'sent_at', 'confirmed_at']
    
    def has_add_permission(self, request):
        return False  # Commands nur über API erstellen