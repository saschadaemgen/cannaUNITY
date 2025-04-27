// Diese Funktion sollte zu jeder Seiten-Komponente hinzugefügt werden
// Frontend/src/apps/trackandtrace/components/common/AnimatedTabPanel.jsx

import React, { useEffect, useState } from 'react'
import { Box, Fade, Slide, Grow } from '@mui/material'

/**
 * AnimatedTabPanel - Eine wiederverwendbare Komponente für animierte Tab-Wechsel
 * mit globalen Animations-Einstellungen
 * 
 * @param {number} value - Aktueller Tab-Wert
 * @param {number} index - Index des Tab-Panels
 * @param {string} animationType - Überschreibung des globalen Animationstyps (optional)
 * @param {number} duration - Überschreibung der globalen Animationsdauer (optional)
 * @param {string} direction - Richtung für slide-Animation ('left', 'right', 'up', 'down')
 * @param {node} children - Inhalt des Tab-Panels
 */
const AnimatedTabPanel = ({ 
  value, 
  index, 
  animationType, 
  duration,
  direction = 'right',
  children 
}) => {
  const isActive = value === index;
  const [animSettings, setAnimSettings] = useState({
    enabled: true,
    type: animationType || 'slide',
    duration: duration || 400,
  });
  
  // Globale Animations-Einstellungen laden
  useEffect(() => {
    // Überprüfe, ob wir im Browser sind und ob localStorage verfügbar ist
    if (typeof window !== 'undefined') {
      try {
        const savedOptions = localStorage.getItem('designOptions');
        if (savedOptions) {
          const options = JSON.parse(savedOptions);
          if (options.animations) {
            setAnimSettings({
              enabled: options.animations.enabled !== false,
              type: animationType || options.animations.type || 'slide',
              duration: duration || options.animations.duration || 400,
            });
          }
        }
      } catch (e) {
        console.warn('Konnte Animations-Einstellungen nicht laden:', e);
      }
    }
  }, [animationType, duration]);
  
  // Listener für Änderungen an den Design-Optionen
  useEffect(() => {
    const handleDesignChanged = (event) => {
      const options = event.detail?.designOptions;
      if (options?.animations) {
        setAnimSettings({
          enabled: options.animations.enabled !== false,
          type: animationType || options.animations.type || 'slide',
          duration: duration || options.animations.duration || 400,
        });
      }
    };
    
    window.addEventListener('designChanged', handleDesignChanged);
    return () => {
      window.removeEventListener('designChanged', handleDesignChanged);
    };
  }, [animationType, duration]);
  
  // Wenn Animationen deaktiviert sind, einfach normal rendern ohne Animation
  if (!animSettings.enabled) {
    return (
      <div
        role="tabpanel"
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        style={{ width: '100%', display: isActive ? 'block' : 'none' }}
      >
        {isActive && children}
      </div>
    );
  }
  
  // Animation basierend auf dem Typ wählen
  const renderAnimatedContent = () => {
    switch (animSettings.type) {
      case 'fade':
        return (
          <Fade 
            in={isActive} 
            timeout={animSettings.duration}
            mountOnEnter 
            unmountOnExit
          >
            <Box>{children}</Box>
          </Fade>
        );
      case 'slide':
        return (
          <Slide 
            direction={direction} 
            in={isActive} 
            timeout={animSettings.duration}
            mountOnEnter 
            unmountOnExit
          >
            <Box>{children}</Box>
          </Slide>
        );
      case 'grow':
        return (
          <Grow 
            in={isActive} 
            timeout={animSettings.duration}
            mountOnEnter 
            unmountOnExit
          >
            <Box>{children}</Box>
          </Grow>
        );
      default:
        return <Box sx={{ display: isActive ? 'block' : 'none' }}>{children}</Box>;
    }
  };

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ width: '100%' }}
    >
      {renderAnimatedContent()}
    </div>
  );
};

export default AnimatedTabPanel;