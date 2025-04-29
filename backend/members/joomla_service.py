# /joomla_service.py
import os
from django.db import connections, transaction
from django.utils import timezone
import secrets
import string
from passlib.hash import bcrypt  # 🔐 Joomla-kompatibler Hash
from dotenv import load_dotenv

# Umgebungsvariablen laden
load_dotenv()

def generate_secure_password(length=16):
    """
    Generiert ein sicheres Passwort mit Buchstaben, Ziffern und einfachen Sonderzeichen.
    """
    allowed_symbols = "!@#$%?§"  # Nur einfache, gängige Sonderzeichen
    alphabet = string.ascii_letters + string.digits + allowed_symbols
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_joomla_user(member):
    """
    Erstellt einen Benutzer in Joomla, falls er noch nicht existiert.
    
    Args:
        member: Das Member-Objekt mit den Benutzerdaten
        
    Returns:
        int: Die Joomla-Benutzer-ID oder None bei einem Fehler
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
            return existing_user[0]

        # 👇 Wenn nicht vorhanden, dann anlegen
        initial_password = generate_secure_password()
        
        # Speichere das generierte Passwort im notes-Feld
        notes = member.notes or ""
        member.notes = f"{notes}\nJoomla-Passwort: {initial_password} (generiert am {timezone.now().strftime('%d.%m.%Y %H:%M')})"
        member.save(update_fields=["notes"])

        # 🔐 Passwort Joomla-kompatibel hashen
        joomla_hash = bcrypt.hash(initial_password)

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
            import datetime
            if hasattr(member, 'birthdate') and member.birthdate:
                today = datetime.date.today()
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
            import re
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
            import datetime
            if hasattr(member, 'birthdate') and member.birthdate:
                today = datetime.date.today()
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
        str: Das neu generierte Passwort oder None bei einem Fehler
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
            import re
            match = re.search(r'Joomla-ID:\s*(\d+)', member.notes or "")
            if match:
                user_id = int(match.group(1))
                cursor.execute("SELECT id FROM g0w36_users WHERE id = %s", [user_id])
                row = cursor.fetchone()
                
            if not row:
                raise Exception("❌ Joomla-Benutzer nicht gefunden für Passwort-Reset")
            
        user_id = row[0]
        
        # Passwort aktualisieren
        joomla_hash = bcrypt.hash(new_password)
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
            import re
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
        import re
        updated_notes = re.sub(r'Joomla-ID:\s*\d+\s*\n?', '', notes)
        updated_notes = re.sub(r'Joomla-Passwort:[^\n]*\n?', '', updated_notes)
        updated_notes = re.sub(r'Neues Joomla-Passwort[^\n]*\n?', '', updated_notes)
        member.notes = updated_notes
        member.save(update_fields=["notes"])

        print(f"🗑 Joomla-Benutzer '{username}' (ID {user_id}) wurde vollständig gelöscht.")
        return True