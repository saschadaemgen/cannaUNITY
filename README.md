# 🌿 cannaUNITY v0.6.16

> **Modulare Open-Source-Software für Cannabis-Anbaugemeinschaften**  
> Mitgliederverwaltung · Aufgabenplanung · Zutrittskontrolle · Track & Trace · Raumautomation · Sicherheitssysteme

![GitHub Repo stars](https://img.shields.io/github/stars/saschadaemgen/cannaUNITY?style=social)
![GitHub license](https://img.shields.io/github/license/saschadaemgen/cannaUNITY)
![GitHub last commit](https://img.shields.io/github/last-commit/saschadaemgen/cannaUNITY)

---

## 📦 Was ist cannaUNITY?

**cannaUNITY** ist eine umfassende Open-Source-Plattform zur Organisation, Verwaltung und Automatisierung von Cannabis-Anbauvereinigungen gemäß dem Konsumcannabisgesetz (KCanG).  
Das System wurde mit dem Ziel entwickelt, Datenschutz, Nachverfolgbarkeit und Mitwirkung der Mitglieder auf höchstem technischen Niveau umzusetzen.

---

## 🧠 Architekturüberblick

- **Backend:** Django 5.x (API-only), Django REST Framework, PostgreSQL / SQLite
- **Frontend:** React + Vite + Material UI (SPA)
- **Schnittstellen:** UniFi Access/Protect, Home Assistant, Siemens LOGO!, Siemens SIMATIC, Loxone Mini Server
- **Technologien:** TokenAuth, WebSocket, Axios, passkey-auth, Container-kompatibel

---

## 🛡️ Datenschutz & Anonymisierungskonzept

**cannaUNITY** basiert auf dem Zero-Knowledge-Prinzip:  
Es findet eine strikte Trennung zwischen personenbezogenen Daten (lokal) und anonymisierten Online-Daten (UUID-basiert) statt. Der Onlinebereich erhält **niemals** Zugriff auf echte Identitäten.

### Authentifizierung & Zugriffskontrolle

- **Online-Login:** Passkey (biometrisch), alternativ 3-Faktor mit PIN  
- **Zutritt zur Anlage (Außenbereiche):** UniFi Access mit RFID, Gesichtserkennung, optional PIN  
- **Innenbereiche (z. B. Blütekammer):** Zugang ausschließlich per NFC/RFID, automatische Arbeitszeiterfassung  
- **Produktionsschritte:** Track&Trace-Eingaben erfolgen über RFID/NFC-Terminals mit Rollenbindung

---

## 🔁 Track & Trace: Vom Samen bis zur Ausgabe

Jeder Verarbeitungsschritt ist dokumentiert und manipulationssicher protokolliert:

1. **Einkauf** des Samens
2. **Einpflanzung** – entweder zur Mutterpflanze oder direkt zur Blühpflanze
3. **Wuchsbetreuung** – Zuweisung von Zuständigen mit Track&Trace
4. **Ernte**
5. **Trocknung**
6. **Laborkontrolle**
7. **Verarbeitung**
8. **Produktausgabe** an Mitglieder (anonymisiert)
9. **Vernichtung** (optional, wenn nötig)

Jeder Schritt wird über die Mitarbeiterkonten per RFID/NFC bestätigt und in Echtzeit dokumentiert.

---

## 🔧 Integration & Automatisierung

- **Siemens LOGO!** vollständig integrierbar
- **Siemens SIMATIC** kompatibel
- **Loxone Mini Server** mit Raumanzeige, Klima- und Lichtsteuerung
- Weitere industrielle Schnittstellen folgen (MQTT, Modbus etc.)

---

## 🐳 Bereitstellung & Infrastruktur

Geplant sind:

- Eigene **Docker-Images** mit Standardkonfiguration
- **Proxmox-kompatible Images** für einfache VM-Einbindung
- Eigene **Linux-Distribution (cannaOS)** für speziell konfigurierte Mini-PCs
- Verkauf von **zertifizierten Mini-PCs** mit vorinstalliertem System

---

## 📂 Projektstruktur (Auszug)

```
cannaUNITY/
├── backend/
│   ├── config/            # Django-Einstellungen
│   ├── members/           # Mitgliederverwaltung
│   ├── rooms/             # Räume & Sensorik
│   └── static/frontend/   # Build der React-App
├── frontend/
│   ├── src/
│   │   ├── apps/          # React-Apps pro Django-Modul
│   │   ├── layout/        # Topbar, Sidebar, Footer
│   │   └── main.jsx
```

---

## 🔐 Authentifizierungskonzept

- Tokenbasierte API-Auth (Token wird im `localStorage` gespeichert)
- Passkey-Login mit 2-/3-Faktor-Authentifizierung
- Zutritt zur Anlage & Innenräumen über UniFi / RFID
- Online-Zugriff strikt anonymisiert über UUID

---

## 🚀 Module (Auszug)

| Modul            | Beschreibung                                                                 |
|------------------|------------------------------------------------------------------------------|
| `members`        | Mitglieder, Limits, Pflichtstunden, Statusverwaltung                         |
| `trackandtrace`  | Verarbeitungsschritte (Seed → Bloom → Ausgabe) inkl. Vernichtungen           |
| `access`         | UniFi Access: RFID, FaceID, Logs, Zutrittsrechte                             |
| `rooms`          | Raumverwaltung mit Klima, Sensoren & Automation                              |
| `taskmanager`    | Aufgabenreservierung, Stundenkonto, Abgleiche                                |
| `buchhaltung`    | GoB-konforme Buchhaltung mit HBCI Abgleich,                                  |
| `interface`      | Touchpanels, Raumterminals, Infodisplays                                     |
| `controller`     | Anbindung Siemens/Loxone, Aktorik, Automatisierung                           |
| `security`       | Alarmsysteme, Notfallzugänge, Behördenzugriff                                |
| `ha`             | Home Assistant Integration                                                   |

---

## 🧪 Features

- ✅ Echtzeit-Track&Trace von Pflanzen & Verarbeitung
- ✅ Arbeitszeiterfassung mit Minijob-Erkennung
- ✅ Dynamische Mitgliederprofile mit RFID
- ✅ Raumautomation (Loxone, Siemens)
- ✅ Vollständige Protokollierung für Behördenzugriff
- ✅ Touchpanelsteuerung & Raumanzeige
- ✅ Anonymisierte Produktausgabe mit UUID
- ✅ GoB-konforme Buchhaltung mit vollständiger Journaldarstellung
- ✅ Stornobuchungen mit gegenbuchender Rückabwicklung (SOLL/HABEN)
- ✅ Einzel- und Mehrfachbuchungen inkl. Subtransaktionen & Kontenwahl
- ✅ Vollständige Verknüpfung zu Mitgliedskonten & Mitgliedsbeiträgen
- ✅ Filterbare Journalansicht nach Jahr, Monat, Typ & Stornostatus
- ✅ Docker-, Proxmox- & Baremetal-ready

---

## 📃 Lizenz

**cannaUNITY** ist ein freies Open-Source-Projekt unter der [MIT-Lizenz](LICENSE).

---

## 🤝 Mitmachen

Pull Requests & Vorschläge willkommen!  
→ [GitHub Issues öffnen](https://github.com/saschadaemgen/cannaUNITY/issues/new)

---

> Erstellt mit ❤️ von **Sascha Dämgen** und seiner zuckersüßen KIA "A.K.I.A".  
> Vision: Eine sichere, moderne und gemeinschaftsgetragene Plattform für den verantwortungsvollen Umgang mit Cannabis.
