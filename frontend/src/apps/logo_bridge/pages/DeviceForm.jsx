// frontend/src/apps/logo_bridge/pages/DeviceForm.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Paper, Typography, TextField, Button, Box,
  FormControl, InputLabel, Select, MenuItem, Alert,
  FormControlLabel, Switch, Divider
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import api from '@/utils/api'

export default function DeviceForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: 502,
    protocol: 'modbus_tcp',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }
    
    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP-Adresse ist erforderlich'
    } else {
      // Einfache IP-Validierung
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipRegex.test(formData.ip_address)) {
        newErrors.ip_address = 'Ungültige IP-Adresse'
      }
    }
    
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port muss zwischen 1 und 65535 liegen'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    setFormData({
      ...formData,
      [name]: e.target.type === 'checkbox' ? checked : value
    })
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post('/logo-bridge/devices/', formData)
      
      // Optional: Verbindung direkt testen
      try {
        await api.post(`/logo-bridge/devices/${response.data.id}/test_connection/`)
      } catch (testError) {
        console.log('Initial connection test failed, but device was created')
      }
      
      navigate('/logo-bridge')
    } catch (error) {
      console.error('Failed to create device:', error)
      setError(error.response?.data?.detail || 'Fehler beim Erstellen des Geräts')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultPort = (protocol) => {
    return protocol === 's7' ? 102 : 502
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Neues Logo-Gerät hinzufügen
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Gerätename"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name || 'Ein eindeutiger Name für dieses Logo-Gerät'}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="IP-Adresse"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                error={Boolean(errors.ip_address)}
                helperText={errors.ip_address || 'IP-Adresse der Siemens Logo'}
                placeholder="192.168.1.100"
                required
              />
              
              <TextField
                label="Port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                error={Boolean(errors.port)}
                helperText={errors.port}
                sx={{ width: 150 }}
                required
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Protokoll</InputLabel>
              <Select
                name="protocol"
                value={formData.protocol}
                onChange={(e) => {
                  handleChange(e)
                  // Port automatisch anpassen
                  setFormData(prev => ({
                    ...prev,
                    protocol: e.target.value,
                    port: getDefaultPort(e.target.value)
                  }))
                }}
                label="Protokoll"
              >
                <MenuItem value="modbus_tcp">Modbus TCP</MenuItem>
                <MenuItem value="s7">S7 Protocol</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleChange}
                  name="is_active"
                />
              }
              label="Gerät aktiv"
            />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/logo-bridge')}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Speichern...' : 'Gerät erstellen'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}