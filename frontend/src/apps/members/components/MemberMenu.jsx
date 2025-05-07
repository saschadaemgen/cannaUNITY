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
  Paper
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
    icon: <PeopleIcon />,
    path: '/mitglieder',
    color: '#1976d2' // Blau
  },
  {
    label: 'Neues Mitglied',
    icon: <PersonAddIcon />,
    path: '/mitglieder/neu',
    color: '#4caf50' // Grün
  },
  {
    label: 'Ausweiskarten',
    icon: <BadgeIcon />,
    path: '/mitglieder/karten',
    color: '#ff9800' // Orange
  },
  {
    label: 'Gruppenverwaltung',
    icon: <GroupsIcon />,
    path: '/mitglieder/gruppen',
    color: '#7b1fa2' // Lila
  },
  {
    label: 'Mitgliederstatus',
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

export default function MemberMenu() {
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
          background: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.primary.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="primary.main" 
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
          backgroundColor: alpha(theme.palette.primary.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
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
    </>
  )
}