// frontend/src/pages/Home.jsx
import { Typography, Box, Grid, Button, Divider } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DescriptionIcon from '@mui/icons-material/Description'
import GitHubIcon from '@mui/icons-material/GitHub'

export default function Home() {
  return (
    <Box sx={{ 
      width: '100%', 
      p: 3,
      overflow: 'auto'
    }}>
      {/* Hauptüberschrift mit Pflanzen-Emoji */}
      <Typography variant="h4" gutterBottom>
        Willkommen bei cannaUNITY 🌱
      </Typography>
      
      {/* Einleitungstext */}
      <Typography variant="body1" paragraph sx={{ mb: 2 }}>
        cannaUNITY ist eine moderne Open-Source-Lösung zur Organisation und Verwaltung von Anbauvereinigungen nach dem neuen Cannabisgesetz. 
        Basierend auf bewährten Technologien wie Django, React und Vite bietet die Anwendung eine leistungsstarke Plattform, die Rechtssicherheit, 
        Effizienz und Transparenz vereint.
      </Typography>

      {/* Zweispaltiges Layout für Funktionen und technische Details */}
      <Grid container spacing={8}>
        {/* Linke Spalte: Hauptfunktionen */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Hauptfunktionen:
          </Typography>

          <Box component="ul" sx={{ mt: 0, pl: 2, listStyleType: 'disc' }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Mitgliederverwaltung:</strong> Mit RFID-Integration und Alterssteuerung
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Track & Trace:</strong> Lückenlose Verfolgung vom Samen bis zum Endprodukt
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Zutrittskontrolle:</strong> Integration mit UniFi Access und 3-Faktor-Authentifizierung
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Aufgabenmanagement:</strong> Digital unterstütztes Mitwirkungskonzept gemäß § 17 KCanG
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Monitoring:</strong> Umfassendes Dashboard zur Überwachung aller Systembereiche
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Grow-Controller:</strong> Steuerung des Anbaus mit Umweltüberwachung
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Buchhaltung:</strong> Integriertes Warenwirtschafts- und Buchhaltungssystem
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Vernichtungsmanagement:</strong> Dokumentierte und gesetzeskonforme Entsorgungsprozesse
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Sicherheitssystem:</strong> KI-gestütztes Zutritts- und Überwachungssystem
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Rechte Spalte: Technischer Überblick */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Technischer Überblick:
          </Typography>

          <Box component="ul" sx={{ mt: 0, pl: 2, listStyleType: 'disc' }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Backend:</strong> Django 5.x mit Django REST Framework für sichere APIs
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Frontend:</strong> React + Vite als reaktionsschnelle Single Page Application
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>UI-Framework:</strong> Material UI (MUI) für modernes Design
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Authentifizierung:</strong> Token-basiertes System mit erweiterten Sicherheitsoptionen
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Architektur:</strong> Modular mit API-first Ansatz für zukunftssichere Erweiterbarkeit
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Integration:</strong> Nahtlose Anbindung an UniFi Access und UniFi Protect für Zutrittskontrolle und Videoüberwachung
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Datensicherheit:</strong> Zero-Knowledge-Prinzip und sichere Trennung von personenbezogenen Daten
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                <strong>Kommunikation:</strong> WebSocket-Listener für Echtzeit-Events aus Home Assistant
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Buttons (werden beim Scrollen sichtbar) */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mt: 6, 
        mb: 3,
        justifyContent: 'flex-start'
      }}>
                  <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component="a"
          href="https://cannaunity.de/"
          target="_blank"
          rel="noopener"
          size="large"
        >
          ZUR WEBSITE
        </Button>
                  <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          component="a"
          href="https://github.com/saschadaemgen/cannaUNITY/tree/main/Docs"
          target="_blank"
          rel="noopener"
          size="large"
        >
          DOKUMENTATION
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Footer-Informationen (werden beim Scrollen sichtbar) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
          Version 0.6.18 (Pre-Alpha) – Ein Open-Source-Projekt für Cannabis Social Clubs
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
          <GitHubIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography
            variant="body2"
            component="a"
            href="https://github.com/saschadaemgen/cannaUNITY" 
            target="_blank" 
            rel="noopener"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            github.com/saschadaemgen/cannaUNITY
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" align="center">
          Lizenz: MIT – Die Software wird ohne Gewährleistung bereitgestellt. Die Nutzung erfolgt auf eigenes Risiko.
        </Typography>
      </Box>
    </Box>
  )
}