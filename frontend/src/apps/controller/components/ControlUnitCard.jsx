// frontend/src/apps/controller/components/ControlUnitCard.jsx

import { useState } from 'react'
import {
  Card, CardContent, CardActions, Typography, Chip, Box,
  Button, IconButton, Tooltip, LinearProgress
} from '@mui/material'
import {
  PowerSettingsNew, Settings, Schedule, Send,
  Error, CheckCircle, Warning
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'

export default function ControlUnitCard({ unit, onStatusChange }) {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)

  const getStatusIcon = () => {
    switch (unit.status) {
      case 'active':
        return <CheckCircle color="success" />
      case 'error':
        return <Error color="error" />
      case 'maintenance':
        return <Warning color="warning" />
      default:
        return <PowerSettingsNew color="disabled" />
    }
  }

  const getTypeColor = () => {
    const colors = {
      lighting: 'warning',
      climate: 'info',
      watering: 'primary',
      co2: 'secondary',
      humidity: 'default',
    }
    return colors[unit.unit_type] || 'default'
  }

  const handleSendToPlc = async () => {
    setSending(true)
    try {
      const response = await api.post(`/controller/units/${unit.id}/send_to_plc/`, {
        command_type: 'update_config',
        parameters: {}
      })
      
      onStatusChange?.()
      // Erfolgs-Feedback
    } catch (error) {
      console.error('Fehler beim Senden:', error)
      // Error-Feedback
    } finally {
      setSending(false)
    }
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {unit.name}
          </Typography>
          <Tooltip title={unit.status_display}>
            {getStatusIcon()}
          </Tooltip>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip 
            label={unit.unit_type_display} 
            size="small" 
            color={getTypeColor()}
          />
          <Chip 
            label={unit.room_name} 
            size="small" 
            variant="outlined"
          />
        </Box>

        {unit.current_status && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Aktueller Wert: {unit.current_status.current_value || '-'}
              {unit.parameters.find(p => p.key === 'unit')?.value || ''}
            </Typography>
            {unit.current_status.secondary_value && (
              <Typography variant="body2" color="text.secondary">
                Sekundärwert: {unit.current_status.secondary_value}
              </Typography>
            )}
          </Box>
        )}

        {sending && <LinearProgress sx={{ mt: 2 }} />}
      </CardContent>

      <CardActions>
        <Button 
          size="small" 
          startIcon={<Settings />}
          onClick={() => navigate(`/controller/units/${unit.id}/edit`)}
        >
          Konfigurieren
        </Button>
        <Button 
          size="small" 
          startIcon={<Schedule />}
          onClick={() => navigate(`/controller/units/${unit.id}/schedule`)}
        >
          Zeitplan
        </Button>
        <IconButton 
          size="small" 
          color="primary"
          onClick={handleSendToPlc}
          disabled={sending || unit.status !== 'active'}
        >
          <Send />
        </IconButton>
      </CardActions>
    </Card>
  )
}