// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx
import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material'
import api from '../../../../utils/api'

export default function SeedPurchaseForm({ open, onClose, onSuccess, initialData = {} }) {
  const [form, setForm] = useState({
    strain_name: initialData.strain_name || '',
    quantity: initialData.quantity || 1,
    remaining_quantity: initialData.remaining_quantity || 0
  })

  // Form neu initialisieren, wenn sich initialData ändert
  useEffect(() => {
    setForm({
      strain_name: initialData.strain_name || '',
      quantity: initialData.quantity || 1,
      remaining_quantity: initialData.remaining_quantity || 0
    })
  }, [initialData])

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSubmit = async () => {
    try {
      // Bei neuen Samen wird die gesamte Anzahl als verfügbar gesetzt
      if (!initialData.id) {
        const newSeed = {
          strain_name: form.strain_name,
          quantity: form.quantity,
          remaining_quantity: form.quantity // Alle neuen Samen sind verfügbar
        }
        await api.post('/trackandtrace/seeds/', newSeed)
      } else {
        await api.put(`/trackandtrace/seeds/${initialData.id}/`, form)
      }
      onSuccess()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData.id ? 'Samen bearbeiten' : 'Neuer Samen'}</DialogTitle>
      <DialogContent>
        <TextField 
          label="Sortenname" 
          fullWidth 
          margin="dense" 
          name="strain_name" 
          value={form.strain_name} 
          onChange={handleChange} 
        />
        <TextField 
          label="Gesamtanzahl" 
          fullWidth 
          margin="dense" 
          name="quantity" 
          type="number"
          inputProps={{ min: 1 }}
          value={form.quantity} 
          onChange={handleChange} 
        />
        {initialData.id && (
          <TextField 
            label="Verfügbar" 
            fullWidth 
            margin="dense" 
            name="remaining_quantity" 
            type="number"
            inputProps={{ min: 0, max: form.quantity }}
            value={form.remaining_quantity} 
            onChange={handleChange} 
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} variant="contained">Speichern</Button>
      </DialogActions>
    </Dialog>
  )
}