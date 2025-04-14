# 📦 CHANGELOG

Alle bemerkenswerten Änderungen an diesem Projekt werden in diesem Dokument festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), und das Projekt folgt dem semantischen Versionsschema [SemVer](https://semver.org/lang/de/).

---

## [0.6.15] – 2025-04-14
### ✨ Hinzugefügt
- Neues Optionspanel im Frontend implementiert (`OptionsDashboard`)
- `OptionCard`-Komponente mit wiederverwendbarem Layout & Switch-Funktion
- Dark-Mode-Toggle als erste Systemoption integriert
- Autostart-Support für den WebSocket Listener (`ha_listener.py`) via `.vbs` realisiert
- Installer- & Uninstaller-Skripte für Windows (versteckter Hintergrundstart)
- Erkennung & Entfernung alter Tasks aus der Windows-Aufgabenplanung

### ♻️ Geändert
- UI-Karten mit einheitlichem Design: Border, Schatten & kompakter Stil
- `install_listener.vbs` komplett überarbeitet mit sauberen Anführungszeichen (kein Syntaxfehler mehr)
- OptionCard vereinfacht: keine 3D-Effekte mehr, sauberes UX

### 🐛 Gefixt
- Ungültige `.vbs`-Erstellung durch fehlerhafte Quotes
- „Anweisungssende erwartet“-Fehler beim Windows-Start
- Ungültiger Autostart durch fehlerhafte VBS-Pfade

---

## [0.6.14] – 2025-04-13
### ✨ Hinzugefügt
- `DISCLAIMER.md`: Haftungsausschluss zu Nutzung, Risiken & Verantwortung
- GPG-Commit-Signaturen für verifizierte Commits
- Neue parseDate()-Utility-Funktion im Frontend (JS)

### ♻️ Geändert
- WebSocket Listener (`ha_listener.py`) wird jetzt separat ausgeführt
- Frontend-Komponenten (Dashboard, EventTable, ActivityInfo usw.) nutzen jetzt zentral `parseDate()`

### 🐛 Gefixt
- "Invalid Date"-Bug in Event-Anzeige durch fehlerhafte Timestamps

### 🔒 Sicherheit & Struktur
- README vollständig überarbeitet mit Datenschutz- und Architekturinfos
- Lizenz vollständig entfernt & neu als MIT-Vorlage integriert

---

## [0.6.13] – 2025-04-12
### ✨ Hinzugefügt
- Neue App `security` erstellt
- RFID/Access-Komponenten vorbereitet

### ♻️ Geändert
- Dashboard-Kompatibilität für Auth/Ports verbessert

---

## [0.6.0] – Initial Release
- Projekt gestartet mit Basisstruktur für Django & React
- Mitgliederverwaltung, Frontend-Basics, Seed-Datenmodell
