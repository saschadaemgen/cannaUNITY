// src/apps/unifi_protect/pages/ProtectSensorPage.jsx

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Alert, Snackbar, Button, Chip
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FixedSizeList as VirtualList } from 'react-window';

import SensorItem from '../components/SensorItem';

const TIME_OPTIONS = [
  { label: '1 Tag', value: 1 },
  { label: '3 Tage', value: 3 },
  { label: '7 Tage', value: 7 },
  { label: '14 Tage', value: 14 },
  { label: 'Monat', value: 30 },
];

const AUTO_UPDATE_INTERVAL = 300 * 1000;

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

  const countdownTimerRef = useRef(null);
  const requestCacheRef = useRef({});

  const getUniqueUrl = useCallback((baseUrl) => {
    const timestamp = Date.now();
    return baseUrl.includes('?') ? `${baseUrl}&_t=${timestamp}` : `${baseUrl}?_t=${timestamp}`;
  }, []);

  const fetchSensors = useCallback(async () => {
    try {
      const now = Date.now();
      const lastFetchTime = requestCacheRef.current.lastSensorFetch || 0;
      if (now - lastFetchTime < 2000) return sensors;

      requestCacheRef.current.lastSensorFetch = now;
      setLoading(true);
      const response = await axios.get(getUniqueUrl('/api/unifi_protect/sensors/'));
      const data = Array.isArray(response.data.results) ? response.data.results : response.data;
      if (!Array.isArray(data)) throw new Error('Ungültiges Datenformat');
      const uniqueSensors = {};
      data.forEach(sensor => {
        if (sensor && sensor.name) uniqueSensors[sensor.name] = sensor;
      });
      const sensorArray = Object.values(uniqueSensors);
      setSensors(sensorArray);
      setLastUpdated(new Date());
      setLoading(false);
      if (expanded) {
        const expandedSensor = sensorArray.find(s => s.id === expanded);
        if (expandedSensor) fetchHistory(expanded);
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

  const fetchHistory = useCallback(async (sensorId) => {
    if (!sensorId) return;
    try {
      const cacheKey = `${sensorId}_${timeRange}`;
      const now = Date.now();
      const lastFetchTime = requestCacheRef.current[cacheKey] || 0;
      if (now - lastFetchTime < 5000) return;
      requestCacheRef.current[cacheKey] = now;
      setHistoryLoading(true);
      const url = getUniqueUrl(`/api/unifi_protect/sensors/${sensorId}/history/?days=${timeRange}`);
      const response = await axios.get(url);
      const data = response.data;
      if (!Array.isArray(data)) throw new Error('Ungültiges Verlaufsdatenformat');
      const validData = data
        .filter(item => item && item.timestamp)
        .map(item => ({
          ...item,
          timestamp: item.timestamp,
          formattedTime: new Date(item.timestamp).toLocaleString(),
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setHistory(prev => ({ ...prev, [sensorId]: validData }));
      setHistoryLoading(false);
    } catch (error) {
      console.error(`Verlauf-API-Fehler für Sensor ${sensorId}:`, error);
      setErrorMessage(`Fehler beim Abrufen des Sensorverlaufs: ${error.message || 'Unbekannter Fehler'}`);
      setShowError(true);
      setHistoryLoading(false);
    }
  }, [timeRange, getUniqueUrl]);

  useEffect(() => {
    fetchSensors();
    const initialUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
    setNextUpdateTime(initialUpdateTime);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [fetchSensors]);

  useEffect(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (autoUpdateEnabled) {
      countdownTimerRef.current = setInterval(() => {
        if (!nextUpdateTime) return;
        const now = Date.now();
        const timeLeft = Math.max(0, nextUpdateTime - now);
        const secondsLeft = Math.ceil(timeLeft / 1000);
        setCountdown(secondsLeft);
        if (timeLeft <= 0) {
          fetchSensors();
          const newUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
          setNextUpdateTime(newUpdateTime);
        }
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [autoUpdateEnabled, fetchSensors, nextUpdateTime]);

  const handleExpand = useCallback((sensorId) => {
    setExpanded(prevExpanded => {
      const newExpanded = prevExpanded === sensorId ? null : sensorId;
      if (newExpanded) fetchHistory(sensorId);
      return newExpanded;
    });
  }, [fetchHistory]);

  const handleRefresh = useCallback(() => {
    fetchSensors();
    if (expanded) fetchHistory(expanded);
    const newUpdateTime = Date.now() + AUTO_UPDATE_INTERVAL;
    setNextUpdateTime(newUpdateTime);
  }, [fetchSensors, fetchHistory, expanded]);

  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdateEnabled(prev => {
      if (!prev) {
        fetchSensors();
        setNextUpdateTime(Date.now() + AUTO_UPDATE_INTERVAL);
      }
      return !prev;
    });
  }, [fetchSensors]);

  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const renderedSensors = useMemo(() => {
    if (loading && sensors.length === 0) {
      return <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>;
    }
    if (sensors.length === 0) {
      return <Alert severity="info">Keine Sensoren gefunden.</Alert>;
    }
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
        <Typography variant="h4">UniFi Protect Sensoren</Typography>
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