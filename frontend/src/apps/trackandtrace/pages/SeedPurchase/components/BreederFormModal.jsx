// frontend/src/apps/trackandtrace/pages/SeedPurchase/components/BreederFormModal.jsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material'

export default function BreederFormModal({ open, onClose, onSave, initialName = '' }) {
  const [breederName, setBreederName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Bei Öffnen des Modals den Namen aus der Suche übernehmen
    if (open) {
      setBreederName(initialName)
    }
  }, [open, initialName])

  const handleSubmit = () => {
    setLoading(true)
    
    // Minimal erforderliche Felder validieren
    if (!breederName.trim()) {
      alert('Bitte geben Sie einen Herstellernamen ein')
      setLoading(false)
      return
    }
    
    // Direkt den Namen zurückgeben, da wir keinen echten API-Aufruf benötigen
    // In der realen Implementierung würden wir hier einen API-Aufruf machen,
    // aber für jetzt simulieren wir nur den Prozess
    setTimeout(() => {
      onSave(breederName.trim())
      setLoading(false)
    }, 300)
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Neuen Hersteller/Züchter anlegen</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Bitte geben Sie den Namen des neuen Herstellers/Züchters ein:
            </Typography>
            <TextField
              label="Herstellername"
              value={breederName}
              onChange={(e) => setBreederName(e.target.value)}
              fullWidth
              autoFocus
              required
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="success"
          disabled={loading || !breederName.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Hersteller speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}