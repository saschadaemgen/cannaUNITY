// frontend/src/apps/trackandtrace/components/dialogs/ConvertToDryingDialog.jsx
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
  MenuItem,
  Select,
  Typography,
  Box,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import api from '@/utils/api'

/**
 * Dialog zur Konvertierung einer Ernte zu einer Trocknung mit RFID-Autorisierung
 */
const ConvertToDryingDialog = ({
  open,
  onClose,
  onConvert,
  title,
  sourceBatch,
  members, // Für Kompatibilität beibehalten
  rooms,
  loadingOptions
}) => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  const [memberId, setMemberId] = useState(null)
  
  // Formular-States
  const [finalWeight, setFinalWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open) {
      setScanMode(false)
      setScanSuccess(false)
      setScannedMemberName('')
      setMemberId(null)
      setAbortController(null)
      setIsAborting(false)
      setFinalWeight('')
      setNotes('')
      setRoomId('')
      setError('')
    }
  }, [open])

  // RFID-Scan starten
  const startRfidScan = async () => {
    setError('')
    
    // Validierung vor dem Scan
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Trockengewicht ein')
      return
    }
    
    if (sourceBatch && parseFloat(finalWeight) >= parseFloat(sourceBatch.weight)) {
      setError('Das Trockengewicht muss kleiner als das Erntegewicht sein')
      return
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus')
      return
    }
    
    setScanMode(true)
    setScanSuccess(false)
    await handleRfidScan()
  }

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setLoading(true)
    
    try {
      console.log("🚀 Starte RFID-Scan für Trocknungs-Konvertierung...")
      
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
      
      // 3. Nach erfolgreicher Verifizierung die Konvertierung durchführen
      setTimeout(async () => {
        const convertData = {
          final_weight: finalWeight,
          notes,
          member_id: member_id,
          room_id: roomId
        }
        
        console.log("Convert form data mit RFID member_id:", convertData)
        
        // onConvert mit member_id als zweitem Parameter aufrufen
        if (onConvert) {
          await onConvert(convertData, member_id)
        }
        
        // Nach weiteren 2 Sekunden schließen
        setTimeout(() => {
          handleDialogClose()
        }, 2000)
      }, 500)
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen')
      } else {
        console.error('RFID-Bindungsfehler:', error)
        alert(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen')
      }
      
      if (!isAborting) {
        setScanMode(false)
      }
    } finally {
      if (!isAborting) {
        setLoading(false)
      }
    }
  }

  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    setIsAborting(true)
    
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
      
      setTimeout(() => {
        setIsAborting(false)
      }, 500)
    }
  }

  // Dialog schließen Handler
  const handleDialogClose = () => {
    setScanMode(false)
    setScanSuccess(false)
    setScannedMemberName('')
    setMemberId(null)
    
    if (onClose) {
      onClose()
    }
  }

  // Berechne voraussichtlichen Gewichtsverlust
  const calculateWeightLoss = () => {
    if (sourceBatch && finalWeight && !isNaN(parseFloat(finalWeight))) {
      const initialWeight = parseFloat(sourceBatch.weight)
      const dryWeight = parseFloat(finalWeight)
      
      if (dryWeight < initialWeight) {
        const loss = initialWeight - dryWeight
        const percentage = (loss / initialWeight * 100).toFixed(1)
        return {
          loss,
          percentage
        }
      }
    }
    return { loss: 0, percentage: 0 }
  }
  
  const weightLoss = calculateWeightLoss()

  // Validierung: Prüft ob alle Felder ausgefüllt sind
  const isFormValid = () => {
    return finalWeight && 
           parseFloat(finalWeight) > 0 && 
           (!sourceBatch || parseFloat(finalWeight) < parseFloat(sourceBatch.weight)) &&
           roomId
  }

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        if (scanMode && !scanSuccess) {
          return
        }
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleDialogClose()
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
          bgcolor: 'info.light',
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
                  Trocknung mit {parseFloat(finalWeight).toLocaleString('de-DE')}g wurde erstellt
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
                um die Trocknungs-Konvertierung abzuschließen
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
        <AcUnitIcon sx={{ color: 'info.main', mr: 1 }} />
        {title || 'Zu Trocknung konvertieren'}
      </DialogTitle>
      
      <DialogContent dividers>
        {sourceBatch && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Quell-Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Ernte-Charge:
              </Typography>
              <Typography variant="body2">
                {sourceBatch.batch_number}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Genetik:
              </Typography>
              <Typography variant="body2">
                {sourceBatch.source_strain}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Erntegewicht:
              </Typography>
              <Typography variant="body2">
                {parseFloat(sourceBatch.weight).toLocaleString('de-DE')}g
              </Typography>
            </Box>
          </Box>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="final-weight"
          label="Trockengewicht (g)"
          type="number"
          fullWidth
          value={finalWeight}
          onChange={(e) => setFinalWeight(e.target.value)}
          required
          inputProps={{ min: 0, step: 0.1 }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {finalWeight && sourceBatch && parseFloat(finalWeight) < parseFloat(sourceBatch.weight) && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              Gewichtsverlust durch Trocknung
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Absolut:
              </Typography>
              <Typography variant="body2">
                {weightLoss.loss.toLocaleString('de-DE')}g
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Prozentual:
              </Typography>
              <Typography variant="body2">
                {weightLoss.percentage}%
              </Typography>
            </Box>
          </Box>
        )}
        
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }} required>
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
            {rooms
              .filter(room => room.room_type === 'trocknungsraum')
              .map((room) => (
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
        <Button onClick={() => handleDialogClose()} color="inherit">
          Abbrechen
        </Button>
        <Button 
          onClick={startRfidScan}
          variant="contained" 
          color="info"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={16} /> : <AcUnitIcon />}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & konvertieren
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConvertToDryingDialog