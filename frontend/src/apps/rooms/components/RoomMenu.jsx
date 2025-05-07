// src/apps/rooms/components/RoomMenu.jsx
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
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat'

// Admin-Tools
import SettingsIcon from '@mui/icons-material/Settings'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import InfoIcon from '@mui/icons-material/Info'

// Hauptfunktionen
const mainFeatures = [
  {
    label: 'Raumliste',
    icon: <MeetingRoomIcon />,
    path: '/rooms',
    color: '#3f51b5' // Indigo
  },
  {
    label: 'Neuer Raum',
    icon: <AddIcon />,
    path: '/rooms/new',
    color: '#4caf50' // Grün
  },
  {
    label: 'Elemente-Bibliothek',
    icon: <CategoryIcon />,
    path: '/rooms/item-types',
    color: '#ff9800' // Orange
  },
  {
    label: 'Neuer Elementtyp',
    icon: <AddIcon />,
    path: '/rooms/item-types/new',
    color: '#ff5722' // Deep Orange
  },
  {
    label: 'Raumdesigner',
    icon: <DashboardCustomizeIcon />,
    path: '/rooms/designer',
    color: '#9c27b0' // Lila
  },
  {
    label: 'Raumbelegung',
    icon: <CalendarMonthIcon />,
    path: '/rooms/calendar',
    color: '#2196f3' // Blau
  },
  {
    label: 'Klima & Sensoren',
    icon: <DeviceThermostatIcon />,
    path: '/rooms/climate',
    color: '#009688' // Türkis
  }
]

// Administrative Funktionen
const adminFunctions = [
  {
    label: 'Raumeinstellungen',
    icon: <SettingsIcon />,
    path: '/rooms/settings',
    color: '#607d8b' // Blaugrau
  },
  {
    label: 'Raumaufnahmen',
    icon: <PhotoCameraIcon />,
    path: '/rooms/photos',
    color: '#e91e63' // Pink
  },
  {
    label: 'Import/Export',
    icon: <ImportExportIcon />,
    path: '/rooms/import-export',
    color: '#673ab7' // Deep Purple
  },
  {
    label: 'Raumstatus',
    icon: <InfoIcon />,
    path: '/rooms/status',
    color: '#f44336' // Rot
  }
]

export default function RoomMenu() {
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
          background: alpha(theme.palette.info.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.info.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="info.main" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          Raumverwaltung
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Räume, Elemente & Belegung
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
          backgroundColor: alpha(theme.palette.info.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
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
          Raumverwaltung v1.9
        </Typography>
      </Box>
    </>
  )
}