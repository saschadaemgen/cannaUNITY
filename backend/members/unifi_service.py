# /unifi_service.py
import requests
import time
import os
from django.conf import settings
from dotenv import load_dotenv

# Umgebungsvariablen laden
load_dotenv()

# Konfiguration aus Umgebungsvariablen oder settings.py auslesen
UNIFI_ACCESS_HOST = os.getenv("UNIFI_ACCESS_HOST") or getattr(settings, "UNIFI_ACCESS_HOST", "")
UNIFI_ACCESS_TOKEN = os.getenv("UNIFI_ACCESS_TOKEN") or getattr(settings, "UNIFI_ACCESS_TOKEN", "")

def create_unifi_user(member):
    """
    Legt einen neuen Benutzer in UniFi Access an und gibt dessen UniFi-ID zurück,
    wenn die Anfrage erfolgreich war. Ansonsten wird None zurückgegeben.
    
    Args:
        member: Das Member-Objekt mit den Benutzerdaten
        
    Returns:
        str: Die UniFi-ID oder None bei einem Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    data = {
        "first_name": member.first_name,
        "last_name": member.last_name,
        "user_email": member.email or f"user_{str(member.uuid).split('-')[0]}@verein.local",
        "onboard_time": int(time.time()),
        # Optional weitere Felder je nach UniFi-Konfiguration
    }
    
    try:
        response = requests.post(url, json=data, headers=headers, verify=False)
        if response.status_code in (200, 201):
            result = response.json()
            if result.get("code") == "SUCCESS":
                unifi_id = result["data"].get("id")
                print(f"✅ UniFi-Benutzer neu erstellt: {member.first_name} {member.last_name} mit ID {unifi_id}")
                return unifi_id
    except Exception as e:
        print(f"❌ Fehler beim Erstellen des UniFi-Benutzers: {str(e)}")
        
    return None


def update_unifi_user(member, unifi_id=None):
    """
    Aktualisiert einen bestehenden UniFi Access-Benutzer.
    
    Args:
        member: Das Member-Objekt mit den zu aktualisierenden Daten
        unifi_id: Optional die UniFi-ID, falls nicht im Member gespeichert
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    # Wenn keine UniFi-ID übergeben wurde, versuchen wir sie aus den Notizen zu extrahieren
    if not unifi_id:
        # UniFi-ID könnte in einem Notizfeld gespeichert sein
        notes = member.notes or ""
        import re
        match = re.search(r'UniFi-ID:\s*(\S+)', notes)
        if match:
            unifi_id = match.group(1)
        else:
            # Fallback zur UUID als Identifikationsgrundlage
            print("❌ Keine UniFi-ID gefunden, verwende UUID als Identifikation")
            # Dies würde nur funktionieren, wenn wir die ID basierend auf der UUID abrufen könnten
            # Dies ist eine vereinfachte Implementierung; in der Praxis wäre hier eine Abfrage an die UniFi API notwendig
            return False
    
    if not unifi_id:
        print("❌ UniFi-ID fehlt – keine Aktualisierung möglich")
        return False
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users/{unifi_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    data = {
        "first_name": member.first_name,
        "last_name": member.last_name,
        "user_email": member.email or f"user_{str(member.uuid).split('-')[0]}@verein.local",
        # Weitere Felder können je nach Bedarf ergänzt werden
    }
    
    try:
        response = requests.put(url, json=data, headers=headers, verify=False)
        if response.status_code in (200, 204):
            print(f"✅ UniFi-Benutzer aktualisiert: {member.first_name} {member.last_name} mit ID {unifi_id}")
            return True
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren des UniFi-Benutzers: {str(e)}")
        
    return False


def delete_unifi_user(member, unifi_id=None):
    """
    Deaktiviert den Benutzer in UniFi Access, indem der Status auf "DEACTIVATED" gesetzt wird.
    
    Args:
        member: Das Member-Objekt, dessen UniFi-Benutzer deaktiviert werden soll
        unifi_id: Optional die UniFi-ID, falls nicht im Member gespeichert
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    # Wenn keine UniFi-ID übergeben wurde, versuchen wir sie aus den Notizen zu extrahieren
    if not unifi_id:
        # UniFi-ID könnte in einem Notizfeld gespeichert sein
        notes = member.notes or ""
        import re
        match = re.search(r'UniFi-ID:\s*(\S+)', notes)
        if match:
            unifi_id = match.group(1)
        else:
            print("❌ Keine UniFi-ID gefunden")
            return False
    
    if not unifi_id:
        print("❌ UniFi-ID fehlt – keine Deaktivierung möglich")
        return False
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users/{unifi_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    data = {
        "status": "DEACTIVATED"
    }
    
    try:
        response = requests.put(url, json=data, headers=headers, verify=False)
        if response.status_code in (200, 204):
            print(f"🗑 UniFi-Benutzer mit ID {unifi_id} wurde deaktiviert.")
            return True
    except Exception as e:
        print(f"❌ Fehler beim Deaktivieren des UniFi-Benutzers: {str(e)}")
        
    return False


def update_user_avatar(member, unifi_id=None, avatar_url=None):
    """
    Aktualisiert den Avatar eines UniFi-Benutzers.
    
    Args:
        member: Das Member-Objekt, dessen Avatar aktualisiert werden soll
        unifi_id: Optional die UniFi-ID, falls nicht im Member gespeichert
        avatar_url: URL zum Avatar-Bild (optional)
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    # Wenn keine UniFi-ID übergeben wurde, versuchen wir sie aus den Notizen zu extrahieren
    if not unifi_id:
        # UniFi-ID könnte in einem Notizfeld gespeichert sein
        notes = member.notes or ""
        import re
        match = re.search(r'UniFi-ID:\s*(\S+)', notes)
        if match:
            unifi_id = match.group(1)
        else:
            print("❌ Keine UniFi-ID gefunden")
            return False
    
    if not unifi_id:
        print("❌ UniFi-ID fehlt – keine Avatar-Aktualisierung möglich")
        return False
    
    # Standard-Avatar-URL verwenden, falls keine übergeben wurde
    if not avatar_url:
        # Standard-Avatar, kann an Ihre spezifischen Anforderungen angepasst werden
        avatar_url = "https://www.example.com/default-avatar.png"
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users/{unifi_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    data = {
        "avatar_relative_path": avatar_url
    }
    
    try:
        response = requests.put(url, json=data, headers=headers, verify=False)
        if response.status_code in (200, 204):
            print(f"🖼️ Avatar für UniFi-Benutzer mit ID {unifi_id} wurde aktualisiert.")
            return True
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren des Avatars: {str(e)}")
        
    return False