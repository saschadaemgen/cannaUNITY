// src/apps/unifi_protect/components/SensorHistoryChart.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Eigenständige Komponente für das Sensorverlaufsdiagramm
 * Komplett von der Hauptseite isoliert, um Rendering-Probleme zu vermeiden
 */
const SensorHistoryChart = ({ sensorId, sensorName, timeRange }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Datenpunkte für das tatsächliche Rendern
  const [chartData, setChartData] = useState([]);

  // Cachebuster für API-Aufrufe
  const getUrl = (url) => {
    return `${url}?_t=${Date.now()}`;
  };

  // Historie laden, explizit und isoliert implementiert
  const loadHistory = async () => {
    if (!sensorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Diagramm: Lade Verlaufsdaten für Sensor ${sensorId}, Zeitraum: ${timeRange} Tage`);
      
      // Cache-Kontrolle über Header UND URL-Parameter
      const response = await axios.get(
        getUrl(`/api/unifi_protect/sensors/${sensorId}/history/?days=${timeRange}`),
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      const rawData = response.data;
      console.log(`📈 Erhaltene Daten: ${rawData.length} Punkte`);
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.warn('Keine Daten erhalten oder ungültiges Format');
        setLoading(false);
        setError('Keine Verlaufsdaten verfügbar');
        return;
      }
      
      // Daten für das Debugging ausgeben
      rawData.forEach((item, index) => {
        const date = new Date(item.timestamp);
        console.log(`Punkt ${index}: ${date.toLocaleString()} - T: ${item.temperature}°C, H: ${item.humidity}%`);
      });
      
      // Daten verarbeiten und aufbereiten
      const processedData = rawData
        .filter(item => item && item.timestamp)
        .map(item => ({
          ...item,
          // Daten in explizites Format umwandeln für Diagramm
          timestamp: item.timestamp,
          displayTime: new Date(item.timestamp).toLocaleTimeString(),
          // Sicherstellen, dass Temperatur und Feuchtigkeit als Zahlen vorliegen
          temperature: typeof item.temperature === 'number' ? item.temperature : parseFloat(item.temperature),
          humidity: typeof item.humidity === 'number' ? item.humidity : parseFloat(item.humidity)
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Originaldaten speichern
      setHistoryData(processedData);
      
      // Für Recharts aufbereiten (Arrays können Probleme verursachen)
      const chartReady = processedData.map(item => ({
        ...item,
        id: new Date(item.timestamp).getTime() // Eindeutige IDs hinzufügen
      }));
      
      setChartData(chartReady);
      setLastUpdated(new Date());
      setLoading(false);
      
      console.log('Diagrammdaten verarbeitet:', chartReady);
    } catch (err) {
      console.error('Fehler beim Laden der Verlaufsdaten:', err);
      setError(`Fehler: ${err.message || 'Unbekannter Fehler'}`);
      setLoading(false);
    }
  };

  // Initial und bei Änderungen laden
  useEffect(() => {
    loadHistory();
  }, [sensorId, timeRange]);

  // Manuelles Aktualisieren
  const handleRefresh = () => {
    loadHistory();
  };

  // Wenn Daten geladen werden
  if (loading && !chartData.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  // Bei Fehlern
  if (error && !chartData.length) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight={300}
        bgcolor="#f5f5f5"
        p={2}
        borderRadius={1}
      >
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={handleRefresh}
          size="small"
        >
          Erneut versuchen
        </Button>
      </Box>
    );
  }

  // Keine Daten
  if (!chartData.length) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight={300}
        bgcolor="#f5f5f5"
        p={2}
        borderRadius={1}
      >
        <Typography color="textSecondary" gutterBottom>Keine Daten für den ausgewählten Zeitraum verfügbar.</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={handleRefresh}
          size="small"
        >
          Aktualisieren
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">
          Temperatur- und Feuchtigkeitsverlauf für {sensorName}
        </Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={loading}
        >
          VERLAUF AKTUALISIEREN
        </Button>
      </Box>
      
      <Box height={350} width="100%">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="displayTime"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
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
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const timestamp = payload[0].payload.timestamp;
                  try {
                    return new Date(timestamp).toLocaleString();
                  } catch (e) {
                    return label;
                  }
                }
                return label;
              }}
              formatter={(value, name) => {
                if (name === 'temperature') return [`${value.toFixed(1)}°C`, 'Temperatur'];
                if (name === 'humidity') return [`${value.toFixed(0)}%`, 'Luftfeuchte'];
                return [value, name];
              }}
            />
            <Legend />
            <ReferenceLine y={20} yAxisId="left" stroke="#ff9800" strokeDasharray="3 3" label="Komfort" />
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#1976d2" 
              name="Temperatur" 
              yAxisId="left"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
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
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      
      {lastUpdated && (
        <Typography variant="caption" color="textSecondary" align="right" display="block">
          Letztes Update: {lastUpdated.toLocaleString()}
        </Typography>
      )}
      
      {/* Optional: Debug-Anzeige */}
      {process.env.NODE_ENV === 'development' && (
        <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography variant="caption" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
            Datenpunkte: {chartData.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SensorHistoryChart;