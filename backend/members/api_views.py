# /api_views.py
import os
import secrets
import string
import hashlib
import time
import re
from functools import wraps
from datetime import date
from django.db import connections, transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from . import models
from .models import Member
from .serializers import MemberSerializer
import requests
from dotenv import load_dotenv
from django.conf import settings

# Umgebungsvariablen laden
load_dotenv()

# ============================================================================
# 🧑‍💼 ALLGEMEINE HILFSFUNKTIONEN
# ============================================================================

def team_member_required(view_func):
    """
    Dekorator für Funktionen, die Teamleiter- oder Admin-Rechte erfordern.
    Vermeidet Codeduplikation bei der Berechtigungsprüfung.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.groups.filter(name__in=['teamleiter', 'admin']).exists():
            return Response(
                {"error": "Sie haben keine Berechtigung für diese Aktion."},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def extract_unifi_id(member, request_data=None):
    """
    Hilfsfunktion zum Extrahieren der UniFi-ID aus verschiedenen Quellen.
    Verbesserte Version mit zusätzlicher Fehlerbehandlung und Logging.
    """
    # Priorität 1: Aus der Anfrage
    if request_data and request_data.get('unifi_id'):
        unifi_id = request_data.get('unifi_id')
        print(f"✅ UniFi-ID aus Request-Daten extrahiert: {unifi_id}")
        return unifi_id
        
    # Priorität 2: Aus dem Member-Modell (falls Attribut existiert)
    if hasattr(member, 'unifi_id') and member.unifi_id:
        unifi_id = member.unifi_id
        print(f"✅ UniFi-ID aus Member-Attribut extrahiert: {unifi_id}")
        return unifi_id
        
    # Priorität 3: Aus den Notizen extrahieren
    notes = member.notes or ""
    
    # Verbesserte Regex-Erkennung mit mehreren Mustern
    patterns = [
        r'UniFi-ID:\s*(\S+)',  # Standard-Format
        r'UniFi-ID[:|=]\s*(\S+)',  # Alternative Formate
        r'UniFi[:|=]\s*(\S+)',  # Kürzeres Format
        r'UNIFI_ID[:|=]\s*(\S+)'  # Großbuchstaben-Format
    ]
    
    for pattern in patterns:
        match = re.search(pattern, notes)
        if match:
            unifi_id = match.group(1)
            print(f"✅ UniFi-ID aus Notizen extrahiert (Muster: {pattern}): {unifi_id}")
            
            # Entferne mögliche Zeichen am Ende, die nicht zur ID gehören
            unifi_id = unifi_id.rstrip('.,;:"\' \t\n')
            
            return unifi_id
    
    print(f"⚠️ Keine UniFi-ID gefunden für Member: {member.id}")
    return None

# Pagination-Klasse für MemberViewSet
class MemberPagination(PageNumberPagination):
    page_size = 25

# ViewSet für Members API
class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by('last_name', 'first_name')
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MemberPagination
    
    def get_queryset(self):
        queryset = Member.objects.all().order_by('last_name', 'first_name')
        
        # Prüfe, ob Suchanfrage existiert
        search = self.request.query_params.get('search', '')
        limit = self.request.query_params.get('limit')
        exact = self.request.query_params.get('exact', 'false').lower() == 'true'
        
        if search and len(search) >= 2:
            if exact:
                # Exakte Suche (für Anfangsbuchstaben)
                queryset = queryset.filter(
                    Q(first_name__istartswith=search) | 
                    Q(last_name__istartswith=search)
                )
            else:
                # Allgemeine Suche (enthält)
                queryset = queryset.filter(
                    Q(first_name__icontains=search) | 
                    Q(last_name__icontains=search)
                )
        
        # Begrenzen, falls limit Parameter existiert
        if limit:
            try:
                limit_val = int(limit)
                queryset = queryset[:limit_val]
            except ValueError:
                pass
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Erweiterte create-Methode mit Logging, aber ohne die Standardfunktionalität zu ändern
        """
        print(f"📝 Mitglieder-Erstellungsanfrage erhalten: {request.data}")
        
        try:
            # Standardfunktionalität beibehalten
            response = super().create(request, *args, **kwargs)
            print(f"✅ Mitglied erfolgreich erstellt: {response.data.get('id')}")
            return response
        except Exception as e:
            print(f"❌ Fehler beim Erstellen eines Mitglieds: {str(e)}")
            # Exception weiterleiten, um Standardverhalten beizubehalten
            raise
    
    def update(self, request, *args, **kwargs):
        """
        Erweiterte update-Methode mit Logging, aber ohne die Standardfunktionalität zu ändern
        """
        print(f"📝 Mitglieder-Aktualisierungsanfrage erhalten: {request.data}")
        
        try:
            # Standardfunktionalität beibehalten
            response = super().update(request, *args, **kwargs)
            print(f"✅ Mitglied erfolgreich aktualisiert: {response.data.get('id')}")
            return response
        except Exception as e:
            print(f"❌ Fehler beim Aktualisieren eines Mitglieds: {str(e)}")
            # Exception weiterleiten, um Standardverhalten beizubehalten
            raise
        
    def list(self, request, *args, **kwargs):
        # Für normale Liste mit Pagination
        if not request.query_params.get('search'):
            response = super().list(request, *args, **kwargs)
            is_teamleiter = request.user.groups.filter(name="teamleiter").exists()
            response.data["extra"] = {"is_teamleiter": is_teamleiter}
            return response
            
        # Für Suchanfragen ohne Pagination
        if request.query_params.get('search'):
            self.pagination_class = None
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        return super().list(request, *args, **kwargs)

# User-Info API Endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    return Response({
        "username": user.username,
        "groups": groups
    })

# ============================================================================
# 🔐 JOOMLA SERVICE FUNKTIONEN
# ============================================================================

def generate_secure_password(length=16):
    """
    Generiert ein sicheres Passwort mit Buchstaben, Ziffern und einfachen Sonderzeichen.
    """
    allowed_symbols = "!@#$%?§"  # Nur einfache, gängige Sonderzeichen
    alphabet = string.ascii_letters + string.digits + allowed_symbols
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def joomla_password_hash(password):
    """
    Erstellt einen Joomla-kompatiblen Passwort-Hash ohne passlib
    
    Joomla 3 verwendet standardmäßig bcrypt oder das eigene Format:
    $P$<salt><hash>
    
    Dies ist eine vereinfachte MD5 Implementierung nur für Testzwecke.
    In Produktion sollte passlib mit bcrypt verwendet werden, wenn verfügbar.
    """
    salt = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(22))
    # Für Testzwecke: Einfacher MD5-Hash mit Salt
    hash_obj = hashlib.md5((salt + password).encode())
    hashed = hash_obj.hexdigest()
    
    # Joomla-Format
    return f"$MD5${salt}${hashed}"


def create_joomla_user(member):
    """
    Erstellt einen Benutzer in Joomla, falls er noch nicht existiert.
    
    Args:
        member: Das Member-Objekt mit den Benutzerdaten
        
    Returns:
        dict: Dictionary mit user_id, username und password
    """
    uid = member.uuid
    if not uid:
        raise ValueError("UUID fehlt")

    username = f"user_{str(uid).split('-')[0]}"
    name = f"Mitglied {member.first_name}"
    email = member.email or f"{username}@verein.local"
    register_date = timezone.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        joomla_db = connections['joomla']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur Joomla-Datenbank konfiguriert")

    with transaction.atomic(using='joomla'):
        cursor = joomla_db.cursor()

        # 🧠 Vorab prüfen, ob der Benutzer schon existiert
        cursor.execute("SELECT id FROM g0w36_users WHERE username = %s", [username])
        existing_user = cursor.fetchone()
        if existing_user:
            print(f"⚠️ Joomla-Benutzer mit Username '{username}' existiert bereits – wird nicht erneut erstellt.")
            return {'id': existing_user[0], 'username': username, 'password': None}

        # 👇 Wenn nicht vorhanden, dann anlegen
        initial_password = generate_secure_password()
        
        # Speichere das generierte Passwort im notes-Feld
        notes = member.notes or ""
        member.notes = f"{notes}\nJoomla-Passwort: {initial_password} (generiert am {timezone.now().strftime('%d.%m.%Y %H:%M')})"
        member.save(update_fields=["notes"])

        # 🔐 Passwort hashen
        joomla_hash = joomla_password_hash(initial_password)

        cursor.execute("""
            INSERT INTO g0w36_users (name, username, email, password, block, sendEmail, registerDate, params)
            VALUES (%s, %s, %s, %s, 0, 0, %s, '')
        """, [name, username, email, joomla_hash, register_date])

        cursor.execute("SELECT LAST_INSERT_ID()")
        user_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO g0w36_user_usergroup_map (user_id, group_id)
            VALUES (%s, 2)
        """, [user_id])

        # Altersbedingte Werte bestimmen
        age = None
        if hasattr(member, 'age'):
            age = member.age
        else:
            # Versuche, Alter aus birthdate zu berechnen, falls vorhanden
            if hasattr(member, 'birthdate') and member.birthdate:
                today = date.today()
                age = (today.year - member.birthdate.year - 
                   ((today.month, today.day) < (member.birthdate.month, member.birthdate.day)))

        # THC Limits basierend auf Alter
        thc_limit = 0 if age and age >= 21 else 10
        monthly_limit = 50 if age and age >= 21 else 30

        fields = [
            (13, member.kontostand if hasattr(member, 'kontostand') else 0),
            (14, member.working_hours_per_month if hasattr(member, 'working_hours_per_month') else 0),
            (16, 25),  # Tageslimit - Standard 25g
            (17, monthly_limit),  # Monatslimit - altersabhängig
            (18, thc_limit),  # THC-Grenze - altersabhängig
            (19, member.physical_limitations if hasattr(member, 'physical_limitations') else ""),
            (20, member.mental_limitations if hasattr(member, 'mental_limitations') else ""),
        ]

        for field_id, value in fields:
            cursor.execute("""
                INSERT INTO g0w36_fields_values (field_id, item_id, value)
                VALUES (%s, %s, %s)
            """, [field_id, user_id, str(value)])

        # Speichere die Benutzer-ID im Notizfeld für spätere Referenz
        notes = member.notes or ""
        if "Joomla-ID:" not in notes:
            member.notes = f"{notes}\nJoomla-ID: {user_id}"
            member.save(update_fields=["notes"])

        print(f"✅ Joomla-Benutzer neu erstellt: {username} mit ID {user_id} und Passwort {initial_password}")
        return {
            'id': user_id, 
            'username': username, 
            'password': initial_password
        }


def sync_joomla_user(member):
    """
    Aktualisiert einen bestehenden Benutzer in Joomla basierend auf den Member-Daten,
    inkl. Custom Fields.
    
    Args:
        member: Das Member-Objekt mit den zu aktualisierenden Daten
        
    Returns:
        int: Die Joomla-Benutzer-ID oder None bei einem Fehler
    """
    uid = member.uuid
    if not uid:
        raise ValueError("UUID fehlt")
        
    username = f"user_{str(uid).split('-')[0]}"
    name = f"Mitglied {member.first_name}"
    email = member.email or f"{username}@verein.local"
    
    try:
        joomla_db = connections['joomla']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur Joomla-Datenbank konfiguriert")

    with transaction.atomic(using='joomla'):
        cursor = joomla_db.cursor()

        # ✅ Benutzer-ID anhand des Usernames finden
        cursor.execute("SELECT id FROM g0w36_users WHERE username = %s", [username])
        row = cursor.fetchone()

        if not row:
            # Versuche, Joomla-ID aus Notizen zu extrahieren
            match = re.search(r'Joomla-ID:\s*(\d+)', member.notes or "")
            if match:
                user_id = int(match.group(1))
                cursor.execute("SELECT id FROM g0w36_users WHERE id = %s", [user_id])
                row = cursor.fetchone()
                
            if not row:
                raise Exception("❌ Joomla-Benutzer nicht gefunden für Sync")

        user_id = row[0]
        print("🔁 Benutzer bereits vorhanden. Update von Custom Fields für User-ID:", user_id)

        # Grundlegende Benutzerdaten aktualisieren
        cursor.execute("""
            UPDATE g0w36_users SET name = %s, email = %s
            WHERE id = %s
        """, [name, email, user_id])

        # Altersbedingte Werte bestimmen
        age = None
        if hasattr(member, 'age'):
            age = member.age
        else:
            # Versuche, Alter aus birthdate zu berechnen, falls vorhanden
            if hasattr(member, 'birthdate') and member.birthdate:
                today = date.today()
                age = (today.year - member.birthdate.year - 
                   ((today.month, today.day) < (member.birthdate.month, member.birthdate.day)))

        # THC Limits basierend auf Alter
        thc_limit = 0 if age and age >= 21 else 10
        monthly_limit = 50 if age and age >= 21 else 30

        # 🧩 Felder aktualisieren oder neu einfügen
        fields = [
            (13, member.kontostand if hasattr(member, 'kontostand') else 0),
            (14, member.working_hours_per_month if hasattr(member, 'working_hours_per_month') else 0),
            (16, 25),  # Tageslimit - Standard 25g
            (17, monthly_limit),  # Monatslimit - altersabhängig
            (18, thc_limit),  # THC-Grenze - altersabhängig
            (19, member.physical_limitations if hasattr(member, 'physical_limitations') else ""),
            (20, member.mental_limitations if hasattr(member, 'mental_limitations') else ""),
        ]

        for field_id, value in fields:
            cursor.execute("""
                SELECT field_id FROM g0w36_fields_values
                WHERE field_id = %s AND item_id = %s
            """, [field_id, user_id])
            exists = cursor.fetchone()

            if exists:
                cursor.execute("""
                    UPDATE g0w36_fields_values SET value = %s
                    WHERE field_id = %s AND item_id = %s
                """, [str(value), field_id, user_id])
            else:
                cursor.execute("""
                    INSERT INTO g0w36_fields_values (field_id, item_id, value)
                    VALUES (%s, %s, %s)
                """, [field_id, user_id, str(value)])

        # Stellen Sie sicher, dass die Joomla-ID im Notizfeld gespeichert ist
        notes = member.notes or ""
        if "Joomla-ID:" not in notes:
            member.notes = f"{notes}\nJoomla-ID: {user_id}"
            member.save(update_fields=["notes"])

        print(f"✅ Joomla-Benutzer aktualisiert: {username} mit ID {user_id}")
        return user_id


def regenerate_joomla_password(member):
    """
    Generiert ein neues sicheres Passwort für einen Joomla-Benutzer.
    
    Args:
        member: Das Member-Objekt, dessen Passwort erneuert werden soll
        
    Returns:
        dict: Dictionary mit username und password
    """
    uid = member.uuid
    if not uid:
        raise ValueError("UUID fehlt")
        
    username = f"user_{str(uid).split('-')[0]}"
    
    try:
        joomla_db = connections['joomla']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur Joomla-Datenbank konfiguriert")
        
    new_password = generate_secure_password()
    
    with transaction.atomic(using='joomla'):
        cursor = joomla_db.cursor()
        
        # Prüfen, ob der Benutzer existiert
        cursor.execute("SELECT id FROM g0w36_users WHERE username = %s", [username])
        row = cursor.fetchone()
        
        if not row:
            # Versuche, Joomla-ID aus Notizen zu extrahieren
            match = re.search(r'Joomla-ID:\s*(\d+)', member.notes or "")
            if match:
                user_id = int(match.group(1))
                cursor.execute("SELECT id FROM g0w36_users WHERE id = %s", [user_id])
                row = cursor.fetchone()
                
            if not row:
                raise Exception("❌ Joomla-Benutzer nicht gefunden für Passwort-Reset")
            
        user_id = row[0]
        
        # Passwort aktualisieren
        joomla_hash = joomla_password_hash(new_password)
        cursor.execute("""
            UPDATE g0w36_users SET password = %s
            WHERE id = %s
        """, [joomla_hash, user_id])
        
        # Speichere das generierte Passwort im notes-Feld
        notes = member.notes or ""
        member.notes = f"{notes}\nNeues Joomla-Passwort (generiert am {timezone.now().strftime('%d.%m.%Y %H:%M')}): {new_password}"
        member.save(update_fields=["notes"])
        
        print(f"🔐 Neues Passwort für Joomla-Benutzer '{username}' generiert: {new_password}")
        return {
            'password': new_password, 
            'username': username
        }


def delete_joomla_user(member):
    """
    Löscht den Joomla-Benutzer vollständig anhand der UUID.
    
    Args:
        member: Das Member-Objekt, dessen Joomla-Benutzer gelöscht werden soll
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    uid = member.uuid
    if not uid:
        print("❌ UUID fehlt – kein Joomla-User gelöscht")
        return False
        
    username = f"user_{str(uid).split('-')[0]}"
    
    try:
        joomla_db = connections['joomla']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur Joomla-Datenbank konfiguriert")

    with transaction.atomic(using='joomla'):
        cursor = joomla_db.cursor()
        cursor.execute("SELECT id FROM g0w36_users WHERE username = %s", [username])
        row = cursor.fetchone()

        if not row:
            # Versuche, Joomla-ID aus Notizen zu extrahieren
            match = re.search(r'Joomla-ID:\s*(\d+)', member.notes or "")
            if match:
                user_id = int(match.group(1))
                cursor.execute("SELECT id FROM g0w36_users WHERE id = %s", [user_id])
                row = cursor.fetchone()
                
            if not row:
                print(f"⚠️ Kein Joomla-Benutzer gefunden für Username '{username}' – kein Löschvorgang.")
                return False

        user_id = row[0]

        # 👉 Reihenfolge wichtig: zuerst abhängige Tabellen löschen
        cursor.execute("DELETE FROM g0w36_user_usergroup_map WHERE user_id = %s", [user_id])
        cursor.execute("DELETE FROM g0w36_fields_values WHERE item_id = %s", [user_id])
        cursor.execute("DELETE FROM g0w36_users WHERE id = %s", [user_id])

        # Entferne den Joomla-ID-Eintrag aus den Notizen
        notes = member.notes or ""
        updated_notes = re.sub(r'Joomla-ID:\s*\d+\s*\n?', '', notes)
        updated_notes = re.sub(r'Joomla-Passwort:[^\n]*\n?', '', updated_notes)
        updated_notes = re.sub(r'Neues Joomla-Passwort[^\n]*\n?', '', updated_notes)
        member.notes = updated_notes
        member.save(update_fields=["notes"])

        print(f"🗑 Joomla-Benutzer '{username}' (ID {user_id}) wurde vollständig gelöscht.")
        return True


# ============================================================================
# 🔑 UNIFI SERVICE FUNKTIONEN
# ============================================================================

# Konfiguration aus Umgebungsvariablen oder settings.py auslesen
UNIFI_ACCESS_HOST = os.getenv("UNIFI_ACCESS_HOST")
UNIFI_ACCESS_TOKEN = os.getenv("UNIFI_ACCESS_TOKEN")

def check_unifi_user_status(member, unifi_id=None):
    """
    Überprüft den Status eines UniFi-Benutzers.
    
    Args:
        member: Das Member-Objekt
        unifi_id: Optional die UniFi-ID, falls nicht im Member gespeichert
        
    Returns:
        str: Status des Benutzers ('ACTIVE', 'DEACTIVATED', etc.) oder None bei einem Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    # Wenn keine UniFi-ID übergeben wurde, versuchen wir sie aus den Notizen zu extrahieren
    if not unifi_id:
        # UniFi-ID extrahieren
        unifi_id = extract_unifi_id(member)
        
    if not unifi_id:
        print(f"❌ UniFi-ID fehlt für Member {member.id} – keine Statusprüfung möglich")
        return None
    
    print(f"🔍 Prüfe Status für UniFi-Benutzer mit ID: {unifi_id}")
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users/{unifi_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
    }
    
    try:
        response = requests.get(url, headers=headers, verify=False)
        print(f"📥 API-Antwort Status: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            if 'data' in user_data and 'status' in user_data['data']:
                status_value = user_data['data']['status']
                print(f"✅ UniFi-Benutzerstatus gefunden: {status_value}")
                return status_value
            else:
                print("⚠️ Statusfeld nicht in API-Antwort gefunden")
        elif response.status_code == 404:
            print(f"⚠️ UniFi-Benutzer mit ID {unifi_id} existiert nicht mehr (404)")
    except Exception as e:
        print(f"❌ Fehler bei der Statusabfrage des UniFi-Benutzers: {str(e)}")
        
    return None

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
        # UniFi-ID extrahieren
        unifi_id = extract_unifi_id(member)
        
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


def reactivate_unifi_user(member, unifi_id=None):
    """
    Reaktiviert einen deaktivierten UniFi-Benutzer.
    
    Args:
        member: Das Member-Objekt, dessen UniFi-Benutzer reaktiviert werden soll
        unifi_id: Optional die UniFi-ID, falls nicht im Member gespeichert
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    if not UNIFI_ACCESS_HOST or not UNIFI_ACCESS_TOKEN:
        raise ValueError("UniFi-Konfiguration fehlt in Umgebungsvariablen oder settings.py")
        
    # Wenn keine UniFi-ID übergeben wurde, versuchen wir sie aus den Notizen zu extrahieren
    if not unifi_id:
        # UniFi-ID extrahieren
        unifi_id = extract_unifi_id(member)
        
    if not unifi_id:
        print("❌ UniFi-ID fehlt – keine Reaktivierung möglich")
        return False
        
    url = f"{UNIFI_ACCESS_HOST}/api/v1/developer/users/{unifi_id}"
    headers = {
        "Authorization": f"Bearer {UNIFI_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    
    data = {
        "status": "ACTIVE"  # Status auf ACTIVE setzen
    }
    
    try:
        response = requests.put(url, json=data, headers=headers, verify=False)
        if response.status_code in (200, 204):
            print(f"✅ UniFi-Benutzer mit ID {unifi_id} wurde reaktiviert.")
            return True
    except Exception as e:
        print(f"❌ Fehler beim Reaktivieren des UniFi-Benutzers: {str(e)}")
        
    return False


def delete_unifi_user(member, unifi_id=None):
    """
    Deaktiviert den Benutzer in UniFi Access, indem der Status auf "DEACTIVATED" gesetzt wird.
    Behält die UniFi-ID in den Notizen bei.
    
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
        # UniFi-ID extrahieren
        unifi_id = extract_unifi_id(member)
        
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
            # WICHTIGE ÄNDERUNG: Die UniFi-ID nicht mehr aus den Notizen entfernen!
            # Stattdessen einen Deaktivierungsvermerk hinzufügen
            notes = member.notes or ""
            
            # Prüfen, ob die ID bereits in den Notizen ist (mit Regex)
            if re.search(fr'UniFi-ID:\s*{re.escape(unifi_id)}', notes):
                # Falls bereits ein Deaktivierungsvermerk vorhanden ist, diesen nicht erneut hinzufügen
                if f"(Deaktiviert am " not in notes:
                    # Ergänze den bestehenden Eintrag um einen Deaktivierungsvermerk
                    new_notes = re.sub(
                        fr'(UniFi-ID:\s*{re.escape(unifi_id)})', 
                        fr'\1 (Deaktiviert am {timezone.now().strftime("%d.%m.%Y %H:%M")})', 
                        notes
                    )
                    member.notes = new_notes
                    member.save(update_fields=["notes"])
            else:
                # Falls die ID noch nicht in den Notizen ist, füge sie mit Deaktivierungsvermerk hinzu
                deactivation_note = f"\nUniFi-ID: {unifi_id} (Deaktiviert am {timezone.now().strftime('%d.%m.%Y %H:%M')})"
                member.notes = notes + deactivation_note
                member.save(update_fields=["notes"])
            
            print(f"🔒 UniFi-Benutzer mit ID {unifi_id} wurde deaktiviert und ID in Notizen beibehalten.")
            return True
    except Exception as e:
        print(f"❌ Fehler beim Deaktivieren des UniFi-Benutzers: {str(e)}")
        
    return False


# ============================================================================
# 🌐 API ENDPUNKTE
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    return Response({
        "username": user.username,
        "groups": groups
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def create_joomla_user_api(request, member_id):
    """
    Erstellt einen neuen Joomla-Benutzer für ein Mitglied.
    """
    member = get_object_or_404(Member, id=member_id)
    
    try:
        result = create_joomla_user(member)
        if result:
            return Response({
                "success": True,
                "message": f"Joomla-Benutzer erfolgreich erstellt (ID: {result['id']})",
                "joomla_id": result['id'],
                "username": result['username'],
                "password": result['password']
            })
        else:
            return Response(
                {"error": "Fehler beim Erstellen des Joomla-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def update_joomla_user_api(request, member_id):
    """
    Aktualisiert einen bestehenden Joomla-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    try:
        user_id = sync_joomla_user(member)
        if user_id:
            return Response({
                "success": True,
                "message": f"Joomla-Benutzer erfolgreich aktualisiert (ID: {user_id})",
                "joomla_id": user_id
            })
        else:
            return Response(
                {"error": "Fehler beim Aktualisieren des Joomla-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        # Falls Benutzer nicht existiert, bieten wir die Erstellung an
        if "nicht gefunden" in str(e).lower():
            return Response({
                "error": f"Joomla-Benutzer nicht gefunden. Bitte zuerst erstellen.",
                "create_first": True
            }, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def regenerate_joomla_password_api(request, member_id):
    """
    Generiert ein neues Passwort für einen Joomla-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    try:
        result = regenerate_joomla_password(member)
        if result:
            return Response({
                "success": True,
                "message": "Neues Passwort erfolgreich generiert",
                "password": result['password'],
                "username": result['username']
            })
        else:
            return Response(
                {"error": "Fehler beim Generieren des Passworts."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        # Falls Benutzer nicht existiert, bieten wir die Erstellung an
        if "nicht gefunden" in str(e).lower():
            return Response({
                "error": f"Joomla-Benutzer nicht gefunden. Bitte zuerst erstellen.",
                "create_first": True
            }, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@team_member_required
def delete_joomla_user_api(request, member_id):
    """
    Löscht einen Joomla-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    try:
        success = delete_joomla_user(member)
        if success:
            return Response({
                "success": True,
                "message": "Joomla-Benutzer erfolgreich gelöscht"
            })
        else:
            return Response(
                {"error": "Fehler beim Löschen des Joomla-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def create_unifi_user_api(request, member_id):
    """
    Erstellt einen neuen UniFi-Benutzer für ein Mitglied.
    """
    member = get_object_or_404(Member, id=member_id)
    
    try:
        unifi_id = create_unifi_user(member)
        if unifi_id:
            # UniFi-ID im Notizfeld speichern
            notes = member.notes or ""
            member.notes = f"{notes}\nUniFi-ID: {unifi_id}"
            member.save(update_fields=['notes'])
                
            return Response({
                "success": True,
                "message": f"UniFi-Benutzer erfolgreich erstellt (ID: {unifi_id})",
                "unifi_id": unifi_id
            })
        else:
            return Response(
                {"error": "Fehler beim Erstellen des UniFi-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def update_unifi_user_api(request, member_id):
    """
    Aktualisiert einen bestehenden UniFi-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    # UniFi-ID mit der Hilfsfunktion extrahieren
    unifi_id = extract_unifi_id(member, request.data)
    
    if not unifi_id:
        return Response(
            {"error": "Keine UniFi-ID gefunden. Bitte zuerst einen UniFi-Benutzer erstellen."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = update_unifi_user(member, unifi_id=unifi_id)
        if success:
            return Response({
                "success": True,
                "message": f"UniFi-Benutzer erfolgreich aktualisiert (ID: {unifi_id})"
            })
        else:
            return Response(
                {"error": "Fehler beim Aktualisieren des UniFi-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@team_member_required
def delete_unifi_user_api(request, member_id):
    """
    Deaktiviert einen UniFi-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    # UniFi-ID mit der Hilfsfunktion extrahieren
    unifi_id = extract_unifi_id(member, request.data)
    
    if not unifi_id:
        return Response(
            {"error": "Keine UniFi-ID gefunden."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = delete_unifi_user(member, unifi_id=unifi_id)
        if success:
            return Response({
                "success": True,
                "message": "UniFi-Benutzer erfolgreich deaktiviert",
                "unifi_id": unifi_id  # ID zurückgeben, damit Frontend sie speichern kann
            })
        else:
            return Response(
                {"error": "Fehler beim Deaktivieren des UniFi-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def reactivate_unifi_user_api(request, member_id):
    """
    Reaktiviert einen deaktivierten UniFi-Benutzer.
    """
    member = get_object_or_404(Member, id=member_id)
    
    # UniFi-ID mit der Hilfsfunktion extrahieren
    unifi_id = extract_unifi_id(member, request.data)
    
    if not unifi_id:
        return Response(
            {"error": "Keine UniFi-ID gefunden."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = reactivate_unifi_user(member, unifi_id=unifi_id)
        if success:
            return Response({
                "success": True,
                "message": "UniFi-Benutzer erfolgreich reaktiviert",
                "unifi_id": unifi_id
            })
        else:
            return Response(
                {"error": "Fehler beim Reaktivieren des UniFi-Benutzers."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"Fehler: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_unifi_status_api(request, member_id):
    """
    API-Endpunkt zum Prüfen des Status eines UniFi-Benutzers.
    Korrigierte Version, die den Namenskonflikt behebt.
    """
    member = get_object_or_404(Member, id=member_id)
    
    # Zuerst überprüfen, ob eine UniFi-ID existiert
    unifi_id = extract_unifi_id(member)
    if not unifi_id:
        # Statt 404 senden wir einen 200-Response mit einer klaren Fehlermeldung
        return Response({
            "success": False,
            "error": "Keine UniFi-ID gefunden. Dieser Benutzer hat keinen UniFi-Zugang.",
            "status": None,
            "is_active": False,
            "needs_setup": True
        }, status=status.HTTP_200_OK)  # 200 OK mit klarer Information
    
    try:
        # Variablennamen geändert, um Konflikt mit importiertem 'status' zu vermeiden
        unifi_status = check_unifi_user_status(member, unifi_id=unifi_id)
        if unifi_status:
            return Response({
                "success": True,
                "status": unifi_status,
                "is_active": unifi_status == "ACTIVE",
                "unifi_id": unifi_id  # ID zurückgeben für Frontend-Speicherung
            })
        else:
            # Wenn Status-Abfrage fehlschlägt, aber wir eine ID haben
            return Response({
                "success": False,
                "error": "UniFi-Benutzer existiert, aber der Status konnte nicht abgerufen werden.",
                "status": "UNKNOWN",
                "is_active": False,
                "unifi_id": unifi_id  # ID zurückgeben für Frontend-Speicherung
            }, status=status.HTTP_200_OK)
    except Exception as e:
        # Spezifischen Fehler loggen, aber generischen an Frontend zurückgeben
        print(f"❌ Fehler in check_unifi_status_api für Member {member_id}: {str(e)}")
        return Response({
            "success": False,
            "error": "Fehler bei der Abfrage des UniFi-Status.",
            "details": str(e) if settings.DEBUG else "Systemfehler",
            "status": None,
            "is_active": False,
            "unifi_id": unifi_id if unifi_id else None
        }, status=status.HTTP_200_OK)  # 200 OK mit Fehlerinformation


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@team_member_required
def debug_member_creation(request):
    """
    Debug-Endpoint zum Testen der Mitgliedererstellung mit detaillierten Fehlerinformationen.
    Verwendet den standardmäßigen MemberSerializer, aber mit ausführlichem Logging.
    """
    print(f"🔍 DEBUG: Mitglieder-Erstellungsanfrage erhalten")
    print(f"🔍 DEBUG: Request-Daten: {request.data}")
    print(f"🔍 DEBUG: Content-Type: {request.content_type}")
    
    # Modell-Felder analysieren und anzeigen
    print("🔍 DEBUG: Alle Member-Modellfelder:")
    for field in Member._meta.fields:
        print(f"  - {field.name}: {field.get_internal_type()}, "
              f"null={field.null}, blank={field.blank}, "
              f"default={field.default if field.default != models.fields.NOT_PROVIDED else 'NOT_PROVIDED'}")
    
    # Überprüfen der erforderlichen Felder
    required_fields = [f.name for f in Member._meta.fields 
                      if not f.null and f.default == models.fields.NOT_PROVIDED 
                      and not f.auto_created]
    print(f"🔍 DEBUG: Erforderliche Felder: {required_fields}")
    
    # Prüfen, ob alle erforderlichen Felder vorhanden sind
    missing_fields = [field for field in required_fields if field not in request.data]
    if missing_fields:
        print(f"🔍 DEBUG: Fehlende Pflichtfelder: {missing_fields}")
    
    # Serializer ohne zusätzliche Validierung verwenden
    serializer = MemberSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"🔍 DEBUG: Validierungsfehler im Originalserializer: {serializer.errors}")
        return Response({
            "error": "Validierungsfehler",
            "details": serializer.errors,
            "received_data": request.data
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Wenn alles in Ordnung ist, versuchen wir, das Mitglied zu erstellen
    try:
        member = serializer.save()
        print(f"✅ DEBUG: Mitglied erfolgreich erstellt: ID {member.id}")
        return Response({
            "success": True,
            "message": "Mitglied erfolgreich erstellt",
            "member": serializer.data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"❌ DEBUG: Fehler beim Speichern des Mitglieds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": "Datenbankfehler",
            "message": str(e),
            "traceback": traceback.format_exc() if settings.DEBUG else "Aktivieren Sie DEBUG für weitere Details."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)