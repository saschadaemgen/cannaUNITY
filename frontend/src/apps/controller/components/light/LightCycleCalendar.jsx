// frontend/src/apps/controller/components/light/LightCycleCalendar.jsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, useTheme, alpha, 
  Grid, Button, IconButton, Tooltip, 
  Tabs, Tab, CircularProgress
} from '@mui/material';
import ReactECharts from 'echarts-for-react';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import Brightness5Icon from '@mui/icons-material/Brightness5';
import Brightness6Icon from '@mui/icons-material/Brightness6';

/**
 * Komponente zur Anzeige des Lichtzykluskalenders
 * 
 * @param {Object} props
 * @param {Object} props.controller - Der Lichtcontroller
 * @param {Array} props.schedules - Zeitpläne für den Controller
 * @param {Function} props.onAddSchedule - Callback für "Zeitplan hinzufügen"
 * @param {Function} props.onEditSchedule - Callback für Bearbeiten eines Zeitplans
 * @param {boolean} props.loading - Loading-Zustand
 * @param {number} props.selectedDay - Optional: Ausgewählter Tag (Standard: aktueller Tag im Zyklus)
 * @param {Function} props.onSelectDay - Callback bei Auswahl eines Tages
 */
export default function LightCycleCalendar({
  controller,
  schedules = [],
  onAddSchedule,
  onEditSchedule,
  loading = false,
  selectedDay,
  onSelectDay
}) {
  const theme = useTheme();
  
  // Zustand für Tabs (Tages- oder Zyklusansicht)
  const [viewMode, setViewMode] = useState('day');
  
  // Aktuell ausgewählter Tag oder Controller-Tag verwenden
  const [currentDay, setCurrentDay] = useState(selectedDay || (controller?.current_day_in_cycle || 1));
  
  // Wenn selectedDay von außen geändert wird oder Controller sich ändert
  useEffect(() => {
    if (selectedDay) {
      setCurrentDay(selectedDay);
    } else if (controller?.current_day_in_cycle) {
      setCurrentDay(controller.current_day_in_cycle);
    }
  }, [selectedDay, controller]);
  
  // Callback für Tag-Änderung
  const handleDayChange = (newDay) => {
    setCurrentDay(newDay);
    if (onSelectDay) {
      onSelectDay(newDay);
    }
  };
  
  // Tag vor/zurück
  const handlePreviousDay = () => {
    if (currentDay > 1) {
      handleDayChange(currentDay - 1);
    }
  };
  
  const handleNextDay = () => {
    // Max. 100 Tage als Limit (kann angepasst werden)
    if (currentDay < 100) {
      handleDayChange(currentDay + 1);
    }
  };
  
  // Zeitplan für den aktuellen Tag finden
  const getCurrentDaySchedule = () => {
    return schedules.find(schedule => schedule.day_in_cycle === currentDay);
  };
  
  // Funktion zur Erstellung der Daten für den Tageslichtplan
  const getDayLightCycleData = () => {
    const currentSchedule = getCurrentDaySchedule();
    
    // Wenn kein Zeitplan gefunden wurde, leere Daten zurückgeben
    if (!currentSchedule || !currentSchedule.points || currentSchedule.points.length === 0) {
      return {
        hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        intensity: Array(24).fill(0),
        redSpectrum: Array(24).fill(0),
        blueSpectrum: Array(24).fill(0)
      };
    }
    
    // Zeitpunkte sortieren
    const sortedPoints = [...currentSchedule.points].sort((a, b) => {
      const timeA = a.time_point.split(':').map(Number);
      const timeB = b.time_point.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    // Stunden für x-Achse
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    // Initialisierung der Datenarrays
    const intensity = Array(24).fill(0);
    const redSpectrum = Array(24).fill(0);
    const blueSpectrum = Array(24).fill(0);
    
    // Für jeden Zeitpunkt die entsprechende Stunde setzen
    sortedPoints.forEach(point => {
      const [hour, minute] = point.time_point.split(':').map(Number);
      const hourIndex = hour;
      
      intensity[hourIndex] = point.intensity;
      redSpectrum[hourIndex] = point.spectrum_red;
      blueSpectrum[hourIndex] = point.spectrum_blue;
    });
    
    // Lineare Interpolation für Übergänge
    for (let i = 0; i < 24; i++) {
      // Nur Lücken füllen (Werte, die 0 sind)
      if (intensity[i] === 0 && i > 0) {
        // Nächsten nicht-Null-Wert finden
        let nextNonZeroIndex = -1;
        for (let j = i + 1; j < 24; j++) {
          if (intensity[j] !== 0) {
            nextNonZeroIndex = j;
            break;
          }
        }
        
        // Wenn ein nächster Wert gefunden wurde, interpolieren
        if (nextNonZeroIndex !== -1) {
          const prevValue = intensity[i - 1];
          const nextValue = intensity[nextNonZeroIndex];
          const steps = nextNonZeroIndex - (i - 1);
          
          // Schrittweise Interpolation
          for (let step = 1; step < steps; step++) {
            const index = i - 1 + step;
            const ratio = step / steps;
            
            intensity[index] = prevValue + (nextValue - prevValue) * ratio;
            redSpectrum[index] = redSpectrum[i - 1] + (redSpectrum[nextNonZeroIndex] - redSpectrum[i - 1]) * ratio;
            blueSpectrum[index] = blueSpectrum[i - 1] + (blueSpectrum[nextNonZeroIndex] - blueSpectrum[i - 1]) * ratio;
          }
          
          // Nach der Interpolation i auf den letzten interpolierten Index setzen
          i = nextNonZeroIndex - 1;
        }
      }
    }
    
    return {
      hours,
      intensity,
      redSpectrum,
      blueSpectrum
    };
  };
  
  // Chart-Optionen für den Tageslichtplan
  const getDayLightCycleOptions = () => {
    const data = getDayLightCycleData();
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const time = params[0].name;
          const intensity = params[0].value;
          const red = params[1].value;
          const blue = params[2].value;
          
          return `${time}<br/>
                 Intensität: ${intensity.toFixed(0)}%<br/>
                 Rot: ${red.toFixed(0)}%<br/>
                 Blau: ${blue.toFixed(0)}%`;
        }
      },
      legend: {
        data: ['Intensität', 'Rot-Spektrum', 'Blau-Spektrum'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.hours,
        axisLabel: { 
          interval: 2,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: 'Prozent (%)',
        min: 0,
        max: 100,
        nameTextStyle: {
          fontSize: 10
        }
      },
      series: [
        {
          name: 'Intensität',
          type: 'line',
          smooth: true,
          data: data.intensity,
          lineStyle: { width: 4 },
          itemStyle: { color: theme.palette.warning.main },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: alpha(theme.palette.warning.main, 0.5) },
              { offset: 1, color: alpha(theme.palette.warning.main, 0.05) }
            ])
          }
        },
        {
          name: 'Rot-Spektrum',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data.redSpectrum,
          lineStyle: { width: 2 },
          itemStyle: { color: theme.palette.error.main }
        },
        {
          name: 'Blau-Spektrum',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data.blueSpectrum,
          lineStyle: { width: 2 },
          itemStyle: { color: theme.palette.info.main }
        }
      ]
    };
  };
  
  // Zusammenfassung der Lichtzeiten
  const getLightSummary = () => {
    const data = getDayLightCycleData();
    const intensities = data.intensity;
    
    // Licht-An-Stunden berechnen (Intensität > 0)
    const lightOnHours = intensities.filter(intensity => intensity > 0).length;
    
    // Durchschnittliche Intensität berechnen
    const totalIntensity = intensities.reduce((sum, value) => sum + value, 0);
    const avgIntensity = totalIntensity / 24;
    
    // Spektrum-Verhältnis berechnen
    const totalRed = data.redSpectrum.reduce((sum, value) => sum + value, 0);
    const totalBlue = data.blueSpectrum.reduce((sum, value) => sum + value, 0);
    const avgRed = totalRed / 24;
    const avgBlue = totalBlue / 24;
    
    return {
      lightOnHours,
      avgIntensity,
      avgRed,
      avgBlue
    };
  };
  
  // Zeitplanübersicht für den Zyklus (Heatmap)
  const getCycleHeatmapOptions = () => {
    // Daten für die Heatmap vorbereiten
    const data = [];
    const days = schedules.map(s => s.day_in_cycle);
    const maxDay = Math.max(...days, currentDay);
    
    // Für jeden Tag im Zyklus (bis zum aktuellen Tag)
    for (let day = 1; day <= maxDay; day++) {
      const schedule = schedules.find(s => s.day_in_cycle === day);
      
      if (schedule && schedule.points) {
        // Sortierte Punkte für diesen Tag
        const sortedPoints = [...schedule.points].sort((a, b) => {
          const timeA = a.time_point.split(':').map(Number);
          const timeB = b.time_point.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
        
        // Zeitpunkte in Heatmap-Daten umwandeln
        sortedPoints.forEach(point => {
          const [hour] = point.time_point.split(':').map(Number);
          data.push([day - 1, hour, point.intensity]);
        });
        
        // Interpolation für die Zwischenwerte
        if (sortedPoints.length >= 2) {
          for (let i = 0; i < sortedPoints.length - 1; i++) {
            const currentPoint = sortedPoints[i];
            const nextPoint = sortedPoints[i + 1];
            
            const [currentHour, currentMinute] = currentPoint.time_point.split(':').map(Number);
            const [nextHour, nextMinute] = nextPoint.time_point.split(':').map(Number);
            
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const nextTimeInMinutes = nextHour * 60 + nextMinute;
            
            // Nur interpolieren, wenn es Lücken gibt
            if (nextTimeInMinutes - currentTimeInMinutes > 60) {
              const steps = Math.floor((nextTimeInMinutes - currentTimeInMinutes) / 60);
              
              for (let step = 1; step < steps; step++) {
                const ratio = step / steps;
                const interpolatedTime = Math.floor((currentTimeInMinutes + (nextTimeInMinutes - currentTimeInMinutes) * ratio) / 60);
                const interpolatedIntensity = currentPoint.intensity + (nextPoint.intensity - currentPoint.intensity) * ratio;
                
                data.push([day - 1, interpolatedTime, interpolatedIntensity]);
              }
            }
          }
        }
      }
    }
    
    return {
      tooltip: {
        position: 'top',
        formatter: function(params) {
          const day = params.data[0] + 1;
          const hour = params.data[1];
          const intensity = params.data[2];
          return `Tag ${day}, ${hour}:00 Uhr<br/>Intensität: ${intensity.toFixed(0)}%`;
        }
      },
      grid: {
        height: '70%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        name: 'Tag im Zyklus',
        nameLocation: 'middle',
        nameGap: 30,
        data: Array.from({ length: maxDay }, (_, i) => (i + 1).toString()),
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        name: 'Stunde',
        nameLocation: 'middle',
        nameGap: 40,
        data: Array.from({ length: 24 }, (_, i) => i.toString()),
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0',
        inRange: {
          color: [
            alpha(theme.palette.grey[300], 0.8),  // 0%
            alpha(theme.palette.warning.light, 0.8),  // 50%
            alpha(theme.palette.warning.main, 0.8)   // 100%
          ]
        }
      },
      series: [{
        name: 'Lichtintensität',
        type: 'heatmap',
        data: data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };
  
  // Tagesübersicht erstellen
  const renderDaySummary = () => {
    const summary = getLightSummary();
    const currentSchedule = getCurrentDaySchedule();
    const schedulePoints = currentSchedule?.points || [];
    
    return (
      <Box sx={{ mt: 2, mb: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <WbSunnyIcon sx={{ color: theme.palette.warning.main, fontSize: 24, mb: 1 }} />
              <Typography variant="body2">Lichtzeit</Typography>
              <Typography variant="h6" color="warning.main">{summary.lightOnHours} h</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Brightness5Icon sx={{ color: theme.palette.warning.main, fontSize: 24, mb: 1 }} />
              <Typography variant="body2">Ø Intensität</Typography>
              <Typography variant="h6" color="warning.main">{summary.avgIntensity.toFixed(0)}%</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <WbSunnyIcon sx={{ color: theme.palette.error.light, fontSize: 24, mb: 1 }} />
              <Typography variant="body2">Ø Rot</Typography>
              <Typography variant="h6" color="error.main">{summary.avgRed.toFixed(0)}%</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <WbSunnyIcon sx={{ color: theme.palette.info.light, fontSize: 24, mb: 1 }} />
              <Typography variant="body2">Ø Blau</Typography>
              <Typography variant="h6" color="info.main">{summary.avgBlue.toFixed(0)}%</Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Zeitpunkte */}
        {schedulePoints.length > 0 && (
          <Box sx={{ mt: 2, borderRadius: 1, p: 1, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
            <Typography variant="subtitle2" gutterBottom>Zeitpunkte</Typography>
            <Grid container spacing={1}>
              {schedulePoints.sort((a, b) => {
                const timeA = a.time_point.split(':').map(Number);
                const timeB = b.time_point.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
              }).map((point, index) => (
                <Grid item xs={6} md={4} lg={3} key={index}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1, 
                      borderRadius: 1,
                      backgroundColor: point.intensity > 0 ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.grey[500], 0.1)
                    }}
                  >
                    {point.intensity > 0 ? (
                      <WbTwilightIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                    ) : (
                      <Brightness6Icon sx={{ mr: 1, color: theme.palette.grey[600] }} />
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {point.time_point}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {point.intensity}% {point.intensity > 0 ? 'Ein' : 'Aus'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
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
      {/* Header mit Tabs und Navigation */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.warning.main, 0.05),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          aria-label="light cycle view mode"
        >
          <Tab label="Tagesansicht" value="day" />
          <Tab label="Zyklusansicht" value="cycle" />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {viewMode === 'day' && (
            <>
              <IconButton 
                size="small" 
                onClick={handlePreviousDay} 
                disabled={currentDay <= 1}
              >
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography 
                variant="body1" 
                fontWeight="medium" 
                sx={{ mx: 2 }}
              >
                Tag {currentDay}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={handleNextDay}
                disabled={currentDay >= 100}
              >
                <NavigateNextIcon />
              </IconButton>
            </>
          )}
          
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />}
            sx={{ ml: 2 }}
            onClick={onAddSchedule}
          >
            Zeitplan
          </Button>
        </Box>
      </Box>
      
      {/* Hauptbereich für Charts */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : schedules.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Keine Zeitpläne definiert
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={onAddSchedule}
            >
              Zeitplan hinzufügen
            </Button>
          </Box>
        ) : viewMode === 'day' ? (
          <Box>
            <ReactECharts 
              option={getDayLightCycleOptions()} 
              style={{ height: 300, width: '100%' }} 
            />
            {renderDaySummary()}
          </Box>
        ) : (
          <Box>
            <ReactECharts 
              option={getCycleHeatmapOptions()} 
              style={{ height: 400, width: '100%' }} 
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}