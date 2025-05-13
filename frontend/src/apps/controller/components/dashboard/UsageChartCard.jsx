// frontend/src/apps/controller/components/dashboard/UsageChartCard.jsx
import React from 'react';
import { Paper, Typography, Box, useTheme, alpha, Divider } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

/**
 * Benutzerdefinierte Komponente zur Anzeige von Verbrauchsstatistiken
 * Implementiert einen einfachen, benutzerdefinierten Chart ohne externe Bibliotheken
 */
const UsageChartCard = ({ 
  title = "VERBRAUCHSSTATISTIK",
  chartData = [],
  valueUnit = "",
  colorTheme = "primary" 
}) => {
  const theme = useTheme();
  const themeColor = theme.palette[colorTheme].main;
  
  // Berechne Gesamtverbrauch für Anzeige
  const totalUsage = chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // Berechne Durchschnittsverbrauch
  const avgUsage = chartData.length > 0 ? totalUsage / chartData.length : 0;
  
  // Finde den höchsten Verbrauchswert
  const maxUsage = chartData.length > 0 
    ? Math.max(...chartData.map(item => item.value || 0)) 
    : 0;
  
  // Formatiere Zahlenwerte
  const formatNumber = (value) => {
    return Number(value).toFixed(1);
  };
  
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
        <AssessmentIcon sx={{ mr: 1 }} />
        {title}
      </Typography>
      
      {/* Vereinfachte Verbrauchsdarstellung ohne recharts */}
      <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
            Keine Verbrauchsdaten verfügbar
          </Typography>
        ) : (
          chartData.map((item, index) => {
            // Berechne den relativen Prozentwert für die Balkenbreite
            const percentage = maxUsage > 0 ? (item.value / maxUsage) * 100 : 0;
            
            return (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="medium">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold" color={themeColor}>
                    {formatNumber(item.value)} {valueUnit}
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 8, 
                  width: '100%', 
                  backgroundColor: alpha(themeColor, 0.1),
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${percentage}%`, 
                    backgroundColor: themeColor,
                    borderRadius: 4
                  }} />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
      
      <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: alpha(themeColor, 0.2) }} />
      
      <Box 
        sx={{ 
          mt: 'auto',
          pt: 2,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Gesamt
          </Typography>
          <Typography variant="body2" fontWeight="medium" color={themeColor}>
            {formatNumber(totalUsage)} {valueUnit}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Durchschnitt
          </Typography>
          <Typography variant="body2" fontWeight="medium" color={themeColor}>
            {formatNumber(avgUsage)} {valueUnit}
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Maximum
          </Typography>
          <Typography variant="body2" fontWeight="medium" color={themeColor}>
            {formatNumber(maxUsage)} {valueUnit}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default UsageChartCard;