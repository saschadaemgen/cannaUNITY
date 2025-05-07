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
  Paper,
  Tooltip
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
import YardIcon from '@mui/icons-material/Yard'
import OpacityIcon from '@mui/icons-material/Opacity'
import ThermostatIcon from '@mui/icons-material/Thermostat'

// Neue Icons für die zusätzlichen Funktionen
import QrCode2Icon from '@mui/icons-material/QrCode2'
import DescriptionIcon from '@mui/icons-material/Description'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'

// Prozessschritte
const processSteps = [
  { 
    label: 'Samen', 
    stepLabel: 'STEP 1',
    icon: <GrassIcon />, 
    pathOld: '/trace/samen',
    pathNew: '/trackandtrace/seeds',
  },
  { 
    label: 'Mutterpflanzen', 
    stepLabel: 'STEP 2',
    icon: <LocalFloristIcon />, 
    pathOld: '/trace/mutterpflanzen',
    pathNew: '/trackandtrace/motherplants',
  },
  { 
    label: 'Stecklinge', 
    stepLabel: 'STEP 3',
    icon: <ContentCutIcon />, 
    pathOld: '/trace/stecklinge',
    pathNew: '/trackandtrace/cuttings',
  },
  { 
    label: 'Blühpflanzen', 
    subtitle: 'aus Samen',
    stepLabel: 'STEP 4a',
    icon: <YardIcon />, 
    pathOld: '/trace/bluehpflanzen',
    pathNew: '/trackandtrace/floweringplants',
  },
  { 
    label: 'Blühpflanzen', 
    subtitle: 'aus Stecklingen',
    stepLabel: 'STEP 4b',
    icon: <OpacityIcon />, 
    pathOld: '/trace/bluehpflanzen-aus-stecklingen',
    pathNew: '/trackandtrace/floweringplants-from-cuttings',
  },
  { 
    label: 'Ernte', 
    stepLabel: 'STEP 5',
    icon: <AgricultureIcon />, 
    pathOld: '/trace/ernte',
    pathNew: '/trackandtrace/harvest',
  },
  { 
    label: 'Trocknung', 
    stepLabel: 'STEP 6',
    icon: <ThermostatIcon />, 
    pathOld: '/trace/trocknung',
    pathNew: '/trackandtrace/drying',
  },
  { 
    label: 'Verarbeitung', 
    stepLabel: 'STEP 7',
    icon: <ScienceIcon />, 
    pathOld: '/trace/verarbeitung',
    pathNew: '/trackandtrace/processing',
  },
  { 
    label: 'Laborkontrolle', 
    stepLabel: 'STEP 8',
    icon: <BiotechIcon />, 
    pathOld: '/trace/laborkontrolle',
    pathNew: '/trackandtrace/labcontrol',
  },
  { 
    label: 'Verpackung', 
    stepLabel: 'STEP 9',
    icon: <Inventory2Icon />, 
    pathOld: '/trace/verpackung',
    pathNew: '/trackandtrace/packaging',
  },
  { 
    label: 'Produktausgabe', 
    stepLabel: 'STEP 10',
    icon: <ShoppingBasketIcon />, 
    pathOld: '/trace/ausgabe',
    pathNew: '/trackandtrace/output',
  }
]

// Neue administrative Funktionen
const adminFunctions = [
  {
    label: 'Produktscan',
    icon: <QrCode2Icon />,
    pathOld: '/trace/produktscan',
    pathNew: '/trackandtrace/product-scan',
  },
  {
    label: 'Protokoll-Exporte',
    icon: <DescriptionIcon />,
    pathOld: '/trace/protokolle',
    pathNew: '/trackandtrace/protocols',
  },
  {
    label: 'Monitoring',
    icon: <DashboardIcon />,
    pathOld: '/trace/monitoring',
    pathNew: '/trackandtrace/monitoring',
  },
  {
    label: 'Compliance',
    icon: <VerifiedUserIcon />,
    pathOld: '/trace/compliance',
    pathNew: '/trackandtrace/compliance',
  }
]

export default function TrackTraceMenu({ collapsed = false }) {
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
    
    // Basis-Komponente für Listen-Items
    const menuItem = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          position: 'relative',
          borderRadius: '8px',
          height: collapsed ? '42px' : (item.subtitle ? '48px' : '42px'),
          color: active ? theme.palette.primary.main : theme.palette.text.primary,
          backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          padding: collapsed ? '8px' : undefined,
          justifyContent: collapsed ? 'center' : undefined,
          '&:hover': {
            backgroundColor: active 
              ? alpha(theme.palette.primary.main, 0.15) 
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
              backgroundColor: theme.palette.primary.main,
              borderRadius: '0 4px 4px 0'
            }
          }
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: active ? theme.palette.primary.main : theme.palette.text.secondary,
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
                  color: theme.palette.text.secondary,
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
              backgroundColor: theme.palette.primary.main,
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
          Track & Trace
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Verwaltung des Pflanzenlebenszyklus
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
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: theme.palette.text.secondary,
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
          Track & Trace System v1.2
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {renderHeader()}
      
      {/* Prozessschritte */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {processMenuItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderAdminSeparator()}
      
      {/* Administrative Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {adminMenuItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderFooter()}
    </>
  )
}