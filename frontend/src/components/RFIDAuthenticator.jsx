// frontend/src/components/RFIDAuthenticator.jsx
import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, LinearProgress, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import api from '@/utils/api';

/**
 * RFID-Authentifikations-Komponente
 * @param {Object} props 
 * @param {Function} props.onAuthenticated - Callback mit (memberId, memberName)
 * @param {string} props.targetApp - Name der Ziel-App für Logging
 * @param {number} props.timeout - Timeout in Sekunden (default: 120)
 * @param {boolean} props.autoClose - Automatisch schließen nach Erfolg (default: false)
 */
export default function RFIDAuthenticator({ 
  onAuthenticated, 
  targetApp = 'default', 
  timeout = 120, 
  autoClose = false 
}) {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, waiting, authenticated, error, timeout
  const [progress, setProgress] = useState(0);
  const [member, setMember] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  
  // Session erstellen
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await api.post('/rfid-bridge/sessions/', { 
          target_app: targetApp 
        });
        
        if (response.data.success) {
          setSessionId(response.data.session_id);
          setStatus('waiting');
        } else {
          setStatus('error');
          setError('Fehler beim Erstellen der Session');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Fehler beim Erstellen der Session');
      }
    };
    
    createSession();
    
    return () => {
      // Cleanup-Logik falls nötig
    };
  }, [targetApp]);
  
  // Polling für RFID-Events
  useEffect(() => {
    if (status !== 'waiting' || !sessionId) return;
    
    const pollInterval = 1000; // 1 Sekunde
    let timer = null;
    
    const checkForRFID = async () => {
      try {
        const response = await api.get(`/rfid-bridge/sessions/${sessionId}/check/`);
        
        // Authentifizierung erfolgreich
        if (response.data.success && response.data.status === 'authenticated') {
          setStatus('authenticated');
          setMember({
            id: response.data.member_id,
            name: response.data.member_name
          });
          
          // Callback aufrufen
          if (onAuthenticated) {
            onAuthenticated(response.data.member_id, response.data.member_name);
          }
          
          // Automatisch schließen, falls gewünscht
          if (autoClose) {
            setTimeout(() => {
              setStatus('closed');
            }, 3000);
          }
        }
      } catch (err) {
        console.error('RFID check error:', err);
      }
      
      // Zeit aktualisieren
      setElapsed(prev => {
        const newElapsed = prev + pollInterval / 1000;
        setProgress((newElapsed / timeout) * 100);
        
        // Timeout erreicht
        if (newElapsed >= timeout) {
          setStatus('timeout');
          clearInterval(timer);
        }
        
        return newElapsed;
      });
    };
    
    // Initial prüfen
    checkForRFID();
    
    // Polling starten
    timer = setInterval(checkForRFID, pollInterval);
    
    // Cleanup
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionId, status, timeout, onAuthenticated, autoClose]);
  
  // Rendering basierend auf Status
  const renderContent = useCallback(() => {
    switch (status) {
      case 'initializing':
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body1">Initialisiere RFID-Authentication...</Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Box>
        );
        
      case 'waiting':
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bitte RFID-Karte scannen
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Halten Sie Ihre Karte an das Lesegerät
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mt: 2, mb: 1 }} 
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round(timeout - elapsed)} Sekunden verbleibend
            </Typography>
          </Box>
        );
        
      case 'authenticated':
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Authentifizierung erfolgreich!
            </Alert>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6">{member?.name}</Typography>
            </Box>
            {!autoClose && (
              <Typography variant="body2" color="text.secondary">
                Sie können jetzt fortfahren.
              </Typography>
            )}
          </Box>
        );
        
      case 'error':
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Ein Fehler ist aufgetreten: {error || 'Unbekannter Fehler'}
            </Alert>
            <Typography variant="body2">
              Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.
            </Typography>
          </Box>
        );
        
      case 'timeout':
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Zeitüberschreitung
            </Alert>
            <Typography variant="body2">
              Es wurde keine RFID-Karte gescannt. Bitte laden Sie die Seite neu.
            </Typography>
          </Box>
        );
        
      default:
        return null;
    }
  }, [status, progress, timeout, elapsed, member, error, autoClose]);
  
  return (
    <Paper 
      elevation={3}
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      {renderContent()}
    </Paper>
  );
}