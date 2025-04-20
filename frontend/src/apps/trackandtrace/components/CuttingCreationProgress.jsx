// CuttingCreationProgress.jsx - In src/apps/trackandtrace/components/ speichern
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
import ContentCutIcon from '@mui/icons-material/ContentCut';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

/**
 * Dialog-Komponente, die den Fortschritt bei der Erstellung von Stecklingen anzeigt
 * 
 * @param {boolean} open - Steuert, ob der Dialog geöffnet ist
 * @param {number} totalCuttings - Gesamtzahl der zu erstellenden Stecklinge
 * @param {Function} onComplete - Callback, der aufgerufen wird, wenn der Prozess abgeschlossen ist
 */
const CuttingCreationProgress = ({ open, totalCuttings = 1000, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentCutting, setCurrentCutting] = useState(0);
  const [message, setMessage] = useState('Initialisierung...');
  const [stage, setStage] = useState('init'); // init, creating, finalizing, complete

  // Simulation des Fortschritts
  useEffect(() => {
    if (!open) return;

    // Zurücksetzen bei Öffnung
    setProgress(0);
    setCurrentCutting(0);
    setStage('init');
    setMessage('Initialisierung...');

    // Initialisierungsphase
    const initTimer = setTimeout(() => {
      setStage('creating');
      setMessage('Stecklingsbatch wird angelegt...');
      
      // Hauptschleife zum Erstellen der Stecklinge
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setCurrentCutting(count);
        const newProgress = Math.min((count / totalCuttings) * 100, 99.5);
        setProgress(newProgress);
        
        // Ändern der Nachricht für verschiedene Phasen
        if (newProgress > 25 && newProgress <= 50) {
          setMessage('Stecklinge werden geschnitten...');
        } else if (newProgress > 50 && newProgress <= 75) {
          setMessage('Individuelle Stecklings-IDs werden generiert...');
        } else if (newProgress > 75 && newProgress < 95) {
          setMessage('Datenbank-Einträge werden erstellt...');
        } else if (newProgress >= 95) {
          setMessage('Daten werden finalisiert...');
        }
        
        // Wenn wir fertig sind
        if (count >= totalCuttings) {
          clearInterval(interval);
          setStage('finalizing');
          
          // Kurz warten und dann abschließen
          setTimeout(() => {
            setProgress(100);
            setMessage('Stecklings-Erstellung abgeschlossen!');
            setStage('complete');
            
            // Dialog nach kurzer Verzögerung schließen
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 1000);
          }, 500);
        }
      }, Math.max(3000 / totalCuttings, 3)); // Mindestens 3ms pro Steckling, max 3 Sekunden gesamt
      
      return () => {
        clearTimeout(initTimer);
        clearInterval(interval);
      };
    }, 800);

    return () => clearTimeout(initTimer);
  }, [open, totalCuttings, onComplete]);

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Stecklinge erstellen</DialogTitle>
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
            {currentCutting} von {totalCuttings} Stecklingen
          </Typography>
        </Box>
        
        <Typography variant="body1" gutterBottom>
          {message}
        </Typography>
        
        <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
          {/* Animierte Stecklinge */}
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
                  {/* Scissor Animation */}
                  {progress > index * 20 && progress < index * 20 + 15 && (
                    <ContentCutIcon 
                      color="action" 
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: -20,
                        animation: 'snip 0.5s ease-in-out',
                        '@keyframes snip': {
                          '0%': { transform: 'rotate(0deg) translateX(-10px)' },
                          '50%': { transform: 'rotate(-20deg) translateX(0px)' },
                          '100%': { transform: 'rotate(0deg) translateX(10px)' }
                        }
                      }} 
                    />
                  )}

                  {/* Steckling */}
                  <Box sx={{ 
                    width: 3,
                    bgcolor: 'success.main',
                    height: `${Math.min(progress / 100, 1) * 40}px`,
                    transition: 'height 0.3s ease-in-out',
                    position: 'absolute',
                    bottom: 0,
                    left: 'calc(50% - 1.5px)',
                    zIndex: 1
                  }} />
                  
                  {/* Blattknospen */}
                  {progress > index * 20 + 30 && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: `${Math.min(progress / 100, 1) * 30}px`,
                      width: 8,
                      height: 3,
                      bgcolor: 'success.light',
                      transition: 'all 0.3s ease-in-out',
                      transform: 'rotate(45deg)',
                      left: 'calc(50% - 6px)'
                    }} />
                  )}
                  
                  {progress > index * 20 + 40 && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: `${Math.min(progress / 100, 1) * 30}px`,
                      width: 8,
                      height: 3,
                      bgcolor: 'success.light',
                      transition: 'all 0.3s ease-in-out',
                      transform: 'rotate(-45deg)',
                      right: 'calc(50% - 6px)'
                    }} />
                  )}
                  
                  {/* Kleine Blätter oben */}
                  {progress > index * 20 + 50 && (
                    <LocalFloristIcon 
                      color="success" 
                      sx={{ 
                        position: 'absolute',
                        bottom: `${Math.min(progress / 100, 1) * 40}px`,
                        opacity: Math.min((progress - (index * 20 + 50)) / 30, 1),
                        transform: `scale(${Math.min(progress / 100, 1) * 0.5 + 0.2})`,
                        transition: 'all 0.3s ease-in-out',
                      }} 
                    />
                  )}
                  
                  {/* Wasserglas/Behälter */}
                  <Box sx={{ 
                    width: 14, 
                    height: 18, 
                    borderRadius: '0 0 7px 7px', 
                    border: '1px solid',
                    borderColor: 'primary.light',
                    borderTop: 'none',
                    position: 'absolute',
                    bottom: 0,
                    left: 'calc(50% - 7px)',
                    zIndex: 0,
                    overflow: 'hidden'
                  }}>
                    {/* Wasser im Glas */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '40%',
                      bgcolor: 'primary.light',
                      opacity: 0.4,
                    }} />
                  </Box>
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
                  Steckling {index + 1}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Spinner bei laufendem Prozess */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {progress < 100 ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="body2" color="success.main">Alle Stecklinge erfolgreich erstellt!</Typography>
            )}
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default CuttingCreationProgress;