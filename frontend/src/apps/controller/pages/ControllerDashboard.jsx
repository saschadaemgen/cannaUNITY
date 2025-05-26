// frontend/src/apps/controller/pages/ControllerDashboard.jsx
import { useState, useEffect } from 'react'
import {
  Box, Typography, FormControl, Select, MenuItem, Button, IconButton
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
  
  // Sidebar-Breite für die fixe Control Bar
  const [sidebarWidth, setSidebarWidth] = useState(240)
  
  // Neue States für bessere Drag-Kontrolle
  const [dragState, setDragState] = useState({
    dragging: null,
    dragOver: null
  })

  // Sidebar-Breite überwachen
  useEffect(() => {
    const updateSidebarWidth = () => {
      const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      setSidebarWidth(isCollapsed ? 64 : 240)
    }
    
    updateSidebarWidth()
    window.addEventListener('storage', updateSidebarWidth)
    window.addEventListener('sidebarToggle', updateSidebarWidth)
    
    return () => {
      window.removeEventListener('storage', updateSidebarWidth)
      window.removeEventListener('sidebarToggle', updateSidebarWidth)
    }
  }, [])

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

  // Cleanup-Funktion für alle Drag-States
  const cleanupDragState = () => {
    setDraggedUnit(null)
    setDragState({
      dragging: null,
      dragOver: null
    })
    
    // Alle möglichen Transform-Styles zurücksetzen
    document.querySelectorAll('[data-unit-card]').forEach(element => {
      element.style.transform = ''
      element.style.opacity = ''
      element.style.boxShadow = ''
      element.classList.remove('dragging', 'drag-over')
    })
  }

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

  // Verbesserte Drag & Drop Handler
  const handleDragStart = (e, unit) => {
    setDraggedUnit(unit)
    setDragState(prev => ({ ...prev, dragging: unit.id }))
    
    // Drag-Image setzen (optional)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', unit.id.toString())
  }

  const handleDragEnd = (e) => {
    // Cleanup mit kleiner Verzögerung für bessere UX
    setTimeout(() => {
      cleanupDragState()
    }, 100)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, unit) => {
    e.preventDefault()
    if (draggedUnit && draggedUnit.id !== unit.id) {
      setDragState(prev => ({ ...prev, dragOver: unit.id }))
    }
  }

  const handleDragLeave = (e) => {
    // Nur zurücksetzen wenn wir wirklich das Element verlassen
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({ ...prev, dragOver: null }))
    }
  }

  const handleDrop = (e, targetUnit) => {
    e.preventDefault()
    
    if (draggedUnit && draggedUnit.id !== targetUnit.id) {
      const newOrder = [...moduleOrder]
      const draggedIndex = newOrder.indexOf(draggedUnit.id)
      const targetIndex = newOrder.indexOf(targetUnit.id)
      
      // Positionen tauschen
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedUnit.id)
      
      setModuleOrder(newOrder)
    }
    
    // Sofortiges Cleanup
    cleanupDragState()
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

  // Berechne Systemstatus-Übersicht
  const getSystemStatusOverview = () => {
    const statusCounts = {
      active: 0,    // RUN
      inactive: 0,  // STOP  
      error: 0,     // ERROR
      maintenance: 0 // MAINTENANCE
    }
    
    filteredUnits.forEach(unit => {
      if (statusCounts.hasOwnProperty(unit.status)) {
        statusCounts[unit.status]++
      } else {
        statusCounts.inactive++ // Fallback für unbekannte Status
      }
    })
    
    return statusCounts
  }

  const systemStatus = getSystemStatusOverview()
  const getCardStyle = (unit) => {
    const isDragging = dragState.dragging === unit.id
    const isDragOver = dragState.dragOver === unit.id
    
    return {
      position: 'relative',
      cursor: isDragging ? 'grabbing' : 'grab',
      transition: 'all 0.2s ease',
      margin: 0,
      padding: 0,
      width: '280px',
      flexShrink: 0,
      opacity: isDragging ? 0.5 : 1,
      transform: isDragOver ? 'translateY(-5px) scale(1.02)' : 'scale(1)',
      boxShadow: isDragOver ? '0 8px 25px rgba(76, 175, 80, 0.3)' : 'none',
      '&:hover .delete-btn': {
        opacity: 1,
      }
    }
  }

  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Fixed Control Bar - direkt unter DateBar */}
      <Box sx={{
        position: 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#FFF',
        borderBottom: '1px solid #E0E0E0',
        height: '48px',
        flexShrink: 0
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* RUN Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00FF00',
            }} />
            <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
              RUN: {systemStatus.active}
            </Typography>
          </Box>

          {/* ERROR Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FF0000',
            }} />
            <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
              ERROR: {systemStatus.error}
            </Typography>
          </Box>

          {/* MAINTENANCE Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FFA500',
            }} />
            <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
              MAINT: {systemStatus.maintenance}
            </Typography>
          </Box>

          {/* STOP Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#666',
            }} />
            <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
              STOP: {systemStatus.inactive}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        background: '#F8F8F8',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'flex-start', // Oben anfangen statt zentriert
        justifyContent: 'center',
        position: 'relative',
        padding: '20px'
      }}>
        {sortedUnits.length === 0 ? (
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#999',
            textAlign: 'center',
            width: '100%',
            height: '100%'
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
            flexWrap: 'wrap', // Zeilenumbruch aktivieren
            gap: '10px',
            justifyContent: 'center', // Horizontal zentriert
            alignItems: 'flex-start', // Oben anfangen
            width: '100%',
            maxWidth: '1800px', // Begrenzt Breite für optimale 6er-Darstellung
          }}>
            {sortedUnits.map(unit => (
              <Box 
                key={unit.id}
                data-unit-card
                draggable
                onDragStart={(e) => handleDragStart(e, unit)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, unit)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, unit)}
                sx={getCardStyle(unit)}
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
  )
}