// frontend/src/apps/controller/components/dashboard/ResourceMonitorCard.jsx
import React from 'react';
import { Paper, Typography, Box, LinearProgress, Divider, useTheme, alpha } from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import BoltIcon from '@mui/icons-material/Bolt';

/**
 * Verbesserte ResourceMonitor-Komponente mit einheitlichem Design
 */
const ResourceMonitorCard = ({
  title = "RESSOURCENMONITOR",
  resources = {
    waterToday: 0,
    energyToday: 0,
    waterTotal: 0,
    energyTotal: 0
  },
  colorTheme = "success"
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  
  // Destrukturierung für bessere Lesbarkeit
  const { waterToday, energyToday, waterTotal, energyTotal } = resources;
  
  // Prozentsätze für die Fortschrittsbalken berechnen
  const waterPercentage = waterTotal > 0 ? Math.min((waterToday / waterTotal) * 100, 100) : 0;
  const energyPercentage = energyTotal > 0 ? Math.min((energyToday / energyTotal) * 100, 100) : 0;
  
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
        Wasser- und Energieverbrauch
      </Typography>
      
      {/* Wasser-Fortschrittsbalken */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <OpacityIcon sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '1.2rem' }} />
            <Typography variant="body2">
              Wasser (heute)
            </Typography>
          </Box>
          <Typography variant="subtitle2" fontWeight="bold" color={theme.palette.primary.main}>
            {waterToday.toFixed(1)} l
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={waterPercentage}
          sx={{ 
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
              borderRadius: 4,
            }
          }}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
          {waterPercentage.toFixed(1)}% des Monatsverbrauchs
        </Typography>
      </Box>
      
      {/* Energie-Fortschrittsbalken */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BoltIcon sx={{ mr: 1, color: theme.palette.warning.main, fontSize: '1.2rem' }} />
            <Typography variant="body2">
              Energie (heute)
            </Typography>
          </Box>
          <Typography variant="subtitle2" fontWeight="bold" color={theme.palette.warning.main}>
            {energyToday.toFixed(1)} kWh
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={energyPercentage}
          sx={{ 
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.warning.main,
              borderRadius: 4,
            }
          }}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
          {energyPercentage.toFixed(1)}% des Monatsverbrauchs
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Gesamtverbrauch */}
      <Box sx={{ 
        mt: 'auto',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Wasser gesamt
          </Typography>
          <Typography variant="body2" fontWeight="medium" color={theme.palette.primary.main}>
            {waterTotal.toFixed(1)} l
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Energie gesamt
          </Typography>
          <Typography variant="body2" fontWeight="medium" color={theme.palette.warning.main}>
            {energyTotal.toFixed(1)} kWh
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ResourceMonitorCard;