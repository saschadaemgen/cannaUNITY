// frontend/src/apps/controller/components/dashboard/ControllerList.jsx
import React from 'react';
import { 
  Paper, Typography, Box, List, ListItem, ListItemIcon, 
  ListItemText, Chip, Divider, useTheme, alpha,
  ListItemSecondaryAction, IconButton, Tooltip, Card, 
  CardContent, Grid, LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RoomIcon from '@mui/icons-material/Room';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

/**
 * Komponente zur Anzeige von aktiven Controllern im Dashboard
 * 
 * @param {Object} props
 * @param {Array} props.controllers - Array der Controller
 * @param {string} props.title - Titel für die Komponente
 * @param {function} props.onControllerClick - Optional: Callback bei Klick auf einen Controller
 */
const ControllerList = ({ controllers = [], title = "Controller", onControllerClick }) => {
  const theme = useTheme();
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
        return <SettingsIcon sx={{ color: theme.palette.action.active }} />;
    }
  };
  
  // Hilfsfunktion: Status-Chip
  const getStatusChip = (controller) => {
    // Prüfen ob Notfälle vorliegen
    if (controller.emergency_stop || controller.emergency_off) {
      return (
        <Chip 
          icon={<WarningIcon />}
          label="Notfall"
          size="small"
          color="error"
        />
      );
    }
    
    // Verbindungsstatus
    if (!controller.is_connected) {
      return (
        <Chip 
          icon={<HourglassEmptyIcon />}
          label="Offline"
          size="small"
          color="default"
          variant="outlined"
        />
      );
    }
    
    // Aktiv und verbunden
    if (controller.is_active) {
      return (
        <Chip 
          icon={<CheckCircleIcon />}
          label="Aktiv"
          size="small"
          color="success"
        />
      );
    }
    
    // Fallback
    return (
      <Chip 
        label="Inaktiv"
        size="small"
        color="default"
        variant="outlined"
      />
    );
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
      variant="outlined" 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.05)
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
          <Grid container spacing={2} sx={{ p: 2 }}>
            {controllers.map((controller) => (
              <Grid item xs={12} sm={6} key={controller.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3)
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
                      
                      <Box>
                        {getStatusChip(controller)}
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
                    {(() => {
                      const progressData = getProgressData(controller);
                      
                      return (
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
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};

export default ControllerList;