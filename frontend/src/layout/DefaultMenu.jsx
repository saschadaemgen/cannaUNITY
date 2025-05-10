// src/layout/DefaultMenu.jsx
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
  Paper,
  Tooltip
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'

// Icons importieren
import HomeIcon from '@mui/icons-material/Home'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SettingsIcon from '@mui/icons-material/Settings'

// Hauptnavigationseinträge
const mainNavItems = [
  {
    label: 'Startseite',
    stepLabel: 'HOME',
    icon: <HomeIcon />,
    path: '/',
    color: '#2196f3' // Blau
  },
  {
    label: 'Dashboard',
    stepLabel: 'OVERVIEW',
    icon: <DashboardIcon />,
    path: '/dashboard',
    color: '#4caf50' // Grün
  },
  {
    label: 'Benachrichtigungen',
    stepLabel: 'ALERTS',
    icon: <NotificationsIcon />,
    path: '/notifications',
    subtitle: 'System & Persönlich',
    color: '#ff9800' // Orange
  },
  {
    label: 'Termine',
    stepLabel: 'CALENDAR',
    icon: <CalendarMonthIcon />,
    path: '/calendar',
    color: '#9c27b0' // Lila
  }
]

// Hilfsfunktionen und Einstellungen
const utilityNavItems = [
  {
    label: 'Hilfe & Support',
    icon: <HelpOutlineIcon />,
    path: '/help',
    color: '#e91e63' // Pink
  },
  {
    label: 'Einstellungen',
    icon: <SettingsIcon />,
    path: '/settings',
    color: '#607d8b' // Blaugrau
  }
]

export default function DefaultMenu({ collapsed = false }) {
  const theme = useTheme()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  // Funktion zum Rendern eines Menüelements
  const renderMenuItem = (item, index) => {
    const active = isActive(item.path)
    const itemColor = item.color || theme.palette.primary.main
    
    // Basis-Komponente für Listen-Items
    const menuItem = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          position: 'relative',
          borderRadius: '8px',
          height: collapsed ? '42px' : (item.subtitle ? '48px' : '42px'),
          color: active ? itemColor : theme.palette.text.primary,
          backgroundColor: active ? alpha(itemColor, 0.1) : 'transparent',
          padding: collapsed ? '8px' : undefined,
          justifyContent: collapsed ? 'center' : undefined,
          '&:hover': {
            backgroundColor: active 
              ? alpha(itemColor, 0.15) 
              : alpha(theme.palette.action.hover, 0.08)
          },
          '&.active': {
            fontWeight: 'bold',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: collapsed ? '-4px' : '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '60%',
              width: '4px',
              backgroundColor: itemColor,
              borderRadius: '0 4px 4px 0'
            }
          }
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: active ? itemColor : theme.palette.text.secondary,
            minWidth: collapsed ? 0 : '36px',
            marginRight: collapsed ? 0 : undefined
          }}
        >
          {item.icon}
        </ListItemIcon>
        
        {!collapsed && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {item.stepLabel && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 'bold',
                  color: active ? itemColor : theme.palette.text.secondary,
                  lineHeight: 1,
                  letterSpacing: '0.5px'
                }}
              >
                {item.stepLabel}
              </Typography>
            )}
            <Typography 
              sx={{
                fontSize: '0.9rem',
                fontWeight: active ? 600 : 400,
                lineHeight: 1.2,
                mt: item.stepLabel ? '1px' : 0
              }}
            >
              {item.label}
            </Typography>
            {item.subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem', 
                  color: theme.palette.text.secondary,
                  ml: 0,
                  lineHeight: 1,
                  mt: '-1px'
                }}
              >
                {item.subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Active-Indikator-Punkt nur anzeigen, wenn nicht kollabiert */}
        {active && !collapsed && (
          <Box 
            sx={{ 
              position: 'absolute',
              right: '8px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: itemColor,
            }}
          />
        )}
      </ListItemButton>
    )
    
    // Im kollabierten Zustand: Tooltip um das Element herum
    return (
      <ListItem key={item.label} disablePadding sx={{ mb: 0.5, px: collapsed ? 0.5 : 0 }}>
        {collapsed ? (
          <Tooltip 
            title={
              <Box>
                {item.stepLabel && (
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {item.stepLabel}
                  </Typography>
                )}
                <Typography variant="body2">{item.label}</Typography>
                {item.subtitle && (
                  <Typography variant="caption">{item.subtitle}</Typography>
                )}
              </Box>
            } 
            placement="right"
            arrow
          >
            {menuItem}
          </Tooltip>
        ) : menuItem}
      </ListItem>
    )
  }

  // Überschriften-Rendering
  const renderHeader = () => {
    if (collapsed) {
      return null;  // Wir zeigen keinen Header im eingeklappten Modus
    }
    
    return (
      <Paper 
        elevation={0}
        sx={{ 
          mx: 2, 
          mb: 2, 
          p: 1.5, 
          background: alpha(theme.palette.primary.main, 0.05),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.primary.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="primary" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          Navigation
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Hauptübersicht & Schnellzugriffe
        </Typography>
      </Paper>
    )
  }
  
  // Utility-Titel-Rendering
  const renderUtilitySeparator = () => {
    if (collapsed) {
      return <Divider sx={{ my: 2, mx: 1 }} />
    }
    
    return (
      <Box sx={{ mx: 2, my: 2 }}>
        <Divider>
          <Box 
            sx={{ 
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.info.main, 0.05),
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
              Hilfe & Optionen
            </Typography>
          </Box>
        </Divider>
      </Box>
    )
  }
  
  // Footer
  const renderFooter = () => {
    if (collapsed) return null
    
    return (
      <Box 
        sx={{ 
          mt: 2, 
          mx: 2, 
          p: 1.5, 
          backgroundColor: alpha(theme.palette.grey[500], 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`
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
          System Version 2.5.1
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {renderHeader()}
      
      {/* Hauptnavigation */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {mainNavItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderUtilitySeparator()}
      
      {/* Hilfsfunktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {utilityNavItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderFooter()}
    </>
  )
}