// src/apps/trackandtrace/components/TrackTraceMenu.jsx
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

// Bestehende Icons
import GrassIcon from '@mui/icons-material/Grass'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import ScienceIcon from '@mui/icons-material/Science'
import BiotechIcon from '@mui/icons-material/Biotech'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket'

// Neue Icons für die zusätzlichen Funktionen
import QrCode2Icon from '@mui/icons-material/QrCode2'
import DescriptionIcon from '@mui/icons-material/Description'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'

// Prozessschritte
const processSteps = [
  { 
    label: 'Step 1 - Samen', 
    icon: <GrassIcon />, 
    pathOld: '/trace/samen',
    pathNew: '/trackandtrace/seeds',
    color: '#4caf50' // Grün
  },
  { 
    label: 'Step 2 - Mutterpflanzen', 
    icon: <LocalFloristIcon />, 
    pathOld: '/trace/mutterpflanzen',
    pathNew: '/trackandtrace/motherplants',
    color: '#2e7d32' // Dunkelgrün
  },
  { 
    label: 'Step 3 - Stecklinge', 
    icon: <ContentCutIcon />, 
    pathOld: '/trace/stecklinge',
    pathNew: '/trackandtrace/cuttings',
    color: '#81c784' // Hellgrün
  },
  { 
    label: 'Step 4 - Blühpflanzen', 
    icon: <AcUnitIcon />, 
    pathOld: '/trace/bluehpflanzen',
    pathNew: '/trackandtrace/floweringplants',
    color: '#7b1fa2' // Lila (für Blüten)
  },
  { 
    label: 'Step 5 - Ernte', 
    icon: <AgricultureIcon />, 
    pathOld: '/trace/ernte',
    pathNew: '/trackandtrace/harvest',
    color: '#ff9800' // Orange
  },
  { 
    label: 'Step 6 - Trocknung', 
    icon: <AcUnitIcon />, 
    pathOld: '/trace/trocknung',
    pathNew: '/trackandtrace/drying',
    color: '#f57c00' // Dunkelorange
  },
  { 
    label: 'Step 7 - Verarbeitung', 
    icon: <ScienceIcon />, 
    pathOld: '/trace/verarbeitung',
    pathNew: '/trackandtrace/processing',
    color: '#2196f3' // Blau
  },
  { 
    label: 'Step 8 - Laborkontrolle', 
    icon: <BiotechIcon />, 
    pathOld: '/trace/laborkontrolle',
    pathNew: '/trackandtrace/labcontrol',
    color: '#0d47a1' // Dunkelblau
  },
  { 
    label: 'Step 9 - Verpackung', 
    icon: <Inventory2Icon />, 
    pathOld: '/trace/verpackung',
    pathNew: '/trackandtrace/packaging',
    color: '#795548' // Braun
  },
  { 
    label: 'Step 10 - Produktausgabe', 
    icon: <ShoppingBasketIcon />, 
    pathOld: '/trace/ausgabe',
    pathNew: '/trackandtrace/output',
    color: '#616161' // Grau
  }
]

// Neue administrative Funktionen
const adminFunctions = [
  {
    label: 'Produktscan',
    icon: <QrCode2Icon />,
    pathOld: '/trace/produktscan',
    pathNew: '/trackandtrace/product-scan',
    color: '#e91e63' // Pink
  },
  {
    label: 'Protokoll-Exporte',
    icon: <DescriptionIcon />,
    pathOld: '/trace/protokolle',
    pathNew: '/trackandtrace/protocols',
    color: '#3f51b5' // Indigo
  },
  {
    label: 'Monitoring',
    icon: <DashboardIcon />,
    pathOld: '/trace/monitoring',
    pathNew: '/trackandtrace/monitoring',
    color: '#00bcd4' // Cyan
  },
  {
    label: 'Compliance',
    icon: <VerifiedUserIcon />,
    pathOld: '/trace/compliance',
    pathNew: '/trackandtrace/compliance',
    color: '#ffc107' // Amber
  }
]

export default function TrackTraceMenu() {
  const theme = useTheme()
  const location = useLocation()
  
  // Ermittle, ob wir das alte oder neue Pfadsystem verwenden
  const useNewPaths = location.pathname.includes('/trackandtrace')
  
  // Generiere Menüeinträge basierend auf dem erkannten Pfadsystem
  const processMenuItems = processSteps.map(item => ({
    ...item,
    path: useNewPaths ? item.pathNew : item.pathOld
  }))
  
  const adminMenuItems = adminFunctions.map(item => ({
    ...item,
    path: useNewPaths ? item.pathNew : item.pathOld
  }))

  const isActive = (path) => {
    return location.pathname === path
  }

  // Funktion zum Rendern eines Menüelements
  const renderMenuItem = (item, index) => {
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
          background: alpha(theme.palette.success.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.success.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="success.main" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          Track & Trace
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Verwaltung des Pflanzenlebenszyklus
        </Typography>
      </Paper>
      
      {/* Prozessschritte */}
      <Box sx={{ px: 1 }}>
        <List>
          {processMenuItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {/* Visuelle Trennung - NUR in der Sidebar */}
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
          {adminMenuItems.map(renderMenuItem)}
        </List>
      </Box>
      
      <Box 
        sx={{ 
          mt: 2, 
          mx: 2, 
          p: 1.5, 
          backgroundColor: alpha(theme.palette.success.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
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
          Track & Trace System v1.2
        </Typography>
      </Box>
    </>
  )
}