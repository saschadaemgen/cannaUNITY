import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Stepper,
  Step, StepLabel, StepContent, Alert, List, ListItem,
  ListItemText, Divider, TextField, Paper
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function YearClosingPrep() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessYear, setBusinessYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checks, setChecks] = useState({
    unfinished_bookings: { status: 'pending', count: 0 },
    account_balances: { status: 'pending', differences: [] },
    open_items: { status: 'pending', count: 0 }
  })
  const [activeStep, setActiveStep] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchBusinessYear()
  }, [id])

  const fetchBusinessYear = () => {
    setLoading(true)
    axios.get(`/buchhaltung/business-years/${id}/`)
      .then(res => {
        setBusinessYear(res.data)
        
        // Finde den Vorbereitungsschritt
        const prepStep = res.data.steps.find(step => step.step === 'PREPARATION')
        if (prepStep && prepStep.notes) {
          setNotes(prepStep.notes)
        }
        
        // Führe die Prüfungen durch
        runPreClosingChecks(res.data)
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden des Geschäftsjahres:', err)
        setError('Das Geschäftsjahr konnte nicht geladen werden.')
        setLoading(false)
      })
  }

  const runPreClosingChecks = (year) => {
    // API-Aufruf für Prüfungen vor Jahresabschluss
    // Hier würden echte Prüfungen durchgeführt werden
    // Für diese Demo simulieren wir die Ergebnisse
    
    setTimeout(() => {
      setChecks({
        unfinished_bookings: { 
          status: 'success', 
          count: 0 
        },
        account_balances: { 
          status: 'success', 
          differences: [] 
        },
        open_items: { 
          status: 'warning', 
          count: 2,
          items: [
            { id: 1, name: 'Offene Rechnung #2025-001', amount: 150.00 },
            { id: 2, name: 'Unbezahlte Lieferantenrechnung #A-4532', amount: 220.50 }
          ]
        }
      })
    }, 1000)
  }

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1)
  }

  const handleComplete = () => {
    // Finde den Vorbereitungsschritt
    const prepStep = businessYear.steps.find(step => step.step === 'PREPARATION')
    
    if (prepStep) {
      // Schritt als abgeschlossen markieren
      axios.post(`/buchhaltung/closing-steps/${prepStep.id}/complete/`, { notes })
        .then(() => {
          // Zum nächsten Schritt navigieren (Abschlussbuchungen)
          navigate(`/buchhaltung/jahresabschluss/${id}/abschlussbuchungen`)
        })
        .catch(err => {
          console.error('Fehler beim Abschließen der Vorbereitung:', err)
          alert('Die Vorbereitung konnte nicht abgeschlossen werden.')
        })
    }
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Jahresabschluss-Vorbereitung...</Typography>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        🔍 Jahresabschluss-Vorbereitung
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {businessYear.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Zeitraum: {new Date(businessYear.start_date).toLocaleDateString()} bis {new Date(businessYear.end_date).toLocaleDateString()}
          </Typography>
          
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
            {/* Schritt 1: Prüfung auf offene Posten und Unstimmigkeiten */}
            <Step>
              <StepLabel>Prüfung auf offene Posten und Unstimmigkeiten</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography paragraph>
                    Vor dem Jahresabschluss werden Ihre Buchungen auf Unstimmigkeiten geprüft.
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Prüfergebnisse:</Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Offene Buchungen" 
                          secondary={
                            checks.unfinished_bookings.status === 'success'
                              ? "Keine offenen Buchungen gefunden."
                              : `${checks.unfinished_bookings.count} offene Buchungen gefunden.`
                          }
                        />
                        {checks.unfinished_bookings.status === 'success' && (
                          <Alert severity="success" sx={{ ml: 2 }}>OK</Alert>
                        )}
                        {checks.unfinished_bookings.status === 'error' && (
                          <Alert severity="error" sx={{ ml: 2 }}>Fehler</Alert>
                        )}
                      </ListItem>
                      
                      <Divider component="li" />
                      
                      <ListItem>
                        <ListItemText 
                          primary="Kontenabstimmung" 
                          secondary={
                            checks.account_balances.status === 'success'
                              ? "Alle Konten sind ausgeglichen."
                              : `${checks.account_balances.differences.length} Unstimmigkeiten gefunden.`
                          }
                        />
                        {checks.account_balances.status === 'success' && (
                          <Alert severity="success" sx={{ ml: 2 }}>OK</Alert>
                        )}
                        {checks.account_balances.status === 'error' && (
                          <Alert severity="error" sx={{ ml: 2 }}>Fehler</Alert>
                        )}
                      </ListItem>
                      
                      <Divider component="li" />
                      
                      <ListItem>
                        <ListItemText 
                          primary="Offene Posten" 
                          secondary={
                            checks.open_items.status === 'success'
                              ? "Keine offenen Posten gefunden."
                              : `${checks.open_items.count} offene Posten gefunden.`
                          }
                        />
                        {checks.open_items.status === 'success' && (
                          <Alert severity="success" sx={{ ml: 2 }}>OK</Alert>
                        )}
                        {checks.open_items.status === 'warning' && (
                          <Alert severity="warning" sx={{ ml: 2 }}>Warnung</Alert>
                        )}
                      </ListItem>
                      
                      {checks.open_items.status === 'warning' && checks.open_items.items && (
                        <Box sx={{ mt: 2, ml: 2 }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Offene Posten:
                          </Typography>
                          <List dense>
                            {checks.open_items.items.map(item => (
                              <ListItem key={item.id} sx={{ pl: 2 }}>
                                <ListItemText 
                                  primary={item.name} 
                                  secondary={`${item.amount.toFixed(2)} €`} 
                                />
                              </ListItem>
                            ))}
                          </List>
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Offene Posten können den Jahresabschluss beeinflussen. 
                            Prüfen Sie, ob diese im laufenden Jahr noch beglichen werden.
                          </Alert>
                        </Box>
                      )}
                    </List>
                  </Paper>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button onClick={handleNext} variant="contained">
                      Weiter
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>
            
            {/* Schritt 2: Bilanzvorschau */}
            <Step>
              <StepLabel>Bilanzvorschau</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Hier sehen Sie eine Vorschau Ihrer Bilanz zum Jahresabschluss.
                  Prüfen Sie, ob alle Werte korrekt sind.
                </Typography>
                
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/buchhaltung/bilanz?balance_date=${businessYear.end_date}`)}
                  sx={{ mb: 2 }}
                >
                  Bilanzvorschau öffnen
                </Button>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Zurück
                  </Button>
                  <Button onClick={handleNext} variant="contained">
                    Weiter
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Schritt 3: GuV-Vorschau */}
            <Step>
              <StepLabel>Gewinn- und Verlustrechnung prüfen</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Prüfen Sie Ihre Gewinn- und Verlustrechnung für das Geschäftsjahr.
                </Typography>
                
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/buchhaltung/guv?start_date=${businessYear.start_date}&end_date=${businessYear.end_date}`)}
                  sx={{ mb: 2 }}
                >
                  GuV-Vorschau öffnen
                </Button>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Zurück
                  </Button>
                  <Button onClick={handleNext} variant="contained">
                    Weiter
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Schritt 4: Abschluss der Vorbereitung */}
            <Step>
              <StepLabel>Vorbereitung abschließen</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Sie haben alle Prüfungen durchgeführt. Geben Sie optional Notizen zum Abschluss ein
                  und setzen Sie die Vorbereitung auf "Abgeschlossen".
                </Typography>
                
                <TextField
                  label="Notizen zur Vorbereitung"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Zurück
                  </Button>
                  <Button onClick={handleComplete} variant="contained" color="success">
                    Vorbereitung abschließen
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  )
}