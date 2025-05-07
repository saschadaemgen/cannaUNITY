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
  useTheme
} from '@mui/material'
import { NavLink } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'

// Hier die Menüpunkte aus der ursprünglichen Sidebar verwenden
const navItems = [
  { label: 'Startseite', icon: <HomeIcon />, path: '/' },
  // Andere allgemeine Menüpunkte aus Ihrer ursprünglichen Sidebar
]

export default function DefaultMenu() {
  const theme = useTheme()

  return (
    <>
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Navigation
        </Typography>
        <Divider />
      </Box>
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                color: theme.palette.text.primary,
                '&.active': {
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  )
}