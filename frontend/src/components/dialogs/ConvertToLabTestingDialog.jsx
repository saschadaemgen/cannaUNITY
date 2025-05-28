// frontend/src/apps/trackandtrace/pages/Processing/components/ConvertToLabTestingDialog.jsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScienceIcon from '@mui/icons-material/Science';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '@/utils/api';

const ConvertToLabTestingDialog = ({
  open,
  onClose,
  onConvert,
  processing,
  members, // Für Kompatibilität beibehalten
  rooms,
  loadingOptions
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
  const [inputWeight, setInputWeight] = useState('');
  const [sampleWeight, setSampleWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  
  // Berechnete Werte
  const [remainingWeight, setRemainingWeight] = useState(0);
  const [isWeightValid, setIsWeightValid] = useState(false);

  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open && processing) {
      // RFID-States zurücksetzen
      setScanMode(false);
      setScanSuccess(false);
      setScannedMemberName('');
      setMemberId(null);
      setAbortController(null);
      setIsAborting(false);
      
      // Setze Standardwerte
      const outputWeight = parseFloat(processing.output_weight);
      setInputWeight(outputWeight.toString());
      
      // Standardmäßig 10% als Probengewicht
      const defaultSampleWeight = Math.min(1.0, outputWeight * 0.1).toFixed(2);
      setSampleWeight(defaultSampleWeight);
      
      // Zurücksetzen der anderen Felder
      setNotes('');
      setRoomId('');
      setError('');
      
      // Kalkulierte Werte aktualisieren
      updateRemainingWeight(outputWeight, defaultSampleWeight);
      validateWeights(outputWeight, defaultSampleWeight, outputWeight);
    }
  }, [open, processing]);
  
  // Berechne das verbleibende Gewicht basierend auf Input - Sample
  useEffect(() => {
    if (inputWeight && sampleWeight) {
      updateRemainingWeight(parseFloat(inputWeight), parseFloat(sampleWeight));
    }
  }, [inputWeight, sampleWeight]);
  
  // Validiere, ob die Gewichte gültig sind
  useEffect(() => {
    if (processing && inputWeight && sampleWeight) {
      const output = parseFloat(processing.output_weight);
      validateWeights(parseFloat(inputWeight), parseFloat(sampleWeight), output);
    }
  }, [inputWeight, sampleWeight, processing]);
  
  const updateRemainingWeight = (input, sample) => {
    if (!isNaN(input) && !isNaN(sample)) {
      setRemainingWeight(Math.max(0, input - sample));
    } else {
      setRemainingWeight(0);
    }
  };
  
  const validateWeights = (input, sample, output) => {
    if (!isNaN(input) && !isNaN(sample) && !isNaN(output)) {
      setIsWeightValid(
        input > 0 && 
        input <= output && 
        sample > 0 && 
        sample < input
      );
    } else {
      setIsWeightValid(false);
    }
  };

  // RFID-Scan starten
  const startRfidScan = async () => {
    // Validierung vor dem Scan
    setError('');
    
    if (!inputWeight || parseFloat(inputWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Eingangsgewicht ein');
      return;
    }
    
    if (!sampleWeight || parseFloat(sampleWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Probengewicht ein');
      return;
    }
    
    const inputVal = parseFloat(inputWeight);
    const sampleVal = parseFloat(sampleWeight);
    const outputVal = parseFloat(processing.output_weight);
    
    if (inputVal > outputVal) {
      setError(`Das Eingangsgewicht kann nicht größer als das Verarbeitungsgewicht (${outputVal}g) sein`);
      return;
    }
    
    if (sampleVal >= inputVal) {
      setError('Das Probengewicht muss kleiner als das Eingangsgewicht sein');
      return;
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus');
      return;
    }
    
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
      console.log("🚀 Starte RFID-Scan für Laborkontrolle...");
      
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
        // Submit-Daten
        const formData = {
          input_weight: parseFloat(inputWeight),
          sample_weight: parseFloat(sampleWeight),
          notes,
          member_id: member_id, // Direkt die member_id verwenden
          room_id: roomId
        };
        
        console.log("Lab testing form data mit RFID member_id:", formData);
        
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

  // Validierung: Prüft ob alle Felder ausgefüllt sind
  const isFormValid = () => {
    return isWeightValid && roomId;
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
      fullWidth
      maxWidth="sm"
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
          bgcolor: 'info.main',
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
                  Laborkontrolle mit {sampleWeight}g Probengewicht wurde erstellt
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
                um die Laborkontrolle zu erstellen
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
      
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">Zu Laborkontrolle konvertieren</Typography>
        </Box>
        <IconButton onClick={handleDialogClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {processing && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Verarbeitungs-Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Genetik:
              </Typography>
              <Typography variant="body2">
                {processing.source_strain || "Unbekannt"}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Produkttyp:
              </Typography>
              <Typography variant="body2">
                {processing.product_type_display || processing.product_type || "Unbekannt"}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Charge-Nummer:
              </Typography>
              <Typography variant="body2">
                {processing.batch_number}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Verfügbares Gewicht:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {processing ? parseFloat(processing.output_weight).toLocaleString('de-DE') : 0}g
              </Typography>
            </Box>
          </Box>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="input-weight"
          label="Eingangsgewicht (g)"
          type="number"
          fullWidth
          value={inputWeight}
          onChange={(e) => setInputWeight(e.target.value)}
          required
          inputProps={{ min: 0.01, step: 0.01 }}
          variant="outlined"
          sx={{ mb: 2 }}
          error={inputWeight !== '' && (!isWeightValid || parseFloat(inputWeight) > parseFloat(processing?.output_weight || 0))}
          helperText={inputWeight !== '' && !isWeightValid ? 
            "Gewicht muss größer als 0 und kleiner gleich dem verfügbaren Gewicht sein" : ""}
        />
        
        <TextField
          margin="dense"
          id="sample-weight"
          label="Probengewicht (g)"
          type="number"
          fullWidth
          value={sampleWeight}
          onChange={(e) => setSampleWeight(e.target.value)}
          required
          inputProps={{ min: 0.01, step: 0.01 }}
          variant="outlined"
          sx={{ mb: 2 }}
          error={sampleWeight !== '' && (!isWeightValid || parseFloat(sampleWeight) >= parseFloat(inputWeight || 0))}
          helperText={sampleWeight !== '' && !isWeightValid ? 
            "Probengewicht muss größer als 0 und kleiner als das Eingangsgewicht sein" : ""}
        />
        
        {inputWeight && sampleWeight && isWeightValid && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              Berechnetes verbleibendes Gewicht
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Verbleibendes Gewicht nach Probenentnahme:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {remainingWeight.toFixed(2)}g
              </Typography>
            </Box>
          </Box>
        )}
        
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel id="room-label">Raum *</InputLabel>
          <Select
            labelId="room-label"
            id="room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            label="Raum *"
            required
            disabled={loadingOptions}
          >
            <MenuItem value="">
              <em>Bitte Raum auswählen</em>
            </MenuItem>
            {rooms.map((room) => (
              <MenuItem key={room.id} value={room.id}>
                {room.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          margin="dense"
          id="notes"
          label="Notizen (optional)"
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="outlined"
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
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleDialogClose} color="inherit">
          Abbrechen
        </Button>
        <Button 
          onClick={startRfidScan}
          variant="contained" 
          color="info"
          startIcon={loading ? <CircularProgress size={16} /> : <ScienceIcon />}
          disabled={loading || !isFormValid()}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & konvertieren
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToLabTestingDialog;