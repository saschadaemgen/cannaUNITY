// frontend/src/apps/taskmanager/components/TaskCard.jsx

import {
  Card, CardContent, Typography, Box, Chip, Avatar,
  LinearProgress, IconButton, Stack, Tooltip
} from '@mui/material'
import {
  Assignment, Room, AccessTime, Person, Visibility,
  Edit, Delete, ContentCopy
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export default function TaskCard({ 
  schedule, 
  onView, 
  onEdit, 
  onDelete, 
  onDuplicate,
  showActions = true 
}) {
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

  const getUtilizationColor = (percentage) => {
    if (percentage >= 80) return 'success'
    if (percentage >= 50) return 'warning'
    return 'error'
  }

  return (
    <Card 
      elevation={2}
      sx={{
        border: `2px solid ${schedule.task_type_details?.color || '#ccc'}20`,
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ 
                bgcolor: schedule.task_type_details?.color || 'primary.main',
                width: 40,
                height: 40
              }}
            >
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {schedule.task_type_details?.name || 'Unbekannte Aufgabe'}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={schedule.task_type_details?.difficulty_display || 'Unbekannt'}
                  color={getDifficultyColor(schedule.task_type_details?.difficulty)}
                  size="small"
                />
                <Typography variant="body2" color="textSecondary">
                  {format(parseISO(`${schedule.date}T00:00:00`), 'dd. MMM yyyy', { locale: de })}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          {showActions && (
            <Stack direction="row" spacing={0.5}>
              {onView && (
                <Tooltip title="Anzeigen">
                  <IconButton size="small" onClick={() => onView(schedule)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Bearbeiten">
                  <IconButton size="small" onClick={() => onEdit(schedule)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {onDuplicate && (
                <Tooltip title="Duplizieren">
                  <IconButton size="small" onClick={() => onDuplicate(schedule)}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Löschen">
                  <IconButton size="small" color="error" onClick={() => onDelete(schedule)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        {/* Details */}
        <Stack spacing={1.5}>
          {/* Zeit und Raum */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Room fontSize="small" color="action" />
              <Typography variant="body2">
                {schedule.room_details?.name || 'Unbekannter Raum'}
              </Typography>
            </Box>
          </Box>

          {/* Auslastung */}
          <Box>
            <Box display="flex" justifyContent="between" alignItems="center" mb={0.5}>
              <Typography variant="body2" color="textSecondary">
                Auslastung
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {schedule.booked_slots_count || 0}/{schedule.max_slots || 0} Slots
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={schedule.utilization_percentage || 0}
              color={getUtilizationColor(schedule.utilization_percentage || 0)}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Box display="flex" justifyContent="between" alignItems="center" mt={0.5}>
              <Typography variant="caption" color="textSecondary">
                {schedule.utilization_percentage?.toFixed(1) || 0}% gebucht
              </Typography>
              <Typography variant="caption" color="success.main">
                {schedule.available_slots_count || 0} frei
              </Typography>
            </Box>
          </Box>

          {/* Teilnehmer Info */}
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              Max. {schedule.max_participants_per_slot || 1} Teilnehmer pro Slot
            </Typography>
          </Box>

          {/* Notizen */}
          {schedule.notes && (
            <Box 
              sx={{ 
                bgcolor: 'grey.50', 
                borderRadius: 1, 
                p: 1,
                borderLeft: '3px solid',
                borderLeftColor: 'info.main'
              }}
            >
              <Typography variant="body2" color="textSecondary" fontStyle="italic">
                💭 {schedule.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}