// frontend/src/apps/taskmanager/pages/TaskTypeEdit.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Button, Box,
  Alert, Avatar, Stack, Switch, FormControlLabel, Divider,
  Chip, Paper, CircularProgress
} from '@mui/material'
import { 
  Save, Cancel, Assignment, Delete,
  CheckCircle, Star, Build
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/utils/api'

const DIFFICULTY_OPTIONS = [
  { value: 'leicht', label: 'Leicht', color: '#4CAF50', icon: <CheckCircle /> },
  { value: 'mittel', label: 'Mittel', color: '#FF9800', icon: <Star /> },
  { value: 'anspruchsvoll', label: 'Anspruchsvoll', color: '#F44336', icon: <Build /> }
]

const ICON_OPTIONS = [
  'water_drop', 'content_cut', 'agriculture', 'verified', 'science',
  'cleaning_services', 'inventory', 'assessment', 'bug_report', 'build',
  'eco', 'local_florist', 'yard', 'grass', 'park'
]

const COLOR_PALETTE = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
  '#607D8B', '#795548', '#FF5722', '#3F51B5', '#009688',
  '#8BC34A', '#CDDC39', '#FFC107', '#FF5252', '#E91E63'
]

function TaskTypeEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'mittel',
    icon: 'assignment',
    color: '#4CAF50',
    max_slots_per_day: 10,
    min_experience_level: 0,
    requires_training: false,
    is_active: true
  })
  
  const [originalData, setOriginalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      loadTaskType()
    }
  }, [id])

  const loadTaskType = async () => {
    try {
      setLoading(true)
      
      const response = await api.get(`/taskmanager/task-types/${id}/`)
      const data = response.data
      
      setOriginalData(data)
      setFormData({
        name: data.name || '',
        description: data.description || '',
        difficulty: data.difficulty || 'mittel',
        icon: data.icon || 'assignment',
        color: data.color || '#4CAF50',
        max_slots_per_day: data.max_slots_per_day || 10,
        min_experience_level: data.min_experience_level || 0,
        requires_training: data.requires_training || false,
        is_active: data.is_active !== false
      })
      
    } catch (err) {
      console.error('Error loading task type:', err)
      setError('Fehler beim Laden des Aufgabentyps')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Name ist erforderlich')
      return
    }

    if (formData.max_slots_per_day < 1) {
      setError('Maximale Slots pro Tag muss mindestens 1 sein')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      await api.put(`/taskmanager/task-types/${id}/`, formData)
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/taskmanager/task-types')
      }, 1500)
      
    } catch (err) {
      console.error('Update error:', err)
      if (err.response?.data) {
        const errors = []
        Object.entries(err.response.data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            errors.push(`${key}: ${value.join(', ')}`)
          } else {
            errors.push(`${key}: ${value}`)
          }
        })
        setError(errors.join(' | '))
      } else {
        setError('Fehler beim Aktualisieren des Aufgabentyps')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diesen Aufgabentyp wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      setDeleting(true)
      await api.delete(`/taskmanager/task-types/${id}/`)
      navigate('/taskmanager/task-types')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen des Aufgabentyps')
    } finally {
      setDeleting(false)
    }
  }

  const getDifficultyConfig = (difficulty) => {
    return DIFFICULTY_OPTIONS.find(d => d.value === difficulty) || DIFFICULTY_OPTIONS[1]
  }

  const selectedDifficulty = getDifficultyConfig(formData.difficulty)

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!originalData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Aufgabentyp nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={4}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: formData.color, mr: 2, width: 48, height: 48 }}>
            {selectedDifficulty.icon}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Aufgabentyp bearbeiten
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {originalData.name}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDelete}
          disabled={deleting || saving}
        >
          {deleting ? 'Lösche...' : 'Löschen'}
        </Button>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Aufgabentyp wurde erfolgreich aktualisiert! Sie werden weitergeleitet...
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Grundinformationen */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                📋 Grundinformationen
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Name der Aufgabe"
                    value={formData.name}
                    onChange={handleChange('name')}
                    fullWidth
                    required
                    placeholder="z.B. Bewässerung, Beschneidung, Ernte..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Beschreibung"
                    value={formData.description}
                    onChange={handleChange('description')}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Detaillierte Beschreibung der Aufgabe, Anweisungen oder besondere Hinweise..."
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Schwierigkeitsgrad</InputLabel>
                    <Select
                      value={formData.difficulty}
                      label="Schwierigkeitsgrad"
                      onChange={handleChange('difficulty')}
                    >
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: option.color, width: 24, height: 24 }}>
                              {option.icon}
                            </Avatar>
                            <Typography>{option.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={handleChange('is_active')}
                      />
                    }
                    label="Aktiv"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Design & Darstellung */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                🎨 Design & Darstellung
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Icon</InputLabel>
                    <Select
                      value={formData.icon}
                      label="Icon"
                      onChange={handleChange('icon')}
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <MenuItem key={icon} value={icon}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography>{icon}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Farbe auswählen
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {COLOR_PALETTE.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: formData.color === color ? '3px solid' : '1px solid',
                          borderColor: formData.color === color ? 'primary.main' : 'divider',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <TextField
                    label="Oder eigene Hex-Farbe"
                    value={formData.color}
                    onChange={handleChange('color')}
                    size="small"
                    sx={{ mt: 1 }}
                    placeholder="#4CAF50"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Einstellungen */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                ⚙️ Einstellungen
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Max. Slots pro Tag"
                    type="number"
                    value={formData.max_slots_per_day}
                    onChange={handleChange('max_slots_per_day')}
                    inputProps={{ min: 1, max: 50 }}
                    fullWidth
                    helperText="Wie viele Zeitslots maximal pro Tag für diese Aufgabe erstellt werden können"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mindest-Erfahrungslevel"
                    type="number"
                    value={formData.min_experience_level}
                    onChange={handleChange('min_experience_level')}
                    inputProps={{ min: 0, max: 10 }}
                    fullWidth
                    helperText="Welches Erfahrungslevel Mitglieder mindestens haben müssen"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requires_training}
                        onChange={handleChange('requires_training')}
                      />
                    }
                    label="Einweisung erforderlich"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                    Mitglieder müssen eine spezielle Einweisung erhalten haben
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vorschau */}
          <Card elevation={2} sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                👁️ Vorschau
              </Typography>
              
              <Paper elevation={1} sx={{ p: 2, maxWidth: 400 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar 
                    sx={{ 
                      bgcolor: formData.color,
                      width: 40,
                      height: 40
                    }}
                  >
                    {selectedDifficulty.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formData.name || 'Aufgabenname'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={selectedDifficulty.label}
                        sx={{ bgcolor: selectedDifficulty.color + '20', color: selectedDifficulty.color }}
                        size="small"
                      />
                      <Chip
                        label={formData.is_active ? 'Aktiv' : 'Inaktiv'}
                        color={formData.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                
                {formData.description && (
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    {formData.description}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={2} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  <Typography variant="body2">
                    📊 Max. {formData.max_slots_per_day} Slots/Tag
                  </Typography>
                  <Typography variant="body2">
                    🎯 Level {formData.min_experience_level}+
                  </Typography>
                  {formData.requires_training && (
                    <Typography variant="body2">
                      🎓 Einweisung
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </CardContent>
          </Card>

          {/* Aktionen */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/taskmanager/task-types')}
              disabled={saving || deleting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving || deleting || success}
              size="large"
            >
              {saving ? 'Speichere...' : 'Änderungen speichern'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Container>
  )
}

export default TaskTypeEdit