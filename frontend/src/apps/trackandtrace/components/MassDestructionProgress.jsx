// MassDestructionProgress.jsx - Verbesserte Version
// Änderungen, um sicherzustellen, dass onComplete korrekt aufgerufen wird

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
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

/**
 * Dialog-Komponente, die den Fortschritt bei der Massenvernichtung von Stecklingen anzeigt
 * 
 * @param {boolean} open - Steuert, ob der Dialog geöffnet ist
 * @param {number} totalItems - Gesamtzahl der zu vernichtenden Stecklinge
 * @param {string} geneticName - Name der Genetik für die Anzeige
 * @param {Function} onComplete - Callback, der aufgerufen wird, wenn der Prozess abgeschlossen ist
 */
const MassDestructionProgress = ({ open, totalItems = 100, geneticName = "", onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [message, setMessage] = useState('Initialisierung...');
  const [stage, setStage] = useState('init'); // init, destroying, complete
  
  // Wichtig: Stellen Sie sicher, dass Komponente zurückgesetzt wird, wenn sie geschlossen wird
  useEffect(() => {
    if (!open) {
      setProgress(0);
      setCurrentItem(0);
      setStage('init');
      setMessage('Initialisierung...');
    }
  }, [open]);

  // Simulation des Fortschritts
  useEffect(() => {
    if (!open) return;
    
    let isMounted = true; // Flag, um zu verhindern, dass abgebrochene Aufrufe noch State ändern
    let initTimer;
    let interval;

    // Zurücksetzen bei Öffnung
    setProgress(0);
    setCurrentItem(0);
    setStage('init');
    setMessage('Initialisierung der Massenvernichtung...');

    // Initialisierungsphase
    initTimer = setTimeout(() => {
      if (!isMounted) return;
      
      setStage('destroying');
      setMessage('Stecklinge werden vernichtet...');
      
      // Berechne die angemessene Dauer basierend auf der Elementzahl
      // Minimum 1.5 Sekunden, Maximum 5 Sekunden
      const totalDuration = Math.min(Math.max(totalItems * 5, 1500), 5000);
      const intervalSpeed = totalDuration / totalItems;
      
      // Hauptschleife für die Simulation der Vernichtung
      let count = 0;
      interval = setInterval(() => {
        if (!isMounted) {
          clearInterval(interval);
          return;
        }
        
        count++;
        setCurrentItem(count);
        const newProgress = Math.min((count / totalItems) * 100, 99.5);
        setProgress(newProgress);
        
        // Ändern der Nachricht für verschiedene Phasen
        if (newProgress > 25 && newProgress <= 50) {
          setMessage('Datenbankeinträge werden aktualisiert...');
        } else if (newProgress > 50 && newProgress <= 75) {
          setMessage('Stecklinge werden als vernichtet markiert...');
        } else if (newProgress > 75 && newProgress < 95) {
          setMessage('Überprüfung der Batchdaten...');
        } else if (newProgress >= 95) {
          setMessage('Vernichtung wird abgeschlossen...');
        }
        
        // Wenn wir fertig sind
        if (count >= totalItems) {
          clearInterval(interval);
          
          // Kurz warten und dann abschließen
          setTimeout(() => {
            if (!isMounted) return;
            
            setProgress(100);
            setMessage('Vernichtung abgeschlossen!');
            setStage('complete');
            
            // Dialog nach kurzer Verzögerung schließen
            setTimeout(() => {
              if (!isMounted) return;
              
              console.log("Animation abgeschlossen, rufe onComplete auf");
              if (onComplete) onComplete();
            }, 1000);
          }, 500);
        }
      }, intervalSpeed);
    }, 800);

    // Cleanup-Funktion
    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [open, totalItems, onComplete]);

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      disablePortal
    >
      <DialogTitle>Massenvernichtung durchführen</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Fortschritt: {Math.round(progress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={stage === 'complete' ? 'success' : 'error'} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            {currentItem} von {totalItems} Stecklingen
          </Typography>
        </Box>
        
        <Typography variant="body1" gutterBottom>
          {stage === 'complete' ? 
            `Alle ${totalItems} Stecklinge von "${geneticName}" wurden erfolgreich vernichtet.` : 
            message
          }
        </Typography>
        
        <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
          {/* Animierte Stecklinge die vernichtet werden */}
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
                  height: 90,
                  position: 'relative'
                }}>
                  {/* Steckling mit Animation */}
                  <Box sx={{ 
                    position: 'relative',
                    height: 70,
                    width: 30,
                    opacity: progress > index * 20 + 40 ? 
                      Math.max(0, 1 - ((progress - (index * 20 + 40)) / 50)) : 1,
                    transition: 'opacity 0.8s ease-in-out',
                  }}>
                    {/* Steckling Stamm */}
                    <Box sx={{ 
                      width: 3,
                      bgcolor: 'success.main',
                      height: 40,
                      position: 'absolute',
                      bottom: 0,
                      left: 'calc(50% - 1.5px)',
                      zIndex: 1
                    }} />
                    
                    {/* Blätter */}
                    <LocalFloristIcon 
                      color="success" 
                      sx={{ 
                        position: 'absolute',
                        bottom: 35,
                        left: 'calc(50% - 12px)',
                        fontSize: 24
                      }} 
                    />
                    
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
                  
                  {/* Vernichtungssymbol mit Animation */}
                  {progress > index * 20 + 40 && (
                    <DeleteForeverIcon 
                      color="error" 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 36,
                        opacity: Math.min(1, (progress - (index * 20 + 40)) / 30),
                        animation: 'pulseAnimation 1.5s infinite',
                        '@keyframes pulseAnimation': {
                          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
                          '50%': { transform: 'translate(-50%, -50%) scale(1.2)' },
                          '100%': { transform: 'translate(-50%, -50%) scale(1)' }
                        }
                      }} 
                    />
                  )}
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
                  {progress > index * 20 + 60 ? 'Vernichtet' : 'Steckling ' + (index + 1)}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Spinner bei laufendem Prozess */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {progress < 100 ? (
              <CircularProgress size={24} color="error" />
            ) : (
              <Typography variant="body2" color="success.main">Massenvernichtung erfolgreich abgeschlossen!</Typography>
            )}
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default MassDestructionProgress;