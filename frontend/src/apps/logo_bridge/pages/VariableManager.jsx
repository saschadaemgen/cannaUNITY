// frontend/src/apps/logo_bridge/pages/VariableManager.jsx
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
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import api from '@/utils/api'
import VariableForm from '../components/VariableForm'

export default function VariableManager() {
  const { id: deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    loadData()
  }, [deviceId])

  const loadData = async () => {
    try {
      const [deviceRes, variablesRes] = await Promise.all([
        api.get(`/logo-bridge/devices/${deviceId}/`),
        api.get(`/logo-bridge/variables/?device=${deviceId}`)
      ])
      setDevice(deviceRes.data)
      setVariables(variablesRes.data.results || variablesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedVariable(null)
    setFormOpen(true)
  }

  const handleEdit = (variable) => {
    setSelectedVariable(variable)
    setFormOpen(true)
  }

  const handleCopy = (variable) => {
    const newVariable = {
      ...variable,
      name: `${variable.name}_copy`,
      id: null
    }
    setSelectedVariable(newVariable)
    setFormOpen(true)
  }

  const handleDelete = async (variableId) => {
    if (!window.confirm('Diese Variable wirklich löschen?')) {
      return
    }

    try {
      await api.delete(`/logo-bridge/variables/${variableId}/`)
      await loadData()
    } catch (error) {
      console.error('Failed to delete variable:', error)
      setError('Fehler beim Löschen der Variable')
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedVariable(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    loadData()
  }

  const getDataTypeColor = (type) => {
    const colors = {
      bool: 'success',
      int: 'info',
      float: 'warning',
      string: 'secondary'
    }
    return colors[type] || 'default'
  }

  const getAccessModeColor = (mode) => {
    const colors = {
      read: 'default',
      write: 'warning',
      read_write: 'primary'
    }
    return colors[mode] || 'default'
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
                Variablen verwalten
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
            Neue Variable
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {variables.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Noch keine Variablen definiert
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Definieren Sie Variablen, um auf Logo-Register zuzugreifen
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Erste Variable erstellen
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Beschreibung</TableCell>
                  <TableCell>Adresse</TableCell>
                  <TableCell>Datentyp</TableCell>
                  <TableCell>Zugriff</TableCell>
                  <TableCell>Einheit</TableCell>
                  <TableCell>Bereich</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variables.map((variable) => (
                  <TableRow key={variable.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {variable.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {variable.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {variable.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={variable.data_type}
                        size="small"
                        color={getDataTypeColor(variable.data_type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={variable.access_mode.replace('_', '/')}
                        size="small"
                        color={getAccessModeColor(variable.access_mode)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {variable.unit || '-'}
                    </TableCell>
                    <TableCell>
                      {variable.min_value !== null || variable.max_value !== null ? (
                        <Typography variant="caption">
                          {variable.min_value ?? '*'} - {variable.max_value ?? '*'}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <Tooltip title="Kopieren">
                          <IconButton size="small" onClick={() => handleCopy(variable)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Bearbeiten">
                          <IconButton size="small" onClick={() => handleEdit(variable)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(variable.id)}
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
        <VariableForm
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          deviceId={deviceId}
          device={device}
          initialData={selectedVariable}
        />
      )}
    </Container>
  )
}