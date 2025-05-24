// frontend/src/apps/logo_bridge/components/VariableForm.jsx
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel,
  Select, MenuItem, Alert, Typography, Divider
} from '@mui/material'
import api from '@/utils/api'

export default function VariableForm({ 
  open, 
  onClose, 
  onSuccess, 
  deviceId, 
  device,
  initialData = null 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    address: initialData?.address || '',
    data_type: initialData?.data_type || 'int',
    access_mode: initialData?.access_mode || 'read_write',
    unit: initialData?.unit || '',
    min_value: initialData?.min_value ?? '',
    max_value: initialData?.max_value ?? '',
    device: deviceId
  })

  const [errors, setErrors] = useState({})

  // Adress-Beispiele basierend auf Protokoll
  const addressExamples = {
    modbus_tcp: {
      'Coils (Digital Out)': '00001 - 09999',
      'Discrete Inputs': '10001 - 19999',
      'Input Registers': '30001 - 39999',
      'Holding Registers': '40001 - 49999',
      'Merker Bit': 'M0.0, M0.1, ...',
      'Merker Word': 'MW0, MW2, ...',
      'Merker DWord': 'MD0, MD4, ...'
    },
    s7: {
      'Eingang': 'I0.0, IB0, IW0',
      'Ausgang': 'Q0.0, QB0, QW0',
      'Merker': 'M0.0, MB0, MW0, MD0',
      'Variable (VM)': 'VB0, VW0, VD0'
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Adresse ist erforderlich'
    }
    
    // Validiere Min/Max
    if (formData.min_value !== '' && formData.max_value !== '') {
      const min = parseFloat(formData.min_value)
      const max = parseFloat(formData.max_value)
      if (min >= max) {
        newErrors.min_value = 'Min muss kleiner als Max sein'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Clear error
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Prepare data
      const submitData = {
        ...formData,
        min_value: formData.min_value === '' ? null : parseFloat(formData.min_value),
        max_value: formData.max_value === '' ? null : parseFloat(formData.max_value)
      }
      
      if (initialData?.id) {
        // Update
        await api.put(`/logo-bridge/variables/${initialData.id}/`, submitData)
      } else {
        // Create
        await api.post('/logo-bridge/variables/', submitData)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Failed to save variable:', error)
      setError(error.response?.data?.detail || 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData?.id ? 'Variable bearbeiten' : 'Neue Variable'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          
          <TextField
            fullWidth
            label="Beschreibung"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
          
          <TextField
            fullWidth
            label="Adresse"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={Boolean(errors.address)}
            helperText={errors.address || 'z.B. 40001, M0.0, MW100'}
            required
          />
          
          {device && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Adress-Beispiele für {device.protocol.toUpperCase()}:
              </Typography>
              <Box sx={{ ml: 2 }}>
                {Object.entries(addressExamples[device.protocol] || {}).map(([label, example]) => (
                  <Typography key={label} variant="caption" display="block" color="text.secondary">
                    • {label}: {example}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Datentyp</InputLabel>
              <Select
                name="data_type"
                value={formData.data_type}
                onChange={handleChange}
                label="Datentyp"
              >
                <MenuItem value="bool">Boolean</MenuItem>
                <MenuItem value="int">Integer</MenuItem>
                <MenuItem value="float">Float</MenuItem>
                <MenuItem value="string">String</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Zugriff</InputLabel>
              <Select
                name="access_mode"
                value={formData.access_mode}
                onChange={handleChange}
                label="Zugriff"
              >
                <MenuItem value="read">Nur Lesen</MenuItem>
                <MenuItem value="write">Nur Schreiben</MenuItem>
                <MenuItem value="read_write">Lesen/Schreiben</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TextField
            fullWidth
            label="Einheit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            placeholder="z.B. °C, %, bar"
          />
          
          <Divider />
          
          <Typography variant="subtitle2">
            Wertebereich (optional)
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Min. Wert"
              name="min_value"
              type="number"
              value={formData.min_value}
              onChange={handleChange}
              error={Boolean(errors.min_value)}
              helperText={errors.min_value}
              disabled={formData.data_type === 'bool' || formData.data_type === 'string'}
            />
            
            <TextField
              fullWidth
              label="Max. Wert"
              name="max_value"
              type="number"
              value={formData.max_value}
              onChange={handleChange}
              disabled={formData.data_type === 'bool' || formData.data_type === 'string'}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}