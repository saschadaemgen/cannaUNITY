# backend/unifi_api_debug/services.py
import requests
from django.conf import settings
from django.core.cache import cache
from rooms.models import Room
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class UnifiAccessService:
    def __init__(self):
        self.base_url = f"{settings.UNIFI_ACCESS_HOST}/api/v1/developer"
        self.headers = {
            "Authorization": f"Bearer {settings.UNIFI_ACCESS_TOKEN}",
            "Accept": "application/json",
        }
    
    def get_devices(self):
        """Holt alle verfügbaren UniFi Access Devices"""
        cache_key = "unifi_devices"
        cached = cache.get(cache_key)
        
        if cached:
            return cached
            
        try:
            response = requests.get(
                f"{self.base_url}/devices",
                headers=self.headers,
                verify=False
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("code") == "SUCCESS":
                    devices_nested = result.get("data", [])
                    
                    # Flache die verschachtelte Liste ab!
                    devices = []
                    for device_group in devices_nested:
                        if isinstance(device_group, list):
                            # Es ist eine Liste von Devices
                            devices.extend(device_group)
                        elif isinstance(device_group, dict):
                            # Es ist ein einzelnes Device
                            devices.append(device_group)
                    
                    # Cache für 5 Minuten
                    cache.set(cache_key, devices, 300)
                    return devices
                    
        except Exception as e:
            print(f"Fehler beim Abrufen der Devices: {e}")
            
        return []
    
    def get_device_assignments(self):
        """Gibt zurück welche Devices bereits Räumen zugeordnet sind"""
        assignments = {}
        rooms = Room.objects.exclude(unifi_device_id__isnull=True).exclude(unifi_device_id='')
        
        for room in rooms:
            assignments[room.unifi_device_id] = {
                'room_id': room.id,
                'room_name': room.name
            }
        
        return assignments