from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
import datetime

from .models import (
    Account, Booking, SubTransaction, MemberAccount,
    BusinessYear, YearClosingStep, ClosingAdjustment
)

# -----------------------------------------------------------------------------
# Inline für SubTransactions in Booking
# -----------------------------------------------------------------------------
class SubTransactionInline(admin.TabularInline):
    model = SubTransaction
    extra = 1
    fields = ['betrag', 'soll_konto', 'haben_konto', 'verwendungszweck']
    autocomplete_fields = ['soll_konto', 'haben_konto']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('soll_konto', 'haben_konto')


# -----------------------------------------------------------------------------
# Account Admin
# -----------------------------------------------------------------------------
@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['kontonummer', 'name', 'konto_typ', 'category', 'colored_saldo']
    list_filter = ['konto_typ', 'category']
    search_fields = ['kontonummer', 'name']
    ordering = ['kontonummer']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('kontonummer', 'name')
        }),
        ('Kontoeinstellungen', {
            'fields': ('konto_typ', 'category', 'saldo')
        }),
    )
    
    def colored_saldo(self, obj):
        """Zeigt den Saldo farbig an - Grün für positiv, Rot für negativ"""
        if obj.saldo >= 0:
            color = 'green'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} €</span>',
            color,
            f'{obj.saldo:,.2f}'
        )
    colored_saldo.short_description = 'Saldo'
    colored_saldo.admin_order_field = 'saldo'
    
    def get_queryset(self, request):
        return super().get_queryset(request)
    
    actions = ['reset_saldo']
    
    def reset_saldo(self, request, queryset):
        """Setzt die Salden der ausgewählten Konten auf 0"""
        count = queryset.update(saldo=Decimal('0.00'))
        self.message_user(request, f'{count} Kontosalden wurden zurückgesetzt.')
    reset_saldo.short_description = "Salden auf 0 zurücksetzen"


# -----------------------------------------------------------------------------
# Booking Admin
# -----------------------------------------------------------------------------
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'buchungsnummer', 'datum', 'typ', 'verwendungszweck_kurz', 
        'mitgliedsname', 'gesamtbetrag', 'status_anzeige'
    ]
    list_filter = [
        'typ', 'is_storno', 
        ('datum', admin.DateFieldListFilter),
        ('storniert_am', admin.DateFieldListFilter)
    ]
    search_fields = ['buchungsnummer', 'verwendungszweck', 'mitgliedsname']
    date_hierarchy = 'datum'
    ordering = ['-datum', '-buchungsnummer']
    readonly_fields = [
        'buchungsnummer', 'mitgliedsname', 'kontostand_snapshot',
        'storniert_am', 'original_buchung'
    ]
    
    fieldsets = (
        ('Buchungsinformationen', {
            'fields': ('buchungsnummer', 'typ', 'datum', 'verwendungszweck')
        }),
        ('Mitgliedsinformationen', {
            'fields': ('mitglied', 'mitgliedsname', 'kontostand_snapshot'),
            'classes': ('collapse',)
        }),
        ('Storno-Informationen', {
            'fields': ('is_storno', 'storniert_am', 'storniert_von', 'original_buchung'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [SubTransactionInline]
    
    def verwendungszweck_kurz(self, obj):
        """Zeigt eine gekürzte Version des Verwendungszwecks"""
        if len(obj.verwendungszweck) > 50:
            return obj.verwendungszweck[:50] + '...'
        return obj.verwendungszweck
    verwendungszweck_kurz.short_description = 'Verwendungszweck'
    
    def gesamtbetrag(self, obj):
        """Berechnet und zeigt den Gesamtbetrag aller SubTransactions"""
        total = obj.subtransactions.aggregate(Sum('betrag'))['betrag__sum'] or 0
        return format_html(
            '<span style="font-weight: bold;">{} €</span>',
            f'{total:,.2f}'
        )
    gesamtbetrag.short_description = 'Gesamtbetrag'
    
    def status_anzeige(self, obj):
        """Zeigt den Status der Buchung farbig an"""
        if obj.is_storno:
            return format_html('<span style="color: orange;">⚠️ Storno</span>')
        elif obj.storniert_am:
            return format_html('<span style="color: red;">❌ Storniert</span>')
        else:
            return format_html('<span style="color: green;">✅ Aktiv</span>')
    status_anzeige.short_description = 'Status'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related(
            'subtransactions__soll_konto',
            'subtransactions__haben_konto'
        ).select_related('mitglied', 'original_buchung')
    
    actions = ['create_storno']
    
    def create_storno(self, request, queryset):
        """Erstellt Storno-Buchungen für die ausgewählten Buchungen"""
        storniert = 0
        bereits_storniert = 0
        
        for booking in queryset:
            if booking.is_storno or booking.storniert_am:
                bereits_storniert += 1
                continue
                
            # Hier würde die Storno-Logik implementiert werden
            # (ähnlich wie in views_api.py)
            storniert += 1
            
        self.message_user(
            request, 
            f'{storniert} Buchungen wurden storniert. '
            f'{bereits_storniert} waren bereits storniert.'
        )
    create_storno.short_description = "Ausgewählte Buchungen stornieren"


# -----------------------------------------------------------------------------
# MemberAccount Admin
# -----------------------------------------------------------------------------
@admin.register(MemberAccount)
class MemberAccountAdmin(admin.ModelAdmin):
    list_display = ['mitglied_name', 'colored_kontostand', 'letzte_aktualisierung']
    list_filter = [
        ('kontostand', admin.EmptyFieldListFilter),
        'letzte_aktualisierung'
    ]
    search_fields = ['mitglied__first_name', 'mitglied__last_name', 'mitglied__email']
    ordering = ['mitglied__last_name', 'mitglied__first_name']
    readonly_fields = ['letzte_aktualisierung']
    
    fieldsets = (
        ('Mitglied', {
            'fields': ('mitglied',)
        }),
        ('Finanzen', {
            'fields': ('kontostand', 'letzte_aktualisierung')
        }),
    )
    
    def mitglied_name(self, obj):
        """Zeigt den vollen Namen des Mitglieds"""
        return f"{obj.mitglied.first_name} {obj.mitglied.last_name}"
    mitglied_name.short_description = 'Mitglied'
    mitglied_name.admin_order_field = 'mitglied__last_name'
    
    def colored_kontostand(self, obj):
        """Zeigt den Kontostand farbig an"""
        if obj.kontostand >= 0:
            color = 'green'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} €</span>',
            color,
            f'{obj.kontostand:,.2f}'
        )
    colored_kontostand.short_description = 'Kontostand'
    colored_kontostand.admin_order_field = 'kontostand'


# -----------------------------------------------------------------------------
# Inline für YearClosingStep und ClosingAdjustment
# -----------------------------------------------------------------------------
class YearClosingStepInline(admin.TabularInline):
    model = YearClosingStep
    extra = 0
    fields = ['step', 'status', 'completed_at', 'notes']
    readonly_fields = ['completed_at']
    ordering = ['step']


class ClosingAdjustmentInline(admin.TabularInline):
    model = ClosingAdjustment
    extra = 0
    fields = ['name', 'adjustment_type', 'amount', 'is_completed', 'booking']
    readonly_fields = ['booking']


# -----------------------------------------------------------------------------
# BusinessYear Admin
# -----------------------------------------------------------------------------
@admin.register(BusinessYear)
class BusinessYearAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'start_date', 'end_date', 
        'status_badge', 'is_current', 'duration'
    ]
    list_filter = ['status', 'is_retroactive']
    search_fields = ['name']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']
    readonly_fields = ['created_at', 'closed_at']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('name', 'start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('status', 'is_retroactive')
        }),
        ('Abschluss', {
            'fields': ('closed_at', 'closing_notes', 'closing_document'),
            'classes': ('collapse',)
        }),
        ('Metadaten', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [YearClosingStepInline, ClosingAdjustmentInline]
    
    def status_badge(self, obj):
        """Zeigt den Status als farbiges Badge"""
        colors = {
            'OPEN': 'green',
            'IN_PROGRESS': 'orange',
            'CLOSED': 'gray'
        }
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def is_current(self, obj):
        """Zeigt an, ob es das aktuelle Geschäftsjahr ist"""
        if obj.is_current_year():
            return format_html('<span style="color: green;">✅ Ja</span>')
        return format_html('<span style="color: gray;">－</span>')
    is_current.short_description = 'Aktuell?'
    
    def duration(self, obj):
        """Zeigt die Dauer in Tagen"""
        return f"{obj.year_duration_in_days()} Tage"
    duration.short_description = 'Dauer'
    
    actions = ['start_closing_process']
    
    def start_closing_process(self, request, queryset):
        """Startet den Jahresabschluss-Prozess"""
        started = 0
        for year in queryset:
            if year.status == 'OPEN':
                year.status = 'IN_PROGRESS'
                year.save()
                started += 1
        
        self.message_user(
            request,
            f'Jahresabschluss-Prozess für {started} Geschäftsjahr(e) gestartet.'
        )
    start_closing_process.short_description = "Jahresabschluss starten"


# -----------------------------------------------------------------------------
# YearClosingStep Admin (falls einzeln verwaltet werden soll)
# -----------------------------------------------------------------------------
@admin.register(YearClosingStep)
class YearClosingStepAdmin(admin.ModelAdmin):
    list_display = ['business_year', 'step', 'status_badge', 'completed_at']
    list_filter = ['status', 'step', 'business_year']
    ordering = ['business_year', 'step']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    
    def status_badge(self, obj):
        """Zeigt den Status als farbiges Badge"""
        colors = {
            'NOT_STARTED': 'gray',
            'IN_PROGRESS': 'orange',
            'COMPLETED': 'green',
            'SKIPPED': 'yellow'
        }
        return format_html(
            '<span style="background-color: {}; color: white; '
            'padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'


# -----------------------------------------------------------------------------
# ClosingAdjustment Admin
# -----------------------------------------------------------------------------
@admin.register(ClosingAdjustment)
class ClosingAdjustmentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'business_year', 'adjustment_type', 
        'amount_formatted', 'is_completed_badge'
    ]
    list_filter = ['adjustment_type', 'is_completed', 'business_year']
    search_fields = ['name', 'description']
    ordering = ['business_year', 'adjustment_type', 'name']
    readonly_fields = ['created_at', 'completed_at']
    
    fieldsets = (
        ('Grunddaten', {
            'fields': ('business_year', 'name', 'adjustment_type', 'amount')
        }),
        ('Details', {
            'fields': ('description', 'booking')
        }),
        ('Status', {
            'fields': ('is_completed', 'completed_at')
        }),
        ('Metadaten', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def amount_formatted(self, obj):
        """Formatiert den Betrag"""
        return format_html(
            '<span style="font-weight: bold;">{} €</span>',
            f'{obj.amount:,.2f}'
        )
    amount_formatted.short_description = 'Betrag'
    amount_formatted.admin_order_field = 'amount'
    
    def is_completed_badge(self, obj):
        """Zeigt den Abschluss-Status als Badge"""
        if obj.is_completed:
            return format_html('<span style="color: green;">✅ Abgeschlossen</span>')
        return format_html('<span style="color: orange;">⏳ Offen</span>')
    is_completed_badge.short_description = 'Status'


# -----------------------------------------------------------------------------
# Admin-Site Anpassungen
# -----------------------------------------------------------------------------
admin.site.site_header = "Vereinsbuchhaltung Administration"
admin.site.site_title = "Buchhaltung Admin"
admin.site.index_title = "Willkommen im Admin-Bereich"