// src/layout/MainLayout.jsx
import { Box } from '@mui/material'
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

import Topbar from './Topbar'
import ContextSidebar from './ContextSidebar'
import Footer from './Footer'
import DateBar from './DateBar'

function MainLayout() {
  const location = useLocation()
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const mainContentRef = useRef(null)
  
  // Überwachen des localStorage und custom Events
  useEffect(() => {
    const updateLayout = () => {
      const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      const newWidth = isCollapsed ? 64 : 240
      setSidebarWidth(newWidth)
      
      // Direkte DOM-Manipulation für den Hauptinhalt, falls der React-Ansatz nicht funktioniert
      if (mainContentRef.current) {
        mainContentRef.current.style.width = `calc(100% - ${newWidth}px)`
      }
    }
    
    // Initiale Einstellung
    updateLayout()
    
    // Event-Listener für Änderungen
    window.addEventListener('storage', updateLayout)
    window.addEventListener('sidebarToggle', updateLayout)
    
    // Custom Event zur manuellen Triggerung (kann bei Bedarf verwendet werden)
    const customEvent = new CustomEvent('layoutUpdate')
    window.dispatchEvent(customEvent)
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', updateLayout)
      window.removeEventListener('sidebarToggle', updateLayout)
    }
  }, [])
  
  // Manuelles Update des Layouts bei Routenwechsel
  useEffect(() => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    setSidebarWidth(isCollapsed ? 64 : 240)
    
    // Verzögerung hinzufügen, um sicherzustellen, dass Änderungen wirksam werden
    setTimeout(() => {
      if (mainContentRef.current) {
        const newWidth = isCollapsed ? 64 : 240
        mainContentRef.current.style.width = `calc(100% - ${newWidth}px)`
      }
    }, 50)
  }, [location.pathname])
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        paddingTop: '64px', // Platz für Topbar
      }}
    >
      <Topbar />
      <DateBar />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar mit fester Breite und Transition */}
        <Box sx={{ 
          width: sidebarWidth, 
          flexShrink: 0,
          transition: 'width 0.3s ease',
          position: 'relative',
          zIndex: 2
        }}>
          <ContextSidebar />
        </Box>
        
        {/* Hauptinhalt mit dynamischer Breite */}
        <Box
          ref={mainContentRef}
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: 'background.default',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
            transition: 'width 0.3s ease',
            width: `calc(100% - ${sidebarWidth}px)`,
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 1
          }}
        >
          <Outlet key={location.pathname} />
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default MainLayout