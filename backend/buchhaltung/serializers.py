from rest_framework import serializers
from .models import Booking, SubTransaction, Account, MemberAccount, BusinessYear, YearClosingStep, ClosingAdjustment
from decimal import Decimal
from django.db import transaction
from django.utils.timezone import make_aware
from collections import defaultdict
from django.db.models import Q

# Diese Version wird im Journal angezeigt – Name & Nummer der Konten
class KontoInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'kontonummer', 'name', 'konto_typ']

# Normales AccountSerializer (z. B. für Kontolisten & Verwaltung)
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            'id',
            'kontonummer',
            'name',
            'saldo',
            'konto_typ',
            'category',
        ]

# Für Untertransaktionen in einer Buchung
class SubTransactionSerializer(serializers.ModelSerializer):
    soll_konto = KontoInfoSerializer(read_only=True)
    haben_konto = KontoInfoSerializer(read_only=True)
    soll_konto_id = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), source='soll_konto', write_only=True)
    haben_konto_id = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), source='haben_konto', write_only=True)

    class Meta:
        model = SubTransaction
        fields = [
            'id', 'betrag',
            'soll_konto', 'haben_konto',
            'soll_konto_id', 'haben_konto_id',
            'verwendungszweck',
            'laufende_nummer',
            'buchungsnummer_sub'  # 👈 das hier ergänzt
        ]

# Die Haupt-Buchung mit allen Transaktionen
class BookingSerializer(serializers.ModelSerializer):
    subtransactions = SubTransactionSerializer(many=True)
    # Neue Felder hinzufügen, um Storno-Status und Referenzen besser zu verarbeiten
    storniert = serializers.SerializerMethodField()
    original_buchung_nr = serializers.SerializerMethodField()
    original_buchung_id = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'buchungsnummer',
            'datum',
            'typ',
            'verwendungszweck',
            'is_storno',
            'storniert',  # neu
            'original_buchung_nr',  # neu
            'original_buchung_id',  # neu
            'mitglied',
            'mitgliedsname',
            'kontostand_snapshot',
            'foerderkredit_stand',
            'subtransactions'
        ]
    
    def get_storniert(self, obj):
        # Eine Buchung gilt als storniert, wenn das storniert_am-Feld gesetzt ist
        return obj.storniert_am is not None
    
    def get_original_buchung_nr(self, obj):
        # Falls es eine Storno-Buchung ist, geben wir die Buchungsnummer der Original-Buchung zurück
        if obj.original_buchung:
            return obj.original_buchung.buchungsnummer
        return None
    
    def get_original_buchung_id(self, obj):
        # Falls es eine Storno-Buchung ist, geben wir die ID der Original-Buchung zurück
        if obj.original_buchung:
            return obj.original_buchung.id
        return None

    def create(self, validated_data):
        from .models import SubTransaction  # Sicherstellen, dass wir korrekt importieren
        sub_data = validated_data.pop('subtransactions', [])

        if validated_data.get('datum') and validated_data['datum'].tzinfo is None:
            validated_data['datum'] = make_aware(validated_data['datum'])

        # Automatische Buchungsnummer
        today_str = validated_data['datum'].strftime("%Y%m%d")
        last = Booking.objects.filter(buchungsnummer__startswith=today_str).order_by('-buchungsnummer').first()
        
        if last and '-' in last.buchungsnummer:
            # Extrahiere den numerischen Teil und ignoriere das "S" für Storno-Buchungen
            parts = last.buchungsnummer.split('-')
            if len(parts) > 1:
                # Entferne alle nicht-numerischen Zeichen (wie 'S')
                numeric_part = ''.join(c for c in parts[1] if c.isdigit())
                
                try:
                    last_number = int(numeric_part)
                    next_number = f"{last_number + 1:03d}"
                except ValueError:
                    # Falls aus irgendeinem Grund keine Zahl extrahiert werden kann
                    next_number = "001"
            else:
                next_number = "001"
        else:
            next_number = "001"
        
        validated_data['buchungsnummer'] = f"{today_str}-{next_number}"

        with transaction.atomic():
            booking = Booking.objects.create(**validated_data)

            for index, tx_data in enumerate(sub_data):
                soll_konto = Account.objects.select_for_update().get(pk=tx_data.pop('soll_konto').id)
                haben_konto = Account.objects.select_for_update().get(pk=tx_data.pop('haben_konto').id)
                laufende_nummer = f"M{index + 1}" if validated_data['typ'] == 'MEHRFACH' else ''
                buchungsnummer_sub = f"{validated_data['buchungsnummer']}-{laufende_nummer}" if laufende_nummer else ''

                tx = SubTransaction.objects.create(
                    booking=booking,
                    soll_konto=soll_konto,
                    haben_konto=haben_konto,
                    laufende_nummer=laufende_nummer,
                    buchungsnummer_sub=buchungsnummer_sub,
                    **tx_data
                )

                betrag = tx.betrag

                # Konten aktualisieren je nach Kontotyp
                if soll_konto.konto_typ in ['AKTIV', 'AUFWAND']:
                    soll_konto.saldo += Decimal(betrag)
                else:
                    soll_konto.saldo -= Decimal(betrag)

                if haben_konto.konto_typ in ['AKTIV', 'AUFWAND']:
                    haben_konto.saldo -= Decimal(betrag)
                else:
                    haben_konto.saldo += Decimal(betrag)

                soll_konto.save()
                haben_konto.save()

            # Mitgliedskonto aktualisieren
            mitglied = booking.mitglied
            if mitglied:
                try:
                    member_account = MemberAccount.objects.get(mitglied=mitglied)
                    member_account.kontostand += sum([tx.betrag for tx in booking.subtransactions.all()])
                    member_account.save()
                except MemberAccount.DoesNotExist:
                    pass

        return booking

# Für Statistiken oder Dashboards (z. B. GuV)
class BookingSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    monthly_data = serializers.ListField()

class YearClosingStepSerializer(serializers.ModelSerializer):
    step_display = serializers.CharField(source='get_step_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = YearClosingStep
        fields = [
            'id', 'business_year', 'step', 'step_display', 
            'status', 'status_display', 'created_at', 
            'updated_at', 'completed_at', 'notes'
        ]


class ClosingAdjustmentSerializer(serializers.ModelSerializer):
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)
    
    class Meta:
        model = ClosingAdjustment
        fields = [
            'id', 'business_year', 'name', 'adjustment_type', 
            'adjustment_type_display', 'description', 'booking', 
            'amount', 'is_completed', 'created_at', 'completed_at'
        ]


class BusinessYearSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    steps = YearClosingStepSerializer(source='closing_steps', many=True, read_only=True)
    adjustments = ClosingAdjustmentSerializer(many=True, read_only=True)
    is_current = serializers.BooleanField(source='is_current_year', read_only=True)
    duration_days = serializers.IntegerField(source='year_duration_in_days', read_only=True)
    
    class Meta:
        model = BusinessYear
        fields = [
            'id', 'name', 'start_date', 'end_date', 'status', 
            'status_display', 'is_retroactive', 'created_at', 
            'closed_at', 'closing_notes', 'closing_document',
            'steps', 'adjustments', 'is_current', 'duration_days'
        ]


class BusinessYearCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessYear
        fields = ['name', 'start_date', 'end_date', 'is_retroactive']
        
    def validate(self, data):
        """Prüft, ob die Daten für ein Geschäftsjahr gültig sind"""
        start_date = data['start_date']
        end_date = data['end_date']
        
        # Startdatum muss vor Enddatum liegen
        if start_date >= end_date:
            raise serializers.ValidationError("Das Startdatum muss vor dem Enddatum liegen.")
        
        # Prüfen, ob sich mit bestehendem Geschäftsjahr überschneidet
        overlapping = BusinessYear.objects.filter(
            Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
        ).exists()
        
        if overlapping:
            raise serializers.ValidationError(
                "Das Geschäftsjahr überschneidet sich mit einem bestehenden Geschäftsjahr."
            )
        
        return data
