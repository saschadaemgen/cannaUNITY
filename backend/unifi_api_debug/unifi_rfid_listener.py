# Datei: backend/unifi_api_debug/unifi_rfid_listener.py

import os
import time
import requests
from django.conf import settings
from dotenv import load_dotenv
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from django.core.cache import cache

load_dotenv()

UNIFI_BASE_URL = settings.UNIFI_ACCESS_HOST
UNIFI_API_URL = f"{UNIFI_BASE_URL}/api/v1/developer"
UNIFI_API_TOKEN = settings.UNIFI_ACCESS_TOKEN
UNIFI_DEVICE_ID = settings.UNIFI_DEVICE_ID

HEADERS = {
    "Authorization": f"Bearer {UNIFI_API_TOKEN}",
    "Accept": "application/json",
}

def resolve_and_store_user_from_token():
    token = get_token_from_reader()
    if not token:
        return None, None, None

    try:
        response = requests.get(f"{UNIFI_API_URL}/users", headers=HEADERS, verify=False)
        if response.status_code == 200:
            users = response.json().get("data", [])
            for user in users:
                for card in user.get("nfc_cards", []):
                    if card.get("token") == token:
                        user_id = user.get("id")
                        full_name = user.get("full_name")
                        save_recent_rfid_user(token, user_id)
                        return token, user_id, full_name  # 💡 ← Full Name zurückgeben
    except Exception:
        pass

    return token, None, None

def save_recent_rfid_user(token: str, user_id: str, duration=30):
    cache.set(f"rfid:{token}", user_id, timeout=duration)

def get_recent_rfid_user(token: str):
    return cache.get(f"rfid:{token}")

def get_token_from_reader():
    session_id = None

    try:
        response = requests.post(
            f"{UNIFI_API_URL}/credentials/nfc_cards/sessions",
            headers=HEADERS,
            json={"device_id": UNIFI_DEVICE_ID},
            verify=False,
        )
        if response.status_code == 200:
            session_id = response.json().get("data", {}).get("session_id")
    except Exception:
        return None

    if not session_id:
        return None

    token = None
    timeout = time.time() + 10  # Maximal 10 Sekunden warten
    while time.time() < timeout:
        try:
            response = requests.get(
                f"{UNIFI_API_URL}/credentials/nfc_cards/sessions/{session_id}",
                headers=HEADERS,
                verify=False,
            )
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == "SUCCESS":
                    data = result.get("data")
                    if data and "token" in data:
                        token = data["token"]
                        break
        except Exception:
            return None
        time.sleep(0.8)

    return token
