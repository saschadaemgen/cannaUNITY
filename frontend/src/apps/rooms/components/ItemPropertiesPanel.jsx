// frontend/src/apps/rooms/components/ItemPropertiesPanel.jsx

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Divider, Button, Grid, TextField,
  Slider, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlantConfigDialog from './PlantConfigDialog';
import SensorConfigDialog from './SensorConfigDialog';

const ItemPropertiesPanel = ({ selectedItem, onUpdate, onDelete, itemTypes }) => {
  const [openPlantConfig, setOpenPlantConfig] = useState(false);
  const [openSensorConfig, setOpenSensorConfig] = useState(false);
  
  if (!selectedItem) {
    return (
      <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" gutterBottom>
          Eigenschaften
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Wähle ein Element aus, um dessen Eigenschaften anzuzeigen und zu bearbeiten.
        </Typography>
      </Paper>
    );
  }
  
  const itemType = itemTypes.find(t => t.id === selectedItem.itemTypeId) || {};
  const isFurniture = itemType.category === 'furniture';
  const isSensor = itemType.category === 'sensor';
  
  const handleNameChange = (e) => {
    onUpdate({
      ...selectedItem,
      name: e.target.value
    });
  };
  
  const handleRotationChange = (e, newValue) => {
    onUpdate({
      ...selectedItem,
      rotation: newValue
    });
  };
  
  const handlePlantConfigSave = (config) => {
    onUpdate({
      ...selectedItem,
      properties: {
        ...selectedItem.properties,
        plants: config
      }
    });
  };
  
  const handleSensorConfigSave = (config) => {
    onUpdate({
      ...selectedItem,
      properties: {
        ...selectedItem.properties,
        sensors: config.sensors
      }
    });
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" gutterBottom>
          Eigenschaften
        </Typography>
        <IconButton color="error" onClick={() => onDelete(selectedItem.id)}>
          <DeleteIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Name"
            value={selectedItem.name || ''}
            onChange={handleNameChange}
            fullWidth
            variant="outlined"
            size="small"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography id="rotation-slider" gutterBottom>
            Rotation: {selectedItem.rotation || 0}°
          </Typography>
          <Slider
            value={selectedItem.rotation || 0}
            onChange={handleRotationChange}
            aria-labelledby="rotation-slider"
            min={0}
            max={360}
            step={45}
            marks={[
              { value: 0, label: '0°' },
              { value: 90, label: '90°' },
              { value: 180, label: '180°' },
              { value: 270, label: '270°' },
              { value: 360, label: '360°' }
            ]}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption">
            Position X: {selectedItem.x}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption">
            Position Y: {selectedItem.y}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption">
            Breite: {selectedItem.width} Einheiten
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="caption">
            Höhe: {selectedItem.height} Einheiten
          </Typography>
        </Grid>
        
        {isFurniture && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Pflanzen-Konfiguration
            </Typography>
            
            {selectedItem.properties?.plants ? (
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`${selectedItem.properties.plants.quantity} Pflanzen`} 
                  color="primary" 
                  sx={{ mb: 1, mr: 1 }} 
                />
                <Chip 
                  label={`Anordnung: ${selectedItem.properties.plants.arrangement}`} 
                  color="primary" 
                  sx={{ mb: 1 }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => setOpenPlantConfig(true)}
                  >
                    Bearbeiten
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => setOpenPlantConfig(true)}
              >
                Pflanzen konfigurieren
              </Button>
            )}
          </Grid>
        )}
        
        {isSensor && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Sensor-Konfiguration
            </Typography>
            
            {selectedItem.properties?.sensors && selectedItem.properties.sensors.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {selectedItem.properties.sensors.length} Sensor(en) konfiguriert
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedItem.properties.sensors.map((sensor, idx) => (
                    <Chip 
                      key={idx}
                      label={sensor.label} 
                      size="small"
                      color="primary" 
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => setOpenSensorConfig(true)}
                  >
                    Bearbeiten
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={() => setOpenSensorConfig(true)}
              >
                Sensoren konfigurieren
              </Button>
            )}
          </Grid>
        )}
      </Grid>
      
      <PlantConfigDialog
        open={openPlantConfig}
        onClose={() => setOpenPlantConfig(false)}
        onSave={handlePlantConfigSave}
        itemType={itemType}
        initialConfig={selectedItem.properties?.plants}
      />
      
      <SensorConfigDialog
        open={openSensorConfig}
        onClose={() => setOpenSensorConfig(false)}
        onSave={handleSensorConfigSave}
        initialConfig={selectedItem.properties}
      />
    </Paper>
  );
};

export default ItemPropertiesPanel;