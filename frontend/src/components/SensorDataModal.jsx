// src/apps/rooms/components/SensorDataModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton,
  Box, Tab, Tabs, Typography, CircularProgress,
  Button, ButtonGroup, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
// Importiere die existierende SensorChart Komponente
import SensorChart from '@/apps/unifi_protect/components/SensorChart';

const QUICK_RANGES = [
  { label: '1 Tag', value: 1 },
  { label: '3 Tage', value: 3 },
  { label: '7 Tage', value: 7 },
  { label: '14 Tage', value: 14 },
  { label: 'Monat', value: 30 },
];

const SensorDataModal = ({ open, onClose, roomId, roomName }) => {
  const [sensorsData, setSensorsData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && roomId) {
      fetchSensorData();
    }
  }, [open, roomId, timeRange]);

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Lade Sensordaten für Raum ${roomId} mit Zeitbereich ${timeRange} Tage`);
      
      const response = await axios.get(`/api/rooms/${roomId}/sensor_data/?days=${timeRange}`);
      console.log('Empfangene Daten:', response.data);
      
      setSensorsData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Sensordaten:', error);
      setError('Fehler beim Laden der Sensordaten');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSensorData();
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  return (
    <Dialog 
      fullScreen 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { backgroundColor: 'grey.50' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box>
          <Typography variant="h5">
            Sensordaten für Raum: {roomName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Temperatur- und Luftfeuchtigkeitsverlauf
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            {QUICK_RANGES.map(opt => (
              <Button
                key={opt.value}
                onClick={() => handleTimeRangeChange(opt.value)}
                variant={timeRange === opt.value ? 'contained' : 'outlined'}
              >
                {opt.label}
              </Button>
            ))}
          </ButtonGroup>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : sensorsData.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Keine Sensoren in diesem Raum gefunden.
          </Alert>
        ) : (
          <Box>
            {sensorsData.length > 1 && (
              <Tabs 
                value={activeTab} 
                onChange={(e, v) => setActiveTab(v)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                {sensorsData.map((data, index) => (
                  <Tab 
                    key={data.sensor.id} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{data.sensor.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {data.sensor.temperature?.toFixed(1)}°C / {data.sensor.humidity?.toFixed(0)}%
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            )}
            
            {sensorsData.map((data, index) => (
              <Box
                key={data.sensor.id}
                hidden={activeTab !== index}
                sx={{ mt: 2 }}
              >
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {data.sensor.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Sensor-Typ
                      </Typography>
                      <Typography variant="body2">
                        {data.sensor.sensor_type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={data.sensor.status === 'Online' ? 'success.main' : 'error.main'}
                      >
                        {data.sensor.status}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Zuletzt gesehen
                      </Typography>
                      <Typography variant="body2">
                        {data.sensor.last_seen ? 
                          new Date(data.sensor.last_seen).toLocaleString() : 
                          'Unbekannt'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {data.history && data.history.length > 0 ? (
                  <SensorChart 
                    historyData={data.history}
                    isLoading={false}
                    animate={true}
                  />
                ) : (
                  <Alert severity="info">
                    Keine Verlaufsdaten verfügbar.
                  </Alert>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SensorDataModal;