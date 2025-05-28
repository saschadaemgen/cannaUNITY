// frontend/src/apps/trackandtrace/components/dialogs/ConvertToProcessingDialog.jsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Box,
  IconButton,
  RadioGroup,
  Radio,
  Divider,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SpeedIcon from '@mui/icons-material/Speed'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import api from '@/utils/api'

/**
 * Dialog zur Konvertierung einer Trocknung zu Marihuana oder Haschisch mit RFID-Autorisierung
 */
const ConvertToProcessingDialog = ({
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
  const [productType, setProductType] = useState('marijuana')
  const [outputWeight, setOutputWeight] = useState('')
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
      setProductType('marijuana')
      setOutputWeight('')
      setNotes('')
      setRoomId('')
      setError('')
    }
  }, [open])

  // RFID-Scan starten
  const startRfidScan = async () => {
    setError('')
    
    // Validierung vor dem Scan
    if (!outputWeight || parseFloat(outputWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Produktgewicht ein')
      return
    }
    
    if (sourceBatch && parseFloat(outputWeight) > parseFloat(sourceBatch.final_weight)) {
      setError('Das Produktgewicht kann nicht größer als das Trockengewicht sein')
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
      console.log("🚀 Starte RFID-Scan für Verarbeitung...")
      
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
        const formData = {
          product_type: productType,
          output_weight: outputWeight,
          notes,
          member_id: member_id,
          room_id: roomId
        }
        
        console.log("Processing form data mit RFID member_id:", formData)
        
        // onConvert mit member_id als zweitem Parameter aufrufen
        if (onConvert) {
          await onConvert(formData, member_id)
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
  
  // Berechne voraussichtliche Ausbeute
  const calculateYield = () => {
    if (sourceBatch && outputWeight && !isNaN(parseFloat(outputWeight))) {
      const inputWeight = parseFloat(sourceBatch.final_weight)
      const outWeight = parseFloat(outputWeight)
      
      if (outWeight <= inputWeight) {
        const percentage = (outWeight / inputWeight * 100).toFixed(1)
        const waste = inputWeight - outWeight
        return {
          percentage,
          waste
        }
      }
    }
    return { percentage: 0, waste: 0 }
  }
  
  const yieldData = calculateYield()
  
  // Validierung für den Button
  const isFormValid = () => {
    return outputWeight && 
           parseFloat(outputWeight) > 0 && 
           (!sourceBatch || parseFloat(outputWeight) <= parseFloat(sourceBatch.final_weight)) &&
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
      scroll="paper"
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
          bgcolor: 'secondary.light',
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
                  {productType === 'marijuana' ? 'Marihuana' : 'Haschisch'} mit {parseFloat(outputWeight).toLocaleString('de-DE')}g wurde erstellt
                </Typography>
                
                <Typography variant="body2" align="center" color="white" sx={{ mt: 1 }}>
                  Genetik: {sourceBatch?.source_strain || 'Unbekannt'}
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 2 }}>
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
                um die Verarbeitung abzuschließen
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
          <SpeedIcon sx={{ mr: 1, color: 'secondary.main' }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={handleDialogClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {sourceBatch && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Quell-Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Trocknungs-Charge:
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
                Trockengewicht:
              </Typography>
              <Typography variant="body2">
                {parseFloat(sourceBatch.final_weight).toLocaleString('de-DE')}g
              </Typography>
            </Box>
          </Box>
        )}
        
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Produkttyp
          </Typography>
          <RadioGroup
            row
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <FormControlLabel 
              value="marijuana" 
              control={<Radio color="secondary" />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalFloristIcon sx={{ mr: 0.5, color: 'secondary.main' }} />
                  <Typography variant="body2">Marihuana</Typography>
                </Box>
              } 
              sx={{ flexGrow: 1 }}
            />
            <FormControlLabel 
              value="hashish" 
              control={<Radio color="secondary" />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterDramaIcon sx={{ mr: 0.5, color: 'secondary.main' }} />
                  <Typography variant="body2">Haschisch</Typography>
                </Box>
              } 
              sx={{ flexGrow: 1 }}
            />
          </RadioGroup>
        </FormControl>
        
        <Divider sx={{ my: 2 }} />
        
        <TextField
          autoFocus
          margin="dense"
          id="output-weight"
          label="Produktgewicht (g)"
          type="number"
          fullWidth
          value={outputWeight}
          onChange={(e) => setOutputWeight(e.target.value)}
          required
          inputProps={{ min: 0, step: 0.1 }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {outputWeight && sourceBatch && parseFloat(outputWeight) <= parseFloat(sourceBatch.final_weight) && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'secondary.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="secondary.main" gutterBottom>
              Verarbeitungsausbeute
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Ausbeute:
              </Typography>
              <Typography variant="body2">
                {yieldData.percentage}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Verarbeitungsverlust:
              </Typography>
              <Typography variant="body2">
                {yieldData.waste.toLocaleString('de-DE')}g
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
              .filter(room => room.room_type === 'verarbeitung')
              .map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))
            }
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
          placeholder="Zusätzliche Informationen zur Verarbeitung..."
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
          color="secondary"
          startIcon={loading ? <CircularProgress size={16} /> : <SpeedIcon />}
          disabled={loading || !isFormValid()}
          sx={{ minWidth: 200 }}
        >
          Mit RFID autorisieren & {productType === 'marijuana' ? 'Marihuana' : 'Haschisch'} erstellen
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConvertToProcessingDialog