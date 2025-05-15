Anleitung: Joomla-Integration mit Zero-Knowledge-Prinzip

Übersicht
Diese Anleitung beschreibt die datenschutzkonforme Integration eines Joomla-Backends in eine bestehende Django-Architektur nach dem Zero-Knowledge-Prinzip. Sie wurde so konzipiert, dass keine sensitiven Informationen unnötig verarbeitet oder gespeichert werden.

Architektur & Verbindung
Die Kommunikation erfolgt über einen gesicherten Tunnel, der den Zugriff auf das Joomla-Datenbanksystem ausschließlich über lokale Schnittstellen ermöglicht. Ein lokaler Port (z. B. 3307) wird dabei an den entfernten MySQL-Port (standardmäßig 3306) weitergeleitet – durch einen verschlüsselten, temporären SSH-Tunnel.

ssh -L 3307\:localhost:3306 username@<remote-host>

Für eine zuverlässigere Verbindung empfiehlt sich die Verwendung von zusätzlichen Optionen:

ssh -L 3307\:localhost:3306 -N&#x20;
-o "ServerAliveInterval 60"&#x20;
-o "ServerAliveCountMax 3"&#x20;
username@<remote-host>

Die Django-Anwendung greift über einen dedizierten Datenbankrouter (DATABASE\_ROUTERS) auf die getunnelte Joomla-Datenbank zu.

Funktionsprinzip

* Der Zugriff erfolgt einseitig: Django kann über den Tunnel lesend und schreibend auf Joomla-Daten zugreifen – Joomla besitzt jedoch keinerlei Zugang zu internen Django-Daten oder -Diensten.
* Gesicherte API-Ebene: Alle Synchronisierungen und Befehle laufen über klar definierte Endpunkte.
* Temporäre Zugangsdaten: Passwörter werden nur im RAM verarbeitet und nicht dauerhaft gespeichert.

Mitglieder-Synchronisation

* Beim Anlegen oder Aktualisieren eines Mitglieds generiert die API einen eindeutigen Joomla-Benutzernamen basierend auf einer UUID (z. B. user\_abcd1234).
* Ein sicheres Passwort wird per Zufall erzeugt (mindestens 16 Zeichen, mit Groß-/Kleinbuchstaben, Ziffern und Sonderzeichen).
* Das Passwort wird mit bcrypt (über passlib) gehasht – kryptografisch stark und kompatibel mit Joomla.
* Die Mitgliedsdaten (Name, E-Mail, Alter, THC-Limits) werden synchronisiert.
* Die Joomla-ID und das Klartext-Passwort werden einmalig in einem geschützten Notizfeld angezeigt und nicht persistiert.

Sicherheitsaspekte

* Tunnelbasiert: Kein direkter Zugriff auf die MySQL-Datenbank von außen.
* Minimale Rechte: Der verwendete Datenbanknutzer besitzt nur die notwendigsten Berechtigungen.
* Isolierte Datenhaltung: Nur temporärer Zugriff während Entwicklung oder Testbetrieb.
* Passwortschutz: Starke Hashing-Algorithmen sorgen für langfristige Sicherheit.
* Zero-Knowledge-Prinzip: Klardaten existieren nur flüchtig im RAM.

Vorteile in der Testphase
Diese Lösung ist ideal für Tests und Entwicklung:

* Sicherheit: Kein Zugang zu produktiven Systemen nötig.
* Realitätsnah: Die tatsächliche Joomla-Integration wird abgebildet.
* Flexibilität: Anpassungen können schnell durchgeführt werden.
* Datenschutzkonform: Keine unnötige Speicherung sensibler Informationen.

Diese Architektur bildet eine belastbare Grundlage für spätere Produktionsszenarien, ohne in der Entwicklungsphase Kompromisse bei Datenschutz und Sicherheit einzugehen.
