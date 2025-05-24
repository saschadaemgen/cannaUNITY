// frontend/src/apps/logo_bridge/pages/DeviceEdit.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container, Paper, Typography, TextField, Button, Box,
  FormControl, InputLabel, Select, MenuItem, Alert,
  FormControlLabel, Switch, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material'
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material'
import api from '@/utils/api'

export default function DeviceEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: 502,
    protocol: 'modbus_tcp',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadDevice()
  }, [id])

  const loadDevice = async () => {
    try {
      const response = await api.get(`/logo-bridge/devices/${id}/`)
      setFormData({
        name: response.data.name,
        ip_address: response.data.ip_address,
        port: response.data.port,
        protocol: response.data.protocol,
        is_active: response.data.is_active
      })
    } catch (error) {
      console.error('Failed to load device:', error)
      setError('Fehler beim Laden des Geräts')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }
    
    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP-Adresse ist erforderlich'
    } else {
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
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      await api.put(`/logo-bridge/devices/${id}/`, formData)
      navigate('/logo-bridge')
    } catch (error) {
      console.error('Failed to update device:', error)
      setError(error.response?.data?.detail || 'Fehler beim Aktualisieren des Geräts')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/logo-bridge/devices/${id}/`)
      navigate('/logo-bridge')
    } catch (error) {
      console.error('Failed to delete device:', error)
      setError('Fehler beim Löschen des Geräts')
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            Logo-Gerät bearbeiten
          </Typography>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Löschen
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
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
                onChange={handleChange}
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
                disabled={saving}
              >
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Gerät löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie dieses Logo-Gerät wirklich löschen? 
            Alle zugehörigen Variablen, Befehle und Logs werden ebenfalls gelöscht.
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleDelete} color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}