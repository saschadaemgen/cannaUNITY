// frontend/src/apps/rooms/components/PlantConfigDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, Alert, Chip
} from '@mui/material';

const PlantConfigDialog = ({ open, onClose, onSave, itemType, initialConfig }) => {
  const [config, setConfig] = useState({
    quantity: 0,
    arrangement: '',
    spacing: 20, // Abstand zwischen Pflanzen in cm
  });

  // Arrangements basierend auf Quantität
  const getArrangementOptions = (qty) => {
    const options = [];
    
    for (let i = 1; i <= Math.sqrt(qty); i++) {
      if (qty % i === 0) {
        const j = qty / i;
        options.push(`${i}x${j}`);
        if (i !== j) {
          options.push(`${j}x${i}`);
        }
      }
    }
    
    return options.sort();
  };

  useEffect(() => {
    if (initialConfig) {
      setConfig({
        quantity: initialConfig.quantity || 0,
        arrangement: initialConfig.arrangement || '',
        spacing: initialConfig.spacing || 20
      });
    }
  }, [initialConfig, open]);

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10) || 0;
    setConfig({
      ...config,
      quantity: newQuantity,
      arrangement: getArrangementOptions(newQuantity)[0] || ''
    });
  };

  const handleArrangementChange = (e) => {
    setConfig({
      ...config,
      arrangement: e.target.value
    });
  };

  const handleSpacingChange = (e) => {
    setConfig({
      ...config,
      spacing: parseInt(e.target.value, 10) || 20
    });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  // Berechne Vorschau-Dimensionen
  const previewWidth = 240;
  const [rows, cols] = config.arrangement 
    ? config.arrangement.split('x').map(n => parseInt(n, 10)) 
    : [0, 0];
  
  // Faktoren für Darstellungsgröße
  const cellSize = Math.min(
    previewWidth / (cols + 1), // Horizontaler Faktor
    previewWidth / (rows + 1)  // Vertikaler Faktor
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>Pflanzenanordnung konfigurieren</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Pflanzeneinstellungen
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="quantity-label">Anzahl der Pflanzen</InputLabel>
              <Select
                labelId="quantity-label"
                value={config.quantity}
                onChange={handleQuantityChange}
                label="Anzahl der Pflanzen"
              >
                <MenuItem value={0}>Keine Pflanzen</MenuItem>
                {[1, 4, 9, 16, 25, 36, 49, 64, 81, 100].map(qty => (
                  <MenuItem key={qty} value={qty}>{qty} Pflanzen</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {config.quantity > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="arrangement-label">Anordnung</InputLabel>
                <Select
                  labelId="arrangement-label"
                  value={config.arrangement}
                  onChange={handleArrangementChange}
                  label="Anordnung"
                >
                  {getArrangementOptions(config.quantity).map(arr => (
                    <MenuItem key={arr} value={arr}>{arr}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <TextField
              label="Pflanzabstand (cm)"
              type="number"
              value={config.spacing}
              onChange={handleSpacingChange}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 5, max: 100 } }}
              helperText="Empfohlener Abstand: 20-40 cm"
            />
            
            {config.quantity > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Diese Konfiguration benötigt eine Tischfläche von mind. {' '}
                  {cols * config.spacing} × {rows * config.spacing} cm
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Vorschau
            </Typography>
            
            <Box 
              sx={{ 
                border: '1px solid #ccc', 
                borderRadius: 1, 
                height: 240, 
                width: 240, 
                position: 'relative',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {config.quantity > 0 && config.arrangement ? (
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                    gap: 1
                  }}
                >
                  {Array.from({ length: config.quantity }, (_, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        width: cellSize * 0.8, 
                        height: cellSize * 0.8, 
                        borderRadius: '50%', 
                        backgroundColor: '#4caf50',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontSize: cellSize * 0.4
                      }}
                    >
                      {i + 1}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Keine Pflanzen ausgewählt
                </Typography>
              )}
            </Box>
            
            {config.quantity > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={`${config.quantity} Pflanzen`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`Anordnung: ${config.arrangement || 'nicht gewählt'}`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`Abstand: ${config.spacing} cm`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            )}
          </Grid>
        </Grid>
        
        {config.quantity > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Diese Pflanzen werden später automatisch mit dem Track & Trace System verknüpft.
          </Alert>
        )}
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

export default PlantConfigDialog;