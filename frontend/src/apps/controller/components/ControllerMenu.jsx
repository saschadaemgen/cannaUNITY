// frontend/src/apps/controller/components/ControllerMenu.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  alpha,
  Paper,
  Tooltip
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

// Importieren der Icons für NASA-Style Controller-Interface
import DashboardIcon from '@mui/icons-material/Dashboard';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CodeIcon from '@mui/icons-material/Code';
import SensorsIcon from '@mui/icons-material/Sensors';
import TuneIcon from '@mui/icons-material/Tune';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ConstructionIcon from '@mui/icons-material/Construction';

// Hauptfunktionen für den Grow Controller
const controllerFeatures = [
  {
    label: 'Controller Dashboard',
    stepLabel: 'CTRL 1',
    icon: <DashboardIcon />,
    path: '/controllers/dashboard',
    color: '#2196f3' // Blau
  },
  {
    label: 'Bewässerungssteuerung',
    stepLabel: 'CTRL 2',
    icon: <OpacityIcon />,
    path: '/controllers/irrigation',
    color: '#03a9f4' // Hellblau
  },
  {
    label: 'Lichtsteuerung',
    stepLabel: 'CTRL 3',
    icon: <WbSunnyIcon />,
    path: '/controllers/lighting',
    color: '#ffc107' // Gelb
  },
  {
    label: 'Ressourcenmonitoring',
    stepLabel: 'CTRL 4',
    subtitle: 'Verbrauchsübersicht',
    icon: <AssessmentIcon />,
    path: '/controllers/monitoring',
    color: '#4caf50' // Grün
  },
  {
    label: 'Controller-Protokolle',
    stepLabel: 'CTRL 5',
    icon: <ListAltIcon />,
    path: '/controllers/logs',
    color: '#9e9e9e' // Grau
  },
  {
    label: 'MQTT-Terminal',
    stepLabel: 'CTRL 6',
    subtitle: 'Direktsteuerung',
    icon: <CodeIcon />,
    path: '/controllers/mqtt',
    color: '#607d8b' // Blaugrau
  }
];

// Administrative Funktionen
const adminFunctions = [
  {
    label: 'Sensor-Kalibrierung',
    icon: <SensorsIcon />,
    path: '/controllers/calibration',
    color: '#009688' // Türkis
  },
  {
    label: 'Controller-Einstellungen',
    icon: <TuneIcon />,
    path: '/controllers/settings',
    color: '#ff5722' // Deep Orange
  },
  {
    label: 'MQTT-Verbindung',
    icon: <CloudSyncIcon />,
    path: '/controllers/connection',
    color: '#673ab7' // Deep Purple
  },
  {
    label: 'Systemwartung',
    icon: <ConstructionIcon />,
    path: '/controllers/maintenance',
    color: '#795548' // Braun
  }
];

export default function ControllerMenu({ collapsed = false }) {
  const theme = useTheme();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Funktion zum Rendern eines Menüelements
  const renderMenuItem = (item) => {
    const active = isActive(item.path);
    const itemColor = item.color || theme.palette.primary.main;
    
    // Basis-Komponente für Listen-Items
    const menuItem = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          position: 'relative',
          borderRadius: '8px',
          height: collapsed ? '42px' : (item.subtitle ? '48px' : '42px'),
          color: active ? itemColor : theme.palette.text.primary,
          backgroundColor: active ? alpha(itemColor, 0.1) : 'transparent',
          padding: collapsed ? '8px' : undefined,
          justifyContent: collapsed ? 'center' : undefined,
          '&:hover': {
            backgroundColor: active 
              ? alpha(itemColor, 0.15) 
              : alpha(theme.palette.action.hover, 0.08)
          },
          '&.active': {
            fontWeight: 'bold',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: collapsed ? '-4px' : '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '60%',
              width: '4px',
              backgroundColor: itemColor,
              borderRadius: '0 4px 4px 0'
            }
          }
        }}
      >
        <ListItemIcon 
          sx={{ 
            color: active ? itemColor : theme.palette.text.secondary,
            minWidth: collapsed ? 0 : '36px',
            marginRight: collapsed ? 0 : undefined
          }}
        >
          {item.icon}
        </ListItemIcon>
        
        {!collapsed && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {item.stepLabel && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 'bold',
                  color: active ? itemColor : theme.palette.text.secondary,
                  lineHeight: 1,
                  letterSpacing: '0.5px'
                }}
              >
                {item.stepLabel}
              </Typography>
            )}
            <Typography 
              sx={{
                fontSize: '0.9rem',
                fontWeight: active ? 600 : 400,
                lineHeight: 1.2,
                mt: item.stepLabel ? '1px' : 0
              }}
            >
              {item.label}
            </Typography>
            {item.subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem', 
                  color: theme.palette.text.secondary,
                  ml: 0,
                  lineHeight: 1,
                  mt: '-1px'
                }}
              >
                {item.subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Active-Indikator-Punkt nur anzeigen, wenn nicht kollabiert */}
        {active && !collapsed && (
          <Box 
            sx={{ 
              position: 'absolute',
              right: '8px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: itemColor,
            }}
          />
        )}
      </ListItemButton>
    );
    
    // Im kollabierten Zustand: Tooltip um das Element herum
    return (
      <ListItem key={item.label} disablePadding sx={{ mb: 0.5, px: collapsed ? 0.5 : 0 }}>
        {collapsed ? (
          <Tooltip 
            title={
              <Box>
                {item.stepLabel && (
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {item.stepLabel}
                  </Typography>
                )}
                <Typography variant="body2">{item.label}</Typography>
                {item.subtitle && (
                  <Typography variant="caption">{item.subtitle}</Typography>
                )}
              </Box>
            } 
            placement="right"
            arrow
          >
            {menuItem}
          </Tooltip>
        ) : menuItem}
      </ListItem>
    );
  };

  // Überschriften-Rendering anpassen
  const renderHeader = () => {
    if (collapsed) {
      return null;  // Wir zeigen kein Header im eingeklappten Modus
    }
    
    return (
      <Paper 
        elevation={0}
        sx={{ 
          mx: 2, 
          mb: 2, 
          p: 1.5, 
          background: alpha(theme.palette.info.main, 0.1),
          borderRadius: '8px',
          borderLeft: `4px solid ${theme.palette.info.main}`
        }}
      >
        <Typography 
          variant="subtitle1" 
          color="info.main" 
          sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center'
          }}
        >
          GROW CONTROLLER
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Bewässerung & Beleuchtung
        </Typography>
      </Paper>
    );
  };
  
  // Admin-Titel-Rendering anpassen
  const renderAdminSeparator = () => {
    if (collapsed) {
      return <Divider sx={{ my: 2, mx: 1 }} />;
    }
    
    return (
      <Box sx={{ mx: 2, my: 2 }}>
        <Divider>
          <Box 
            sx={{ 
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: theme.palette.warning.main,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              System-Tools
            </Typography>
          </Box>
        </Divider>
      </Box>
    );
  };
  
  // Footer anpassen
  const renderFooter = () => {
    if (collapsed) return null;
    
    return (
      <Box 
        sx={{ 
          mt: 2, 
          mx: 2, 
          p: 1.5, 
          backgroundColor: alpha(theme.palette.info.light, 0.05),
          borderRadius: '8px',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.03)',
          borderTop: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block', 
            fontSize: '0.7rem',
            fontStyle: 'italic'
          }}
        >
          CannaUNITY Control v1.0
        </Typography>
      </Box>
    );
  };

  return (
    <>
      {renderHeader()}
      
      {/* Hauptfunktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {controllerFeatures.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderAdminSeparator()}
      
      {/* Administrative Funktionen */}
      <Box sx={{ px: collapsed ? 0 : 1 }}>
        <List>
          {adminFunctions.map(renderMenuItem)}
        </List>
      </Box>
      
      {renderFooter()}
    </>
  );
}