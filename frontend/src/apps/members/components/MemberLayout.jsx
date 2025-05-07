// frontend/src/apps/members/components/MemberLayout.jsx
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'

// Gemeinsame Layout-Komponenten
import Topbar from '../../../layout/Topbar'
import DateBar from '../../../layout/DateBar'
import Footer from '../../../layout/Footer'

// Spezifische Sidebar für Mitglieder
import MemberSidebar from './MemberSidebar'

function MemberLayout() {
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

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <MemberSidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: 'background.default',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default MemberLayout