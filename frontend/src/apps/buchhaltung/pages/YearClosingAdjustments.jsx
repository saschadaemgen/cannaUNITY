import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Check as CheckIcon } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function YearClosingAdjustments() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [businessYear, setBusinessYear] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [notes, setNotes] = useState('')
  
  // Daten für neue Abschlussbuchung
  const [newAdjustment, setNewAdjustment] = useState({
    name: '',
    adjustment_type: 'DEPRECIATION',
    description: '',
    amount: '',
    soll_konto_id: '',
    haben_konto_id: ''
  })

  useEffect(() => {
    Promise.all([
      fetchBusinessYear(),
      fetchAccounts()
    ]).then(() => setLoading(false))
  }, [id])

  const fetchBusinessYear = () => {
    return axios.get(`/buchhaltung/business-years/${id}/`)
      .then(res => {
        setBusinessYear(res.data)
        // Finde den Anpassungsschritt
        const adjustmentStep = res.data.steps.find(step => step.step === 'ADJUSTMENTS')
        if (adjustmentStep && adjustmentStep.notes) {
          setNotes(adjustmentStep.notes)
        }
        // Abschlussbuchungen laden
        return fetchAdjustments(res.data.id)
      })
      .catch(err => {
        console.error('Fehler beim Laden des Geschäftsjahres:', err)
        setError('Das Geschäftsjahr konnte nicht geladen werden.')
      })
  }

  const fetchAccounts = () => {
    return axios.get('/buchhaltung/accounts/')
      .then(res => {
        const data = res.data?.results || res.data
        setAccounts(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Fehler beim Laden der Konten:', err)
      })
  }

  const fetchAdjustments = (yearId) => {
    return axios.get(`/buchhaltung/closing-adjustments/?business_year=${yearId}`)
      .then(res => {
        const data = res.data?.results || res.data
        setAdjustments(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Fehler beim Laden der Abschlussbuchungen:', err)
      })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewAdjustment({
      ...newAdjustment,
      [name]: value
    })
  }

  const handleAddAdjustment = () => {
    const payload = {
      ...newAdjustment,
      business_year: businessYear.id,
      amount: parseFloat(newAdjustment.amount)
    }
    
    axios.post('/buchhaltung/closing-adjustments/', payload)
      .then(() => {
        setOpenDialog(false)
        fetchAdjustments(businessYear.id)
        // Formular zurücksetzen
        setNewAdjustment({
          name: '',
          adjustment_type: 'DEPRECIATION',
          description: '',
          amount: '',
          soll_konto_id: '',
          haben_konto_id: ''
        })
      })
      .catch(err => {
        console.error('Fehler beim Erstellen der Abschlussbuchung:', err)
        alert('Die Abschlussbuchung konnte nicht erstellt werden.')
      })
  }

  const handleCreateBooking = (adjustmentId) => {
    const adjustment = adjustments.find(adj => adj.id === adjustmentId)
    if (!adjustment) return
    
    // Buchung erstellen
    const bookingData = {
      typ: 'EINZEL',
      datum: new Date().toISOString().slice(0, 10),
      verwendungszweck: `Abschlussbuchung: ${adjustment.name}`,
      subtransactions: [{
        betrag: adjustment.amount,
        soll_konto_id: adjustment.soll_konto_id,
        haben_konto_id: adjustment.haben_konto_id
      }]
    }
    
    axios.post('/buchhaltung/bookings/', bookingData)
      .then(res => {
        // Abschlussbuchung als abgeschlossen markieren
        return axios.post(`/buchhaltung/closing-adjustments/${adjustmentId}/complete/`, {
          booking_id: res.data.id
        })
      })
      .then(() => {
        fetchAdjustments(businessYear.id)
      })
      .catch(err => {
        console.error('Fehler bei der Buchung:', err)
        alert('Die Buchung konnte nicht erstellt werden.')
      })
  }

  const handleRemoveAdjustment = (id) => {
    if (!confirm('Abschlussbuchung wirklich löschen?')) return
    
    axios.delete(`/buchhaltung/closing-adjustments/${id}/`)
      .then(() => {
        fetchAdjustments(businessYear.id)
      })
      .catch(err => {
        console.error('Fehler beim Löschen der Abschlussbuchung:', err)
        alert('Die Abschlussbuchung konnte nicht gelöscht werden.')
      })
  }

  const handleComplete = () => {
    // Finde den Anpassungsschritt
    const adjustmentStep = businessYear.steps.find(step => step.step === 'ADJUSTMENTS')
    
    if (adjustmentStep) {
      // Schritt als abgeschlossen markieren
      axios.post(`/buchhaltung/closing-steps/${adjustmentStep.id}/complete/`, { notes })
        .then(() => {
          // Zum nächsten Schritt navigieren (Abschluss)
          navigate(`/buchhaltung/jahresabschluss/${id}/abschluss`)
        })
        .catch(err => {
          console.error('Fehler beim Abschließen der Anpassungen:', err)
          alert('Die Anpassungen konnten nicht abgeschlossen werden.')
        })
    }
  }

  const getAdjustmentTypeName = (type) => {
    const types = {
      'DEPRECIATION': 'Abschreibung',
      'PROVISION': 'Rückstellung',
      'ACCRUAL': 'Rechnungsabgrenzung',
      'VALUATION': 'Bewertungskorrektur',
      'OTHER': 'Sonstige'
    }
    return types[type] || type
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Abschlussbuchungen...</Typography>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        ✏️ Abschlussbuchungen für {businessYear.name}
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography paragraph>
            Hier können Sie notwendige Abschlussbuchungen für den Jahresabschluss erstellen und durchführen.
            Typische Abschlussbuchungen sind Abschreibungen, Rückstellungen oder Bewertungskorrekturen.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Neue Abschlussbuchung
            </Button>
          </Box>
          
          {adjustments.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              Keine Abschlussbuchungen definiert. Sie können mit dem Button oben rechts neue Abschlussbuchungen anlegen.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Bezeichnung</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell>Betrag</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>{adjustment.name}</TableCell>
                      <TableCell>{getAdjustmentTypeName(adjustment.adjustment_type)}</TableCell>
                      <TableCell>{parseFloat(adjustment.amount).toFixed(2)} €</TableCell>
                      <TableCell>
                        {adjustment.is_completed ? (
                          <Alert severity="success" icon={<CheckIcon fontSize="inherit" />} sx={{ py: 0 }}>
                            Gebucht
                          </Alert>
                        ) : (
                          <Alert severity="warning" sx={{ py: 0 }}>
                            Offen
                          </Alert>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {!adjustment.is_completed && (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => handleCreateBooking(adjustment.id)}
                            >
                              Buchen
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveAdjustment(adjustment.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TextField
            label="Notizen zu Abschlussbuchungen"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate(`/buchhaltung/jahresabschluss/${id}/vorbereitung`)}
            >
              Zurück zur Vorbereitung
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleComplete}
            >
              Weiter zum Abschluss
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Dialog für neue Abschlussbuchung */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Neue Abschlussbuchung erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bezeichnung"
              name="name"
              value={newAdjustment.name}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
            />
            
            <TextField
              label="Typ"
              name="adjustment_type"
              select
              value={newAdjustment.adjustment_type}
              onChange={handleChange}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="DEPRECIATION">Abschreibung</MenuItem>
              <MenuItem value="PROVISION">Rückstellung</MenuItem>
              <MenuItem value="ACCRUAL">Rechnungsabgrenzung</MenuItem>
              <MenuItem value="VALUATION">Bewertungskorrektur</MenuItem>
              <MenuItem value="OTHER">Sonstige</MenuItem>
            </TextField>
            
            <TextField
              label="Beschreibung"
              name="description"
              value={newAdjustment.description}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              multiline
              rows={2}
            />
            
            <TextField
              label="Betrag (€)"
              name="amount"
              type="number"
              value={newAdjustment.amount}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
            />
            
            <TextField
              label="Soll-Konto"
              name="soll_konto_id"
              select
              value={newAdjustment.soll_konto_id}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
            >
              {accounts.map(account => (
                <MenuItem key={account.id} value={account.id}>
                  {account.kontonummer} - {account.name}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Haben-Konto"
              name="haben_konto_id"
              select
              value={newAdjustment.haben_konto_id}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              required
            >
              {accounts.map(account => (
                <MenuItem key={account.id} value={account.id}>
                  {account.kontonummer} - {account.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleAddAdjustment} 
            variant="contained" 
            color="primary"
            disabled={!newAdjustment.name || !newAdjustment.amount || !newAdjustment.soll_konto_id || !newAdjustment.haben_konto_id}
          >
            Abschlussbuchung anlegen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}