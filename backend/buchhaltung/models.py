from django.db import models
from django.utils.timezone import now
from decimal import Decimal
from members.models import Member

class Account(models.Model):
    KONTO_TYPEN = [
        ('AKTIV', 'Aktivkonto'),
        ('PASSIV', 'Passivkonto'),
        ('ERTRAG', 'Ertragskonto'),
        ('AUFWAND', 'Aufwandskonto'),
    ]

    kontonummer = models.CharField(max_length=20, unique=True, verbose_name="Kontonummer")
    name = models.CharField(max_length=255, verbose_name="Kontoname")
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name="Saldo")
    konto_typ = models.CharField(max_length=10, choices=KONTO_TYPEN, default='AKTIV', verbose_name="Kontotyp")
    category = models.CharField(max_length=255, blank=True, null=True, verbose_name="Kategorie")

    def __str__(self):
        return f"{self.kontonummer} - {self.name} ({self.get_konto_typ_display()})"

class Booking(models.Model):
    BUCHUNGSTYPEN = [
        ('EINZEL', 'Einzelbuchung'),
        ('MEHRFACH', 'Mehrfachbuchung'),
        ('MITGLIEDSBEITRAG', 'Mitgliedsbeitragseinzahlung'),
        ('FOERDERKREDIT', 'Förderkrediteinzahlung'),
    ]

    buchungsnummer = models.CharField(
        max_length=20, 
        unique=True, 
        default="TEMP-000",  # Temporärer Standardwert
        verbose_name="Buchungsnummer"
    )

    typ = models.CharField(max_length=20, choices=BUCHUNGSTYPEN, default='EINZEL', verbose_name="Buchungstyp")
    datum = models.DateTimeField(default=now, verbose_name="Buchungsdatum")
    is_storno = models.BooleanField(default=False)
    storniert_am = models.DateTimeField(null=True, blank=True)
    storniert_von = models.ForeignKey("members.Member", null=True, blank=True, on_delete=models.SET_NULL, related_name="stornobuchungen")
    original_buchung = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="storno_versionen")
    mitglied = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Mitglied")
    verwendungszweck = models.TextField(verbose_name="Verwendungszweck")
    # Neue Felder für den Snapshot des Mitgliedszustandes:
    mitgliedsname = models.CharField(max_length=255, blank=True, null=True, verbose_name="Mitgliedsname")
    kontostand_snapshot = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name="Kontostand")
    foerderkredit_stand = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name="Förderkredit-Stand")

    def __str__(self):
        return f"Buchung {self.id} ({self.typ}) - {self.verwendungszweck}"

    def save(self, *args, **kwargs):
        if self.mitglied:
            self.mitgliedsname = f"{self.mitglied.first_name} {self.mitglied.last_name}"
            from .models import MemberAccount
            try:
                member_account = MemberAccount.objects.get(mitglied=self.mitglied)
                self.kontostand_snapshot = member_account.kontostand
                self.foerderkredit_stand = member_account.foerderkredit_guthaben
            except MemberAccount.DoesNotExist:
                self.kontostand_snapshot = Decimal("0.00")
                self.foerderkredit_stand = Decimal("0.00")
        super().save(*args, **kwargs)

class SubTransaction(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="subtransactions")
    betrag = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Betrag")
    soll_konto = models.ForeignKey(Account, related_name="soll_buchungen", on_delete=models.CASCADE, verbose_name="Soll-Konto")
    haben_konto = models.ForeignKey(Account, related_name="haben_buchungen", on_delete=models.CASCADE, verbose_name="Haben-Konto")
    verwendungszweck = models.TextField(verbose_name="Verwendungszweck", blank=True, null=True)
    laufende_nummer = models.CharField(max_length=10, blank=True, null=True, verbose_name="Laufende Nummer")
    buchungsnummer_sub = models.CharField(max_length=30, blank=True, null=True, verbose_name="Sub-Buchungsnummer")

    def __str__(self):
        return f"{self.betrag} EUR von {self.soll_konto} nach {self.haben_konto}"


class MemberAccount(models.Model):
    """
    Speichert den Finanzstatus eines Mitglieds, inklusive Kontostand und Förderkredit-Guthaben.
    """
    mitglied = models.OneToOneField(Member, on_delete=models.CASCADE, verbose_name="Mitglied")
    kontostand = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name="Kontostand")
    foerderkredit_guthaben = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name="Förderkredit-Guthaben")
    letzte_aktualisierung = models.DateTimeField(auto_now=True, verbose_name="Letzte Aktualisierung")

    def __str__(self):
        return f"{self.mitglied.first_name} {self.mitglied.last_name} - {self.kontostand} EUR"
