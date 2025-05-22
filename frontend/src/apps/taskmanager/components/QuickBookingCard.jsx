// frontend/src/apps/taskmanager/components/QuickBookingCard.jsx

import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Button, Box, Stack,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Chip, Avatar, LinearProgress, Divider
} from '@mui/material'
import {
  FlashOn, Assignment, Person, Schedule, CheckCircle
} from '@mui/icons-material'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'

export default function QuickBookingCard({ onBookingSuccess }) {
  const [availableSlots, setAvailableSlots] = useState([])
  const [members, setMembers] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadQuickBookingData()
  }, [])

  const loadQuickBookingData = async () => {
    try {
      setLoading(true)
      
      // Heute verfügbare Slots laden
      const today = format(new Date(), 'yyyy-MM-dd')
      const [slotsResponse, membersResponse] = await Promise.all([
        api.get(`/taskmanager/schedules/today/`),
        api.get('/members/')
      ])
      
      // Nur Slots mit verfügbaren Plätzen
      const allSlots = []
      const schedules = slotsResponse.data || []
      
      schedules.forEach(schedule => {
        if (schedule.time_slots && schedule.available_slots_count > 0) {
          schedule.time_slots.forEach(slot => {
            if (!slot.is_blocked && slot.available_spots > 0) {
              allSlots.push({
                ...slot,
                schedule_info: {
                  id: schedule.id,
                  task_name: schedule.task_type_details.name,
                  task_difficulty: schedule.task_type_details.difficulty,
                  task_difficulty_display: schedule.task_type_details.difficulty_display,
                  task_color: schedule.task_type_details.color,
                  room_name: schedule.room_details.name,
                  date: schedule.date
                }
              })
            }
          })
        }
      })
      
      setAvailableSlots(allSlots)
      setMembers(membersResponse.data.results || membersResponse.data)
      
    } catch (err) {
      console.error('Error loading quick booking data:', err)
      setError('Fehler beim Laden der verfügbaren Slots')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickBook = async () => {
    if (!selectedSlot || !selectedMember) {
      setError('Bitte wählen Sie einen Slot und ein Mitglied aus')
      return
    }

    try {
      setBooking(true)
      setError(null)
      
      await api.post('/taskmanager/bookings/', {
        time_slot: selectedSlot,
        member: selectedMember,
        notes: 'Schnellbuchung über Dashboard'
      })
      
      setSuccess(true)
      setSelectedSlot('')
      setSelectedMember('')
      
      // Daten neu laden
      setTimeout(() => {
        loadQuickBookingData()
        if (onBookingSuccess) {
          onBookingSuccess()
        }
        setSuccess(false)
      }, 2000)
      
    } catch (err) {
      console.error('Quick booking error:', err)
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0])
      } else {
        setError('Fehler bei der Schnellbuchung')
      }
    } finally {
      setBooking(false)
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

  const selectedSlotData = availableSlots.find(slot => slot.id === selectedSlot)

  return (
    <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <FlashOn />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            ⚡ Schnellbuchung
          </Typography>
        </Box>

        {loading ? (
          <Box>
            <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { backgroundColor: 'white' } }} />
            <Typography variant="body2">Lade verfügbare Slots...</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* Success Alert */}
            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  color: 'success.dark',
                  '& .MuiAlert-icon': { color: 'success.main' }
                }}
              >
                Buchung erfolgreich! 🎉
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  color: 'error.dark',
                  '& .MuiAlert-icon': { color: 'error.main' }
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {availableSlots.length === 0 ? (
              <Alert 
                severity="info"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  color: 'info.dark',
                  '& .MuiAlert-icon': { color: 'info.main' }
                }}
              >
                Heute sind keine Slots mehr verfügbar
              </Alert>
            ) : (
              <>
                {/* Slot Selection */}
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    Verfügbaren Slot auswählen
                  </InputLabel>
                  <Select
                    value={selectedSlot}
                    label="Verfügbaren Slot auswählen"
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '& .MuiSvgIcon-root': { color: 'white' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            whiteSpace: 'normal',
                            py: 1
                          }
                        }
                      }
                    }}
                  >
                    {availableSlots.map((slot) => (
                      <MenuItem key={slot.id} value={slot.id}>
                        <Box width="100%">
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Chip
                              label={slot.schedule_info.task_difficulty_display}
                              color={getDifficultyColor(slot.schedule_info.task_difficulty)}
                              size="small"
                            />
                            <Typography fontWeight="bold">
                              {slot.schedule_info.task_name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            🕐 {formatTime(slot.start_time)} - {formatTime(slot.end_time)} • 
                            📍 {slot.schedule_info.room_name} • 
                            👥 {slot.available_spots} Plätze frei
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Member Selection */}
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    Mitglied auswählen
                  </InputLabel>
                  <Select
                    value={selectedMember}
                    label="Mitglied auswählen"
                    onChange={(e) => setSelectedMember(e.target.value)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '& .MuiSvgIcon-root': { color: 'white' }
                    }}
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

                {/* Selected Slot Preview */}
                {selectedSlotData && (
                  <Box 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)', 
                      borderRadius: 2, 
                      p: 2,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" mb={1}>
                      📋 Ausgewählter Slot:
                    </Typography>
                    <Typography variant="body2">
                      <strong>{selectedSlotData.schedule_info.task_name}</strong>
                    </Typography>
                    <Typography variant="body2">
                      🕐 {formatTime(selectedSlotData.start_time)} - {formatTime(selectedSlotData.end_time)}
                    </Typography>
                    <Typography variant="body2">
                      📍 {selectedSlotData.schedule_info.room_name}
                    </Typography>
                    <Typography variant="body2">
                      👥 {selectedSlotData.available_spots} von {selectedSlotData.max_participants} Plätzen frei
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

                {/* Book Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={booking ? null : <CheckCircle />}
                  onClick={handleQuickBook}
                  disabled={!selectedSlot || !selectedMember || booking || success}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)'
                    }
                  }}
                >
                  {booking ? 'Buche...' : success ? 'Gebucht! ✓' : 'Jetzt buchen'}
                </Button>
              </>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}