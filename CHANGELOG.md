# 📦 CHANGELOG

Alle bemerkenswerten Änderungen an diesem Projekt werden in diesem Dokument festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), und das Projekt folgt dem semantischen Versionsschema [SemVer](https://semver.org/lang/de/).

---

## [0.6.17] – 2025-04-16
### 📊 Hauptbuch & Bilanzfunktionen
- Neues Hauptbuch-Modul mit Kontenübersicht, Journalansicht & Filter
- Bilanzdarstellung mit Saldenprüfung, Eigenkapital-Übernahme & Spaltenansicht
- GuV-Ergebnisse fließen automatisch in Passivseite ein
- Korrekte Filterung stornierter Buchungen
- Darstellung: SOLL/HABEN-Spalten mit Subbuchungen & farbiger Storno-Kennung
- Zeitzonenstandardisierung für alle Auswertungen

> 💚 GoB-konforme Buchhaltung auf dem Weg zur Vollversion.

## [0.6.16] 2025-04-15 – Buchhaltungssystem vollständig implementiert und erweitert
### 🎯 Neue Funktionen (komplett implementiert)
- **Einführung eines vollständigen Buchhaltungssystems** mit:
  - Anlage und Verwaltung von **Einzelbuchungen**
  - Verarbeitung von **Mehrfachbuchungen** mit mehreren Sub-Transaktionen
  - Direkte Verknüpfung mit **Mitgliedskonten** inklusive Saldenanzeige
  - Separate Anzeige von **Mitgliedsbeiträgen** mit automatischer Buchung
  - Einrichtung eines **GoB-konformen Kontenrahmens** (SKR-ähnlich):
    - 97 vordefinierte Konten für Aktiv/Passiv/Aufwand/Ertrag
    - Möglichkeit zur späteren Erweiterung und individueller Anpassung
  - Vorbereitungen für **EÜR und Bilanzierung**, um je nach Betriebsform zu wechseln
  - Automatische **Buchungsnummernvergabe** (YYYYMMDD-001, -002 usw.)

### 🧾 Storno-Funktionalität

- Implementierung der **GoB-konformen Stornobuchung**
  - Jede Stornierung erzeugt eine **Gegenbuchung** mit umgekehrtem Konto-Fluss
  - Neue Buchungsnummern erhalten automatisch ein fortlaufendes Suffix `-S`
  - Originalbuchungen werden als **storniert markiert**, bleiben aber im System
  - Visuelle Darstellung von:
    - ✅ **Storno-Buchung** (grün hervorgehoben, Italics)
    - 🚫 **stornierte Buchung** (rot, durchgestrichen)
  - Sub-Transaktionen ebenfalls automatisch gespiegelt

### 📊 Visuelle Verbesserungen im Journal

- Neue React-Komponente **`JournalList.jsx`**
  - Filterbar nach **Typ**, **Zeitraum**, **Mitglied**
  - Farbliche Kodierung nach Typ
  - **Erweiterbare Detailansicht** mit:
    - Sub-Buchungen (Mehrfach)
    - T-Konten-Darstellung (Soll/Haben)
    - Info-Boxen zu Storno-Bezügen
  - Fehlerbehandlung für alle Lade- & Buchungsvorgänge

### 🔧 Backend-Erweiterungen

- Neuer **ViewSet `BookingViewSet`** mit:
  - `delete-with-rollback`: Rückrechnung bei Löschung
  - `storno_booking`: GoB-konforme Stornobuchung
- Verbesserungen in `BookingSerializer` zur robusteren Verarbeitung von Nummernformaten
- Zusätzliche Prüfungen und Rückmeldungen via `Response(...)`

### ✅ Bugfixes

- Fehlerhafte Prüfung auf `original.storniert` → korrekt: `storniert_am`
- Fehlerhafte Einrückung im `views_api.py`
- Fehlerhafte Nummernextraktion bei Stornos mit Suffix → behoben
- Frontend-Fehler `filtered is not defined` → komplette Komponente refactored

### 🔜 Geplante Features

- 🧠 **Automatische Kontoerstellung** bei neuen Einnahmearten
- 🏦 **HWCI Onlinebanking-Integration** für automatische Buchung von Mitgliedsbeiträgen
- 📈 **Bilanz, GuV, Monats- und Jahresberichte**
- 💬 Export als GoBD-konforme CSV & PDF
- 🔍 Drilldown-Funktion je Konto

> 💚 Ein ganzheitliches, prüfungstaugliches Buchhaltungssystem für Anbauvereinigungen mit Echtzeit-Funktionen, Stornobuchungen und voller GoB-Konformität.

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
