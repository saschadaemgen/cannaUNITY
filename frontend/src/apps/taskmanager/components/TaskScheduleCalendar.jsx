// frontend/src/apps/taskmanager/components/TaskScheduleCalendar.jsx

import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, IconButton, Grid, Chip, Avatar,
  Tooltip, Stack, Button, Card, CardContent, Alert
} from '@mui/material'
import {
  ChevronLeft, ChevronRight, Today, Assignment,
  Room, AccessTime, Person
} from '@mui/icons-material'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, parseISO
} from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'

export default function TaskScheduleCalendar({ selectedDate, onDateChange }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSchedulesForMonth()
  }, [currentMonth])

  const loadSchedulesForMonth = async () => {
    try {
      setLoading(true)
      
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      
      const response = await api.get('/taskmanager/schedules/', {
        params: {
          start_date: format(monthStart, 'yyyy-MM-dd'),
          end_date: format(monthEnd, 'yyyy-MM-dd')
        }
      })
      
      setSchedules(response.data.results || response.data)
      
    } catch (err) {
      console.error('Error loading schedules:', err)
      setError('Fehler beim Laden der Aufgaben')
    } finally {
      setLoading(false)
    }
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    if (onDateChange) {
      onDateChange(today)
    }
  }

  const handleDateClick = (date) => {
    if (onDateChange) {
      onDateChange(date)
    }
  }

  const getSchedulesForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return schedules.filter(schedule => schedule.date === dateString)
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'leicht': '#4CAF50',
      'mittel': '#FF9800',
      'anspruchsvoll': '#F44336'
    }
    return colors[difficulty] || '#9E9E9E'
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { locale: de })
  const endDate = endOfWeek(monthEnd, { locale: de })

  const dateFormat = "d"
  const rows = []
  let days = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const daySchedules = getSchedulesForDate(day)
      
      days.push(
        <Grid item xs key={day.toString()}>
          <Paper
            elevation={isToday(day) ? 3 : 1}
            sx={{
              minHeight: 120,
              p: 1,
              cursor: 'pointer',
              border: selectedDate && isSameDay(day, selectedDate) ? 2 : 0,
              borderColor: 'primary.main',
              backgroundColor: 
                !isSameMonth(day, monthStart) ? 'grey.100' :
                isToday(day) ? 'primary.50' : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => handleDateClick(cloneDay)}
          >
            <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
              <Typography 
                variant="body2" 
                fontWeight={isToday(day) ? 'bold' : 'normal'}
                color={!isSameMonth(day, monthStart) ? 'text.disabled' : 'text.primary'}
              >
                {format(day, dateFormat)}
              </Typography>
              {daySchedules.length > 0 && (
                <Chip 
                  label={daySchedules.length} 
                  size="small" 
                  color="primary"
                  sx={{ height: 18, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Stack spacing={0.5}>
              {daySchedules.slice(0, 3).map((schedule) => (
                <Tooltip
                  key={schedule.id}
                  title={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {schedule.task_type_details.name}
                      </Typography>
                      <Typography variant="body2">
                        📍 {schedule.room_details.name}
                      </Typography>
                      <Typography variant="body2">
                        🕐 {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </Typography>
                      <Typography variant="body2">
                        👥 {schedule.booked_slots_count}/{schedule.max_slots} gebucht
                      </Typography>
                    </Box>
                  }
                >
                  <Box
                    sx={{
                      backgroundColor: getDifficultyColor(schedule.task_type_details.difficulty) + '20',
                      border: `1px solid ${getDifficultyColor(schedule.task_type_details.difficulty)}`,
                      borderRadius: 1,
                      p: 0.5,
                      cursor: 'pointer'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        color: getDifficultyColor(schedule.task_type_details.difficulty),
                        lineHeight: 1,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {schedule.task_type_details.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.55rem',
                        color: 'text.secondary',
                        lineHeight: 1
                      }}
                    >
                      {schedule.start_time.slice(0, 5)}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
              
              {daySchedules.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  +{daySchedules.length - 3} weitere
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      )
      
      day = addDays(day, 1)
    }
    
    rows.push(
      <Grid container spacing={1} key={day.toString()}>
        {days}
      </Grid>
    )
    days = []
  }

  return (
    <Box>
      {/* Calendar Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={prevMonth} color="primary">
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="h5" fontWeight="bold" minWidth="200px" textAlign="center">
            {format(currentMonth, 'MMMM yyyy', { locale: de })}
          </Typography>
          
          <IconButton onClick={nextMonth} color="primary">
            <ChevronRight />
          </IconButton>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<Today />}
          onClick={goToToday}
          size="small"
        >
          Heute
        </Button>
      </Box>

      {/* Weekday Headers */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <Grid item xs key={day}>
            <Typography 
              variant="body2" 
              fontWeight="bold" 
              textAlign="center"
              color="text.secondary"
              sx={{ py: 1 }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Calendar Grid */}
      <Stack spacing={1}>
        {rows}
      </Stack>

      {/* Loading Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Lade Aufgaben...
          </Typography>
        </Box>
      )}

      {/* Legend */}
      <Card elevation={1} sx={{ mt: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            🎨 Legende
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: '#4CAF50', 
                  borderRadius: 1 
                }} 
              />
              <Typography variant="body2">Leicht</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: '#FF9800', 
                  borderRadius: 1 
                }} 
              />
              <Typography variant="body2">Mittel</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: '#F44336', 
                  borderRadius: 1 
                }} 
              />
              <Typography variant="body2">Anspruchsvoll</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}