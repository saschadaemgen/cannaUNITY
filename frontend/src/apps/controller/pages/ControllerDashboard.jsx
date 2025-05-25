// frontend/src/apps/controller/pages/ControllerDashboard.jsx
// Ersetzen Sie die bestehende Datei mit dieser erweiterten Version:

import { useState, useEffect } from 'react'
import {
  Container, Grid, Paper, Typography, Box, Tab, Tabs,
  FormControl, Select, MenuItem, InputLabel, Chip, Button
} from '@mui/material'
import { Dashboard, Lightbulb, Thermostat, Water, CloudQueue, Add } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'
import ControlUnitCard from '../components/ControlUnitCard'

const TYPE_ICONS = {
  lighting: <Lightbulb />,
  climate: <Thermostat />,
  watering: <Water />,
  co2: <CloudQueue />,
  humidity: <Water />,
}

export default function ControllerDashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [units, setUnits] = useState([])
  const [statusOverview, setStatusOverview] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadStatusOverview()
  }, [])

  const loadData = async () => {
    try {
      // Räume laden
      const roomsResponse = await api.get('/rooms/')
      setRooms(roomsResponse.data.results || roomsResponse.data)

      // Steuerungseinheiten laden
      const unitsResponse = await api.get('/controller/units/')
      setUnits(unitsResponse.data.results || unitsResponse.data)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatusOverview = async () => {
    try {
      const response = await api.get('/controller/status/overview/')
      setStatusOverview(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Statusübersicht:', error)
    }
  }

  const filteredUnits = units.filter(unit => {
    if (selectedRoom !== 'all' && unit.room !== selectedRoom) return false
    if (selectedType !== 'all' && unit.unit_type !== selectedType) return false
    return true
  })

  const groupedUnits = filteredUnits.reduce((acc, unit) => {
    const roomName = unit.room_name
    if (!acc[roomName]) acc[roomName] = []
    acc[roomName].push(unit)
    return acc
  }, {})

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" gutterBottom>
            <Dashboard sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Steuerungszentrale
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/controller/units/new/edit')}
          >
            Neue Steuerungseinheit
          </Button>
        </Box>
        
        <Box display="flex" gap={2}>
          <Chip 
            label={`${statusOverview.total || 0} Einheiten`} 
            variant="outlined" 
          />
          <Chip 
            label={`${statusOverview.online || 0} Online`} 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label={`${statusOverview.offline || 0} Offline`} 
            color="default" 
            variant="outlined"
          />
          {statusOverview.errors > 0 && (
            <Chip 
              label={`${statusOverview.errors} Fehler`} 
              color="error" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Raum</InputLabel>
            <Select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              label="Raum"
            >
              <MenuItem value="all">Alle Räume</MenuItem>
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Typ</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Typ"
            >
              <MenuItem value="all">Alle Typen</MenuItem>
              <MenuItem value="lighting">Beleuchtung</MenuItem>
              <MenuItem value="climate">Klimasteuerung</MenuItem>
              <MenuItem value="watering">Bewässerung</MenuItem>
              <MenuItem value="co2">CO2-Kontrolle</MenuItem>
              <MenuItem value="humidity">Luftfeuchtigkeit</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {Object.keys(groupedUnits).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Keine Steuerungseinheiten vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Erstellen Sie Ihre erste Steuerungseinheit, um die Automatisierung zu starten.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/controller/units/new/edit')}
          >
            Erste Steuerungseinheit erstellen
          </Button>
        </Paper>
      ) : (
        Object.entries(groupedUnits).map(([roomName, roomUnits]) => (
          <Box key={roomName} mb={4}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {roomName}
            </Typography>
            <Grid container spacing={3}>
              {roomUnits.map(unit => (
                <Grid item xs={12} sm={6} md={4} key={unit.id}>
                  <ControlUnitCard 
                    unit={unit} 
                    onStatusChange={loadStatusOverview}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Container>
  )
}