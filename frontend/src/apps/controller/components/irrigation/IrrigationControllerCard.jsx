// frontend/src/apps/controller/components/irrigation/IrrigationControllerCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, Chip, IconButton, 
  LinearProgress, Divider, useTheme, alpha 
} from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RoomIcon from '@mui/icons-material/Room';

/**
 * Karte zur Darstellung eines Bewässerungscontrollers
 * 
 * @param {Object} props
 * @param {Object} props.controller - Controller-Datensatz
 * @param {boolean} props.selected - Ausgewählt-Status
 * @param {Function} props.onSelect - Callback bei Auswahl
 * @param {Function} props.onEmergencyStop - Callback für Notfall-Stopp
 * @param {Function} props.onEdit - Callback für Bearbeitung
 * @param {Function} props.onDelete - Callback für Löschung
 */
export default function IrrigationControllerCard({ 
  controller, 
  selected, 
  onSelect, 
  onEmergencyStop,
  onEdit,
  onDelete
}) {
  const theme = useTheme();
  
  // Verschiedene Status-Indikatoren
  const getStatusColor = () => {
    if (controller.emergency_stop) return theme.palette.error.main;
    if (!controller.is_active) return theme.palette.grey[500];
    if (controller.is_connected) return theme.palette.success.main;
    return theme.palette.warning.main;
  };
  
  const getStatusText = () => {
    if (controller.emergency_stop) return 'Notfall-Stopp';
    if (!controller.is_active) return 'Inaktiv';
    if (controller.is_connected) return 'Verbunden';
    return 'Nicht verbunden';
  };
  
  // Status des aktuellen Zeitplans
  const hasActiveSchedule = controller.status && controller.status.current_schedule;
  
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
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
        '&:hover': {
          backgroundColor: selected ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.grey[500], 0.05)
        }
      }}
      onClick={onSelect}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <OpacityIcon sx={{ mr: 1, color: getStatusColor() }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {controller.name}
          </Typography>
        </Box>
        
        <Box>
          <Chip 
            size="small"
            label={getStatusText()}
            color={controller.emergency_stop ? "error" : controller.is_active && controller.is_connected ? "success" : "default"}
            variant={controller.is_active ? "filled" : "outlined"}
            icon={controller.emergency_stop ? <StopIcon /> : controller.is_connected ? <CheckCircleIcon /> : <CancelIcon />}
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
            label={controller.pump_type_display} 
            size="small" 
            color="primary"
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
          {controller.flow_rate} l/min
        </Typography>
      </Box>
      
      {/* Status-Bereich */}
      <Divider sx={{ mb: 1.5 }} />
      
      {hasActiveSchedule ? (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Aktiver Zeitplan
            </Typography>
            <Typography variant="caption" fontWeight="medium" color="primary.main">
              {controller.status.current_schedule.day !== "Täglich" ? 
                `${controller.status.current_schedule.day}, ` : ""}
              {controller.status.current_schedule.start_time} Uhr
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LinearProgress 
              variant="determinate" 
              value={controller.status.current_schedule.progress || 0}
              sx={{ 
                flexGrow: 1, 
                mr: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            <Typography variant="caption" fontWeight="medium">
              {controller.status.current_schedule.volume} l
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Status
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {controller.is_active ? 'Bereit' : 'Deaktiviert'}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Gesamtverbrauch
        </Typography>
        <Typography variant="caption" fontWeight="medium">
          {parseFloat(controller.total_volume_used || 0).toFixed(1)} l
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
        
        {onDelete && (
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(controller);
            }}
            sx={{ mr: 1 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
        
        <IconButton 
          size="small" 
          color={controller.emergency_stop ? "primary" : "error"}
          onClick={(e) => {
            e.stopPropagation();
            onEmergencyStop(controller);
          }}
        >
          {controller.emergency_stop ? <PlayArrowIcon fontSize="small" /> : <StopIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Paper>
  );
}