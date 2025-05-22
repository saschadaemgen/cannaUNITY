// frontend/src/apps/taskmanager/utils/helpers.js

import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

/**
 * Formatiert ein Zeitstring (HH:MM:SS) zu HH:MM
 */
export const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.slice(0, 5)
}

/**
 * Formatiert ein Datum zur deutschen Anzeige
 */
export const formatDate = (dateString, formatString = 'dd.MM.yyyy') => {
  if (!dateString) return ''
  try {
    return format(parseISO(`${dateString}T00:00:00`), formatString, { locale: de })
  } catch {
    return dateString
  }
}

/**
 * Formatiert Datum und Zeit zusammen
 */
export const formatDateTime = (dateString, timeString, formatString = 'dd.MM.yyyy HH:mm') => {
  if (!dateString || !timeString) return ''
  try {
    const dateTime = new Date(`${dateString}T${timeString}`)
    return format(dateTime, formatString, { locale: de })
  } catch {
    return `${dateString} ${timeString}`
  }
}

/**
 * Gibt die passende Farbe für Schwierigkeitsgrade zurück
 */
export const getDifficultyColor = (difficulty) => {
  const colors = {
    'leicht': 'success',
    'mittel': 'warning',
    'anspruchsvoll': 'error'
  }
  return colors[difficulty] || 'default'
}

/**
 * Gibt die passende Hex-Farbe für Schwierigkeitsgrade zurück
 */
export const getDifficultyHexColor = (difficulty) => {
  const colors = {
    'leicht': '#4CAF50',
    'mittel': '#FF9800',
    'anspruchsvoll': '#F44336'
  }
  return colors[difficulty] || '#9E9E9E'
}

/**
 * Gibt die passende Farbe für Status zurück
 */
export const getStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'confirmed': 'success',
    'cancelled': 'error',
    'completed': 'info',
    'no_show': 'error'
  }
  return colors[status] || 'default'
}

/**
 * Status-Labels für Buchungen
 */
export const getStatusLabel = (status) => {
  const labels = {
    'pending': 'Ausstehend',
    'confirmed': 'Bestätigt',
    'cancelled': 'Storniert',
    'completed': 'Abgeschlossen',
    'no_show': 'Nicht erschienen'
  }
  return labels[status] || status
}

/**
 * Berechnet die Farbe basierend auf Auslastungsprozent
 */
export const getUtilizationColor = (percentage) => {
  if (percentage >= 80) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

/**
 * Generiert eine zufällige ID für temporäre Verwendung
 */
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Prüft ob ein Datum in der Vergangenheit liegt
 */
export const isPastDate = (dateString, timeString = null) => {
  try {
    const now = new Date()
    if (timeString) {
      const dateTime = new Date(`${dateString}T${timeString}`)
      return dateTime < now
    } else {
      const date = new Date(`${dateString}T23:59:59`)
      return date < now
    }
  } catch {
    return false
  }
}

/**
 * Berechnet die Anzahl verfügbarer Slots für einen Schedule
 */
export const calculateAvailableSlots = (schedule) => {
  if (!schedule) return 0
  return (schedule.max_slots || 0) - (schedule.booked_slots_count || 0)
}

/**
 * Sortiert Schedules nach Datum und Zeit
 */
export const sortSchedulesByDateTime = (schedules) => {
  return [...schedules].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`)
    const dateB = new Date(`${b.date}T${b.start_time}`)
    return dateA - dateB
  })
}

/**
 * Gruppiert Schedules nach Datum
 */
export const groupSchedulesByDate = (schedules) => {
  return schedules.reduce((groups, schedule) => {
    const date = schedule.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(schedule)
    return groups
  }, {})
}

/**
 * Validiert Zeitangaben (start_time < end_time)
 */
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false
  return startTime < endTime
}

/**
 * Berechnet die Anzahl Stunden zwischen zwei Zeiten
 */
export const calculateHoursBetween = (startTime, endTime) => {
  try {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    return Math.max(0, (end - start) / (1000 * 60 * 60))
  } catch {
    return 0
  }
}

/**
 * Erstellt eine Liste von Zeitslots basierend auf Start-, Endzeit
 */
export const generateTimeSlots = (startTime, endTime, slotDurationMinutes = 60) => {
  const slots = []
  try {
    let current = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    while (current < end) {
      const slotStart = format(current, 'HH:mm')
      current = new Date(current.getTime() + slotDurationMinutes * 60000)
      const slotEnd = current <= end ? format(current, 'HH:mm') : endTime
      
      slots.push({
        start_time: slotStart,
        end_time: slotEnd
      })
      
      if (slotEnd === endTime) break
    }
  } catch (error) {
    console.error('Error generating time slots:', error)
  }
  
  return slots
}