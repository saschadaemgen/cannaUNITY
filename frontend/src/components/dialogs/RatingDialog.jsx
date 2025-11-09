// frontend/src/components/dialogs/RatingDialog.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Fade,
  Zoom,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PersonIcon from '@mui/icons-material/Person'
import HistoryIcon from '@mui/icons-material/History'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import ScienceIcon from '@mui/icons-material/Science'
import NatureIcon from '@mui/icons-material/Nature'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import api from '@/utils/api'

// Animierter Zähler für die Gesamtbewertung
const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)
  const previousValue = useRef(0)
  
  useEffect(() => {
    const numericValue = parseFloat(value)
    const startValue = previousValue.current
    const difference = numericValue - startValue
    const duration = 600 // ms
    const steps = 30
    const stepDuration = duration / steps
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      if (currentStep === steps) {
        setDisplayValue(numericValue)
        previousValue.current = numericValue
        clearInterval(timer)
        
        // Feuerwerk bei 10.0
        if (numericValue === 10.0) {
          setShowFireworks(true)
          setTimeout(() => setShowFireworks(false), 100)
        }
      } else {
        const progress = currentStep / steps
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (difference * easeOutQuart)
        setDisplayValue(currentValue)
      }
    }, stepDuration)
    
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Typography 
        variant="h2" 
        sx={{ 
          fontWeight: 'bold', 
          color: '#2e7d32',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {displayValue.toFixed(1)}
      </Typography>
      <FireworksExplosion trigger={showFireworks} />
    </Box>
  )
};

// Konfetti-Komponente für 10/10 Bewertungen (in AnimatedRating)
const ConfettiExplosion = ({ trigger }) => {
  const [particles, setParticles] = useState([])
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: ['#2e7d32', '#4caf50', '#66bb6a', '#81c784'][Math.floor(Math.random() * 4)]
      }))
      setParticles(newParticles)
      
      setTimeout(() => setParticles([]), 2000)
    }
  }, [trigger])
  
  return (
    <Box sx={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 1, 
              scale: 0,
              rotate: 0
            }}
            animate={{ 
              x: particle.x * 3, 
              y: particle.y * 3 - 50, 
              opacity: 0, 
              scale: particle.scale,
              rotate: particle.rotation
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: particle.color,
              borderRadius: '2px'
            }}
          />
        ))}
      </AnimatePresence>
    </Box>
  )
};

// Feuerwerk-Komponente für perfekte Bewertungen
const FireworksExplosion = ({ trigger }) => {
  const [particles, setParticles] = useState([])
  
  useEffect(() => {
    if (trigger) {
      const colors = ['#2e7d32', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#ffeb3b', '#ffc107']
      const newParticles = []
      
      // Mehrere Explosionen
      for (let explosion = 0; explosion < 3; explosion++) {
        const offsetX = (explosion - 1) * 80
        const offsetY = explosion * -30
        
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2
          const velocity = 3 + Math.random() * 2
          newParticles.push({
            id: `${explosion}-${i}`,
            x: offsetX,
            y: offsetY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: 4 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: explosion * 0.2
          })
        }
      }
      
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 2500)
    }
  }, [trigger])
  
  return (
    <Box sx={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.x, 
              y: particle.y, 
              opacity: 1, 
              scale: 0
            }}
            animate={{ 
              x: particle.x + particle.vx * 50, 
              y: particle.y + particle.vy * 50 - 30, 
              opacity: 0, 
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut",
              delay: particle.delay
            }}
            style={{
              position: 'absolute',
              width: particle.size + 'px',
              height: particle.size + 'px',
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Zusätzliche Sterne */}
      <AnimatePresence>
        {trigger && Array.from({ length: 5 }, (_, i) => (
          <motion.div
            key={`star-${i}`}
            initial={{ 
              scale: 0, 
              rotate: 0,
              x: (i - 2) * 30,
              y: -50
            }}
            animate={{ 
              scale: [0, 2, 0],
              rotate: 360,
              y: -100
            }}
            transition={{ 
              duration: 2, 
              delay: i * 0.1,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              fontSize: '2rem',
            }}
          >
            ⭐
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  )
};

// Animierte Rating-Komponente mit konsistenter Größe
const AnimatedRating = ({ value, onChange, max = 10, readOnly = false, label, fullWidth = false }) => {
  const [hoverValue, setHoverValue] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const controls = useAnimation()

  const handleChange = (event, newValue) => {
    if (!readOnly) {
      setIsAnimating(true)
      onChange(event, newValue)
      
      // Spektakulärer Puls-Effekt
      controls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        transition: { duration: 0.5, ease: "easeInOut" }
      })
      
      // Konfetti bei 10/10
      if (newValue === max) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 100)
      }
      
      setTimeout(() => setIsAnimating(false), 500)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative'
    }}>
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <Box sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isAnimating ? '150%' : '0%',
            height: isAnimating ? '150%' : '0%',
            background: 'radial-gradient(circle, rgba(46, 125, 50, 0.3) 0%, rgba(46, 125, 50, 0.1) 40%, transparent 70%)',
            borderRadius: '50%',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            zIndex: 0
          }
        }}>
          <motion.div animate={controls}>
            <Rating
              value={value}
              onChange={handleChange}
              onChangeActive={(event, newHover) => setHoverValue(newHover)}
              max={max}
              size="large"
              readOnly={readOnly}
              sx={{
                fontSize: '2rem',
                position: 'relative',
                zIndex: 1,
                '& .MuiRating-icon': {
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.2) translateY(-2px)',
                  }
                },
                '& .MuiRating-iconFilled': {
                  color: '#2e7d32',
                  filter: value >= 8 ? 'drop-shadow(0 0 4px rgba(46, 125, 50, 0.5))' : 'none',
                  '&:hover': {
                    filter: 'brightness(1.3) drop-shadow(0 0 6px rgba(46, 125, 50, 0.7))',
                  }
                },
                '& .MuiRating-iconEmpty': {
                  color: 'rgba(46, 125, 50, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'rgba(46, 125, 50, 0.5)',
                  }
                }
              }}
            />
          </motion.div>
          
          <ConfettiExplosion trigger={showConfetti} />
        </Box>
      </Box>
      
      {/* Wert-Anzeige rechts ausgerichtet */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          style={{ marginLeft: '16px' }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              minWidth: '90px',
              color: '#2e7d32',
              fontWeight: '600',
              textAlign: 'right'
            }}
          >
            {hoverValue > -1 ? hoverValue : value}/{max}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Box>
  )
};

// Animierter Button
const AnimatedButton = motion(Button);

const RatingDialog = ({ 
  open, 
  onClose, 
  batch, 
  plant,
  onRatingCreated 
}) => {
  // States für Bewertung
  const [overallHealth, setOverallHealth] = useState(5)
  const [growthStructure, setGrowthStructure] = useState(5)
  const [regenerationAbility, setRegenerationAbility] = useState(5)
  const [regrowthSpeed, setRegrowthSpeed] = useState('normal')
  const [regrowthSpeedRating, setRegrowthSpeedRating] = useState(5)
  const [cuttingsHarvested, setCuttingsHarvested] = useState(0)
  const [cuttingQuality, setCuttingQuality] = useState(5)
  const [rootingSuccessRate, setRootingSuccessRate] = useState(null)
  const [healthNotes, setHealthNotes] = useState('')
  const [growthNotes, setGrowthNotes] = useState('')
  const [regenerationNotes, setRegenerationNotes] = useState('')
  
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  const [memberId, setMemberId] = useState(null)
  
  // State für Historie
  const [ratingHistory, setRatingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // States für Historie-Ansicht
  const [viewMode, setViewMode] = useState('new')
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [isReadOnly, setIsReadOnly] = useState(false)

  // Lade Bewertungs-Historie
  const loadRatingHistory = async () => {
    if (!plant?.id) return
    
    setLoadingHistory(true)
    try {
      const response = await api.get(`/trackandtrace/motherplant-ratings/?mother_plant_id=${plant.id}`)
      setRatingHistory(response.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Historie:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Funktion zum Laden einer historischen Bewertung
  const loadHistoricRating = (rating) => {
    setOverallHealth(rating.overall_health || 5)
    setGrowthStructure(rating.growth_structure || 5)
    setRegenerationAbility(rating.regeneration_ability || 5)
    setRegrowthSpeed(rating.regrowth_speed || 'normal')
    setRegrowthSpeedRating(rating.regrowth_speed_rating || 5)
    setCuttingsHarvested(rating.cuttings_harvested || 0)
    setCuttingQuality(rating.cutting_quality || 5)
    setRootingSuccessRate(rating.rooting_success_rate)
    setHealthNotes(rating.health_notes || '')
    setGrowthNotes(rating.growth_notes || '')
    setRegenerationNotes(rating.regeneration_notes || '')
    
    setSelectedHistoryId(rating.id)
    setViewMode('history')
    setIsReadOnly(true)
  }

  // Funktion zum Zurücksetzen auf neue Bewertung
  const resetToNewRating = () => {
    setOverallHealth(5)
    setGrowthStructure(5)
    setRegenerationAbility(5)
    setRegrowthSpeed('normal')
    setRegrowthSpeedRating(5)
    setCuttingsHarvested(0)
    setCuttingQuality(5)
    setRootingSuccessRate(null)
    setHealthNotes('')
    setGrowthNotes('')
    setRegenerationNotes('')
    
    setSelectedHistoryId(null)
    setViewMode('new')
    setIsReadOnly(false)
  }

  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open && plant) {
      resetToNewRating()
      setScanMode(false)
      setScanSuccess(false)
      setScannedMemberName('')
      setMemberId(null)
      setAbortController(null)
      setIsAborting(false)
      loadRatingHistory()
    }
  }, [open, plant])

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
    setLoading(true)
    
    try {
      console.log("🚀 Starte RFID-Scan für Bewertung...")
      
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      })
      
      if (isAborting) return
      
      const { token, unifi_user_id, unifi_name } = bindRes.data
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen.')
      }
      
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      )
      
      const { member_id, member_name } = verifyRes.data
      
      setMemberId(member_id)
      setScannedMemberName(member_name)
      setScanSuccess(true)
      
      setTimeout(async () => {
        await handleSaveRating(member_id)
        setTimeout(() => {
          handleDialogClose()
        }, 2000)
      }, 500)
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen')
      } else {
        console.error('RFID-Fehler:', error)
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
      console.log("RFID-Scan abgebrochen")
    } catch (error) {
      console.error('Abbruch fehlgeschlagen:', error)
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

  // Bewertung speichern
  const handleSaveRating = async (rfidMemberId) => {
    try {
      const ratingData = {
        mother_plant: plant.id,
        overall_health: overallHealth,
        health_notes: healthNotes,
        growth_structure: growthStructure,
        growth_notes: growthNotes,
        regeneration_ability: regenerationAbility,
        regeneration_notes: regenerationNotes,
        regrowth_speed: regrowthSpeed,
        regrowth_speed_rating: regrowthSpeedRating,
        cuttings_harvested: cuttingsHarvested,
        cutting_quality: cuttingQuality,
        rooting_success_rate: rootingSuccessRate,
        rated_by_id: rfidMemberId
      }
      
      await api.post('/trackandtrace/motherplant-ratings/', ratingData)
      
      if (onRatingCreated) {
        onRatingCreated()
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Bewertung:', error)
      alert('Fehler beim Speichern der Bewertung')
    }
  }

  // Dialog schließen
  const handleDialogClose = () => {
    setScanMode(false)
    setScanSuccess(false)
    setScannedMemberName('')
    setMemberId(null)
    
    if (onClose) {
      onClose()
    }
  }

  // Berechne Gesamtbewertung
  const calculateOverallScore = () => {
    const scores = [
      overallHealth,
      growthStructure,
      regenerationAbility,
      regrowthSpeedRating,
      cuttingQuality
    ]
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  }

  // Formatiere Regrowth Speed
  const formatRegrowthSpeed = (speed) => {
    const speedMap = {
      'very_fast': 'Sehr schnell',
      'fast': 'Schnell',
      'normal': 'Normal',
      'slow': 'Langsam'
    }
    return speedMap[speed] || speed
  }

  if (!plant) {
    return null
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
      fullScreen
      disableEscapeKeyDown
      PaperProps={{
        sx: { 
          position: 'fixed',
          overflow: 'hidden',
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          bgcolor: '#f8f9fa'
        }
      }}
    >
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: '#2e7d32',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1300
        }}>
          {!scanSuccess && (
            <Button 
              onClick={handleCancelScan}
              variant="contained" 
              color="error"
              size="medium"
              sx={{ 
                position: 'absolute',
                top: 20,
                right: 20,
                minWidth: '120px',
                height: '40px'
              }}
            >
              Abbrechen
            </Button>
          )}
          
          {scanSuccess ? (
            <Fade in={scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <Zoom in={scanSuccess}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 2 }} />
                </Zoom>
                
                <Typography variant="h3" color="white" fontWeight="500" gutterBottom>
                  Bewertung erfolgreich gespeichert
                </Typography>
                
                <Typography variant="h5" color="white" sx={{ mt: 2 }}>
                  Mutterpflanze {plant.batch_number} | Bewertung: {calculateOverallScore()}
                </Typography>
                
                <Typography variant="h5" color="white" sx={{ mt: 2 }}>
                  Bewerter: {scannedMemberName}
                </Typography>
              </Box>
            </Fade>
          ) : (
            <>
              <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 2 }} />
              
              <Typography variant="h3" color="white" fontWeight="300" gutterBottom>
                RFID-Authentifizierung erforderlich
              </Typography>
              
              <Typography variant="h5" color="white" fontWeight="300" gutterBottom>
                Bitte Mitarbeiterausweis scannen
              </Typography>
              
              {loading && (
                <CircularProgress 
                  size={80} 
                  thickness={4} 
                  sx={{ color: 'white', mt: 3 }} 
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: '#2e7d32',
        color: 'white',
        px: 3,
        height: '70px',
        borderBottom: '2px solid #2e7d32',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <LocalHospitalIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 300 }}>
            Mutterpflanzenbewertung {viewMode === 'history' && '(Historie)'}
          </Typography>
        </motion.div>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.1)'
          }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>ID:</Typography>
            <Typography variant="h6" sx={{ ml: 1 }}>{plant.batch_number}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.1)'
          }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>Genetik:</Typography>
            <Typography variant="h6" sx={{ ml: 1 }}>{batch?.seed_strain || 'N/A'}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.1)'
          }}>
            <Typography variant="h6">{new Date().toLocaleDateString('de-DE')}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ 
        p: 3, 
        display: 'flex',
        gap: 3,
        height: 'calc(100vh - 70px - 80px)',
        overflow: 'auto'
      }}>
        {/* Hauptbereich - 3 Spalten */}
        <Box sx={{ 
          flex: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
            lg: '1fr 1fr 1fr'
          },
          gap: 3,
          width: '100%'
        }}>
          {/* Spalte 1: Gesundheitsbewertung */}
          <Card sx={{ bgcolor: 'white', boxShadow: 2, opacity: isReadOnly ? 0.95 : 1, height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ScienceIcon sx={{ mr: 1.5, fontSize: 28, color: '#2e7d32' }} />
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Pflanzengesundheit
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Allgemeine Gesundheit */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Allgemeine Pflanzengesundheit
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <AnimatedRating
                      value={overallHealth}
                      onChange={(e, value) => setOverallHealth(value)}
                      max={10}
                      readOnly={isReadOnly}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Klinische Notizen"
                    value={healthNotes}
                    onChange={(e) => !isReadOnly && setHealthNotes(e.target.value)}
                    multiline
                    rows={6}
                    variant="outlined"
                    InputProps={{ readOnly: isReadOnly }}
                  />
                </Box>

                {/* Wuchsstruktur */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Wuchsstruktur und Verzweigung
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <AnimatedRating
                      value={growthStructure}
                      onChange={(e, value) => setGrowthStructure(value)}
                      max={10}
                      readOnly={isReadOnly}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Strukturelle Beobachtungen"
                    value={growthNotes}
                    onChange={(e) => !isReadOnly && setGrowthNotes(e.target.value)}
                    multiline
                    rows={6}
                    variant="outlined"
                    InputProps={{ readOnly: isReadOnly }}
                  />
                </Box>

                {/* Regeneration */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Regenerationsfähigkeit nach Schnitt
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <AnimatedRating
                      value={regenerationAbility}
                      onChange={(e, value) => setRegenerationAbility(value)}
                      max={10}
                      readOnly={isReadOnly}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Regenerationsprotokoll"
                    value={regenerationNotes}
                    onChange={(e) => !isReadOnly && setRegenerationNotes(e.target.value)}
                    multiline
                    rows={6}
                    variant="outlined"
                    InputProps={{ readOnly: isReadOnly }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Spalte 2: Produktionsdaten */}
          <Card sx={{ bgcolor: 'white', boxShadow: 2, opacity: isReadOnly ? 0.95 : 1, height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NatureIcon sx={{ mr: 1.5, fontSize: 28, color: '#388e3c' }} />
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Produktionsdaten
                </Typography>
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Nachwachsgeschwindigkeit - oben wie bei Karte 1 */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Nachwachsgeschwindigkeit
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <AnimatedRating
                      value={regrowthSpeedRating}
                      onChange={(e, value) => setRegrowthSpeedRating(value)}
                      max={10}
                      readOnly={isReadOnly}
                    />
                  </Box>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Geschwindigkeit auswählen</InputLabel>
                    <Select
                      value={regrowthSpeed}
                      onChange={(e) => !isReadOnly && setRegrowthSpeed(e.target.value)}
                      label="Geschwindigkeit auswählen"
                    >
                      <MenuItem value="very_fast">Sehr schnell (&lt; 7 Tage)</MenuItem>
                      <MenuItem value="fast">Schnell (7-14 Tage)</MenuItem>
                      <MenuItem value="normal">Normal (14-21 Tage)</MenuItem>
                      <MenuItem value="slow">Langsam (&gt; 21 Tage)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Qualität der Stecklinge */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Qualität der Stecklinge
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <AnimatedRating
                      value={cuttingQuality}
                      onChange={(e, value) => setCuttingQuality(value)}
                      max={10}
                      readOnly={isReadOnly}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Anzahl geernteter Stecklinge"
                      type="number"
                      value={cuttingsHarvested}
                      onChange={(e) => !isReadOnly && setCuttingsHarvested(parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0, readOnly: isReadOnly }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Erfolgsquote (%)"
                      type="number"
                      value={rootingSuccessRate || ''}
                      onChange={(e) => !isReadOnly && setRootingSuccessRate(e.target.value ? parseFloat(e.target.value) : null)}
                      inputProps={{ min: 0, max: 100, step: 0.1, readOnly: isReadOnly }}
                      helperText="Optional"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>

                {/* Gesamtbewertung */}
                <Box sx={{ 
                  mt: 'auto',
                  p: 3, 
                  bgcolor: isReadOnly ? '#f5f5f5' : '#f8f9fa',
                  borderRadius: 2,
                  textAlign: 'center',
                  border: '1px solid #e0e0e0',
                  position: 'relative'
                }}>
                  <Typography variant="h6" sx={{ color: '#2e7d32', mb: 1 }}>
                    {isReadOnly ? 'Historische Gesamtbewertung' : 'Gesamtbewertung'}
                  </Typography>
                  <AnimatedCounter value={calculateOverallScore()} />
                  <Typography variant="subtitle1" sx={{ color: '#666' }}>
                    von 10.0
                  </Typography>
                  
                  {calculateOverallScore() >= 9 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        background: '#4caf50',
                        color: 'white',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      ⭐
                    </motion.div>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Spalte 3: Historie */}
          <Card sx={{ bgcolor: 'white', boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HistoryIcon sx={{ mr: 1.5, fontSize: 28, color: '#2e7d32' }} />
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Bewertungshistorie
                </Typography>
                <Chip 
                  label={`${ratingHistory.length} Einträge`}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {loadingHistory ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : ratingHistory.length === 0 ? (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body1">
                      Keine vorherigen Bewertungen vorhanden
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ 
                    height: '100%',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#bdbdbd',
                      borderRadius: '4px',
                    },
                  }}>
                    {ratingHistory.map((rating, index) => {
                      const historicalScore = rating.overall_score || (
                        (rating.overall_health + rating.growth_structure + rating.regeneration_ability + 
                         rating.regrowth_speed_rating + rating.cutting_quality) / 5
                      ).toFixed(1)
                      
                      return (
                        <Box key={rating.id}>
                          <Paper
                            elevation={0}
                            sx={{ 
                              border: selectedHistoryId === rating.id ? '2px solid #2e7d32' : '1px solid #e0e0e0',
                              borderRadius: 2,
                              mb: 2,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 3,
                                borderColor: selectedHistoryId === rating.id ? '#2e7d32' : '#999'
                              }
                            }}
                            onClick={() => loadHistoricRating(rating)}
                          >
                            {/* Header mit Datum und Bewerter */}
                            <Box sx={{ 
                              bgcolor: '#f5f5f5',
                              px: 2,
                              py: 1.5,
                              borderBottom: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {new Date(rating.created_at).toLocaleDateString('de-DE', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })} • {new Date(rating.created_at).toLocaleTimeString('de-DE', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} Uhr
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Bewertet von: {rating.rated_by?.display_name || 'Unbekannt'}
                                </Typography>
                              </Box>
                              <VisibilityIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </Box>
                            
                            {/* Hauptinhalt */}
                            <Box sx={{ p: 2 }}>
                              <Grid container spacing={2} alignItems="stretch">
                                {/* Linke Seite: Gesamtbewertung */}
                                <Grid item xs={3}>
                                  <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    borderRight: '1px solid #e0e0e0',
                                    pr: 2
                                  }}>
                                    <Box sx={{
                                      bgcolor: historicalScore >= 8 ? '#2e7d32' : 
                                              historicalScore >= 6 ? '#ff9800' : '#f44336',
                                      color: 'white',
                                      borderRadius: 2,
                                      px: 3,
                                      py: 2,
                                      textAlign: 'center',
                                      minWidth: '100px'
                                    }}>
                                      <Typography variant="h3" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                        {historicalScore}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: '0.75rem', letterSpacing: 1 }}>
                                        RATING
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                
                                {/* Mitte: Produktionsdaten */}
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    borderRight: '1px solid #e0e0e0',
                                    pr: 2
                                  }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                      Produktionsdaten
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Chip 
                                        label={`${rating.cuttings_harvested} Stecklinge`}
                                        size="small"
                                        icon={<NatureIcon sx={{ fontSize: 16 }} />}
                                        sx={{ alignSelf: 'flex-start' }}
                                      />
                                      <Chip 
                                        label={formatRegrowthSpeed(rating.regrowth_speed)}
                                        size="small"
                                        sx={{ alignSelf: 'flex-start' }}
                                      />
                                      {rating.rooting_success_rate && (
                                        <Chip 
                                          label={`${rating.rooting_success_rate}% Erfolg`}
                                          size="small"
                                          color="success"
                                          variant="filled"
                                          sx={{ alignSelf: 'flex-start' }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                                
                                {/* Rechte Seite: Einzelbewertungen */}
                                <Grid item xs={5}>
                                  <Box sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                      Detailbewertungen
                                    </Typography>
                                    <Grid container spacing={2}>
                                      <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            Gesundheit
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                            {rating.overall_health}/10
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            Struktur
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                            {rating.growth_structure}/10
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                            Regeneration
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                            {rating.regeneration_ability}/10
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Paper>
                        </Box>
                      )
                    })}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ 
        p: 2,
        bgcolor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '80px'
      }}>
        <AnimatedButton
          onClick={handleDialogClose} 
          variant="outlined"
          size="large"
          sx={{ minWidth: '150px', height: '50px' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          Abbrechen
        </AnimatedButton>
        
        <Typography variant="body2" color="text.secondary">
          cannaUNITY Cannabis Qualitätssicherung
        </Typography>

        {isReadOnly ? (
          <AnimatedButton
            onClick={resetToNewRating}
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{ 
              minWidth: '350px', 
              height: '50px',
              bgcolor: '#2b772fff',
              '&:hover': {
                bgcolor: '#165719ff'
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            Neue Bewertung erstellen
          </AnimatedButton>
        ) : (
          <AnimatedButton
            onClick={startRfidScan}
            variant="contained"
            size="large"
            disabled={loading || cuttingsHarvested === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
            sx={{ 
              minWidth: '350px', 
              height: '50px',
              bgcolor: '#2b772fff',
              '&:hover': {
                bgcolor: '#165719ff'
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            Mit RFID autorisieren & speichern
          </AnimatedButton>
        )}
      </Box>
    </Dialog>
  )
};

export default RatingDialog;