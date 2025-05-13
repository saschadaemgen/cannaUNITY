// frontend/src/apps/controller/components/dashboard/ActiveControllersCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, useTheme, alpha, 
  Grid, Card, CardContent, LinearProgress, Tooltip
} from '@mui/material';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RoomIcon from '@mui/icons-material/Room';
import { useNavigate } from 'react-router-dom';

/**
 * Verbesserte Komponente zur Anzeige aktiver Controller
 */
const ActiveControllersCard = ({ 
  title = "AKTIVE CONTROLLER",
  controllers = [],
  onControllerClick,
  colorTheme = "secondary"
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  const navigate = useNavigate();
  
  // Hilfsfunktion: Controller-Typ-Icon
  const getControllerIcon = (controller) => {
    const controllerType = controller.controller_type || 
                          (controller.pump_type ? 'irrigation' : 
                           controller.light_type ? 'light' : 'unknown');
    
    switch (controllerType) {
      case 'irrigation':
        return <OpacityIcon sx={{ color: theme.palette.primary.main }} />;
      case 'light':
        return <WbSunnyIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return <SettingsInputComponentIcon sx={{ color: theme.palette.action.active }} />;
    }
  };
  
  // Hilfsfunktion: Status-Chip-Icon und Farbe
  const getStatusInfo = (controller) => {
    // Prüfen ob Notfälle vorliegen
    if (controller.emergency_stop || controller.emergency_off) {
      return {
        icon: <WarningIcon fontSize="small" />,
        label: "Notfall",
        color: theme.palette.error.main
      };
    }
    
    // Verbindungsstatus
    if (!controller.is_connected) {
      return {
        icon: <HourglassEmptyIcon fontSize="small" />,
        label: "Offline",
        color: theme.palette.text.disabled
      };
    }
    
    // Aktiv und verbunden
    if (controller.is_active) {
      return {
        icon: <CheckCircleIcon fontSize="small" />,
        label: "Aktiv",
        color: theme.palette.success.main
      };
    }
    
    // Fallback
    return {
      icon: <ErrorIcon fontSize="small" />,
      label: "Inaktiv",
      color: theme.palette.text.secondary
    };
  };
  
  // Hilfsfunktion: Controller-Route bestimmen
  const getControllerRoute = (controller) => {
    const controllerType = controller.controller_type || 
                          (controller.pump_type ? 'irrigation' : 
                           controller.light_type ? 'light' : 'unknown');
    
    return `/controllers/${controllerType === 'irrigation' ? 'irrigation' : 'lighting'}`;
  };
  
  // Hilfsfunktion: Controller-Werte für Fortschrittsanzeige
  const getProgressData = (controller) => {
    const controllerType = controller.controller_type || 
                          (controller.pump_type ? 'irrigation' : 
                           controller.light_type ? 'light' : 'unknown');
    
    if (controllerType === 'irrigation') {
      // Bewässerungscontroller: Wasserverbrauch oder aktueller Zyklus
      if (controller.status?.current_schedule) {
        return {
          label: "Aktueller Zyklus",
          value: controller.status.current_schedule.progress || 0,
          color: theme.palette.primary.main,
          secondaryText: `${controller.status.current_schedule.volume || 0} l`
        };
      }
      
      return {
        label: "Gesamtverbrauch",
        value: 100, // Kein Fortschritt, volle Anzeige
        color: theme.palette.primary.main,
        secondaryText: `${controller.total_volume_used?.toFixed(1) || 0} l`
      };
    }
    
    if (controllerType === 'light') {
      // Lichtcontroller: Aktuelle Intensität oder Tagesfortschritt
      if (controller.status?.current_light_state?.is_on) {
        return {
          label: "Intensität",
          value: controller.status.current_light_state.intensity || 0,
          color: theme.palette.warning.main,
          secondaryText: `${controller.status.current_light_state.intensity || 0}%`
        };
      }
      
      // Tag im Zyklus als Fortschritt (vereinfacht)
      const currentDay = controller.current_day_in_cycle || 1;
      const cycleLength = controller.cycle_type === 'veg' ? 30 : 
                          controller.cycle_type === 'flower' ? 60 : 
                          controller.cycle_type === 'seedling' ? 14 : 
                          controller.cycle_type === 'clone' ? 7 : 30;
      
      return {
        label: "Tag im Zyklus",
        value: (currentDay / cycleLength) * 100,
        color: theme.palette.warning.main,
        secondaryText: `Tag ${currentDay}`
      };
    }
    
    // Fallback
    return {
      label: "Status",
      value: controller.is_active ? 100 : 0,
      color: theme.palette.grey[500],
      secondaryText: controller.is_active ? "Aktiv" : "Inaktiv"
    };
  };
  
  // Hilfsfunktion: Controller-Typ als Text
  const getControllerTypeText = (controller) => {
    const controllerType = controller.controller_type || 
                          (controller.pump_type ? 'irrigation' : 
                           controller.light_type ? 'light' : 'unknown');
    
    switch (controllerType) {
      case 'irrigation':
        return controller.pump_type_display || "Bewässerung";
      case 'light':
        return controller.light_type_display || "Licht";
      default:
        return "Controller";
    }
  };
  
  // Handling für Controller-Klick
  const handleControllerClick = (controller) => {
    if (onControllerClick) {
      onControllerClick(controller);
    } else {
      // Standardmäßig zur Controller-Seite navigieren
      navigate(getControllerRoute(controller));
    }
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `linear-gradient(to bottom, ${alpha(themeColor, 0.04)}, ${alpha(themeColor, 0.01)})`,
        border: `1px solid ${alpha(themeColor, 0.1)}`
      }}
    >
      <Box 
        sx={{ 
          p: 3, 
          borderBottom: `1px solid ${alpha(themeColor, 0.1)}`
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          color: themeColor, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <SettingsInputComponentIcon sx={{ mr: 1 }} />
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {controllers.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4,
            height: '100%',
            color: theme.palette.text.secondary
          }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Keine aktiven Controller gefunden
            </Typography>
            <Typography variant="body2">
              Erstellen Sie einen Controller, um loszulegen
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {controllers.map((controller) => {
              const statusInfo = getStatusInfo(controller);
              const progressData = getProgressData(controller);
              
              return (
                <Grid item xs={12} sm={6} key={controller.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: `0 0 8px ${alpha(themeColor, 0.2)}`,
                        borderColor: alpha(themeColor, 0.3)
                      }
                    }}
                    onClick={() => handleControllerClick(controller)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1 }}>
                            {getControllerIcon(controller)}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                            {controller.name}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {statusInfo.icon}
                          <Typography 
                            variant="caption" 
                            sx={{ ml: 0.5, color: statusInfo.color, fontWeight: 'medium' }}
                          >
                            {statusInfo.label}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {getControllerTypeText(controller)}
                        </Typography>
                        
                        {controller.room && (
                          <Tooltip title="Raum">
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                              <RoomIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                              {controller.room.name}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                      
                      {/* Progress-Anzeige */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {progressData.label}
                          </Typography>
                          <Typography variant="caption" fontWeight="medium">
                            {progressData.secondaryText}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progressData.value}
                          sx={{ 
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(progressData.color, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: progressData.color
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};

export default ActiveControllersCard;