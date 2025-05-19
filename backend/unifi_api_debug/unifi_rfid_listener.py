# Datei: unifi_api_debug/unifi_rfid_listener.py

import asyncio
import httpx
import datetime
import traceback
from typing import Optional
from django.conf import settings

UNIFI_API_URL = f"{settings.UNIFI_ACCESS_HOST}/api/v1/developer"
UNIFI_API_TOKEN = settings.UNIFI_ACCESS_TOKEN
UNIFI_DEVICE_ID = settings.UNIFI_DEVICE_ID

print(f"🎩 Verwende Reader-ID: {UNIFI_DEVICE_ID} (geladen aus .env)")


async def poll_nfc_session(session_id: str, timeout: int = 30) -> Optional[str]:
    url = f"{UNIFI_API_URL}/credentials/nfc_cards/sessions/{session_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_API_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(verify=False) as client:
        start_time = datetime.datetime.now()
        while (datetime.datetime.now() - start_time).seconds < timeout:
            try:
                response = await client.get(url, headers=headers)
                print(f"📡 Polling-Antwort: {response.status_code} → {response.text}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "SUCCESS" and data.get("data", {}).get("token"):
                        print("✅ Token empfangen")
                        return data["data"]["token"]
            except Exception:
                print("❌ Fehler beim Polling:")
                traceback.print_exc()

            await asyncio.sleep(1)

    print("⚠️ Kein Token innerhalb der Timeout-Zeit empfangen.")
    return None


def get_token_from_reader(device_id: Optional[str] = None) -> Optional[str]:
    import requests

    device_id = device_id or UNIFI_DEVICE_ID

    url = f"{UNIFI_API_URL}/credentials/nfc_cards/sessions"
    headers = {
        "Authorization": f"Bearer {UNIFI_API_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {
        "device_id": device_id,
        "reset_ua_card": False,
    }

    try:
        print(f"🚀 Starte neue Session für Gerät: {device_id}")
        response = requests.post(url, json=body, headers=headers, verify=False)
        print(f"📡 Antwort von UniFi: {response.status_code} → {response.text}")

        if response.status_code == 200 and response.json().get("code") == "SUCCESS":
            session_id = response.json()["data"]["session_id"]

            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    coro = poll_nfc_session(session_id)
                    future = asyncio.run_coroutine_threadsafe(coro, loop)
                    return future.result()
            except RuntimeError:
                return asyncio.run(poll_nfc_session(session_id))

        print("❌ UniFi API hat keine Session-ID geliefert.")
        return None

    except Exception:
        print("❌ Fehler beim Starten der Session:")
        traceback.print_exc()
        return None
