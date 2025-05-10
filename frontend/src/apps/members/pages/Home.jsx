// frontend/src/pages/Home.jsx
import { Typography, Box, Grid } from '@mui/material'

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
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
