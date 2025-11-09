// frontend/src/apps/trackandtrace/pages/LabTesting/components/UpdateLabResultsDialog.jsx
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
  Zoom,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BiotechIcon from '@mui/icons-material/Biotech';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '@/utils/api';

const UpdateLabResultsDialog = ({
  open,
  onClose,
  onUpdateLabResults,
  labTesting,
  rooms  // NEU: Räume-Array hinzugefügt
}) => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Formular-States
  const [status, setStatus] = useState('pending');
  const [thcContent, setThcContent] = useState('');
  const [cbdContent, setCbdContent] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [roomId, setRoomId] = useState('');  // NEU: Raum-State
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && labTesting) {
      // Formular zurücksetzen
      setStatus(labTesting.status || 'pending');
      setThcContent(labTesting.thc_content || '');
      setCbdContent(labTesting.cbd_content || '');
      setLabNotes(labTesting.lab_notes || '');
      setError('');
      
      // RFID-States zurücksetzen
      setScanMode(false);
      setScanSuccess(false);
      setScannedMemberName('');
      setMemberId(null);
      setAbortController(null);
      setIsAborting(false);
      setErrorMessage('');
      
      // Raum-Logik: Filtere nur Labor-Räume
      const labRooms = rooms?.filter(room => room.room_type === 'labor') || [];
      
      // Wenn die ursprüngliche LabTesting einen Raum hat, nutze diesen
      if (labTesting.room?.id) {
        setRoomId(labTesting.room.id);
      } 
      // Wenn nur ein Labor-Raum vorhanden ist, automatisch auswählen
      else if (labRooms.length === 1) {
        setRoomId(labRooms[0].id);
      } 
      // Ansonsten leer lassen
      else {
        setRoomId('');
      }
    }
  }, [open, labTesting, rooms]);

  // Validierung
  const validateForm = () => {
    setError('');
    
    if (!status) {
      setError('Bitte wählen Sie einen Status aus');
      return false;
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus');
      return false;
    }
    
    if (thcContent && (isNaN(parseFloat(thcContent)) || parseFloat(thcContent) < 0 || parseFloat(thcContent) > 100)) {
      setError('THC-Gehalt muss zwischen 0 und 100 Prozent liegen');
      return false;
    }
    
    if (cbdContent && (isNaN(parseFloat(cbdContent)) || parseFloat(cbdContent) < 0 || parseFloat(cbdContent) > 100)) {
      setError('CBD-Gehalt muss zwischen 0 und 100 Prozent liegen');
      return false;
    }
    
    return true;
  };

  // RFID-Scan starten
  const startRfidScan = () => {
    if (!validateForm()) return;
    
    setScanMode(true);
    setScanSuccess(false);
    setErrorMessage('');
    handleRfidScan();
  };

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return;
    
    // Device ID aus dem ausgewählten Raum holen
    const selectedRoom = rooms?.find(r => r.id === roomId);
    const deviceId = selectedRoom?.unifi_device_id;
    
    if (!deviceId) {
      setErrorMessage('⚠️ Der ausgewählte Raum hat kein zugeordnetes RFID-Gerät!');
      setScanMode(false);
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    
    try {
      console.log(`🚀 Starte RFID-Scan für Laborergebnisse mit Device ID: ${deviceId} (Raum: ${selectedRoom.name})...`);
      
      if (isAborting) return;
      
      // 1. Karte scannen und User auslesen - MIT device_id
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        params: { device_id: deviceId },
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
      
      // 3. Nach erfolgreicher Verifizierung die Laborergebnisse aktualisieren
      setTimeout(async () => {
        // Submit-Daten mit member_id und room_id
        const formData = {
          status,
          thc_content: thcContent ? parseFloat(thcContent) : null,
          cbd_content: cbdContent ? parseFloat(cbdContent) : null,
          lab_notes: labNotes,
          member_id: member_id, // member_id hinzufügen
          room_id: roomId // room_id hinzufügen
        };
        
        console.log("Aktualisiere Laborergebnisse mit RFID member_id:", formData);
        
        // onUpdateLabResults aufrufen
        if (onUpdateLabResults) {
          await onUpdateLabResults(formData);
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
        setErrorMessage(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen');
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
      setError('');
      setErrorMessage('');
      
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
    setError('');
    setErrorMessage('');
    
    if (onClose) {
      onClose();
    }
  };

  // Prüfen ob der ausgewählte Raum ein RFID-Gerät hat
  const selectedRoomHasRfid = () => {
    const room = rooms?.find(r => r.id === roomId);
    return room?.unifi_device_id ? true : false;
  };

  // Nur Labor-Räume filtern
  const labRooms = rooms?.filter(room => room.room_type === 'labor') || [];

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
          bgcolor: scanSuccess ? 'info.light' : errorMessage ? 'error.light' : 'info.light',
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
          
          {errorMessage ? (
            // Fehlermeldung anzeigen
            <Fade in={!!errorMessage}>
              <Box sx={{ textAlign: 'center' }}>
                <WarningAmberIcon sx={{ fontSize: 80, color: 'white', mb: 2 }} />
                <Typography variant="h6" align="center" color="white" fontWeight="bold" gutterBottom>
                  {errorMessage}
                </Typography>
                <Button 
                  onClick={() => {
                    setErrorMessage('');
                    setScanMode(false);
                  }}
                  variant="contained" 
                  color="inherit"
                  sx={{ mt: 2 }}
                >
                  Zurück
                </Button>
              </Box>
            </Fade>
          ) : scanSuccess ? (
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
                  Laborergebnisse wurden aktualisiert für {labTesting?.source_strain || 'Probe'}
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
                um die Laborergebnisse zu bestätigen
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
          <BiotechIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">Laborergebnisse aktualisieren</Typography>
        </Box>
        <IconButton onClick={handleDialogClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {labTesting && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Laborkontrolle-Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Genetik:
              </Typography>
              <Typography variant="body2">
                {labTesting.source_strain || "Unbekannt"}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Produkttyp:
              </Typography>
              <Typography variant="body2">
                {labTesting.product_type_display || labTesting.product_type || "Unbekannt"}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Charge-Nummer:
              </Typography>
              <Typography variant="body2">
                {labTesting.batch_number}
              </Typography>
            </Box>
          </Box>
        )}
        
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Status"
            required
          >
            <MenuItem value="pending">In Bearbeitung</MenuItem>
            <MenuItem value="passed">Freigegeben</MenuItem>
            <MenuItem value="failed">Nicht bestanden</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          autoFocus
          margin="dense"
          id="thc-content"
          label="THC-Gehalt (%)"
          type="number"
          fullWidth
          value={thcContent}
          onChange={(e) => setThcContent(e.target.value)}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          id="cbd-content"
          label="CBD-Gehalt (%)"
          type="number"
          fullWidth
          value={cbdContent}
          onChange={(e) => setCbdContent(e.target.value)}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {/* NEU: Raum-Auswahl - nur Labor-Räume */}
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }} required>
          <InputLabel id="room-label">Labor-Raum *</InputLabel>
          <Select
            labelId="room-label"
            id="room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            label="Labor-Raum *"
            required
          >
            <MenuItem value="">
              <em>Bitte Labor auswählen</em>
            </MenuItem>
            {labRooms.map((room) => (
              <MenuItem key={room.id} value={room.id}>
                {room.name}
                {!room.unifi_device_id && (
                  <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                    (kein RFID)
                  </Typography>
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Warnung wenn Raum kein RFID-Gerät hat */}
        {roomId && !selectedRoomHasRfid() && (
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              Der ausgewählte Raum hat kein zugeordnetes RFID-Gerät. 
              Bitte wählen Sie einen anderen Raum oder kontaktieren Sie den Administrator.
            </Typography>
          </Alert>
        )}
        
        <TextField
          margin="dense"
          id="lab-notes"
          label="Laborergebnisse/Bericht"
          multiline
          rows={4}
          fullWidth
          value={labNotes}
          onChange={(e) => setLabNotes(e.target.value)}
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
            <strong>Hinweis:</strong> Die Zuordnung des verantwortlichen Mitglieds erfolgt automatisch per RFID-Autorisierung am Gerät des Zielraums.
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
          disabled={loading || !selectedRoomHasRfid()}
          startIcon={loading ? <CircularProgress size={16} /> : <BiotechIcon />}
        >
          Mit RFID autorisieren & aktualisieren
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateLabResultsDialog;