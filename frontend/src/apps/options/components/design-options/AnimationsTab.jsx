// src/options/components/design-options/AnimationsTab.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Stack,
  Slider,
  Radio,
  Fade,
  Grow,
  Slide
} from '@mui/material';

import { animationTypes } from './DesignOptionsConfig';

// Die Animation Vorschau-Komponente
const AnimationPreview = ({ type, duration, enabled }) => {
  const [key, setKey] = useState(0);
  const [running, setRunning] = useState(false);
  
  // Eine Animation neu starten
  const triggerAnimation = () => {
    if (!enabled) return;
    setRunning(true);
    setKey(prevKey => prevKey + 1);
    setTimeout(() => setRunning(false), duration + 100);
  };
  
  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">Animation-Vorschau</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={!running}
              onChange={triggerAnimation}
              disabled={running || !enabled}
              size="small"
            />
          }
          label="Animation testen"
        />
      </Box>
      
      <Box sx={{ height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {enabled ? (
          type === 'fade' ? (
            <Fade key={key} in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Fade>
          ) : type === 'grow' ? (
            <Grow key={key} in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Grow>
          ) : (
            <Slide key={key} direction="right" in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Slide>
          )
        ) : (
          <Box sx={{ p: 2, bgcolor: 'grey.500', color: 'white', borderRadius: 1, opacity: 0.7 }}>
            <Typography>Animationen deaktiviert</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const AnimationsTab = ({ design, handleNestedChange }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Hier kannst du Animationen im Interface ein- oder ausschalten und anpassen
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={design.animations?.enabled !== false}
              onChange={(e) => handleNestedChange('animations', 'enabled', e.target.checked)}
              color="primary"
            />
          }
          label="Animationen aktivieren"
        />
        
        <AnimationPreview 
          type={design.animations?.type || 'slide'}
          duration={design.animations?.duration || 500}
          enabled={design.animations?.enabled !== false}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Animationstyp</Typography>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            pl: 1
          }}
        >
          {animationTypes.map((type, index) => (
            <Box 
              key={type.id} 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                mr: index < animationTypes.length - 1 ? 3 : 0 // Abstand nur zwischen den Elementen
              }}
              onClick={() => design.animations?.enabled !== false && 
                handleNestedChange('animations', 'type', type.id)
              }
            >
              <Radio
                disabled={design.animations?.enabled === false}
                checked={design.animations?.type === type.id}
                onChange={() => {}}
                size="small"
                sx={{ 
                  p: 0.5, 
                  mr: 0.5,
                  '& .MuiSvgIcon-root': { fontSize: 18 } // Kleinere Radio-Buttons
                }}
              />
              <Box sx={{ 
                cursor: design.animations?.enabled === false ? 'default' : 'pointer',
                opacity: design.animations?.enabled === false ? 0.5 : 1
              }}>
                <Typography 
                  variant="body2" 
                  component="span" 
                  sx={{ fontSize: '0.9rem' }}
                >
                  {type.label}
                </Typography>
                <Typography 
                  component="span" 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ ml: 0.5 }}
                >
                  {type.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }} disabled={design.animations?.enabled === false}>
        <Typography variant="subtitle2" gutterBottom>Animationsdauer</Typography>
        <Box sx={{ px: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption">Schnell</Typography>
            <Slider
              value={design.animations?.duration || 500}
              min={200}
              max={1000}
              step={50}
              marks={[
                { value: 200, label: '0.2s' },
                { value: 500, label: '0.5s' },
                { value: 1000, label: '1.0s' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value/1000}s`}
              onChange={(e, value) => handleNestedChange('animations', 'duration', value)}
              disabled={design.animations?.enabled === false}
            />
            <Typography variant="caption">Langsam</Typography>
          </Stack>
        </Box>
      </Box>
      
      <Typography variant="body2" color="textSecondary" sx={{ mt: 4 }}>
        Hinweis: Animationen können auf manchen Geräten die Leistung beeinträchtigen. 
        Wenn du Performance-Probleme bemerkst, kannst du die Animationen deaktivieren 
        oder die Dauer verkürzen.
      </Typography>
    </Box>
  );
};

export default AnimationsTab;