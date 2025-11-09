// frontend/src/apps/taskmanager/pages/TaskScheduleDetail.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Box, Button,
  Chip, Avatar, LinearProgress, Alert, CircularProgress,
  Grid, Stack, Divider
} from '@mui/material'
import {
  Edit, Delete, Assignment, Room, Schedule,
  AccessTime, Person, ArrowBack
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'
import TaskSlotBooking from '../components/TaskSlotBooking'

function TaskScheduleDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      loadSchedule()
    }
  }, [id])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      
      const response = await api.get(`/taskmanager/schedules/${id}/`)
      setSchedule(response.data)
      
    } catch (err) {
      console.error('Error loading schedule:', err)
      setError('Fehler beim Laden der Aufgabenplanung')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diese Aufgabenplanung wirklich löschen?')) return
    
    try {
      await api.delete(`/taskmanager/schedules/${id}/`)
      navigate('/taskmanager/schedules')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen der Aufgabenplanung')
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

  const formatTime = (timeString) => {
    return timeString?.slice(0, 5) || ''
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!schedule) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Aufgabenplanung nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={4}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/taskmanager/schedules')}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          
          <Avatar 
            sx={{ 
              bgcolor: schedule.task_type_details?.color || 'primary.main',
              mr: 2, 
              width: 48, 
              height: 48 
            }}
          >
            <Assignment />
          </Avatar>
          
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {schedule.task_type_details?.name || 'Unbekannte Aufgabe'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {format(parseISO(`${schedule.date}T00:00:00`), 'dd. MMMM yyyy', { locale: de })}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/taskmanager/schedules/${id}/edit`)}
          >
            Bearbeiten
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Löschen
          </Button>
        </Stack>
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {schedule.max_slots}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Verfügbare Slots
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <Person />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {schedule.booked_slots_count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Gebucht
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <AccessTime />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {schedule.available_slots_count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Verfügbar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Assignment />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {schedule.utilization_percentage?.toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Auslastung
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Details Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            📋 Aufgaben-Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Assignment color="action" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {schedule.task_type_details?.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={schedule.task_type_details?.difficulty_display}
                        color={getDifficultyColor(schedule.task_type_details?.difficulty)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <Room color="action" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {schedule.room_details?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {schedule.room_details?.room_type_display}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <AccessTime color="action" />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Arbeitszeit
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Auslastung
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={schedule.utilization_percentage || 0}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2">
                    {schedule.booked_slots_count}/{schedule.max_slots} Slots gebucht
                  </Typography>
                </Box>
                
                {schedule.notes && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Hinweise
                    </Typography>
                    <Typography variant="body2">
                      {schedule.notes}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Slot Booking Component */}
      <TaskSlotBooking 
        scheduleId={id} 
        onBookingChange={loadSchedule}
      />
    </Container>
  )
}

export default TaskScheduleDetail