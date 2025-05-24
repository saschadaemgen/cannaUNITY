// frontend/src/apps/logo_bridge/components/TestPanel.jsx
import { useState } from 'react'
import { 
  Grid, Paper, Typography, TextField, Button, Box,
  Select, MenuItem, FormControl, InputLabel, Alert,
  Divider, List, ListItem, ListItemText, Chip,
  FormHelperText
} from '@mui/material'
import { PlayArrow as PlayIcon } from '@mui/icons-material'
import api from '@/utils/api'

export default function TestPanel({ devices, onRefresh }) {
  const [selectedDevice, setSelectedDevice] = useState('')
  const [testType, setTestType] = useState('read')
  const [address, setAddress] = useState('')
  const [dataType, setDataType] = useState('int')
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const addressExamples = {
    modbus_tcp: {
      bool: 'Beispiele: 00001, 10001, M0.0',
      int: 'Beispiele: 40001, 30001, MW0',
      float: 'Beispiele: 40001, MD0'
    },
    s7: {
      bool: 'Beispiele: M0.0, I0.0, Q0.0',
      int: 'Beispiele: MW0, IW0, QW0, VW0',
      float: 'Beispiele: MD0, VD0'
    }
  }

  const runTest = async () => {
    setError(null)
    
    if (!selectedDevice) {
      setError('Bitte wählen Sie ein Gerät aus')
      return
    }

    if ((testType === 'read' || testType === 'write') && !address) {
      setError('Bitte geben Sie eine Adresse ein')
      return
    }

    if (testType === 'write' && !value) {
      setError('Bitte geben Sie einen Wert ein')
      return
    }

    setLoading(true)
    const timestamp = new Date().toLocaleTimeString('de-DE')
    let result = { timestamp, type: testType, success: false }

    try {
      const device = devices.find(d => d.id === selectedDevice)
      
      if (testType === 'connection') {
        const res = await api.post(`/logo-bridge/devices/${selectedDevice}/test_connection/`)
        result.success = res.data.success
        result.message = res.data.message || res.data.error
        result.device = device?.name
        
      } else if (testType === 'read') {
        // Erstelle temporäre Variable für Test
        const testVar = {
          device: selectedDevice,
          name: `Test_${Date.now()}`,
          address: address,
          data_type: dataType,
          access_mode: 'read_write',
          description: 'Temporäre Test-Variable'
        }
        
        // Variable erstellen
        const createRes = await api.post('/logo-bridge/variables/', testVar)
        const variableId = createRes.data.id
        
        try {
          // Variable lesen
          const readRes = await api.get(`/logo-bridge/variables/${variableId}/read/`)
          result.success = readRes.data.success
          result.address = address
          result.dataType = dataType
          result.value = readRes.data.value
          result.device = device?.name
        } finally {
          // Variable wieder löschen
          await api.delete(`/logo-bridge/variables/${variableId}/`)
        }
        
      } else if (testType === 'write') {
        // Erstelle temporäre Variable für Test
        const testVar = {
          device: selectedDevice,
          name: `Test_${Date.now()}`,
          address: address,
          data_type: dataType,
          access_mode: 'read_write',
          description: 'Temporäre Test-Variable'
        }
        
        // Variable erstellen
        const createRes = await api.post('/logo-bridge/variables/', testVar)
        const variableId = createRes.data.id
        
        try {
          // Variable schreiben
          const writeRes = await api.post(`/logo-bridge/variables/${variableId}/write/`, {
            value: value
          })
          result.success = writeRes.data.success
          result.address = address
          result.dataType = dataType
          result.value = value
          result.device = device?.name
          result.message = writeRes.data.success ? 'Wert erfolgreich geschrieben' : 'Schreibvorgang fehlgeschlagen'
        } finally {
          // Variable wieder löschen
          await api.delete(`/logo-bridge/variables/${variableId}/`)
        }
      }

      setResults([result, ...results.slice(0, 19)]) // Maximal 20 Ergebnisse
      
    } catch (error) {
      console.error('Test error:', error)
      result.success = false
      result.error = error.response?.data?.error || error.message || 'Test fehlgeschlagen'
      setResults([result, ...results.slice(0, 19)])
      setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedDeviceProtocol = () => {
    const device = devices.find(d => d.id === selectedDevice)
    return device?.protocol || 'modbus_tcp'
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test-Konfiguration
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Gerät</InputLabel>
            <Select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              label="Gerät"
            >
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name} ({device.ip_address}) - {device.protocol.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Test-Typ</InputLabel>
            <Select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              label="Test-Typ"
            >
              <MenuItem value="connection">Verbindungstest</MenuItem>
              <MenuItem value="read">Variable lesen</MenuItem>
              <MenuItem value="write">Variable schreiben</MenuItem>
            </Select>
          </FormControl>

          {(testType === 'read' || testType === 'write') && (
            <>
              <TextField
                fullWidth
                label="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="z.B. 40001, M0.0, MW100"
                sx={{ mb: 2 }}
                helperText={
                  selectedDevice && addressExamples[getSelectedDeviceProtocol()]?.[dataType]
                }
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Datentyp</InputLabel>
                <Select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  label="Datentyp"
                >
                  <MenuItem value="bool">Boolean</MenuItem>
                  <MenuItem value="int">Integer</MenuItem>
                  <MenuItem value="float">Float</MenuItem>
                </Select>
              </FormControl>

              {testType === 'write' && (
                <TextField
                  fullWidth
                  label="Wert"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  sx={{ mb: 2 }}
                  type={dataType !== 'bool' ? 'text' : undefined}
                  helperText={
                    dataType === 'bool' 
                      ? 'Werte: true, false, 1, 0' 
                      : dataType === 'float'
                      ? 'Dezimalzahl (z.B. 12.34)'
                      : 'Ganzzahl (z.B. 42)'
                  }
                />
              )}
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runTest}
            size="large"
            disabled={loading}
          >
            {loading ? 'Test läuft...' : 'Test ausführen'}
          </Button>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Test-Ergebnisse
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {results.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Noch keine Tests ausgeführt
              </Typography>
            </Box>
          ) : (
            <List>
              {results.map((result, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={result.type}
                            size="small"
                            color={result.success ? 'success' : 'error'}
                          />
                          {result.device && (
                            <Typography variant="body2">
                              {result.device}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {result.timestamp}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {result.message && (
                          <Typography variant="body2">{result.message}</Typography>
                        )}
                        {result.address && (
                          <Typography variant="body2">
                            Adresse: {result.address} | Typ: {result.dataType}
                            {result.value !== undefined && ` | Wert: ${result.value}`}
                          </Typography>
                        )}
                        {result.error && (
                          <Typography variant="body2" color="error">
                            Fehler: {result.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
}