// src/layout/ContextSidebar.jsx (aktualisiert)
import { Box, useTheme } from '@mui/material'
import { useLocation } from 'react-router-dom'

// Menü-Komponenten importieren
import DefaultMenu from './DefaultMenu'
import MemberMenu from '../apps/members/components/MemberMenu'
import TrackTraceMenu from '../apps/trackandtrace/components/TrackTraceMenu'
import BuchhaltungMenu from '../apps/buchhaltung/components/BuchhaltungMenu'
import WawiMenu from '../apps/wawi/components/WawiMenu'
import RoomMenu from '../apps/rooms/components/RoomMenu'
import SecurityMenu from '../apps/security/components/SecurityMenu'

export default function ContextSidebar() {
  const theme = useTheme()
  const location = useLocation()
  
  // Bestimmen des aktiven Menüs basierend auf dem aktuellen Pfad
  const renderMenu = () => {
    if (location.pathname.startsWith('/mitglieder')) {
      return <MemberMenu />
    } else if (location.pathname.startsWith('/trackandtrace') || location.pathname.startsWith('/trace')) {
      return <TrackTraceMenu />
    } else if (location.pathname.startsWith('/buchhaltung')) {
      return <BuchhaltungMenu />
    } else if (location.pathname.startsWith('/wawi')) {
      return <WawiMenu />
    } else if (location.pathname.startsWith('/rooms')) {
      return <RoomMenu />
    } else if (
      location.pathname.startsWith('/security') || 
      location.pathname.startsWith('/unifi-access') || 
      location.pathname.startsWith('/unifi-protect')
    ) {
      return <SecurityMenu />
    } else {
      return <DefaultMenu />
    }
  }

  return (
    <Box
      sx={{
        width: 240,
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
      }}
    >
      {renderMenu()}
    </Box>
  )
}