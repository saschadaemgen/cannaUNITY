# cannaUNITY Authentifizierungssystem

**🔐 Quantum-secure, multiverse-proof, and definitely over-engineered – just like Rick likes it.**

![Security Badge](https://img.shields.io/badge/Sicherheit-Enterprise%20Grade-green)
![Encryption Badge](https://img.shields.io/badge/Verschlüsselung-AES--256-blue)
![Auth Badge](https://img.shields.io/badge/Authentifizierung-3--Faktor-orange)
![GDPR Badge](https://img.shields.io/badge/DSGVO-Konform-brightgreen)
![License](https://img.shields.io/badge/Lizenz-MIT-yellow)

## Inhaltsverzeichnis

- [Executive Summary](#executive-summary)
- [Systemarchitektur](#systemarchitektur)
- [Sicherheitskonzept](#sicherheitskonzept)
- [Token-System](#token-system)
- [API-Dokumentation](#api-dokumentation)
- [Sicherheitsvergleich](#sicherheitsvergleich)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [FAQ](#faq)
- [Lizenz](#lizenz)

## Executive Summary

Das cannaUNITY Authentifizierungssystem setzt neue Maßstäbe in der sicheren Mitgliederverwaltung für Cannabis Social Clubs. Durch die Kombination von militärischer Verschlüsselungstechnologie mit benutzerfreundlicher biometrischer Authentifizierung haben wir ein System geschaffen, das die Sicherheitsstandards des Online-Bankings übertrifft.

### Kernmerkmale der Sicherheitsarchitektur

- **Zero-Knowledge-Architektur**: Online-Server haben niemals Zugriff auf personenbezogene Mitgliederdaten
- **Drei-Faktor-Authentifizierung**: Gerät + Biometrie + PIN-Verifizierung
- **Ende-zu-Ende-Verschlüsselung**: Alle Datenübertragungen nutzen AES-256-Verschlüsselung
- **Token-Rotation**: Automatische Erneuerung von Sicherheitstoken verhindert Replay-Angriffe
- **Device-Binding**: Jedes Gerät ist kryptografisch mit dem Benutzerkonto verknüpft
- **DSGVO-Konformität**: Vollständige Trennung von personenbezogenen und operativen Daten

## Systemarchitektur

### Überblick

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOKALES SYSTEM (On-Premise)                │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   Django    │ ───► │ Mitglieder- │ ───► │ QR-Code     │      │
│  │   Backend   │      │ Datenbank   │      │ Generator   │      │
│  └─────────────┘      └─────────────┘      └─────────────┘      │
│         │              (Klartext-Daten)            │            │
│         └──────────────────────────────────────────┘            │
│                            │                                    │
│                     SSH-Tunnel (Nur Lesen)                      │
│                            ▼                                    │
└─────────────────────────────────────────────────────────────────┘
                             │
                  Einweg-Synchronisation (Schreiben)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ONLINE-SYSTEM (Cloud)                      │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   Joomla    │ ◄─── │ Anonyme DB  │ ◄─── │   REST API  │      │
│  │   Backend   │      │ (nur UIDs)  │      │   Service   │      │
│  └─────────────┘      └─────────────┘      └─────────────┘      │
│                                                      ▲          │
│                                                      │          │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │  Mobile Apps    │
                                              │  (iOS/Android)  │
                                              └─────────────────┘

```

### Komponenten im Detail

#### 1. Lokales System (Hochsicherheitsbereich)
- **Technologie**: Django REST Framework mit PostgreSQL
- **Funktion**: Verwaltung aller personenbezogenen Mitgliederdaten
- **Sicherheit**: Airgapped Network, keine eingehenden Internetverbindungen
- **Datenhaltung**: Verschlüsselte Datenbank mit AES-256

#### 2. Online-System (Öffentlicher Bereich)
- **Technologie**: Joomla CMS mit Custom API Layer
- **Funktion**: Anonymisierte Mitgliederverwaltung
- **Sicherheit**: Enthält nur UIDs und verschlüsselte Token
- **Datenhaltung**: MariaDB mit Row-Level-Encryption

#### 3. Mobile Anwendung
- **Technologie**: React Native mit Expo
- **Funktion**: Mitgliederausweis und Interaktion
- **Sicherheit**: Biometrische Authentifizierung + PIN
- **Datenhaltung**: Lokale Verschlüsselung mit Expo SecureStore

## Sicherheitskonzept

### Multi-Faktor-Authentifizierung

Unser System implementiert eine echte Drei-Faktor-Authentifizierung:

1. **BESITZ** (Something you have)
   - Registriertes Smartphone mit Device Token
   
2. **INHÄRENZ** (Something you are)
   - Biometrische Daten (Face ID / Fingerprint)
   
3. **WISSEN** (Something you know)
   - Persönliche 4-stellige PIN

### Vergleich mit Banking-Standards

| Sicherheitsmerkmal | cannaUNITY | Deutsche Bank | Sparkasse | PayPal |
|-------------------|------------|---------------|-----------|---------|
| Authentifizierungsfaktoren | 3 | 2 | 2 | 2 |
| Biometrische Authentifizierung | ✓ | ✓ | ✓ | ✓ |
| Zero-Knowledge-Architektur | ✓ | ✗ | ✗ | ✗ |
| Hardware-Binding | ✓ | ✓ | ✓ | ✗ |
| Token-Rotation | Automatisch | Manuell | Manuell | Automatisch |
| E2E-Verschlüsselung | ✓ | ✓ | ✓ | ✓ |
| Open Source | ✓ | ✗ | ✗ | ✗ |

## Token-System

### 1. QR-Code Token (Initialisierung)

```json
{
  "type": "initialization",
  "validity": "5 minutes",
  "usage": "single-use",
  "purpose": "Device registration",
  "security_level": "HIGH",
  "encryption": "RSA-4096 + AES-256"
}
```

**Sicherheitsmerkmale:**
- Einmalverwendung verhindert Replay-Angriffe
- Kurze Gültigkeit minimiert Angriffsfenster
- Asymmetrische Verschlüsselung gewährleistet Authentizität

### 2. Device Token (Langzeit-Authentifizierung)

```json
{
  "type": "device_authentication",
  "validity": "180 days",
  "usage": "multi-use",
  "purpose": "Device trust establishment",
  "security_level": "VERY HIGH",
  "binding": "Hardware ID + User UID",
  "rotation": "automatic on 150 days"
}
```

**Sicherheitsmerkmale:**
- Hardware-Binding verhindert Token-Diebstahl
- Automatische Rotation vor Ablauf
- Revocation-List für kompromittierte Geräte

### 3. Session Token (Arbeitssitzung)

```json
{
  "type": "session",
  "validity": "24 hours",
  "usage": "multi-use with refresh",
  "purpose": "API access",
  "security_level": "STANDARD",
  "features": ["auto-refresh", "idle-timeout", "geo-fencing"]
}
```

**Sicherheitsmerkmale:**
- Automatische Erneuerung bei aktiver Nutzung
- Idle-Timeout nach 30 Minuten Inaktivität
- Optional: Geo-Fencing für zusätzliche Sicherheit

## API-Dokumentation

### Authentifizierungs-Endpunkte

#### QR-Code Validierung
```
POST /api/v1/auth/initialize
```

**Request Body:**
```json
{
  "qr_token": "CANNA-2024-ABCD1234-TOKEN",
  "device_id": "ios-uuid-12345",
  "device_info": {
    "platform": "iOS",
    "version": "17.2",
    "model": "iPhone 15 Pro"
  }
}
```

**Response:**
```json
{
  "success": true,
  "device_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2024-06-27T10:00:00Z",
  "user": {
    "uid": "ABC123",
    "role": "member"
  }
}
```

#### Session Token Erneuerung
```
POST /api/v1/auth/refresh
```

**Headers:**
```
Authorization: Bearer <device_token>
```

**Response:**
```json
{
  "session_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400
}
```

### Mitglieder-Endpunkte

#### Profildaten abrufen
```
GET /api/v1/member/profile
```

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "uid": "ABC123",
  "status": "active",
  "balance": 125.50,
  "last_activity": "2024-01-15T14:30:00Z",
  "preferences": {
    "notifications": true,
    "language": "de"
  }
}
```

## Sicherheitsvergleich

### Warum unser System sicherer ist als Banking-Apps

1. **Physische Datentrennung**
   - Personenbezogene Daten sind physisch vom Internet getrennt
   - Banking-Apps: Alle Daten in derselben Cloud

2. **Zero-Knowledge-Prinzip**
   - Online-Server kennt keine Klarnamen oder persönliche Daten
   - Banking-Apps: Vollständige Kundendaten online

3. **Keine Passwörter**
   - Eliminierung des schwächsten Glieds
   - Banking-Apps: Oft noch mit Passwort-Fallback

4. **Open Source Transparenz**
   - Vollständige Code-Einsicht für Sicherheitsaudits
   - Banking-Apps: Proprietäre Closed-Source-Systeme

### Angriffsszenarien und Gegenmaßnahmen

| Angriffsszenario | Risiko | Gegenmaßnahme | Effektivität |
|------------------|--------|---------------|--------------|
| Man-in-the-Middle | Mittel | E2E-Verschlüsselung + Certificate Pinning | Hoch |
| Token-Diebstahl | Niedrig | Hardware-Binding + Biometrie | Sehr hoch |
| Brute Force | Sehr niedrig | Rate Limiting + Account Lockout | Hoch |
| Social Engineering | Mittel | Keine persönlichen Daten online | Hoch |
| Insider-Bedrohung | Niedrig | Zero-Knowledge + Audit Logs | Sehr hoch |

## Installation

### Voraussetzungen

- Node.js 18+ für API-Server
- PostgreSQL 14+ für lokale Datenbank
- MariaDB 10.6+ für Online-Datenbank
- Redis 7+ für Caching
- SSL-Zertifikate für HTTPS

### API-Server Setup

```bash
# Repository klonen
git clone https://github.com/cannaunity/auth-api.git
cd auth-api

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env Datei mit Ihren Werten anpassen

# Datenbank-Migrationen ausführen
npm run migrate

# Server starten
npm run start
```

### Datenbank-Schema

```sql
-- Device Token Tabelle
CREATE TABLE device_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_uid VARCHAR(6) NOT NULL,
    device_token_hash VARCHAR(256) NOT NULL,
    device_fingerprint_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    last_used_ip VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP NULL,
    revocation_reason VARCHAR(255),
    
    INDEX idx_user_uid (user_uid),
    INDEX idx_expires_at (expires_at),
    INDEX idx_device_token (device_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session Token Tabelle
CREATE TABLE session_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_token_id BIGINT NOT NULL,
    session_token_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (device_token_id) REFERENCES device_tokens(id),
    INDEX idx_session_token (session_token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log
CREATE TABLE security_audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_uid VARCHAR(6),
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_uid (user_uid),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Entwicklung

### Technologie-Stack

**Backend API:**
- Node.js mit Express.js
- TypeScript für Typsicherheit
- JWT für Token-Management
- bcrypt für Hashing
- Winston für Logging

**Mobile App:**
- React Native mit Expo
- expo-secure-store für sichere Speicherung
- expo-local-authentication für Biometrie
- expo-camera für QR-Scanning

### Best Practices

1. **Niemals Klartext-Token speichern**
   ```javascript
   // FALSCH
   db.save({ token: userToken });
   
   // RICHTIG
   const hashedToken = await bcrypt.hash(userToken, 12);
   db.save({ token_hash: hashedToken });
   ```

2. **Immer Token-Gültigkeit prüfen**
   ```javascript
   if (token.expires_at < new Date()) {
     throw new TokenExpiredError();
   }
   ```

3. **Rate Limiting implementieren**
   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 Minuten
     max: 5, // max 5 Anfragen
     message: 'Zu viele Anfragen, bitte später versuchen'
   });
   ```

### Sicherheits-Checkliste

- [ ] Alle API-Endpunkte nutzen HTTPS
- [ ] Certificate Pinning in Mobile Apps implementiert
- [ ] Rate Limiting für alle Authentifizierungs-Endpunkte
- [ ] Audit Logging für alle sicherheitsrelevanten Aktionen
- [ ] Regelmäßige Security Audits durchführen
- [ ] Penetrationstests vor jedem Release
- [ ] OWASP Top 10 Richtlinien befolgen

## FAQ

### Warum ist das System sicherer als Standard-2FA?

Standard-2FA nutzt meist SMS oder E-Mail als zweiten Faktor. Unser System kombiniert drei echte Faktoren: Gerät (Hardware-gebunden), Biometrie (nicht kopierbar) und PIN (Wissen). Zusätzlich trennen wir physisch persönliche Daten vom Internet.

### Was passiert bei Verlust des Smartphones?

1. Altes Gerät über Admin-Interface sperren
2. Neuer QR-Code wird generiert
3. Mitglied registriert neues Gerät
4. Alte Token sind ungültig

### Können Behörden auf die Daten zugreifen?

Der Online-Server enthält nur anonymisierte UIDs. Persönliche Daten sind ausschließlich im lokalen System gespeichert, das keine Internetverbindung hat. Behördenzugriff nur mit physischem Zugang zum lokalen Server möglich.

### Wie oft müssen Mitglieder neue QR-Codes holen?

- Bei normalem Gebrauch: Alle 6 Monate
- Bei Geräteverlust: Sofort
- Bei Löschung der APP: Sofort
- Bei Sicherheitsvorfällen: Nach Ankündigung

### Ist das System DSGVO-konform?

Ja, vollständig:
- Datentrennung (Anonymisierung)
- Recht auf Löschung implementiert
- Datenportabilität gewährleistet
- Verschlüsselung nach Stand der Technik
- Audit-Logs für Nachweisbarkeit

cannaUNITY ist ein freies Open-Source-Projekt unter der MIT-Lizenz.
Die aktuelle Version v0.6.20-pa dient ausschließlich der Mitentwicklung und Systemintegration. Die Software wird ohne Gewährleistung bereitgestellt. Die Nutzung erfolgt auf eigenes Risiko. Eine Haftung für Schäden oder Datenverluste wird ausgeschlossen.

Copyright (c) 2025 Sascha Dämgen IT and More
