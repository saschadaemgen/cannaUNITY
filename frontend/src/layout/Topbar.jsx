import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Link,
  Divider,
  IconButton,
  useTheme,
} from '@mui/material'
import { NavLink } from 'react-router-dom'
import { ColorModeContext } from '../context/ColorModeContext'
import { useContext } from 'react'

import GroupIcon from '@mui/icons-material/Groups'
import TimelineIcon from '@mui/icons-material/Timeline'
import PaymentsIcon from '@mui/icons-material/Payments'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import KeyIcon from '@mui/icons-material/VpnKey'

export default function Topbar() {
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)

  const menuItems = [
    { label: 'Gemeinschaftsnetzwerk', path: '/mitglieder', icon: <GroupIcon fontSize="small" /> },
    { label: 'Track & Trace', path: '/trace', icon: <TimelineIcon fontSize="small" /> },
    { label: 'Buchhaltung', path: '/buchhaltung', icon: <PaymentsIcon fontSize="small" /> },
    { label: 'Raumverwaltung', path: '/rooms', icon: <MeetingRoomIcon fontSize="small" /> },
    { label: 'UniFi Access', path: '/unifi-access/dashboard', icon: <KeyIcon fontSize="small" /> },  // Neuer Menüpunkt
  ]

  return (
    <AppBar
      position="fixed"
      color="success"
      elevation={2}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ height: '56px', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          Anbauvereinigung Recklinghausen e.V.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {menuItems.map((item, index) => (
            <Box key={item.path} sx={{ display: 'flex', alignItems: 'center' }}>
              <Link
                component={NavLink}
                to={item.path}
                color="inherit"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,  // Noch geringerer Abstand zwischen Icon und Text
                  px: 1,
                  fontSize: '0.9rem',
                  '& svg': { color: 'inherit', fontSize: '20px' },
                }}
              >
                {item.icon}
                {item.label}
              </Link>
              {index < menuItems.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.5)' }} // Noch geringerer Abstand
                />
              )}
            </Box>
          ))}

          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.5)' }} // Noch geringerer Abstand
          />

          <IconButton
            onClick={colorMode.toggleColorMode}
            color="inherit"
            sx={{ ml: 1 }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
