// src/options/components/design-options/NavigationTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';

const NavigationTab = () => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Navigation</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Navigationsoptionen wurden in den Tab "Topbar & Menü" verschoben, 
        um eine bessere visuelle Integration zu gewährleisten.
      </Typography>
      
      <Box sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
        <Typography variant="body2">
          Die Einstellungen für den Navigationsbalken (Floating Bar) finden Sie nun 
          im Tab "Topbar & Menü". Diese Änderung ermöglicht eine bessere visuelle
          Vorschau und einheitlichere Konfiguration der Menüelemente.
        </Typography>
      </Box>
    </Box>
  );
};

export default NavigationTab;