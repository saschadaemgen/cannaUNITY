// frontend/src/apps/controller/components/irrigation/IrrigationControllerCard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Chip, IconButton, 
  LinearProgress, Divider, useTheme, alpha, Zoom, Fade
} from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RoomIcon from '@mui/icons-material/Room';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import InfoIcon from '@mui/icons-material/Info';

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
  const greenPalette = {
    main: theme.palette.success.main,
    light: theme.palette.success.light,
    dark: theme.palette.success.dark
  };
  
  // Animation für aktive Bewässerung
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Wenn der Controller gerade bewässert, Animation starten
    if (controller.status && controller.status.is_watering) {
      setAnimate(true);
    } else {
      setAnimate(false);
    }
  }, [controller]);
  
  // Verschiedene Status-Indikatoren
  const getStatusColor = () => {
    if (controller.emergency_stop) return theme.palette.error.main;
    if (!controller.is_active) return theme.palette.grey[500];
    if (controller.is_connected) return greenPalette.main;
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
    <Zoom in={true} style={{ transitionDelay: '80ms' }}>
      <Paper 
        variant={selected ? "elevation" : "outlined"}
        elevation={selected ? 3 : 0}
        sx={{ 
          p: 2.5, 
          mb: 2, 
          borderRadius: 2,
          cursor: 'pointer',
          borderLeft: `4px solid ${
            controller.emergency_stop ? theme.palette.error.main :
            controller.is_active ? 
              (controller.is_connected ? greenPalette.main : theme.palette.warning.main) :
              theme.palette.grey[400]
          }`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: selected ? 'scale(1.01)' : 'scale(1)',
          backgroundColor: selected ? 
            alpha(greenPalette.main, 0.05) : 
            'transparent',
          '&:hover': {
            backgroundColor: selected ? 
              alpha(greenPalette.main, 0.08) : 
              alpha(greenPalette.main, 0.02),
            boxShadow: `0 4px 12px ${alpha(greenPalette.main, 0.15)}`
          }
        }}
        onClick={onSelect}
      >
        {/* Wasser-Animation bei aktiver Bewässerung */}
        {animate && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}>
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  left: `${20 + i * 15}%`,
                  top: 0,
                  width: 4,
                  height: 10,
                  backgroundColor: alpha(greenPalette.main, 0.8),
                  borderRadius: '50%',
                  animation: `dropAnimation 1.5s infinite ${i * 0.3}s`,
                  '@keyframes dropAnimation': {
                    '0%': { top: 0, opacity: 0 },
                    '50%': { opacity: 1 },
                    '100%': { top: '100%', opacity: 0 }
                  }
                }}
              />
            ))}
          </Box>
        )}
      
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 1.5 
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha(getStatusColor(), 0.08),
            borderRadius: 1.5,
            py: 0.5,
            px: 1
          }}>
            {controller.status && controller.status.is_watering ? (
              <WaterDropIcon 
                sx={{ 
                  mr: 1, 
                  color: getStatusColor(),
                  animation: 'pulse 1.5s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.6, transform: 'scale(0.9)' },
                    '50%': { opacity: 1, transform: 'scale(1.1)' },
                    '100%': { opacity: 0.6, transform: 'scale(0.9)' }
                  }
                }} 
              />
            ) : (
              <OpacityIcon sx={{ mr: 1, color: getStatusColor() }} />
            )}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'medium',
                color: controller.status && controller.status.is_watering ? 
                  greenPalette.dark : 'text.primary'
              }}
            >
              {controller.name}
            </Typography>
          </Box>
          
          <Box>
            <Chip 
              size="small"
              label={getStatusText()}
              color={
                controller.emergency_stop ? "error" : 
                controller.is_active && controller.is_connected ? "success" : "default"
              }
              variant={controller.is_active ? "filled" : "outlined"}
              icon={
                controller.emergency_stop ? <StopIcon /> : 
                controller.is_connected ? <CheckCircleIcon /> : <CancelIcon />
              }
              sx={{ 
                fontWeight: 'medium', 
                boxShadow: controller.is_active ? `0 2px 4px ${alpha(getStatusColor(), 0.25)}` : 'none'
              }}
            />
          </Box>
        </Box>
        
        {controller.description && (
          <Fade in={true}>
            <Box 
              sx={{ 
                mb: 2, 
                p: 1, 
                borderRadius: 1, 
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <InfoIcon sx={{ fontSize: '0.9rem', mr: 0.5, mt: 0.2, color: theme.palette.info.main }} />
                {controller.description}
              </Typography>
            </Box>
          </Fade>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Box>
            <Chip 
              label={controller.pump_type_display} 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ 
                mr: 1,
                borderRadius: 4,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
            
            {controller.room && (
              <Chip 
                icon={<RoomIcon fontSize="small" />}
                label={controller.room.name} 
                size="small" 
                color="default"
                variant="outlined"
                sx={{ 
                  borderRadius: 4,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Box>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.default, 0.7),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            {controller.flow_rate} l/min
          </Typography>
        </Box>
        
        {/* Status-Bereich */}
        <Divider sx={{ 
          mb: 2,
          borderColor: alpha(greenPalette.main, 0.2)
        }} />
        
        {hasActiveSchedule ? (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontWeight: 'medium' }}
              >
                <Box component="span" sx={{ 
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: greenPalette.main,
                  mr: 1,
                  verticalAlign: 'middle',
                  animation: controller.status.is_watering ? 'blink 1.5s infinite' : 'none',
                  '@keyframes blink': {
                    '0%': { opacity: 0.3 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.3 }
                  }
                }} />
                Aktiver Zeitplan
              </Typography>
              <Typography 
                variant="caption" 
                fontWeight="medium" 
                color={greenPalette.main}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor: alpha(greenPalette.main, 0.1)
                }}
              >
                {controller.status.current_schedule.day !== "Täglich" ? 
                  `${controller.status.current_schedule.day}, ` : ""}
                {controller.status.current_schedule.start_time} Uhr
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1, mr: 1.5, position: 'relative' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={controller.status.current_schedule.progress || 0}
                  sx={{ 
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: alpha(greenPalette.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      backgroundColor: controller.status.is_watering ? 
                        greenPalette.main : 
                        alpha(greenPalette.main, 0.7)
                    }
                  }}
                />
                {controller.status.is_watering && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 5,
                    animation: 'progressPulse 2s infinite ease-in-out',
                    '@keyframes progressPulse': {
                      '0%': { boxShadow: `0 0 0 0 ${alpha(greenPalette.main, 0.7)}` },
                      '70%': { boxShadow: `0 0 0 5px ${alpha(greenPalette.main, 0)}` },
                      '100%': { boxShadow: `0 0 0 0 ${alpha(greenPalette.main, 0)}` }
                    }
                  }} />
                )}
              </Box>
              <Typography 
                variant="caption" 
                fontWeight="medium"
                sx={{
                  color: controller.status.is_watering ? greenPalette.dark : 'text.primary',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <WaterDropIcon 
                  sx={{ 
                    mr: 0.5, 
                    fontSize: '0.9rem',
                    color: greenPalette.main,
                    opacity: controller.status.is_watering ? 1 : 0.7
                  }} 
                />
                {controller.status.current_schedule.volume} l
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              p: 1,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.default, 0.5)
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography 
              variant="caption" 
              color={controller.is_active ? greenPalette.main : 'text.secondary'}
              fontWeight={controller.is_active ? 'medium' : 'normal'}
            >
              {controller.is_active ? 'Bereit' : 'Deaktiviert'}
            </Typography>
          </Box>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.background.default, 0.5)
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Gesamtverbrauch
          </Typography>
          <Typography 
            variant="caption" 
            fontWeight="medium"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.info.dark
            }}
          >
            <OpacityIcon 
              sx={{ 
                mr: 0.5, 
                fontSize: '0.9rem',
                color: theme.palette.info.main
              }} 
            />
            {parseFloat(controller.total_volume_used || 0).toFixed(1)} l
          </Typography>
        </Box>
        
        {/* Aktionen */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mt: 2,
          pt: 1,
          borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
          opacity: 0.7,
          transition: 'opacity 0.2s, transform 0.2s',
          '&:hover': {
            opacity: 1,
            transform: 'translateY(-2px)'
          }
        }}>
          {onEdit && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(controller);
              }}
              sx={{ 
                mr: 1,
                color: greenPalette.main,
                backgroundColor: alpha(greenPalette.main, 0),
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(greenPalette.main, 0.1)
                }
              }}
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
              sx={{ 
                mr: 1,
                backgroundColor: alpha(theme.palette.error.main, 0),
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                }
              }}
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
            sx={{ 
              backgroundColor: alpha(
                controller.emergency_stop ? theme.palette.primary.main : theme.palette.error.main,
                0.05
              ),
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(
                  controller.emergency_stop ? theme.palette.primary.main : theme.palette.error.main,
                  0.1
                ),
                transform: 'scale(1.1)'
              }
            }}
          >
            {controller.emergency_stop ? <PlayArrowIcon fontSize="small" /> : <StopIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Paper>
    </Zoom>
  );
}