// src/apps/security/components/SecurityMenu.jsx
import React from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  alpha,
  Paper
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'

// Hauptfunktionen
import SecurityIcon from '@mui/icons-material/Security'
import SensorsIcon from '@mui/icons-material/Sensors'
import CameraOutdoorIcon from '@mui/icons-material/CameraOutdoor'
import DoorBackIcon from '@mui/icons-material/DoorBack'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import HistoryIcon from '@mui/icons-material/History'

// Admin-Tools
import SettingsIcon from '@mui/icons-material/Settings'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import BackupIcon from '@mui/icons-material/Backup'

// Hauptfunktionen
const mainFeatures = [
  {
    label: 'Sicherheits-Dashboard',
    icon: <SecurityIcon />,
    path: '/security/dashboard',
    color: '#f44336' // Rot
  },
  {
    label: 'Zugangskontrolle',
    icon: <DoorBackIcon />,
    path: '/unifi-access/dashboard',
    color: '#2196f3' // Blau
  },
  {
    label: 'Sensoren',
    icon: <SensorsIcon />,
    path: '/unifi-protect/sensoren',
    color: '#4caf50' // Grün
  },
  {
    label: 'Kameras',
    icon: <CameraOutdoorIcon />,
    path: '/security/cameras',
    color: '#ff9800' // Orange
  },
  {
    label: 'Alarme & Benachrichtigungen',
    icon: <NotificationsActiveIcon />,
    path: '/security/alerts',
    color: '#e91e63' // Pink
  },
  {
    label: 'Ereignisverlauf',
    icon: <HistoryIcon />,
    path: '/security/events',
    color: '#9c27b0' // Lila
  }
]

// Administrative Funktionen
const adminFunctions = [
  {
    label: 'Berechtigungen',
    icon: <AdminPanelSettingsIcon />,
    path: '/security/permissions',
    color: '#3f51b5' // Indigo
  },
  {
    label: 'Systemstatus',
    icon: <MonitorHeartIcon />,
    path: '/security/system-status',
    color: '#009688' // Türkis
  },
  {
    label: 'Backup & Archiv',
    icon: <BackupIcon />,
    path: '/security/backup',
    color: '#673ab7' // Deep Purple
  },
  {
    label: 'Sicherheitseinstellungen',
    icon: <SettingsIcon />,
    path: '/security/settings',
    color: '#607d8b' // Blaugrau
  }
]

export default function SecurityMenu() {
  const theme = useTheme()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  // Funktion zum Rendern eines Menüelements
  const renderMenuItem = (item) => {
    const active = isActive(item.path)
    
    return (
      <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          component={NavLink}
          to={item.path}
          sx={{
            position: 'relative',
            borderRadius: '8px',
            height: '42px',
            color: active ? item.color : theme.palette.text.primary,
            backgroundColor: active ? alpha(item.color, 0.1) : 'transparent',
            '&:hover': {
              backgroundColor: active 
                ? alpha(item.color, 0.15) 
                : alpha(theme.palette.action.hover, 0.08)
            },
            '&.active': {
              fontWeight: 'bold',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '60%',
                width: '4px',
                backgroundColor: item.color,
                borderRadius: '0 4px 4px 0'
              }
            }
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: active ? item.color : theme.palette.text.secondary,
              minWidth: '36px'
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            primaryTypographyProps={{ 
              fontSize: '0.9rem',
              fontWeight: active ? 600 : 400
            }}
          />
          {active && (
            <Box 
              sx={{ 
                position: 'absolute',
                right: '8px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: item.color,
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    )
  }

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          mx: 2, 
          mb: 2, 
          p: 1.5, 
          background: alpha(theme.palette.error.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.error.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="error.main" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          Sicherheit
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Zugang, Überwachung & Schutz
        </Typography>
      </Paper>
      
      {/* Hauptfunktionen */}
      <Box sx={{ px: 1 }}>
        <List>
          {mainFeatures.map(renderMenuItem)}
        </List>
      </Box>
      
      {/* Visuelle Trennung */}
      <Box sx={{ mx: 2, my: 2 }}>
        <Divider>
          <Box 
            sx={{ 
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: theme.palette.info.main,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Admin-Tools
            </Typography>
          </Box>
        </Divider>
      </Box>
      
      {/* Administrative Funktionen */}
      <Box sx={{ px: 1 }}>
        <List>
          {adminFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      <Box 
        sx={{ 
          mt: 2, 
          mx: 2, 
          p: 1.5, 
          backgroundColor: alpha(theme.palette.error.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block', 
            fontSize: '0.7rem',
            fontStyle: 'italic'
          }}
        >
          Sicherheitssystem v2.5
        </Typography>
      </Box>
    </>
  )
}