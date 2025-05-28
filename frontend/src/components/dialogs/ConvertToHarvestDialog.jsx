// frontend/src/apps/trackandtrace/components/dialogs/ConvertToHarvestDialog.jsx
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography,
  Box, CircularProgress, Fade, Zoom
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import api from '@/utils/api';

const ConvertToHarvestDialog = ({
  open,
  onClose,
  onConvert,
  title,
  sourceBatch,
  sourceType,
  members = [], // Für Kompatibilität beibehalten
  rooms = [],
  selectedPlants = [],
  loadingOptions = false
}) => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  const [memberId, setMemberId] = useState(null);
  
  // Formular-States
  const [weight, setWeight] = useState('');
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open) {
      setScanMode(false);
      setScanSuccess(false);
      setScannedMemberName('');
      setMemberId(null);
      setAbortController(null);
      setIsAborting(false);
      setWeight('');
      setRoomId('');
      setNotes('');
    }
  }, [open]);

  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true);
    setScanSuccess(false);
    await handleRfidScan();
  };

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    
    try {
      console.log("🚀 Starte RFID-Scan für Ernte-Konvertierung...");
      
      if (isAborting) return;
      
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      });
      
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;
      
      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name });
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.');
      }
      
      if (isAborting) return;
      
      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );
      
      const { member_id, member_name } = verifyRes.data;
      
      // Erfolg setzen und Mitgliedsdaten speichern
      setMemberId(member_id);
      setScannedMemberName(member_name);
      setScanSuccess(true);
      
      // 3. Nach erfolgreicher Verifizierung die Konvertierung durchführen
      setTimeout(async () => {
        // Formular-Daten vorbereiten
        const formData = {
          weight: parseFloat(weight) || 0,
          member_id: member_id, // Direkt die member_id verwenden
          room_id: roomId || null,
          notes,
          plant_ids: selectedPlants.length > 0 ? selectedPlants : []
        };
        
        console.log("Harvest form data mit RFID member_id:", formData);
        
        // onConvert mit member_id als zweitem Parameter aufrufen
        if (onConvert) {
          await onConvert(formData, member_id);
        }
        
        // Nach weiteren 2 Sekunden schließen
        setTimeout(() => {
          handleDialogClose();
        }, 2000);
      }, 500);
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
        alert(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen');
      }
      
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      if (!isAborting) {
        setLoading(false);
      }
    }
  };

  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    setIsAborting(true);
    
    if (abortController) {
      abortController.abort();
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/');
      console.log("RFID-Scan erfolgreich abgebrochen");
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error);
    } finally {
      setScanMode(false);
      setLoading(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };

  // Dialog schließen Handler
  const handleDialogClose = () => {
    setScanMode(false);
    setScanSuccess(false);
    setScannedMemberName('');
    setMemberId(null);
    
    if (onClose) {
      onClose();
    }
  };

  const isValidWeight = () => {
    const numWeight = parseFloat(weight);
    return !isNaN(numWeight) && numWeight > 0;
  };

  // Validierung: Prüft ob alle Felder ausgefüllt sind
  const isFormValid = () => {
    return isValidWeight() && roomId;
  };

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        if (scanMode && !scanSuccess) {
          return;
        }
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleDialogClose();
        }
      }} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { 
          position: 'relative',
          overflow: scanMode ? 'hidden' : 'visible'
        }
      }}
    >
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'success.light',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1300
        }}>
          {/* Abbrechen-Button nur anzeigen, wenn wir NICHT im Erfolgs-Modus sind */}
          {!scanSuccess && (
            <Button 
              onClick={handleCancelScan}
              variant="contained" 
              color="error"
              size="small"
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                minWidth: '100px'
              }}
            >
              Abbrechen
            </Button>
          )}
          
          {scanSuccess ? (
            // Erfolgsmeldung nach erfolgreichem Scan
            <Fade in={scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <Zoom in={scanSuccess}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                </Zoom>
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Autorisierung erfolgreich
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                  Ernte mit {weight}g wurde erstellt
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  Verantwortlich: {scannedMemberName}
                </Typography>
              </Box>
            </Fade>
          ) : (
            // Scan-Aufforderung
            <>
              <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
              
              <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                Bitte Ausweis jetzt scannen
              </Typography>
              
              <Typography variant="body1" align="center" color="white" gutterBottom>
                um die Ernte zu erstellen
              </Typography>
              
              {loading && (
                <CircularProgress 
                  size={60} 
                  thickness={5} 
                  sx={{ 
                    color: 'white', 
                    mt: 4 
                  }} 
                />
              )}
            </>
          )}
        </Box>
      )}
      
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <AgricultureIcon sx={{ color: 'success.main', mr: 1 }} />
        {title || 'Pflanzen zu Ernte umwandeln'}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          {selectedPlants.length > 0 
            ? `Sie wandeln ${selectedPlants.length} ausgewählte Pflanzen zu einer Ernte um.`
            : sourceBatch 
              ? `Sie erstellen eine Ernte aus ${sourceType === 'flowering' ? 'Blühpflanzen' : 'Blühpflanzen aus Stecklingen'}.`
              : 'Sie erstellen eine neue Ernte.'}
        </Typography>
        
        <TextField
          label="Gewicht in Gramm"
          type="number"
          fullWidth
          margin="normal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputProps={{ min: 0.01, step: 0.01 }}
          required
          error={!!weight && !isValidWeight()}
          helperText={weight && !isValidWeight() ? "Bitte geben Sie ein gültiges Gewicht ein." : "Das Gesamtgewicht der Ernte"}
        />
        
        <FormControl 
          fullWidth 
          margin="normal"
          required
        >
          <InputLabel>Ernteraum *</InputLabel>
          <Select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            label="Ernteraum *"
            disabled={loadingOptions}
          >
            <MenuItem value="">
              <em>Bitte Raum auswählen</em>
            </MenuItem>
            {rooms
              .filter(room => room.room_type === 'bluetekammer')
              .map(room => (
                <MenuItem 
                  key={room.id} 
                  value={room.id}
                >
                  {room.name}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>
        
        <TextField
          label="Notizen (optional)"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen zur Ernte..."
        />
        
        {/* Info-Box */}
        <Box 
          sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: 'info.light', 
            color: 'info.contrastText',
            borderRadius: 1
          }}
        >
          <Typography variant="body2">
            <strong>Hinweis:</strong> Die Zuordnung des verantwortlichen Mitglieds erfolgt automatisch per RFID-Autorisierung.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => handleDialogClose()}
          variant="outlined"
          color="inherit"
        >
          Abbrechen
        </Button>
        
        <Button 
          onClick={startRfidScan}
          variant="contained" 
          color="success"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={16} /> : <AgricultureIcon />}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & ernten
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToHarvestDialog;