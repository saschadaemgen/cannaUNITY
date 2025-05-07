// src/apps/buchhaltung/components/BuchhaltungMenu.jsx
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
import PaymentsIcon from '@mui/icons-material/Payments'
import CategoryIcon from '@mui/icons-material/Category'
import AddIcon from '@mui/icons-material/Add'
import TimelineIcon from '@mui/icons-material/Timeline'
import BusinessIcon from '@mui/icons-material/Business'

// Admin-Tools
import SettingsIcon from '@mui/icons-material/Settings'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SummarizeIcon from '@mui/icons-material/Summarize'

// Hauptfunktionen
const mainFeatures = [
  {
    label: 'Dashboard',
    icon: <PaymentsIcon />,
    path: '/buchhaltung',
    color: '#2196f3' // Blau
  },
  {
    label: 'Kontenübersicht',
    icon: <CategoryIcon />,
    path: '/buchhaltung/konten',
    color: '#4caf50' // Grün
  },
  {
    label: 'Neues Konto',
    icon: <AddIcon />,
    path: '/buchhaltung/konten/neu',
    color: '#8bc34a' // Hellgrün
  },
  {
    label: 'Buchungsjournal',
    icon: <TimelineIcon />,
    path: '/buchhaltung/journal',
    color: '#ff9800' // Orange
  },
  {
    label: 'Neue Buchung',
    icon: <AddIcon />,
    path: '/buchhaltung/buchung/neu',
    color: '#ff5722' // Tieforange
  },
  {
    label: 'GuV',
    icon: <TimelineIcon />,
    path: '/buchhaltung/guv',
    color: '#9c27b0' // Lila
  },
  {
    label: 'Bilanz',
    icon: <BusinessIcon />,
    path: '/buchhaltung/bilanz',
    color: '#673ab7' // Violett
  },
  {
    label: 'Jahresabschluss',
    icon: <TimelineIcon />,
    path: '/buchhaltung/jahresabschluss',
    color: '#3f51b5' // Indigoblau
  }
]

// Administrative Funktionen
const adminFunctions = [
  {
    label: 'Finanzbericht-Export',
    icon: <PictureAsPdfIcon />,
    path: '/buchhaltung/export',
    color: '#e91e63' // Pink
  },
  {
    label: 'Steuereinstellungen',
    icon: <AccountBalanceIcon />,
    path: '/buchhaltung/steuer',
    color: '#009688' // Türkis
  },
  {
    label: 'Buchungsvorlagen',
    icon: <SummarizeIcon />,
    path: '/buchhaltung/vorlagen',
    color: '#795548' // Braun
  },
  {
    label: 'Finanzeinstellungen',
    icon: <SettingsIcon />,
    path: '/buchhaltung/einstellungen',
    color: '#607d8b' // Blaugrau
  }
]

export default function BuchhaltungMenu() {
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
          background: alpha(theme.palette.secondary.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.secondary.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="secondary.main" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          Buchhaltung
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Finanzverwaltung & Kostenübersicht
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
          backgroundColor: alpha(theme.palette.secondary.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
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
          Finanzverwaltung v3.1
        </Typography>
      </Box>
    </>
  )
}