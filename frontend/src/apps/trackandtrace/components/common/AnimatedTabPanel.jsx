// frontend/src/apps/trackandtrace/components/common/AnimatedTabPanel.jsx
import React, { useEffect, useState } from 'react'
import { Box, Fade, Slide, Grow } from '@mui/material'

/**
 * AnimatedTabPanel - Eine wiederverwendbare Komponente für animierte Tab-Wechsel
 * mit Optimierungen zur Vermeidung von Layout-Shifts durch Scrollbalken
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
  
  // Ref für den Inhalt-Container
  const contentRef = React.useRef(null);
  
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
  
  // Gemeinsame Styling-Eigenschaften für alle Animationstypen
  const containerStyles = {
    width: '100%',
    overflowX: 'hidden',
    position: 'relative',
    // Wichtig: Stelle sicher, dass der Container niemals breiter als 100% wird
    maxWidth: '100%',
    // Vermeide Scrollbalken während Animationen
    overflowY: isActive ? 'visible' : 'hidden'
  };
  
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
            <Box ref={contentRef} sx={containerStyles}>{children}</Box>
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
            <Box ref={contentRef} sx={containerStyles}>{children}</Box>
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
            <Box ref={contentRef} sx={containerStyles}>{children}</Box>
          </Grow>
        );
      default:
        return (
          <Box 
            ref={contentRef}
            sx={{
              ...containerStyles,
              display: isActive ? 'block' : 'none'
            }}
          >
            {children}
          </Box>
        );
    }
  };

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      className="animated-tab-panel"
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {renderAnimatedContent()}
    </div>
  );
};

export default AnimatedTabPanel;