# cannaUNITY Balance Display Plugin v1.2

![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![License](https://img.shields.io/badge/license-GPL%20v2-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)

> WordPress Plugin zur Anzeige von Kontoständen und Benutzerdaten für cannaUNITY-Mitglieder im Frontend.

## 🚀 Features

- ✅ **Django Integration** - Erkennt automatisch Django-erstellte User Meta-Felder
- 🎯 **Mehrere Anzeigeoptionen** - 3 verschiedene Shortcodes für verschiedene Anwendungsfälle  
- 🎨 **Modernes Design** - Gradient-Design mit responsivem Grid-Layout
- 🔧 **Einfache Installation** - Hochladen, aktivieren, sofort verwenden
- 📱 **Widget-Support** - Sidebar/Footer Widget inklusive
- ⚙️ **Anpassbar** - Flexible Parameter und CSS-Klassen
- 🔒 **Sicher** - Benutzerauthentifizierung und Datenbereinigung

## 📦 Installation

### Option 1: WordPress Admin (Empfohlen)
1. Plugin ZIP-Datei herunterladen
2. **WordPress Admin** → **Plugins** → **Plugin hinzufügen** → **Plugin hochladen**
3. ZIP-Datei hochladen und **Jetzt installieren** klicken
4. Plugin **aktivieren**

### Option 2: Manuelle Installation
1. Plugin-Ordner nach `/wp-content/plugins/` hochladen
2. Plugin über das **Plugins**-Menü in WordPress aktivieren

### Option 3: WP-CLI
```bash
wp plugin install cannaunity-balance-plugin.zip --activate
```

## 🎯 Schnellstart

Nach der Aktivierung können Sie sofort diese Shortcodes verwenden:

```
[user_balance]        <!-- Zeigt nur Kontostand -->
[user_dashboard]      <!-- Komplettes Benutzer-Dashboard -->
[user_profile]        <!-- Kompakte Profilanzeige -->
```

## 📝 Verfügbare Shortcodes

### `[user_balance]`
Zeigt den Kontostand des Benutzers in einer schönen Gradient-Box.

```
[user_balance]
[user_balance currency="USD" decimals="0"]
[user_balance field="custom_balance" show_label="false"]
```

**Parameter:**
| Parameter | Standard | Beschreibung | Beispiel |
|-----------|----------|--------------|----------|
| `field` | `kontostand` | Meta-Feld Name | `field="guthaben"` |
| `currency` | `€` | Währungssymbol | `currency="$"` |
| `decimals` | `2` | Nachkommastellen | `decimals="0"` |
| `show_label` | `true` | Label-Text anzeigen | `show_label="false"` |

### `[user_dashboard]`
Komplettes Dashboard mit Kontostand, Benutzerinfo und allen Django Meta-Feldern.

```
[user_dashboard]
```

### `[user_profile]` 
Kompakte Anzeige für Seitenleisten oder kleine Bereiche.

```
[user_profile]
```

## 🔗 Django Integration

### Erforderliche Meta-Felder
Das Plugin erkennt automatisch diese Django-erstellten Meta-Felder:

```python
# In Ihrer Django create_wordpress_user Funktion:
cursor.execute("""
    INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
    VALUES (%s, 'kontostand', %s),
           (%s, 'thc_limit', %s),
           (%s, 'monthly_limit', %s)
""", [user_id, 25.50, user_id, 10, user_id, 50])
```

### Kontostand per SQL aktualisieren
```sql
UPDATE wp_usermeta 
SET meta_value = '125.75' 
WHERE user_id = 123 AND meta_key = 'kontostand';
```

### Bestehende Meta-Felder prüfen
```sql
SELECT user_id, meta_key, meta_value 
FROM wp_usermeta 
WHERE meta_key IN ('kontostand', 'thc_limit', 'monthly_limit');
```

## 🎨 Widget-Verwendung

### Widget zur Sidebar hinzufügen
1. **Design** → **Widgets** aufrufen
2. **User Balance Widget** in gewünschten Bereich ziehen
3. Widget-Titel setzen und speichern

### Customizer-Integration
1. **Design** → **Customizer** → **Widgets**
2. Widget-Bereich auswählen
3. **Widget hinzufügen** → **User Balance Widget**

## ⚙️ Konfiguration

### Admin-Einstellungen
Plugin-Einstellungen erreichbar unter:
**WordPress Admin** → **Einstellungen** → **Django Balance**

### Template-Integration (für Entwickler)
```php
// Direkte Integration in Template-Dateien
echo do_shortcode('[user_balance]');

// Erst prüfen ob Benutzer eingeloggt
if (is_user_logged_in()) {
    echo do_shortcode('[user_dashboard]');
}
```

## 🎨 Anpassungen

### CSS-Klassen für eigenes Styling
```css
/* Haupt-Container */
.django-balance-container {
    /* Ihre eigenen Styles */
}

/* Kontostand-Anzeige Box */
.balance-display {
    background: linear-gradient(45deg, #ihre-farbe1, #ihre-farbe2) !important;
}

/* Kontostand-Betrag Text */
.balance-amount {
    font-size: 3em !important;
    color: #ihre-farbe !important;
}

/* Info-Grid Layout */
.user-info-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
}

/* Info-Karten */
.info-card {
    border-left: 4px solid #ihre-farbe !important;
}
```

### Eigene Farben für cannaUNITY
```css
/* cannaUNITY Branding */
.balance-display {
    background: linear-gradient(135deg, #2E7D32, #4CAF50) !important;
}

.info-card {
    border-left-color: #4CAF50 !important;
}
```

## 🚨 Fehlerbehebung

### Häufige Probleme

#### Problem: "Bitte einloggen" wird angezeigt
**Lösung:** Benutzer muss in WordPress eingeloggt sein

#### Problem: Kontostand zeigt 0,00 €
**Mögliche Ursachen:**
- Kein `kontostand` Meta-Feld vorhanden
- Meta-Feld ist leer
- Falscher Meta-Key verwendet

**Lösung:**
```sql
-- Prüfen ob Meta-Feld existiert:
SELECT * FROM wp_usermeta WHERE meta_key = 'kontostand';

-- Meta-Feld hinzufügen:
INSERT INTO wp_usermeta (user_id, meta_key, meta_value) 
VALUES (123, 'kontostand', '50.00');
```

#### Problem: Shortcode wird als Text angezeigt
**Lösung:** Plugin ist nicht aktiviert → **Plugins** → **Django Balance** aktivieren

#### Problem: Styling sieht falsch aus
**Lösung:** Browser-Cache leeren oder `Strg + F5` drücken

## 📊 cannaUNITY spezifische Felder

Das Plugin unterstützt spezielle cannaUNITY Meta-Felder:

| Meta-Key | Beschreibung | Anzeige |
|----------|--------------|---------|
| `kontostand` | Hauptkontostand in € | ✅ Immer |
| `thc_limit` | THC-Limit in Gramm | ✅ Falls vorhanden |
| `monthly_limit` | Monatslimit in Gramm | ✅ Falls vorhanden |
| `member_since` | Mitglied seit Datum | 🔄 Geplant |
| `status` | Mitgliedsstatus | 🔄 Geplant |

## 🔧 Systemanforderungen

- **WordPress:** 5.0 oder höher
- **PHP:** 7.4 oder höher
- **MySQL:** 5.6 oder höher
- **Django Integration:** Beliebige Version (über wp_usermeta)

## 📝 Changelog

### Version 1.2.0
- ✅ Initiale Veröffentlichung
- ✅ Basis Shortcodes implementiert
- ✅ Widget-Support hinzugefügt
- ✅ Admin-Panel erstellt
- ✅ Django Meta-Feld Integration

## 🤝 Contributing

Beiträge sind willkommen! Bitte:

1. Repository forken
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📄 Lizenz

Dieses Projekt steht unter der GPL v2 Lizenz - siehe [LICENSE](LICENSE) Datei für Details.

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/username/cannaunity-balance-plugin/issues)
- **Documentation:** [Plugin Wiki](https://github.com/username/cannaunity-balance-plugin/wiki)
- **cannaUNITY Support:** support@cannaunity.de

## 🙏 Credits

- Entwickelt für cannaUNITY
- WordPress Plugin API
- Django-WordPress Integration
- Material Design Icons

---

📃 Lizenz & Hinweise zur Nutzung

cannaUNITY ist ein freies Open-Source-Projekt unter der MIT-Lizenz. Die aktuelle Version v0.6.20-pa dient ausschließlich der Mitentwicklung und Systemintegration. Die Software wird ohne Gewährleistung bereitgestellt. Die Nutzung erfolgt auf eigenes Risiko. Eine Haftung für Schäden oder Datenverluste wird ausgeschlossen.

Copyright (c) 2025 Sascha Dämgen IT and More ✨