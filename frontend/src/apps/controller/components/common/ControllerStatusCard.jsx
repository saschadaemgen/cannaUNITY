// frontend/src/apps/controller/components/common/ControllerStatusCard.jsx
import React from 'react';
import { Paper, Typography, Box, Button, Chip, LinearProgress, useTheme, alpha } from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function ControllerStatusCard({
  title,
  icon,
  total,
  active,
  connected,
  warning,
  color,
  unit,
  todayValue,
  linkTo
}) {
  const theme = useTheme();
  const mainColor = color || theme.palette.primary.main;
  
  // Active Percentage berechnen
  const activePercentage = total > 0 ? (active / total) * 100 : 0;
  const connectedPercentage = active > 0 ? (connected / active) * 100 : 0;
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height: '100%',
        borderRadius: 2,
        backgroundImage: `linear-gradient(to bottom, ${alpha(mainColor, 0.04)}, ${alpha(mainColor, 0.01)})`,
        border: `1px solid ${alpha(mainColor, 0.1)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: mainColor, display: 'flex', alignItems: 'center' }}
          >
            {React.cloneElement(icon, { sx: { mr: 1, fontSize: '1.2rem' } })}
            {title.toUpperCase()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {total} {total === 1 ? 'Controller' : 'Controller'} konfiguriert
          </Typography>
        </Box>
        
        {warning > 0 && (
          <Chip 
            icon={<ErrorIcon />} 
            label={`${warning} Warnung${warning !== 1 ? 'en' : ''}`} 
            color="error" 
            size="small" 
          />
        )}
      </Box>
      
      {/* Aktiv vs. Inaktiv */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Aktiv
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {active} von {total} ({Math.round(activePercentage)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={activePercentage}
          sx={{ 
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(mainColor, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: mainColor,
              borderRadius: 3,
            }
          }}
        />
      </Box>
      
      {/* Verbunden vs. Nicht verbunden */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Verbunden
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {connected} von {active} ({Math.round(connectedPercentage)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={connectedPercentage}
          sx={{ 
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(mainColor, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: alpha(mainColor, 0.7),
              borderRadius: 3,
            }
          }}
        />
      </Box>
      
      {/* Ressourcen heute */}
      <Box 
        sx={{ 
          mt: 'auto', 
          pt: 2,
          borderTop: `1px dashed ${alpha(mainColor, 0.2)}`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Verbrauch heute
          </Typography>
          <Typography 
            variant="subtitle2" 
            fontWeight="bold"
            color={mainColor}
          >
            {todayValue.toFixed(1)} {unit}
          </Typography>
        </Box>
        
        <Button 
          component={Link} 
          to={linkTo} 
          variant="text" 
          color="inherit"
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            color: mainColor,
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Details anzeigen
        </Button>
      </Box>
    </Paper>
  );
}