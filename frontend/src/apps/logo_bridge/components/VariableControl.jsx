// frontend/src/apps/logo_bridge/components/VariableControl.jsx
import { useState } from 'react'
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Switch, Chip, Tooltip, Box, Typography,
  CircularProgress, Alert
} from '@mui/material'
import { 
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import api from '@/utils/api'

export default function VariableControl({ variables, deviceId, onUpdate }) {
  const [values, setValues] = useState({})
  const [editMode, setEditMode] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const readVariable = async (variable) => {
    setLoading({ ...loading, [variable.id]: true })
    setErrors({ ...errors, [variable.id]: null })
    
    try {
      const res = await api.get(`/logo-bridge/variables/${variable.id}/read/`)
      if (res.data.success) {
        setValues({ ...values, [variable.id]: res.data.value })
      }
    } catch (error) {
      console.error('Read failed:', error)
      setErrors({ ...errors, [variable.id]: 'Lesefehler' })
    } finally {
      setLoading({ ...loading, [variable.id]: false })
    }
  }

  const writeVariable = async (variable) => {
    setLoading({ ...loading, [variable.id]: true })
    setErrors({ ...errors, [variable.id]: null })
    
    try {
      const res = await api.post(`/logo-bridge/variables/${variable.id}/write/`, {
        value: values[variable.id]
      })
      if (res.data.success) {
        setEditMode({ ...editMode, [variable.id]: false })
        onUpdate()
      } else {
        setErrors({ ...errors, [variable.id]: res.data.error || 'Schreibfehler' })
      }
    } catch (error) {
      console.error('Write failed:', error)
      const errorMsg = error.response?.data?.error || 'Schreibfehler'
      setErrors({ ...errors, [variable.id]: errorMsg })
    } finally {
      setLoading({ ...loading, [variable.id]: false })
    }
  }

  const cancelEdit = (variableId) => {
    setEditMode({ ...editMode, [variableId]: false })
    setValues({ ...values, [variableId]: undefined })
    setErrors({ ...errors, [variableId]: null })
  }

  const getAccessModeColor = (mode) => {
    switch (mode) {
      case 'read': return 'default'
      case 'write': return 'warning'
      case 'read_write': return 'primary'
      default: return 'default'
    }
  }

  const getDataTypeColor = (type) => {
    switch (type) {
      case 'bool': return 'success'
      case 'int': return 'info'
      case 'float': return 'warning'
      case 'string': return 'secondary'
      default: return 'default'
    }
  }

  const renderControl = (variable) => {
    const isEditing = editMode[variable.id]
    const value = values[variable.id] ?? variable.last_value ?? ''
    const isLoading = loading[variable.id]
    const error = errors[variable.id]

    if (variable.data_type === 'bool' && variable.access_mode !== 'read') {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Switch
            checked={Boolean(value)}
            onChange={(e) => {
              setValues({ ...values, [variable.id]: e.target.checked })
              setErrors({ ...errors, [variable.id]: null })
              // Auto-write für Bool
              api.post(`/logo-bridge/variables/${variable.id}/write/`, {
                value: e.target.checked
              }).then(() => onUpdate()).catch(() => {
                setErrors({ ...errors, [variable.id]: 'Schreibfehler' })
              })
            }}
            disabled={isLoading}
            size="small"
          />
          {isLoading && <CircularProgress size={16} />}
        </Box>
      )
    }

    if (isEditing && variable.access_mode !== 'read') {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            size="small"
            type={variable.data_type === 'float' || variable.data_type === 'int' ? 'number' : 'text'}
            value={value}
            onChange={(e) => {
              setValues({ ...values, [variable.id]: e.target.value })
              setErrors({ ...errors, [variable.id]: null })
            }}
            error={Boolean(error)}
            helperText={error}
            inputProps={{
              step: variable.data_type === 'float' ? 0.1 : 1,
              min: variable.min_value,
              max: variable.max_value
            }}
            sx={{ width: 120 }}
          />
          <IconButton 
            size="small" 
            onClick={() => writeVariable(variable)}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? <CircularProgress size={16} /> : <CheckIcon />}
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => cancelEdit(variable.id)}
            disabled={isLoading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          {value !== undefined && value !== null && value !== '' ? (
            <strong>{value}</strong>
          ) : (
            <span style={{ color: 'text.secondary' }}>-</span>
          )}
          {variable.unit && ` ${variable.unit}`}
        </Typography>
        {variable.access_mode !== 'read' && (
          <IconButton 
            size="small" 
            onClick={() => setEditMode({ ...editMode, [variable.id]: true })}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>
    )
  }

  if (variables.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          Keine Variablen konfiguriert
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Adresse</TableCell>
            <TableCell>Typ</TableCell>
            <TableCell>Wert</TableCell>
            <TableCell>Zugriff</TableCell>
            <TableCell align="center" width={60}>Aktion</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variables.map((variable) => (
            <TableRow key={variable.id} hover>
              <TableCell>
                <Tooltip title={variable.description || variable.name}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {variable.name}
                  </Typography>
                </Tooltip>
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
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </TableCell>
              <TableCell>{renderControl(variable)}</TableCell>
              <TableCell>
                <Chip
                  label={variable.access_mode.replace('_', '/')}
                  size="small"
                  color={getAccessModeColor(variable.access_mode)}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </TableCell>
              <TableCell align="center">
                <IconButton 
                  size="small" 
                  onClick={() => readVariable(variable)}
                  disabled={loading[variable.id]}
                >
                  {loading[variable.id] ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}