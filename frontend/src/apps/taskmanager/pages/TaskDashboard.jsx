// frontend/src/apps/taskmanager/pages/TaskDashboard.jsx

import { useState, useEffect } from 'react'
import {
  Container, Grid, Card, CardContent, Typography, Box, Button,
  Chip, LinearProgress, Alert, Divider, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Stack, Paper
} from '@mui/material'
import {
  Assignment, Schedule, Person, TrendingUp, AccessTime,
  CheckCircle, Cancel, Group, CalendarToday
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'
import TaskScheduleCalendar from '../components/TaskScheduleCalendar'
import QuickBookingCard from '../components/QuickBookingCard'

export default function TaskDashboard() {
  const [stats, setStats] = useState(null)
  const [todaySchedules, setTodaySchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Dashboard-Statistiken laden
      const statsResponse = await api.get('/taskmanager/dashboard/stats/')
      setStats(statsResponse.data)
      
      // Heutige Aufgaben laden
      const todayResponse = await api.get('/taskmanager/schedules/today/')
      setTodaySchedules(todayResponse.data)
      
    } catch (err) {
      setError('Fehler beim Laden der Dashboard-Daten')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'leicht': 'success',
      'mittel': 'warning', 
      'anspruchsvoll': 'error'
    }
    return colors[difficulty] || 'default'
  }

  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`)
    return format(time, 'HH:mm')
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <LinearProgress sx={{ mb: 2, width: '200px' }} />
            <Typography>Dashboard wird geladen...</Typography>
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Aufgaben-Management Dashboard
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Assignment />}
          href="/taskmanager/schedules/new"
        >
          Neue Aufgabe planen
        </Button>
      </Box>

      {/* Statistik-Karten */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Heute geplant
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats?.total_tasks_today || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Aufgaben
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <Assignment fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Auslastung heute
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats?.utilization_rate_today || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.utilization_rate_today || 0}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <TrendingUp fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Verfügbare Slots
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats?.available_slots_today || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    von {stats?.total_time_slots_today || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <Schedule fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Diese Woche
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats?.completed_bookings_this_week || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    abgeschlossen
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                  <CheckCircle fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Heutige Aufgaben */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" component="h2" fontWeight="bold">
                  Heutige Aufgaben
                </Typography>
                <Chip 
                  label={format(new Date(), 'dd. MMMM yyyy', { locale: de })}
                  icon={<CalendarToday />}
                  variant="outlined"
                />
              </Box>
              
              {todaySchedules.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Heute sind keine Aufgaben geplant.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {todaySchedules.map((schedule) => (
                    <Paper 
                      key={schedule.id} 
                      elevation={1} 
                      sx={{ p: 2, border: `2px solid ${schedule.task_type_details.color}20` }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={schedule.task_type_details.difficulty_display}
                            color={getDifficultyColor(schedule.task_type_details.difficulty)}
                            size="small"
                          />
                          <Typography variant="h6" fontWeight="bold">
                            {schedule.task_type_details.name}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" justifyContent="between">
                        <Typography variant="body2" color="textSecondary">
                          📍 {schedule.room_details.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body2">
                            {schedule.booked_slots_count}/{schedule.max_slots} Slots gebucht
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={schedule.utilization_percentage}
                            sx={{ width: 100 }}
                          />
                        </Box>
                      </Box>
                      
                      {schedule.notes && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          💭 {schedule.notes}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Seitenleiste */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Quick-Booking Card */}
            <QuickBookingCard onBookingSuccess={loadDashboardData} />

            {/* Top Mitglieder */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" component="h2" fontWeight="bold" mb={2}>
                  🏆 Aktivste Mitglieder (diese Woche)
                </Typography>
                
                <List dense>
                  {stats?.most_active_members?.slice(0, 5).map((member, index) => (
                    <ListItem key={member.uuid} divider={index < 4}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {member.first_name[0]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={member.full_name}
                        secondary={`${member.booking_count} Buchungen`}
                      />
                    </ListItem>
                  )) || (
                    <Typography variant="body2" color="textSecondary">
                      Noch keine Aktivitäten diese Woche
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Aufgabenverteilung */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" component="h2" fontWeight="bold" mb={2}>
                  📊 Aufgabenverteilung heute
                </Typography>
                
                {stats?.task_distribution && Object.keys(stats.task_distribution).length > 0 ? (
                  <Stack spacing={1}>
                    {Object.entries(stats.task_distribution).map(([taskName, count]) => (
                      <Box key={taskName} display="flex" justifyContent="between" alignItems="center">
                        <Typography variant="body2">{taskName}</Typography>
                        <Chip label={count} size="small" variant="outlined" />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Keine Buchungen heute
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Kalender-Ansicht */}
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h2" fontWeight="bold" mb={2}>
            📅 Aufgaben-Kalender
          </Typography>
          <TaskScheduleCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </CardContent>
      </Card>
    </Container>
  )
}