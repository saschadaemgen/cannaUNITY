// frontend/src/components/dialogs/DestroyDialog.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, Fade, Zoom
} from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import api from '@/utils/api'

const DestroyDialog = ({
  open,
  onClose,
  onDestroy,
  title,
  members,
  destroyedByMemberId,
  setDestroyedByMemberId,
  destroyReason,
  setDestroyReason,
  quantity,
  setQuantity,
  showQuantity = false,
  maxQuantity = 1
}) => {
  // State für den RFID-Scan-Modus
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [scannedMemberId, setScannedMemberId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timeoutMessage, setTimeoutMessage] = useState('')
  
  // Ref für den Timeout
  const timeoutRef = useRef(null)
  
  // Reset beim Öffnen/Schließen des Dialogs
  useEffect(() => {
    if (!open) {
      // Beim Schließen alles zurücksetzen
      setScanMode(false)
      setScanSuccess(false)
      setScannedMemberName('')
      setScannedMemberId(null)
      setLoading(false)
      setTimeoutMessage('')
      
      // Timeout clearen falls vorhanden
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [open])
  
  // Wenn scanSuccess true wird, führe die Vernichtung durch
  useEffect(() => {
    if (scanSuccess && scannedMemberId) {
      // Timeout clearen
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Nach 2 Sekunden die Vernichtung durchführen
      const timer = setTimeout(() => {
        onDestroy()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [scanSuccess, scannedMemberId, onDestroy])
  
  // Funktion zum sauberen Abbrechen
  const cleanupAndReturn = async () => {
    // Erst Timeout clearen
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    try {
      // Cancel-Request an Backend
      await api.post('/unifi_api_debug/cancel-rfid-session/')
      console.log("RFID-Session erfolgreich abgebrochen")
    } catch (error) {
      console.error("Fehler beim Abbrechen der RFID-Session:", error)
    }
    
    // States zurücksetzen
    setScanMode(false)
    setLoading(false)
    setTimeoutMessage('')
  }
  
  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true)
    setScanSuccess(false)
    setLoading(true)
    setTimeoutMessage('')
    
    // 30 Sekunden Timeout setzen
    timeoutRef.current = setTimeout(async () => {
      console.log("⏱️ RFID-Scan Timeout nach 30 Sekunden")
      setTimeoutMessage('Zeitüberschreitung - kehre zurück...')
      setLoading(false)
      
      // Nach 2 Sekunden zurück zum Formular
      setTimeout(() => {
        cleanupAndReturn()
      }, 2000)
    }, 30000)
    
    try {
      // RFID-Session binden
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_user_id, unifi_name } = bindRes.data
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen.')
      }
      
      console.log("🔍 Validiere Mitglied:", { token, unifi_user_id, unifi_name })
      
      // Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', {
        token,
        unifi_name
      })
      
      const { member_id, member_name } = verifyRes.data
      
      console.log("✅ RFID-Autorisierung erfolgreich:", { member_id, member_name })
      
      // States setzen
      setScannedMemberId(member_id)
      setScannedMemberName(member_name)
      setDestroyedByMemberId(member_id)
      setScanSuccess(true)
      setLoading(false)
      
    } catch (error) {
      console.error('RFID-Scan Fehler:', error.response?.data || error.message)
      
      // Bei Fehler zurück zum Formular
      if (scanMode) {
        await cleanupAndReturn()
      }
    }
  }
  
  // Manueller Abbruch
  const handleCancelScan = async () => {
    console.log("Manueller Abbruch initiiert")
    await cleanupAndReturn()
  }
  
  // Dialog schließen Handler
  const handleDialogClose = (event, reason) => {
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      onClose()
    }
  }
  
  // Formular-Validierung
  const isFormValid = () => {
    return destroyReason && destroyReason.trim().length > 0
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
    >
      {scanMode ? (
        // RFID-Scan-Modus
        <Box 
          sx={{ 
            bgcolor: scanSuccess ? 'success.light' : 'error.light', 
            height: '400px', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4,
            position: 'relative'
          }}
        >
          {!scanSuccess && !timeoutMessage && (
            <Button 
              onClick={handleCancelScan}
              variant="contained" 
              color="error"
              size="small"
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                minWidth: '100px',
                bgcolor: 'white',
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Abbrechen
            </Button>
          )}
          
          {scanSuccess ? (
            // Erfolgsmeldung
            <Fade in={scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <Zoom in={scanSuccess}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                </Zoom>
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Vernichtung wurde erfolgreich durchgeführt
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2, fontStyle: 'italic' }}>
                  Autorisiert durch:
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  {scannedMemberName}
                </Typography>
              </Box>
            </Fade>
          ) : timeoutMessage ? (
            // Timeout-Nachricht
            <Fade in={true}>
              <Box sx={{ textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4, opacity: 0.7 }} />
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold">
                  {timeoutMessage}
                </Typography>
              </Box>
            </Fade>
          ) : (
            // Warte auf Scan
            <>
              <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
              
              <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                Bitte Ausweis jetzt scannen
              </Typography>
              
              <Typography variant="body1" align="center" color="white" gutterBottom>
                um die Vernichtung zu autorisieren
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
              
              <Typography variant="caption" align="center" color="white" sx={{ mt: 2, opacity: 0.8 }}>
                Warte auf RFID-Karte... (max. 30 Sekunden)
              </Typography>
            </>
          )}
        </Box>
      ) : (
        // Formular-Modus
        <>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalFireDepartmentIcon sx={{ color: 'error.main', mr: 1, fontSize: 28 }} />
              <Typography variant="h6">{title}</Typography>
            </Box>
            <Button 
              onClick={onClose} 
              variant="contained" 
              color="error"
              size="small"
              sx={{ minWidth: '100px' }}
            >
              Abbrechen
            </Button>
          </DialogTitle>
          
          <DialogContent>
            {showQuantity && (
              <TextField
                label="Anzahl zu vernichtender Samen"
                type="number"
                fullWidth
                margin="normal"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: maxQuantity }}
              />
            )}
            
            <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
              Bitte geben Sie einen Grund für die Vernichtung an:
            </Typography>
            <TextField
              label="Vernichtungsgrund"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={destroyReason}
              onChange={(e) => setDestroyReason(e.target.value)}
              required
              autoFocus
              placeholder="z.B. Schimmelbefall, Kontamination, beschädigte Samen..."
            />
            
            <Box textAlign="center" mt={3} mb={1}>
              <Button
                onClick={startRfidScan}
                variant="contained"
                color="error"
                disabled={!isFormValid()}
                fullWidth
                sx={{ 
                  height: '48px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                Vernichtung autorisieren mit RFID
              </Button>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}
              >
                (Dieser Vorgang kann nicht rückgängig gemacht werden)
              </Typography>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  )
}

export default DestroyDialog