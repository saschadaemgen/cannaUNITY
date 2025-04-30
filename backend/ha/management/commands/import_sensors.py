# backend/ha/management/commands/import_sensors.py

import os
import requests
import urllib3
from django.core.management.base import BaseCommand

# Warnung zu selbstsignierten UniFi-Zertifikaten unterdrücken
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Umgebungsvariablen laden
PROTECT_URL = os.getenv("PROTECT_URL")
USERNAME    = os.getenv("PROTECT_USER")
PASSWORD    = os.getenv("PROTECT_PASS")

class Command(BaseCommand):
    help = "Zeigt alle UniFi Protect Sensoren im Terminal an."

    def handle(self, *args, **options):
        print("🔐 Anmeldung bei UniFi Protect...")

        # Schritt 1: Login
        login_resp = requests.post(
            f"{PROTECT_URL}/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={"username": USERNAME, "password": PASSWORD},
            verify=False
        )

        if login_resp.status_code != 200:
            print("❌ Login fehlgeschlagen!")
            return

        cookies = login_resp.cookies
        print("✅ Login erfolgreich.")

        # Schritt 2: Bootstrap-Daten abrufen
        print("📡 Lade Sensor-Daten...")

        resp = requests.get(
            f"{PROTECT_URL}/proxy/protect/api/bootstrap",
            headers={"Accept": "application/json"},
            cookies=cookies,
            verify=False
        )

        if resp.status_code != 200:
            print("❌ Fehler beim Abruf der Bootstrap-Daten!")
            return

        data = resp.json()
        sensors = data.get("sensors", [])

        if not sensors:
            print("⚠️ Keine Sensoren gefunden.")
            return

        print(f"📦 {len(sensors)} Sensoren gefunden:\n")

        for s in sensors:
            name = s.get("name", "Unbenannt")
            typ  = s.get("type", "unbekannt")
            temp = s.get("stats", {}).get("temperature", {}).get("value")
            hum  = s.get("stats", {}).get("humidity", {}).get("value")

            print(f"- {name} ({typ})")
            print(f"    🌡 Temperatur: {temp if temp is not None else '–'} °C")
            print(f"    💧 Luftfeuchte: {hum if hum is not None else '–'} %\n")
