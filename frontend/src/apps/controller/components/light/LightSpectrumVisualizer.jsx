// frontend/src/apps/controller/components/light/LightSpectrumVisualizer.jsx
import React, { useRef, useEffect } from 'react';
import { 
  Paper, Typography, Box, useTheme, alpha, 
  Slider, Grid, Divider
} from '@mui/material';
import ReactECharts from 'echarts-for-react';

/**
 * Komponente zur Visualisierung des Lichtspektrums für Grow-Anwendungen
 * 
 * @param {Object} props
 * @param {Object} props.spectrumValues - Spektrumwerte (rot, blau, ggf. weitere)
 * @param {number} props.spectrumValues.red - Rot-Intensität (0-100)
 * @param {number} props.spectrumValues.blue - Blau-Intensität (0-100)
 * @param {number} props.intensity - Gesamtintensität (0-100)
 * @param {Function} props.onChange - Callback bei Änderung der Werte
 * @param {boolean} props.interactive - Ob die Komponente interaktiv sein soll
 * @param {boolean} props.showLabels - Ob Labels angezeigt werden sollen
 */
export default function LightSpectrumVisualizer({
  spectrumValues = { red: 100, blue: 100 },
  intensity = 100,
  onChange,
  interactive = true,
  showLabels = true
}) {
  const theme = useTheme();
  const chartRef = useRef(null);
  
  // Spektrum-Farbwerte erzeugen
  const getSpectrumData = () => {
    // Wellenlängenbereiche definieren (in nm)
    const wavelengths = Array.from({ length: 301 }, (_, i) => i + 400); // 400-700nm
    
    // Spektrumdaten erzeugen
    const spectrumData = wavelengths.map(wavelength => {
      // Grundintensität für jede Wellenlänge
      let value = 0;
      
      // Rot-Spektrum (620-700nm) 
      if (wavelength >= 620 && wavelength <= 700) {
        const redFactor = spectrumValues.red / 100;
        // Gaussche Glockenform mit Zentrum bei 660nm
        value += redFactor * 100 * Math.exp(-0.0025 * Math.pow(wavelength - 660, 2));
      }
      
      // Orange-Rot (590-620nm)
      if (wavelength >= 590 && wavelength <= 620) {
        const redFactor = spectrumValues.red / 100;
        value += redFactor * 80 * Math.exp(-0.005 * Math.pow(wavelength - 610, 2));
      }
      
      // Grün (500-570nm) - geringere Intensität, wenn Rot und Blau hoch sind
      if (wavelength >= 500 && wavelength <= 570) {
        const greenFactor = Math.min(spectrumValues.red, spectrumValues.blue) / 100;
        value += greenFactor * 40 * Math.exp(-0.005 * Math.pow(wavelength - 550, 2));
      }
      
      // Blau-Spektrum (430-490nm)
      if (wavelength >= 430 && wavelength <= 490) {
        const blueFactor = spectrumValues.blue / 100;
        // Gaussche Glockenform mit Zentrum bei 450nm
        value += blueFactor * 100 * Math.exp(-0.005 * Math.pow(wavelength - 450, 2));
      }
      
      // Ultraviolett-nahes Blau (400-430nm)
      if (wavelength >= 400 && wavelength <= 430) {
        const blueFactor = spectrumValues.blue / 100;
        value += blueFactor * 60 * Math.exp(-0.01 * Math.pow(wavelength - 420, 2));
      }
      
      // Gesamtintensität anwenden
      value = value * (intensity / 100);
      
      // Wellenlänge und Wert zurückgeben
      return [wavelength, Math.max(0, Math.min(100, value))];
    });
    
    return spectrumData;
  };
  
  // Wellenlänge zu Farbe konvertieren
  const wavelengthToColor = (wavelength) => {
    let r, g, b;
    
    if (wavelength >= 380 && wavelength < 440) {
      r = -1 * (wavelength - 440) / (440 - 380);
      g = 0;
      b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
      r = 0;
      g = (wavelength - 440) / (490 - 440);
      b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
      r = 0;
      g = 1;
      b = -1 * (wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      r = (wavelength - 510) / (580 - 510);
      g = 1;
      b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
      r = 1;
      g = -1 * (wavelength - 645) / (645 - 580);
      b = 0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      r = 1;
      g = 0;
      b = 0;
    } else {
      r = 0;
      g = 0;
      b = 0;
    }
    
    // Intensität basierend auf Wellenlänge anpassen
    let factor = 1;
    if (wavelength >= 380 && wavelength < 420) {
      factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 420 && wavelength < 701) {
      factor = 1;
    } else if (wavelength >= 701 && wavelength <= 780) {
      factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    }
    
    r = Math.round(255 * Math.pow(r * factor, 0.8));
    g = Math.round(255 * Math.pow(g * factor, 0.8));
    b = Math.round(255 * Math.pow(b * factor, 0.8));
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Chart-Optionen
  const getChartOptions = () => {
    const spectrumData = getSpectrumData();
    
    // Visuelle Regionen für PAR-Bereiche (Photosynthetisch aktive Strahlung)
    const regions = [
      {
        name: 'UV-nahes Blau (400-430nm)',
        start: 400,
        end: 430,
        color: alpha('#9c27b0', 0.2) // Violett
      },
      {
        name: 'Blau (430-490nm)',
        start: 430,
        end: 490,
        color: alpha('#2196f3', 0.2) // Blau
      },
      {
        name: 'Grün (500-570nm)',
        start: 500,
        end: 570,
        color: alpha('#4caf50', 0.2) // Grün
      },
      {
        name: 'Rot (620-700nm)',
        start: 620,
        end: 700,
        color: alpha('#f44336', 0.2) // Rot
      }
    ];
    
    // Chart-Optionen
    return {
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const wavelength = params[0].value[0];
          const intensity = params[0].value[1];
          
          // Region für diese Wellenlänge finden
          const region = regions.find(r => wavelength >= r.start && wavelength <= r.end);
          
          return `${wavelength} nm${region ? ` (${region.name})` : ''}<br/>Intensität: ${intensity.toFixed(1)}%`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Wellenlänge (nm)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 400,
        max: 700,
        axisLabel: {
          formatter: '{value} nm'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Intensität',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          type: 'line',
          name: 'Spektrum',
          data: spectrumData,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 3
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: alpha(theme.palette.warning.main, 0.7) },
              { offset: 1, color: alpha(theme.palette.warning.main, 0.1) }
            ])
          },
          // Farbverlauf basierend auf Wellenlänge
          itemStyle: {
            color: function (params) {
              return wavelengthToColor(params.value[0]);
            }
          }
        }
      ],
      // Visuelle Markierungen für PAR-Regionen
      ...regions.reduce((acc, region, index) => {
        acc.visualMap = acc.visualMap || [];
        acc.visualMap.push({
          show: false,
          type: 'piecewise',
          dimension: 0,
          seriesIndex: 0,
          pieces: [
            {
              gt: region.start - 1,
              lt: region.end + 1,
              color: {
                colorStops: [
                  { offset: 0, color: wavelengthToColor(region.start) },
                  { offset: 1, color: wavelengthToColor(region.end) }
                ]
              }
            }
          ]
        });
        
        // Markierungsbereiche hinzufügen
        acc.markArea = acc.markArea || {
          itemStyle: {
            opacity: 0.2
          },
          data: []
        };
        
        acc.markArea.data.push([
          { xAxis: region.start, itemStyle: { color: region.color } },
          { xAxis: region.end }
        ]);
        
        return acc;
      }, {})
    };
  };
  
  // Event-Handler für Slider
  const handleSpectrumChange = (type, value) => {
    if (!onChange || !interactive) return;
    
    if (type === 'intensity') {
      onChange({
        ...spectrumValues,
        intensity: value
      });
    } else {
      onChange({
        ...spectrumValues,
        [type]: value
      });
    }
  };
  
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.warning.main, 0.05)
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          Lichtspektrum-Visualisierung
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <ReactECharts 
          ref={chartRef}
          option={getChartOptions()}
          style={{ height: 250, width: '100%' }}
        />
        
        {/* Pflanzenentwicklungshinweise */}
        <Box 
          sx={{ 
            mt: 2, 
            p: 1, 
            borderRadius: 1, 
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            fontSize: '0.875rem'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Vegetative Phase:</strong> Höheren Blauanteil (400-500nm) für kompaktes Wachstum.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <strong>Blütephase:</strong> Höheren Rotanteil (620-700nm) für Blütenbildung.
          </Typography>
        </Box>
        
        {/* Slider zur Steuerung, falls interaktiv */}
        {interactive && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      mr: 1, 
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff9800 0%, #ffeb3b 100%)'
                    }}
                  />
                  Gesamtintensität
                </Typography>
                <Slider
                  value={intensity}
                  onChange={(e, value) => handleSpectrumChange('intensity', value)}
                  aria-labelledby="intensity-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ 
                    color: theme.palette.warning.main,
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.palette.warning.main
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      mr: 1, 
                      borderRadius: '50%',
                      bgcolor: theme.palette.error.main
                    }}
                  />
                  Rot-Anteil
                </Typography>
                <Slider
                  value={spectrumValues.red}
                  onChange={(e, value) => handleSpectrumChange('red', value)}
                  aria-labelledby="red-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ 
                    color: theme.palette.error.main,
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.palette.error.main
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      mr: 1, 
                      borderRadius: '50%',
                      bgcolor: theme.palette.info.main
                    }}
                  />
                  Blau-Anteil
                </Typography>
                <Slider
                  value={spectrumValues.blue}
                  onChange={(e, value) => handleSpectrumChange('blue', value)}
                  aria-labelledby="blue-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ 
                    color: theme.palette.info.main,
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.palette.info.main
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Paper>
  );
}