// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/RfidAuthorization.jsx
import { useState, useEffect, useRef } from 'react'
import { 
  Box, Typography, Paper, Button, CircularProgress,
  Alert, Fade, Zoom, Card, CardContent, Grid
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FingerprintIcon from '@mui/icons-material/Fingerprint'
import SecurityIcon from '@mui/icons-material/Security'
import PersonIcon from '@mui/icons-material/Person'
import api from '@/utils/api'

export default function RfidAuthorization({ 
  recipientId, 
  selectedUnits, 
  notes, 
  onComplete, 
  onError 
}) {
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // NEU: Ref um zu tracken ob bereits gestartet wurde
  const hasStarted = useRef(false)
  
  // Auto-Start beim Mount - aber nur einmal!
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startRfidScan()
    }
    
    // Cleanup beim Unmount
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }, [])
  
  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true)
    setScanSuccess(false)
    await handleRfidScan()
  }
  
  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setSubmitting(true)
    
    try {
      console.log("🚀 Starte RFID-Scan für Produktausgabe...")
      
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
      
      if (!member_id || !member_name) {
        throw new Error('Mitgliedsverifizierung fehlgeschlagen: Unvollständige Daten')
      }
      
      // Erfolg setzen und Mitgliedsdaten speichern
      setScannedMemberName(member_name)
      setScanSuccess(true)
      
      // 3. Nach erfolgreicher Verifizierung die Produktausgabe durchführen
      setTimeout(async () => {
        await submitDistribution(member_id)
      }, 500)
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen')
      } else {
        console.error('RFID-Bindungsfehler:', error)
        onError(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen')
      }
      
      if (!isAborting) {
        setScanMode(false)
      }
    } finally {
      if (!isAborting) {
        setSubmitting(false)
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
      setSubmitting(false)
      setScanSuccess(false)
      setScannedMemberName('')
      
      setTimeout(() => {
        setIsAborting(false)
      }, 500)
    }
  }
  
  // Produktausgabe durchführen
  const submitDistribution = async (rfidDistributorId) => {
    try {
      const response = await api.post('/trackandtrace/distributions/', {
        distributor_id: rfidDistributorId,
        recipient_id: recipientId,
        packaging_unit_ids: selectedUnits.map(unit => unit.id),
        notes: notes,
        distribution_date: new Date().toISOString()
      })
      
      // Erfolgsmeldung anzeigen
      setTimeout(() => {
        onComplete()
      }, 2000)
      
    } catch (err) {
      console.error('Fehler beim Speichern der Produktausgabe:', err)
      onError(err.response?.data?.error || 'Die Produktausgabe konnte nicht gespeichert werden')
      setScanMode(false)
      setScanSuccess(false)
    }
  }
  
  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      {/* Informations-Cards */}
      <Grid container spacing={3} sx={{ mb: 4, opacity: scanMode ? 0.3 : 1 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Sichere Autorisierung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Die Ausgabe wird durch RFID-Authentifizierung 
                des Mitarbeiters autorisiert und dokumentiert.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <FingerprintIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Eindeutige Zuordnung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jede Ausgabe wird eindeutig dem ausgebenden 
                Mitarbeiter zugeordnet.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Lückenlose Dokumentation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alle Ausgaben werden revisionssicher im 
                System dokumentiert.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Paper
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.dark',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            zIndex: 1000,
            borderRadius: 2
          }}
        >
          {/* Abbrechen-Button nur anzeigen, wenn wir NICHT im Erfolgs-Modus sind */}
          {!scanSuccess && !isAborting && (
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
                
                <Typography variant="h4" align="center" color="white" fontWeight="bold" gutterBottom>
                  Autorisierung erfolgreich
                </Typography>
                
                <Typography variant="h6" align="center" color="white" sx={{ mt: 2 }}>
                  Ausgabe wird dokumentiert...
                </Typography>
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" sx={{ mt: 3 }}>
                  Autorisiert von: {scannedMemberName}
                </Typography>
                
                <CircularProgress 
                  size={40} 
                  thickness={4} 
                  sx={{ 
                    color: 'white', 
                    mt: 3 
                  }} 
                />
              </Box>
            </Fade>
          ) : (
            // Scan-Aufforderung
            <Fade in={!scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
                
                <Typography variant="h4" align="center" color="white" fontWeight="bold" gutterBottom>
                  Mitarbeiterausweis scannen
                </Typography>
                
                <Typography variant="h6" align="center" color="white" gutterBottom sx={{ opacity: 0.9 }}>
                  Bitte halten Sie Ihren Ausweis an das Lesegerät
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2, opacity: 0.7 }}>
                  Die Ausgabe wird nach erfolgreicher Authentifizierung 
                  automatisch dokumentiert
                </Typography>
                
                {submitting && (
                  <CircularProgress 
                    size={60} 
                    thickness={5} 
                    sx={{ 
                      color: 'white', 
                      mt: 4 
                    }} 
                  />
                )}
              </Box>
            </Fade>
          )}
        </Paper>
      )}
    </Box>
  )
}