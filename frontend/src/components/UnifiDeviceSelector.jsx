// frontend/src/components/UnifiDeviceSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Chip, Box, Typography
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import api from '@/utils/api';

const UnifiDeviceSelector = ({ value, onChange, currentRoomId }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/unifi_api_debug/devices/');
      setDevices(response.data.devices);
    } catch (err) {
      setError('Fehler beim Laden der Devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const deviceId = event.target.value;
    const device = devices.find(d => d.id === deviceId);
    
    if (device?.is_assigned && device.assigned_to?.room_id !== currentRoomId) {
      if (window.confirm(
        `Achtung! Dieses Device ist bereits dem Raum "${device.assigned_to.room_name}" zugeordnet.\n\n` +
        `Möchten Sie die Zuordnung ändern?`
      )) {
        onChange(deviceId);
      }
    } else {
      onChange(deviceId);
    }
  };

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <FormControl fullWidth>
      <InputLabel id="unifi-device-label">UniFi Access Device</InputLabel>
      <Select
        labelId="unifi-device-label"
        value={value || ''}
        onChange={handleChange}
        label="UniFi Access Device"
        renderValue={(selected) => {
          // DAS ist der Trick!
          if (!selected) return 'Kein Device ausgewählt';
          
          const device = devices.find(d => d.id === selected);
          if (!device) return selected;
          
          return device.alias || device.name;
        }}
      >
        <MenuItem value="">
          <em>Kein Device</em>
        </MenuItem>
        {devices.map((device) => (
          <MenuItem 
            key={device.id} 
            value={device.id}
            disabled={device.is_assigned && device.assigned_to?.room_id !== currentRoomId}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <DoorFrontIcon sx={{ mr: 1, color: 'action.active' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  {device.alias || device.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {device.type} - ID: {device.id}
                </Typography>
              </Box>
              {device.is_assigned && (
                <Chip
                  size="small"
                  icon={<LockIcon />}
                  label={device.assigned_to.room_name}
                  color={device.assigned_to.room_id === currentRoomId ? "primary" : "error"}
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default UnifiDeviceSelector;