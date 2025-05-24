// frontend/src/apps/logo_bridge/components/ActivityLog.jsx
import { List, ListItem, ListItemText, Chip, Box, Typography } from '@mui/material'
import { 
  ArrowUpward as WriteIcon,
  ArrowDownward as ReadIcon,
  PlayArrow as CommandIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

export default function ActivityLog({ logs }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'read': return <ReadIcon fontSize="small" />
      case 'write': return <WriteIcon fontSize="small" />
      case 'command': return <CommandIcon fontSize="small" />
      default: return null
    }
  }

  const getActionColor = (action, success) => {
    if (!success) return 'error'
    switch (action) {
      case 'read': return 'info'
      case 'write': return 'warning'
      case 'command': return 'secondary'
      default: return 'default'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLogDescription = (log) => {
    let description = ''
    
    if (log.variable_name) {
      description += log.variable_name
    }
    
    if (log.value?.value !== undefined) {
      if (log.action === 'write') {
        description += ` → ${log.value.value}`
      } else if (log.action === 'read') {
        description += ` = ${log.value.value}`
      }
    }
    
    if (log.value?.command) {
      description = `Befehl: ${log.value.command}`
    }
    
    if (log.error_message) {
      description += ` - ${log.error_message}`
    }
    
    return description || log.action
  }

  if (!logs || logs.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary" variant="body2">
          Noch keine Aktivitäten
        </Typography>
      </Box>
    )
  }

  return (
    <List dense sx={{ py: 0 }}>
      {logs.map((log, index) => (
        <ListItem 
          key={log.id || index}
          divider={index < logs.length - 1}
          sx={{ 
            px: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    icon={log.success ? getActionIcon(log.action) : <ErrorIcon />}
                    label={log.action}
                    size="small"
                    color={getActionColor(log.action, log.success)}
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                  <Typography variant="body2" component="span">
                    {log.device_name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(log.timestamp)}
                </Typography>
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {getLogDescription(log)}
                </Typography>
                {log.user_name && (
                  <Typography variant="caption" color="text.secondary">
                    Benutzer: {log.user_name}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  )
}