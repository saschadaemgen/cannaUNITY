// src/apps/taskmanager/components/TaskManagerMenu.jsx
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

// Icons für TaskManager
import DashboardIcon from '@mui/icons-material/Dashboard'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ScheduleIcon from '@mui/icons-material/Schedule'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import BarChartIcon from '@mui/icons-material/BarChart'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TimelineIcon from '@mui/icons-material/Timeline'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SettingsIcon from '@mui/icons-material/Settings'

// Haupt-Funktionen des TaskManagers
const mainFunctions = [
  { 
    label: 'Dashboard', 
    subtitle: 'Übersicht & Statistiken',
    icon: <DashboardIcon />, 
    path: '/taskmanager'
  },
  { 
    label: 'Aufgabenpläne', 
    subtitle: 'Zeitslots verwalten',
    icon: <ScheduleIcon />, 
    path: '/taskmanager/schedules'
  },
  { 
    label: 'Neue Aufgabe planen', 
    subtitle: 'Schnellerstellung',
    icon: <EventAvailableIcon />, 
    path: '/taskmanager/schedules/new'
  },
  { 
    label: 'Buchungen', 
    subtitle: 'Alle Reservierungen',
    icon: <BookmarkAddedIcon />, 
    path: '/taskmanager/bookings'
  }
]

// Verwaltungs-Funktionen
const managementFunctions = [
  {
    label: 'Aufgabentypen',
    subtitle: 'Kategorien verwalten',
    icon: <CategoryIcon />,
    path: '/taskmanager/task-types'
  },
  {
    label: 'Neuer Aufgabentyp',
    subtitle: 'Typ erstellen',
    icon: <AssignmentIcon />,
    path: '/taskmanager/task-types/new'
  },
  {
    label: 'Mitglieder-Dashboards',
    subtitle: 'Individuelle Ansichten',
    icon: <PeopleIcon />,
    path: '/taskmanager/members'
  }
]

// Analytics & Berichte
const analyticsFunctions = [
  {
    label: 'Auslastungs-Analyse',
    subtitle: 'Kapazitäten bewerten',
    icon: <BarChartIcon />,
    path: '/taskmanager/analytics/utilization'
  },
  {
    label: 'Mitglieder-Performance',
    subtitle: 'Leistungsübersicht',
    icon: <TrendingUpIcon />,
    path: '/taskmanager/analytics/performance'
  },
  {
    label: 'Zeittrends',
    subtitle: 'Historische Auswertung',
    icon: <TimelineIcon />,
    path: '/taskmanager/analytics/trends'
  },
  {
    label: 'Compliance-Berichte',
    subtitle: 'Rechtliche Nachweise',
    icon: <AssessmentIcon />,
    path: '/taskmanager/analytics/compliance'
  }
]

export default function TaskManagerMenu({ collapsed = false }) {
  const theme = useTheme()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/taskmanager') {
      return location.pathname === '/taskmanager' || location.pathname === '/taskmanager/dashboard'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
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
            <Typography 
              sx={{
                fontSize: '0.9rem',
                fontWeight: active ? 600 : 400,
                lineHeight: 1.2
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
      <ListItem key={item.path} disablePadding sx={{ mb: 0.5, px: collapsed ? 0.5 : 0 }}>
        {collapsed ? (
          <Tooltip 
            title={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {item.label}
                </Typography>
                {item.subtitle && (
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {item.subtitle}
                  </Typography>
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

  // Header-Rendering
  const renderHeader = () => {
    if (collapsed) {
      return null
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
          Task Manager
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Aufgaben & Zeitplanung
        </Typography>
      </Paper>
    )
  }
  
  // Trennlinien-Rendering
  const renderSeparator = (title) => {
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
              {title}
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
          Task Manager v2.0
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {renderHeader()}
      
      {/* Haupt-Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {mainFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderSeparator('Verwaltung')}
      
      {/* Verwaltungs-Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {managementFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderSeparator('Analytics & Berichte')}
      
      {/* Analytics-Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {analyticsFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderFooter()}
    </>
  )
}