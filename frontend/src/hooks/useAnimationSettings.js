// frontend/src/hooks/useAnimationSettings.js
import { useState, useEffect } from 'react';

/**
 * Hook zum Verwalten von Animationseinstellungen
 * 
 * @param {string} defaultType - Standard-Animationstyp (optional)
 * @param {number} defaultDuration - Standard-Animationsdauer (optional)
 * @param {boolean} defaultEnabled - Sind Animationen standardmäßig aktiviert (optional)
 * @returns {Object} Objekt mit den Animationseinstellungen (type, duration, enabled)
 */
const useAnimationSettings = (
  defaultType = 'slide',
  defaultDuration = 500,
  defaultEnabled = true
) => {
  // Initialisiere mit Standardwerten
  const [animSettings, setAnimSettings] = useState({
    type: defaultType,
    duration: defaultDuration,
    enabled: defaultEnabled,
  });

  // Lade Einstellungen aus localStorage beim Mounten
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedOptions = localStorage.getItem('designOptions');
        if (savedOptions) {
          const options = JSON.parse(savedOptions);
          if (options.animations) {
            setAnimSettings({
              type: options.animations.type || defaultType,
              duration: options.animations.duration || defaultDuration,
              enabled: options.animations.enabled !== false,
            });
            console.log('Animation-Einstellungen geladen:', options.animations);
          }
        }
      } catch (error) {
        console.warn('Fehler beim Laden der Animation-Einstellungen:', error);
      }
    };

    // Beim ersten Mounten laden
    loadSettings();

    // Event-Listener für Änderungen der Design-Optionen
    const handleDesignChanged = (event) => {
      const options = event.detail?.designOptions;
      if (options?.animations) {
        setAnimSettings({
          type: options.animations.type || defaultType,
          duration: options.animations.duration || defaultDuration,
          enabled: options.animations.enabled !== false,
        });
        console.log('Animation-Einstellungen aktualisiert durch Event:', options.animations);
      }
    };

    // Separater Event-Listener speziell für Animationsänderungen
    const handleAnimationSettingsChanged = (event) => {
      const animations = event.detail?.animations;
      if (animations) {
        setAnimSettings({
          type: animations.type || defaultType,
          duration: animations.duration || defaultDuration,
          enabled: animations.enabled !== false,
        });
        console.log('Animation-Einstellungen aktualisiert durch spezifisches Event:', animations);
      }
    };

    // Event-Listener hinzufügen
    window.addEventListener('designChanged', handleDesignChanged);
    window.addEventListener('animationSettingsChanged', handleAnimationSettingsChanged);

    // Event-Listener entfernen beim Unmounten
    return () => {
      window.removeEventListener('designChanged', handleDesignChanged);
      window.removeEventListener('animationSettingsChanged', handleAnimationSettingsChanged);
    };
  }, [defaultType, defaultDuration, defaultEnabled]);

  return animSettings;
};

export default useAnimationSettings;