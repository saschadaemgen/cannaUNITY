// frontend/src/apps/controller/components/monitoring/ResourceComparisonCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, Chip, useTheme, alpha, 
  Divider, LinearProgress, Grid 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReactECharts from 'echarts-for-react';

/**
 * Karte für den Vergleich von Ressourcenverbrauch zwischen Zeiträumen
 * 
 * @param {Object} props
 * @param {string} props.title - Titel der Karte
 * @param {React.ReactNode} props.icon - Icon für die Ressource
 * @param {number} props.currentValue - Aktueller Wert
 * @param {number} props.previousValue - Vorheriger Vergleichswert
 * @param {string} props.unit - Einheit der Werte
 * @param {Array} props.data - Zeitreihendaten
 * @param {string} props.color - Primärfarbe für die Karte
 * @param {Object} props.comparisonInfo - Zusätzliche Vergleichsinformationen
 */
export default function ResourceComparisonCard({
  title,
  icon,
  currentValue,
  previousValue,
  unit,
  data,
  color,
  comparisonInfo
}) {
  const theme = useTheme();
  
  // Berechnen der Veränderung in Prozent
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return 100;
    return ((currentValue - previousValue) / previousValue) * 100;
  };
  
  const percentChange = calculateChange();
  const isPositive = percentChange >= 0;
  
  // Kompaktes Sparkline-Diagramm für Trend
  const getSparklineOptions = () => {
    return {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      xAxis: {
        type: 'category',
        show: false,
        data: data.map((_, index) => index)
      },
      yAxis: {
        show: false,
        min: 'dataMin',
        max: 'dataMax'
      },
      series: [{
        type: 'line',
        showSymbol: false,
        data: data.map(item => item.value),
        lineStyle: {
          width: 2,
          color: color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: alpha(color, 0.3) },
            { offset: 1, color: alpha(color, 0.05) }
          ])
        }
      }]
    };
  };
  
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2.5,
        height: '100%',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0 0 15px ${alpha(color, 0.2)}`
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
            <Typography variant="h4" sx={{ color }}>
              {currentValue.toFixed(1)}
            </Typography>
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              {unit}
            </Typography>
          </Box>
        </Box>
        {icon}
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        mt: 1
      }}>
        <Chip 
          icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          label={`${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`}
          color={isPositive ? 'error' : 'success'}
          size="small"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          vs. vorherigen Zeitraum
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Vergleichsbereiche */}
      <Grid container spacing={2}>
        {comparisonInfo && comparisonInfo.map((info, index) => (
          <Grid item xs={6} key={index}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {info.label}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {info.value} {info.unit || unit}
            </Typography>
          </Grid>
        ))}
      </Grid>
      
      {/* Sparkline-Diagramm */}
      <Box sx={{ height: 60, mt: 2 }}>
        <ReactECharts 
          option={getSparklineOptions()} 
          style={{ height: '100%', width: '100%' }} 
        />
      </Box>
    </Paper>
  );
}