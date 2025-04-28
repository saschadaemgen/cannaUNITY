// frontend/src/apps/rooms/components/RoomForm.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, Switch, FormControlLabel, 
  Typography, Paper, Slider, Divider, Grid, 
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';

const RoomForm = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 0,
    is_active: true,
    room_type: 'other',
    pflanzenanzahl: 0,
    length: 500,  // 5m default
    width: 500,   // 5m default
    height: 250,  // 2.5m default
    grid_size: 10 // 10cm default
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        capacity: initialData.capacity || 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        room_type: initialData.room_type || 'other',
        pflanzenanzahl: initialData.pflanzenanzahl || 0,
        length: initialData.length || 500,
        width: initialData.width || 500,
        height: initialData.height || 250,
        grid_size: initialData.grid_size || 10
      });
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value,
    });
  };
  
  const handleSliderChange = (name) => (event, newValue) => {
    setFormData({
      ...formData,
      [name]: newValue
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: parseInt(formData.capacity, 10),
      pflanzenanzahl: parseInt(formData.pflanzenanzahl, 10),
      length: parseInt(formData.length, 10),
      width: parseInt(formData.width, 10),
      height: parseInt(formData.height, 10),
      grid_size: parseInt(formData.grid_size, 10)
    });
  };
  
  // Berechne das Volumen in Kubikmetern
  const volume = ((formData.length * formData.width * formData.height) / 1000000).toFixed(2);
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Raumname"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <FormControl fullWidth>
            <InputLabel id="room-type-label">Raumtyp</InputLabel>
            <Select
              labelId="room-type-label"
              name="room_type"
              value={formData.room_type}
              label="Raumtyp"
              onChange={handleChange}
            >
              <MenuItem value="bluetekammer">Blütekammer</MenuItem>
              <MenuItem value="produktausgabe">Produktausgabe</MenuItem>
              <MenuItem value="trocknungsraum">Trocknungsraum</MenuItem>
              <MenuItem value="labor">Labor</MenuItem>
              <MenuItem value="mutterraum">Mutterraum</MenuItem>
              <MenuItem value="anzuchtraum">Anzuchtraum</MenuItem>
              <MenuItem value="verarbeitung">Verarbeitung</MenuItem>
              <MenuItem value="other">Sonstiges</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Beschreibung"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Kapazität (Personen)"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Pflanzenanzahl"
                name="pflanzenanzahl"
                type="number"
                value={formData.pflanzenanzahl}
                onChange={handleChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
              />
            }
            label="Aktiv"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Räumliche Parameter
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Länge: {formData.length} cm ({(formData.length / 100).toFixed(2)} m)
              </Typography>
              <Slider
                value={formData.length}
                onChange={handleSliderChange('length')}
                min={100}
                max={2000}
                step={10}
                marks={[
                  { value: 100, label: '1m' },
                  { value: 500, label: '5m' },
                  { value: 1000, label: '10m' },
                  { value: 2000, label: '20m' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Breite: {formData.width} cm ({(formData.width / 100).toFixed(2)} m)
              </Typography>
              <Slider
                value={formData.width}
                onChange={handleSliderChange('width')}
                min={100}
                max={2000}
                step={10}
                marks={[
                  { value: 100, label: '1m' },
                  { value: 500, label: '5m' },
                  { value: 1000, label: '10m' },
                  { value: 2000, label: '20m' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Höhe: {formData.height} cm ({(formData.height / 100).toFixed(2)} m)
              </Typography>
              <Slider
                value={formData.height}
                onChange={handleSliderChange('height')}
                min={100}
                max={500}
                step={10}
                marks={[
                  { value: 100, label: '1m' },
                  { value: 250, label: '2.5m' },
                  { value: 400, label: '4m' },
                  { value: 500, label: '5m' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Rastergröße: {formData.grid_size} cm
              </Typography>
              <Slider
                value={formData.grid_size}
                onChange={handleSliderChange('grid_size')}
                min={5}
                max={50}
                step={5}
                marks={[
                  { value: 5, label: '5cm' },
                  { value: 10, label: '10cm' },
                  { value: 25, label: '25cm' },
                  { value: 50, label: '50cm' }
                ]}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Raumvolumen: {volume} m³
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default RoomForm;