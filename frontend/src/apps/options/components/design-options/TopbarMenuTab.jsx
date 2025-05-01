// src/options/components/design-options/TopbarMenuTab.jsx
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Input,
  FormControlLabel,
  Switch,
  Stack,
  Slider
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';

// Import der gemeinsamen Konfigurationen
import { googleFonts, colorOptions, themeOptions } from './DesignOptionsConfig';

const TopbarMenuTab = ({ design, theme, handleDesignChange, handleNestedChange }) => {
  // Helfer-Funktion für Textformatierungen
  const getCurrentMenuFormats = () => {
    const formats = [];
    if (design.menuWeight === 'bold') formats.push('bold');
    if (design.menuStyle === 'italic') formats.push('italic');
    if (design.menuDecoration === 'underline') formats.push('underlined');
    return formats;
  };

  const handleMenuFormatChange = (event, formats) => {
    if (formats) { // Prüfen, ob formats definiert ist (kann null sein)
      handleDesignChange('menuWeight', formats.includes('bold') ? 'bold' : 'normal');
      handleDesignChange('menuStyle', formats.includes('italic') ? 'italic' : 'normal');
      handleDesignChange('menuDecoration', formats.includes('underlined') ? 'underline' : 'none');
    }
  };
  
  // Funktion zum Prüfen, ob eine bestimmte Farbe ausgewählt ist
  const isColorSelected = (colorValue) => {
    // Direkte Übereinstimmung (bei Hex-Werten)
    if (design.topbarColor === colorValue) {
      return true;
    }
    
    // Übereinstimmung bei Theme-Farben
    if (theme.palette[design.topbarColor]?.main === colorValue) {
      return true;
    }
    
    return false;
  };
  
  // Funktion zum Ermitteln der aktuellen Farbe für den Color-Picker
  const getCurrentColor = () => {
    // Wenn es ein Hex-Wert ist
    if (design.topbarColor && design.topbarColor.startsWith('#')) {
      return design.topbarColor;
    }
    
    // Wenn es ein Theme-Schlüssel ist
    if (design.topbarColor && theme.palette[design.topbarColor]?.main) {
      return theme.palette[design.topbarColor].main;
    }
    
    // Fallback
    return '#4caf50';
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Topbar-Farbe
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
        {colorOptions.map((color) => (
          <ToggleButton
            key={color.value}
            value={color.value}
            selected={isColorSelected(color.value)}
            onChange={() => {
              // Finde das passende Theme-Option für diese Farbe
              const matchingTheme = themeOptions.find(
                option => theme.palette[option.value]?.main === color.value
              );
              
              if (matchingTheme) {
                handleDesignChange('topbarColor', matchingTheme.value);
              } else {
                // Wenn keine passende Theme-Option gefunden wurde, setze die direkte Farbe
                handleDesignChange('topbarColor', color.value);
              }
            }}
            aria-label={color.name}
            sx={{
              width: '36px',
              height: '36px',
              p: 0,
              minWidth: '36px',
              bgcolor: color.value,
              borderColor: isColorSelected(color.value) ? '#2196f3' : '#ccc',
              borderWidth: isColorSelected(color.value) ? 2 : 1,
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
            value={getCurrentColor()}
            onChange={(e) => handleDesignChange('topbarColor', e.target.value)}
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
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={design.showDividers}
              onChange={(e) => handleDesignChange('showDividers', e.target.checked)}
            />
          }
          label="Trenner zwischen Menüpunkten anzeigen"
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Menü-Abstand
        </Typography>
        <Box sx={{ px: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">Eng</Typography>
            <Slider
              value={design.menuSpacing}
              min={0.5}
              max={4}
              step={0.5}
              valueLabelDisplay="auto"
              onChange={(e, value) => handleDesignChange('menuSpacing', value)}
              sx={{
                color: '#4caf50', // Grüne Farbe wie beim Balkenhöhe-Slider
                '& .MuiSlider-thumb': {
                  height: 16,
                  width: 16,
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                },
                '& .MuiSlider-track': {
                  height: 8
                },
                '& .MuiSlider-rail': {
                  height: 8,
                  opacity: 0.2,
                  backgroundColor: '#bdbdbd',
                }
              }}
            />
            <Typography variant="caption">Weit</Typography>
          </Stack>
        </Box>
      </Box>
      
      {/* Floating Bar Einstellungen */}
      <Box sx={{ mb: 3, mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>Navigationsbalken</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Hier kannst du den animierten Balken unter den Navigationspunkten anpassen oder deaktivieren.
          <strong> Bewege den Mauszeiger über die Menüpunkte in der Vorschau oben, um den Balken in Aktion zu sehen.</strong>
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={design.floatingBar?.enabled !== false}
                onChange={(e) => handleNestedChange('floatingBar', 'enabled', e.target.checked)}
              />
            }
            label="Animierten Balken anzeigen"
          />
        </Box>
        
        {/* Balken-Höhe Einstellung */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Balken-Höhe</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">Dünn</Typography>
            <Slider
              value={design.floatingBar?.height || 3}
              min={1}
              max={8}
              step={1}
              valueLabelDisplay="auto"
              onChange={(e, value) => handleNestedChange('floatingBar', 'height', value)}
              disabled={design.floatingBar?.enabled === false}
              sx={{
                color: '#4caf50', // Grüne Farbe
                '& .MuiSlider-thumb': {
                  height: 16,
                  width: 16,
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                },
                '& .MuiSlider-track': {
                  height: 8
                },
                '& .MuiSlider-rail': {
                  height: 8,
                  opacity: 0.2,
                  backgroundColor: '#bdbdbd',
                }
              }}
            />
            <Typography variant="caption">Dick</Typography>
          </Stack>
        </Box>
        
        {/* Balken-Farbe */}
        <Typography variant="subtitle2" gutterBottom>Balken-Farbe</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
          {colorOptions.map((color) => (
            <ToggleButton
              key={color.value}
              value={color.value}
              selected={design.floatingBar?.color === color.value}
              onChange={() => handleNestedChange('floatingBar', 'color', color.value)}
              aria-label={color.name}
              disabled={design.floatingBar?.enabled === false}
              sx={{
                width: '36px',
                height: '36px',
                p: 0,
                minWidth: '36px',
                bgcolor: color.value,
                borderColor: design.floatingBar?.color === color.value ? '#2196f3' : '#ccc',
                borderWidth: design.floatingBar?.color === color.value ? 2 : 1,
                opacity: design.floatingBar?.enabled === false ? 0.5 : 1,
                '&:hover': {
                  bgcolor: color.value,
                  opacity: design.floatingBar?.enabled === false ? 0.5 : 0.9,
                },
                '&.Mui-selected': {
                  bgcolor: color.value,
                },
                '&.Mui-selected:hover': {
                  bgcolor: color.value,
                  opacity: design.floatingBar?.enabled === false ? 0.5 : 0.9,
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
              cursor: design.floatingBar?.enabled === false ? 'default' : 'pointer',
              border: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              opacity: design.floatingBar?.enabled === false ? 0.5 : 1,
            }}
            title="Benutzerdefinierte Farbe"
          >
            <Input
              type="color"
              value={design.floatingBar?.color || '#ffffff'}
              onChange={(e) => handleNestedChange('floatingBar', 'color', e.target.value)}
              disabled={design.floatingBar?.enabled === false}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '150%',
                height: '150%',
                opacity: 0,
                cursor: design.floatingBar?.enabled === false ? 'default' : 'pointer',
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '10px' }}>+</Typography>
          </Box>
        </Box>
      </Box>
      
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Menüpunkte-Formatierung</Typography>
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="menu-font-label">Schriftart Menü</InputLabel>
        <Select
          labelId="menu-font-label"
          value={design.menuFont}
          label="Schriftart Menü"
          onChange={(e) => handleDesignChange('menuFont', e.target.value)}
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
      
      {/* Menütext-Formatierung und Farbe nebeneinander in einer Zeile */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Menütext-Formatierung
            </Typography>
            <ToggleButtonGroup
              value={getCurrentMenuFormats()}
              onChange={handleMenuFormatChange}
              aria-label="menu text formatting"
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
              Menütext-Farbe
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {colorOptions.map((color) => (
                <ToggleButton
                  key={color.value}
                  value={color.value}
                  selected={design.menuColor === color.value}
                  onChange={() => handleDesignChange('menuColor', color.value)}
                  aria-label={color.name}
                  sx={{
                    width: '36px',
                    height: '36px',
                    p: 0,
                    minWidth: '36px',
                    bgcolor: color.value,
                    borderColor: design.menuColor === color.value ? '#2196f3' : '#ccc',
                    borderWidth: design.menuColor === color.value ? 2 : 1,
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
                  value={design.menuColor}
                  onChange={(e) => handleDesignChange('menuColor', e.target.value)}
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

export default TopbarMenuTab;