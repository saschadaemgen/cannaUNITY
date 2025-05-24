// frontend/src/apps/logo_bridge/components/CommandForm.jsx
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel,
  Select, MenuItem, Alert, Typography, Chip,
  Autocomplete, FormHelperText
} from '@mui/material'
import api from '@/utils/api'

export default function CommandForm({ 
  open, 
  onClose, 
  onSuccess, 
  deviceId,
  variables,
  initialData = null 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    command_type: initialData?.command_type || 'single',
    variables: initialData?.variables?.map(v => v.id) || [],
    parameters: initialData?.parameters || {},
    device: deviceId
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }
    
    if (formData.command_type === 'single' && formData.variables.length !== 1) {
      newErrors.variables = 'Einzelwert-Befehle benötigen genau eine Variable'
    }
    
    if (formData.command_type === 'sequence' && formData.variables.length < 2) {
      newErrors.variables = 'Sequenz-Befehle benötigen mindestens zwei Variablen'
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

  const handleVariablesChange = (event, newValue) => {
    setFormData({ ...formData, variables: newValue.map(v => v.id) })
    
    if (errors.variables) {
      setErrors({ ...errors, variables: null })
    }
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const submitData = {
        ...formData,
        // parameters werden je nach command_type angepasst
        parameters: formData.command_type === 'sequence' ? {
          sequence: formData.variables.map((varId, index) => ({
            variable_id: varId,
            delay: 0, // Könnte erweitert werden
            value: null // Wird bei Ausführung gesetzt
          }))
        } : formData.parameters
      }
      
      if (initialData?.id) {
        // Update
        await api.put(`/logo-bridge/commands/${initialData.id}/`, submitData)
      } else {
        // Create
        await api.post('/logo-bridge/commands/', submitData)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Failed to save command:', error)
      setError(error.response?.data?.detail || 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const getCommandTypeHelp = () => {
    switch (formData.command_type) {
      case 'single':
        return 'Setzt eine einzelne Variable auf einen Wert'
      case 'sequence':
        return 'Führt mehrere Schreibvorgänge nacheinander aus'
      case 'script':
        return 'Erweiterte Skript-basierte Befehle (noch nicht implementiert)'
      default:
        return ''
    }
  }

  const selectedVariables = variables.filter(v => formData.variables.includes(v.id))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData?.id ? 'Befehl bearbeiten' : 'Neuer Befehl'}
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
          
          <FormControl fullWidth>
            <InputLabel>Befehlstyp</InputLabel>
            <Select
              name="command_type"
              value={formData.command_type}
              onChange={handleChange}
              label="Befehlstyp"
            >
              <MenuItem value="single">Einzelwert</MenuItem>
              <MenuItem value="sequence">Sequenz</MenuItem>
              <MenuItem value="script" disabled>Skript (kommt bald)</MenuItem>
            </Select>
            <FormHelperText>{getCommandTypeHelp()}</FormHelperText>
          </FormControl>
          
          <Autocomplete
            multiple
            options={variables}
            getOptionLabel={(option) => option.name}
            value={selectedVariables}
            onChange={handleVariablesChange}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Variablen" 
                placeholder="Variablen auswählen"
                error={Boolean(errors.variables)}
                helperText={errors.variables}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
          />
          
          {formData.command_type === 'single' && selectedVariables.length === 1 && (
            <Alert severity="info" variant="outlined">
              Bei der Ausführung wird nach dem Wert für "{selectedVariables[0].name}" gefragt.
            </Alert>
          )}
          
          {formData.command_type === 'sequence' && selectedVariables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Ausführungsreihenfolge:
              </Typography>
              <Box sx={{ ml: 2 }}>
                {selectedVariables.map((v, index) => (
                  <Typography key={v.id} variant="body2" color="text.secondary">
                    {index + 1}. {v.name} ({v.data_type})
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
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