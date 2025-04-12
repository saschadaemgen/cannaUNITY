import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Switch, FormControlLabel, Typography, Paper } from '@mui/material';

const RoomForm = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 0,
    is_active: true,
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        capacity: initialData.capacity || 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: parseInt(formData.capacity, 10),
    });
  };
  
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
          
          <TextField
            label="Beschreibung"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
          />
          
          <TextField
            label="Kapazität"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            fullWidth
            InputProps={{ inputProps: { min: 0 } }}
          />
          
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