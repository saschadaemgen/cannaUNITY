# wordpress_service.py
import os
import datetime
import re
import string
import secrets
from passlib.hash import phpass
from django.utils import timezone
from django.db import connections, transaction
from dotenv import load_dotenv

# ENV laden
load_dotenv()


def generate_secure_password(length=16):
    allowed_symbols = "!@#$%?§"
    alphabet = string.ascii_letters + string.digits + allowed_symbols
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_wordpress_user(member):
    uid = member.uuid
    if not uid:
        raise ValueError("UUID fehlt")

    username = f"user_{str(uid).split('-')[0]}"
    email = member.email or f"{username}@verein.local"
    full_name = f"Mitglied {member.first_name}"
    register_date = timezone.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        wp_db = connections['wordpress']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur WordPress-Datenbank konfiguriert")

    with transaction.atomic(using='wordpress'):
        cursor = wp_db.cursor()

        cursor.execute("SELECT ID FROM wp_users WHERE user_login = %s", [username])
        if cursor.fetchone():
            print(f"⚠️ Benutzer {username} existiert bereits")
            return

        password = generate_secure_password()
        wp_hash = phpass.using(rounds=8).hash(password)

        member.notes = (member.notes or "") + f"\nWP-Passwort: {password}"
        member.save(update_fields=["notes"])

        cursor.execute("""
            INSERT INTO wp_users (user_login, user_pass, user_nicename, user_email, user_registered, display_name)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, [username, wp_hash, username, email, register_date, full_name])

        cursor.execute("SELECT LAST_INSERT_ID()")
        user_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
            VALUES (%s, 'wp_capabilities', 'a:1:{s:10:\"subscriber\";b:1;}')
        """, [user_id])

        cursor.execute("""
            INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
            VALUES (%s, 'thc_limit', %s),
                   (%s, 'monthly_limit', %s)
        """, [user_id, 10, user_id, 50])

        member.notes += f"\nWP-ID: {user_id}"
        member.save(update_fields=["notes"])

        print(f"✅ WP-User {username} erstellt, ID {user_id}, Passwort {password}")
        return {
            'id': user_id,
            'username': username,
            'password': password
        }


def delete_wordpress_user(member):
    uid = member.uuid
    if not uid:
        return False
    username = f"user_{str(uid).split('-')[0]}"

    try:
        wp_db = connections['wordpress']
    except KeyError:
        raise ConnectionError("Keine Verbindung zur WordPress-Datenbank konfiguriert")

    with transaction.atomic(using='wordpress'):
        cursor = wp_db.cursor()
        cursor.execute("SELECT ID FROM wp_users WHERE user_login = %s", [username])
        row = cursor.fetchone()
        if not row:
            return False

        user_id = row[0]
        cursor.execute("DELETE FROM wp_usermeta WHERE user_id = %s", [user_id])
        cursor.execute("DELETE FROM wp_users WHERE ID = %s", [user_id])

        notes = member.notes or ""
        notes = re.sub(r'WP-ID:.*?\n?', '', notes)
        notes = re.sub(r'WP-Passwort:.*?\n?', '', notes)
        member.notes = notes
        member.save(update_fields=["notes"])

        print(f"🗑 WordPress-Benutzer {username} gelöscht.")
        return True
