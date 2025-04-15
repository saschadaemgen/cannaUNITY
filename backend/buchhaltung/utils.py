from decimal import Decimal
from django.utils.timezone import now
from django.db.models import Max
from .models import Booking  # Sicherstellen, dass Booking importiert ist

# -----------------------------------------------------------------------------
# View zur Erstellung vom Buchungs Nummern
# -----------------------------------------------------------------------------

def generate_booking_number(is_multiple=False):
    today_str = now().strftime("%Y%m%d")
    last_booking = Booking.objects.filter(buchungsnummer__startswith=today_str).aggregate(Max("buchungsnummer"))

    if last_booking["buchungsnummer__max"]:
        last_number = int(last_booking["buchungsnummer__max"].split("-")[1])
    else:
        last_number = 0

    buchungsnummer = f"{today_str}-{last_number + 1:03d}"

    # Falls es eine Mehrfachbuchung ist, hänge "-M" an
    if is_multiple:
        buchungsnummer += "-M"

    return buchungsnummer


STANDARD_KONTORAHMEN = [
    # 1. Erträge (Einnahmen)
    ("4000", "Mitgliedsbeiträge", "ERTRAG", "1. Erträge (Einnahmen)", Decimal("0.00")),
    ("4010", "Erlöse aus Samen- & Stecklingsverkauf (19% MwSt)", "ERTRAG", "1. Erträge (Einnahmen)", Decimal("0.00")),
    ("4020", "Sonstige betriebliche Erträge", "ERTRAG", "1. Erträge (Einnahmen)", Decimal("0.00")),
    ("4900", "Ertrag aus Förderkreditbonus (zweckgebunden für Mitgliedsbeiträge)", "ERTRAG", "1. Erträge (Einnahmen)", Decimal("0.00")),

    # 2. Finanzkonten (Kasse, Bank, Online-Zahlung)
    ("1000", "Hauptkasse", "AKTIV", "2. Finanzkonten (Kasse, Bank, Online-Zahlung)", Decimal("0.00")),
    ("1200", "Bankkonto", "AKTIV", "2. Finanzkonten (Kasse, Bank, Online-Zahlung)", Decimal("0.00")),
    ("1210", "PayPal Business Konto", "AKTIV", "2. Finanzkonten (Kasse, Bank, Online-Zahlung)", Decimal("0.00")),

    # 3. Förderkredite & Rückzahlungen
    ("2100", "Vereinsförderkredite", "PASSIV", "3. Förderkredite & Rückzahlungen", Decimal("0.00")),
    ("2101", "Bonus Förderkredite", "PASSIV", "3. Förderkredite & Rückzahlungen", Decimal("0.00")),
    ("2200", "Rückzahlungen Vereinsförderkredite", "PASSIV", "3. Förderkredite & Rückzahlungen", Decimal("0.00")),

    # 4. Material- & Warenaufwand
    ("3100", "Wareneinkauf (Stecklinge, Erde, Dünger)", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("3200", "Sonstige Betriebsausgaben (Büromaterial, Software, etc.)", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("3210", "Einkauf von Verbrauchsmaterialien (Büro, Reinigungsmittel)", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("5010", "Einkauf von Substraten (Rockwool, Erde, Kokos)", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("5020", "Einkauf von Düngemitteln & Nährstoffen", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("5030", "Einkauf von Pflanzenschutzmitteln", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),
    ("5040", "Einkauf von Verbrauchsmaterialien (Handschuhe, Desinfektionsmittel)", "AUFWAND", "4. Material- & Warenaufwand", Decimal("0.00")),

    # 5. Betriebskosten (Fixkosten & Nebenkosten)
    ("5100", "Mietkosten für Anbauflächen & Gebäude", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5101", "Mietkosten für das Hauptgebäude", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5110", "Mietkosten für das Café & Bistro", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5120", "Wasserkosten", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5121", "Abwasserkosten", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5122", "Müllentsorgungskosten", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5130", "Stromkosten für Beleuchtung & Betrieb", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),
    ("5140", "Gaskosten (falls vorhanden)", "AUFWAND", "5. Betriebskosten (Fixkosten & Nebenkosten)", Decimal("0.00")),

    # 6. Technische Anlagen & Maschinen
    ("5200", "Kosten für Klimatisierung & Luftfilterung", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),
    ("5210", "Kosten für Bewässerungs- & Nährstoffanlage", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),
    ("5220", "Kosten für Lichtsysteme & Steuerungstechnik", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),
    ("5230", "Wartung & Instandhaltung technischer Anlagen", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),
    ("5240", "Modernisierung & Erneuerung von Geräten", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),
    ("5250", "Ersatzteile & Reparaturen", "AUFWAND", "6. Technische Anlagen & Maschinen", Decimal("0.00")),

    # 7. Sicherheit & Überwachung
    ("5300", "Kosten für Videoüberwachung & Alarmsysteme", "AUFWAND", "7. Sicherheit & Überwachung", Decimal("0.00")),
    ("5310", "Kosten für Zutrittskontrollen & Türsysteme", "AUFWAND", "7. Sicherheit & Überwachung", Decimal("0.00")),
    ("5320", "Sicherheitsdienst oder externe Sicherheitsmaßnahmen", "AUFWAND", "7. Sicherheit & Überwachung", Decimal("0.00")),
    ("5330", "Wartung & Reparatur von Sicherheitssystemen", "AUFWAND", "7. Sicherheit & Überwachung", Decimal("0.00")),

    # 8. Personal- & Verwaltungskosten
    # 8.1. Löhne & Gehälter
    ("5400", "Gehälter Vollzeitkräfte", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    ("5401", "Sozialversicherungsabgaben für Vollzeitkräfte", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    ("5410", "Löhne für geringfügig Beschäftigte (Minijobs)", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    ("5411", "Sozialversicherungsabgaben für Minijobber", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    ("5420", "Ehrenamtspauschale (steuerfrei bis 3.000 €/Jahr)", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    ("5430", "Aufwandsentschädigungen für ehrenamtliche Helfer", "AUFWAND", "8.1. Löhne & Gehälter", Decimal("0.00")),
    
    # 8.2. Verwaltung & Sonstiges
    ("5440", "Weiterbildung & Schulungen für Mitarbeiter", "AUFWAND", "8.2. Verwaltung & Sonstiges", Decimal("0.00")),
    ("5450", "Kosten für externe Berater (Rechtsanwälte, Steuerberater)", "AUFWAND", "8.2. Verwaltung & Sonstiges", Decimal("0.00")),
    ("5460", "Software & IT-Kosten (Buchhaltung, Track-and-Trace)", "AUFWAND", "8.2. Verwaltung & Sonstiges", Decimal("0.00")),
    ("5470", "Büro- & Verwaltungskosten (Drucker, Papier, Schreibwaren)", "AUFWAND", "8.2. Verwaltung & Sonstiges", Decimal("0.00")),
    ("5480", "Kommunikationskosten (Telefon, Internet, Mobilfunk)", "AUFWAND", "8.2. Verwaltung & Sonstiges", Decimal("0.00")),

    # 9. Finanzierungskosten & Rücklagen (Ergänzungen für externe Darlehen)
    ("2500", "Externe Darlehen (Verbindlichkeiten)", "PASSIV", "9. Finanzierungskosten & Rücklagen", Decimal("0.00")),
    ("2510", "Langfristige Darlehen", "PASSIV", "9. Finanzierungskosten & Rücklagen", Decimal("0.00")),
    ("2520", "Kurzfristige Darlehen", "PASSIV", "9. Finanzierungskosten & Rücklagen", Decimal("0.00")),
    ("2530", "Privatdarlehen von Mitgliedern", "PASSIV", "9. Finanzierungskosten & Rücklagen", Decimal("0.00")),
    ("5500", "Tilgung & Zinsen für externe Darlehen", "AUFWAND", "9. Finanzierungskosten & Rücklagen", Decimal("0.00")),

    # 10. Forschung & Entwicklung
    ("5600", "Anschaffung & Wartung von Laborausrüstung", "AUFWAND", "10. Forschung & Entwicklung", Decimal("0.00")),
    ("5610", "Kosten für Laboranalysen (intern & extern)", "AUFWAND", "10. Forschung & Entwicklung", Decimal("0.00")),
    ("5620", "Kosten für DIN EN ISO/IEC 17025 Zertifizierung", "AUFWAND", "10. Forschung & Entwicklung", Decimal("0.00")),
    ("5630", "Entwicklung neuer Anbaumethoden & Optimierungen", "AUFWAND", "10. Forschung & Entwicklung", Decimal("0.00")),

    # 11. Bewirtung, Schulungen & Veranstaltungen
    ("6440", "Schulungskosten intern (Mitarbeiter- & Mitgliederschulungen)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6441", "Schulungsmaterialien (Handbücher, Präsentationen)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6442", "Externe Berater & Trainer für Schulungen", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6600", "Bewirtungskosten (100% abzugsfähig, intern)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6610", "Bewirtungskosten (70% abzugsfähig, externe Gäste)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6620", "Sonstige Aufmerksamkeiten (Kaffee, Wasser)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6700", "Veranstaltungskosten (intern, Mitgliederversammlungen)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6701", "Veranstaltungskosten (extern, Raum- & Technikmiete)", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),
    ("6702", "Catering & Verpflegung für Veranstaltungen", "AUFWAND", "11. Bewirtung, Schulungen & Veranstaltungen", Decimal("0.00")),

    # 12. Hausmeister- & Betriebsmittelkosten
    ("6800", "Hausmeistergehalt (falls angestellt)", "AUFWAND", "12. Hausmeister- & Betriebsmittelkosten", Decimal("0.00")),
    ("6810", "Werkzeuge & Geräte für den Hausmeister", "AUFWAND", "12. Hausmeister- & Betriebsmittelkosten", Decimal("0.00")),
    ("6820", "Betriebsmittel (Besen, Reinigungsmittel, Glühbirnen, Kleinmaterial)", "AUFWAND", "12. Hausmeister- & Betriebsmittelkosten", Decimal("0.00")),
    ("6830", "Instandhaltung & kleinere Reparaturen durch den Hausmeister", "AUFWAND", "12. Hausmeister- & Betriebsmittelkosten", Decimal("0.00")),

    # 13. Externe Dienstleistungen & Mieten
    ("6900", "Fremdleistungen allgemein (Reinigung, IT-Support etc.)", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6910", "Wartung & Reparaturen durch externe Firmen", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6920", "Technische Dienstleistungen (z. B. Kalibrierung, Elektroinstallationen)", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6930", "Beratungsleistungen (z. B. Steuerberater, Rechtsanwälte)", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6940", "Mietkosten für technische Anlagen & Maschinen (z. B. Klimaanlage)", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6950", "Mietkosten für Sicherheitstechnik (z. B. Alarmsysteme)", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6960", "Mietkosten für Büro- & Verwaltungstechnik", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),
    ("6965", "Leasing von Geräten & Maschinen", "AUFWAND", "13. Externe Dienstleistungen & Mieten", Decimal("0.00")),

    # 14. IT & Informationsmaterial
    ("6805", "Druckkosten für Informationsmaterial", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6806", "Online-Informationsverbreitung", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6807", "Veranstaltungskosten für Informationsveranstaltungen", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6808", "IT-Hardware & Ersatzteile", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6809", "IT-Sicherheitslösungen (Firewall, Antivirus, Backups)", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6905", "Serverkosten & Webhosting", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6906", "Programmierarbeiten & Softwareentwicklung", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),
    ("6907", "Lizenzkosten für Software", "AUFWAND", "14. IT & Informationsmaterial", Decimal("0.00")),

    # 15. Fahrzeugkosten & Leasing
    ("7000", "Leasingraten für Fahrzeuge", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),
    ("7010", "Kfz-Steuern für Vereinsfahrzeuge", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),
    ("7020", "Versicherung für Fahrzeuge", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),
    ("7030", "Treibstoffkosten (Benzin, Diesel, Strom)", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),
    ("7040", "Wartung & Reparaturen für Fahrzeuge", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),
    ("7050", "Ersatzteile & Zubehör für Fahrzeuge", "AUFWAND", "15. Fahrzeugkosten & Leasing", Decimal("0.00")),

    # 16. Gebäude & Infrastruktur
    ("7100", "Gebäudeversicherungen", "AUFWAND", "16. Gebäude & Infrastruktur", Decimal("0.00")),
    ("7110", "Reparaturen am Gebäude", "AUFWAND", "16. Gebäude & Infrastruktur", Decimal("0.00")),
    ("7120", "Wartung der Gebäudeinfrastruktur", "AUFWAND", "16. Gebäude & Infrastruktur", Decimal("0.00")),
    ("7130", "Außenanlagen & Grundstückspflege", "AUFWAND", "16. Gebäude & Infrastruktur", Decimal("0.00")),

    # 17. Steuerkonten (Vorsteuer & Umsatzsteuer)
    ("1576", "Vorsteuer 19%", "PASSIV", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)", Decimal("0.00")),
    ("1577", "Vorsteuer 7%", "PASSIV", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)", Decimal("0.00")),
    ("1776", "Umsatzsteuer 19%", "PASSIV", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)", Decimal("0.00")),
    ("1777", "Umsatzsteuer 7%", "PASSIV", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)", Decimal("0.00")),
    ("1790", "Umsatzsteuer-Zahllast (Verrechnungskonto)", "PASSIV", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)", Decimal("0.00")),
]

# Dropdown-Auswahl für die Kategorie
CATEGORY_CHOICES = [
    ("1. Erträge (Einnahmen)", "1. Erträge (Einnahmen)"),
    ("2. Finanzkonten (Kasse, Bank, Online-Zahlung)", "2. Finanzkonten (Kasse, Bank, Online-Zahlung)"),
    ("3. Förderkredite & Rückzahlungen", "3. Förderkredite & Rückzahlungen"),
    ("4. Material- & Warenaufwand", "4. Material- & Warenaufwand"),
    ("5. Betriebskosten (Fixkosten & Nebenkosten)", "5. Betriebskosten (Fixkosten & Nebenkosten)"),
    ("6. Technische Anlagen & Maschinen", "6. Technische Anlagen & Maschinen"),
    ("7. Sicherheit & Überwachung", "7. Sicherheit & Überwachung"),
    ("8.1. Löhne & Gehälter", "8.1. Löhne & Gehälter"),
    ("8.2. Verwaltung & Sonstiges", "8.2. Verwaltung & Sonstiges"),
    ("9. Finanzierungskosten & Rücklagen", "9. Finanzierungskosten & Rücklagen"),
    ("10. Forschung & Entwicklung", "10. Forschung & Entwicklung"),
    ("11. Bewirtung, Schulungen & Veranstaltungen", "11. Bewirtung, Schulungen & Veranstaltungen"),
    ("12. Hausmeister- & Betriebsmittelkosten", "12. Hausmeister- & Betriebsmittelkosten"),
    ("13. Externe Dienstleistungen & Mieten", "13. Externe Dienstleistungen & Mieten"),
    ("14. IT & Informationsmaterial", "14. IT & Informationsmaterial"),
    ("15. Fahrzeugkosten & Leasing", "15. Fahrzeugkosten & Leasing"),
    ("16. Gebäude & Infrastruktur", "16. Gebäude & Infrastruktur"),
    ("17. Steuerkonten (Vorsteuer & Umsatzsteuer)", "17. Steuerkonten (Vorsteuer & Umsatzsteuer)"),
]

# Feste Reihenfolge für die Sortierung mittels Case/When
CATEGORY_ORDER = {
    "1. Erträge (Einnahmen)": 1,
    "2. Finanzkonten (Kasse, Bank, Online-Zahlung)": 2,
    "3. Förderkredite & Rückzahlungen": 3,
    "4. Material- & Warenaufwand": 4,
    "5. Betriebskosten (Fixkosten & Nebenkosten)": 5,
    "6. Technische Anlagen & Maschinen": 6,
    "7. Sicherheit & Überwachung": 7,
    "8.1. Löhne & Gehälter": 8.1,
    "8.2. Verwaltung & Sonstiges": 8.2,
    "9. Finanzierungskosten & Rücklagen": 9,
    "10. Forschung & Entwicklung": 10,
    "11. Bewirtung, Schulungen & Veranstaltungen": 11,
    "12. Hausmeister- & Betriebsmittelkosten": 12,
    "13. Externe Dienstleistungen & Mieten": 13,
    "14. IT & Informationsmaterial": 14,
    "15. Fahrzeugkosten & Leasing": 15,
    "16. Gebäude & Infrastruktur": 16,
    "17. Steuerkonten (Vorsteuer & Umsatzsteuer)": 17,
}
