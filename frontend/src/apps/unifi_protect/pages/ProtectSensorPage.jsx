// src/apps/unifi_protect/pages/ProtectSensorPage.jsx

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Box, Typography, CircularProgress, Alert, Snackbar, Button, ButtonGroup, IconButton, TextField
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import { FixedSizeList as VirtualList } from 'react-window';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Popover from '@mui/material/Popover';

import SensorItem from '../components/SensorItem';

const QUICK_RANGES = [
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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);

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
      setLastHeartbeat(new Date());
      setLoading(false);
      sensorArray.forEach(sensor => fetchHistory(sensor.id));
      return sensorArray;
    } catch (error) {
      console.error('Fehler beim Abrufen der Sensordaten:', error);
      setErrorMessage(`Fehler beim Abrufen der Sensordaten: ${error.message || 'Unbekannter Fehler'}`);
      setShowError(true);
      setLoading(false);
      return [];
    }
  }, [getUniqueUrl]);

  const fetchHistory = useCallback(async (sensorId) => {
    if (!sensorId) return;
    try {
      setHistoryLoading(true);

      let url;
      if (startDate && endDate) {
        const start = dayjs(startDate).toISOString();
        const end = dayjs(endDate).toISOString();
        url = getUniqueUrl(`/api/unifi_protect/sensors/${sensorId}/history/?start=${start}&end=${end}`);
      } else {
        url = getUniqueUrl(`/api/unifi_protect/sensors/${sensorId}/history/?days=${timeRange}`);
      }

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
  }, [timeRange, startDate, endDate, getUniqueUrl]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    if (expanded) fetchHistory(expanded);
  }, [timeRange, startDate, endDate]);

  const handleExpand = useCallback((sensorId) => {
    setExpanded(prevExpanded => {
      const newExpanded = prevExpanded === sensorId ? null : sensorId;
      return newExpanded;
    });
  }, []);

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">UniFi Protect Sensoren</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ButtonGroup variant="outlined">
              {QUICK_RANGES.map(opt => (
                <Button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  variant={timeRange === opt.value ? 'contained' : 'outlined'}
                >
                  {opt.label}
                </Button>
              ))}
            </ButtonGroup>
            <IconButton onClick={(e) => setCalendarAnchorEl(e.currentTarget)}>
              <CalendarTodayIcon />
            </IconButton>
            <Popover
              open={Boolean(calendarAnchorEl)}
              anchorEl={calendarAnchorEl}
              onClose={() => setCalendarAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Box p={2} display="flex" flexDirection="column" gap={2}>
                <DatePicker
                  label="Von"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="Bis"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Button startIcon={<ClearIcon />} onClick={handleClearDateRange}>Zurücksetzen</Button>
              </Box>
            </Popover>
          </Box>

          <Box textAlign="right">
            <Typography variant="caption" color="success.main" display="flex" justifyContent="flex-end" alignItems="center" gap={0.5}>
              <FavoriteIcon sx={{ fontSize: 14 }} /> Heartbeat: {lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : '–'}
            </Typography>
            <Typography variant="body2">
              {sensors.length} Sensoren gefunden
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Letzte Aktualisierung: {lastUpdated.toLocaleString()}
              </Typography>
            )}
          </Box>
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
    </LocalizationProvider>
  );
};

export default ProtectSensorPage;
