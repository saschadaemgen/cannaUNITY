// src/components/ProtectSensorSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Box,
  Typography, Chip, Alert, CircularProgress,
  OutlinedInput, Checkbox, ListItemText
} from '@mui/material';
import axios from 'axios';

const ProtectSensorSelector = ({ value = [], onChange, currentRoomId }) => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorRoomMapping, setSensorRoomMapping] = useState({});

  useEffect(() => {
    fetchSensorsAndRooms();
  }, []);

  const fetchSensorsAndRooms = async () => {
    try {
      // Sensoren abrufen
      const sensorsRes = await axios.get('/api/unifi_protect/sensors/');
      const sensorsList = sensorsRes.data.results || sensorsRes.data;
      
      // Räume abrufen für Mapping
      const roomsRes = await axios.get('/api/rooms/');
      const roomsList = roomsRes.data.results || roomsRes.data;
      
      // Mapping erstellen: welcher Sensor gehört zu welchem Raum
      const mapping = {};
      roomsList.forEach(room => {
        if (room.protect_sensors_info) {
          room.protect_sensors_info.forEach(sensor => {
            if (room.id !== currentRoomId) {
              mapping[sensor.id] = {
                roomId: room.id,
                roomName: room.name
              };
            }
          });
        }
      });
      
      setSensors(sensorsList);
      setSensorRoomMapping(mapping);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Sensoren:', error);
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const selectedIds = event.target.value;
    
    // Prüfe ob ein bereits zugeordneter Sensor ausgewählt wurde
    const conflictingSensor = selectedIds.find(id => sensorRoomMapping[id]);
    
    if (conflictingSensor) {
      const mapping = sensorRoomMapping[conflictingSensor];
      if (window.confirm(
        `Der Sensor ist bereits dem Raum "${mapping.roomName}" zugeordnet. ` +
        `Möchten Sie die Zuordnung ändern?`
      )) {
        onChange(selectedIds);
      }
    } else {
      onChange(selectedIds);
    }
  };

  const renderValue = (selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((sensorId) => {
        const sensor = sensors.find(s => s.id === sensorId);
        return (
          <Chip 
            key={sensorId} 
            label={sensor?.name || sensorId}
            size="small"
          />
        );
      })}
    </Box>
  );

  if (loading) return <CircularProgress size={24} />;

  return (
    <FormControl fullWidth>
      <InputLabel>UniFi Protect Sensoren</InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label="UniFi Protect Sensoren" />}
        renderValue={renderValue}
      >
        {sensors.map((sensor) => {
          const isAssigned = sensorRoomMapping[sensor.id];
          return (
            <MenuItem key={sensor.id} value={sensor.id}>
              <Checkbox checked={value.indexOf(sensor.id) > -1} />
              <ListItemText 
                primary={sensor.name}
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {sensor.sensor_type} - {sensor.temperature}°C / {sensor.humidity}%
                    </Typography>
                    {isAssigned && (
                      <Typography variant="caption" color="warning.main" display="block">
                        ⚠️ Bereits zugeordnet zu: {isAssigned.roomName}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default ProtectSensorSelector;