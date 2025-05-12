// frontend/src/apps/controller/components/light/LightControllerCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, Chip, IconButton, 
  LinearProgress, Divider, useTheme, alpha 
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RoomIcon from '@mui/icons-material/Room';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import BrightnessLowIcon from '@mui/icons-material/BrightnessLow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';

/**
 * Kartenkomponente für Lichtcontroller
 * 
 * @param {Object} props
 * @param {Object} props.controller - Der Lichtcontroller
 * @param {boolean} props.selected - Ob die Karte ausgewählt ist
 * @param {function} props.onSelect - Callback bei Auswahl der Karte
 * @param {function} props.onEmergencyOff - Callback für Notfall-Aus-Aktion
 * @param {function} props.onEdit - Callback für Bearbeiten-Aktion
 */
export default function LightControllerCard({ 
  controller, 
  selected, 
  onSelect, 
  onEmergencyOff,
  onEdit
}) {
  const theme = useTheme();
  
  // Verschiedene Status-Indikatoren
  const getStatusColor = () => {
    if (controller.emergency_off) return theme.palette.error.main;
    if (!controller.is_active) return theme.palette.grey[500];
    if (controller.is_connected) return theme.palette.success.main;
    return theme.palette.warning.main;
  };
  
  const getStatusText = () => {
    if (controller.emergency_off) return 'Notfall-Aus';
    if (!controller.is_active) return 'Inaktiv';
    if (controller.is_connected) return 'Verbunden';
    return 'Nicht verbunden';
  };
  
  // Lichtintensität
  const getLightIntensity = () => {
    if (controller.status && controller.status.current_light_state) {
      return controller.status.current_light_state.intensity || 0;
    }
    return 0;
  };
  
  // Lichtbetriebsstatus
  const isLightOn = () => {
    if (controller.status && controller.status.current_light_state) {
      return controller.status.current_light_state.is_on || false;
    }
    return false;
  };
  
  return (
    <Paper 
      variant={selected ? "elevation" : "outlined"}
      elevation={selected ? 2 : 0}
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        cursor: 'pointer',
        borderLeft: `4px solid ${getStatusColor()}`,
        transition: 'all 0.2s ease-in-out',
        backgroundColor: selected ? alpha(theme.palette.warning.main, 0.05) : 'transparent',
        '&:hover': {
          backgroundColor: selected ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.grey[500], 0.05)
        }
      }}
      onClick={onSelect}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunnyIcon sx={{ mr: 1, color: getStatusColor() }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {controller.name}
          </Typography>
        </Box>
        
        <Box>
          <Chip 
            size="small"
            label={getStatusText()}
            color={controller.emergency_off ? "error" : controller.is_active && controller.is_connected ? "success" : "default"}
            variant={controller.is_active ? "filled" : "outlined"}
            icon={controller.emergency_off ? <StopIcon /> : controller.is_connected ? <CheckCircleIcon /> : <CancelIcon />}
          />
        </Box>
      </Box>
      
      {controller.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
          {controller.description}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Chip 
            label={controller.light_type_display} 
            size="small" 
            color="warning"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          
          {controller.room && (
            <Chip 
              icon={<RoomIcon fontSize="small" />}
              label={controller.room.name} 
              size="small" 
              color="default"
              variant="outlined"
            />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {controller.max_power} W
        </Typography>
      </Box>
      
      {/* Status-Bereich */}
      <Divider sx={{ mb: 1.5 }} />
      
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Lichtstatus
          </Typography>
          <Typography variant="caption" fontWeight="medium" color={isLightOn() ? "warning.main" : "text.secondary"}>
            {isLightOn() ? `${getLightIntensity()}% Intensität` : "Aus"}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LinearProgress 
            variant="determinate" 
            value={getLightIntensity()}
            sx={{ 
              flexGrow: 1, 
              mr: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isLightOn() ? theme.palette.warning.main : theme.palette.grey[400]
              }
            }}
          />
          <Box>
            {isLightOn() ? (
              <BrightnessHighIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
            ) : (
              <BrightnessLowIcon fontSize="small" sx={{ color: theme.palette.grey[400] }} />
            )}
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
          <Typography variant="caption" color="text.secondary">
            Zyklustyp
          </Typography>
        </Box>
        <Typography variant="caption" fontWeight="medium">
          {controller.cycle_type_display}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
          <Typography variant="caption" color="text.secondary">
            Tag im Zyklus
          </Typography>
        </Box>
        <Typography variant="caption" fontWeight="medium">
          Tag {controller.current_day_in_cycle}
        </Typography>
      </Box>
      
      {/* Aktionen */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mt: 2,
        opacity: 0.7,
        transition: 'opacity 0.2s',
        '&:hover': {
          opacity: 1
        }
      }}>
        {onEdit && (
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(controller);
            }}
            sx={{ mr: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        
        <IconButton 
          size="small" 
          color={controller.emergency_off ? "warning" : "error"}
          onClick={(e) => {
            e.stopPropagation();
            onEmergencyOff(controller);
          }}
        >
          {controller.emergency_off ? <PlayArrowIcon fontSize="small" /> : <StopIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Paper>
  );
}