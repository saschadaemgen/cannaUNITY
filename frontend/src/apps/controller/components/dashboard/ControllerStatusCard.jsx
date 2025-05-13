// frontend/src/apps/controller/components/dashboard/ControllerStatusCard.jsx
import React from 'react';
import { Paper, Typography, Box, Chip, LinearProgress, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';

/**
 * Verbesserte Komponente zur Anzeige des Controller-Status (Bewässerung & Licht)
 * Mit einheitlichem Kartenstil und symmetrischer Darstellung
 */
const ControllerStatusCard = ({ 
  title = "CONTROLLER STATUS", 
  icon, 
  controllerType,
  controllers = [],
  colorTheme = "primary" 
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  
  // Berechnung der Statuswerte
  const totalControllers = controllers.length;
  const activeControllers = controllers.filter(c => c.is_active).length;
  const connectedControllers = controllers.filter(c => c.is_connected).length;
  
  // Prozentsätze berechnen
  const activePercentage = totalControllers ? (activeControllers / totalControllers) * 100 : 0;
  const connectedPercentage = totalControllers ? (connectedControllers / totalControllers) * 100 : 0;
  
  // Aktueller Verbrauch
  const currentUsage = controllers.reduce((sum, controller) => {
    return sum + (controller.current_usage || 0);
  }, 0);
  
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
        sx={{ 
          fontWeight: 'bold', 
          color: themeColor, 
          display: 'flex', 
          alignItems: 'center' 
        }}
      >
        <Box sx={{ mr: 1, display: 'flex' }}>
          {icon || <SettingsInputComponentIcon />}
        </Box>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {totalControllers} Controller konfiguriert
      </Typography>
      
      {/* Aktive Controller */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography variant="body2">
            Aktiv
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {activeControllers} von {totalControllers} ({activePercentage.toFixed(0)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={activePercentage}
          sx={{ 
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(themeColor, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: themeColor,
              borderRadius: 4,
            }
          }}
        />
      </Box>
      
      {/* Verbundene Controller */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography variant="body2">
            Verbunden
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {connectedControllers} von {totalControllers} ({connectedPercentage.toFixed(0)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={connectedPercentage}
          sx={{ 
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(themeColor, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: themeColor,
              borderRadius: 4,
            }
          }}
        />
      </Box>
      
      {/* Verbrauch heute */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px dashed ${alpha(themeColor, 0.2)}` }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Typography variant="body2">
            Verbrauch heute
          </Typography>
          <Chip 
            label={`${currentUsage.toFixed(1)} ${controllerType === 'irrigation' ? 'l' : 'kWh'}`}
            size="small"
            sx={{ 
              backgroundColor: alpha(themeColor, 0.1),
              color: themeColor,
              fontWeight: 'medium'
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default ControllerStatusCard;