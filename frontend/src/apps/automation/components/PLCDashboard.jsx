import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Switch, 
  FormControlLabel, Grid, Chip, IconButton,
  Alert, CircularProgress, Paper
} from '@mui/material'
import { 
  Refresh as RefreshIcon,
  PowerSettingsNew as PowerIcon,
  WbIncandescent as LightIcon
} from '@mui/icons-material'
import api from '@/utils/api'

export default function PLCDashboard() {
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})

  const loadOutputs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/automation/outputs/')
      setOutputs(response.data.results || response.data)
      setError(null)
    } catch (err) {
      setError('Fehler beim Laden der Ausgänge')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOutputs()
    // Auto-Refresh alle 5 Sekunden
    const interval = setInterval(loadOutputs, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = async (output) => {
    setUpdating({ ...updating, [output.id]: true })
    try {
      const response = await api.post(`/automation/outputs/${output.id}/toggle/`)
      if (response.data.success) {
        // Lokalen State aktualisieren
        setOutputs(outputs.map(o => 
          o.id === output.id 
            ? { ...o, current_state: response.data.current_state }
            : o
        ))
      }
    } catch (err) {
      setError('Fehler beim Schalten des Ausgangs')
    } finally {
      setUpdating({ ...updating, [output.id]: false })
    }
  }

  const refreshOutput = async (output) => {
    try {
      const response = await api.get(`/automation/outputs/${output.id}/read_state/`)
      if (response.data.success) {
        setOutputs(outputs.map(o => 
          o.id === output.id 
            ? { ...o, current_state: response.data.current_state }
            : o
        ))
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              SPS-Steuerung
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Siemens S7-1200 G2 Ausgänge verwalten
            </Typography>
          </Box>
          <Box>
            <IconButton 
              onClick={loadOutputs} 
              color="primary"
              size="large"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {outputs.map((output) => (
          <Grid item xs={12} sm={6} md={4} key={output.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LightIcon 
                      sx={{ 
                        color: output.current_state ? 'warning.main' : 'grey.400',
                        fontSize: 32
                      }} 
                    />
                    <Typography variant="h6">
                      {output.name}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => refreshOutput(output)}
                    disabled={updating[output.id]}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  Adresse: {output.address}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Gerät: {output.device_name}
                </Typography>

                {output.description && (
                  <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                    {output.description}
                  </Typography>
                )}

                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between"
                  sx={{ mt: 3 }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={output.current_state}
                        onChange={() => handleToggle(output)}
                        disabled={updating[output.id]}
                        color="primary"
                        size="large"
                      />
                    }
                    label={
                      <Typography variant="body1" fontWeight="bold">
                        {output.current_state ? "EIN" : "AUS"}
                      </Typography>
                    }
                  />

                  <Chip
                    icon={<PowerIcon />}
                    label={output.current_state ? "AKTIV" : "INAKTIV"}
                    color={output.current_state ? "success" : "default"}
                    variant={output.current_state ? "filled" : "outlined"}
                  />
                </Box>

                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ mt: 2, display: 'block' }}
                >
                  Zuletzt aktualisiert: {new Date(output.last_updated).toLocaleString('de-DE')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {outputs.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Keine SPS-Ausgänge konfiguriert
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Bitte fügen Sie über das Django Admin Interface Ausgänge hinzu
          </Typography>
        </Paper>
      )}
    </Box>
  )
}