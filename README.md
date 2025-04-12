
# 🌿 cannaUNITY

> **Modulare Open-Source-Software für Cannabis-Anbaugemeinschaften**  
> Mitgliederverwaltung · Aufgabenplanung · Zutrittskontrolle · Track & Trace · Raumautomation · Sicherheitssysteme

![GitHub Repo stars](https://img.shields.io/github/stars/saschadaemgen/cannaUNITY?style=social)
![GitHub license](https://img.shields.io/github/license/saschadaemgen/cannaUNITY)
![GitHub last commit](https://img.shields.io/github/last-commit/saschadaemgen/cannaUNITY)

---

## 📦 Was ist cannaUNITY?

**cannaUNITY** ist eine umfassende Webplattform zur Organisation von Anbauvereinigungen nach dem Konsumcannabisgesetz.  
Die Software basiert auf modernen Open-Source-Technologien und deckt alle relevanten Bereiche ab – von der Mitgliederverwaltung bis zur Echtzeitsteuerung von Räumen über Touchscreens.

---

## 🧠 Architekturüberblick

- **Backend:** Django 5.x (API-only), REST Framework, PostgreSQL / SQLite
- **Frontend:** React + Vite + Material UI (Single Page Application)
- **Schnittstellen:** UniFi Access / Protect, Home Assistant, interne API-Module
- **Technologien:** TokenAuth, Axios, WebSocket-ready, Container-kompatibel

---

## 🔧 Setup & Installation

### Voraussetzungen

- Python 3.11+
- Node.js 18+
- PostgreSQL (oder SQLite für Tests)
- Git, npm, pip
- Empfohlen: VS Code, Docker (optional)

---

### Schnellstart

```bash
git clone https://github.com/saschadaemgen/cannaUNITY.git
cd cannaUNITY
cp .env.template .env
```

---

### Backend (Django API)

```bash
cd backend
python -m venv .venv
.\.venv\Scriptsctivate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

🧩 Die wichtigsten Python-Pakete (siehe `requirements.txt`):

```text
asgiref==3.8.1
certifi==2025.1.31
charset-normalizer==3.4.1
Django==5.2
django-cors-headers==4.7.0
djangorestframework==3.16.0
idna==3.10
requests==2.32.3
sqlparse==0.5.3
tzdata==2025.2
urllib3==2.4.0
websocket-client==1.8.0
websockets==15.0.1
```

---

### Frontend (React SPA)

```bash
cd ../frontend
npm install
npm run dev
```

---

## 🗂️ Projektstruktur (Auszug)

```
cannaUNITY/
├── backend/
│   ├── config/              # Django-Settings, URL-Routing
│   ├── members/             # Mitgliederverwaltung (API)
│   ├── rooms/               # Raumverwaltung & Sensorik
│   └── static/frontend/     # React-Build-Ausgabe
│
├── frontend/
│   ├── src/
│   │   ├── apps/members/    # React-Komponenten für Mitglieder
│   │   ├── layout/          # Sidebar, Topbar, Footer etc.
│   │   └── main.jsx         # SPA-Einstiegspunkt
```

---

## 🔐 Authentifizierungskonzept

- Login über `/api/token/` → API-Token wird im `localStorage` gespeichert
- Jeder API-Zugriff erfordert gültigen Token (`TokenAuthentication`)
- Logout entfernt Token lokal und optional serverseitig
- Optional: Absicherung über IP-Firewall und Standortfilterung (z. B. Starlink)

---

## 🚀 Module (Auswahl)

| Modul            | Beschreibung                                                                 |
|------------------|------------------------------------------------------------------------------|
| `members`        | Verwaltung von Mitgliedern, Status, Limits, Pflichtstunden                   |
| `trackandtrace`  | Verarbeitungskette von Samen bis Blüte (inkl. Stecklinge & Mutterpflanzen)   |
| `access`         | UniFi Access Integration (RFID, Gesichts-Auth, Zutrittslogs)                 |
| `rooms`          | Raummodule inkl. Sensorik, Klimaüberwachung, Long-Term-History               |
| `taskmanager`    | Aufgabenwolken, Zeitplanung, Stundenkontingente                              |
| `interface`      | Touchscreen-Brücke mit Raum-UI, Stundenplänen & Klimaanzeige                 |
| `controller`     | Grow-Steuerung & Raumautomatisierung                                         |
| `security`       | Alarm- & Sicherheitsmodul mit Behördenlogik                                  |
| `ha`             | Brücke zu Home Assistant zur Integration von Geräten & Zuständen             |
| `unifi`          | Zentrale Verarbeitung von UniFi Protect & Access Ereignissen                 |

---

## 🧪 Features

- ✅ Tokenbasierte API-Authentifizierung
- ✅ Dynamisches Frontend mit React/Vite
- ✅ Direkte Touchscreen-Steuerung mit Panel-UI
- ✅ Vollständiger Pflanzen-Lebenszyklus (Seed → Cut → Bloom)
- ✅ Verknüpfung mit Mitgliederprofilen
- ✅ Zeit- und Stundenmanagement (Pflichtstunden, 438 €-Grenzen)
- ✅ Responsive UI mit Material Design
- ✅ Modularer Aufbau (jede Funktion ist eigene App)

---

## 📃 Lizenz

**cannaUNITY** ist ein freies Open-Source-Projekt unter der [MIT-Lizenz](LICENSE).

---

## 🤝 Mitmachen

Pull Requests willkommen!  
Fragen, Anregungen oder Interesse an Zusammenarbeit?  
→ [GitHub Issues öffnen](https://github.com/saschadaemgen/cannaUNITY/issues/new)

---

> Erstellt mit ❤️ von **Sascha Daemgen** – unterstützt von einer zuckersüßen KI 👩‍💻🐻  
> Ziel: Eine sichere, moderne und gemeinschaftsorientierte Plattform für Anbauvereinigungen nach dem KCanG.
