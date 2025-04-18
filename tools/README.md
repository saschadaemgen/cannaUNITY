# cannaUNITY Listener v1.0

Willkommen zum **cannaUNITY Listener** – einem erweiterbaren Hintergrunddienst für die zentrale Ereignisverarbeitung und Automatisierung in der cannaUNITY-Infrastruktur.

---

## 🔧 Aktueller Stand

Der Listener befindet sich derzeit in der **Pre-Release-Phase**. Das bedeutet:

- ⚠️ **Einige Dateipfade müssen derzeit noch manuell angepasst werden**.
- 📁 Die Pfade sind direkt in den Skripten (`install_listener.vbs`, `start-listener.bat`, `uninstall_listener.vbs`) hinterlegt.
- 🔧 Diese manuelle Anpassung wird in späteren Versionen vollständig automatisiert.

---

## 📦 Enthaltene Dateien

| Datei                   | Beschreibung |
|------------------------|--------------|
| `install_listener.vbs` | Installiert den Listener als geplanten Task/Systemdienst unter Windows. Keine Adminrechte erforderlich. |
| `start-listener.bat`   | Startet den Listener manuell – nützlich für Tests und Debugging. |
| `uninstall_listener.vbs` | Entfernt den Listener wieder aus dem System. |

---

## 🪟 Installation unter Windows

> **Vorteil:** Der Listener benötigt keine Administratorrechte.

### 🧭 Schritte:

1. Stelle sicher, dass `install_listener.vbs`, `start-listener.bat` und `uninstall_listener.vbs` sich im gleichen Verzeichnis befinden.
2. Öffne die Eingabeaufforderung (`cmd`) **ohne Administratorrechte**.
3. Navigiere zum Speicherort:
   ```cmd
   cd Pfad\zum\Listener
   ```
4. Starte die Installation:
   ```cmd
   cscript install_listener.vbs
   ```
5. Der Listener wird als geplanter Task angelegt und beim Systemstart automatisch ausgeführt.

### ❌ Deinstallation:
```cmd
cscript uninstall_listener.vbs
```

---

## 🐧 Installation unter Linux

> Der Linux-Support ist in Vorbereitung – native Services folgen. Bis dahin ist ein manuelles Starten möglich.

### Vorbereitend:
- Stelle sicher, dass dein Listener-Skript unter Linux lauffähig ist (z. B. Python, Node.js oder Bash-basiert).

### Systemdienst (manuell):
1. Erstelle eine Datei z. B. `/etc/systemd/system/canaunity-listener.service`:
   ```ini
   [Unit]
   Description=CanaUNITY Listener Service

   [Service]
   ExecStart=/pfad/zum/start-listener.sh
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

2. Aktiviere den Dienst:
   ```bash
   sudo systemctl daemon-reexec
   sudo systemctl enable canaunity-listener
   sudo systemctl start canaunity-listener
   ```

---

## 🧩 Zukünftige Module & Erweiterungen

Der Listener wird bald eine Vielzahl von nativen Integrationen unterstützen:

### 🔐 UniFi-Integration
- **UniFi Access**: Über die Home Assistant API & später nativ.
- **UniFi Protect**: Kamera-Ereignisse, Bewegungsmelder, AI Key-Erkennung.
- **UniFi Netzwerk**: Präsenz-Tracking, DHCP-Logik, Device-Watchdog.

### 🏠 Smart-Home & Steuerung
- **Home Assistant** (nativ & API)
- **I.O. Broker**
- **MQTT**
- **Sensor-/Aktoren-Einbindung**
- **Logikverknüpfungen und Raumkonfiguration**

### 🏭 Industrielle Systeme
- **Loxone Miniserver**
- **Siemens Logo! 8**
- **Siemens S7 (SIMATIC)**

---

## 💡 Vision

Mit cannaUNITY entsteht ein flexibles, modulares System zur Ereignisverarbeitung, Automatisierung und intelligenten Steuerung – ideal für Anbauvereinigungen, Smart Homes, Gewerbe und Industrie.

---

## ⚖️ Lizenz

**MIT License** – frei nutzbar, anpassbar und erweiterbar.

---

## 📜 Haftungsausschluss

> Dieses Projekt wird bereitgestellt von **Sascha Dämgen – IT and More**  
> Die Nutzung erfolgt auf eigene Verantwortung. Für Schäden, die durch den Einsatz entstehen, wird keine Haftung übernommen.

---

**Made with ❤️ by Sascha Dämgen**
