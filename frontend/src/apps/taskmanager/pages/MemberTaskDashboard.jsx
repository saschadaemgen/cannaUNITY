// frontend/src/apps/taskmanager/pages/MemberTaskDashboard.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Grid, Box,
  Avatar, Chip, Button, Stack, Alert, LinearProgress,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
  Person, Star, Assignment, Schedule, CheckCircle,
  Cancel, TrendingUp, EmojiEvents, AccessTime
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useParams } from 'react-router-dom'
import api from '@/utils/api'

export default function MemberTaskDashboard() {
  const { memberId } = useParams()
  const [memberData, setMemberData] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Cancel Dialog
  const [cancelDialog, setCancelDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    if (memberId) {
      loadMemberData()
    }
  }, [memberId])

  const loadMemberData = async () => {
    try {
      setLoading(true)
      
      const [dashboardRes, memberRes] = await Promise.all([
        api.get(`/taskmanager/dashboard/member_dashboard/?member=${memberId}`),
        api.get(`/members/${memberId}/`)
      ])
      
      setMemberData(dashboardRes.data)
      setMember(memberRes.data)
      
    } catch (err) {
      setError('Fehler beim Laden der Mitgliederdaten')
      console.error('Member dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    try {
      await api.post(`/taskmanager/bookings/${selectedBooking.id}/cancel/`, {
        reason: 'Vom Mitglied storniert'
      })
      
      setCancelDialog(false)
      setSelectedBooking(null)
      loadMemberData()
      
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

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'success',
      'completed': 'info',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      const dateTime = new Date(`${dateString}T${timeString}`)
      return format(dateTime, 'dd.MM.yyyy HH:mm', { locale: de })
    } catch {
      return `${dateString} ${timeString}`
    }
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <LinearProgress sx={{ mb: 2, width: '200px' }} />
            <Typography>Mitgliederdaten werden geladen...</Typography>
          </Box>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!member || !memberData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Mitglied nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: 'primary.main' }}>
          {member.first_name[0]}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {member.first_name} {member.last_name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Aufgaben-Dashboard
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistiken */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                    <CheckCircle />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">
                    {memberData.completed_bookings_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Abgeschlossen
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                    <Cancel />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">
                    {memberData.cancelled_bookings_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Storniert
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                    <Star />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">
                    {memberData.total_experience_points}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Erfahrungspunkte
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                    <Schedule />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">
                    {memberData.upcoming_bookings?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Kommende Termine
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Kommende Buchungen */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📅 Kommende Termine
              </Typography>
              
              {memberData.upcoming_bookings?.length === 0 ? (
                <Alert severity="info">Keine kommenden Termine</Alert>
              ) : (
                <List>
                  {memberData.upcoming_bookings?.map((booking, index) => (
                    <Box key={booking.id}>
                      <ListItem
                        secondaryAction={
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setCancelDialog(true)
                            }}
                          >
                            Stornieren
                          </Button>
                        }
                      >
                        <ListItemIcon>
                          <Assignment />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography fontWeight="bold">
                                {booking.time_slot_details?.schedule_details?.task_type_details?.name}
                              </Typography>
                              <Chip
                                label={booking.time_slot_details?.schedule_details?.task_type_details?.difficulty_display}
                                color={getDifficultyColor(booking.time_slot_details?.schedule_details?.task_type_details?.difficulty)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="body2" color="textSecondary">
                                🕐 {formatDateTime(
                                  booking.time_slot_details?.schedule_details?.date,
                                  booking.time_slot_details?.start_time
                                )}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                📍 {booking.time_slot_details?.schedule_details?.room_details?.name}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < (memberData.upcoming_bookings?.length - 1) && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Erfahrungen & Level */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Verfügbare Aufgaben heute */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  🎯 Heute verfügbar
                </Typography>
                
                {memberData.available_tasks_today?.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Heute keine Aufgaben verfügbar
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {memberData.available_tasks_today?.slice(0, 3).map((task) => (
                      <Box 
                        key={task.id}
                        sx={{ 
                          p: 1, 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1 
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="body2" fontWeight="bold">
                            {task.task_type_details.name}
                          </Typography>
                          <Chip
                            label={task.task_type_details.difficulty_display}
                            color={getDifficultyColor(task.task_type_details.difficulty)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
                          📍 {task.room_details.name} • {task.available_slots_count} Slots frei
                        </Typography>
                      </Box>
                    ))}
                    
                    {memberData.available_tasks_today?.length > 3 && (
                      <Typography variant="body2" color="textSecondary" textAlign="center">
                        ... und {memberData.available_tasks_today.length - 3} weitere
                      </Typography>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Erfahrungs-Level */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  🏆 Erfahrungs-Level
                </Typography>
                
                {memberData.task_experiences?.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Noch keine Erfahrungen gesammelt
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {memberData.task_experiences?.map((exp) => (
                      <Box key={exp.id}>
                        <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {exp.task_type_details.name}
                          </Typography>
                          <Chip
                            label={`Level ${exp.level}`}
                            color="primary"
                            size="small"
                            icon={<EmojiEvents />}
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            {exp.level_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {exp.experience_points} XP
                          </Typography>
                        </Box>
                        
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((exp.experience_points % 25) * 4, 100)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        
                        <Typography variant="body2" color="textSecondary" fontSize="0.75rem" mt={0.5}>
                          {exp.completed_tasks} Aufgaben • ⭐ {exp.average_rating?.toFixed(1) || 'Keine Bewertung'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Buchung stornieren
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" mb={2}>
                Möchten Sie diese Buchung wirklich stornieren?
              </Typography>
              
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Aufgabe:</strong> {selectedBooking.time_slot_details?.schedule_details?.task_type_details?.name}<br />
                  <strong>Zeit:</strong> {formatDateTime(
                    selectedBooking.time_slot_details?.schedule_details?.date,
                    selectedBooking.time_slot_details?.start_time
                  )}<br />
                  <strong>Raum:</strong> {selectedBooking.time_slot_details?.schedule_details?.room_details?.name}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Behalten
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
          >
            Stornieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}