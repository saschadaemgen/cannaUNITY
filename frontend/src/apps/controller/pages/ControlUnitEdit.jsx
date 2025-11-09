// frontend/src/apps/controller/pages/ControlUnitEdit.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Paper, Typography, TextField, Button, Box,
  FormControl, InputLabel, Select, MenuItem, Grid,
  CircularProgress, Alert, Divider, InputAdornment,
  IconButton, Tooltip
} from '@mui/material'
import { Save, Cancel, Settings, Visibility, VisibilityOff, Info } from '@mui/icons-material'
import api from '@/utils/api'

export default function ControlUnitEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [rooms, setRooms] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    room: '',
    name: '',
    unit_type: '',
    description: '',
    status: 'inactive',
    plc_address: '',
    plc_db_number: '',
    plc_username: '',
    plc_password: '',
  })

  const [parameters, setParameters] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      // Räume laden
      const roomsResponse = await api.get('/rooms/')
      setRooms(roomsResponse.data.results || roomsResponse.data)

      if (id && id !== 'new') {
        // Bestehende Einheit laden
        const unitResponse = await api.get(`/controller/units/${id}/`)
        const unit = unitResponse.data
        
        setFormData({
          room: unit.room,
          name: unit.name,
          unit_type: unit.unit_type,
          description: unit.description || '',
          status: unit.status,
          plc_address: unit.plc_address || '',
          plc_db_number: unit.plc_db_number || '',
          plc_username: unit.plc_username || '',
          plc_password: unit.plc_password || '', // Wird leer sein wenn existiert
        })
        
        setParameters(unit.parameters || [])
      }
    } catch (err) {
      setError('Fehler beim Laden der Daten')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleParameterChange = (index, field, value) => {
    const newParams = [...parameters]
    newParams[index] = { ...newParams[index], [field]: value }
    setParameters(newParams)
  }

  const addParameter = () => {
    setParameters([
      ...parameters,
      { key: '', value: '', param_type: 'string', unit: '', description: '' }
    ])
  }

  const removeParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let unitId = id
      
      // Daten vorbereiten
      const submitData = {
        ...formData,
        plc_db_number: formData.plc_db_number ? parseInt(formData.plc_db_number) : null
      }
      
      // Wenn kein Passwort eingegeben wurde bei Bearbeitung, entfernen
      if (id !== 'new' && !submitData.plc_password) {
        delete submitData.plc_password
      }
      
      // Einheit erstellen oder aktualisieren
      if (id === 'new') {
        const response = await api.post('/controller/units/', submitData)
        unitId = response.data.id
      } else {
        await api.put(`/controller/units/${id}/`, submitData)
      }

      // Parameter speichern
      for (const param of parameters) {
        if (param.key) {
          if (param.id) {
            await api.put(`/controller/parameters/${param.id}/`, {
              ...param,
              control_unit: unitId
            })
          } else {
            await api.post('/controller/parameters/', {
              ...param,
              control_unit: unitId
            })
          }
        }
      }

      navigate('/controller')
    } catch (err) {
      setError('Fehler beim Speichern')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          <Settings sx={{ mr: 1, verticalAlign: 'bottom' }} />
          {id === 'new' ? 'Neue Steuerungseinheit' : 'Steuerungseinheit bearbeiten'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Raum</InputLabel>
                <Select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                >
                  {rooms.map(room => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Typ</InputLabel>
                <Select
                  name="unit_type"
                  value={formData.unit_type}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="lighting">Beleuchtung</MenuItem>
                  <MenuItem value="climate">Klimasteuerung</MenuItem>
                  <MenuItem value="watering">Bewässerung</MenuItem>
                  <MenuItem value="co2">CO2-Kontrolle</MenuItem>
                  <MenuItem value="humidity">Luftfeuchtigkeit</MenuItem>
                  <MenuItem value="other">Sonstiges</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="inactive">Inaktiv</MenuItem>
                  <MenuItem value="error">Fehler</MenuItem>
                  <MenuItem value="maintenance">Wartung</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                SPS-Konfiguration
                <Tooltip title="JSON-RPC API Verbindung zur Siemens S7-1200 G2">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SPS IP-Adresse"
                name="plc_address"
                value={formData.plc_address}
                onChange={handleChange}
                placeholder="z.B. 192.168.1.185"
                helperText="IP-Adresse der SPS (ohne https://)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Datenbaustein-Nummer"
                name="plc_db_number"
                type="number"
                value={formData.plc_db_number}
                onChange={handleChange}
                placeholder="z.B. 1"
                helperText="DB-Nummer für diese Steuerungseinheit"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Benutzername"
                name="plc_username"
                value={formData.plc_username}
                onChange={handleChange}
                placeholder="Standard: sash"
                helperText="Benutzername für die SPS Web-API"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Passwort"
                name="plc_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.plc_password}
                onChange={handleChange}
                placeholder={id === 'new' ? 'Standard: Janus72728' : 'Unverändert lassen wenn nicht ändern'}
                helperText={id === 'new' ? 'Passwort für die SPS Web-API' : 'Leer lassen um bestehendes Passwort zu behalten'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Parameter</Typography>
                <Button onClick={addParameter} size="small">
                  Parameter hinzufügen
                </Button>
              </Box>

              {parameters.map((param, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Schlüssel"
                      value={param.key}
                      onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Wert"
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Typ</InputLabel>
                      <Select
                        value={param.param_type}
                        onChange={(e) => handleParameterChange(index, 'param_type', e.target.value)}
                      >
                        <MenuItem value="string">Text</MenuItem>
                        <MenuItem value="float">Dezimal</MenuItem>
                        <MenuItem value="int">Ganzzahl</MenuItem>
                        <MenuItem value="bool">Boolean</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Einheit"
                      value={param.unit}
                      onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                      placeholder="z.B. °C"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button 
                      color="error" 
                      onClick={() => removeParameter(index)}
                      fullWidth
                    >
                      Entfernen
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button
              variant="outlined"
              onClick={() => navigate('/controller')}
              startIcon={<Cancel />}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={<Save />}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}