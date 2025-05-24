// frontend/src/apps/logo_bridge/components/DeviceCard.jsx
import { Card, CardContent, Typography, Box, Chip, IconButton, Menu, MenuItem } from '@mui/material'
import { 
  Circle as CircleIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  PowerOff as PowerOffIcon,
  Memory as MemoryIcon,
  Code as CodeIcon
} from '@mui/icons-material'
import { useState } from 'react'

export default function DeviceCard({ 
  device, 
  selected, 
  onSelect, 
  onTest, 
  onDisconnect,
  onEdit,
  onManageVariables,
  onManageCommands
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const isConnected = device.is_connected || false

  const handleMenuOpen = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (action) => {
    handleMenuClose()
    action()
  }

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box flex={1}>
            <Typography variant="h6" component="div" gutterBottom>
              {device.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {device.ip_address}:{device.port}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Chip
              icon={<CircleIcon sx={{ fontSize: 12 }} />}
              label={isConnected ? 'Verbunden' : 'Getrennt'}
              color={isConnected ? 'success' : 'default'}
              size="small"
              sx={{ height: 24 }}
            />
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation()
                onTest()
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Protokoll:
            </Typography>
            <Chip 
              label={device.protocol.toUpperCase()} 
              size="small" 
              variant="outlined"
              sx={{ height: 20 }}
            />
          </Box>
          
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Box display="flex" gap={2}>
              <Typography variant="body2" color="text.secondary">
                <MemoryIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                {device.variables_count || 0} Variablen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <CodeIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                {device.commands_count || 0} Befehle
              </Typography>
            </Box>
          </Box>

          {device.last_connection && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Letzte Verbindung: {new Date(device.last_connection).toLocaleString('de-DE')}
            </Typography>
          )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => handleAction(onEdit)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Bearbeiten
          </MenuItem>
          <MenuItem onClick={() => handleAction(onManageVariables)}>
            <MemoryIcon fontSize="small" sx={{ mr: 1 }} />
            Variablen verwalten
          </MenuItem>
          <MenuItem onClick={() => handleAction(onManageCommands)}>
            <CodeIcon fontSize="small" sx={{ mr: 1 }} />
            Befehle verwalten
          </MenuItem>
          {isConnected && (
            <MenuItem onClick={() => handleAction(onDisconnect)}>
              <PowerOffIcon fontSize="small" sx={{ mr: 1 }} />
              Trennen
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  )
}