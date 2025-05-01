// src/options/components/design-options/TopbarTitleTab.jsx
import React from 'react';
import {
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Input
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { googleFonts, colorOptions } from './DesignOptionsConfig';

const TopbarTitleTab = ({ title, setTitle, design, handleDesignChange }) => {
  // Helfer-Funktion für Textformatierungen
  const getCurrentTitleFormats = () => {
    const formats = [];
    if (design.titleWeight === 'bold') formats.push('bold');
    if (design.titleStyle === 'italic') formats.push('italic');
    if (design.titleDecoration === 'underline') formats.push('underlined');
    return formats;
  };

  const handleTitleFormatChange = (event, formats) => {
    if (formats) { // Prüfen, ob formats definiert ist (kann null sein)
      handleDesignChange('titleWeight', formats.includes('bold') ? 'bold' : 'normal');
      handleDesignChange('titleStyle', formats.includes('italic') ? 'italic' : 'normal');
      handleDesignChange('titleDecoration', formats.includes('underlined') ? 'underline' : 'none');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label="Topbar-Titel"
        variant="outlined"
        size="small"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          handleDesignChange('title', e.target.value);
        }}
        sx={{ mb: 2 }}
      />
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="title-font-label">Schriftart</InputLabel>
        <Select
          labelId="title-font-label"
          value={design.titleFont}
          label="Schriftart"
          onChange={(e) => handleDesignChange('titleFont', e.target.value)}
        >
          {googleFonts.map((font) => (
            <MenuItem 
              key={font.name} 
              value={font.family}
              sx={{ fontFamily: font.family }}
            >
              {font.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Text-Formatierung und Farbe nebeneinander in einer Zeile */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Textformatierung
            </Typography>
            <ToggleButtonGroup
              value={getCurrentTitleFormats()}
              onChange={handleTitleFormatChange}
              aria-label="text formatting"
              size="small"
            >
              <ToggleButton value="bold" aria-label="bold">
                <FormatBoldIcon />
              </ToggleButton>
              <ToggleButton value="italic" aria-label="italic">
                <FormatItalicIcon />
              </ToggleButton>
              <ToggleButton value="underlined" aria-label="underlined">
                <FormatUnderlinedIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Textfarbe
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {colorOptions.map((color) => (
                <ToggleButton
                  key={color.value}
                  value={color.value}
                  selected={design.titleColor === color.value}
                  onChange={() => handleDesignChange('titleColor', color.value)}
                  aria-label={color.name}
                  sx={{
                    width: '36px',
                    height: '36px',
                    p: 0,
                    minWidth: '36px',
                    bgcolor: color.value,
                    borderColor: design.titleColor === color.value ? '#2196f3' : '#ccc',
                    borderWidth: design.titleColor === color.value ? 2 : 1,
                    '&:hover': {
                      bgcolor: color.value,
                      opacity: 0.9,
                    },
                    '&.Mui-selected': {
                      bgcolor: color.value,
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: color.value,
                      opacity: 0.9,
                    },
                  }}
                  title={color.name}
                />
              ))}
              
              {/* Benutzerdefinierte Farbe */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                title="Benutzerdefinierte Farbe"
              >
                <Input
                  type="color"
                  value={design.titleColor}
                  onChange={(e) => handleDesignChange('titleColor', e.target.value)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '150%',
                    height: '150%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '10px' }}>+</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TopbarTitleTab;