// frontend/src/apps/controller/pages/ControllerDashboard.jsx
import { useState, useEffect } from 'react'
import {
  Box, Typography, FormControl, Select, MenuItem, Button, IconButton, Container
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'
import ControlUnitCard from '../components/ControlUnitCard'

export default function ControllerDashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [units, setUnits] = useState([])
  const [statusOverview, setStatusOverview] = useState({ errors: 0 })
  const [draggedUnit, setDraggedUnit] = useState(null)
  const [moduleOrder, setModuleOrder] = useState([])

  useEffect(() => {
    loadData()
    loadStatusOverview()
  }, [])

  useEffect(() => {
    // Initiale Reihenfolge setzen
    if (units.length > 0 && moduleOrder.length === 0) {
      setModuleOrder(units.map(u => u.id))
    }
  }, [units])

  const loadData = async () => {
    try {
      const roomsResponse = await api.get('/rooms/')
      setRooms(roomsResponse.data.results || roomsResponse.data)

      const unitsResponse = await api.get('/controller/units/')
      const unitsData = unitsResponse.data.results || unitsResponse.data
      setUnits(unitsData)
      setModuleOrder(unitsData.map(u => u.id))
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
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

  const handleDeleteUnit = async (unitId, event) => {
    event.stopPropagation()
    if (window.confirm('Modul wirklich löschen?')) {
      try {
        await api.delete(`/controller/units/${unitId}/`)
        loadData()
        loadStatusOverview()
      } catch (error) {
        console.error('Fehler beim Löschen:', error)
      }
    }
  }

  // Drag & Drop Handler
  const handleDragStart = (e, unit) => {
    setDraggedUnit(unit)
    e.currentTarget.classList.add('dragging')
  }

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over')
  }

  const handleDrop = (e, targetUnit) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    
    if (draggedUnit && draggedUnit.id !== targetUnit.id) {
      const newOrder = [...moduleOrder]
      const draggedIndex = newOrder.indexOf(draggedUnit.id)
      const targetIndex = newOrder.indexOf(targetUnit.id)
      
      // Positionen tauschen
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedUnit.id)
      
      setModuleOrder(newOrder)
      
      // Kurze Animation für Feedback
      e.currentTarget.style.transform = 'scale(1.1)'
      setTimeout(() => {
        e.currentTarget.style.transform = ''
      }, 200)
    }
    setDraggedUnit(null)
  }

  // Filter anwenden
  const filteredUnits = units.filter(unit => {
    if (selectedRoom !== 'all' && unit.room !== selectedRoom) return false
    if (selectedType !== 'all' && unit.unit_type !== selectedType) return false
    return true
  })

  // Sortierte Units basierend auf moduleOrder
  const sortedUnits = filteredUnits.sort((a, b) => {
    const indexA = moduleOrder.indexOf(a.id)
    const indexB = moduleOrder.indexOf(b.id)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Box sx={{ my: 4 }}>
        {/* Control Bar */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          background: '#FFF',
          borderBottom: '1px solid #E0E0E0',
          borderRadius: '8px 8px 0 0',
          mb: 2,
        }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                displayEmpty
                sx={{ 
                  background: '#FFF',
                  height: '32px',
                  fontSize: '14px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DDD' }
                }}
              >
                <MenuItem value="all">Alle Räume</MenuItem>
                {rooms.map(room => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                displayEmpty
                sx={{ 
                  background: '#FFF',
                  height: '32px',
                  fontSize: '14px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DDD' }
                }}
              >
                <MenuItem value="all">Alle Typen</MenuItem>
                <MenuItem value="lighting">Beleuchtung</MenuItem>
                <MenuItem value="climate">Klima</MenuItem>
                <MenuItem value="watering">Bewässerung</MenuItem>
                <MenuItem value="co2">CO2</MenuItem>
                <MenuItem value="humidity">Feuchtigkeit</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/controller/units/new/edit')}
              sx={{ 
                background: '#4CAF50',
                height: '32px',
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': { background: '#66BB6A' }
              }}
            >
              Neues Modul
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusOverview.errors > 0 ? '#FF0000' : '#00FF00',
            }} />
            <Typography sx={{ fontSize: '14px', color: '#666' }}>
              {statusOverview.errors > 0 ? `${statusOverview.errors} Fehler` : 'System OK'}
            </Typography>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{
          background: '#F8F8F8',
          borderRadius: '0 0 8px 8px',
          minHeight: '400px',
        }}>
          {sortedUnits.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center',
              padding: '60px',
              color: '#999',
            }}>
              <Typography variant="h6">
                Keine Module vorhanden
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Fügen Sie ein neues Modul über den Button oben hinzu
              </Typography>
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              width: '100%',
              height: 'fit-content',
              padding: '25px 25px 25px 0px', // Links 0px - komplett bündig
            }}>
              {sortedUnits.map(unit => (
                <Box 
                  key={unit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, unit)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, unit)}
                  sx={{
                    position: 'relative',
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    margin: 0,
                    padding: 0,
                    width: '280px',
                    flexShrink: 0,
                    '&:hover .delete-btn': {
                      opacity: 1,
                    },
                    '&:active': {
                      cursor: 'grabbing',
                    },
                    '&.dragging': {
                      opacity: 0.3,
                      transform: 'scale(0.95)',
                    },
                    '&.drag-over': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 5px 15px rgba(76, 175, 80, 0.3)',
                    }
                  }}
                >
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => handleDeleteUnit(unit.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: '#FF5252',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 10,
                      padding: '4px',
                      '&:hover': {
                        background: '#F44336',
                      }
                    }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                  <ControlUnitCard 
                    unit={unit} 
                    onStatusChange={loadStatusOverview}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  )
}