from rest_framework import serializers
from .models import Booking, SubTransaction, Account, MemberAccount
from decimal import Decimal
from django.db import transaction
from django.utils.timezone import make_aware
from collections import defaultdict

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
