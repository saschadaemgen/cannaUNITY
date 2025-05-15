# backend/trackandtrace/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.db.models import Count

class NoLogAdminMixin:
    def log_addition(self, request, object, message):
        pass

    def log_change(self, request, object, message):
        pass

    def log_deletion(self, request, object, message):
        pass

from .models import (
    SeedPurchase, MotherPlantBatch, MotherPlant, 
    FloweringPlantBatch, FloweringPlant, Cutting, CuttingBatch,
    BloomingCuttingBatch, BloomingCuttingPlant, HarvestBatch, 
    DryingBatch, ProcessingBatch, LabTestingBatch, PackagingBatch, 
    PackagingUnit, ProductDistribution
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
    
    def delete_model(self, request, obj):
        """Überschreibt die Standard-Löschmethode im Admin"""
        # Standard-Löschung durchführen
        obj.delete()
        
        # Leere ProductDistribution-Objekte bereinigen
        empty_distributions = ProductDistribution.objects.annotate(
            unit_count=Count('packaging_units')
        ).filter(unit_count=0)
        
        count = empty_distributions.count()
        if count > 0:
            empty_distributions.delete()
            messages.success(request, f"{count} leere Produktauslieferungen wurden ebenfalls entfernt.")
    
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
            'flowering_plants': 0,
            'distributions': 0  # NEU: Zähler für Distributionen
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
        
        # NEU: Finde und lösche leere ProductDistribution-Objekte
        empty_distributions = ProductDistribution.objects.annotate(
            unit_count=Count('packaging_units')
        ).filter(unit_count=0)
        
        # Anzahl merken für die Statistik
        deletion_stats['distributions'] = empty_distributions.count()
        
        # Löschen der leeren Distribution-Objekte
        empty_distributions.delete()
        
        # Erfolgsmeldung anzeigen (erweitert)
        messages.success(request, _(
            f"Erfolgreich gelöscht: "
            f"{deletion_stats['seeds']} Samen, "
            f"{deletion_stats['mother_batches']} Mutterpflanzen-Batches, "
            f"{deletion_stats['mother_plants']} Mutterpflanzen, "
            f"{deletion_stats['flowering_batches']} Blühpflanzen-Batches, "
            f"{deletion_stats['flowering_plants']} Blühpflanzen, "
            f"{deletion_stats['distributions']} leere Produktauslieferungen."  # NEU
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

# Neue Admin-Klassen

class CuttingInline(admin.TabularInline):
    model = Cutting
    extra = 0
    readonly_fields = ['created_at', 'is_destroyed', 'destroyed_at', 'converted_at']
    can_delete = True
    show_change_link = True

@admin.register(CuttingBatch)
class CuttingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_mother_batch', 'get_strain', 'quantity', 'created_at', 'get_active_cuttings', 'get_destroyed_cuttings']
    list_filter = ['created_at']
    search_fields = ['mother_batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'get_mother_info']
    fieldsets = [
        (None, {
            'fields': ['mother_batch', 'quantity', 'notes']
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Mutterpflanzen-Info', {
            'fields': ['get_mother_info'],
        })
    ]
    inlines = [CuttingInline]
    
    def get_mother_batch(self, obj):
        if obj.mother_batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_motherplantbatch_change', args=[obj.mother_batch.id]), 
                               obj.mother_batch.id)
        return "-"
    get_mother_batch.short_description = "Mutterpflanzen-Batch"
    
    def get_strain(self, obj):
        if obj.mother_batch and obj.mother_batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.mother_batch.seed_purchase.id]), 
                               obj.mother_batch.seed_purchase.strain_name)
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_active_cuttings(self, obj):
        return obj.cuttings.filter(is_destroyed=False).count()
    get_active_cuttings.short_description = "Aktive Stecklinge"
    
    def get_destroyed_cuttings(self, obj):
        return obj.cuttings.filter(is_destroyed=True).count()
    get_destroyed_cuttings.short_description = "Vernichtete Stecklinge"
    
    def get_mother_info(self, obj):
        if not obj.mother_batch:
            return "Keine Mutterpflanzen-Batch zugeordnet"
        
        html = "<ul>"
        html += f"<li>Mutterpflanzen-Batch: {obj.mother_batch.batch_number}</li>"
        if obj.mother_batch.seed_purchase:
            html += f"<li>Genetik: {obj.mother_batch.seed_purchase.strain_name}</li>"
        
        active_count = obj.mother_batch.plants.filter(is_destroyed=False).count()
        html += f"<li>Aktive Mutterpflanzen: {active_count}</li>"
        html += "</ul>"
        return format_html(html)
    get_mother_info.short_description = "Mutterpflanzen-Informationen"

@admin.register(Cutting)
class CuttingAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_batch', 'get_strain', 'created_at', 'is_destroyed', 'destroyed_at', 'converted_at']
    list_filter = ['is_destroyed', 'created_at', 'destroyed_at']
    search_fields = ['batch__mother_batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'converted_at']
    
    def get_batch(self, obj):
        if obj.batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_cuttingbatch_change', args=[obj.batch.id]), 
                               obj.batch.id)
        return "-"
    get_batch.short_description = "Batch"
    
    def get_strain(self, obj):
        if obj.batch and obj.batch.mother_batch and obj.batch.mother_batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.batch.mother_batch.seed_purchase.id]), 
                               obj.batch.mother_batch.seed_purchase.strain_name)
        return "-"
    get_strain.short_description = "Genetik"

class BloomingCuttingPlantInline(admin.TabularInline):
    model = BloomingCuttingPlant
    extra = 0
    readonly_fields = ['created_at', 'is_destroyed', 'destroyed_at']
    can_delete = True
    show_change_link = True

@admin.register(BloomingCuttingBatch)
class BloomingCuttingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_cutting_batch', 'get_strain', 'quantity', 'created_at', 'get_active_plants', 'get_destroyed_plants']
    list_filter = ['created_at']
    search_fields = ['cutting_batch__mother_batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'get_cutting_info']
    fieldsets = [
        (None, {
            'fields': ['cutting_batch', 'quantity', 'notes']
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Steckling-Info', {
            'fields': ['get_cutting_info'],
        })
    ]
    inlines = [BloomingCuttingPlantInline]
    
    def get_cutting_batch(self, obj):
        if obj.cutting_batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_cuttingbatch_change', args=[obj.cutting_batch.id]), 
                               obj.cutting_batch.id)
        return "-"
    get_cutting_batch.short_description = "Steckling-Batch"
    
    def get_strain(self, obj):
        if obj.cutting_batch and obj.cutting_batch.mother_batch and obj.cutting_batch.mother_batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.cutting_batch.mother_batch.seed_purchase.id]), 
                               obj.cutting_batch.mother_batch.seed_purchase.strain_name)
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_active_plants(self, obj):
        return obj.plants.filter(is_destroyed=False).count()
    get_active_plants.short_description = "Aktive Pflanzen"
    
    def get_destroyed_plants(self, obj):
        return obj.plants.filter(is_destroyed=True).count()
    get_destroyed_plants.short_description = "Vernichtete Pflanzen"
    
    def get_cutting_info(self, obj):
        if not obj.cutting_batch:
            return "Kein Steckling-Batch zugeordnet"
        
        html = "<ul>"
        html += f"<li>Steckling-Batch: {obj.cutting_batch.batch_number}</li>"
        if obj.cutting_batch.mother_batch and obj.cutting_batch.mother_batch.seed_purchase:
            html += f"<li>Genetik: {obj.cutting_batch.mother_batch.seed_purchase.strain_name}</li>"
        html += "</ul>"
        return format_html(html)
    get_cutting_info.short_description = "Steckling-Informationen"

@admin.register(BloomingCuttingPlant)
class BloomingCuttingPlantAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_batch', 'get_strain', 'created_at', 'is_destroyed', 'destroyed_at']
    list_filter = ['is_destroyed', 'created_at', 'destroyed_at']
    search_fields = ['batch__cutting_batch__mother_batch__seed_purchase__strain_name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at']
    
    def get_batch(self, obj):
        if obj.batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_bloomingcuttingbatch_change', args=[obj.batch.id]), 
                               obj.batch.id)
        return "-"
    get_batch.short_description = "Batch"
    
    def get_strain(self, obj):
        if obj.batch and obj.batch.cutting_batch and obj.batch.cutting_batch.mother_batch and obj.batch.cutting_batch.mother_batch.seed_purchase:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_seedpurchase_change', args=[obj.batch.cutting_batch.mother_batch.seed_purchase.id]), 
                               obj.batch.cutting_batch.mother_batch.seed_purchase.strain_name)
        return "-"
    get_strain.short_description = "Genetik"

@admin.register(HarvestBatch)
class HarvestBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_source_type', 'get_strain', 'weight', 'created_at', 'is_destroyed', 'converted_to_drying']
    list_filter = ['is_destroyed', 'converted_to_drying', 'created_at']
    search_fields = ['batch_number', 'id']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'converted_to_drying_at', 'get_source_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'weight', 'flowering_batch', 'blooming_cutting_batch', 'notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by', 
                      'converted_to_drying', 'converted_to_drying_at', 'drying_batch']
        }),
        ('Zuordnung', {
            'fields': ['member', 'room'],
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Quell-Informationen', {
            'fields': ['get_source_info'],
        })
    ]
    
    def get_source_type(self, obj):
        if obj.flowering_batch:
            return "Blühpflanzen aus Samen"
        elif obj.blooming_cutting_batch:
            return "Blühpflanzen aus Stecklingen"
        return "-"
    get_source_type.short_description = "Quelle"
    
    def get_strain(self, obj):
        strain = obj.source_strain
        if strain != "Unbekannt":
            return strain
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_source_info(self, obj):
        if not obj.flowering_batch and not obj.blooming_cutting_batch:
            return "Keine Quell-Informationen verfügbar"
        
        html = "<ul>"
        if obj.flowering_batch:
            html += f"<li>Blühpflanzen-Batch: {obj.flowering_batch.batch_number}</li>"
            if obj.flowering_batch.seed_purchase:
                html += f"<li>Genetik: {obj.flowering_batch.seed_purchase.strain_name}</li>"
        elif obj.blooming_cutting_batch:
            html += f"<li>Blühende Stecklinge-Batch: {obj.blooming_cutting_batch.batch_number}</li>"
            if obj.blooming_cutting_batch.cutting_batch and obj.blooming_cutting_batch.cutting_batch.mother_batch and obj.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase:
                html += f"<li>Genetik: {obj.blooming_cutting_batch.cutting_batch.mother_batch.seed_purchase.strain_name}</li>"
        html += "</ul>"
        return format_html(html)
    get_source_info.short_description = "Quell-Informationen"

@admin.register(DryingBatch)
class DryingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_strain', 'initial_weight', 'final_weight', 
                   'get_weight_loss_percentage', 'created_at', 'is_destroyed', 'converted_to_processing']
    list_filter = ['is_destroyed', 'converted_to_processing', 'created_at']
    search_fields = ['batch_number', 'id', 'harvest_batch__batch_number']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'converted_to_processing_at', 'get_harvest_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'harvest_batch', 'initial_weight', 'final_weight', 'notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by', 
                      'converted_to_processing', 'converted_to_processing_at', 'processing_batch']
        }),
        ('Zuordnung', {
            'fields': ['member', 'room'],
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Ernte-Informationen', {
            'fields': ['get_harvest_info'],
        })
    ]
    
    def get_strain(self, obj):
        strain = obj.source_strain
        if strain != "Unbekannt":
            return strain
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_weight_loss_percentage(self, obj):
        return f"{obj.weight_loss_percentage:.2f}%"
    get_weight_loss_percentage.short_description = "Gewichtsverlust"
    
    def get_harvest_info(self, obj):
        if not obj.harvest_batch:
            return "Keine Ernte-Informationen verfügbar"
        
        html = "<ul>"
        html += f"<li>Ernte-Batch: {obj.harvest_batch.batch_number}</li>"
        html += f"<li>Ernte-Gewicht: {obj.harvest_batch.weight}g</li>"
        html += f"<li>Genetik: {obj.harvest_batch.source_strain}</li>"
        
        if obj.harvest_batch.flowering_batch:
            html += f"<li>Quelle: Blühpflanzen aus Samen (Batch: {obj.harvest_batch.flowering_batch.batch_number})</li>"
        elif obj.harvest_batch.blooming_cutting_batch:
            html += f"<li>Quelle: Blühpflanzen aus Stecklingen (Batch: {obj.harvest_batch.blooming_cutting_batch.batch_number})</li>"
        
        html += "</ul>"
        return format_html(html)
    get_harvest_info.short_description = "Ernte-Informationen"

@admin.register(ProcessingBatch)
class ProcessingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_product_type_display', 'get_strain', 
                   'input_weight', 'output_weight', 'get_yield_percentage', 'created_at', 'is_destroyed']
    list_filter = ['is_destroyed', 'product_type', 'created_at']
    search_fields = ['batch_number', 'id', 'drying_batch__batch_number', 'drying_batch__harvest_batch__batch_number']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'get_drying_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'drying_batch', 'product_type', 'input_weight', 'output_weight', 'notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by']
        }),
        ('Zuordnung', {
            'fields': ['member', 'room'],
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Trocknungs-Informationen', {
            'fields': ['get_drying_info'],
        })
    ]
    
    def get_product_type_display(self, obj):
        return dict(obj._meta.model.PRODUCT_TYPE_CHOICES).get(obj.product_type, obj.product_type)
    get_product_type_display.short_description = "Produkttyp"
    
    def get_strain(self, obj):
        strain = obj.source_strain
        if strain != "Unbekannt":
            return strain
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_yield_percentage(self, obj):
        return f"{obj.yield_percentage:.2f}%"
    get_yield_percentage.short_description = "Ausbeute"
    
    def get_drying_info(self, obj):
        if not obj.drying_batch:
            return "Keine Trocknungs-Informationen verfügbar"
        
        html = "<ul>"
        html += f"<li>Trocknungs-Batch: {obj.drying_batch.batch_number}</li>"
        html += f"<li>Trocknungs-Gewicht: {obj.drying_batch.final_weight}g</li>"
        html += f"<li>Gewichtsverlust: {obj.drying_batch.weight_loss_percentage:.2f}%</li>"
        
        if obj.drying_batch.harvest_batch:
            html += f"<li>Ernte-Batch: {obj.drying_batch.harvest_batch.batch_number}</li>"
            html += f"<li>Genetik: {obj.drying_batch.harvest_batch.source_strain}</li>"
        
        html += "</ul>"
        return format_html(html)
    get_drying_info.short_description = "Trocknungs-Informationen"

@admin.register(LabTestingBatch)
class LabTestingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_product_type', 'get_strain', 
                   'status', 'thc_content', 'cbd_content', 'input_weight', 'sample_weight', 
                   'created_at', 'is_destroyed', 'converted_to_packaging']
    list_filter = ['is_destroyed', 'converted_to_packaging', 'status', 'created_at']
    search_fields = ['batch_number', 'id', 'processing_batch__batch_number']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'converted_to_packaging_at', 'get_processing_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'processing_batch', 'input_weight', 'sample_weight', 'notes']
        }),
        ('Laborergebnisse', {
            'fields': ['status', 'thc_content', 'cbd_content', 'lab_notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by', 
                      'converted_to_packaging', 'converted_to_packaging_at', 'packaging_batch']
        }),
        ('Zuordnung', {
            'fields': ['member', 'room'],
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Verarbeitungs-Informationen', {
            'fields': ['get_processing_info'],
        })
    ]
    
    def get_product_type(self, obj):
        if obj.processing_batch:
            return dict(obj.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(obj.processing_batch.product_type, obj.processing_batch.product_type)
        return "-"
    get_product_type.short_description = "Produkttyp"
    
    def get_strain(self, obj):
        strain = obj.source_strain
        if strain != "Unbekannt":
            return strain
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_processing_info(self, obj):
        if not obj.processing_batch:
            return "Keine Verarbeitungs-Informationen verfügbar"
        
        html = "<ul>"
        html += f"<li>Verarbeitungs-Batch: {obj.processing_batch.batch_number}</li>"
        html += f"<li>Produkttyp: {dict(obj.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(obj.processing_batch.product_type, obj.processing_batch.product_type)}</li>"
        html += f"<li>Verarbeitungs-Gewicht: {obj.processing_batch.output_weight}g</li>"
        html += f"<li>Ausbeute: {obj.processing_batch.yield_percentage:.2f}%</li>"
        
        if obj.processing_batch.drying_batch:
            html += f"<li>Trocknungs-Batch: {obj.processing_batch.drying_batch.batch_number}</li>"
            html += f"<li>Genetik: {obj.processing_batch.source_strain}</li>"
        
        html += "</ul>"
        return format_html(html)
    get_processing_info.short_description = "Verarbeitungs-Informationen"

class PackagingUnitInline(admin.TabularInline):
    model = PackagingUnit
    extra = 0
    readonly_fields = ['created_at', 'is_destroyed', 'destroyed_at']
    can_delete = True
    show_change_link = True

@admin.register(PackagingBatch)
class PackagingBatchAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_product_type', 'get_strain', 
                   'total_weight', 'unit_count', 'unit_weight', 'get_thc_content', 
                   'created_at', 'is_destroyed']
    list_filter = ['is_destroyed', 'created_at']
    search_fields = ['batch_number', 'id', 'lab_testing_batch__batch_number']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'get_lab_testing_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'lab_testing_batch', 'total_weight', 'unit_count', 'unit_weight', 'notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by']
        }),
        ('Zuordnung', {
            'fields': ['member', 'room'],
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Laborkontroll-Informationen', {
            'fields': ['get_lab_testing_info'],
        })
    ]
    inlines = [PackagingUnitInline]
    
    def get_product_type(self, obj):
        if obj.lab_testing_batch and obj.lab_testing_batch.processing_batch:
            return dict(obj.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(
                obj.lab_testing_batch.processing_batch.product_type, 
                obj.lab_testing_batch.processing_batch.product_type
            )
        return "-"
    get_product_type.short_description = "Produkttyp"
    
    def get_strain(self, obj):
        strain = obj.source_strain
        if strain != "Unbekannt":
            return strain
        return "-"
    get_strain.short_description = "Genetik"
    
    def get_thc_content(self, obj):
        if obj.thc_content:
            return f"{obj.thc_content}%"
        return "-"
    get_thc_content.short_description = "THC-Gehalt"
    
    def get_lab_testing_info(self, obj):
        if not obj.lab_testing_batch:
            return "Keine Laborkontroll-Informationen verfügbar"
        
        html = "<ul>"
        html += f"<li>Laborkontroll-Batch: {obj.lab_testing_batch.batch_number}</li>"
        html += f"<li>Status: {dict(obj.lab_testing_batch._meta.model.LAB_STATUS_CHOICES).get(obj.lab_testing_batch.status, obj.lab_testing_batch.status)}</li>"
        
        if obj.lab_testing_batch.thc_content:
            html += f"<li>THC-Gehalt: {obj.lab_testing_batch.thc_content}%</li>"
        if obj.lab_testing_batch.cbd_content:
            html += f"<li>CBD-Gehalt: {obj.lab_testing_batch.cbd_content}%</li>"
        
        if obj.lab_testing_batch.processing_batch:
            html += f"<li>Produkttyp: {dict(obj.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(obj.lab_testing_batch.processing_batch.product_type, obj.lab_testing_batch.processing_batch.product_type)}</li>"
            html += f"<li>Genetik: {obj.lab_testing_batch.source_strain}</li>"
        
        html += "</ul>"
        return format_html(html)
    get_lab_testing_info.short_description = "Laborkontroll-Informationen"

@admin.register(PackagingUnit)
class PackagingUnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_batch', 'get_product_type', 'weight', 
                   'created_at', 'is_destroyed', 'get_distribution_status']
    list_filter = ['is_destroyed', 'created_at']
    search_fields = ['batch_number', 'id', 'batch__batch_number']
    readonly_fields = ['created_at', 'updated_at', 'destroyed_at', 'get_packaging_info', 'get_distribution_info']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'batch', 'weight', 'notes']
        }),
        ('Status', {
            'fields': ['is_destroyed', 'destroy_reason', 'destroyed_at', 'destroyed_by']
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Verpackungs-Informationen', {
            'fields': ['get_packaging_info'],
        }),
        ('Auslieferungs-Informationen', {
            'fields': ['get_distribution_info'],
        })
    ]
    
    def get_batch(self, obj):
        if obj.batch:
            return format_html('<a href="{}">{}</a>', 
                               reverse('admin:trackandtrace_packagingbatch_change', args=[obj.batch.id]), 
                               obj.batch.id)
        return "-"
    get_batch.short_description = "Verpackungs-Batch"
    
    def get_product_type(self, obj):
        if obj.batch and obj.batch.lab_testing_batch and obj.batch.lab_testing_batch.processing_batch:
            return dict(obj.batch.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(
                obj.batch.lab_testing_batch.processing_batch.product_type, 
                obj.batch.lab_testing_batch.processing_batch.product_type
            )
        return "-"
    get_product_type.short_description = "Produkttyp"
    
    def get_distribution_status(self, obj):
        distributions = obj.distributions.all()
        if distributions.exists():
            return format_html('<span style="color: green;">Ausgeliefert</span>')
        elif obj.is_destroyed:
            return format_html('<span style="color: red;">Vernichtet</span>')
        else:
            return format_html('<span style="color: blue;">Auf Lager</span>')
    get_distribution_status.short_description = "Status"
    
    def get_packaging_info(self, obj):
        if not obj.batch:
            return "Keine Verpackungs-Informationen verfügbar"
        
        html = "<ul>"
        html += f"<li>Verpackungs-Batch: {obj.batch.batch_number}</li>"
        html += f"<li>Einheitengewicht: {obj.batch.unit_weight}g</li>"
        html += f"<li>Gesamtzahl Einheiten: {obj.batch.unit_count}</li>"
        
        if obj.batch.lab_testing_batch:
            html += f"<li>Laborkontroll-Batch: {obj.batch.lab_testing_batch.batch_number}</li>"
            
            if obj.batch.lab_testing_batch.thc_content:
                html += f"<li>THC-Gehalt: {obj.batch.lab_testing_batch.thc_content}%</li>"
            if obj.batch.lab_testing_batch.cbd_content:
                html += f"<li>CBD-Gehalt: {obj.batch.lab_testing_batch.cbd_content}%</li>"
                
            if obj.batch.lab_testing_batch.processing_batch:
                html += f"<li>Produkttyp: {dict(obj.batch.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(obj.batch.lab_testing_batch.processing_batch.product_type, obj.batch.lab_testing_batch.processing_batch.product_type)}</li>"
                html += f"<li>Genetik: {obj.batch.source_strain}</li>"
        
        html += "</ul>"
        return format_html(html)
    get_packaging_info.short_description = "Verpackungs-Informationen"
    
    def get_distribution_info(self, obj):
        distributions = obj.distributions.all()
        if not distributions.exists():
            return "Diese Einheit wurde noch nicht ausgeliefert."
        
        html = "<ul>"
        for distribution in distributions:
            recipient_name = f"{distribution.recipient.first_name} {distribution.recipient.last_name}" if distribution.recipient else "Unbekannt"
            distributor_name = f"{distribution.distributor.first_name} {distribution.distributor.last_name}" if distribution.distributor else "Unbekannt"
            
            html += f"<li>Auslieferungs-ID: <a href='{reverse('admin:trackandtrace_productdistribution_change', args=[distribution.id])}'>{distribution.batch_number}</a></li>"
            html += f"<li>Datum: {distribution.distribution_date}</li>"
            html += f"<li>Empfänger: {recipient_name}</li>"
            html += f"<li>Ausgegeben von: {distributor_name}</li>"
        html += "</ul>"
        return format_html(html)
    get_distribution_info.short_description = "Auslieferungs-Informationen"

@admin.register(ProductDistribution)
class ProductDistributionAdmin(admin.ModelAdmin):
    list_display = ['id', 'batch_number', 'get_recipient', 'get_distributor', 
                   'distribution_date', 'get_unit_count', 'get_total_weight']
    list_filter = ['distribution_date']
    search_fields = ['batch_number', 'id', 'recipient__first_name', 'recipient__last_name', 
                    'distributor__first_name', 'distributor__last_name']
    readonly_fields = ['created_at', 'updated_at', 'get_units_info', 'get_total_weight']
    filter_horizontal = ['packaging_units']
    fieldsets = [
        (None, {
            'fields': ['batch_number', 'recipient', 'distributor', 'distribution_date', 'packaging_units', 'notes']
        }),
        ('Zeitinformationen', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Einheiten-Informationen', {
            'fields': ['get_units_info', 'get_total_weight'],
        })
    ]
    
    def get_recipient(self, obj):
        if obj.recipient:
            return f"{obj.recipient.first_name} {obj.recipient.last_name}"
        return "-"
    get_recipient.short_description = "Empfänger"
    
    def get_distributor(self, obj):
        if obj.distributor:
            return f"{obj.distributor.first_name} {obj.distributor.last_name}"
        return "-"
    get_distributor.short_description = "Ausgegeben von"
    
    def get_unit_count(self, obj):
        return obj.packaging_units.count()
    get_unit_count.short_description = "Anzahl Einheiten"
    
    def get_total_weight(self, obj):
        total = sum(float(unit.weight) for unit in obj.packaging_units.all())
        return f"{total}g"
    get_total_weight.short_description = "Gesamtgewicht"
    
    def get_units_info(self, obj):
        units = obj.packaging_units.all()
        if not units.exists():
            return "Keine Einheiten zugeordnet"
        
        html = "<ul>"
        for unit in units:
            product_type = "-"
            strain = "-"
            thc = "-"
            
            if unit.batch and unit.batch.lab_testing_batch and unit.batch.lab_testing_batch.processing_batch:
                product_type = dict(unit.batch.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(
                    unit.batch.lab_testing_batch.processing_batch.product_type, 
                    unit.batch.lab_testing_batch.processing_batch.product_type
                )
                strain = unit.batch.source_strain if unit.batch.source_strain != "Unbekannt" else "-"
                thc = f"{unit.batch.lab_testing_batch.thc_content}%" if unit.batch.lab_testing_batch.thc_content else "-"
            
            html += f"<li><a href='{reverse('admin:trackandtrace_packagingunit_change', args=[unit.id])}'>{unit.batch_number}</a>: {unit.weight}g | {product_type} | {strain} | THC: {thc}</li>"
        html += "</ul>"
        
        # Produkttyp-Zusammenfassung hinzufügen
        product_types = {}
        for unit in units:
            if unit.batch and unit.batch.lab_testing_batch and unit.batch.lab_testing_batch.processing_batch:
                product_type = unit.batch.lab_testing_batch.processing_batch.product_type
                product_type_display = dict(unit.batch.lab_testing_batch.processing_batch._meta.model.PRODUCT_TYPE_CHOICES).get(
                    product_type, product_type
                )
                if product_type_display in product_types:
                    product_types[product_type_display] += float(unit.weight)
                else:
                    product_types[product_type_display] = float(unit.weight)
        
        if product_types:
            html += "<h4>Zusammenfassung nach Produkttyp:</h4><ul>"
            for product_type, weight in product_types.items():
                html += f"<li>{product_type}: {weight}g</li>"
            html += "</ul>"
        
        return format_html(html)
    get_units_info.short_description = "Einheiten-Informationen"