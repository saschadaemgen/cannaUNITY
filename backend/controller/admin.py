# controller/admin.py
from django.contrib import admin
from .models import (
    IrrigationController, IrrigationSchedule,
    LightController, LightSchedule, LightSchedulePoint,
    ControllerLog, ResourceUsage
)

class IrrigationScheduleInline(admin.TabularInline):
    model = IrrigationSchedule
    extra = 0
    fields = ('day_of_week', 'start_time', 'duration', 'volume', 'intensity', 'is_active')

@admin.register(IrrigationController)
class IrrigationControllerAdmin(admin.ModelAdmin):
    list_display = ('name', 'pump_type', 'room', 'is_active', 'is_connected', 'created_at')
    list_filter = ('is_active', 'is_connected', 'pump_type', 'room')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'last_communication', 'total_volume_used')
    fieldsets = (
        ('Basisinformationen', {
            'fields': ('name', 'description', 'is_active', 'is_connected', 'mqtt_topic_prefix', 'room')
        }),
        ('Bewässerungsdetails', {
            'fields': ('pump_type', 'water_source', 'flow_rate', 'max_volume_per_day', 'total_volume_used')
        }),
        ('Planungskonfiguration', {
            'fields': ('schedule_type', 'sensor_feedback_enabled', 'emergency_stop')
        }),
        ('Metadaten', {
            'fields': ('created_by', 'last_modified_by', 'created_at', 'updated_at', 'last_communication')
        })
    )
    inlines = [IrrigationScheduleInline]

@admin.register(IrrigationSchedule)
class IrrigationScheduleAdmin(admin.ModelAdmin):
    list_display = ('controller', 'day_of_week', 'start_time', 'duration', 'volume', 'is_active')
    list_filter = ('is_active', 'day_of_week', 'controller')
    search_fields = ('controller__name',)

class LightSchedulePointInline(admin.TabularInline):
    model = LightSchedulePoint
    extra = 0
    fields = ('time_point', 'intensity', 'spectrum_red', 'spectrum_blue', 'transition_duration')

class LightScheduleInline(admin.TabularInline):
    model = LightSchedule
    extra = 0
    fields = ('name', 'day_in_cycle', 'is_active')

@admin.register(LightController)
class LightControllerAdmin(admin.ModelAdmin):
    list_display = ('name', 'light_type', 'room', 'cycle_type', 'current_day_in_cycle', 'is_active')
    list_filter = ('is_active', 'is_connected', 'light_type', 'cycle_type', 'room')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'last_communication', 'energy_consumption')
    fieldsets = (
        ('Basisinformationen', {
            'fields': ('name', 'description', 'is_active', 'is_connected', 'mqtt_topic_prefix', 'room')
        }),
        ('Lichtdetails', {
            'fields': ('light_type', 'max_power', 'spectrum_type', 'supports_dimming', 'supports_spectrum_control')
        }),
        ('Zyklussteuerung', {
            'fields': ('cycle_type', 'current_day_in_cycle', 'cycle_start_date', 'auto_increment_day', 'emergency_off')
        }),
        ('Ressourcen', {
            'fields': ('energy_consumption',)
        }),
        ('Metadaten', {
            'fields': ('created_by', 'last_modified_by', 'created_at', 'updated_at', 'last_communication')
        })
    )
    inlines = [LightScheduleInline]

@admin.register(LightSchedule)
class LightScheduleAdmin(admin.ModelAdmin):
    list_display = ('controller', 'name', 'day_in_cycle', 'is_active')
    list_filter = ('is_active', 'controller')
    search_fields = ('name', 'controller__name')
    inlines = [LightSchedulePointInline]

@admin.register(LightSchedulePoint)
class LightSchedulePointAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'time_point', 'intensity', 'spectrum_red', 'spectrum_blue')
    list_filter = ('schedule__controller', 'schedule')
    search_fields = ('schedule__name', 'schedule__controller__name')

@admin.register(ControllerLog)
class ControllerLogAdmin(admin.ModelAdmin):
    list_display = ('controller_type', 'action_type', 'timestamp', 'success_status')
    list_filter = ('controller_type', 'action_type', 'success_status', 'timestamp')
    search_fields = ('controller_id', 'action_type', 'error_message')
    readonly_fields = ('id', 'controller_type', 'controller_id', 'timestamp', 
                      'action_type', 'value', 'mqtt_command', 'success_status', 'error_message')

@admin.register(ResourceUsage)
class ResourceUsageAdmin(admin.ModelAdmin):
    list_display = ('controller_type', 'resource_type', 'date', 'amount', 'unit', 'cost')
    list_filter = ('controller_type', 'resource_type', 'date')
    search_fields = ('controller_id',)