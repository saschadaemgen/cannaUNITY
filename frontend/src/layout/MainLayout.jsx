import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'

import Topbar from './Topbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import DateBar from './DateBar'

function MainLayout() {
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
        <Sidebar />
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

export default MainLayout
