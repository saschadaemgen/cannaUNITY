// frontend/src/apps/taskmanager/pages/TaskScheduleCreate.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Button, Box,
  Alert, Divider, Chip, Avatar, Stack
} from '@mui/material'
import { Save, Cancel, Assignment, Schedule, Room } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'

export default function TaskScheduleCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    task_type: '',
    room: '',
    date: '',
    start_time: '08:00',
    end_time: '17:00',
    max_slots: 8,
    max_participants_per_slot: 1,
    notes: ''
  })
  
  const [taskTypes, setTaskTypes] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const [taskTypesRes, roomsRes] = await Promise.all([
        api.get('/taskmanager/task-types/'),
        api.get('/rooms/')
      ])
      
      setTaskTypes(taskTypesRes.data.results || taskTypesRes.data)
      setRooms(roomsRes.data.results || roomsRes.data)
      
    } catch (err) {
      console.error('Error loading options:', err)
      setError('Fehler beim Laden der Optionen. Prüfen Sie, ob Aufgabentypen im Django Admin erstellt wurden.')
      
      // Fallback: Mock-Daten für Testing
      setTaskTypes([
        { id: '1', name: 'Bewässerung', difficulty: 'leicht', difficulty_display: 'Leicht' },
        { id: '2', name: 'Beschneidung', difficulty: 'mittel', difficulty_display: 'Mittel' },
        { id: '3', name: 'Ernte', difficulty: 'anspruchsvoll', difficulty_display: 'Anspruchsvoll' }
      ])
    }
  }

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    
    // Clear warnings when user changes relevant fields
    if (['task_type', 'room', 'date'].includes(field)) {
      setDuplicateWarning(null)
    }
  }

  // Proaktive Überprüfung auf Duplikate
  useEffect(() => {
    const checkForDuplicates = async () => {
      if (formData.task_type && formData.room && formData.date) {
        try {
          const response = await api.get('/taskmanager/schedules/', {
            params: {
              task_type: formData.task_type,
              room: formData.room,
              date: formData.date
            }
          })
          
          const existingSchedules = response.data.results || response.data
          if (existingSchedules.length > 0) {
            const selectedTaskType = taskTypes.find(tt => tt.id === formData.task_type)
            const selectedRoom = rooms.find(r => r.id === formData.room)
            
            setDuplicateWarning(
              `⚠️ Hinweis: Es existiert bereits eine Aufgabenplanung für "${selectedTaskType?.name}" ` +
              `im Raum "${selectedRoom?.name}" am ${formData.date}. ` +
              `Bitte wählen Sie andere Parameter oder bearbeiten Sie die bestehende Planung.`
            )
          } else {
            setDuplicateWarning(null)
          }
        } catch (err) {
          // Fehler beim Prüfen ignorieren
          console.warn('Could not check for duplicates:', err)
        }
      }
    }

    // Debounce die Überprüfung um API-Aufrufe zu reduzieren
    const timeoutId = setTimeout(checkForDuplicates, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.task_type, formData.room, formData.date, taskTypes, rooms])

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!formData.task_type || !formData.room || !formData.date) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    if (formData.start_time >= formData.end_time) {
      setError('Startzeit muss vor Endzeit liegen')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post('/taskmanager/schedules/', formData)
      
      setSuccess(true)
      setTimeout(() => {
        navigate(`/taskmanager/schedules/${response.data.id}`)
      }, 1500)
      
    } catch (err) {
      console.error('Create error:', err)
      
      if (err.response?.status === 400) {
        const errorData = err.response.data
        
        // Spezielle Behandlung für unique_together Constraint
        if (errorData.non_field_errors && 
            errorData.non_field_errors[0]?.includes('eindeutige Menge')) {
          
          const selectedTaskType = taskTypes.find(tt => tt.id === formData.task_type)
          const selectedRoom = rooms.find(r => r.id === formData.room)
          
          setError(
            `⚠️ Es existiert bereits eine Aufgabenplanung für "${selectedTaskType?.name}" ` +
            `im Raum "${selectedRoom?.name}" am ${formData.date}. ` +
            `Bitte wählen Sie ein anderes Datum, einen anderen Raum oder einen anderen Aufgabentyp.`
          )
          return
        }
        
        // Andere Validierungsfehler
        if (errorData) {
          const errors = []
          Object.entries(errorData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`)
            } else {
              errors.push(`${key}: ${value}`)
            }
          })
          setError(errors.join(' | '))
        }
      } else {
        setError('Fehler beim Erstellen der Aufgabenplanung')
      }
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'leicht': 'success',
      'mittel': 'warning',
      'anspruchsvoll': 'error'
    }
    return colors[difficulty] || 'default'
  }

  const selectedTaskType = taskTypes.find(tt => tt.id === formData.task_type)
  const selectedRoom = rooms.find(r => r.id === formData.room)

  // Berechne Anzahl der Stunden für automatische Slot-Berechnung
  const calculateSlots = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}:00`)
      const end = new Date(`2000-01-01T${formData.end_time}:00`)
      const hours = (end - start) / (1000 * 60 * 60)
      return Math.max(1, Math.floor(hours))
    }
    return 8
  }

  useEffect(() => {
    const autoSlots = calculateSlots()
    if (autoSlots !== formData.max_slots) {
      setFormData(prev => ({ ...prev, max_slots: autoSlots }))
    }
  }, [formData.start_time, formData.end_time])

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
          <Assignment />
        </Avatar>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Neue Aufgabe planen
        </Typography>
      </Box>

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {duplicateWarning}
          <Box sx={{ mt: 1 }}>
            <Button 
              size="small" 
              onClick={() => navigate('/taskmanager/schedules')}
              sx={{ mr: 1 }}
            >
              Bestehende Planungen anzeigen
            </Button>
          </Box>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Aufgabenplanung wurde erfolgreich erstellt! Sie werden weitergeleitet...
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
          {/* Grunddaten */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                📋 Grunddaten
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ minWidth: 250 }}>
                    <InputLabel>Aufgabentyp</InputLabel>
                    <Select
                      value={formData.task_type}
                      label="Aufgabentyp"
                      onChange={handleChange('task_type')}
                    >
                      {taskTypes.map((taskType) => (
                        <MenuItem key={taskType.id} value={taskType.id}>
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Chip
                              label={taskType.difficulty}
                              color={getDifficultyColor(taskType.difficulty)}
                              size="small"
                            />
                            <Typography>{taskType.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ minWidth: 200 }}>
                    <InputLabel>Raum</InputLabel>
                    <Select
                      value={formData.room}
                      label="Raum"
                      onChange={handleChange('room')}
                    >
                      {rooms.map((room) => (
                        <MenuItem key={room.id} value={room.id}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Room fontSize="small" />
                            <Typography>{room.name}</Typography>
                            <Chip
                              label={room.room_type_display}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Datum"
                    type="date"
                    value={formData.date}
                    onChange={handleChange('date')}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                    sx={{ maxWidth: 300 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Zeitplanung */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                ⏰ Zeitplanung
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Startzeit"
                    type="time"
                    value={formData.start_time}
                    onChange={handleChange('start_time')}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Endzeit"
                    type="time"
                    value={formData.end_time}
                    onChange={handleChange('end_time')}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Maximale Anzahl Slots"
                    type="number"
                    value={formData.max_slots}
                    onChange={handleChange('max_slots')}
                    inputProps={{ min: 1, max: 24 }}
                    fullWidth
                    helperText={`Automatisch berechnet: ${calculateSlots()} Stunden`}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Max. Teilnehmer pro Slot"
                    type="number"
                    value={formData.max_participants_per_slot}
                    onChange={handleChange('max_participants_per_slot')}
                    inputProps={{ min: 1, max: 10 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Zusätzliche Informationen */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                📝 Zusätzliche Informationen
              </Typography>
              
              <TextField
                label="Hinweise (optional)"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange('notes')}
                fullWidth
                placeholder="Besondere Hinweise, Voraussetzungen oder Anweisungen für diese Aufgabe..."
              />
            </CardContent>
          </Card>

          {/* Vorschau */}
          {(selectedTaskType || selectedRoom) && (
            <Card elevation={2} sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  👁️ Vorschau
                </Typography>
                
                <Stack spacing={2}>
                  {selectedTaskType && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Assignment color="action" />
                      <Typography variant="body1">
                        <strong>{selectedTaskType.name}</strong>
                      </Typography>
                      <Chip
                        label={selectedTaskType.difficulty}
                        color={getDifficultyColor(selectedTaskType.difficulty)}
                        size="small"
                      />
                    </Box>
                  )}
                  
                  {selectedRoom && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Room color="action" />
                      <Typography variant="body1">
                        <strong>{selectedRoom.name}</strong>
                      </Typography>
                      <Chip
                        label={selectedRoom.room_type_display}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  )}
                  
                  {formData.date && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Schedule color="action" />
                      <Typography variant="body1">
                        {formData.date} von {formData.start_time} bis {formData.end_time}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="textSecondary">
                    Es werden automatisch {formData.max_slots} Zeitslots à 1 Stunde erstellt, 
                    jeweils für max. {formData.max_participants_per_slot} Teilnehmer.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Aktionen */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/taskmanager/schedules')}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading || success || duplicateWarning}
              size="large"
            >
              {loading ? 'Erstelle...' : 'Aufgabenplanung erstellen'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Container>
  )
}