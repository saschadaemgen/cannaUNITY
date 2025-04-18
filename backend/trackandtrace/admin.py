# trackandtrace/admin.py
from django.contrib import admin
from .models import SeedPurchase

@admin.register(SeedPurchase)
class SeedPurchaseAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'strain_name', 'manufacturer', 'purchase_date', 
                    'total_seeds', 'remaining_seeds', 'is_destroyed')
    list_filter = ('is_destroyed', 'manufacturer', 'purchase_date')
    search_fields = ('strain_name', 'batch_number', 'genetics')
    readonly_fields = ('uuid', 'batch_number', 'created_at', 'updated_at', 'remaining_seeds')
    fieldsets = (
        ('Stammdaten', {
            'fields': ('strain_name', 'genetics', 'manufacturer', 'sativa_percentage', 
                      'indica_percentage', 'thc_value', 'cbd_value')
        }),
        ('Einkaufsdaten', {
            'fields': ('purchase_date', 'total_seeds', 'remaining_seeds', 'image', 'document')
        }),
        ('Prozessdaten', {
            'fields': ('responsible_member', 'temperature', 'humidity', 'notes')
        }),
        ('Systemdaten', {
            'fields': ('uuid', 'batch_number', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Vernichtung', {
            'fields': ('is_destroyed', 'destruction_reason', 'destruction_date'),
            'classes': ('collapse',)
        }),
    )