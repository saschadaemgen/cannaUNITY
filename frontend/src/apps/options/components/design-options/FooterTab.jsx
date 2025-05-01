// src/options/components/design-options/FooterTab.jsx
import { footerOptions } from './DesignOptionsConfig';
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button
} from '@mui/material';

const FooterTab = ({ design, handleDesignChange, theme }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Hier kannst du den Footer-Titel anpassen
      </Typography>
      
      {/* Footer-Vorschau */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 1,
          px: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 1,
          borderTop: '1px solid',
          borderTopColor: theme.palette.mode === 'dark' 
            ? theme.palette.grey[800] 
            : theme.palette.grey[300],
          bgcolor: design.darkMode
            ? theme.palette.grey[900] 
            : theme.palette.grey[100],
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {design.footerMode === 'full' && 'cannaUNITY v0.6.18'}
          {design.footerMode === 'title' && 'cannaUNITY'}
          {design.footerMode === 'none' && ''}
        </Typography>
        
        <Button color="success" size="small">
          Login
        </Button>
      </Paper>
      
      {/* Footer-Optionen */}
      <RadioGroup
        value={design.footerMode}
        onChange={(e) => handleDesignChange('footerMode', e.target.value)}
        name="footer-options"
      >
        {footerOptions.map((option) => (
          <FormControlLabel 
            key={option.id}
            value={option.value} 
            control={<Radio />} 
            label={option.label} 
            sx={{ mb: 1 }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
};

export default FooterTab;