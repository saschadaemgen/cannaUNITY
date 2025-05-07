// src/apps/members/components/MemberMenu.jsx
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

// Hauptfunktionen
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import BadgeIcon from '@mui/icons-material/Badge'
import GroupsIcon from '@mui/icons-material/Groups'
import StarIcon from '@mui/icons-material/Star'

// Admin-Tools
import SettingsIcon from '@mui/icons-material/Settings'
import BarChartIcon from '@mui/icons-material/BarChart'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'

// Hauptfunktionen
const mainFeatures = [
  {
    label: 'Mitgliederliste',
    stepLabel: 'MEMBER 1',
    icon: <PeopleIcon />,
    path: '/mitglieder',
    color: '#1976d2' // Blau
  },
  {
    label: 'Neues Mitglied',
    stepLabel: 'MEMBER 2',
    icon: <PersonAddIcon />,
    path: '/mitglieder/neu',
    color: '#4caf50' // Grün
  },
  {
    label: 'Ausweiskarten',
    stepLabel: 'MEMBER 3',
    icon: <BadgeIcon />,
    path: '/mitglieder/karten',
    color: '#ff9800' // Orange
  },
  {
    label: 'Gruppenverwaltung',
    stepLabel: 'MEMBER 4',
    icon: <GroupsIcon />,
    path: '/mitglieder/gruppen',
    color: '#7b1fa2' // Lila
  },
  {
    label: 'Mitgliederstatus',
    stepLabel: 'MEMBER 5',
    icon: <StarIcon />,
    path: '/mitglieder/status',
    color: '#f44336' // Rot
  }
]

// Administrative Funktionen
const adminFunctions = [
  {
    label: 'Mitgliedereinstellungen',
    icon: <SettingsIcon />,
    path: '/mitglieder/einstellungen',
    color: '#607d8b' // Blaugrau
  },
  {
    label: 'Statistiken & Reports',
    icon: <BarChartIcon />,
    path: '/mitglieder/statistiken',
    color: '#2196f3' // Hellblau
  },
  {
    label: 'Import/Export',
    icon: <ImportExportIcon />,
    path: '/mitglieder/import-export',
    color: '#9c27b0' // Violett
  },
  {
    label: 'Erweiterte Suche',
    icon: <ManageSearchIcon />,
    path: '/mitglieder/erweiterte-suche',
    color: '#ff5722' // Tiefes Orange
  }
]

export default function MemberMenu({ collapsed = false }) {
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

  // Überschriften-Rendering anpassen
  const renderHeader = () => {
    if (collapsed) {
      return null;  // Wir zeigen kein Header im eingeklappten Modus
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
          Gemeinschaftsnetzwerk
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Mitgliederverwaltung & Organisation
        </Typography>
      </Paper>
    )
  }
  
  // Admin-Titel-Rendering anpassen
  const renderAdminSeparator = () => {
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
              Admin-Tools
            </Typography>
          </Box>
        </Divider>
      </Box>
    )
  }
  
  // Footer anpassen
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
          Mitgliederverwaltung v2.4
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {renderHeader()}
      
      {/* Hauptfunktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {mainFeatures.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderAdminSeparator()}
      
      {/* Administrative Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {adminFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderFooter()}
    </>
  )
}