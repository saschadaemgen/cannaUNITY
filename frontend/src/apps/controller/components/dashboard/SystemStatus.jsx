// frontend/src/apps/controller/components/dashboard/SystemStatus.jsx
import React from 'react';
import { Paper, Typography, Box, Chip, Divider, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SystemStatus({
  uptime,
  lastSync,
  mqttStatus,
  responseTime,
  warnings
}) {
  const theme = useTheme();
  
  // Formatiertes Datum/Zeit für den letzten Sync
  const formattedLastSync = lastSync ? 
    format(parseISO(lastSync), 'dd.MM.yyyy HH:mm:ss', { locale: de }) : 
    'Unbekannt';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height: '100%',
        borderRadius: 2,
        backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.info.main, 0.04)}, ${alpha(theme.palette.info.main,.01)})`,
        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        sx={{ fontWeight: 'bold', color: theme.palette.info.main, display: 'flex', alignItems: 'center' }}
      >
        SYSTEMSTATUS
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aktuelle Betriebszustände
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Systemverfügbarkeit
        </Typography>
        <Chip 
          icon={<CheckCircleIcon fontSize="small" />} 
          label={uptime} 
          color="success" 
          size="small" 
          variant="outlined" 
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          MQTT-Status
        </Typography>
        <Chip 
          icon={<CheckCircleIcon fontSize="small" />} 
          label={mqttStatus} 
          color={mqttStatus === 'Verbunden' ? 'success' : 'error'} 
          size="small" 
          variant="outlined" 
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Antwortzeit
        </Typography>
        <Chip 
          icon={<AccessTimeIcon fontSize="small" />} 
          label={responseTime} 
          color={
            parseInt(responseTime) < 100 ? 'success' : 
            parseInt(responseTime) < 300 ? 'warning' : 'error'
          } 
          size="small" 
          variant="outlined" 
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Letzte Synchronisation
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <SyncIcon fontSize="small" color="info" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          <Typography variant="caption" color="text.secondary">
            {formattedLastSync}
          </Typography>
        </Box>
      </Box>
      
      <Box 
        sx={{ 
          mt: 'auto', 
          pt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`
        }}
      >
        <Typography variant="body2">
          Aktive Warnungen
        </Typography>
        <Chip 
          icon={<WarningIcon fontSize="small" />} 
          label={warnings} 
          color={warnings > 0 ? 'warning' : 'success'} 
          size="small" 
        />
      </Box>
    </Paper>
  );
}