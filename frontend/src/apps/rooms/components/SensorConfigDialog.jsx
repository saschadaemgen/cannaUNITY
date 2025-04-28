// frontend/src/apps/rooms/components/SensorConfigDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, Switch, FormControlLabel,
  List, ListItem, ListItemText, ListItemIcon, Chip
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import Co2Icon from '@mui/icons-material/Co2';
import ScienceIcon from '@mui/icons-material/Science';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AirIcon from '@mui/icons-material/Air';

const sensorTypeIcons = {
  temperature: <ThermostatIcon />,
  humidity: <OpacityIcon />,
  co2: <Co2Icon />,
  ph: <ScienceIcon />,
  ec: <ScienceIcon />,
  light: <LightbulbIcon />,
  dust: <AirIcon />,
  other: <ScienceIcon />
};

const sensorTypeLabels = {
  temperature: 'Temperatur',
  humidity: 'Luftfeuchtigkeit',
  co2: 'CO2',
  ph: 'pH-Wert',
  ec: 'EC-Wert',
  light: 'Lichtstärke',
  dust: 'Staubwerte',
  other: 'Andere'
};

const SensorConfigDialog = ({ open, onClose, onSave, initialConfig }) => {
  const [sensors, setSensors] = useState([]);
  const [currentSensor, setCurrentSensor] = useState({
    type: 'temperature',
    label: '',
    dataSource: '',
    autoUpdate: true,
    updateInterval: 5
  });
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    if (initialConfig?.sensors) {
      setSensors(initialConfig.sensors);
    } else {
      setSensors([]);
    }
  }, [initialConfig, open]);

  const handleTypeChange = (e) => {
    setCurrentSensor({
      ...currentSensor,
      type: e.target.value,
      label: sensorTypeLabels[e.target.value] || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSensor({
      ...currentSensor,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    setCurrentSensor({
      ...currentSensor,
      autoUpdate: e.target.checked
    });
  };

  const handleAddSensor = () => {
    if (editingIndex >= 0) {
      // Update existing sensor
      const updatedSensors = [...sensors];
      updatedSensors[editingIndex] = currentSensor;
      setSensors(updatedSensors);
      setEditingIndex(-1);
    } else {
      // Add new sensor
      setSensors([...sensors, currentSensor]);
    }
    
    // Reset form
    setCurrentSensor({
      type: 'temperature',
      label: '',
      dataSource: '',
      autoUpdate: true,
      updateInterval: 5
    });
  };

  const handleEditSensor = (index) => {
    setCurrentSensor(sensors[index]);
    setEditingIndex(index);
  };

  const handleRemoveSensor = (index) => {
    const updatedSensors = [...sensors];
    updatedSensors.splice(index, 1);
    setSensors(updatedSensors);
  };

  const handleSave = () => {
    onSave({ sensors });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sensoren konfigurieren</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Sensor hinzufügen/bearbeiten
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="sensor-type-label">Sensortyp</InputLabel>
              <Select
                labelId="sensor-type-label"
                value={currentSensor.type}
                onChange={handleTypeChange}
                label="Sensortyp"
              >
                {Object.keys(sensorTypeLabels).map(type => (
                  <MenuItem key={type} value={type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {sensorTypeIcons[type]}
                      {sensorTypeLabels[type]}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Bezeichnung"
              name="label"
              value={currentSensor.label}
              onChange={handleInputChange}
              placeholder={sensorTypeLabels[currentSensor.type] || 'Bezeichnung'}
              fullWidth
              margin="normal"
            />
            
            <TextField
              label="Datenquelle"
              name="dataSource"
              value={currentSensor.dataSource}
              onChange={handleInputChange}
              placeholder="API-Endpunkt oder Gerätename"
              fullWidth
              margin="normal"
              helperText="Leer lassen für manuelle Eingabe"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={currentSensor.autoUpdate}
                  onChange={handleSwitchChange}
                  name="autoUpdate"
                />
              }
              label="Automatische Aktualisierung"
            />
            
            {currentSensor.autoUpdate && (
              <TextField
                label="Aktualisierungsintervall (Minuten)"
                name="updateInterval"
                type="number"
                value={currentSensor.updateInterval}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 60 } }}
              />
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSensor}
                fullWidth
              >
                {editingIndex >= 0 ? 'Sensor aktualisieren' : 'Sensor hinzufügen'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Konfigurierte Sensoren
            </Typography>
            
            {sensors.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 1 }}>
                <Typography color="text.secondary">
                  Keine Sensoren konfiguriert
                </Typography>
              </Box>
            ) : (
              <List sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                {sensors.map((sensor, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <Box>
                        <Button 
                          size="small" 
                          onClick={() => handleEditSensor(index)}
                          sx={{ mr: 1 }}
                        >
                          Bearbeiten
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveSensor(index)}
                        >
                          Entfernen
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      {sensorTypeIcons[sensor.type]}
                    </ListItemIcon>
                    <ListItemText 
                      primary={sensor.label || sensorTypeLabels[sensor.type]}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            label={sensor.autoUpdate ? `Auto-Update: ${sensor.updateInterval} min` : 'Manuelle Eingabe'} 
                            size="small" 
                            variant="outlined"
                            color={sensor.autoUpdate ? 'success' : 'default'}
                          />
                          {sensor.dataSource && (
                            <Chip 
                              label={`Quelle: ${sensor.dataSource}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SensorConfigDialog;