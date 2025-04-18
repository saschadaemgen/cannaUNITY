import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stepper, Step, StepLabel, StepContent
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function YearClosingFinal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessYear, setBusinessYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [summary, setSummary] = useState({
    balance: null,
    profitLoss: null
  })

  useEffect(() => {
    fetchBusinessYear()
  }, [id])

  const fetchBusinessYear = () => {
    axios.get(`/buchhaltung/business-years/${id}/`)
      .then(res => {
        setBusinessYear(res.data)
        
        // Finde den Abschlussschritt
        const closingStep = res.data.steps.find(step => step.step === 'CLOSING')
        if (closingStep && closingStep.notes) {
          setNotes(closingStep.notes)
        }
        
        // Lade Bilanz und GuV
        Promise.all([
          fetchBalance(res.data),
          fetchProfitLoss(res.data)
        ]).then(() => setLoading(false))
      })
      .catch(err => {
        console.error('Fehler beim Laden des Geschäftsjahres:', err)
        setError('Das Geschäftsjahr konnte nicht geladen werden.')
        setLoading(false)
      })
  }

  const fetchBalance = (year) => {
    const balanceDate = year.end_date
    return axios.get(`/buchhaltung/bilanz/?balance_date=${balanceDate}`)
      .then(res => {
        setSummary(prev => ({ ...prev, balance: res.data }))
      })
      .catch(err => {
        console.error('Fehler beim Laden der Bilanz:', err)
      })
  }

  const fetchProfitLoss = (year) => {
    const startDate = year.start_date
    const endDate = year.end_date
    return axios.get(`/buchhaltung/guv/?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        setSummary(prev => ({ ...prev, profitLoss: res.data }))
      })
      .catch(err => {
        console.error('Fehler beim Laden der GuV:', err)
      })
  }

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1)
  }

  const handleComplete = () => {
    // Finde den Abschlussschritt
    const closingStep = businessYear.steps.find(step => step.step === 'CLOSING')
    
    if (closingStep) {
      // Schritt als abgeschlossen markieren
      axios.post(`/buchhaltung/closing-steps/${closingStep.id}/complete/`, { notes })
        .then(() => {
          // Zum nächsten Schritt navigieren (Neueröffnung)
          navigate(`/buchhaltung/jahresabschluss/${id}/neueröffnung`)
        })
        .catch(err => {
          console.error('Fehler beim Abschließen:', err)
          alert('Der Jahresabschluss konnte nicht abgeschlossen werden.')
        })
    }
  }

  const handleFinalizeYear = () => {
    // Geschäftsjahr als abgeschlossen markieren
    axios.post(`/buchhaltung/business-years/${id}/complete-closing/`, { closing_notes: notes })
      .then(() => {
        alert('Geschäftsjahr erfolgreich abgeschlossen!')
        navigate('/buchhaltung/jahresabschluss')
      })
      .catch(err => {
        console.error('Fehler beim Abschließen des Geschäftsjahres:', err)
        alert('Das Geschäftsjahr konnte nicht abgeschlossen werden.')
      })
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Jahresabschluss-Daten...</Typography>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        🏁 Jahresabschluss durchführen
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
            {/* Schritt 1: Bilanz prüfen */}
            <Step>
              <StepLabel>Bilanz prüfen</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Prüfen Sie die Bilanz zum Jahresabschluss. Alle Aktiva und Passiva sollten korrekt ausgewiesen sein.
                </Typography>
                
                {summary.balance && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Bilanz-Zusammenfassung:</Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Position</TableCell>
                            <TableCell align="right">Betrag</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Aktiva gesamt</TableCell>
                            <TableCell align="right">{summary.balance.summary.total_assets.toFixed(2)} €</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Passiva gesamt</TableCell>
                            <TableCell align="right">{summary.balance.summary.total_liabilities.toFixed(2)} €</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {!summary.balance.summary.is_balanced && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        Die Bilanz ist nicht ausgeglichen! Differenz: {(summary.balance.summary.total_assets - summary.balance.summary.total_liabilities).toFixed(2)} €
                      </Alert>
                    )}
                  </Paper>
                )}
                
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/buchhaltung/bilanz?balance_date=${businessYear.end_date}`)}
                  sx={{ mb: 2 }}
                >
                  Detaillierte Bilanz ansehen
                </Button>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button onClick={handleNext} variant="contained">
                    Weiter
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Schritt 2: GuV prüfen */}
            <Step>
              <StepLabel>Gewinn- und Verlustrechnung prüfen</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Prüfen Sie die Gewinn- und Verlustrechnung für das Geschäftsjahr. Alle Erträge und Aufwendungen sollten korrekt erfasst sein.
                </Typography>
                
                {summary.profitLoss && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>GuV-Zusammenfassung:</Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Position</TableCell>
                            <TableCell align="right">Betrag</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Erträge gesamt</TableCell>
                            <TableCell align="right">{summary.profitLoss.summary.total_income.toFixed(2)} €</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Aufwendungen gesamt</TableCell>
                            <TableCell align="right">{summary.profitLoss.summary.total_expenses.toFixed(2)} €</TableCell>
                          </TableRow>
                          <TableRow sx={{ fontWeight: 'bold' }}>
                            <TableCell><strong>Ergebnis</strong></TableCell>
                            <TableCell align="right">
                              <strong>
                                {summary.profitLoss.summary.profit >= 0 
                                  ? `Überschuss: ${summary.profitLoss.summary.profit.toFixed(2)} €` 
                                  : `Fehlbetrag: ${Math.abs(summary.profitLoss.summary.profit).toFixed(2)} €`}
                              </strong>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
                
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/buchhaltung/guv?start_date=${businessYear.start_date}&end_date=${businessYear.end_date}`)}
                  sx={{ mb: 2 }}
                >
                  Detaillierte GuV ansehen
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
            
            {/* Schritt 3: Jahresabschluss durchführen */}
            <Step>
              <StepLabel>Jahresabschluss durchführen</StepLabel>
              <StepContent>
                <Typography paragraph>
                  Sie sind nun bereit, den Jahresabschluss durchzuführen. Dabei wird das Ergebnis aus der GuV in die Bilanz übertragen und alle Ertrags- und Aufwandskonten auf 0 gesetzt.
                </Typography>
                
                <TextField
                  label="Notizen zum Jahresabschluss"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Zurück
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={handleComplete}
                  >
                    Jahresabschluss durchführen
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
          
          {/* Alternativ: Direkt Geschäftsjahr abschließen */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate(`/buchhaltung/jahresabschluss/${id}/abschlussbuchungen`)}
            >
              Zurück zu Abschlussbuchungen
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleFinalizeYear}
            >
              Geschäftsjahr final abschließen
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}