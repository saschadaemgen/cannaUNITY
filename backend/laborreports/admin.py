# backend/laborreports/admin.py
from django.contrib import admin
from .models import (
    LaboratoryReport, 
    CannabinoidProfile, 
    TerpeneProfile, 
    ContaminantCategory, 
    ContaminantTest
)

class CannabinoidProfileInline(admin.StackedInline):
    model = CannabinoidProfile
    can_delete = False
    verbose_name_plural = 'Cannabinoid-Profil'

class TerpeneProfileInline(admin.StackedInline):
    model = TerpeneProfile
    can_delete = False
    verbose_name_plural = 'Terpen-Profil'

class ContaminantTestInline(admin.TabularInline):
    model = ContaminantTest
    extra = 1
    verbose_name_plural = 'Verunreinigungstests'

@admin.register(LaboratoryReport)
class LaboratoryReportAdmin(admin.ModelAdmin):
    list_display = ('report_number', 'sample_name', 'analysis_date', 'overall_status')
    list_filter = ('overall_status', 'is_gmp_compliant', 'is_gacp_compliant', 'analysis_date')
    search_fields = ('report_number', 'sample_name', 'sample_id')
    date_hierarchy = 'analysis_date'
    readonly_fields = ('created_at', 'updated_at')
    
    inlines = [
        CannabinoidProfileInline,
        TerpeneProfileInline,
        ContaminantTestInline
    ]
    
    fieldsets = (
        ('Allgemeine Informationen', {
            'fields': ('report_number', 'sample_id', 'sample_name', 'sample_type')
        }),
        ('Verantwortliche Personen', {
            'fields': ('collection_person', 'analysis_person', 'approval_person')
        }),
        ('Daten', {
            'fields': ('collection_date', 'analysis_date', 'approval_date')
        }),
        ('Konformität', {
            'fields': ('is_gmp_compliant', 'is_gacp_compliant')
        }),
        ('Ergebnisse und Status', {
            'fields': ('overall_status', 'notes')
        }),
        ('Track & Trace', {
            'fields': ('track_and_trace_batch',),
            'classes': ('collapse',)
        }),
        ('Metadaten', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ContaminantCategory)
class ContaminantCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(ContaminantTest)
class ContaminantTestAdmin(admin.ModelAdmin):
    list_display = ('name', 'report', 'category', 'detected_value', 'threshold_value', 'unit', 'status')
    list_filter = ('status', 'category')
    search_fields = ('name', 'report__report_number')