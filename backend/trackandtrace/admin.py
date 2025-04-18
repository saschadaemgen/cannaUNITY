# trackandtrace/admin.py
from django.contrib import admin
from .models import SeedPurchase, MotherPlant, Cutting, FloweringPlant

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


@admin.register(MotherPlant)
class MotherPlantAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'genetic_name', 'planting_date', 
                    'plant_count', 'remaining_plants', 'growth_phase', 'is_destroyed')
    list_filter = ('is_destroyed', 'growth_phase', 'planting_date')
    search_fields = ('genetic_name', 'batch_number')
    readonly_fields = ('uuid', 'batch_number', 'created_at', 'updated_at', 'remaining_plants')
    fieldsets = (
        ('Stammdaten', {
            'fields': ('genetic_name', 'seed_source')
        }),
        ('Pflanzendaten', {
            'fields': ('planting_date', 'plant_count', 'remaining_plants', 
                      'growth_phase', 'growth_medium', 'fertilizer', 'light_cycle', 'image')
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

@admin.register(Cutting)
class CuttingAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'genetic_name', 'cutting_date', 
                    'cutting_count', 'remaining_cuttings', 'growth_phase', 'is_destroyed')
    list_filter = ('is_destroyed', 'growth_phase', 'cutting_date')
    search_fields = ('genetic_name', 'batch_number')
    readonly_fields = ('uuid', 'batch_number', 'created_at', 'updated_at', 'remaining_cuttings')
    fieldsets = (
        ('Stammdaten', {
            'fields': ('genetic_name', 'mother_plant_source')
        }),
        ('Stecklingsdaten', {
            'fields': ('cutting_date', 'cutting_count', 'remaining_cuttings', 
                      'growth_phase', 'growth_medium', 'rooting_agent', 'light_cycle', 'image')
        }),
        ('Prozessdaten', {
            'fields': ('responsible_member', 'room', 'temperature', 'humidity', 'notes')
        }),
        ('Systemdaten', {
            'fields': ('uuid', 'batch_number', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Vernichtung', {
            'fields': ('is_destroyed', 'destruction_reason', 'destruction_date', 'destroying_member'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FloweringPlant)
class FloweringPlantAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'genetic_name', 'planting_date', 
                    'plant_count', 'remaining_plants', 'growth_phase', 
                    'is_destroyed', 'is_transferred')
    list_filter = ('is_destroyed', 'is_transferred', 'growth_phase', 'planting_date')
    search_fields = ('genetic_name', 'batch_number')
    readonly_fields = ('uuid', 'batch_number', 'created_at', 'updated_at', 
                      'remaining_plants', 'is_transferred', 'transfer_date')
    fieldsets = (
        ('Stammdaten', {
            'fields': ('genetic_name', 'seed_source', 'cutting_source')
        }),
        ('Pflanzendaten', {
            'fields': ('planting_date', 'plant_count', 'remaining_plants', 
                      'growth_phase', 'growth_medium', 'fertilizer', 'light_cycle',
                      'expected_harvest_date', 'image')
        }),
        ('Prozessdaten', {
            'fields': ('responsible_member', 'room', 'temperature', 'humidity', 'notes')
        }),
        ('Systemdaten', {
            'fields': ('uuid', 'batch_number', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Überführung', {
            'fields': ('is_transferred', 'transfer_date', 'transferring_member'),
            'classes': ('collapse',)
        }),
        ('Vernichtung', {
            'fields': ('is_destroyed', 'destruction_reason', 'destruction_date', 'destroying_member'),
            'classes': ('collapse',)
        }),
    )