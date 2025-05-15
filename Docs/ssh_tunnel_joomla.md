Anleitung: Joomla-Integration mit Zero-Knowledge-Prinzip
Übersicht
Sehr gerne, Sir. Hier ist die kompakte Anleitung zur Joomla-Integration nach dem Zero-Knowledge-Prinzip:
Architektur & Verbindung
Aktuell verbinden wir uns mit Joomla über einen verschlüsselten SSH-Tunnel zum Root-Server (194.164.197.247). Dieser Tunnel leitet den lokalen Port 3307 auf den MySQL-Port des Servers (3306) weiter.

bashssh -L 3307:localhost:3306 username@194.xxx.xxx.xxx

Zusätzliche Optionen für persistenten Tunnel
Für einen robusteren Tunnel, der automatisch versucht, die Verbindung aufrechtzuerhalten:
bashssh -L 3307:localhost:3306 -N -o "ServerAliveInterval 60" -o "ServerAliveCountMax 3" username@194.xxx.xxx.xxx

Die Datenbankverbindung wird in Django als separater Datenbankrouter 'joomla' konfiguriert und greift über diesen Tunnel zu.
Funktionsprinzip

Daten-Isolation: Unsere Django-Anwendung hat niemals direkten Zugriff auf die Joomla-Server-Umgebung
Gesicherte API: Alle Operationen laufen über dokumentierte API-Endpunkte
Temporäre Credentials: Passwörter werden nur temporär im Speicher gehalten

Mitglieder-Synchronisation
Bei der Erstellung/Aktualisierung von Mitgliedern:

Die API erzeugt einen eindeutigen Benutzernamen basierend auf der UUID (user_[uuid-teil])
Ein sicheres Passwort wird mit secrets.choice generiert (16 Zeichen, diverse Zeichenklassen)
Der Passwort-Hash wird mittels bcrypt (über passlib) erstellt - kryptografisch stark und Joomla-kompatibel
Mitgliedsdaten werden synchronisiert (Name, E-Mail, Alter, THC-Limits je nach Altersklasse)
Die Joomla-ID und generierte Passwörter werden vorübergehend angezeigt und im notes-Feld gespeichert

Sicherheitsaspekte

Tunnelbasiert: Keine öffentliche Exposition der MySQL-Datenbank
Eingeschränkte Rechte: Der joomla_sync Benutzer hat nur die minimal nötigen Berechtigungen
Isolierte Datenbank: Durch den Tunnel nur während der Entwicklung/Tests verfügbar
Passwort-Sicherheit: Bcrypt-Hashing mit hoher Sicherheit
Temporäre Datenhaltung: Das Klartext-Passwort wird nur einmalig angezeigt

Vorteile in der Testphase
Diese Implementierung ist ideal für die Testphase, da sie:

Sicherheit wahrt: Keine Produktionsdaten oder -systeme werden exponiert
Realistische Tests ermöglicht: Die tatsächliche Joomla-Integration wird getestet
Flexibel bleibt: Probleme können schnell identifiziert und behoben werden
Datenschutzkonform ist: Weder Klartext-Passwörter noch persönliche Daten werden unnötig gespeichert

Diese Architektur bildet eine hervorragende Grundlage für die spätere Produktionsumgebung, während sie gleichzeitig ausreichend Isolation und Sicherheit für die Testphase bietet.