// src/layout/ContextSidebar.jsx
import { useState, useEffect } from 'react'
import { 
  Box, 
  useTheme, 
  IconButton,
  Tooltip, 
  useMediaQuery,
  alpha
} from '@mui/material'
import { useLocation } from 'react-router-dom'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import MenuIcon from '@mui/icons-material/Menu'

// Menü-Komponenten importieren
import DefaultMenu from './DefaultMenu'
import MemberMenu from '../apps/members/components/MemberMenu'
import TrackTraceMenu from '../apps/trackandtrace/components/TrackTraceMenu'
import BuchhaltungMenu from '../apps/buchhaltung/components/BuchhaltungMenu'
import WawiMenu from '../apps/wawi/components/WawiMenu'
import RoomMenu from '../apps/rooms/components/RoomMenu'
import SecurityMenu from '../apps/security/components/SecurityMenu'
import OptionsMenu from '../apps/options/components/OptionsMenu'
import TaskManagerMenu from '../apps/taskmanager/components/TaskManagerMenu'

export default function ContextSidebar() {
  const theme = useTheme()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)  // Default: eingeklappt
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Initialer Zustand: immer eingeklappt, außer explizit anders gespeichert
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    // Nur wenn explizit ausgeklappt gespeichert, sonst immer eingeklappt
    if (savedState === 'false') {
      setCollapsed(false)
    } else {
      // In allen anderen Fällen: eingeklappt
      setCollapsed(true)
      // Speichern des Zustands
      localStorage.setItem('sidebarCollapsed', 'true')
    }
  }, [])
  
  // Sidebar-Zustand speichern UND EVENT AUSLÖSEN, wenn er sich ändert
  useEffect(() => {
    // Zustand im localStorage speichern
    localStorage.setItem('sidebarCollapsed', collapsed.toString())
    
    // Explizites Event auslösen für das MainLayout
    const event = new CustomEvent('sidebarToggle', { 
      detail: { collapsed: collapsed } 
    })
    window.dispatchEvent(event)
  }, [collapsed])
  
  // Toggle-Funktion für die Sidebar
  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }
  
  // Bestimmen des aktiven Menüs basierend auf dem aktuellen Pfad
  const renderMenu = () => {
    if (location.pathname.startsWith('/mitglieder')) {
      return <MemberMenu collapsed={collapsed} />
    } else if (location.pathname.startsWith('/trackandtrace') || location.pathname.startsWith('/trace')) {
      return <TrackTraceMenu collapsed={collapsed} />
    } else if (location.pathname.startsWith('/buchhaltung')) {
      return <BuchhaltungMenu collapsed={collapsed} />
    } else if (location.pathname.startsWith('/wawi')) {
      return <WawiMenu collapsed={collapsed} />
    } else if (location.pathname.startsWith('/rooms')) {
      return <RoomMenu collapsed={collapsed} />
    } else if (
      location.pathname.startsWith('/security') || 
      location.pathname.startsWith('/unifi-access') || 
      location.pathname.startsWith('/unifi-protect')
    ) {
      return <SecurityMenu collapsed={collapsed} />
    } else if (location.pathname.startsWith('/options')) {
      return <OptionsMenu collapsed={collapsed} />
      } else if (location.pathname.startsWith('/taskmanager')) {
      return <TaskManagerMenu collapsed={collapsed} />
    } else {
      return <DefaultMenu collapsed={collapsed} />
    }
  }

  return (
    <Box
      sx={{
        width: collapsed ? 64 : 240,
        transition: 'width 0.3s ease',
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
        borderRight: '1px solid',
        borderColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[300],
        pt: 2,
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Menüinhalte */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {renderMenu()}
      </Box>
      
      {/* Toggle-Button unten in der Sidebar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0',
          borderTop: '1px solid',
          borderTopColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.grey[700], 0.5)
              : alpha(theme.palette.grey[300], 0.5),
        }}
      >
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2)
            },
            width: 32,
            height: 32,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>
    </Box>
  )
}