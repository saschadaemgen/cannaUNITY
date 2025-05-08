import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Add as AddIcon, PlayArrow as PlayIcon } from '@mui/icons-material'
import axios from '@/utils/api'

export default function YearClosingList() {
  const navigate = useNavigate()
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Zustand für den Dialog zum Erstellen eines neuen Geschäftsjahres
  const [openDialog, setOpenDialog] = useState(false)
  const [newYear, setNewYear] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_retroactive: false
  })

  useEffect(() => {
    fetchBusinessYears()
  }, [])

  const fetchBusinessYears = () => {
    setLoading(true)
    axios.get('/buchhaltung/business-years/')
        .then(res => {
        // Stelle sicher, dass wir ein Array haben, egal was zurückkommt
        const yearsData = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setYears(yearsData)
        setLoading(false)
        })
        .catch(err => {
        console.error('Fehler beim Laden der Geschäftsjahre:', err)
        setError('Die Geschäftsjahre konnten nicht geladen werden.')
        setLoading(false)
        })
  }

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target
    setNewYear({
      ...newYear,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = () => {
    axios.post('/buchhaltung/business-years/', newYear)
      .then(() => {
        setOpenDialog(false)
        fetchBusinessYears()
        // Formular zurücksetzen
        setNewYear({
          name: '',
          start_date: '',
          end_date: '',
          is_retroactive: false
        })
      })
      .catch(err => {
        console.error('Fehler beim Erstellen des Geschäftsjahres:', err)
        alert('Das Geschäftsjahr konnte nicht erstellt werden.')
      })
  }

  const handleStartClosing = (id) => {
    axios.post(`/buchhaltung/business-years/${id}/start-closing/`)
      .then(() => {
        fetchBusinessYears()
        navigate(`/buchhaltung/jahresabschluss/${id}/vorbereitung`)
      })
      .catch(err => {
        console.error('Fehler beim Starten des Jahresabschlusses:', err)
        alert('Der Jahresabschluss konnte nicht gestartet werden.')
      })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE')
  }

  const getStatusChip = (status) => {
    const statusConfig = {
      'OPEN': { color: 'primary', label: 'Offen' },
      'IN_PROGRESS': { color: 'warning', label: 'In Bearbeitung' },
      'CLOSED': { color: 'success', label: 'Abgeschlossen' }
    }
    
    const config = statusConfig[status] || { color: 'default', label: status }
    
    return <Chip size="small" color={config.color} label={config.label} />
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Geschäftsjahre...</Typography>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        📅 Geschäftsjahre & Jahresabschluss
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Neues Geschäftsjahr anlegen
        </Button>
      </Box>
      
      {years.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Es wurden noch keine Geschäftsjahre angelegt. Bitte erstellen Sie zuerst ein Geschäftsjahr.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Bezeichnung</TableCell>
                <TableCell>Zeitraum</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell>Abgeschlossen am</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>{year.name}</TableCell>
                  <TableCell>
                    {formatDate(year.start_date)} bis {formatDate(year.end_date)}
                    {year.is_retroactive && (
                      <Chip size="small" label="Rückwirkend" sx={{ ml: 1, backgroundColor: '#f0f0f0' }} />
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(year.status)}</TableCell>
                  <TableCell>{formatDate(year.created_at)}</TableCell>
                  <TableCell>{year.closed_at ? formatDate(year.closed_at) : '–'}</TableCell>
                  <TableCell align="center">
                    {year.status === 'OPEN' && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => handleStartClosing(year.id)}
                      >
                        Jahresabschluss starten
                      </Button>
                    )}
                    
                    {year.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={() => navigate(`/buchhaltung/jahresabschluss/${year.id}/fortsetzung`)}
                      >
                        Jahresabschluss fortsetzen
                      </Button>
                    )}
                    
                    {year.status === 'CLOSED' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        onClick={() => navigate(`/buchhaltung/jahresabschluss/${year.id}/ansicht`)}
                      >
                        Jahresabschluss ansehen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Dialog zum Erstellen eines neuen Geschäftsjahres */}
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
              placeholder="z.B. Geschäftsjahr 2025"
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
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="is_retroactive"
                name="is_retroactive"
                checked={newYear.is_retroactive}
                onChange={handleChange}
              />
              <label htmlFor="is_retroactive" style={{ marginLeft: '8px' }}>
                Dieses Geschäftsjahr rückwirkend anlegen
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleSubmit} 
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