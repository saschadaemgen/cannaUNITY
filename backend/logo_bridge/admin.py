# backend/logo_bridge/admin.py
from django.contrib import admin
from .models import LogoDevice, LogoVariable, LogoCommand, LogoLog

@admin.register(LogoDevice)
class LogoDeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'ip_address', 'port', 'protocol', 'is_active', 'last_connection']
    list_filter = ['protocol', 'is_active']
    search_fields = ['name', 'ip_address']

@admin.register(LogoVariable)
class LogoVariableAdmin(admin.ModelAdmin):
    list_display = ['name', 'device', 'address', 'data_type', 'access_mode', 'unit']
    list_filter = ['device', 'data_type', 'access_mode']
    search_fields = ['name', 'address', 'description']

@admin.register(LogoCommand)
class LogoCommandAdmin(admin.ModelAdmin):
    list_display = ['name', 'device', 'command_type', 'created_at']
    list_filter = ['device', 'command_type']
    search_fields = ['name', 'description']

@admin.register(LogoLog)
class LogoLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'device', 'user', 'action', 'variable', 'success']
    list_filter = ['device', 'action', 'success', 'timestamp']
    search_fields = ['error_message']
    date_hierarchy = 'timestamp'