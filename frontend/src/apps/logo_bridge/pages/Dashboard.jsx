// frontend/src/apps/logo_bridge/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { 
  Container, Grid, Typography, Paper, Box, Button,
  Chip, IconButton, Tooltip, Alert, CircularProgress
} from '@mui/material'
import { 
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Build as BuildIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'
import DeviceCard from '../components/DeviceCard'
import VariableControl from '../components/VariableControl'
import ActivityLog from '../components/ActivityLog'
import TestPanel from '../components/TestPanel'

export default function LogoBridgeDashboard() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [variables, setVariables] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [testMode, setTestMode] = useState(false)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDevices()
    loadLogs()
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      loadVariables(selectedDevice.id)
    }
  }, [selectedDevice])

  const loadDevices = async () => {
    try {
      setError(null)
      const res = await api.get('/logo-bridge/devices/')
      const deviceList = res.data.results || res.data
      setDevices(deviceList)
      
      // Wenn noch kein Gerät ausgewählt ist, wähle das erste
      if (deviceList.length > 0 && !selectedDevice) {
        // Hole Status für jedes Gerät
        const devicesWithStatus = await Promise.all(
          deviceList.map(async (device) => {
            try {
              const statusRes = await api.get(`/logo-bridge/devices/${device.id}/status/`)
              return { ...device, ...statusRes.data }
            } catch {
              return device
            }
          })
        )
        setDevices(devicesWithStatus)
        setSelectedDevice(devicesWithStatus[0])
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
      setError('Fehler beim Laden der Geräte')
    } finally {
      setLoading(false)
    }
  }

  const loadVariables = async (deviceId) => {
    try {
      const res = await api.get(`/logo-bridge/variables/?device=${deviceId}`)
      setVariables(res.data.results || res.data)
    } catch (error) {
      console.error('Failed to load variables:', error)
      setError('Fehler beim Laden der Variablen')
    }
  }

  const loadLogs = async () => {
    try {
      const res = await api.get('/logo-bridge/logs/')
      setLogs(res.data.results || res.data)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const testConnection = async (device) => {
    try {
      setRefreshing(true)
      const res = await api.post(`/logo-bridge/devices/${device.id}/test_connection/`)
      if (res.data.success) {
        // Erfolg-Feedback
        await loadDevices()
        setError(null)
      } else {
        setError(res.data.error || 'Verbindungstest fehlgeschlagen')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setError('Verbindungstest fehlgeschlagen')
    } finally {
      setRefreshing(false)
    }
  }

  const disconnectDevice = async (device) => {
    try {
      const res = await api.post(`/logo-bridge/devices/${device.id}/disconnect/`)
      if (res.data.success) {
        await loadDevices()
      }
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadDevices(), loadLogs()])
    if (selectedDevice) {
      await loadVariables(selectedDevice.id)
    }
    setRefreshing(false)
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Logo Bridge Control Center
        </Typography>
        <Box display="flex" gap={2}>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant={testMode ? "contained" : "outlined"}
            startIcon={<BuildIcon />}
            onClick={() => setTestMode(!testMode)}
          >
            {testMode ? 'Dashboard' : 'Test Mode'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/logo-bridge/devices/new')}
          >
            Neues Gerät
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {testMode ? (
        <TestPanel 
          devices={devices} 
          onRefresh={loadDevices}
        />
      ) : (
        <Grid container spacing={3}>
          {/* Geräte-Übersicht */}
          <Grid size={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Verbundene Logo-Geräte ({devices.length})
                </Typography>
              </Box>
              
              {devices.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary" gutterBottom>
                    Keine Logo-Geräte konfiguriert
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/logo-bridge/devices/new')}
                    sx={{ mt: 2 }}
                  >
                    Erstes Gerät hinzufügen
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {devices.map((device) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={device.id}>
                      <DeviceCard
                        device={device}
                        selected={selectedDevice?.id === device.id}
                        onSelect={() => setSelectedDevice(device)}
                        onTest={() => testConnection(device)}
                        onDisconnect={() => disconnectDevice(device)}
                        onEdit={() => navigate(`/logo-bridge/devices/${device.id}/edit`)}
                        onManageVariables={() => navigate(`/logo-bridge/devices/${device.id}/variables`)}
                        onManageCommands={() => navigate(`/logo-bridge/devices/${device.id}/commands`)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Variablen-Steuerung */}
          {selectedDevice && variables.length > 0 && (
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Variablen - {selectedDevice.name}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate(`/logo-bridge/devices/${selectedDevice.id}/variables`)}
                  >
                    Verwalten
                  </Button>
                </Box>
                <VariableControl
                  variables={variables}
                  deviceId={selectedDevice.id}
                  onUpdate={() => {
                    loadLogs()
                    loadVariables(selectedDevice.id)
                  }}
                />
              </Paper>
            </Grid>
          )}

          {/* Aktivitäts-Log */}
          <Grid size={{ xs: 12, lg: selectedDevice && variables.length > 0 ? 4 : 12 }}>
            <Paper sx={{ p: 2, height: 600, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Aktivitäts-Log
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <ActivityLog logs={logs} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}