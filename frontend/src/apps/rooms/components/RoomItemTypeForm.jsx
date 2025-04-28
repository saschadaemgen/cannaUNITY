// frontend/src/apps/rooms/components/RoomItemTypeForm.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, MenuItem, FormControl, 
  InputLabel, Select, Paper, Typography,
  Autocomplete
} from '@mui/material';

const CATEGORY_OPTIONS = [
  { value: 'furniture', label: 'Möbel' },
  { value: 'lighting', label: 'Beleuchtung' },
  { value: 'sensor', label: 'Sensorik' },
  { value: 'access', label: 'Zugang' },
  { value: 'other', label: 'Sonstiges' }
];

const ICON_OPTIONS = [
  { value: 'TableChartIcon', label: 'Tisch' },
  { value: 'LightbulbIcon', label: 'Lampe' },
  { value: 'ThermostatIcon', label: 'Sensor' },
  { value: 'MeetingRoomIcon', label: 'Tür' },
  { value: 'LocalFloristIcon', label: 'Pflanze' },
  { value: 'GroupsIcon', label: 'Gruppe' }
];

const RoomItemTypeForm = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'furniture',
    icon: '',
    default_width: 100,
    default_height: 100,
    allowed_quantities: []
  });
  
  const suggestedQuantities = [4, 9, 16, 25, 36, 49, 64, 81, 100];
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'furniture',
        icon: initialData.icon || '',
        default_width: initialData.default_width || 100,
        default_height: initialData.default_height || 100,
        allowed_quantities: initialData.allowed_quantities || []
      });
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleQuantitiesChange = (event, newValue) => {
    const numericValues = newValue
      .map(val => typeof val === 'string' ? parseInt(val, 10) : val)
      .filter(val => !isNaN(val));
    
    setFormData({
      ...formData,
      allowed_quantities: numericValues
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSend = {
      ...formData,
      default_width: parseInt(formData.default_width, 10),
      default_height: parseInt(formData.default_height, 10),
      allowed_quantities: Array.isArray(formData.allowed_quantities) 
        ? formData.allowed_quantities 
        : []
    };
    
    console.log('Sending data to API:', dataToSend);
    onSubmit(dataToSend);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name des Elementtyps"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <FormControl fullWidth>
            <InputLabel id="category-label">Kategorie</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={formData.category}
              label="Kategorie"
              onChange={handleChange}
            >
              {CATEGORY_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="icon-label">Icon</InputLabel>
            <Select
              labelId="icon-label"
              id="icon"
              name="icon"
              value={formData.icon}
              label="Icon"
              onChange={handleChange}
            >
              {ICON_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Standardbreite (cm)"
              name="default_width"
              type="number"
              value={formData.default_width}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 1 }}
            />
            
            <TextField
              label="Standardhöhe (cm)"
              name="default_height"
              type="number"
              value={formData.default_height}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Box>
          
          {formData.category === 'furniture' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Erlaubte Pflanzenanzahl
              </Typography>
              
              <Autocomplete
                multiple
                id="allowed-quantities"
                options={suggestedQuantities}
                value={formData.allowed_quantities}
                onChange={handleQuantitiesChange}
                freeSolo
                getOptionLabel={(option) => String(option)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Pflanzenanzahl hinzufügen"
                  />
                )}
              />
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Typische Werte: 4, 9, 16, 25, ... (für 2×2, 3×3, 4×4, 5×5, ...)
              </Typography>
            </Box>
          )}
          
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

export default RoomItemTypeForm;