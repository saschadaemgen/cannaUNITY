// src/apps/trackandtrace/components/TrackTraceMenu.jsx
import React, { useState, useRef, useEffect } from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Box,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'

// Icons
import GrassIcon from '@mui/icons-material/Grass'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import ScienceIcon from '@mui/icons-material/Science'
import BiotechIcon from '@mui/icons-material/Biotech'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket'
import YardIcon from '@mui/icons-material/Yard'
import OpacityIcon from '@mui/icons-material/Opacity'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import DescriptionIcon from '@mui/icons-material/Description'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import BarChartIcon from '@mui/icons-material/BarChart'

// Prozessschritte
const processSteps = [
  { 
    label: 'Samen', 
    stepLabel: 'STEP 1',
    icon: <GrassIcon />, 
    pathOld: '/trace/samen',
    pathNew: '/trackandtrace/seeds',
    actions: [
      { icon: <AddCircleOutlineIcon />, tooltip: 'Neuer Samen Einkauf', path: '/trace/samen/neu', color: 'success' },
      { icon: <RemoveRedEyeIcon />, tooltip: 'Übersicht', path: '/trace/samen' },
      { icon: <BarChartIcon />, tooltip: 'Statistiken', path: '/trace/samen/stats' }
    ]
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

// Administrative Funktionen
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

export default function TrackTraceMenu() {
  const theme = useTheme()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)
  const [mouseInActionBar, setMouseInActionBar] = useState(false)
  const [actionBarPosition, setActionBarPosition] = useState({ top: 0 })
  const itemRefs = useRef({})
  
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

  // Verbesserte Hover-Logik
  const handleItemMouseEnter = (path, event) => {
    setHoveredItem(path)
    // Berechne Position der Action Bar
    if (itemRefs.current[path]) {
      const rect = itemRefs.current[path].getBoundingClientRect()
      setActionBarPosition({ top: rect.top })
    }
  }

  const handleItemMouseLeave = (path) => {
    // Nur schließen wenn wir nicht in der Action Bar sind
    setTimeout(() => {
      if (!mouseInActionBar) {
        setHoveredItem(null)
      }
    }, 100)
  }

  const handleActionBarMouseEnter = () => {
    setMouseInActionBar(true)
  }

  const handleActionBarMouseLeave = () => {
    setMouseInActionBar(false)
    setHoveredItem(null)
  }

  // Funktion zum Rendern eines Menüelements
  const renderMenuItem = (item, index) => {
    const active = isActive(item.path)
    const isHovered = hoveredItem === item.path
    const hasActions = item.actions && item.actions.length > 0
    
    return (
      <ListItem 
        key={item.path} 
        disablePadding 
        sx={{ 
          position: 'relative',
          height: '48px',
        }}
        ref={(el) => itemRefs.current[item.path] = el}
        onMouseEnter={(e) => handleItemMouseEnter(item.path, e)}
        onMouseLeave={() => handleItemMouseLeave(item.path)}
      >
        {/* Icon Button - OHNE TOOLTIP! */}
        <ListItemButton
          component={NavLink}
          to={item.path}
          sx={{
            height: '48px',
            width: '64px',
            justifyContent: 'center',
            color: active ? theme.palette.primary.main : theme.palette.text.secondary,
            backgroundColor: active 
              ? alpha(theme.palette.primary.main, 0.08)
              : 'transparent',
            borderRadius: 0, // KEINE RUNDUNG!
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: 0, // KEINE RUNDUNG!
            },
            // Aktiver Indikator als linker Balken
            '&::before': active ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: '60%',
              width: '3px',
              backgroundColor: theme.palette.primary.main,
            } : {},
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: active ? theme.palette.primary.main : theme.palette.text.secondary,
              minWidth: 0,
              justifyContent: 'center'
            }}
          >
            {item.icon}
          </ListItemIcon>
        </ListItemButton>

        {/* Action Bar mit solidem Hintergrund */}
        {hasActions && isHovered && (
          <Box
            sx={{
              position: 'fixed',
              left: '64px',
              top: actionBarPosition.top || 0,
              display: 'flex',
              alignItems: 'center',
              height: '48px',
              gap: 0.5,
              // Weißer/Dunkler Hintergrund je nach Theme
              backgroundColor: theme.palette.background.paper,
              // Grünes Overlay darüber
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                pointerEvents: 'none',
              },
              px: 1.5,
              zIndex: 9999,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              borderLeft: 'none',
              // Smooth slide-in Animation
              animation: 'slideIn 0.15s ease-out',
              '@keyframes slideIn': {
                from: {
                  transform: 'translateX(-10px)',
                  opacity: 0,
                },
                to: {
                  transform: 'translateX(0)',
                  opacity: 1,
                }
              },
              // Unsichtbare Erweiterung für bessere Hover-Detection
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-10px',
                top: 0,
                bottom: 0,
                width: '10px',
              }
            }}
            onMouseEnter={handleActionBarMouseEnter}
            onMouseLeave={handleActionBarMouseLeave}
          >
            {item.actions.map((action, actionIndex) => (
              <Tooltip key={actionIndex} title={action.tooltip} placement="top">
                <IconButton
                  component={action.path ? NavLink : 'button'}
                  to={action.path}
                  size="small"
                  sx={{
                    width: '36px',
                    height: '36px',
                    color: action.color ? theme.palette[action.color].main : theme.palette.text.primary,
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    }
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}
      </ListItem>
    )
  }

  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '64px',
        display: 'flex', 
        flexDirection: 'column',
      }}
    >
      {/* Prozessschritte */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ p: 0 }}>
          {processMenuItems.map((item, index) => renderMenuItem(item, index))}
        </List>
        
        {/* Admin Separator */}
        <Divider sx={{ my: 1 }} />
        
        {/* Administrative Funktionen */}
        <List sx={{ p: 0 }}>
          {adminMenuItems.map((item, index) => renderMenuItem(item, index))}
        </List>
      </Box>
    </Box>
  )
}