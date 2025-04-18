import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function YearClosingOpening() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessYear, setBusinessYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [newYear, setNewYear] = useState({
    name: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchBusinessYear()
  }, [id])

  const fetchBusinessYear = () => {
    axios.get(`/buchhaltung/business-years/${id}/`)
      .then(res => {
        setBusinessYear(res.data)
        
        // Finde den Eröffnungsschritt
        const openingStep = res.data.steps.find(step => step.step === 'OPENING')
        if (openingStep && openingStep.notes) {
          setNotes(openingStep.notes)
        }
        
        // Vorschlag für neues Geschäftsjahr
        const endDate = new Date(res.data.end_date)
        const nextStartDate = new Date(endDate)
        nextStartDate.setDate(nextStartDate.getDate() + 1)
        
        const nextEndDate = new Date(nextStartDate)
        nextEndDate.setFullYear(nextEndDate.getFullYear() + 1)
        nextEndDate.setDate(nextEndDate.getDate() - 1)
        
        setNewYear({
          name: `Geschäftsjahr ${nextStartDate.getFullYear()}`,
          start_date: nextStartDate.toISOString().slice(0, 10),
          end_date: nextEndDate.toISOString().slice(0, 10)
        })
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden des Geschäftsjahres:', err)
        setError('Das Geschäftsjahr konnte nicht geladen werden.')
        setLoading(false)
      })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewYear({
      ...newYear,
      [name]: value
    })
  }

  const handleCreateNewYear = () => {
    axios.post('/buchhaltung/business-years/', newYear)
      .then(res => {
        setOpenDialog(false)
        alert('Neues Geschäftsjahr erfolgreich angelegt!')
        
        // Schritt als abgeschlossen markieren
        const openingStep = businessYear.steps.find(step => step.step === 'OPENING')
        if (openingStep) {
          return axios.post(`/buchhaltung/closing-steps/${openingStep.id}/complete/`, { 
            notes: `${notes}\nNeues Geschäftsjahr angelegt: ${newYear.name}` 
          })
        }
      })
      .then(() => {
        // Zurück zur Übersicht
        navigate('/buchhaltung/jahresabschluss')
      })
      .catch(err => {
        console.error('Fehler beim Anlegen des neuen Geschäftsjahres:', err)
        alert('Das neue Geschäftsjahr konnte nicht angelegt werden.')
      })
  }

  const handleComplete = () => {
    // Finde den Eröffnungsschritt
    const openingStep = businessYear.steps.find(step => step.step === 'OPENING')
    
    if (openingStep) {
      // Schritt als abgeschlossen markieren
      axios.post(`/buchhaltung/closing-steps/${openingStep.id}/complete/`, { notes })
        .then(() => {
          // Geschäftsjahr komplett abschließen
          return axios.post(`/buchhaltung/business-years/${id}/complete-closing/`, { 
            closing_notes: `Jahresabschluss vollständig durchgeführt. ${notes}` 
          })
        })
        .then(() => {
          alert('Jahresabschluss erfolgreich durchgeführt!')
          navigate('/buchhaltung/jahresabschluss')
        })
        .catch(err => {
          console.error('Fehler beim Abschließen:', err)
          alert('Der Jahresabschluss konnte nicht abgeschlossen werden.')
        })
    }
  }

  const handleSkip = () => {
    // Finde den Eröffnungsschritt
    const openingStep = businessYear.steps.find(step => step.step === 'OPENING')
    
    if (openingStep) {
      // Schritt als übersprungen markieren
      axios.post(`/buchhaltung/closing-steps/${openingStep.id}/skip/`, { 
        reason: 'Kein neues Geschäftsjahr benötigt.' 
      })
        .then(() => {
          // Geschäftsjahr komplett abschließen
          return axios.post(`/buchhaltung/business-years/${id}/complete-closing/`, { 
            closing_notes: 'Jahresabschluss ohne neues Geschäftsjahr durchgeführt.' 
          })
        })
        .then(() => {
          alert('Jahresabschluss erfolgreich durchgeführt!')
          navigate('/buchhaltung/jahresabschluss')
        })
        .catch(err => {
          console.error('Fehler beim Abschließen:', err)
          alert('Der Jahresabschluss konnte nicht abgeschlossen werden.')
        })
    }
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Daten...</Typography>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        🔄 Neues Geschäftsjahr eröffnen
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {businessYear.name} wird abgeschlossen
          </Typography>
          <Typography paragraph>
            Der Jahresabschluss für {businessYear.name} ist fast abgeschlossen. Nun können Sie ein neues Geschäftsjahr eröffnen.
            Dabei werden die Salden der Bestandskonten übernommen und die Erfolgskonten auf 0 gesetzt.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Möchten Sie jetzt ein neues Geschäftsjahr anlegen? Dies ist optional und kann auch später erfolgen.
          </Alert>
          
          <TextField
            label="Notizen zur Eröffnung"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Button 
                variant="outlined"
                onClick={() => navigate(`/buchhaltung/jahresabschluss/${id}/abschluss`)}
                sx={{ mr: 1 }}
              >
                Zurück zum Abschluss
              </Button>
              <Button 
                variant="outlined"
                color="warning"
                onClick={handleSkip}
              >
                Überspringen
              </Button>
            </Box>
            
            <Box>
              <Button 
                variant="outlined"
                color="primary"
                onClick={() => setOpenDialog(true)}
                sx={{ mr: 1 }}
              >
                Neues Jahr anlegen
              </Button>
              <Button 
                variant="contained" 
                color="success"
                onClick={handleComplete}
              >
                Abschließen ohne neues Jahr
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Dialog für neues Geschäftsjahr */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neues Geschäftsjahr anlegen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bezeichnung"
              name="name"
              value={newYear.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
            />
            
            <TextField
              label="Startdatum"
              name="start_date"
              type="date"
              value={newYear.start_date}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <TextField
              label="Enddatum"
              name="end_date"
              type="date"
              value={newYear.end_date}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleCreateNewYear} 
            variant="contained" 
            color="primary"
            disabled={!newYear.name || !newYear.start_date || !newYear.end_date}
          >
            Geschäftsjahr anlegen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}