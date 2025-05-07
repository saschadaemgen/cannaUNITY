// frontend/src/apps/members/components/MemberSidebar.jsx
import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Typography,
  Divider
} from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'

// Icons importieren
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import BadgeIcon from '@mui/icons-material/Badge'
import GroupsIcon from '@mui/icons-material/Groups'
import SettingsIcon from '@mui/icons-material/Settings'

const memberMenuItems = [
  { 
    label: 'Mitgliederliste', 
    icon: <PeopleIcon />, 
    path: '/mitglieder' 
  },
  { 
    label: 'Neues Mitglied', 
    icon: <PersonAddIcon />, 
    path: '/mitglieder/neu' 
  },
  { 
    label: 'Ausweiskarten', 
    icon: <BadgeIcon />, 
    path: '/mitglieder/cards' 
  },
  { 
    label: 'Gruppenverwaltung', 
    icon: <GroupsIcon />, 
    path: '/mitglieder/gruppen' 
  },
  { 
    label: 'Einstellungen', 
    icon: <SettingsIcon />, 
    path: '/mitglieder/einstellungen' 
  }
]

export default function MemberSidebar() {
  const theme = useTheme()
  const location = useLocation()

  return (
    <Box
      sx={{
        width: 240,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
        borderRight: '1px solid',
        borderColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[300],
        pt: 2,
        height: '100%'
      }}
    >
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Mitgliederverwaltung
        </Typography>
        <Divider />
      </Box>
      
      <List sx={{ px: 1 }}>
        {memberMenuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                color: theme.palette.text.primary,
                borderRadius: '4px',
                '&.active': {
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                minWidth: '40px' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontSize: '0.85rem',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}