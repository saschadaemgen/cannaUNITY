// src/apps/unifi_protect/pages/ProtectSensorPage.jsx

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Alert, Snackbar, IconButton, Tooltip, Button, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { FixedSizeList as VirtualList } from 'react-window';

const TIME_OPTIONS = [
  { label: "1 Tag", value: 1 },
  { label: "3 Tage", value: 3 },
  { label: "7 Tage", value: 7 },
  { label: "14 Tage", value: 14 },
  { label: "Monat", value: 30 }
];

// 5-Minuten-Intervall in Millisekunden (exakt mit dem Listener synchronisiert)
const AUTO_UPDATE_INTERVAL = 300 * 1000;

// Hilfsfunktion für Batteriestatus
const getBatteryStatus = (level) => {
  if (!level && level !== 0) return { icon: null, color: 'default', text: 'Unbekannt' };
  if (level > 70) return { icon: <BatteryFullIcon />, color: 'success', text: 'Gut' };
  if (level > 30) return { icon: <BatteryFullIcon />, color: 'warning', text: 'Mittel' };
  return { icon: <BatteryAlertIcon />, color: 'error', text: 'Niedrig' };
};

// Hilfsfunktion für die Formatierung des Countdowns
const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Axios-Instanz mit Standard-Header für Cache-Vermeidung
const axiosInstance = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Memoisierte Komponente für Statistiktabelle
const SensorStatsTable = memo(({ sensorData, historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  const tempData = historyData.filter(d => d.temperature !== undefined && d.temperature !== null);
  const humidData = historyData.filter(d => d.humidity !== undefined && d.humidity !== null);
  
  const tempStats = {
    min: tempData.length ? Math.min(...tempData.map(d => d.temperature)).toFixed(1) : '-',
    max: tempData.length ? Math.max(...tempData.map(d => d.temperature)).toFixed(1) : '-',
    avg: tempData.length ? (tempData.reduce((sum, d) => sum + d.temperature, 0) / tempData.length).toFixed(1) : '-',
    current: sensorData.temperature !== undefined ? sensorData.temperature.toFixed(1) : '-'
  };
  
  const humidStats = {
    min: humidData.length ? Math.min(...humidData.map(d => d.humidity)).toFixed(0) : '-',
    max: humidData.length ? Math.max(...humidData.map(d => d.humidity)).toFixed(0) : '-',
    avg: humidData.length ? (humidData.reduce((sum, d) => sum + d.humidity, 0) / humidData.length).toFixed(0) : '-',
    current: sensorData.humidity !== undefined ? sensorData.humidity.toFixed(0) : '-'
  };

  return (
    <Box mt={3}>
      <Typography variant="subtitle1" gutterBottom>
        Statistik für den ausgewählten Zeitraum
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Metrik</strong></TableCell>
              <TableCell align="right"><strong>Min</strong></TableCell>
              <TableCell align="right"><strong>Max</strong></TableCell>
              <TableCell align="right"><strong>Durchschnitt</strong></TableCell>
              <TableCell align="right"><strong>Aktuell</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Temperatur</TableCell>
              <TableCell align="right">{tempStats.min}°C</TableCell>
              <TableCell align="right">{tempStats.max}°C</TableCell>
              <TableCell align="right">{tempStats.avg}°C</TableCell>
              <TableCell align="right">{tempStats.current}°C</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Luftfeuchte</TableCell>
              <TableCell align="right">{humidStats.min}%</TableCell>
              <TableCell align="right">{humidStats.max}%</TableCell>
              <TableCell align="right">{humidStats.avg}%</TableCell>
              <TableCell align="right">{humidStats.current}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// Memoisierte Komponente für das Sensoren-Diagramm
const SensorChart = memo(({ historyData, isLoading }) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={2}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Keine Verlaufsdaten verfügbar.
      </Alert>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="timestamp" 
          type="category"
          tickFormatter={(v) => {
            try {
              return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
              return '';
            }
          }} 
          label={{ value: 'Zeit', position: 'insideBottomRight', offset: 0 }}
          padding={{ left: 15, right: 15 }}
        />
        <YAxis 
          yAxisId="left" 
          domain={['auto', 'auto']} 
          label={{ value: '°C', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          domain={[0, 100]} 
          label={{ value: '%', angle: 90, position: 'insideRight' }}
        />
        <RechartsTooltip 
          labelFormatter={(v) => {
            try {
              return new Date(v).toLocaleString();
            } catch (e) {
              return v;
            }
          }} 
          formatter={(value, name) => {
            if (name === 'temperature') return [`${parseFloat(value).toFixed(1)}°C`, 'Temperatur'];
            if (name === 'humidity') return [`${parseFloat(value).toFixed(0)}%`, 'Luftfeuchte'];
            return [value, name];
          }}
        />
        <Legend />
        <ReferenceLine y={20} yAxisId="left" stroke="#ff9800" strokeDasharray="3 3" label="Komfortzone" />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#1976d2" 
          name="Temperatur" 
          yAxisId="left"
          strokeWidth={2}
          dot={{ r: 3, fill: '#1976d2' }}
          activeDot={{ r: 8 }}
          isAnimationActive={false} 
          connectNulls={false}
        />
        <Line 
          type="monotone" 
          dataKey="humidity" 
          stroke="#66bb6a" 
          name="Luftfeuchte" 
          yAxisId="right"
          strokeWidth={2}
          dot={{ r: 3, fill: '#66bb6a' }}
          activeDot={{ r: 8 }}
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

// Memoized Sensor-Element für einzelne Sensoritems 
const SensorItem = memo(({ 
  sensor,
  expanded,
  onExpand,
  history,
  historyLoading,
  onRefreshHistory,
  timeRange
}) => {
  const batteryStatus = getBatteryStatus(sensor.battery_level);
  const handleClick = () => onExpand(sensor.id);
  
  return (
    <Accordion
      key={sensor.id || `sensor-${sensor.name}`}
      expanded={expanded}
      onChange={handleClick}
      sx={{ mb: 1 }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }
        }}
      >
        <Typography sx={{ fontWeight: 'bold' }}>{sensor.name}</Typography>
        <Box display="flex" alignItems="center">
          {sensor.battery_level !== undefined && (
            <Tooltip title={`Batterie: ${sensor.battery_level}%`}>
              <Box display="flex" alignItems="center" color={batteryStatus.color} mr={2}>
                {batteryStatus.icon}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {sensor.battery_level}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          <Typography>
            {sensor.temperature !== undefined ? `${sensor.temperature.toFixed(1)}°C` : '–'} / 
            {sensor.humidity !== undefined ? `${sensor.humidity.toFixed(0)}%` : '–'}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box mb={2}>
          <Typography variant="body2" gutterBottom>
            <strong>Typ:</strong> {sensor.sensor_type || 'Unbekannt'} | 
            <strong> Status:</strong> {sensor.status || 'Unbekannt'} | 
            <strong> Letzte Aktivität:</strong> {sensor.last_seen ? new Date(sensor.last_seen).toLocaleString() : 'Unbekannt'}
          </Typography>
          
          {/* Zusätzliche Metadaten */}
          {sensor.mac_address && (
            <Typography variant="body2" color="text.secondary">
              <strong>MAC-Adresse:</strong> {sensor.mac_address}
            </Typography>
          )}
        </Box>
        
        {expanded && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Temperatur- und Feuchtigkeitsverlauf ({timeRange} {timeRange === 1 ? 'Tag' : 'Tage'})
              </Typography>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />} 
                onClick={() => onRefreshHistory(sensor.id)}
                disabled={historyLoading}
              >
                VERLAUF AKTUALISIEREN
              </Button>
            </Box>
            
            <SensorChart 
              historyData={history[sensor.id]} 
              isLoading={historyLoading} 
            />
            
            {history[sensor.id] && history[sensor.id].length > 0 && (
              <SensorStatsTable 
                sensorData={sensor} 
                historyData={history[sensor.id]} 
              />
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

// Optimierte Hauptkomponente
const ProtectSensorPage = () => {
  const [sensors, setSensors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});
  const [timeRange, setTimeRange] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_UPDATE_INTERVAL / 1000);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  
  // Timer-Referenzen
  const countdownTimerRef = useRef(null);
  const requestCacheRef = useRef({});

  // Eindeutige URL für jede Anfrage erzeugen (Cache-Busting)
  const getUniqueUrl = useCallback((baseUrl) => {
    const timestamp = Date.now();
    return baseUrl.includes('?') 
      ? `${baseUrl}&_t=${timestamp}` 
      : `${baseUrl}?_t=${timestamp}`;
  }, []);

  // Sensordaten laden mit Debounce
  const fetchSensors = useCallback(async () => {
    try {
      // Prüfen auf doppelte Anfragen innerhalb von 2 Sekunden
      const now = Date.now();
      const lastFetchTime = requestCacheRef.current.lastSensorFetch || 0;
      if (now - lastFetchTime < 2000) {
        console.log('⚠️ Anfrage ignoriert (Debounce aktiv)');
        return sensors; // Aktuelle Sensorliste zurückgeben
      }
      
      // Timestamp aktualisieren
      requestCacheRef.current.lastSensorFetch = now;
      
      setLoading(true);
      console.log(`🔄 Sensordaten werden abgerufen... (${new Date().toLocaleTimeString()})`);
      
      // Anfrage mit Cache-Busting
      const response = await axiosInstance.get(getUniqueUrl('/api/unifi_protect/sensors/'));
      
      const data = Array.isArray(response.data.results) 
        ? response.data.results 
        : response.data;
      
      if (!Array.isArray(data)) {
        throw new Error('Ungültiges Datenformat');
      }
      
      console.log(`✅ ${data.length} Sensoren empfangen`);
      
      // Entferne Duplikate basierend auf dem Namen
      const uniqueSensors = {};
      data.forEach(sensor => {
        if (sensor && sensor.name) {
          uniqueSensors[sensor.name] = sensor;
        }
      });
      
      const sensorArray = Object.values(uniqueSensors);
      
      // Logge Temperaturen für Debugging
      sensorArray.forEach(sensor => {
        console.log(`${sensor.name}: ${sensor.temperature}°C / ${sensor.humidity}% (${sensor.last_seen})`);
      });
      
      setSensors(sensorArray);
      setLastUpdated(new Date());
      setLoading(false);
      
      // Update auch die Verlaufsdaten, wenn ein Sensor expandiert ist
      if (expanded) {
        const expandedSensor = sensorArray.find(s => s.id === expanded);
        if (expandedSensor) {
          fetchHistory(expanded);
        }
      }
      
      return sensorArray;
    } catch (error) {
      console.error('Fehler beim Abrufen der Sensordaten:', error);
      setErrorMessage(`Fehler beim Abrufen der Sensordaten: ${error.message || 'Unbekannter Fehler'}`);
      setShowError(true);
      setLoading(false);
      return [];
    }
  }, [expanded, getUniqueUrl, sensors]);

  // Verlaufsdaten eines bestimmten Sensors laden mit Caching
  const fetchHistory = useCallback(async (sensorId) => {
    if (!sensorId) return;
    
    try {
      // Prüfen auf doppelte Anfragen für denselben Sensor und Zeitraum innerhalb von 5 Sekunden
      const cacheKey = `${sensorId}_${timeRange}`;
      const now = Date.now();
      const lastFetchTime = requestCacheRef.current[cacheKey] || 0;
      
      if (now - lastFetchTime < 5000) {
        console.log(`⚠️ Verlaufsanfrage für Sensor ${sensorId} ignoriert (Debounce aktiv)`);
        return;
      }
      
      // Timestamp aktualisieren
      requestCacheRef.current[cacheKey] = now;
      
      setHistoryLoading(true);
      console.log(`📊 Verlaufsdaten für Sensor ${sensorId} werden abgerufen...`);
      
      // Cache-Busting URL mit explizitem längeren Zeitraum
      const url = getUniqueUrl(`/api/unifi_protect/sensors/${sensorId}/history/?days=${timeRange}`);
      
      const response = await axiosInstance.get(url);
      
      const data = response.data;
      
      if (!Array.isArray(data)) {
        throw new Error('Ungültiges Verlaufsdatenformat');
      }

      // Debug-Ausgabe begrenzen
      console.log(`Rohe Verlaufsdaten: ${data.length} Einträge`);
      
      // Sicherstellen, dass historische Daten vorhanden sind
      if (data.length === 0) {
        console.warn(`Keine Verlaufsdaten für Sensor ${sensorId} gefunden!`);
        setHistoryLoading(false);
        return;
      }
      
      // Daten validieren und sortieren mit korrekter Zeitreihenfolge
      const validData = data
        .filter(item => item && item.timestamp)
        .map(item => ({
          ...item,
          // ISO-String beibehalten für korrekte Sortierung und Diagrammdarstellung
          timestamp: item.timestamp,
          formattedTime: new Date(item.timestamp).toLocaleString()
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log(`📈 ${validData.length} Verlaufsdatenpunkte für Sensor ${sensorId}`);
      
      if (validData.length > 0) {
        const first = new Date(validData[0].timestamp);
        const last = new Date(validData[validData.length - 1].timestamp);
        console.log(`Zeitraum: ${first.toLocaleString()} bis ${last.toLocaleString()}`);
      }
      
      // Nur aktualisieren, wenn Daten sich geändert haben (Deep compare)
      const currentData = history[sensorId] || [];
      const hasChanged = validData.length !== currentData.length || 
                         JSON.stringify(validData[0]) !== JSON.stringify(currentData[0]) ||
                         JSON.stringify(validData[validData.length-1]) !== JSON.stringify(currentData[currentData.length-1]);
      
      if (hasChanged) {
        setHistory(prev => ({ ...prev, [sensorId]: validData }));
      } else {
        console.log('ℹ️ Keine Änderungen in den Verlaufsdaten erkannt');
      }
      
      setHistoryLoading(false);
    } catch (error) {
      console.error(`Verlauf-API-Fehler für Sensor ${sensorId}:`, error);
      setErrorMessage(`Fehler beim Abrufen des Sensorverlaufs: ${error.message || 'Unbekannter Fehler'}`);
      setShowError(true);
      setHistoryLoading(false);
    }
  }, [timeRange, getUniqueUrl, history]);

  // Präzise Countdown-Aktualisierung
  const updateCountdownPrecise = useCallback(() => {
    if (!nextUpdateTime) return;
    
    // Performance.now() wäre noch präziser, aber Date.now() ist ausreichend für unseren Anwendungsfall
    const now = Date.now();
    const timeLeft = Math.max(0, nextUpdateTime - now);
    const secondsLeft = Math.ceil(timeLeft / 1000);
    
    setCountdown(secondsLeft);
    
    // Wenn Zeit abgelaufen ist, neue Daten holen und Timer zurücksetzen
    if (timeLeft <= 0) {
      console.log("⏰ Countdown abgelaufen - Aktualisierung wird ausgeführt");
      fetchSensors();
      
      // Neue Zielzeit für die nächste Aktualisierung setzen
      const newUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
      setNextUpdateTime(newUpdateTime);
    }
  }, [fetchSensors, nextUpdateTime]);

  // Auto-Update-Timer einrichten
  useEffect(() => {
    // Sofort Daten laden
    fetchSensors();
    
    // Initiale Zielzeit setzen
    const initialUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
    setNextUpdateTime(initialUpdateTime);
    
    return () => {
      // Aufräumen beim Unmount
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [fetchSensors]);

  // Countdown-Timer aktualisieren
  useEffect(() => {
    // Timer aufräumen, falls vorhanden
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    // Nur starten, wenn Auto-Update aktiviert ist
    if (autoUpdateEnabled) {
      countdownTimerRef.current = setInterval(() => {
        updateCountdownPrecise();
      }, 1000); // Jede Sekunde aktualisieren für genauen Countdown
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [autoUpdateEnabled, updateCountdownPrecise]);

  // Auto-Update ein/ausschalten
  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdateEnabled(prev => {
      // Wenn wir von aus auf ein wechseln, initialisieren wir den Timer neu
      if (!prev) {
        fetchSensors();
        setNextUpdateTime(Date.now() + AUTO_UPDATE_INTERVAL);
      }
      return !prev;
    });
  }, [fetchSensors]);

  // Bei Änderung des Zeitraums oder des expandierten Sensors den Verlauf aktualisieren
  useEffect(() => {
    if (expanded) {
      fetchHistory(expanded);
    }
  }, [timeRange, expanded, fetchHistory]);

  // Handling für das Aufklappen/Zuklappen der Akkordeons
  const handleExpand = useCallback((sensorId) => {
    setExpanded(prevExpanded => {
      const newExpanded = prevExpanded === sensorId ? null : sensorId;
      
      if (newExpanded) {
        fetchHistory(sensorId);
      }
      
      return newExpanded;
    });
  }, [fetchHistory]);

  // Manuelles Aktualisieren der Daten
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manuelle Aktualisierung angefordert');
    fetchSensors();
    
    if (expanded) {
      fetchHistory(expanded);
    }
    
    // Timer zurücksetzen
    const newUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
    setNextUpdateTime(newUpdateTime);
  }, [fetchSensors, fetchHistory, expanded]);
  
  // Memoized Sensor-Liste erzeugen
  const renderedSensors = useMemo(() => {
    if (loading && sensors.length === 0) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (sensors.length === 0) {
      return <Alert severity="info">Keine Sensoren gefunden.</Alert>;
    }
    
    // Für kleinere Listen normale Rendering-Methode
    if (sensors.length <= 20) {
      return sensors.map(sensor => (
        <SensorItem
          key={sensor.id || `sensor-${sensor.name}`}
          sensor={sensor}
          expanded={expanded === sensor.id}
          onExpand={handleExpand}
          history={history}
          historyLoading={historyLoading && expanded === sensor.id}
          onRefreshHistory={fetchHistory}
          timeRange={timeRange}
        />
      ));
    }
    
    // Für größere Listen virtualisierte Rendering-Methode
    return (
      <Box sx={{ height: 600, width: '100%' }}>
        <VirtualList
          height={600}
          width="100%"
          itemSize={80}
          itemCount={sensors.length}
          overscanCount={3}
        >
          {({ index, style }) => (
            <Box style={style}>
              <SensorItem
                sensor={sensors[index]}
                expanded={expanded === sensors[index].id}
                onExpand={handleExpand}
                history={history}
                historyLoading={historyLoading && expanded === sensors[index].id}
                onRefreshHistory={fetchHistory}
                timeRange={timeRange}
              />
            </Box>
          )}
        </VirtualList>
      </Box>
    );
  }, [sensors, expanded, loading, history, historyLoading, handleExpand, fetchHistory, timeRange]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          UniFi Protect Sensoren
        </Typography>
        <Box display="flex" alignItems="center">
          <Chip
            icon={<AutorenewIcon />}
            label={autoUpdateEnabled ? `Auto-Update in ${formatCountdown(countdown)}` : 'Auto-Update aus'}
            color={autoUpdateEnabled ? 'success' : 'default'}
            onClick={toggleAutoUpdate}
            sx={{ mr: 2 }}
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            size="small"
            sx={{ mr: 2 }}
          >
            AKTUALISIEREN
          </Button>
          
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Letzte Aktualisierung: {lastUpdated.toLocaleString()}
            </Typography>
          )}
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Zeitraum</InputLabel>
          <Select
            value={timeRange}
            label="Zeitraum"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            {TIME_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2">
          {sensors.length} Sensoren gefunden
          {autoUpdateEnabled && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (Auto-Update alle 5 Minuten)
            </Typography>
          )}
        </Typography>
      </Box>

      {renderedSensors}
      
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProtectSensorPage;