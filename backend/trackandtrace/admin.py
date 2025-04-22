# backend/trackandtrace/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant
)

class MotherPlantInline(admin.TabularInline):
    model = MotherPlant
    extra = 0
    readonly_fields = ['created_at', 'is_destroyed', 'destroyed_at']
    can_delete = True
    show_change_link = True

class FloweringPlantInline(admin.TabularInline):
    model = FloweringPlant
    extra = 0
    readonly_fields = ['created_at', 'is_destroyed', 'destroyed_at']
    can_delete = True
    show_change_link = True

class MotherPlantBatchInline(admin.TabularInline):
    model = MotherPlantBatch
    extra = 0
    readonly_fields = ['quantity', 'created_at', 'get_active_plants', 'get_destroyed_plants']
    can_delete = True
    show_change_link = True
    
    def get_active_plants(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    get_active_plants.short_description = "Aktive Pflanzen"
    
    def get_destroyed_plants(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    get_destroyed_plants.short_description = "Vernichtete Pflanzen"

class FloweringPlantBatchInline(admin.TabularInline):
    model = FloweringPlantBatch
    extra = 0
    readonly_fields = ['quantity', 'created_at', 'get_active_plants', 'get_destroyed_plants']
    can_delete = True
    show_change_link = True
    
    def get_active_plants(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    get_active_plants.short_description = "Aktive Pflanzen"
    
    def get_destroyed_plants(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    get_destroyed_plants.short_description = "Vernichtete Pflanzen"

@admin.register(SeedPurchase)
class SeedPurchaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'strain_name', 'quantity', 'remaining_quantity', 
                   'created_at', 'is_destroyed', 'get_mother_batches', 'get_flowering_batches', 'delete_options']
    list_filter = ['is_destroyed', 'created_at']
    search_fields = ['strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'mother_batches_info', 'flowering_batches_info']
    fieldsets = [
        (None, {
            'fields': ['strain_name', 'quantity', 'remaining_quantity', 'is_destroyed', 'destroy_reason', 'destroyed_at']
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Beziehungen', {
            'fields': ['original_seed', 'mother_batches_info', 'flowering_batches_info'],
        })
    ]
    inlines = [MotherPlantBatchInline, FloweringPlantBatchInline]
    actions = ['complete_delete_with_related']
    
    def get_mother_batches(self, obj):
        count = obj.mother_batches.count()
        if count > 0:
            return format_html('<a href="{}">{} Batches</a>', 
                               reverse('admin:trackandtrace_motherplantbatch_changelist') + f'?seed_purchase__id__exact={obj.id}',
                               count)
        return "0 Batches"
    get_mother_batches.short_description = "Mutterpflanzen-Batches"
    
    def get_flowering_batches(self, obj):
        count = obj.flowering_batches.count()
        if count > 0:
            return format_html('<a href="{}">{} Batches</a>', 
                               reverse('admin:trackandtrace_floweringplantbatch_changelist') + f'?seed_purchase__id__exact={obj.id}',
                               count)
        return "0 Batches"
    get_flowering_batches.short_description = "Blühpflanzen-Batches"
    
    def mother_batches_info(self, obj):
        batches = obj.mother_batches.all()
        if not batches.exists():
            return "Keine Mutterpflanzen-Batches vorhanden"
        
        html = "<ul>"
        for batch in batches:
            html += f"<li>Batch {batch.id}: {batch.quantity} Pflanzen, erstellt am {batch.created_at}</li>"
        html += "</ul>"
        return format_html(html)
    mother_batches_info.short_description = "Mutterpflanzen-Batches Info"
    
    def flowering_batches_info(self, obj):
        batches = obj.flowering_batches.all()
        if not batches.exists():
            return "Keine Blühpflanzen-Batches vorhanden"
        
        html = "<ul>"
        for batch in batches:
            html += f"<li>Batch {batch.id}: {batch.quantity} Pflanzen, erstellt am {batch.created_at}</li>"
        html += "</ul>"
        return format_html(html)
    flowering_batches_info.short_description = "Blühpflanzen-Batches Info"
    
    def delete_options(self, obj):
        return format_html(
            '<a class="button" href="{}" style="background-color: red; color: white; padding: 2px 5px; '
            'text-decoration: none; border-radius: 3px; font-size: 0.7em;">'
            'Vollständig löschen</a>',
            reverse('admin:trackandtrace_seedpurchase_delete', args=[obj.id])
        )
    delete_options.short_description = "Löschen"
    
    @transaction.atomic
    def complete_delete_with_related(self, request, queryset):
        deletion_stats = {
            'seeds': 0,
            'mother_batches': 0,
            'mother_plants': 0, 
            'flowering_batches': 0,
            'flowering_plants': 0
        }
        
        for seed in queryset:
            # Zähle und lösche verbundene Mutterpflanzen
            for batch in seed.mother_batches.all():
                deletion_stats['mother_plants'] += batch.plants.count()
                deletion_stats['mother_batches'] += 1
            
            # Zähle und lösche verbundene Blühpflanzen
            for batch in seed.flowering_batches.all():
                deletion_stats['flowering_plants'] += batch.plants.count()
                deletion_stats['flowering_batches'] += 1
            
            deletion_stats['seeds'] += 1
        
        # Führe die Löschung durch - Dank Cascading werden alle verknüpften Objekte gelöscht
        deleted_count = queryset.delete()[0]
        
        # Erfolgsmeldung anzeigen
        messages.success(request, _(
            f"Erfolgreich gelöscht: "
            f"{deletion_stats['seeds']} Samen, "
            f"{deletion_stats['mother_batches']} Mutterpflanzen-Batches, "
            f"{deletion_stats['mother_plants']} Mutterpflanzen, "
            f"{deletion_stats['flowering_batches']} Blühpflanzen-Batches, "
            f"{deletion_stats['flowering_plants']} Blühpflanzen."
        ))
    complete_delete_with_related.short_description = "Ausgewählte Samen vollständig und unwiderruflich löschen"

@admin.register(MotherPlantBatch)
class MotherPlantBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_seed_strain', 'quantity', 'created_at', 'get_active_plants', 'get_destroyed_plants']
    list_filter = ['created_at']
    search_fields = ['seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MotherPlantInline]
    
    def get_seed_strain(self, obj):
        if obj.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.seed_purchase.id]), 
                               obj.seed_purchase.strain_name)
        return "-"
    get_seed_strain.short_description = "Samensorte"
    
    def get_active_plants(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    get_active_plants.short_description = "Aktive Pflanzen"
    
    def get_destroyed_plants(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    get_destroyed_plants.short_description = "Vernichtete Pflanzen"

@admin.register(MotherPlant)
class MotherPlantAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_batch', 'get_seed_strain', 'created_at', 'is_destroyed', 'destroyed_at']
    list_filter = ['is_destroyed', 'created_at', 'destroyed_at']
    search_fields = ['batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at']
    
    def get_batch(self, obj):
        if obj.batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_motherplantbatch_change', args=[obj.batch.id]), 
                               obj.batch.id)
        return "-"
    get_batch.short_description = "Batch"
    
    def get_seed_strain(self, obj):
        if obj.batch and obj.batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.batch.seed_purchase.id]), 
                               obj.batch.seed_purchase.strain_name)
        return "-"
    get_seed_strain.short_description = "Samensorte"

@admin.register(FloweringPlantBatch)
class FloweringPlantBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_seed_strain', 'quantity', 'created_at', 'get_active_plants', 'get_destroyed_plants']
    list_filter = ['created_at']
    search_fields = ['seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [FloweringPlantInline]
    
    def get_seed_strain(self, obj):
        if obj.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.seed_purchase.id]), 
                               obj.seed_purchase.strain_name)
        return "-"
    get_seed_strain.short_description = "Samensorte"
    
    def get_active_plants(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    get_active_plants.short_description = "Aktive Pflanzen"
    
    def get_destroyed_plants(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    get_destroyed_plants.short_description = "Vernichtete Pflanzen"

@admin.register(FloweringPlant)
class FloweringPlantAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_batch', 'get_seed_strain', 'created_at', 'is_destroyed', 'destroyed_at']
    list_filter = ['is_destroyed', 'created_at', 'destroyed_at']
    search_fields = ['batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at']
    
    def get_batch(self, obj):
        if obj.batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_floweringplantbatch_change', args=[obj.batch.id]), 
                               obj.batch.id)
        return "-"
    get_batch.short_description = "Batch"
    
    def get_seed_strain(self, obj):
        if obj.batch and obj.batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.batch.seed_purchase.id]), 
                               obj.batch.seed_purchase.strain_name)
        return "-"
    get_seed_strain.short_description = "Samensorte"