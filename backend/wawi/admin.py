# wawi/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib.admin import SimpleListFilter
from .models import CannabisStrain, StrainImage, StrainInventory, StrainHistory


class THCRangeFilter(SimpleListFilter):
    """Filter für THC-Gehalt Bereiche"""
    title = 'THC-Gehalt'
    parameter_name = 'thc_range'
    
    def lookups(self, request, model_admin):
        return (
            ('low', 'Niedrig (< 15%)'),
            ('medium', 'Mittel (15-20%)'),
            ('high', 'Hoch (20-25%)'),
            ('very_high', 'Sehr hoch (> 25%)'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'low':
            return queryset.filter(thc_percentage_max__lt=15)
        elif self.value() == 'medium':
            return queryset.filter(thc_percentage_min__gte=15, thc_percentage_max__lte=20)
        elif self.value() == 'high':
            return queryset.filter(thc_percentage_min__gte=20, thc_percentage_max__lte=25)
        elif self.value() == 'very_high':
            return queryset.filter(thc_percentage_min__gt=25)


class StrainImageInline(admin.TabularInline):
    """Inline für Bilder einer Cannabis-Sorte"""
    model = StrainImage
    extra = 1
    fields = ('image', 'is_primary', 'caption', 'image_preview')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
                obj.image.url
            )
        return "Kein Bild"
    image_preview.short_description = "Vorschau"


class StrainInventoryInline(admin.StackedInline):
    """Inline für Bestandsverwaltung"""
    model = StrainInventory
    extra = 0
    fields = ('total_quantity', 'available_quantity', 'last_restocked')
    readonly_fields = ('last_restocked',)


class StrainHistoryInline(admin.TabularInline):
    """Inline für Historie"""
    model = StrainHistory
    extra = 0
    fields = ('member', 'action', 'timestamp', 'changes_preview')
    readonly_fields = ('member', 'action', 'timestamp', 'changes_preview')
    can_delete = False
    
    def changes_preview(self, obj):
        if obj.changes:
            changes_text = []
            for field, change in obj.changes.items():
                if isinstance(change, dict) and 'old' in change and 'new' in change:
                    changes_text.append(f"{field}: {change['old']} → {change['new']}")
            return "; ".join(changes_text[:3]) + ("..." if len(changes_text) > 3 else "")
        return "-"
    changes_preview.short_description = "Änderungen"
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(CannabisStrain)
class CannabisStrainAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Cannabis-Sorten"""
    
    # Listenansicht
    list_display = (
        'name', 
        'breeder', 
        'strain_type_colored',
        'batch_number',
        'genetics_display',
        'thc_range_display',
        'cbd_range_display',
        'flowering_time_display',
        'rating_stars',
        'is_active'
    )
    
    list_filter = (
        'is_active',
        'strain_type',
        'difficulty',
        THCRangeFilter,
        'suitable_climate',
        'growing_method',
        'breeder',
        'created_at',
    )
    
    search_fields = (
        'name',
        'breeder',
        'batch_number',
        'genetic_origin',
        'general_information',
        'awards',
    )
    
    ordering = ('-created_at',)
    
    # Formular-Organisation
    fieldsets = (
        ('Basis-Informationen', {
            'fields': (
                ('name', 'breeder'),
                ('batch_number', 'strain_type'),
                'member',
                'is_active',
            )
        }),
        ('Genetik', {
            'fields': (
                'indica_percentage',
                'genetic_origin',
            ),
            'description': 'Sativa-Anteil wird automatisch berechnet (100% - Indica-Anteil)'
        }),
        ('Wachstumseigenschaften', {
            'fields': (
                ('flowering_time_min', 'flowering_time_max'),
                ('height_indoor_min', 'height_indoor_max'),
                ('height_outdoor_min', 'height_outdoor_max'),
                ('yield_indoor_min', 'yield_indoor_max'),
                ('yield_outdoor_min', 'yield_outdoor_max'),
                'difficulty',
            ),
            'classes': ('collapse',)
        }),
        ('Chemische Eigenschaften', {
            'fields': (
                ('thc_percentage_min', 'thc_percentage_max'),
                ('cbd_percentage_min', 'cbd_percentage_max'),
                'dominant_terpenes',
            )
        }),
        ('Sensorische Eigenschaften', {
            'fields': (
                'flavors',
                'effects',
            )
        }),
        ('Anbau-Informationen', {
            'fields': (
                ('suitable_climate', 'growing_method'),
                ('resistance_mold', 'resistance_pests', 'resistance_cold'),
                'general_information',
                'growing_information',
            ),
            'classes': ('collapse',)
        }),
        ('Weitere Informationen', {
            'fields': (
                'awards',
                ('release_year', 'rating'),
                ('price_per_seed', 'seeds_per_pack'),
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [StrainImageInline, StrainInventoryInline, StrainHistoryInline]
    
    readonly_fields = ('batch_number', 'created_at', 'updated_at')
    
    # Benutzerdefinierte Anzeigemethoden
    def strain_type_colored(self, obj):
        colors = {
            'feminized': '#4CAF50',
            'regular': '#2196F3',
            'autoflower': '#FF9800',
            'f1_hybrid': '#9C27B0',
            'cbd': '#00BCD4',
        }
        color = colors.get(obj.strain_type, '#757575')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_strain_type_display()
        )
    strain_type_colored.short_description = 'Samentyp'
    
    def genetics_display(self, obj):
        return format_html(
            '<div style="display: flex; align-items: center;">'
            '<div style="background: #4CAF50; color: white; padding: 2px 8px; '
            'border-radius: 3px; margin-right: 5px;">{}% Indica</div>'
            '<div style="background: #FF5722; color: white; padding: 2px 8px; '
            'border-radius: 3px;">{}% Sativa</div>'
            '</div>',
            obj.indica_percentage,
            obj.sativa_percentage
        )
    genetics_display.short_description = 'Genetik'
    
    def thc_range_display(self, obj):
        avg_thc = (obj.thc_percentage_min + obj.thc_percentage_max) / 2
        if avg_thc < 15:
            color = '#4CAF50'  # Grün für niedrig
        elif avg_thc < 20:
            color = '#FF9800'  # Orange für mittel
        else:
            color = '#F44336'  # Rot für hoch
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f} - {:.1f}%</span>',
            color,
            obj.thc_percentage_min,
            obj.thc_percentage_max
        )
    thc_range_display.short_description = 'THC'
    
    def cbd_range_display(self, obj):
        return f"{obj.cbd_percentage_min:.1f} - {obj.cbd_percentage_max:.1f}%"
    cbd_range_display.short_description = 'CBD'
    
    def flowering_time_display(self, obj):
        return f"{obj.flowering_time_min} - {obj.flowering_time_max} Tage"
    flowering_time_display.short_description = 'Blütezeit'
    
    def rating_stars(self, obj):
        full_stars = int(obj.rating)
        half_star = obj.rating % 1 >= 0.5
        empty_stars = 5 - full_stars - (1 if half_star else 0)
        
        stars_html = '★' * full_stars
        if half_star:
            stars_html += '☆'
        stars_html += '☆' * empty_stars
        
        return format_html(
            '<span style="color: #FFD700; font-size: 16px;" title="{}/5">{}</span>',
            obj.rating,
            stars_html
        )
    rating_stars.short_description = 'Bewertung'
    
    # Admin Actions
    actions = ['activate_strains', 'deactivate_strains', 'export_strain_data']
    
    def activate_strains(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} Sorten wurden aktiviert.")
    activate_strains.short_description = "Ausgewählte Sorten aktivieren"
    
    def deactivate_strains(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} Sorten wurden deaktiviert.")
    deactivate_strains.short_description = "Ausgewählte Sorten deaktivieren"
    
    def export_strain_data(self, request, queryset):
        # Hier könnte man einen CSV-Export implementieren
        self.message_user(
            request, 
            f"Export von {queryset.count()} Sorten wurde initiiert. "
            "(Feature noch in Entwicklung)"
        )
    export_strain_data.short_description = "Sortendaten exportieren"
    
    def save_model(self, request, obj, form, change):
        """Überschreibe save_model um Historie zu erstellen"""
        if change:
            # Sammle Änderungen
            changes = {}
            for field in form.changed_data:
                if hasattr(obj, field):
                    old_value = form.initial.get(field)
                    new_value = form.cleaned_data.get(field)
                    changes[field] = {
                        'old': str(old_value) if old_value is not None else None,
                        'new': str(new_value) if new_value is not None else None
                    }
            
            # Erstelle Historie-Eintrag
            if changes:
                StrainHistory.objects.create(
                    strain=obj,
                    member=request.user.member if hasattr(request.user, 'member') else None,
                    action='updated' if change else 'created',
                    changes=changes
                )
        
        super().save_model(request, obj, form, change)


@admin.register(StrainImage)
class StrainImageAdmin(admin.ModelAdmin):
    """Admin für Sortenbilder"""
    list_display = ('strain', 'image_thumbnail', 'is_primary', 'caption', 'created_at')
    list_filter = ('is_primary', 'created_at', 'strain__breeder')
    search_fields = ('strain__name', 'caption')
    list_editable = ('is_primary',)
    
    def image_thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 100px;" />',
                obj.image.url
            )
        return "Kein Bild"
    image_thumbnail.short_description = "Vorschau"


@admin.register(StrainInventory)
class StrainInventoryAdmin(admin.ModelAdmin):
    """Admin für Bestandsverwaltung"""
    list_display = (
        'strain',
        'total_quantity',
        'available_quantity',
        'stock_status',
        'last_restocked'
    )
    list_filter = ('last_restocked',)
    search_fields = ('strain__name', 'strain__breeder')
    ordering = ('available_quantity',)
    
    def stock_status(self, obj):
        percentage = (obj.available_quantity / obj.total_quantity * 100) if obj.total_quantity > 0 else 0
        
        if percentage == 0:
            color = '#F44336'
            status = 'Ausverkauft'
        elif percentage < 20:
            color = '#FF9800'
            status = 'Niedrig'
        elif percentage < 50:
            color = '#FFC107'
            status = 'Mittel'
        else:
            color = '#4CAF50'
            status = 'Gut'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            status
        )
    stock_status.short_description = 'Bestandsstatus'


@admin.register(StrainHistory)
class StrainHistoryAdmin(admin.ModelAdmin):
    """Admin für Historie"""
    list_display = (
        'strain',
        'member_display',
        'action_colored',
        'changes_summary',
        'timestamp'
    )
    list_filter = ('action', 'timestamp')
    search_fields = ('strain__name', 'member__first_name', 'member__last_name')
    readonly_fields = ('strain', 'member', 'action', 'changes', 'image_data', 'timestamp')
    
    def member_display(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}"
        return "System"
    member_display.short_description = 'Benutzer'
    
    def action_colored(self, obj):
        colors = {
            'created': '#4CAF50',
            'updated': '#2196F3',
            'deactivated': '#F44336',
        }
        color = colors.get(obj.action, '#757575')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_action_display()
        )
    action_colored.short_description = 'Aktion'
    
    def changes_summary(self, obj):
        if obj.changes:
            return f"{len(obj.changes)} Felder geändert"
        return "-"
    changes_summary.short_description = 'Änderungen'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False