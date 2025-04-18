import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Alert, Button } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function YearClosingContinue() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessYear, setBusinessYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBusinessYear()
  }, [id])

  const fetchBusinessYear = () => {
    setLoading(true)
    axios.get(`/buchhaltung/business-years/${id}/`)
      .then(res => {
        setBusinessYear(res.data)
        setLoading(false)
        
        // Automatisch zum richtigen Schritt navigieren
        redirectToActiveStep(res.data)
      })
      .catch(err => {
        console.error('Fehler beim Laden des Geschäftsjahres:', err)
        setError('Das Geschäftsjahr konnte nicht geladen werden.')
        setLoading(false)
      })
  }

  const redirectToActiveStep = (year) => {
    // Alle Schritte finden, die noch nicht abgeschlossen sind
    const steps = year.steps || []
    const inProgressStep = steps.find(step => step.status === 'IN_PROGRESS')
    const firstNotStartedStep = steps.find(step => step.status === 'NOT_STARTED')
    
    // Zum ersten aktiven oder nicht begonnenen Schritt navigieren
    if (inProgressStep) {
      navigateToStep(inProgressStep.step, year.id)
    } else if (firstNotStartedStep) {
      navigateToStep(firstNotStartedStep.step, year.id)
    } else {
      // Fallback zur Vorbereitung, falls kein aktiver Schritt gefunden wurde
      navigateToStep('PREPARATION', year.id)
    }
  }

  const navigateToStep = (step, yearId) => {
    const stepRoutes = {
      'PREPARATION': `/buchhaltung/jahresabschluss/${yearId}/vorbereitung`,
      'ADJUSTMENTS': `/buchhaltung/jahresabschluss/${yearId}/abschlussbuchungen`,
      'CLOSING': `/buchhaltung/jahresabschluss/${yearId}/abschluss`,
      'OPENING': `/buchhaltung/jahresabschluss/${yearId}/neueröffnung`
    }
    
    navigate(stepRoutes[step] || stepRoutes['PREPARATION'])
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Jahresabschluss-Daten...</Typography>
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/buchhaltung/jahresabschluss')}>
          Zurück zur Übersicht
        </Button>
      </Box>
    )
  }

  // Diese Komponente sollte nicht direkt gerendert werden, sondern automatisch weiterleiten
  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Jahresabschluss wird fortgesetzt...
          </Typography>
          <Typography paragraph>
            Sie werden automatisch weitergeleitet...
          </Typography>
          <Button variant="contained" onClick={() => redirectToActiveStep(businessYear)}>
            Manuell fortfahren
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}