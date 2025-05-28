// frontend/src/apps/trackandtrace/components/dialogs/CreateCuttingDialog.jsx
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
  Zoom,
  Chip
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import api from '@/utils/api'

/**
 * CreateCuttingDialog Komponente für den Dialog zum Erstellen von Stecklingen
 * mit RFID-Autorisierung
 * 
 * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
 * @param {function} onClose - Handler für Schließen des Dialogs
 * @param {function} onCreateCuttings - Handler für Erstellung der Stecklinge (nutzt selectedMemberId aus Parent-State)
 * @param {number} quantity - Anzahl zu erstellender Stecklinge
 * @param {function} setQuantity - Funktion zum Setzen der Anzahl
 * @param {string} notes - Notizen zu den Stecklingen
 * @param {function} setNotes - Funktion zum Setzen der Notizen
 * @param {Array} members - Array mit Mitgliedern (für Kompatibilität, wird nicht angezeigt)
 * @param {Array} rooms - Array mit Räumen
 * @param {string} selectedRoomId - ID des ausgewählten Raums
 * @param {function} setSelectedRoomId - Funktion zum Setzen des ausgewählten Raums
 * @param {object} motherBatch - Ausgewählte Mutterpflanzen-Charge
 * @param {string} selectedMemberId - ID des ausgewählten Mitglieds (wird durch RFID gesetzt)
 * @param {function} setSelectedMemberId - Funktion zum Setzen des ausgewählten Mitglieds
 */
const CreateCuttingDialog = ({
  open,
  onClose,
  onCreateCuttings,
  quantity,
  setQuantity,
  notes,
  setNotes,
  members,  // Wieder hinzugefügt für Kompatibilität
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  motherBatch,
  selectedMemberId,
  setSelectedMemberId
}) => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  const [memberId, setMemberId] = useState(null)
  
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
  
  // Early return NACH allen Hooks!
  if (!motherBatch) return null
  
  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true)
    setScanSuccess(false)
    setScannedMemberName('')
    await handleRfidScan()
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
      console.log("🚀 Starte RFID-Scan für Stecklinge...")
      
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
        console.log('Setze selectedMemberId auf:', member_id)
        setSelectedMemberId(member_id)
      } else {
        console.error('setSelectedMemberId Funktion nicht verfügbar!')
      }
      
      // 3. Nach erfolgreicher Verifizierung die Stecklinge erstellen
      // Warte kurz, damit die UI den Erfolg anzeigen kann
      setTimeout(async () => {
        console.log('Erstelle Stecklinge...')
        console.log('selectedMemberId sollte jetzt gesetzt sein:', member_id)
        
        // Kleine Verzögerung, damit der State sicher aktualisiert ist
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Original onCreateCuttings aufrufen OHNE Parameter
        // Die Parent-Komponente nutzt selectedMemberId aus ihrem eigenen State
        if (onCreateCuttings) {
          await onCreateCuttings(member_id)  // KEIN Parameter - wie im Original!
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
    }
  }
  
  // Validierung: Prüft ob alle Felder ausgefüllt sind
  const isFormValid = () => {
    return quantity > 0 && selectedRoomId
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
                  {quantity} Steckling{quantity > 1 ? 'e' : ''} {quantity > 1 ? 'wurden' : 'wurde'} von {motherBatch.seed_strain} erstellt
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
                um die Stecklinge zu erstellen
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
        <ContentCutIcon sx={{ color: 'success.main', mr: 1 }} />
        Stecklinge von Mutterpflanzen-Charge erstellen
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`Charge: ${motherBatch.batch_number}`} 
            color="primary" 
            variant="outlined" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`Genetik: ${motherBatch.seed_strain}`} 
            color="success" 
            variant="outlined" 
          />
        </Box>

        <TextField
          label="Anzahl der Stecklinge"
          type="number"
          fullWidth
          margin="normal"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          required
          helperText="Wie viele Stecklinge möchten Sie schneiden?"
        />
        
        {/* Raumauswahl - vermutlich Anzuchträume */}
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
              .filter(room => room.room_type === 'anzuchtraum')
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
          placeholder="Zusätzliche Informationen zu den Stecklingen..."
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
          color="primary"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={16} /> : <ContentCutIcon />}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & Stecklinge erstellen
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateCuttingDialog