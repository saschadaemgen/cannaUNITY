// frontend/src/apps/controller/components/monitoring/ResourceComparisonCard.jsx
import React from 'react';
import { 
  Paper, Typography, Box, Chip, useTheme, alpha, 
  Divider, LinearProgress, Grid 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

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
  data = [],
  color,
  comparisonInfo = []
}) {
  const theme = useTheme();
  
  // Berechnen der Veränderung in Prozent
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return 100;
    return ((currentValue - previousValue) / previousValue) * 100;
  };
  
  const percentChange = calculateChange();
  const isPositive = percentChange >= 0;
  
  // Minima und Maxima für Sparkline berechnen
  const sparklineData = data.map(item => typeof item === 'object' ? (item.value || 0) : item);
  const minValue = Math.min(...sparklineData);
  const maxValue = Math.max(...sparklineData);
  
  // Normalisierte Höhenwerte für einfache Linienvisualisierung
  const normalizeValue = (value) => {
    if (minValue === maxValue) return 50;
    return Math.round(((value - minValue) / (maxValue - minValue)) * 100);
  };
  
  // Linie für Trenddarstellung zeichnen
  const renderSparkline = () => {
    if (sparklineData.length < 2) return null;
    
    const height = 60;
    const pointsCount = sparklineData.length;
    const step = pointsCount > 1 ? 100 / (pointsCount - 1) : 0;
    
    // SVG-Pfad berechnen
    let pathData = `M 0,${height - normalizeValue(sparklineData[0])}`;
    
    for (let i = 1; i < pointsCount; i++) {
      const x = i * step;
      const y = height - normalizeValue(sparklineData[i]);
      pathData += ` L ${x},${y}`;
    }
    
    return (
      <Box sx={{ position: 'relative', height, mt: 2 }}>
        <svg 
          width="100%" 
          height={height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Linie zeichnen */}
          <path 
            d={pathData} 
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
          
          {/* Fläche unter der Linie */}
          <path 
            d={`${pathData} L 100,${height} L 0,${height} Z`}
            fill={color}
            fillOpacity="0.1"
          />
          
          {/* Fokuspunkt (letzter Punkt) */}
          <circle 
            cx={100} 
            cy={height - normalizeValue(sparklineData[sparklineData.length - 1])} 
            r={3} 
            fill={color}
          />
        </svg>
      </Box>
    );
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
      {renderSparkline()}
    </Paper>
  );
}