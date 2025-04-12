# unifi_access/apps.py
from django.apps import AppConfig

class UnifiAccessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'unifi_access'
    
    def ready(self):
        import os
        print("🚀 [unifi_access] AppConfig.ready() wurde aufgerufen")

        if os.environ.get('RUN_MAIN', None) != 'true':
            print("⚠️  RUN_MAIN nicht true – Listener wird NICHT gestartet")
            return

        print("✅ RUN_MAIN erkannt – Starte WebSocket Listener...")

        from . import ha_listener
        ha_listener.start_listener()
