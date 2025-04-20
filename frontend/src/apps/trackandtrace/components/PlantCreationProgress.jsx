// PlantCreationProgress.jsx - In src/apps/trackandtrace/components/ speichern
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  LinearProgress, 
  Typography, 
  Box, 
  Paper,
  CircularProgress,
  Grid
} from '@mui/material';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

/**
 * Dialog-Komponente, die den Fortschritt bei der Erstellung von Pflanzen anzeigt
 * 
 * @param {boolean} open - Steuert, ob der Dialog geöffnet ist
 * @param {number} totalPlants - Gesamtzahl der zu erstellenden Pflanzen
 * @param {Function} onComplete - Callback, der aufgerufen wird, wenn der Prozess abgeschlossen ist
 */
const PlantCreationProgress = ({ open, totalPlants = 1000, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentPlant, setCurrentPlant] = useState(0);
  const [message, setMessage] = useState('Initialisierung...');
  const [stage, setStage] = useState('init'); // init, creating, finalizing, complete

  // Simulation des Fortschritts
  useEffect(() => {
    if (!open) return;

    // Zurücksetzen bei Öffnung
    setProgress(0);
    setCurrentPlant(0);
    setStage('init');
    setMessage('Initialisierung...');

    // Initialisierungsphase
    const initTimer = setTimeout(() => {
      setStage('creating');
      setMessage('Pflanzenbatch wird angelegt...');
      
      // Hauptschleife zum Erstellen der Pflanzen
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setCurrentPlant(count);
        const newProgress = Math.min((count / totalPlants) * 100, 99.5);
        setProgress(newProgress);
        
        // Ändern der Nachricht für verschiedene Phasen
        if (newProgress > 25 && newProgress <= 50) {
          setMessage('Genetische Informationen werden zugewiesen...');
        } else if (newProgress > 50 && newProgress <= 75) {
          setMessage('Individuelle Pflanzen-IDs werden generiert...');
        } else if (newProgress > 75 && newProgress < 95) {
          setMessage('Datenbank-Einträge werden erstellt...');
        } else if (newProgress >= 95) {
          setMessage('Daten werden finalisiert...');
        }
        
        // Wenn wir fertig sind
        if (count >= totalPlants) {
          clearInterval(interval);
          setStage('finalizing');
          
          // Kurz warten und dann abschließen
          setTimeout(() => {
            setProgress(100);
            setMessage('Pflanzenerstellung abgeschlossen!');
            setStage('complete');
            
            // Dialog nach kurzer Verzögerung schließen
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 1000);
          }, 500);
        }
      }, Math.max(3000 / totalPlants, 3)); // Mindestens 3ms pro Pflanze, max 3 Sekunden gesamt
      
      return () => {
        clearTimeout(initTimer);
        clearInterval(interval);
      };
    }, 800);

    return () => clearTimeout(initTimer);
  }, [open, totalPlants, onComplete]);

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Pflanzen erstellen</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Fortschritt: {Math.round(progress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={stage === 'complete' ? 'success' : 'primary'} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            {currentPlant} von {totalPlants} Pflanzen
          </Typography>
        </Box>
        
        <Typography variant="body1" gutterBottom>
          {message}
        </Typography>
        
        <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
          {/* Wachsende Pflanzen */}
          <Grid container spacing={2} justifyContent="space-around">
            {[0, 1, 2, 3, 4].map((index) => (
              <Grid item key={index} sx={{ 
                opacity: progress > index * 20 ? 1 : 0.2,
                transition: 'opacity 0.5s ease-in-out',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'flex-end', 
                  height: 70,
                  position: 'relative'
                }}>
                  {/* Stamm */}
                  <Box sx={{ 
                    width: 4,
                    bgcolor: 'success.main',
                    height: `${Math.min(progress / 100, 1) * 45}px`,
                    transition: 'height 0.3s ease-in-out',
                    position: 'absolute',
                    bottom: 0,
                    left: 'calc(50% - 2px)',
                    zIndex: 1
                  }} />
                  
                  {/* Blüte/Blatt oben */}
                  <LocalFloristIcon 
                    color="success" 
                    sx={{ 
                      position: 'absolute',
                      bottom: `${Math.min(progress / 100, 1) * 45}px`,
                      opacity: Math.min(progress / 50, 1),
                      transform: `scale(${Math.min(progress / 100, 1) * 0.8 + 0.2})`,
                      transition: 'all 0.3s ease-in-out',
                    }} 
                  />
                  
                  {/* Basis/Topf */}
                  <Box sx={{ 
                    width: 20, 
                    height: 4, 
                    bgcolor: 'warning.main', 
                    borderRadius: '2px',
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 0
                  }} />
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    display: 'block',
                    opacity: progress > (index * 20 + 10) ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out' 
                  }}
                >
                  Pflanze {index + 1}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Spinner bei laufendem Prozess */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {progress < 100 ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="body2" color="success.main">Alle Pflanzen erfolgreich erstellt!</Typography>
            )}
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default PlantCreationProgress;