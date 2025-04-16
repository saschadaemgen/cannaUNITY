# 📁 templates/

In diesem Ordner befinden sich **Vorlagen-Dateien**, die du für den Betrieb des CanaUNITY Listener-Systems benötigst. Diese Dateien sind **nicht sofort einsatzbereit**, sondern dienen als **Templates**, die du an deine eigene Infrastruktur anpassen musst.

---

## 📄 `.env.example` – Konfigurationsvorlage für API-Zugänge

Diese Datei enthält Platzhalter und Beispielwerte für API-Zugangsdaten, die von den verschiedenen Komponenten des Listener-Systems benötigt werden. Sie sollte **nicht direkt im Repository angepasst**, sondern **kopiert und angepasst** werden.

### 🔐 Zweck dieser Datei

Das `.env.example`-Template liefert eine sichere Struktur zur Einbindung sensibler Daten wie Token, IP-Adressen und Schnittstellen-Endpunkte. So können Konfigurationsdaten getrennt vom Code gehalten werden – ein bewährter Sicherheitsstandard.

```bash
cp templates/.env.example .env
```

> **Hinweis:** Die Datei `.env` selbst wird aus Sicherheitsgründen nicht mitgeliefert und ist in `.gitignore` eingetragen.

---

## ⚙️ Erklärung der Konfigurationswerte

| Variable                         | Beschreibung |
|----------------------------------|--------------|
| `UNIFI_ACCESS_HOST`              | Lokaler Zugriffspunkt (Controller-Adresse) für UniFi Access. |
| `UNIFI_ACCESS_TOKEN`            | Token für die Authentifizierung mit der UniFi Access API. |
| `HOME_ASSISTANT_ACCESS_TOKEN`   | Bearer-Token für Home Assistant API-Zugriffe. |
| `HOME_ASSISTANT_API_URL`        | Basis-URL deines Home Assistant-Servers (inkl. Port). |

---

## 📌 Wo muss die Datei hin?

Kopiere die `.env.example`-Datei in das **Hauptverzeichnis** deiner CanaUNITY Installation und benenne sie in `.env` um:

```bash
cp templates/.env.example .env
```

Danach kannst du deine eigenen API-Daten dort eintragen.

---

## ❗ Wichtig

- Gib **niemals deine echte `.env`-Datei weiter** – weder per E-Mail noch über GitHub.
- Verwende `.env.example`, um anderen die Struktur bereitzustellen.
- Nutze `.gitignore`, um `.env` vom Repository auszuschließen (bereits vorbereitet).

---

**Autor:** Sascha Dämgen  
**Firma:** IT and More  
**Lizenz:** MIT License