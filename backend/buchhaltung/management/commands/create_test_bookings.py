from django.core.management.base import BaseCommand
from django.utils.timezone import now, timedelta
from decimal import Decimal
import random
from datetime import date, datetime
from buchhaltung.models import Booking, SubTransaction, Account
from buchhaltung.utils import generate_booking_number

class Command(BaseCommand):
    help = "Erstellt 10 realistische Testbuchungen für einen Monat"

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 Lösche alte Buchungen...")
        Booking.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("✅ Alle alten Buchungen wurden gelöscht!"))

        # Konten zurücksetzen
        self.stdout.write("🔄 Setze Kontosalden zurück...")
        for konto in Account.objects.all():
            konto.saldo = Decimal("0.00")
            konto.save(update_fields=["saldo"])
        self.stdout.write(self.style.SUCCESS("✅ Alle Kontosalden wurden zurückgesetzt!"))

        self.stdout.write("📌 Erstelle 10 realistische Buchungen für diesen Monat...")

        # Konten laden
        konten_dict = {konto.kontonummer: konto for konto in Account.objects.all()}

        # Aktueller Monat
        today = now().date()
        start_date = today.replace(day=1)

        # 1️⃣ Mitgliedsbeiträge (Einnahme)
        self.create_booking(
            "4000", "Mitgliedsbeiträge", Decimal("5500.00"), konten_dict, start_date + timedelta(days=3)
        )

        # 2️⃣ Miete (Ausgabe)
        self.create_booking(
            "5100", "Miete für Vereinsgebäude", Decimal("2800.00"), konten_dict, start_date + timedelta(days=5), ausgabe=True
        )

        # 3️⃣ Stromkosten (Ausgabe)
        self.create_booking(
            "5130", "Stromkosten", Decimal("600.00"), konten_dict, start_date + timedelta(days=7), ausgabe=True
        )

        # 4️⃣ Wasser (Ausgabe)
        self.create_booking(
            "5120", "Wassergebühren", Decimal("200.00"), konten_dict, start_date + timedelta(days=9), ausgabe=True
        )

        # 5️⃣ Seminar-Einnahmen
        self.create_booking(
            "4020", "Seminargebühren", Decimal("1800.00"), konten_dict, start_date + timedelta(days=11)
        )

        # 6️⃣ Düngemittel & Nährstoffe (Ausgabe)
        self.create_booking(
            "5020", "Einkauf Düngemittel", Decimal("300.00"), konten_dict, start_date + timedelta(days=13), ausgabe=True
        )

        # 7️⃣ Verkauf von Stecklingen (Einnahme)
        self.create_booking(
            "4010", "Erlöse aus Stecklingsverkauf", Decimal("3200.00"), konten_dict, start_date + timedelta(days=15)
        )

        # 8️⃣ Internetkosten (Ausgabe)
        self.create_booking(
            "5480", "Internetkosten", Decimal("150.00"), konten_dict, start_date + timedelta(days=17), ausgabe=True
        )

        # 9️⃣ Bürobedarf (Ausgabe)
        self.create_booking(
            "3210", "Büromaterial", Decimal("120.00"), konten_dict, start_date + timedelta(days=19), ausgabe=True
        )

        # 🔟 Reinigungsdienstleistung (Ausgabe)
        self.create_booking(
            "6900", "Reinigungsservice Vereinsgebäude", Decimal("250.00"), konten_dict, start_date + timedelta(days=21), ausgabe=True
        )

        # Abschlussmeldung
        self.stdout.write(self.style.SUCCESS("\n🎉 10 Buchungen erfolgreich erstellt!"))

    def create_booking(self, konto, verwendungszweck, betrag, konten_dict, datum, ausgabe=False):
        """
        Erstellt eine einzelne Buchung mit Soll- und Haben-Konto
        """
        buchungsnummer = generate_booking_number()
        booking = Booking.objects.create(
            buchungsnummer=buchungsnummer,
            typ="EINZEL",
            verwendungszweck=verwendungszweck,
            datum=datetime.combine(datum, datetime.min.time()).replace(tzinfo=now().tzinfo)
        )

        soll_konto = konten_dict[konto] if ausgabe else konten_dict["1200"]
        haben_konto = konten_dict["1200"] if ausgabe else konten_dict[konto]

        SubTransaction.objects.create(
            booking=booking,
            betrag=betrag,
            soll_konto=soll_konto,
            haben_konto=haben_konto,
            verwendungszweck=verwendungszweck
        )

        # Salden aktualisieren
        soll_konto.saldo += betrag if ausgabe else -betrag
        haben_konto.saldo += -betrag if ausgabe else betrag
        soll_konto.save(update_fields=["saldo"])
        haben_konto.save(update_fields=["saldo"])

        self.stdout.write(self.style.SUCCESS(
            f"✅ {datum.strftime('%d.%m.%Y')} - {verwendungszweck}: {betrag} €"
        ))
