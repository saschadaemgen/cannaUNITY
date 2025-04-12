import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Startseite', icon: <HomeIcon />, path: '/' },
]

export default function Sidebar() {
  const theme = useTheme()

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
      }}
    >
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
                  color: theme.palette.success.main,
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
    </Box>
  )
}
