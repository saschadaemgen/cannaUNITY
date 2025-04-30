# unifi_protect/protect_listener.py

import os
import time
import requests
import urllib3
import traceback
from dotenv import load_dotenv
from datetime import datetime

# Deaktiviere SSL-Warnungen für self-signed Zertifikate
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Umgebungsvariablen laden
load_dotenv()

# Konfigurationsvariablen
PROTECT_URL = os.getenv("PROTECT_URL")
USERNAME = os.getenv("PROTECT_USER")
PASSWORD = os.getenv("PROTECT_PASS")
API_URL = "http://localhost:8000/api/unifi_protect/sensors/"
INTERVAL_SECONDS = 300  # 5 Minuten

def get_sensors():
    """Ruft Sensordaten von UniFi Protect ab."""
    print("🔐 Anmeldung bei UniFi Protect...")

    try:
        # Login zum UniFi Protect System
        login_resp = requests.post(
            f"{PROTECT_URL}/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={"username": USERNAME, "password": PASSWORD},
            verify=False,
            timeout=10
        )

        if login_resp.status_code != 200:
            print(f"❌ Login-Fehler: {login_resp.status_code} {login_resp.text}")
            return []

        cookies = login_resp.cookies

        # Bootstrap-Daten abrufen (enthält alle Sensoren)
        resp = requests.get(
            f"{PROTECT_URL}/proxy/protect/api/bootstrap",
            headers={"Accept": "application/json"},
            cookies=cookies,
            verify=False,
            timeout=15  # Längerer Timeout für Bootstrap-Daten
        )

        if resp.status_code != 200:
            print(f"❌ Fehler beim Abrufen der Sensoren: {resp.status_code}")
            return []

        data = resp.json()
        return data.get("sensors", [])
    except Exception as e:
        print(f"❌ Fehler beim Abrufen der Sensoren: {str(e)}")
        print(traceback.format_exc())  # Ausführlicher Fehler für Debugging
        return []

def post_sensor(sensor):
    """Sendet Sensordaten an die Django-API."""
    payload = {
        "name": sensor.get("name"),
        "sensor_type": sensor.get("type"),
        "temperature": sensor.get("stats", {}).get("temperature", {}).get("value"),
        "humidity": sensor.get("stats", {}).get("humidity", {}).get("value"),
    }

    try:
        res = requests.post(API_URL, json=payload, timeout=5)
        if res.status_code not in (200, 201):
            print(f"⚠️ API-Fehler: {res.status_code} – {res.text}")
            return False
        return True
    except Exception as e:
        print(f"⚠️ POST fehlgeschlagen: {e}")
        print(traceback.format_exc())  # Ausführlicher Fehler für Debugging
        return False

def main():
    """Hauptschleife für Sensorabfrage und Datenübertragung."""
    print("🚀 Starte UniFi Protect Listener mit API-POST...")

    try:
        while True:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"⏰ {now} – Sensor-Abfrage gestartet")

            try:
                sensors = get_sensors()

                if sensors:
                    print(f"📦 {len(sensors)} Sensoren gefunden.")

                    for sensor in sensors:
                        name = sensor.get("name", "–")
                        typ = sensor.get("type", "–")
                        temp = sensor.get("stats", {}).get("temperature", {}).get("value")
                        hum = sensor.get("stats", {}).get("humidity", {}).get("value")

                        print(f"   → {name} ({typ}) – {temp}°C / {hum}%")

                        post_result = post_sensor(sensor)
                        # Da wir jetzt die create-Methode in der API aktualisiert haben,
                        # wird automatisch ein Historieneintrag erstellt - keine Änderung notwendig!
                        if post_result:
                            print(f"   ✅ Daten für {name} erfolgreich übertragen")
                        else:
                            print(f"   ❌ Fehler beim Übertragen der Daten für {name}")
                else:
                    print("⚠️ Keine Sensoren gefunden oder Fehler beim Abruf.")

                print("📡 Heartbeat gesendet.")
            except Exception as e:
                print(f"❌ Fehler im Hauptzyklus: {str(e)}")
                print(traceback.format_exc())  # Ausführlicher Fehler für Debugging
            
            # Warte bis zum nächsten Intervall
            print(f"⏱️ Warte {INTERVAL_SECONDS} Sekunden bis zur nächsten Abfrage...")
            time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\n🛑 Listener durch Benutzer beendet.")
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {str(e)}")
        print(traceback.format_exc())  # Ausführlicher Fehler für Debugging

if __name__ == "__main__":
    # Fehler abfangen und ausführlichere Meldungen ausgeben
    try:
        main()
    except Exception as e:
        print(f"❌ Kritischer Fehler: {str(e)}")
        print(traceback.format_exc())  # Ausführlicher Fehler für Debugging