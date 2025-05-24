// frontend/src/apps/logo_bridge/pages/CommandManager.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Paper, Typography, Button, Box, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Divider, Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material'
import api from '@/utils/api'
import CommandForm from '../components/CommandForm'

export default function CommandManager() {
  const { id: deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [commands, setCommands] = useState([])
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState(null)
  const [executing, setExecuting] = useState({})

  useEffect(() => {
    loadData()
  }, [deviceId])

  const loadData = async () => {
    try {
      const [deviceRes, commandsRes, variablesRes] = await Promise.all([
        api.get(`/logo-bridge/devices/${deviceId}/`),
        api.get(`/logo-bridge/commands/?device=${deviceId}`),
        api.get(`/logo-bridge/variables/?device=${deviceId}`)
      ])
      setDevice(deviceRes.data)
      setCommands(commandsRes.data.results || commandsRes.data)
      setVariables(variablesRes.data.results || variablesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedCommand(null)
    setFormOpen(true)
  }

  const handleEdit = (command) => {
    setSelectedCommand(command)
    setFormOpen(true)
  }

  const handleDelete = async (commandId) => {
    if (!window.confirm('Diesen Befehl wirklich löschen?')) {
      return
    }

    try {
      await api.delete(`/logo-bridge/commands/${commandId}/`)
      await loadData()
    } catch (error) {
      console.error('Failed to delete command:', error)
      setError('Fehler beim Löschen des Befehls')
    }
  }

  const handleExecute = async (command) => {
    setExecuting({ ...executing, [command.id]: true })
    
    try {
      // Für Single-Commands: Wert abfragen
      let parameters = {}
      if (command.command_type === 'single') {
        const value = prompt(`Wert für "${command.name}" eingeben:`)
        if (value === null) {
          setExecuting({ ...executing, [command.id]: false })
          return
        }
        parameters = { value }
      }
      
      const res = await api.post(`/logo-bridge/commands/${command.id}/execute/`, {
        parameters
      })
      
      if (res.data.success) {
        setError(null)
        // Erfolgs-Feedback könnte hier ergänzt werden
      } else {
        setError(res.data.error || 'Befehl fehlgeschlagen')
      }
    } catch (error) {
      console.error('Failed to execute command:', error)
      setError(error.response?.data?.error || 'Fehler beim Ausführen des Befehls')
    } finally {
      setExecuting({ ...executing, [command.id]: false })
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedCommand(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    loadData()
  }

  const getCommandTypeLabel = (type) => {
    const labels = {
      single: 'Einzelwert',
      sequence: 'Sequenz',
      script: 'Skript'
    }
    return labels[type] || type
  }

  const getCommandTypeColor = (type) => {
    const colors = {
      single: 'primary',
      sequence: 'secondary',
      script: 'warning'
    }
    return colors[type] || 'default'
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!device) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Gerät nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/logo-bridge')}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5">
                Befehle verwalten
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {device.name} ({device.ip_address})
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Neuer Befehl
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {commands.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Noch keine Befehle definiert
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Erstellen Sie Befehle für häufig verwendete Operationen
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Ersten Befehl erstellen
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Beschreibung</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Variablen</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commands.map((command) => (
                  <TableRow key={command.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {command.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                        {command.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCommandTypeLabel(command.command_type)}
                        size="small"
                        color={getCommandTypeColor(command.command_type)}
                      />
                    </TableCell>
                    <TableCell>
                      {command.variables?.length > 0 ? (
                        <Box>
                          {command.variables.slice(0, 3).map((v, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              {v.name}
                            </Typography>
                          ))}
                          {command.variables.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{command.variables.length - 3} weitere
                            </Typography>
                          )}
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="Ausführen">
                          <IconButton 
                            size="small" 
                            onClick={() => handleExecute(command)}
                            color="primary"
                            disabled={executing[command.id]}
                          >
                            {executing[command.id] ? (
                              <CircularProgress size={16} />
                            ) : (
                              <PlayIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Bearbeiten">
                          <IconButton size="small" onClick={() => handleEdit(command)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(command.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {formOpen && (
        <CommandForm
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          deviceId={deviceId}
          variables={variables}
          initialData={selectedCommand}
        />
      )}
    </Container>
  )
}