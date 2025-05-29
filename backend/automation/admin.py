from django.contrib import admin
from .models import PLCDevice, PLCOutput, PLCLog

@admin.register(PLCDevice)
class PLCDeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'ip_address', 'port', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'ip_address']

@admin.register(PLCOutput)
class PLCOutputAdmin(admin.ModelAdmin):
    list_display = ['name', 'device', 'address', 'current_state', 'last_updated']
    list_filter = ['device', 'current_state']
    search_fields = ['name', 'address']

@admin.register(PLCLog)
class PLCLogAdmin(admin.ModelAdmin):
    list_display = ['output', 'action', 'old_state', 'new_state', 'user', 'timestamp', 'success']
    list_filter = ['action', 'success', 'timestamp']
    readonly_fields = ['output', 'action', 'old_state', 'new_state', 'user', 'timestamp', 'success', 'error_message']