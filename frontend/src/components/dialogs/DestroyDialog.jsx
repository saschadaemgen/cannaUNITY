// frontend/src/components/dialogs/DestroyDialog.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, Fade, Zoom,
  LinearProgress
} from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SecurityIcon from '@mui/icons-material/Security'
import TimerIcon from '@mui/icons-material/Timer'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
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
  const [countdown, setCountdown] = useState(30)
  
  // Refs
  const timeoutRef = useRef(null)
  const countdownRef = useRef(null)
  const cleanupTimeoutRef = useRef(null)
  
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
      setCountdown(30)
      
      // Alle Timers clearen
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }
    }
  }, [open])
  
  // Wenn scanSuccess true wird, führe die Vernichtung durch
  useEffect(() => {
    if (scanSuccess && scannedMemberId) {
      // Timers clearen
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
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
    console.log("🧹 Cleanup initiated - cancelling RFID session")
    
    // Erst Timers clearen
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }
    
    try {
      // Cancel-Request an Backend
      console.log("📡 Sende Cancel-Request an Backend...")
      const response = await api.post('/unifi_api_debug/cancel-rfid-session/')
      console.log("✅ RFID-Session erfolgreich abgebrochen:", response.data)
    } catch (error) {
      console.error("❌ Fehler beim Abbrechen der RFID-Session:", error.response || error)
      // Trotzdem fortfahren
    }
    
    // States zurücksetzen
    setScanMode(false)
    setLoading(false)
    setTimeoutMessage('')
    setCountdown(30)
  }
  
  // RFID-Scan starten
  const startRfidScan = async () => {
  
    setScanMode(true)
    setScanSuccess(false)
    setLoading(true)
    setTimeoutMessage('')
    setCountdown(30)
    
    // Countdown starten
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // 30 Sekunden Timeout setzen
    timeoutRef.current = setTimeout(async () => {
      console.log("⏱️ RFID-Scan Timeout nach 30 Sekunden")
      
      // Countdown stoppen
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      
      setTimeoutMessage('Zeitüberschreitung - kehre zurück...')
      setLoading(false)
      
      // Direkt die cleanup Funktion aufrufen nach 2 Sekunden
      cleanupTimeoutRef.current = setTimeout(async () => {
        await cleanupAndReturn()
      }, 2000)
      
    }, 30000)
    
    try {
      // RFID-Session binden
      console.log("🔄 Starte RFID-Session bind...")
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
      console.error('❌ RFID-Scan Fehler:', error.response?.data || error.message)
      
      // Bei Fehler sofort cleanup
      if (scanMode && !scanSuccess) {
        console.log("🔴 Fehler erkannt, führe cleanup durch...")
        await cleanupAndReturn()
      }
    }
  }
  
  // Manueller Abbruch
  const handleCancelScan = async () => {
    console.log("🔴 Manueller Abbruch initiiert")
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
        // RFID-Scan-Modus mit rotem Sicherheitsdesign
        <Box 
          sx={{ 
            bgcolor: scanSuccess ? 'success.light' : 'error.light',
            height: '500px', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Sicherheitsmuster im Hintergrund */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,.05) 10px,
                rgba(255,255,255,.05) 20px
              )`,
              pointerEvents: 'none'
            }}
          />
          
          {!scanSuccess && !timeoutMessage && (
            <>
              {/* Sicherheitsindikator oben */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SecurityIcon sx={{ color: 'white', fontSize: 24 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  SICHERE AUTORISIERUNG
                </Typography>
              </Box>
              
              {/* Abbrechen Button */}
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
            </>
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
                <WarningAmberIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold">
                  {timeoutMessage}
                </Typography>
              </Box>
            </Fade>
          ) : (
            // Warte auf Scan mit Countdown
            <>
              <Box sx={{ position: 'relative', mb: 4 }}>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={(countdown / 30) * 100}
                    size={160}
                    thickness={3}
                    sx={{
                      color: countdown > 10 ? 'white' : '#ffeb3b',
                      position: 'absolute'
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                Bitte Ausweis jetzt scannen
              </Typography>
              
              <Typography variant="body1" align="center" color="white" gutterBottom>
                um die Vernichtung zu autorisieren
              </Typography>
              
              {/* Countdown Anzeige */}
              <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimerIcon sx={{ color: countdown > 10 ? 'white' : '#ffeb3b' }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: countdown > 10 ? 'white' : '#ffeb3b',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                >
                  {countdown}s
                </Typography>
              </Box>
              
              {/* Progress Bar */}
              <Box sx={{ width: '80%', mt: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(countdown / 30) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: countdown > 10 ? 'white' : '#ffeb3b',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
              
              {loading && (
                <CircularProgress 
                  size={30} 
                  thickness={3} 
                  sx={{ 
                    color: 'white', 
                    mt: 2,
                    opacity: 0.8
                  }} 
                />
              )}
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