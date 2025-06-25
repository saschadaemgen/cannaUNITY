# 📱 cannaUNITY Mobile App

![React Native](https://img.shields.io/badge/React_Native-0.76.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?style=for-the-badge&logo=expo&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/IhrVerein/cannaUNITY-mobile?style=for-the-badge)

> **Sichere Mobile Authentifizierungs-App für verifizierte Vereinsmitglieder**  
> QR-Code-Scanner · Biometrische Authentifizierung · Token-Verwaltung · Offline-Support · Face ID & Touch ID

<p align="center">
  <img src="screenshots/app/login-screen.png" alt="Login Screen" width="390">
  <img src="screenshots/app/home-screen.png" alt="Home Screen" width="390">
</p>

---

## 📋 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Voraussetzungen](#-voraussetzungen)
- [Installation](#-installation)
- [Projektstruktur](#-projektstruktur)
- [Login-Flow](#-login-flow)
- [Sicherheitskonzept](#-sicherheitskonzept)
- [QR-Code Test Generator](#-qr-code-test-generator)
- [API-Integration](#-api-integration)
- [Fehlerbehebung](#-fehlerbehebung)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Lizenz](#-lizenz)

---

## 🌿 Über das Projekt

Die **cannaUNITY Mobile App** ist die offizielle Begleit-Anwendung für Mitglieder von Cannabis-Anbauvereinen gemäß dem Konsumcannabisgesetz (KCanG). Sie ermöglicht die sichere Authentifizierung und den mobilen Zugriff auf vereinsspezifische Funktionen über eine moderne React Native Anwendung.

### 🎯 Hauptziele

- ✅ **Sichere Authentifizierung** ohne Passwörter via QR-Code
- ✅ **Biometrische Absicherung** mit Face ID / Touch ID
- ✅ **Offline-Funktionalität** nach initialer Anmeldung
- ✅ **Datenschutz** durch lokale Token-Speicherung
- ✅ **Plattformübergreifend** für iOS und Android

---

## 🚀 Features

### 🔐 Authentifizierung & Sicherheit

- **QR-Code-Scanner** mit Echtzeit-Validierung
- **Token-Format:** `CANNA-XXXX-XXXXXXXX` (RegEx-validiert)
- **Biometrische Authentifizierung** (Face ID, Touch ID, Fingerprint)
- **Verschlüsselte Token-Speicherung** mit `expo-secure-store`
- **Automatische Session-Verwaltung**

### 📱 Benutzeroberfläche

- **Native Performance** durch React Native
- **Moderne UI** mit angepassten Komponenten
- **Dark Mode Support** (geplant)
- **Multi-Language** (DE/EN geplant)
- **Offline-Modus** für Kernfunktionen

### 🔄 Integration

- **REST API** Anbindung an cannaUNITY Backend
- **WebSocket** Support für Echtzeit-Updates (geplant)
- **Push Notifications** für wichtige Ereignisse (geplant)
- **Deep Linking** für App-zu-App Kommunikation

---

## 🛠️ Tech Stack

| Technologie | Version | Verwendung |
|------------|---------|------------|
| **React Native** | 0.76.5 | Core Framework |
| **Expo SDK** | 52 | Development Platform |
| **React Navigation** | 6.x | Screen Navigation |
| **expo-camera** | ~15.0.0 | QR-Code Scanner |
| **expo-secure-store** | ~13.0.0 | Sichere Datenspeicherung |
| **expo-local-authentication** | ~14.0.0 | Biometrie-API |
| **JavaScript/JSX** | ES6+ | Programmiersprache |

---

## 📦 Voraussetzungen

- **Node.js** 16.x oder höher
- **npm** oder **yarn** Package Manager
- **Expo CLI** (`npm install -g expo-cli`)
- **Expo Go App** auf dem Smartphone
- **Git** für Versionskontrolle

### 📱 Entwicklungsgeräte

- **iOS:** iPhone mit iOS 13+ und Face ID/Touch ID
- **Android:** Gerät mit Android 8+ und Fingerprint-Sensor

---

## 🔧 Installation

### 1. Repository klonen

bash
git clone https://github.com/IhrVerein/cannaUNITY-mobile.git
cd cannaUNITY-mobile/mobil
2. Dependencies installieren
bashnpm install
# oder
yarn install
3. Entwicklungsserver starten
bash# Mit Tunnel (empfohlen für Netzwerk-Probleme)
npx expo start --tunnel

# Standard (lokales Netzwerk)
npx expo start

# Cache löschen bei Problemen
npx expo start --clear
4. App auf Gerät starten

Öffnen Sie die Expo Go App
Scannen Sie den QR-Code aus dem Terminal
Die App wird automatisch geladen


📁 Projektstruktur
cannaUNITY-mobile/
├── mobil/
│   ├── App.js                          # Haupteinstiegspunkt
│   ├── app.json                        # Expo-Konfiguration
│   ├── package.json                    # Dependencies
│   ├── babel.config.js                 # Babel-Konfiguration
│   ├── assets/                         # App-Ressourcen
│   │   ├── icon.png                    # App Icon (1024x1024)
│   │   ├── splash.png                  # Splash Screen
│   │   ├── adaptive-icon.png           # Android Adaptive Icon
│   │   └── favicon.png                 # Web Favicon
│   ├── src/
│   │   ├── navigation/
│   │   │   └── AppNavigator.jsx        # Stack Navigator mit Auth-Flow
│   │   ├── screens/
│   │   │   ├── TestCameraScreen.jsx    # Kamera-Funktionstest
│   │   │   ├── LoginScreen.jsx         # QR-Code Scanner
│   │   │   ├── BiometricScreen.jsx     # Biometrie-Auth
│   │   │   └── HomeScreen.jsx          # Hauptbildschirm
│   │   ├── components/                 # Wiederverwendbare Komponenten
│   │   ├── services/                   # API & Auth Services
│   │   └── utils/                      # Helper-Funktionen
│   └── qr-generator.html               # QR-Code Test Tool

---

## 🔄 Login-Flow
Erstmalige Nutzung
mermaidgraph LR
    A[App Start] --> B[TestCameraScreen]
    B --> C[LoginScreen]
    C --> D[QR-Code scannen]
    D --> E[Token-Validierung]
    E --> F[Token speichern]
    F --> G[HomeScreen]
Wiederholte Nutzung
mermaidgraph LR
    A[App Start] --> B[Token vorhanden?]
    B -->|Ja| C[BiometricScreen]
    C -->|Erfolg| D[HomeScreen]
    C -->|Fehler| E[LoginScreen]
    B -->|Nein| E

## 🔒 Sicherheitskonzept
Aktueller Stand (Demo-Version)
javascript// Lokale Token-Validierung
const VALID_TOKENS = [
  'CANNA-2024-ABCD1234', // Member
  'CANNA-2024-EFGH5678', // Admin  
  'CANNA-2024-IJKL9012'  // VIP
];

// Simulierte Server-Antwort
const validateToken = async (token) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return VALID_TOKENS.includes(token);
};

## 🚨 Produktiv-Implementierung (TODO)
javascript// Sichere API-Integration
const validateToken = async (token) => {
  try {
    const deviceId = await getUniqueDeviceId();
    const response = await fetch('https://api.cannaunity.de/v1/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': Config.API_KEY,
        'X-Device-ID': deviceId,
        'X-App-Version': Constants.manifest.version
      },
      body: JSON.stringify({
        token: token,
        timestamp: Date.now(),
        biometricAvailable: await LocalAuthentication.hasHardwareAsync()
      })
    });

    if (!response.ok) throw new Error('Validation failed');
    
    const result = await response.json();
    
    // Token sicher speichern
    await SecureStore.setItemAsync('authToken', result.sessionToken);
    await SecureStore.setItemAsync('refreshToken', result.refreshToken);
    
    return {
      valid: true,
      user: result.user,
      permissions: result.permissions,
      expiresAt: result.expiresAt
    };
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
};

---

## 🛡️ Sicherheitsmaßnahmen für Produktion
SSL Certificate Pinning - Schutz vor MITM-Angriffen
Token Lifecycle Management - Ablauf nach 30 Tagen
Device Binding - Token nur auf registriertem Gerät
Rate Limiting - Max. 5 Versuche pro Stunde
Jailbreak/Root Detection - Warnung bei kompromittierten Geräten
Audit Logging - Alle Auth-Versuche werden protokolliert
2FA Optional - SMS/Email als zweiter Faktor
Biometric Fallback - PIN als Alternative

---

## 🧪 QR-Code Test Generator
Die Datei qr-generator.html ermöglicht das Erstellen von Test-QR-Codes:
Features

✅ Generierung im Format CANNA-XXXX-XXXXXXXX
✅ Vordefinierte Test-Tokens (gültig/ungültig)
✅ Custom Token-Erstellung
✅ Visuelle Validierung (grün/rot)
✅ Download als PNG

---

## 🔌 API-Integration
Endpunkte (geplant)
javascriptconst API_ENDPOINTS = {
  AUTH: {
    VALIDATE: '/v1/auth/validate',
    REFRESH: '/v1/auth/refresh',
    LOGOUT: '/v1/auth/logout'
  },
  USER: {
    PROFILE: '/v1/user/profile',
    LIMITS: '/v1/user/limits',
    HISTORY: '/v1/user/history'
  },
  PRODUCTS: {
    AVAILABLE: '/v1/products/available',
    RESERVE: '/v1/products/reserve'
  }
};
WebSocket Events (geplant)
javascript// Echtzeit-Updates
socket.on('limit:updated', (data) => {
  updateUserLimits(data);
});

socket.on('product:available', (data) => {
  showNotification('Neues Produkt verfügbar!');
});

📃Lizenz & Hinweise zur Nutzung

cannaUNITY ist ein freies Open-Source-Projekt unter der MIT-Lizenz.
Die aktuelle Version v0.6.20-pa dient ausschließlich der Mitentwicklung und Systemintegration. Die Software wird ohne Gewährleistung bereitgestellt. Die Nutzung erfolgt auf eigenes Risiko. Eine Haftung für Schäden oder Datenverluste wird ausgeschlossen.

Copyright (c) 2025 Sascha Dämgen IT and More