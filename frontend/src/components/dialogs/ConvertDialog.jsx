// frontend/src/apps/trackandtrace/components/dialogs/ConvertDialog.jsx
import { useState, useEffect } from 'react'
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
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import api from '@/utils/api'

/**
 * ConvertDialog Komponente für den Konvertierungsdialog (Samen zu Mutter-/Blühpflanzen)
 * mit RFID-Autorisierung
 * 
 * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
 * @param {function} onClose - Handler für Schließen des Dialogs
 * @param {function} onConvert - Handler für Konvertierung (originale Funktion)
 * @param {string} type - Typ der Konvertierung ('mother' oder 'flower')
 * @param {number} quantity - Anzahl zu konvertierender Samen
 * @param {function} setQuantity - Funktion zum Setzen der Anzahl
 * @param {string} notes - Notizen zur Konvertierung
 * @param {function} setNotes - Funktion zum Setzen der Notizen
 * @param {Array} rooms - Array mit Räumen
 * @param {string} selectedRoomId - ID des ausgewählten Raums
 * @param {function} setSelectedRoomId - Funktion zum Setzen des ausgewählten Raums
 * @param {number} maxQuantity - Maximale Anzahl (verfügbare Samen)
 * @param {string} strainName - Name der Sorte für die Erfolgsmeldung
 */
const ConvertDialog = ({
  open,
  onClose,
  onConvert,  // Zurück zum originalen Namen
  type,
  quantity,
  setQuantity,
  notes,
  setNotes,
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  selectedMemberId,     // Wieder hinzugefügt
  setSelectedMemberId,  // Wieder hinzugefügt
  maxQuantity = 1,
  strainName = ''
}) => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  const [memberId, setMemberId] = useState(null)
  
  const title = type === 'mother' ? 'Zu Mutterpflanze konvertieren' : 'Zu Blühpflanze konvertieren'
  
  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open) {
      setScanMode(false)
      setScanSuccess(false)
      setScannedMemberName('')
      setMemberId(null)
      setAbortController(null)
      setIsAborting(false)
    }
  }, [open])
  
  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true)
    setScanSuccess(false)
    await handleRfidScan()
  }
  
  // Funktion zum erfolgreichen Abschluss
  const handleSuccessAndClose = (conversionData) => {
    console.log('Schließe Dialog nach erfolgreicher Konvertierung...')
    
    // onSuccess aufrufen
    if (onSuccess && typeof onSuccess === 'function') {
      console.log('Rufe onSuccess auf mit:', conversionData)
      onSuccess(conversionData)
    }
    
    // Dialog schließen
    console.log('Schließe Dialog...')
    handleDialogClose()
  }
  
  // RFID-Scan Handler
  const handleRfidScan = async () => {
    // Wenn ein Abbruch in Bearbeitung ist, nichts tun
    if (isAborting) return
    
    // Abbruch-Controller erstellen
    const controller = new AbortController()
    setAbortController(controller)
    
    setLoading(true)
    
    try {
      console.log("🚀 Starte RFID-Scan für Konvertierung...")
      
      // Prüfen vor jeder API-Anfrage, ob ein Abbruch initiiert wurde
      if (isAborting) return
      
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      })
      
      if (isAborting) return
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data
      
      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name })
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }
      
      if (isAborting) return
      
      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      )
      
      const { member_id, member_name } = verifyRes.data
      
      // Erfolg setzen und Mitgliedsdaten speichern
      setMemberId(member_id)
      setScannedMemberName(member_name)
      setScanSuccess(true)
      
      // Member ID in Parent-State setzen
      if (setSelectedMemberId) {
        setSelectedMemberId(member_id)
      }
      
      // 3. Nach erfolgreicher Verifizierung die Konvertierung durchführen
      // Warte kurz, damit die UI den Erfolg anzeigen kann
      setTimeout(async () => {
        // Original onConvert aufrufen
        if (onConvert) {
          await onConvert()
        }
        
        // Nach weiteren 2 Sekunden schließen
        setTimeout(() => {
          handleDialogClose()
        }, 2000)
      }, 500)
      
    } catch (error) {
      // AbortError ignorieren, diese sind erwartet bei Abbruch
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen')
      } else {
        console.error('RFID-Bindungsfehler:', error)
        alert(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen')
      }
      
      // UI nur zurücksetzen, wenn kein Abbruch im Gange ist
      if (!isAborting) {
        setScanMode(false)
      }
    } finally {
      // Loading-Status nur zurücksetzen, wenn kein Abbruch im Gange ist
      if (!isAborting) {
        setLoading(false)
      }
    }
  }
  
  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    // Sofort den Abbruch-Status setzen
    setIsAborting(true)
    
    // Laufende Anfrage abbrechen, falls vorhanden
    if (abortController) {
      abortController.abort()
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/')
      console.log("RFID-Scan erfolgreich abgebrochen")
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error)
    } finally {
      setScanMode(false)
      setLoading(false)
      setScanSuccess(false)
      setScannedMemberName('')
      
      // Nach einer kurzen Verzögerung den Abbruch-Status zurücksetzen
      setTimeout(() => {
        setIsAborting(false)
      }, 500)
    }
  }
  
  // Validierung: Prüft ob alle Felder ausgefüllt sind
  const isFormValid = () => {
    return quantity > 0 && quantity <= maxQuantity && selectedRoomId
  }
  
  // Dialog schließen Handler
  const handleDialogClose = () => {
    console.log('handleDialogClose aufgerufen')
    
    // States zurücksetzen
    setScanMode(false)
    setScanSuccess(false)
    setScannedMemberName('')
    setMemberId(null)
    
    // Parent onClose aufrufen
    if (onClose) {
      console.log('Rufe parent onClose auf')
      onClose()
    } else {
      console.error('onClose Funktion nicht verfügbar!')
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Während des Scans das Schließen verhindern
        if (scanMode && !scanSuccess) {
          return
        }
        // Ansonsten normal schließen
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleDialogClose()
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
                  {quantity} {strainName ? `${strainName} ` : ''}Samen wurde{quantity > 1 ? 'n' : ''} {quantity > 1 ? 'zu' : 'zur'} {quantity > 1 ? (type === 'mother' ? 'Mutterpflanzen' : 'Blühpflanzen') : (type === 'mother' ? 'Mutterpflanze' : 'Blühpflanze')} konvertiert
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
                um die Konvertierung abzuschließen
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
        <LocalFloristIcon sx={{ color: 'success.main', mr: 1 }} />
        {title}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" gutterBottom color="text.secondary">
          Verfügbare Samen: {maxQuantity || 0}
        </Typography>
        
        <TextField
          label="Anzahl"
          type="number"
          fullWidth
          margin="normal"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          inputProps={{ min: 1, max: maxQuantity }}
          required
          helperText={`Wählen Sie zwischen 1 und ${maxQuantity} Samen`}
        />
        
        {/* Raumauswahl */}
        <FormControl 
          fullWidth 
          margin="normal"
          required
        >
          <InputLabel>Zielraum *</InputLabel>
          <Select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            label="Zielraum *"
          >
            <MenuItem value="">
              <em>Bitte Raum auswählen</em>
            </MenuItem>
            {rooms
              .filter(room => 
                type === 'mother' 
                  ? room.room_type === 'mutterraum'
                  : room.room_type === 'bluetekammer'
              )
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
          placeholder="Zusätzliche Informationen zur Konvertierung..."
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
          startIcon={loading ? <CircularProgress size={16} /> : <CreditCardIcon />}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & konvertieren
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConvertDialog