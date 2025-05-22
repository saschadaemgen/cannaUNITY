// frontend/src/apps/taskmanager/pages/TaskScheduleEdit.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Button, Box,
  Alert, Chip, Avatar, Stack, CircularProgress
} from '@mui/material'
import { Save, Cancel, Assignment, Delete } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/utils/api'

export default function TaskScheduleEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
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
  
  const [originalSchedule, setOriginalSchedule] = useState(null)
  const [taskTypes, setTaskTypes] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [scheduleRes, taskTypesRes, roomsRes] = await Promise.all([
        api.get(`/taskmanager/schedules/${id}/`),
        api.get('/taskmanager/task-types/'),
        api.get('/rooms/')
      ])
      
      const schedule = scheduleRes.data
      setOriginalSchedule(schedule)
      setFormData({
        task_type: schedule.task_type,
        room: schedule.room,
        date: schedule.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        max_slots: schedule.max_slots,
        max_participants_per_slot: schedule.max_participants_per_slot,
        notes: schedule.notes || ''
      })
      
      setTaskTypes(taskTypesRes.data.results || taskTypesRes.data)
      setRooms(roomsRes.data.results || roomsRes.data)
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Fehler beim Laden der Aufgabenplanung')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

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
      setSaving(true)
      setError(null)
      
      await api.put(`/taskmanager/schedules/${id}/`, formData)
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/taskmanager/schedules')
      }, 1500)
      
    } catch (err) {
      console.error('Update error:', err)
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0])
      } else {
        setError('Fehler beim Aktualisieren der Aufgabenplanung')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diese Aufgabenplanung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      setDeleting(true)
      await api.delete(`/taskmanager/schedules/${id}/`)
      navigate('/taskmanager/schedules')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen der Aufgabenplanung')
    } finally {
      setDeleting(false)
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!originalSchedule) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Aufgabenplanung nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={4}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
            <Assignment />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Aufgabe bearbeiten
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {originalSchedule.task_type_details.name} - {originalSchedule.date}
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
          Aufgabenplanung wurde erfolgreich aktualisiert! Sie werden weitergeleitet...
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Buchungsstatistiken */}
      {originalSchedule && (
        <Card elevation={2} sx={{ mb: 3, bgcolor: 'info.50' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              📊 Aktuelle Buchungen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {originalSchedule.booked_slots_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Gebuchte Slots
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {originalSchedule.available_slots_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Verfügbare Slots
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {originalSchedule.utilization_percentage}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Auslastung
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {originalSchedule.booked_slots_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ Achtung: Diese Aufgabenplanung hat bereits {originalSchedule.booked_slots_count} Buchungen. 
                Änderungen können bestehende Buchungen beeinträchtigen.
              </Alert>
            )}
          </CardContent>
        </Card>
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
                          {room.name}
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

          {/* Hinweise */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                📝 Hinweise
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

          {/* Aktionen */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/taskmanager/schedules')}
              disabled={saving || deleting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving || deleting || success}
            >
              {saving ? 'Speichere...' : 'Änderungen speichern'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Container>
  )
}