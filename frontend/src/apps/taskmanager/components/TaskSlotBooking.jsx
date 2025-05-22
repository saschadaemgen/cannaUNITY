// frontend/src/apps/taskmanager/components/TaskSlotBooking.jsx

import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Stack, Avatar, LinearProgress, Divider, IconButton, Tooltip
} from '@mui/material'
import {
  AccessTime, Person, Room, Assignment, Cancel,
  CheckCircle, Block, Info, Star, Schedule
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'

export default function TaskSlotBooking({ scheduleId, onBookingChange }) {
  const [schedule, setSchedule] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Booking Dialog State
  const [bookingDialog, setBookingDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedMember, setSelectedMember] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Schedule mit Zeitslots laden
      const scheduleResponse = await api.get(`/taskmanager/schedules/${scheduleId}/`)
      setSchedule(scheduleResponse.data)
      setTimeSlots(scheduleResponse.data.time_slots || [])
      
      // Mitglieder laden
      const membersResponse = await api.get('/members/')
      setMembers(membersResponse.data.results || membersResponse.data)
      
    } catch (err) {
      setError('Fehler beim Laden der Aufgabendaten')
      console.error('Task loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (scheduleId) {
      loadData()
    }
  }, [scheduleId])

  const handleBookSlot = (slot) => {
    if (slot.is_blocked || slot.is_fully_booked) return
    
    setSelectedSlot(slot)
    setSelectedMember('')
    setBookingNotes('')
    setBookingDialog(true)
  }

  const confirmBooking = async () => {
    if (!selectedMember || !selectedSlot) return
    
    try {
      setBookingLoading(true)
      
      await api.post('/taskmanager/bookings/', {
        time_slot: selectedSlot.id,
        member: selectedMember,
        notes: bookingNotes
      })
      
      // Daten neu laden
      await loadData()
      
      // Dialog schließen
      setBookingDialog(false)
      
      // Parent-Komponente benachrichtigen
      if (onBookingChange) {
        onBookingChange()
      }
      
    } catch (err) {
      console.error('Booking error:', err)
      setError('Fehler bei der Buchung')
    } finally {
      setBookingLoading(false)
    }
  }

  const cancelBooking = async (bookingId) => {
    if (!confirm('Möchten Sie diese Buchung wirklich stornieren?')) return
    
    try {
      await api.post(`/taskmanager/bookings/${bookingId}/cancel/`, {
        reason: 'Storniert über Interface'
      })
      
      await loadData()
      
      if (onBookingChange) {
        onBookingChange()
      }
      
    } catch (err) {
      console.error('Cancel booking error:', err)
      setError('Fehler beim Stornieren der Buchung')
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

  const getSlotStatus = (slot) => {
    if (slot.is_blocked) return { status: 'blocked', label: 'Gesperrt', color: 'error' }
    if (slot.is_fully_booked) return { status: 'full', label: 'Ausgebucht', color: 'error' }
    if (slot.current_bookings_count > 0) return { status: 'partial', label: 'Teilweise gebucht', color: 'warning' }
    return { status: 'available', label: 'Verfügbar', color: 'success' }
  }

  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`)
    return format(time, 'HH:mm')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  }

  if (!schedule) {
    return <Alert severity="info" sx={{ m: 2 }}>Aufgabe nicht gefunden</Alert>
  }

  return (
    <Box>
      {/* Schedule Header */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: schedule.task_type_details.color, width: 48, height: 48 }}>
                <Assignment />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {schedule.task_type_details.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    label={schedule.task_type_details.difficulty_display}
                    color={getDifficultyColor(schedule.task_type_details.difficulty)}
                    size="small"
                  />
                  <Chip
                    icon={<Room />}
                    label={schedule.room_details.name}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<Schedule />}
                    label={format(parseISO(`${schedule.date}T00:00:00`), 'dd. MMMM yyyy', { locale: de })}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
            
            <Box textAlign="right">
              <Typography variant="h6" fontWeight="bold">
                {schedule.booked_slots_count}/{schedule.max_slots}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Slots gebucht
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={schedule.utilization_percentage}
                sx={{ mt: 1, width: 100 }}
              />
            </Box>
          </Box>
          
          {schedule.notes && (
            <Alert severity="info" icon={<Info />}>
              {schedule.notes}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Time Slots Grid */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Verfügbare Zeitslots
      </Typography>
      
      <Grid container spacing={2}>
        {timeSlots.map((slot) => {
          const slotStatus = getSlotStatus(slot)
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={slot.id}>
              <Card 
                elevation={slot.is_blocked ? 1 : 2}
                sx={{ 
                  opacity: slot.is_blocked ? 0.6 : 1,
                  border: `2px solid ${
                    slotStatus.status === 'available' ? 'success.main' :
                    slotStatus.status === 'partial' ? 'warning.main' : 
                    'error.main'
                  }20`
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  {/* Zeit-Header */}
                  <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime fontSize="small" />
                      <Typography variant="h6" fontWeight="bold">
                        {formatTime(slot.start_time)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        - {formatTime(slot.end_time)}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={slotStatus.label}
                      color={slotStatus.color}
                      size="small"
                    />
                  </Box>

                  {/* Teilnehmer-Anzeige */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      {slot.current_bookings_count}/{slot.max_participants} Teilnehmer
                    </Typography>
                  </Box>

                  {/* Aktuelle Buchungen */}
                  {slot.bookings && slot.bookings.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Gebucht von:
                      </Typography>
                      <Stack spacing={1}>
                        {slot.bookings
                          .filter(booking => booking.status === 'confirmed')
                          .map((booking) => (
                          <Box 
                            key={booking.id}
                            display="flex" 
                            alignItems="center" 
                            justifyContent="between"
                            sx={{ 
                              p: 1, 
                              borderRadius: 1, 
                              bgcolor: 'grey.100',
                              fontSize: '0.875rem'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {booking.member_details.first_name[0]}
                              </Avatar>
                              <Typography variant="body2">
                                {booking.member_details.full_name}
                              </Typography>
                            </Box>
                            
                            <Tooltip title="Buchung stornieren">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => cancelBooking(booking.id)}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Block-Grund anzeigen */}
                  {slot.is_blocked && slot.block_reason && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {slot.block_reason}
                      </Typography>
                    </Alert>
                  )}

                  {/* Buchungs-Button */}
                  <Button
                    fullWidth
                    variant={slotStatus.status === 'available' ? 'contained' : 'outlined'}
                    disabled={slot.is_blocked || slot.is_fully_booked}
                    onClick={() => handleBookSlot(slot)}
                    startIcon={
                      slot.is_blocked ? <Block /> :
                      slot.is_fully_booked ? <Cancel /> :
                      <CheckCircle />
                    }
                  >
                    {
                      slot.is_blocked ? 'Gesperrt' :
                      slot.is_fully_booked ? 'Ausgebucht' :
                      'Slot buchen'
                    }
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Booking Dialog */}
      <Dialog 
        open={bookingDialog} 
        onClose={() => setBookingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Slot buchen - {selectedSlot && formatTime(selectedSlot.start_time)}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Mitglied auswählen</InputLabel>
              <Select
                value={selectedMember}
                label="Mitglied auswählen"
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                {members.map((member) => (
                  <MenuItem key={member.uuid} value={member.uuid}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {member.first_name[0]}
                      </Avatar>
                      {member.first_name} {member.last_name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Notizen (optional)"
              multiline
              rows={3}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Besondere Hinweise oder Anmerkungen zur Buchung..."
            />

            {selectedSlot && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Aufgabe:</strong> {schedule.task_type_details.name}<br />
                  <strong>Raum:</strong> {schedule.room_details.name}<br />
                  <strong>Zeit:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}<br />
                  <strong>Verfügbare Plätze:</strong> {selectedSlot.available_spots}
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={confirmBooking}
            variant="contained"
            disabled={!selectedMember || bookingLoading}
          >
            {bookingLoading ? 'Buche...' : 'Buchung bestätigen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}