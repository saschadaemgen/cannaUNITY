# 🐳 docker/

Dieser Ordner enthält alle Konfigurationsdateien, Dockerfiles und Compose-Definitionen zur Containerisierung des CanaUNITY Listener-Systems.

---

## 🚀 Was ist hier drin?

| Datei | Zweck |
|-------|-------|
| `Dockerfile` | Erstellt ein eigenständiges Image für den CanaUNITY Listener |
| `docker-compose.yml` | Startet das gesamte System (z. B. Listener + Services) über Docker Compose |
| `.env.docker.example` | Vorlage für Umgebungsvariablen im Containerbetrieb |
| `entrypoint.sh` | Optionales Startskript beim Container-Start |

---

## 📦 Ziel des Ordners

Dieser Ordner wird verwendet, um:
- den Listener in Containern zu betreiben
- zukünftige Module wie UniFi Access, MQTT, Home Assistant etc. einfach zu kapseln
- automatisierte Builds & Deployments vorzubereiten (CI/CD, GitHub Actions, etc.)

---

## 📄 Anleitung (folgt)

Die konkreten Dockerfiles, Compose-Definitionen und Starter-Skripte werden hier nach und nach ergänzt. Sobald ein Image fertig ist, steht hier eine ausführliche Anleitung.

---

## 📁 Geplante Docker-Images

- `canaunity-listener` (Basis)
- `canaunity-unifi-access`
- `canaunity-home-assistant-proxy`
- `canaunity-mqtt-bridge`
- `canaunity-lockzone-gateway`
- `canaunity-network-logger`

Diese Images erscheinen schrittweise im Laufe der Weiterentwicklung.

---

## 📌 Hinweis

Dies ist ein vorbereitender Bereich – die fertigen Docker-Komponenten folgen bald. Nutze bis dahin ggf. manuelle Skripte oder den systemd-Dienst.

