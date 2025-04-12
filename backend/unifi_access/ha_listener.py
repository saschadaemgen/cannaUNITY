import asyncio
import json
import websockets
import os
import datetime
from threading import Thread

from django.conf import settings
from dotenv import load_dotenv
from django.utils import timezone
from asgiref.sync import sync_to_async
from unifi_access.models import AccessEvent

# Globale Status-Flags
if not hasattr(settings, 'HA_WEBSOCKET_CONNECTED'):
    settings.HA_WEBSOCKET_CONNECTED = False

if not hasattr(settings, 'HA_LAST_CONNECTION_TIME'):
    settings.HA_LAST_CONNECTION_TIME = None

# .env-Datei laden
load_dotenv()

# Token & API-URL aus Umgebungsvariablen lesen
HA_ACCESS_TOKEN = os.getenv('HOME_ASSISTANT_ACCESS_TOKEN')
HA_API_URL = os.getenv('HOME_ASSISTANT_API_URL')

# WebSocket-URL aus API-URL ableiten
def get_websocket_url():
    if HA_API_URL.startswith("http://"):
        return HA_API_URL.replace("http://", "ws://") + "/api/websocket"
    elif HA_API_URL.startswith("https://"):
        return HA_API_URL.replace("https://", "wss://") + "/api/websocket"
    return "ws://" + HA_API_URL + "/api/websocket"

# Event speichern
def create_access_event(actor, door, event_type, authentication=None):
    try:
        event = AccessEvent.objects.create(
            actor=actor,
            door=door,
            event_type=event_type,
            authentication=authentication
        )
        print(f"✅ Ereignis gespeichert: #{event.id}")
        return event.id
    except Exception as e:
        print("❗ Fehler beim Speichern in DB:", e)
        return None

create_access_event_async = sync_to_async(create_access_event)

# Listener für WebSocket
async def listen_to_home_assistant():
    print("💡 WebSocket-Listener wird vorbereitet...")
    websocket_url = get_websocket_url()
    reconnect_delay = 5
    attempt = 0

    while True:
        attempt += 1
        print(f"🔁 Verbindungsversuch #{attempt} zu {websocket_url}...")

        try:
            async with websockets.connect(websocket_url) as ws:
                print("✅ WebSocket-Verbindung hergestellt.")
                settings.HA_WEBSOCKET_CONNECTED = True
                settings.HA_LAST_CONNECTION_TIME = timezone.now()

                await ws.recv()
                await ws.send(json.dumps({
                    "type": "auth",
                    "access_token": HA_ACCESS_TOKEN
                }))

                auth_response = json.loads(await ws.recv())
                if auth_response.get("type") != "auth_ok":
                    print("❌ Authentifizierung fehlgeschlagen!")
                    settings.HA_WEBSOCKET_CONNECTED = False
                    await asyncio.sleep(reconnect_delay)
                    continue

                await ws.send(json.dumps({
                    "id": 1,
                    "type": "subscribe_events",
                    "event_type": "unifi_access_entry"
                }))
                print("📡 Abonnement erfolgreich.")

                ping_counter = 0

                while True:
                    try:
                        if ping_counter >= 60:
                            ping_id = int(datetime.datetime.now().timestamp())
                            await ws.send(json.dumps({"id": ping_id, "type": "ping"}))
                            ping_counter = 0

                        message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                        data = json.loads(message)

                        if data.get("type") == "event" and data.get("event", {}).get("event_type") == "unifi_access_entry":
                            try:
                                event_data = data.get("event", {})
                                data_field = event_data.get("data", {})

                                actor = data_field.get("actor") or "Unbekannt"
                                door = data_field.get("door_name") or "Unbekannte Tür"
                                auth_method = data_field.get("authentication") or "Unbekannt"
                                event_type = event_data.get("event_type") or "unifi_access_entry"

                                print(f"🔓 RFID-Event erkannt: {actor} an {door} mit {auth_method}")
                                await create_access_event_async(actor, door, event_type, auth_method)

                            except Exception as e:
                                print("❗ Fehler beim Verarbeiten eines Events:", e)

                    except asyncio.TimeoutError:
                        ping_counter += 1
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("🔌 Verbindung verloren – neuer Versuch...")
                        settings.HA_WEBSOCKET_CONNECTED = False
                        break
                    except Exception as e:
                        print("⚠️ Fehler in der Event-Schleife:", e)
                        continue

        except Exception as e:
            print("❗ Listener konnte nicht starten:", e)
            settings.HA_WEBSOCKET_CONNECTED = False

        wait_time = min(reconnect_delay * (attempt % 5 + 1), 60)
        print(f"⏳ Warten {wait_time}s vor erneutem Versuch...")
        await asyncio.sleep(wait_time)

# Startfunktion beim Django-Start
def start_listener():
    print("🚀 Starte WebSocket-Listener in Hintergrund-Thread...")
    def run_async_loop():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(listen_to_home_assistant())
        except Exception as e:
            print("❗ Fehler im Async-Thread:", e)

    Thread(target=run_async_loop, daemon=True, name="HA-WebSocket-Listener").start()

# Direktstart (optional)
if __name__ == "__main__":
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cannaUNITY.settings')
    django.setup()
    try:
        asyncio.run(listen_to_home_assistant())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print("❗ Fehler im Direktstart:", e)
