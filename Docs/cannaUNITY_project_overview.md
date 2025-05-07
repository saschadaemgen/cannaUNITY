
# cannaUNITY – Projektübersicht & Technologie-Konzept

## 🧠 Grundidee

cannaUNITY ist eine moderne Webanwendung für Mitgliederverwaltung, Aufgabenplanung und Track & Trace von Cannabis-Produkten. Die Anwendung basiert auf einer Kombination aus **Django** im Backend und **React + Vite** im Frontend – umgesetzt als **Single Page Application (SPA)**.

---

## 🧩 Verwendete Technologien

| Bereich          | Technologie            | Zweck                                              |
|------------------|------------------------|-----------------------------------------------------|
| Backend          | Django 5.x             | Haupt-Framework für API, Authentifizierung, Logik  |
| Backend-API      | Django REST Framework  | Aufbau der JSON-API für alle Datenzugriffe         |
| Authentifizierung| TokenAuth (DRF)        | Login über API mit Token für SPA-Frontend          |
| Frontend         | React (mit Vite)       | Schnelles modernes Frontend mit Live-Reload etc.   |
| Styling          | Material UI (MUI)      | UI-Komponenten im Google-Material-Design           |
| Auth-Sync        | UniFi Access & Home Assistant | Hardware-Integration für RFID & Zutritt       |

---

## 📁 Ordnerstruktur (vereinfacht)

```
cannaUNITY/
├── backend/
│   ├── config/              # Django-Settings, URLs, WSGI
│   ├── members/             # Mitglieder-App (inkl. API)
│   ├── rooms/               # Räume & Sensorik
│   └── static/frontend/     # Build-Ausgabe aus React/Vite
│
├── frontend/
│   ├── public/              # Favicon etc.
│   ├── src/
│   │   ├── apps/members/    # React-Komponenten der Members-App
│   │   ├── layout/          # Layout-Komponenten (Sidebar, Footer)
│   │   ├── utils/           # z. B. axios-Konfiguration
│   │   ├── utils/date.js                 # parseDate für Datumskonvertierung
│   │   ├── apps/unifi_access/
│   │   │   ├── components/EventTable.jsx         # nutzt parseDate
│   │   │   ├── components/LastActivityCard.jsx   # nutzt parseDate
│   │   │   ├── components/ActivityInfo.jsx       # nutzt parseDate
│   │   │   └── pages/Dashboard.jsx               # nutzt parseDate

│   │   └── main.jsx         # Einstiegspunkt der App
│   └── index.html           # Wurzel-Template für Vite
```

---

## 🧭 Unser Architektur-Ansatz
- **Zentrale Utilitys**: Funktionen wie `parseDate()` für standardisierte Logik (z. B. Datumskonvertierung) werden zentral in `src/utils/` abgelegt und projektweit verwendet.


- **Single Page Application**: Die React-App wird bei Django unter `/` eingebunden und übernimmt das komplette Frontend-Routing.
- **API-only Backend**: Django liefert nur JSON-Daten – keine klassischen HTML-Seiten außer für das Index-Template.
- **Ordner-Spiegelung**: Jede Django-App bekommt ein Gegenstück im React-Bereich unter `apps/[appname]` für bessere Struktur und Erweiterbarkeit.
- **Token-Login**: Nach erfolgreichem Login erhält das React-Frontend einen API-Token, der für alle Anfragen genutzt wird.

---

## 🔐 Authentifizierungskonzept (Zusammenfassung)

- Nutzer loggen sich über `/api/token/` ein → erhalten einen API-Token
- Token wird in `localStorage` gespeichert & via Axios bei jeder Anfrage gesendet
- Logout löscht den Token lokal und optional per Server-API

---

## 📦 Besonderheiten & Vorteile
- **Zentrale Datumsformatierung**: Reaktionssichere Anzeige von deutschen Zeitstempeln via zentraler `parseDate()`-Funktion (`frontend/src/utils/date.js`)


- **RFID-Anbindung**: über UniFi Access + Home Assistant → Zugriff via Karte möglich
- **Admin-API-Tools**: Memberverwaltung, Räume, Sensoren u. v. m.
- **Sicherheit durch Struktur**: Zugriff nur mit gültigem Token + IP-Firewall + Host-Filterung (Starlink-Setup)
- **Flexible Ausbaufähigkeit**: vorbereitet für Containerisierung, zusätzliche Dienste, Offline-Modus

---

## 💡 Warum dieser Aufbau sinnvoll ist

- **Schnelle Entwicklung** dank Trennung von Backend & Frontend
- **Modernes UX/UI** mit React + Material UI
- **Zentrale Verwaltung** über Django-Admin & APIs
- **Hohe Wiederverwendbarkeit** durch komponentenbasierte Struktur
- **Zukunftssicher** – alles API-basiert, gut dockerisierbar, stabil & erweiterbar

---

## ✅ Status (April 2025)
- [x] WebSocket-Listener läuft extern und stabil
- [x] Datum wird korrekt dargestellt (kein Invalid Date mehr)
- [ ] Automatischer Heartbeat-Monitor für Listener geplant


- [x] Token-Login/Logout funktioniert stabil
- [x] Mitgliederliste via React lädt korrekt
- [x] Aufgaben & Track & Trace sind in Entwicklung
- [ ] Automatischer Abgleich mit externer Joomla-Datenbank via SSH-Tunnel geplant


---

## 🪄 Automatisches Einbinden von React-Build-Dateien in Django (Vite Manifest Integration)


Hinweis: React-Projekt verwendet aktuell relative Pfade (`../../../utils/date`) anstelle von `@/utils/date`, da der `@`-Alias noch nicht in der `vite.config.js` definiert wurde.

Optional: Alias-Konfiguration in `vite.config.js` könnte hinzugefügt werden:
```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```


Die gebauten React-Dateien (mit Hash im Dateinamen, z. B. `index-ABC123.js`) werden automatisch in Django eingebunden.  
Dafür wird `vite.config.js` wie folgt erweitert:

```js
build: {
  manifest: true,
  outDir: path.resolve(__dirname, '../backend/static/frontend'),
  emptyOutDir: true,
  rollupOptions: {
    input: 'src/main.jsx'  // Einstiegspunkt der App
  }
}
```

Zusätzlich wurde in Django ein Template-Tag eingerichtet (`vite_asset`), das das Manifest (`manifest.json`) automatisch ausliest.  
Dieses Tag wird in `index.html` verwendet:

```django
{% load static vite_tags %}
...
<script type="module" src="{% vite_asset 'src/main.jsx' %}"></script>
```

Das bedeutet:  
**Beim nächsten `npm run build` wird die neue Datei automatisch erkannt und geladen** – ohne manuelles Anpassen der `index.html`.  
Der Template-Tag liegt unter:  
`backend/members/templatetags/vite_tags.py`

Damit ist die Anbindung zwischen React + Vite und Django vollständig dynamisch und zukunftssicher.

---

## 🌐 Zugriff auf API-Endpunkte im Dev- und Build-Modus (Dual Routing)

Damit React sowohl im Vite-Dev-Modus (localhost:5173) als auch im Django-Build-Modus (localhost:8000) korrekt auf die APIs zugreifen kann, wird jeder API-Endpunkt doppelt eingebunden:

# Beispiel für unifi_access:
path('unifi_access/', include('unifi_access.urls', namespace='unifi_access_web')),      # für Port 8000
path('api/unifi_access/', include('unifi_access.urls', namespace='unifi_access_api')),  # für Port 5173

# Beispiel für unifi_protect:
path('unifi_protect/', include('unifi_protect.api_urls')),         # für Port 8000 (Build-Modus)
path('api/unifi_protect/', include('unifi_protect.api_urls')),     # für Dev-Modus

Vorteil: Der Vite-Dev-Server nutzt einen Proxy auf /api/* (siehe vite.config.js), sodass React z. B. /api/unifi_protect/sensors/ aufruft. Im Build-Modus hingegen ruft React direkt z. B. /unifi_protect/sensors/ auf – ohne Proxy, direkt über Django.

Wichtig: In urls.py muss zusätzlich ein Fallback-Catch-All definiert werden, damit alle nicht-API-Routen vom React-Router übernommen werden:

from django.urls import re_path
urlpatterns += [
    re_path(r'^(?!api|admin|static|media).*', index_view),
]

Damit sind alle React-Seiten wie http://localhost:8000/unifi-protect/sensoren auch im Build-Modus korrekt erreichbar – ohne Umwege oder manuelle Routenanpassung.

---

## 🔐 Authentifizierungssystem in cannaUNITY (Django + React)

## 🧩 Überblick

Wir verwenden in diesem Projekt **Token-basierte Authentifizierung** via `rest_framework.authtoken`. Der Token wird beim Login generiert und bei allen weiteren API-Anfragen mitgesendet. Das System schützt unsere API zuverlässig, besonders in Kombination mit `IsAuthenticated`.

---

## 1. 🔙 Django Backend

### 🧱 Installed Apps (`settings.py`)
```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    ...
]
```

### 🔐 Authentication Settings (`settings.py`)
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 🔁 API-Routen (`config/urls.py`)
```python
from rest_framework.authtoken.views import obtain_auth_token
from members.api_views import user_info, login_view, logout_view

urlpatterns = [
    path('api/token/', obtain_auth_token),        # → Login mit Token
    path('api/user-info/', user_info),            # → Aktueller Benutzer
    path('api/login/', login_view),               # → Optional eigene Logik
    path('api/logout/', logout_view),             # → Logout API
]
```

---

## 2. 🌐 React Frontend

### 🔧 Axios-Setup (`frontend/src/utils/api.js`)
```js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Token automatisch setzen
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Login-Funktion
export const login = async (username, password) => {
  try {
    const res = await api.post('/token/', { username, password })
    localStorage.setItem('authToken', res.data.token)
    return true
  } catch {
    return false
  }
}

// Logout-Funktion
export const logout = async () => {
  try {
    await api.post('/logout/')
  } catch (e) {}
  localStorage.removeItem('authToken')
}

export default api
```

---

### 🔐 Login-Component (Beispiel)
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../utils/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async () => {
    const success = await login(username, password)
    if (success) {
      navigate('/')
    } else {
      setError('Login fehlgeschlagen.')
    }
  }

  return (
    <>
      {/* Login-Formular */}
    </>
  )
}
```

---

### 🧠 MemberList-Absicherung (Beispiel)
```js
useEffect(() => {
  api.get('/user-info/')
    .then((res) => setUser(res.data))
    .catch(() => setUser(null))
}, [])
```

---

## ✅ Ablauf in Kurzform

| Schritt | Wer?       | Was passiert?                                                              |
|--------:|------------|-----------------------------------------------------------------------------|
| 1       | User       | Loggt sich mit Benutzername + Passwort ein                                 |
| 2       | Django     | Gibt einen Token zurück (`/api/token/`)                                    |
| 3       | React      | Speichert Token in `localStorage`, sendet ihn bei jedem API-Request mit    |
| 4       | Django API | Prüft Token mit `TokenAuthentication` und gibt Zugriff frei/verbietet ihn  |
| 5       | Logout     | Token wird aus `localStorage` entfernt (optional: API-Logout)              |

---

## 🔐 Sicherheit & Bewertung

| Aspekt           | Bewertung                                      |
|------------------|------------------------------------------------|
| Lokale Sicherheit | ✅ Gut, da auf geschlossenen Systemen |
| Token im Browser  | ⚠️ Im `localStorage`, deshalb später evtl. `httpOnly cookie` verwenden |
| Zugriffskontrolle | ✅ Streng durch `IsAuthenticated` in der API |
| Datenlecks möglich? | ❌ Nur bei Codefehlern oder offenem Browser |

---

## 🧾 Fazit

> Dieses Setup ist **ideal für lokale Umgebungen mit geschützter Hardware (Touchscreens, Terminals)**. Es funktioniert sicher, einfach und erweiterbar. Später kann es problemlos auf produktionssichere Methoden (z. B. JWT, Session-Cookies) umgestellt werden.

---

Erstellt mit ❤️ für Sascha.

---

## 🔁 Für neue Kontexte

Wenn dieses Dokument beim Chat-Start geladen wird, kann ich direkt verstehen:

- Welche Technologien genutzt werden
- Wo Dateien liegen & wie strukturiert wird
- Wie der Login funktioniert
- Was aktuell geplant & umgesetzt ist

---

## 🔁 WebSocket-Listener (ha_listener.py)

- Lauscht über WebSocket auf `unifi_access_entry`-Events aus Home Assistant
- Speichert die Events in das Django-Modell `AccessEvent`
- Muss manuell gestartet werden: `python backend/unifi_access/ha_listener.py`
- Django wird korrekt initialisiert über:
  ```python
  sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../config')))
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
  django.setup()
  ```
- Die automatische Integration in `apps.py` wurde entfernt, um doppelte Starts zu vermeiden.

---

## 🧱 Betrieb in der Produktion – Sicherheitskonzept

Dieser Abschnitt beschreibt empfohlene Maßnahmen zur Absicherung des cannaUNITY-Systems beim Einsatz auf einem öffentlichen Server oder im produktiven Umfeld.

### 🔒 1. Sicherheit auf Rootserver & Betriebssystemebene (Linux)

**System-Härtung**
- SSH-Zugriff ausschließlich mit Public-Key
- Root-Login deaktivieren
- Firewall (z. B. `ufw`) mit Whitelist für Web & SSH
- Fail2Ban zum Schutz vor Brute-Force-Angriffen

**Reverse Proxy**
- Einsatz von **NGINX** oder **Traefik** vor Django/React
- HTTPS via **Let's Encrypt / Certbot**
- CORS, HSTS, CSP-Header definieren

**Automatische Updates / Patch-Management**
- `unattended-upgrades` oder zentrale Ansible-Skripte
- Überwachung auf bekannte CVEs für Abhängigkeiten

**Deployment & User Isolation**
- Trennung von Systemusern für Dienste (z. B. `cannaunity-web`, `cannaunity-db`)
- Nutzung von `systemd`-Services mit `PrivateTmp`, `ProtectSystem=strict`

### ⚙️ 2. Django: Sicherheit & Absicherung der API

- `DEBUG = False` und `ALLOWED_HOSTS` korrekt gesetzt
- `SECRET_KEY` sicher gespeichert (z. B. in `.env` oder Vault)
- Nutzung von **HTTPOnly- & Secure-Cookies** für Authentifizierungs-Token
- Aktivierung von **CSRF-Schutz**, besonders bei API POST-Endpunkten
- `SECURE_BROWSER_XSS_FILTER = True`, `SECURE_CONTENT_TYPE_NOSNIFF = True`
- **Logging & Audit-Logs** für API-Zugriffe (z. B. mit `django-auditlog`)

### 🎨 3. React/Vite: Sicherheit im Frontend

- Kein Zugriff auf `.env`-Variablen mit sensiblen Inhalten im Frontend
- Build-Version mit `vite build` erzeugen, Hashes aktiv
- Public-Folder prüfen auf unerwünschte Dateien
- Schutz vor XSS über kontrollierte Komponenten & `dangerouslySetInnerHTML` vermeiden
- CSP-Header über NGINX erzwingen

### 🧊 4. Datenbanksicherheit (PostgreSQL + Verschlüsselung)

- **Festplattenverschlüsselung** auf Betriebssystemebene (`LUKS`, `dm-crypt`)
- **SSL/TLS aktivieren** in PostgreSQL (`ssl = on`, Zertifikate einrichten)
- **Rollenbasierte Zugriffssteuerung** (kein Public Access, least privilege)
- Einsatz von `pgcrypto` für spaltenbasierte Verschlüsselung sensibler Felder:

  ```sql
  SELECT pgp_sym_encrypt('0123 456789', 'my_secret_key');
  ```

- **Key Management** über HashiCorp Vault, Azure Key Vault oder eigene Lösung
- Zugriffsprotokollierung & Audit-Tools wie [`pgAudit`](https://www.pgaudit.org/)

### 💡 Zusätzliche Empfehlungen

- **Backups** regelmäßig & verschlüsselt (z. B. `borg`, `restic`)
- **Monitoring & Alerting** (z. B. UptimeRobot, Netdata, Prometheus/Grafana)
- **Zero-Trust-Netzwerkprinzip** (VPN, IP-Whitelisting, kein offenes Netz)
- **Security-Review aller Django-Endpoints** vor Deployment

> Hinweis: Diese Empfehlungen sind bewusst auf ein produktives Setup auf eigenem Rootserver abgestimmt. Für Cloud-Deployments (AWS, Azure, etc.) gelten abweichende Best Practices – inklusive VPC-Isolierung und IAM-Kontrollstrukturen.