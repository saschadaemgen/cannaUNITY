// Dateiname: src/layout/TopbarEnvironmentHook.jsx

import { useState, useEffect } from 'react';

/**
 * Hook zur Verwaltung der Umgebungsdaten (Temperatur, Luftfeuchtigkeit etc.)
 * Kann später zum Abrufen echter Daten von einer API erweitert werden
 * 
 * @param {number} updateInterval - Aktualisierungsintervall in Millisekunden
 * @returns {Object} Umgebungsdaten (Temperatur, Luftfeuchtigkeit)
 */
function useEnvironmentData(updateInterval = 60000) {
  const [environmentData, setEnvironmentData] = useState({
    temperature: 22.7,
    humidity: 60
  });
  
  // Simulierte Aktualisierung der Umgebungsdaten
  useEffect(() => {
    // Diese Funktion könnte später eine API-Anfrage enthalten
    const updateEnvironmentData = () => {
      // Hier könnte später ein API-Aufruf stehen
      // Für jetzt liefern wir nur statische Demo-Daten
      setEnvironmentData({
        temperature: 22.7,
        humidity: 60
      });
    };
    
    // Initiale Aktualisierung
    updateEnvironmentData();
    
    // Regelmäßige Aktualisierung einrichten
    const intervalId = setInterval(updateEnvironmentData, updateInterval);
    
    // Cleanup: Intervall beenden, wenn die Komponente entfernt wird
    return () => clearInterval(intervalId);
  }, [updateInterval]);
  
  return environmentData;
}

export default useEnvironmentData;