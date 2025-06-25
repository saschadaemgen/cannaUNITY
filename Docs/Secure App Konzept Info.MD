Konzept zur sicheren Architektur und technischen Umsetzung der Mitglieder-App

1. Ziel und Kontext

Die Mitglieder-App dient der geschützten Kommunikation, Verwaltung und Selbstauskunft innerhalb eines legalen Cannabis-Anbauvereins nach dem deutschen Konsumcannabisgesetz (KCanG). Sie ist ausschließlich für verifizierte Vereinsmitglieder nutzbar. Die App ist nicht öffentlich zugänglich, erfüllt höchste Datenschutzstandards und verzichtet vollständig auf die Speicherung oder Verarbeitung personenbezogener Daten außerhalb des lokalen Vereinsservers.

2. Technologiewahl und Tooling

Für die Entwicklung der App setzen wir auf folgende Technologien:

Frontend:
React Native: Framework zur plattformübergreifenden Entwicklung für Android und iOS mit JavaScript/React.
Expo: Entwicklungsumgebung für schnelles Prototyping, integrierte APIs und App-Testing.
Expo Go: Mobile App zur direkten Vorschau der entwickelten Anwendung auf echten Geräten per QR-Code.
EAS Build (Expo Application Services): Cloud-Build-Dienst für den nativen Export von Android- und iOS-Binaries (APK/IPA).
React Navigation, Secure Store, Biometrie-Module, ggf. Custom QR-Scan-Module

Backend:
Lokaler Vereinsserver (z. B. Django + PostgreSQL): Speichert sämtliche sensiblen personenbezogenen Daten sicher im Vereinsnetzwerk.
Externer Sync-Server (Node.js, Django REST API oder vergleichbar): Überträgt pseudonymisierte Informationen, die die App abrufen darf (UUID-basiert).

Authentifizierung:
Token-basierte Anmeldung: Manuell generierter Zugangscode oder QR-Code bei Verifizierung.
Optional: E-Mail-Login mit Einmal-Token für spezielle Nutzer (z. B. Vorstände)
Biometrische Verifikation (Face ID / Fingerprint) kombiniert mit PIN – oder bei Geräten ohne Biometrie ein 3-Faktor-Login (PIN + Passwort + Code).

Build & Release:
Android APK: mit kostenlosem EAS Build möglich
iOS IPA: mit Apple Developer Account (99 $/Jahr), über EAS Build mit Wartezeit oder per kostenpflichtigem Plan (ab 29 $/Monat)
Verteilung über Play Store, App Store oder direkt als Downloadlink (z. B. TestFlight, OTA-Links)
Achtung: Die App sollte explizit vom jeweiligen Verein oder der zugehörigen Genossenschaft veröffentlicht werden, da sonst eine Ablehnung erfolgen könnte im Store. 

3. Architekturübersicht

Lokaler Server (intern, geschützt)
Speicherung aller personenbezogenen Daten:
Name, Geburtsdatum, Adresse
Konsumverlauf, Mitgliedschaftsstatus
Nicht erreichbar aus dem Internet
Keine API-Schnittstellen für externe Systeme
Externer Online-Sync-Server

Enthält ausschließlich:
UUIDs (anonymisierte Mitgliedskennungen)
Tokenbasierte Berechtigungsstruktur
App-relevante Nutzdaten (z. B. Kalenderinfos, Vereinsnachrichten, Limits)
Keine Rückschlüsse auf reale Identitäten möglich
Keine Verbindung oder Zugriff zum lokalen Server

4. Zero-Knowledge-Prinzip in der Praxis

Die App besitzt keine Möglichkeit, auf die interne Datenbank zuzugreifen.
Ein Token wird persönlich beim Verein generiert und zugewiesen (z. B. über QR-Code, Passkey oder In-Person-Verifikation).
Die App kommuniziert ausschließlich mit dem externen Sync-Server und erhält dort pseudonymisierte Daten zur Anzeige.
Jegliche Rückschlüsse auf reale Personen oder Mitglieder sind selbst im Falle eines vollständigen Online-Leaks technisch ausgeschlossen.

5. Sicherheitsmaßnahmen

Keine Speicherung von Namen, Adressen, Geburtsdaten oder E-Mails außerhalb des internen Vereinsservers
TLS 1.3-verschlüsselte Verbindungen
UUIDs als nicht rückführbare Identifikatoren
Tokens mit begrenzter Gültigkeit und Gerätebindung
Kein Zugriff der App auf interne Serverdatenbank oder API
App-Synchronisation rein passiv (z. B. alle 2 Minuten Pull vom externen Server)
Zwei-Faktor-Authentifizierung (Biometrie + PIN)
Bei fehlender Biometrie: Drei-Faktor-Authentifizierung (PIN + Passwort + Code)

6. Joomla CMS / API Integration (optional)

Falls Joomla als Mitgliederportal verwendet wird, erfolgt die Kommunikation über eine eigene Middleware
Die App liest niemals direkt aus Joomla, sondern nutzt vorberechnete UUID-bezogene Informationen
Keine API-Authentifizierung über personenbezogene Accounts
Keine Speicherung personenbezogener Joomla-Daten in der App
Anbindung über abgesicherte, datensparsame API-Endpunkte

7. App-Store Konformität

Allgemein
Veröffentlichung ausschließlich unter dem Namen des eingetragenen Vereins
Kein öffentlicher Nutzungszweck / keine Bewerbung der App als Cannabisplattform
Beschreibungstext ausschließlich funktional und sachlich:
„Diese App ist ausschließlich für Mitglieder der Anbauvereinigung Recklinghausen gemäß §2 KCanG. Eine Nutzung ist nur nach vorheriger Verifizierung und persönlicher Token-Zuweisung möglich.“
Apple App Store
Altersfreigabe: 18+
Keine In-App-Käufe, keine Drittabwicklung
Transparente Erklärung an Apple Review: nur für geschlossene Nutzergruppe
Google Play Store
App richtet sich ausschließlich an verifizierte Mitglieder
Kein Produktverkauf, kein Konsumaufruf, keine Bestellung von Cannabis über die App
Screenshots: neutrale, nicht konsumorientierte UI (z. B. Mitgliederstatus, News, Kalender)

8. Besonderheiten zur Darstellung der Erzeugnisse

Es handelt sich nicht um Produkte, sondern um gemeinschaftlich erzeugte, nichtkommerzielle Erzeugnisse.
Keine Begriffe wie „Sortiment“, „Bestellung“, „Kauf“, „Shop“.
Informationen zu Erzeugnissen (z. B. Sorte, Analyse, Verfügbarkeit) sind nur nach erfolgreicher Verifikation sichtbar.
Vorheriger Zugriff auf solche Inhalte ist nicht möglich, weder im Store noch in der App vor dem Login.
Die Darstellung erfolgt ausschließlich informativ (z. B. „Charge verfügbar ab: ...“), nicht werbend.

Fazit
Die Architektur erfüllt höchste Anforderungen an Datensicherheit, Datensparsamkeit, Nichtöffentlichkeit und gesetzliche Konformität. Der Zugriff auf sensible Mitgliedsdaten ist vollständig technisch ausgeschlossen. Die App kann daher bedenkenlos als internes, geschütztes Vereinswerkzeug betrieben werden, ohne gegen DSGVO oder §6 KCanG zu verstoßen.