// frontend/src/apps/controller/components/dashboard/RecentAlertsCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, List, ListItem, ListItemIcon, 
  ListItemText, Chip, Divider, useTheme, alpha,
  ListItemSecondaryAction, Tooltip, IconButton
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Verbesserte Komponente zur Anzeige der letzten Alarme/Warnungen im Dashboard
 */
const RecentAlertsCard = ({ 
  title = "AKTUELLE ALARME",
  alerts = [],
  icon = <WarningIcon />,
  onViewDetails,
  colorTheme = "error"
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  
  // Hilfsfunktion für Alarm-Typ-Icon und Farbe
  const getAlertTypeInfo = (alert) => {
    // Basierend auf Alarmtyp oder Erfolg/Fehlerstatus
    if (!alert.success_status) {
      if (alert.error_message && alert.error_message.toLowerCase().includes('kritisch')) {
        return {
          icon: <ErrorIcon />,
          color: theme.palette.error.main,
          label: 'Kritisch'
        };
      }
      return {
        icon: <WarningIcon />,
        color: theme.palette.warning.main,
        label: 'Warnung'
      };
    }
    
    // Je nach Action-Type
    if (alert.action_type) {
      if (alert.action_type.includes('emergency')) {
        return {
          icon: <WarningIcon />,
          color: theme.palette.warning.main,
          label: 'Notfall'
        };
      }
    }
    
    // Standard
    return {
      icon: <InfoIcon />,
      color: theme.palette.info.main,
      label: 'Info'
    };
  };
  
  // Hilfsfunktion für Controller-Typ-Icon
  const getControllerIcon = (controllerType) => {
    switch (controllerType) {
      case 'irrigation':
        return <OpacityIcon sx={{ color: theme.palette.primary.main }} />;
      case 'light':
        return <WbSunnyIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Formatierte Uhrzeit
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = parseISO(timestamp);
      return format(date, 'HH:mm', { locale: de });
    } catch (error) {
      return '';
    }
  };
  
  // Formatierter Aktionstyp
  const formatActionType = (actionType) => {
    if (!actionType) return '';
    
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
          display: 'flex', 
          alignItems: 'center',
          color: themeColor 
        }}>
          <Box sx={{ mr: 1, display: 'flex' }}>
            {icon}
          </Box>
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {alerts.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4,
            height: '100%',
            color: theme.palette.text.secondary
          }}>
            <CheckCircleIcon sx={{ fontSize: 48, mb: 2, color: theme.palette.success.main }} />
            <Typography>Keine aktuellen Alarme</Typography>
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Alle Systeme arbeiten normal
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {alerts.map((alert, index) => {
              const alertTypeInfo = getAlertTypeInfo(alert);
              
              return (
                <React.Fragment key={alert.id || index}>
                  <ListItem alignItems="flex-start" sx={{ px: 3, py: 1.5 }}>
                    <ListItemIcon sx={{ mt: 0, minWidth: 40 }}>
                      {alertTypeInfo.icon}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {alert.controller_type && (
                              <Tooltip title={`${alert.controller_type === 'irrigation' ? 'Bewässerung' : 'Licht'}-Controller`}>
                                <Box sx={{ mr: 1, display: 'flex' }}>
                                  {getControllerIcon(alert.controller_type)}
                                </Box>
                              </Tooltip>
                            )}
                            
                            <Typography variant="body2" fontWeight="medium">
                              {formatActionType(alert.action_type)}
                            </Typography>
                          </Box>
                          
                          <Chip 
                            label={alertTypeInfo.label}
                            size="small"
                            sx={{ 
                              backgroundColor: alpha(alertTypeInfo.color, 0.1),
                              color: alertTypeInfo.color,
                              fontWeight: 'medium',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {alert.error_message || 'Keine Details verfügbar'}
                          </Typography>
                          
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {formatTime(alert.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                    
                    {onViewDetails && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Details anzeigen">
                          <IconButton 
                            edge="end" 
                            aria-label="details"
                            size="small"
                            onClick={() => onViewDetails(alert)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  
                  {index < alerts.length - 1 && (
                    <Divider component="li" sx={{ mx: 3 }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default RecentAlertsCard;