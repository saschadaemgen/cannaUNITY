// frontend/src/apps/controller/components/dashboard/SystemStatusCard.jsx
import React from 'react';
import { Paper, Typography, Box, Chip, Divider, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Verbesserte SystemStatus-Komponente mit einheitlichem Kartenstil
 */
const SystemStatusCard = ({
  title = "SYSTEMSTATUS",
  systemStatus = {
    uptime: "99.8%",
    lastSync: new Date().toISOString(),
    mqttStatus: "Verbunden",
    responseTime: "45ms",
    warnings: 0
  },
  colorTheme = "info"
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  
  // Destrukturierung für bessere Lesbarkeit
  const { uptime, lastSync, mqttStatus, responseTime, warnings } = systemStatus;
  
  // Formatiertes Datum für den letzten Sync
  const formattedLastSync = lastSync ? 
    format(parseISO(lastSync), 'dd.MM.yyyy HH:mm:ss', { locale: de }) : 
    'Unbekannt';
  
  // Hilfsfunktion für Antwortzeit-Farbe
  const getResponseTimeColor = () => {
    const time = parseInt(responseTime);
    if (isNaN(time)) return 'default';
    if (time < 100) return 'success';
    if (time < 300) return 'warning';
    return 'error';
  };
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height: '100%',
        borderRadius: 2,
        backgroundImage: `linear-gradient(to bottom, ${alpha(themeColor, 0.04)}, ${alpha(themeColor, 0.01)})`,
        border: `1px solid ${alpha(themeColor, 0.1)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        sx={{ fontWeight: 'bold', color: themeColor, display: 'flex', alignItems: 'center' }}
      >
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aktuelle Betriebszustände
      </Typography>
      
      {/* Systemverfügbarkeit */}
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
      
      {/* MQTT-Status */}
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
      
      {/* Antwortzeit */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Antwortzeit
        </Typography>
        <Chip 
          icon={<AccessTimeIcon fontSize="small" />} 
          label={responseTime} 
          color={getResponseTimeColor()} 
          size="small" 
          variant="outlined" 
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Letzte Synchronisation */}
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
      
      {/* Aktive Warnungen */}
      <Box 
        sx={{ 
          mt: 'auto', 
          pt: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px dashed ${alpha(themeColor, 0.2)}`
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
};

export default SystemStatusCard;