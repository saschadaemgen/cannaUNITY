# Technische Dokumentation: cannaUNITY Architektur und Implementierung

## Grundstruktur und Komponenten

Die cannaUNITY-Anwendung ist eine moderne Webanwendung, die auf einer klaren Trennung zwischen Frontend und Backend basiert:

- **Backend**: Django 5.x mit Django REST Framework (DRF)
- **Frontend**: React mit Vite als Build-Tool
- **UI-Framework**: Material UI (MUI)
- **Authentifizierung**: Token-basierte Authentifizierung

## Projektstruktur

Das Projekt folgt einer klar definierten Ordnerstruktur, wie auf den Screenshots zu sehen:

```
C:\Users\sash710\avre\cannaUNITY\
├── .github/                # GitHub-Konfiguration
├── .venv/                  # Python Virtual Environment
├── backend/                # Django-Backend
│   ├── access/             # Zugangskontrolle
│   ├── buchhaltung/        # Buchhaltungsmodul
│   ├── config/             # Django-Settings, URLs, WSGI
│   ├── controller/         # Steuerungslogik
│   ├── ha/                 # Home Assistant Integration
│   ├── interface/          # API-Schnittstellen
│   ├── members/            # Mitglieder-Verwaltung
│   ├── options/            # Systemeinstellungen
│   ├── panels/             # Dashboard-Panels
│   ├── rooms/              # Raum-Verwaltung
│   ├── security/           # Sicherheitsmodul
│   ├── static/             # Statische Dateien + Build-Output
│   ├── taskmanager/        # Aufgabenverwaltung
│   ├── templates/          # Django-Templates
│   ├── trackandtrace/      # Track & Trace Modul
│   │   ├── migrations/     # Datenbankmigrationen
│   │   ├── __init__.py     # Modulinitialisierung
│   │   ├── admin.py        # Django-Admin Konfiguration
│   │   ├── api_urls.py     # API-URL-Konfiguration
│   │   ├── api_views.py    # API-Views
│   │   ├── apps.py         # App-Konfiguration
│   │   ├── models.py       # Datenmodelle
│   │   ├── serializers.py  # API-Serializer
│   │   ├── tests.py        # Tests
│   │   ├── urls.py         # URL-Konfiguration
│   │   └── views.py        # Views
│   └── unifi_access/       # UniFi Access Integration
│
├── docker/                 # Docker-Konfiguration
├── docs/                   # Dokumentation
├── frontend/               # React-Frontend mit Vite
│   ├── dist/               # Build-Output
│   ├── docs/               # Frontend-Dokumentation
│   ├── node_modules/       # NPM-Pakete
│   ├── public/             # Öffentliche Dateien
│   ├── src/                # Quellcode
│   │   ├── apps/           # Anwendungsmodule
│   │   │   ├── buchhaltung/  # Buchhaltungsmodul
│   │   │   ├── members/    # Mitgliederverwaltung
│   │   │   ├── options/    # Einstellungen
│   │   │   ├── rooms/      # Raumverwaltung
│   │   │   ├── trackandtrace/ # Track & Trace Modul
│   │   │   │   ├── components/ # Komponenten
│   │   │   │   ├── pages/    # Seiten
│   │   │   │   └── utils/    # Hilfsfunktionen
│   │   │   └── unifi_access/ # Zugangskontrolle
│   │   ├── assets/        # Bilder, Fonts, etc.
│   │   ├── components/    # Allgemeine Komponenten
│   │   ├── context/       # React Context
│   │   ├── layout/        # Layout-Komponenten
│   │   │   ├── DateBar.jsx  # Datumsanzeige
│   │   │   ├── Footer.jsx   # Fußbereich
│   │   │   ├── MainLayout.jsx # Base Layout Template
│   │   │   ├── Sidebar.jsx  # Seitennavigation
│   │   │   └── Topbar.jsx   # Hauptnavigation
│   │   ├── pages/         # Allgemeine Seiten
│   │   ├── router/        # Router-Konfiguration
│   │   │   └── index.jsx  # Haupt-Router
│   │   ├── utils/         # Hilfsfunktionen
│   │   │   ├── api.js     # API-Client mit Axios
│   │   │   └── date.js    # Datumsfunktionen
│   │   ├── App.css        # Globale Styles
│   │   ├── App.jsx        # Hauptkomponente
│   │   ├── index.css      # Globale Styles
│   │   └── main.jsx       # Einstiegspunkt
│   ├── .gitignore         # Git-Ignoredateien
│   ├── index.html         # HTML-Template
│   ├── package.json       # NPM-Konfiguration
│   ├── vite.config.js     # Vite-Konfiguration
│   └── README.md          # Frontend-Dokumentation
│
├── screenshots/           # Screenshots
├── scripts/               # Skripte
├── secure/                # Sicherheitsrelevante Dateien
├── templates/             # Vorlagen
└── tools/                 # Dienstprogramme
```

## Frontend-Architektur im Detail

### Vite als Build-Tool

Die Anwendung verwendet Vite als modernes, schnelles Build-Tool für das React-Frontend. Vite bietet:

- Schnellere Entwicklungszeiten durch ESM-basiertes Development
- Optimierte Produktions-Builds
- Hot Module Replacement (HMR) für schnelle Änderungen während der Entwicklung

Die Vite-Konfiguration (`frontend/vite.config.js`) ist so eingerichtet, dass sie die Builds in den Django-Static-Ordner platziert:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: path.resolve(__dirname, '../backend/static/frontend'),
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.jsx'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
})
```

### Router-Konfiguration

Die zentrale Router-Datei (`C:\Users\sash710\avre\cannaUNITY\frontend\src\router\index.jsx`) definiert alle verfügbaren Routen der Anwendung:

```javascript
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
// ... weitere Imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Home /> },
      
      // Mitglieder-Routen
      { path: 'mitglieder', element: <MemberList /> },
      { path: 'mitglieder/:id/edit', element: <MemberEdit /> },
      // ... weitere verschachtelte Routen
    ],
  },
  
  // Routen außerhalb des MainLayouts
  {
    path: '/login',
    element: <Login />,
  },
])
```

Die Router-Struktur ist hierarchisch aufgebaut:
- Die meisten Routen sind innerhalb des `MainLayout` verschachtelt
- Nur spezielle Routen wie `/login` stehen außerhalb des Layouts

### Base Layout Template (MainLayout)

Das `MainLayout` (`C:\Users\sash710\avre\cannaUNITY\frontend\src\layout\MainLayout.jsx`) dient als Basis-Template für alle Hauptseiten der Anwendung:

```javascript
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import DateBar from './DateBar'

function MainLayout() {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      paddingTop: '64px', // Platz für Topbar
    }}>
      <Topbar />
      <DateBar />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: 'background.default',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
```

Die Layout-Struktur besteht aus:
1. `<Topbar />` - Komplexe Navigationsleiste mit Dropdown-Menüs
2. `<DateBar />` - Zeigt das aktuelle Datum in deutscher Formatierung an
3. `<Sidebar />` - Seitennavigation mit Zugriff auf Hauptfunktionen
4. `<Outlet />` - Placeholder für dynamische Inhalte (React Router v6)
5. `<Footer />` - Fußzeile mit Version und Login/Logout-Funktionalität

## Backend-Architektur mit Django REST Framework (DRF)

Das Backend nutzt Django REST Framework für die API-Entwicklung und folgt einer standardisierten Struktur pro App.

### Typische Django-App-Struktur am Beispiel Track & Trace

Im Backend folgt jede App einer ähnlichen Struktur, wie am Beispiel des Track & Trace Moduls zu sehen:

1. **models.py** - Definiert die Datenmodelle:
```python
class SeedPurchase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField(max_length=50, db_index=True, blank=True)
    strain_name = models.CharField(max_length=100)
    # weitere Felder...
    
    def save(self, *args, **kwargs):
        if not self.batch_number:
            self.batch_number = generate_batch_number()
        super().save(*args, **kwargs)
```

2. **serializers.py** - DRF-Serialisierer für die API:
```python
class SeedPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeedPurchase
        fields = '__all__'
```

3. **api_views.py** - ViewSets für die API-Endpunkte:
```python
class SeedPurchaseViewSet(viewsets.ModelViewSet):
    queryset = SeedPurchase.objects.all().order_by('-created_at')
    serializer_class = SeedPurchaseSerializer
    permission_classes = [IsAuthenticated]
```

4. **api_urls.py** - API-URL-Routing mit DRF-Router:
```python
router = DefaultRouter()
router.register(r'seedpurchase', SeedPurchaseViewSet, basename='seedpurchase')

urlpatterns = [
    path('', include(router.urls)),
]
```

## Implementierung neuer Anwendungen

Um eine neue Anwendung in das System zu integrieren, müssen sowohl im Backend als auch im Frontend entsprechende Komponenten erstellt werden. Hier ist eine Schritt-für-Schritt-Anleitung:

### 1. Backend: Neue Django-App erstellen

```bash
# Im Backend-Verzeichnis
cd backend
python manage.py startapp neue_app
```

### 2. Django-App strukturieren

Erstellen Sie folgende Dateien in der neuen App:

```
backend/neue_app/
├── migrations/          # (automatisch erstellt)
├── __init__.py          # (automatisch erstellt)
├── admin.py             # Django-Admin-Konfiguration
├── api_urls.py          # API-Routen (DRF)
├── api_views.py         # API-ViewSets (DRF)
├── apps.py              # (automatisch erstellt)
├── models.py            # Datenmodelle
├── serializers.py       # DRF-Serialisierer
├── tests.py             # Tests
└── views.py             # Standard-Views (falls benötigt)
```

#### models.py - Beispiel:
```python
from django.db import models
import uuid

class NeuesModell(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
```

#### serializers.py - Beispiel:
```python
from rest_framework import serializers
from .models import NeuesModell

class NeuesModellSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeuesModell
        fields = '__all__'
```

#### api_views.py - Beispiel:
```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import NeuesModell
from .serializers import NeuesModellSerializer

class NeuesModellViewSet(viewsets.ModelViewSet):
    queryset = NeuesModell.objects.all().order_by('-created_at')
    serializer_class = NeuesModellSerializer
    permission_classes = [IsAuthenticated]
```

#### api_urls.py - Beispiel:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import NeuesModellViewSet

router = DefaultRouter()
router.register(r'neues-modell', NeuesModellViewSet, basename='neues-modell')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 3. App im Django-Projekt registrieren

In `backend/config/settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'neue_app',
]
```

In `backend/config/urls.py`:
```python
urlpatterns = [
    # ...
    path('api/neue-app/', include('neue_app.api_urls')),
]
```

### 4. Datenbank-Migration erstellen und anwenden

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Frontend: Komponentenstruktur erstellen

Erstellen Sie folgende Ordnerstruktur im Frontend:

```
frontend/src/apps/neue_app/
├── components/           # Wiederverwendbare Komponenten
│   ├── NeuesModellForm.jsx
│   └── NeuesModellTable.jsx
├── pages/                # Seitenkomponenten
│   ├── NeuesModellList.jsx
│   ├── NeuesModellCreate.jsx
│   ├── NeuesModellEdit.jsx
│   └── NeuesModellDelete.jsx
└── utils/                # App-spezifische Hilfsfunktionen
    └── formatter.js
```

#### components/NeuesModellForm.jsx - Beispiel:
```jsx
import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material'
import api from '@/utils/api'

export default function NeuesModellForm({ open, onClose, onSuccess, initialData = {} }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (initialData.id) {
      await api.put(`/api/neue-app/neues-modell/${initialData.id}/`, form)
    } else {
      await api.post('/api/neue-app/neues-modell/', form)
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData.id ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</DialogTitle>
      <DialogContent>
        <TextField 
          label="Name" 
          fullWidth 
          margin="dense" 
          name="name" 
          value={form.name} 
          onChange={handleChange} 
        />
        <TextField 
          label="Beschreibung" 
          fullWidth 
          margin="dense" 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          multiline 
          rows={4} 
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} variant="contained">Speichern</Button>
      </DialogActions>
    </Dialog>
  )
}
```

#### pages/NeuesModellList.jsx - Beispiel:
```jsx
import { useState, useEffect } from 'react'
import { Container, Typography, Button, Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import api from '@/utils/api'
import NeuesModellForm from '../components/NeuesModellForm'

export default function NeuesModellList() {
  const [entries, setEntries] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const loadEntries = async () => {
    const res = await api.get('/api/neue-app/neues-modell/')
    setEntries(res.data.results || res.data)
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'description', headerName: 'Beschreibung', flex: 2 },
    { field: 'created_at', headerName: 'Erstellt am', flex: 1 },
    {
      field: 'actions',
      headerName: 'Aktionen',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedEntry(params.row)
              setOpenForm(true)
            }}
          >
            Bearbeiten
          </Button>
        </Box>
      )
    }
  ]

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Neue App</Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            setSelectedEntry(null)
            setOpenForm(true)
          }}
        >
          Neuer Eintrag
        </Button>
      </Box>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid 
          rows={entries} 
          columns={columns} 
          getRowId={(row) => row.id} 
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </div>

      <NeuesModellForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setSelectedEntry(null)
        }}
        onSuccess={() => {
          setOpenForm(false)
          setSelectedEntry(null)
          loadEntries()
        }}
        initialData={selectedEntry || {}}
      />
    </Container>
  )
}
```

### 6. Router-Konfiguration aktualisieren

Die Routen müssen in der Router-Konfiguration (`frontend/src/router/index.jsx`) registriert werden:

```javascript
import NeuesModellList from '../apps/neue_app/pages/NeuesModellList'
import NeuesModellCreate from '../apps/neue_app/pages/NeuesModellCreate'
import NeuesModellEdit from '../apps/neue_app/pages/NeuesModellEdit'
import NeuesModellDelete from '../apps/neue_app/pages/NeuesModellDelete'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // ... bestehende Routen
      
      // Neue-App-Routen
      { path: 'neue-app', element: <NeuesModellList /> },
      { path: 'neue-app/neu', element: <NeuesModellCreate /> },
      { path: 'neue-app/:id/edit', element: <NeuesModellEdit /> },
      { path: 'neue-app/:id/delete', element: <NeuesModellDelete /> },
    ],
  },
])
```

### 7. Navigation aktualisieren

Je nach Bedarf entweder die Sidebar (`frontend/src/layout/Sidebar.jsx`) oder die Topbar (`frontend/src/layout/Topbar.jsx`) aktualisieren:

```javascript
// Für Sidebar.jsx
const navItems = [
  { label: 'Startseite', icon: <HomeIcon />, path: '/' },
  // ... bestehende Einträge
  { label: 'Neue App', icon: <NewIcon />, path: '/neue-app' },
]

// Für Topbar.jsx (falls in den Hauptmenüs)
const menuItems = [
  // ... bestehende Menüeinträge
  {
    label: 'Neue App', icon: <NewIcon />, children: [
      { label: 'Übersicht', path: '/neue-app', icon: <ListIcon /> },
      { label: 'Neuer Eintrag', path: '/neue-app/neu', icon: <AddIcon /> },
    ]
  },
]
```

## API-Integration

Die API-Integration erfolgt über die zentrale `api.js` (`C:\Users\sash710\avre\cannaUNITY\frontend\src\utils\api.js`):

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',  // Proxy wird über Vite geregelt
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatisches Anhängen des Auth-Tokens an alle Anfragen
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Login-Funktion
export const login = async (username, password) => {
  try {
    const response = await api.post('/token/', { username, password })
    const { token } = response.data
    localStorage.setItem('authToken', token)
    return true
  } catch (err) {
    return false
  }
}

// Logout-Funktion
export const logout = async () => {
  try {
    await api.post('/logout/')
  } catch (e) {
    // Fehler ignorieren
  }
  localStorage.removeItem('authToken')
}

export default api
```

## Zusammenfassung

Die cannaUNITY-Anwendung ist eine gut strukturierte, moderne Webanwendung mit einer klaren Trennung zwischen Frontend und Backend. Das Projekt folgt einer konsistenten Struktur, die es einfach macht, neue Funktionen hinzuzufügen.

Die Kombination aus React mit Vite im Frontend und Django mit DRF im Backend bietet:
- Schnelle Entwicklungszeiten mit Hot Module Replacement
- RESTful APIs mit umfassender Authentifizierung
- Skalierbare und erweiterbare Architektur
- Optimierte Performance durch moderne Build-Tools

Durch Befolgen der oben beschriebenen Muster können neue Module einfach hinzugefügt werden, ohne die bestehende Architektur zu gefährden oder den Code zu duplizieren.