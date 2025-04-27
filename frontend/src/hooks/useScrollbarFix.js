// src/hooks/useScrollbarFix.js
import { useEffect, useLayoutEffect } from 'react';

/**
 * Hook zur Vermeidung von Layout-Shifts durch Scrollbalken-Erscheinen/Verschwinden
 * Diese Implementierung berechnet die Scrollbalkenbreite und passt das Layout an
 */
const useScrollbarFix = () => {
  // useLayoutEffect wird vor dem Browser-Paint ausgeführt
  useLayoutEffect(() => {
    // Funktion zur Berechnung der Scrollbalkenbreite
    const getScrollbarWidth = () => {
      // Erstelle ein Element mit erzwungenem Scrollbalken
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      document.body.appendChild(outer);
      
      // Erstelle ein inneres Element
      const inner = document.createElement('div');
      outer.appendChild(inner);
      
      // Differenz zwischen den Breiten ist die Scrollbalkenbreite
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
      
      // Entferne die temporären Elemente
      outer.parentNode.removeChild(outer);
      
      return scrollbarWidth;
    };

    // Berechne die Scrollbalkenbreite
    const scrollbarWidth = getScrollbarWidth();

    // Funktion zum Anwenden der Korrektur
    const applyScrollbarFix = () => {
      // Prüfe, ob ein Scrollbalken benötigt wird
      const hasVerticalScrollbar = document.body.scrollHeight > window.innerHeight;
      
      // Füge Padding rechts hinzu, wenn ein Scrollbalken benötigt wird
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      
      // Füge eine Klasse hinzu, basierend auf Scrollbalken-Status
      if (hasVerticalScrollbar) {
        document.documentElement.classList.add('has-scrollbar');
        // Verhindere horizontales Scrollen während der Scrollbalken sichtbar ist
        document.documentElement.style.paddingRight = '0px';
        document.documentElement.style.overflow = 'auto';
      } else {
        document.documentElement.classList.remove('has-scrollbar');
        // Füge Padding hinzu, um Layout-Shift zu verhindern
        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
        // Verhindere horizontales Scrollen durch das Padding
        document.documentElement.style.overflow = 'hidden';
      }
    };

    // Führe die Fix-Funktion sofort aus
    applyScrollbarFix();

    // Event-Listener für Größenänderungen des Fensters
    window.addEventListener('resize', applyScrollbarFix);
    
    // Event-Listener für DOM-Änderungen, die Scrollbalken beeinflussen könnten
    const observer = new MutationObserver(() => {
      // Aktualisiere mit einer kleinen Verzögerung, um alle Änderungen zu erfassen
      setTimeout(applyScrollbarFix, 10);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // Cleanup-Funktion
    return () => {
      window.removeEventListener('resize', applyScrollbarFix);
      observer.disconnect();
    };
  }, []);
};

export default useScrollbarFix;