// frontend/src/apps/rooms/components/RoomMenu.jsx
import React from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import DesignServicesIcon from '@mui/icons-material/DesignServices'

const menuItems = [
  {
    label: 'Übersicht',
    icon: <DashboardIcon />,
    path: '/rooms',
    color: '#2196f3'
  },
  {
    label: 'Raumliste',
    icon: <MeetingRoomIcon />,
    path: '/rooms',
    color: '#4caf50'
  },
  {
    label: 'Neuer Raum',
    icon: <AddIcon />,
    path: '/rooms/new',
    color: '#ff9800'
  },
  {
    label: 'Element-Typen',
    icon: <CategoryIcon />,
    path: '/rooms/item-types',
    color: '#9c27b0'
  },
  {
    label: 'Raumdesigner',
    icon: <DesignServicesIcon />,
    path: '/rooms/designer-info',
    color: '#f44336',
    disabled: true
  }
]

export default function RoomMenu({ collapsed = false }) {
  const theme = useTheme()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/rooms' && location.pathname === '/rooms/') ||
           (path === '/rooms/item-types' && location.pathname.startsWith('/rooms/item-types'))
  }

  const renderMenuItem = (item) => {
    const active = isActive(item.path)
    const itemColor = item.color || theme.palette.primary.main
    
    const menuItem = (
      <ListItemButton
        component={item.disabled ? 'div' : NavLink}
        to={item.disabled ? undefined : item.path}
        disabled={item.disabled}
        sx={{
          borderRadius: '8px',
          mb: 0.5,
          color: active ? itemColor : theme.palette.text.primary,
          backgroundColor: active ? alpha(itemColor, 0.1) : 'transparent',
          '&:hover': {
            backgroundColor: active 
              ? alpha(itemColor, 0.15) 
              : alpha(theme.palette.action.hover, 0.08)
          },
          '&.Mui-disabled': {
            opacity: 0.5
          },
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1 : 2,
          position: 'relative',
          '&::before': active ? {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '60%',
            width: '3px',
            backgroundColor: itemColor,
            borderRadius: '0 3px 3px 0'
          } : {}
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: active ? itemColor : theme.palette.text.secondary,
            minWidth: collapsed ? 0 : 40
          }}
        >
          {item.icon}
        </ListItemIcon>
        
        {!collapsed && (
          <ListItemText 
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: active ? 600 : 400
            }}
          />
        )}
        
        {active && !collapsed && (
          <Box 
            sx={{ 
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: itemColor,
              ml: 'auto'
            }}
          />
        )}
      </ListItemButton>
    )
    
    return (
      <ListItem key={item.label} disablePadding sx={{ px: collapsed ? 0.5 : 1 }}>
        {collapsed ? (
          <Tooltip title={item.label} placement="right" arrow>
            {menuItem}
          </Tooltip>
        ) : menuItem}
      </ListItem>
    )
  }

  return (
    <Box>
      {!collapsed && (
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, 
            py: 1, 
            display: 'block',
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: '0.08em'
          }}
        >
          Raumverwaltung
        </Typography>
      )}
      
      <List sx={{ px: collapsed ? 0 : 1 }}>
        {menuItems.map(renderMenuItem)}
      </List>
      
      {!collapsed && (
        <Box sx={{ 
          px: 3, 
          py: 2, 
          mt: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.disabled,
              display: 'block',
              lineHeight: 1.4
            }}
          >
            Tipp: Erstelle zuerst einen Raum, um den Designer zu verwenden
          </Typography>
        </Box>
      )}
    </Box>
  )
}