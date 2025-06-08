// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/NewDistribution.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Backdrop
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import api from '@/utils/api'

// Import der Komponenten
import RecipientSelection from './RecipientSelection'
import ProductSelection from './ProductSelection'
import ReviewAndConfirm from './ReviewAndConfirm'
import RfidAuthorization from './RfidAuthorization'

// Cannabis-Limits Imports
import { formatWeight } from '@/apps/trackandtrace/utils/cannabisLimits'

const steps = [
  'Empfänger auswählen',
  'Produkte auswählen',
  'Überprüfen & Bestätigen',
  'RFID-Autorisierung'
]

export default function NewDistribution() {
  const navigate = useNavigate()
  
  // Stepper State
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  
  // Form States
  const [recipientId, setRecipientId] = useState('')
  const [selectedUnits, setSelectedUnits] = useState([])
  const [notes, setNotes] = useState('')
  const [memberLimits, setMemberLimits] = useState(null)
  
  // Data States
  const [members, setMembers] = useState([])
  const [availableUnits, setAvailableUnits] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(true)
  
  // UI States
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  const [showAbortDialog, setShowAbortDialog] = useState(false)
  
  // Lade initiale Daten
  useEffect(() => {
    loadMembers()
    loadAvailableUnits()
  }, [])
  
  // Lade verfügbare Einheiten neu wenn sich der Empfänger ändert (für THC-Filter)
  useEffect(() => {
    if (recipientId) {
      loadAvailableUnits(recipientId)
    }
  }, [recipientId])
  
  const loadMembers = async () => {
    try {
      const response = await api.get('/members/?limit=1000')
      setMembers(response.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
      handleError('Mitglieder konnten nicht geladen werden')
    } finally {
      setLoadingMembers(false)
    }
  }
  
  const loadAvailableUnits = async (memberId = null) => {
    setLoadingUnits(true)
    try {
      let url = '/trackandtrace/distributions/available_units/'
      if (memberId) {
        url += `?recipient_id=${memberId}`
      }
      const response = await api.get(url)
      setAvailableUnits(response.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der verfügbaren Einheiten:', error)
      handleError('Verfügbare Einheiten konnten nicht geladen werden')
    } finally {
      setLoadingUnits(false)
    }
  }
  
  // Callback für Limits von RecipientSelection
  const handleLimitsLoaded = (limits) => {
    setMemberLimits(limits)
  }
  
  // Handler für Empfänger-Änderung
  const handleRecipientChange = (newRecipientId) => {
    setRecipientId(newRecipientId)
    if (!newRecipientId) {
      setMemberLimits(null)
      setSelectedUnits([]) // Leere Produktauswahl bei Empfängerwechsel
    }
  }
  
  // Fehlerbehandlung
  const handleError = (message) => {
    setErrorMessage(message)
    setShowErrorDialog(true)
  }
  
  // Erfolgreiche Ausgabe
  const handleComplete = () => {
    setSuccess(true)
    setCompleted(true)
    
    // Nach 2 Sekunden zur Übersicht navigieren
    setTimeout(() => {
      navigate('/trackandtrace/distributions')
    }, 2000)
  }
  
  // Navigation
  const handleNext = () => {
    // Validierungen je nach Schritt
    switch (activeStep) {
      case 0: // Empfänger auswählen
        if (!recipientId) {
          handleError('Bitte wählen Sie einen Empfänger aus')
          return
        }
        break
        
      case 1: // Produkte auswählen
        if (selectedUnits.length === 0) {
          handleError('Bitte wählen Sie mindestens ein Produkt aus')
          return
        }
        
        // Limit-Validierung
        if (memberLimits) {
          const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
          const newDailyTotal = memberLimits.daily.consumed + totalWeight
          const newMonthlyTotal = memberLimits.monthly.consumed + totalWeight
          
          if (newDailyTotal > memberLimits.daily.limit) {
            const remaining = memberLimits.daily.limit - memberLimits.daily.consumed
            handleError(`Tageslimit würde überschritten! Maximal noch ${formatWeight(remaining)} möglich.`)
            return
          }
          
          if (newMonthlyTotal > memberLimits.monthly.limit) {
            const remaining = memberLimits.monthly.limit - memberLimits.monthly.consumed
            handleError(`Monatslimit würde überschritten! Maximal noch ${formatWeight(remaining)} möglich.`)
            return
          }
          
          // THC-Validierung für U21
          if (memberLimits.member.isU21) {
            const highThcUnits = selectedUnits.filter(unit => {
              const thc = unit.batch?.lab_testing_batch?.thc_content
              return thc && parseFloat(thc) > 10
            })
            
            if (highThcUnits.length > 0) {
              handleError(`${highThcUnits.length} Produkt(e) überschreiten das THC-Limit von 10% für U21-Mitglieder`)
              return
            }
          }
        }
        break
        
      case 2: // Überprüfen & Bestätigen
        // Keine zusätzliche Validierung nötig
        break
        
      default:
        break
    }
    
    setActiveStep(prevStep => prevStep + 1)
  }
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1)
  }
  
  const handleReset = () => {
    setActiveStep(0)
    setRecipientId('')
    setSelectedUnits([])
    setNotes('')
    setMemberLimits(null)
    setSuccess(false)
    setCompleted(false)
  }
  
  // Berechne Produkt-Zusammenfassung
  const productSummary = selectedUnits.reduce((summary, unit) => {
    const productType = unit.batch?.product_type || 'unknown'
    const displayType = unit.batch?.product_type_display || 'Unbekannt'
    
    if (!summary[productType]) {
      summary[productType] = {
        count: 0,
        weight: 0,
        displayType
      }
    }
    
    summary[productType].count++
    summary[productType].weight += parseFloat(unit.weight || 0)
    
    return summary
  }, {})
  
  // Render Schritt-Inhalt
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <RecipientSelection
            members={members}
            recipientId={recipientId}
            setRecipientId={handleRecipientChange}
            onLimitsLoaded={handleLimitsLoaded}
          />
        )
        
      case 1:
        return (
          <ProductSelection
            availableUnits={availableUnits}
            selectedUnits={selectedUnits}
            setSelectedUnits={setSelectedUnits}
            recipientId={recipientId}
            memberLimits={memberLimits}
          />
        )
        
      case 2:
        return (
          <ReviewAndConfirm
            recipient={members.find(m => m.id === recipientId)}
            selectedUnits={selectedUnits}
            totalWeight={selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)}
            productSummary={productSummary}
            notes={notes}
            setNotes={setNotes}
            memberLimits={memberLimits}
          />
        )
        
      case 3:
        return (
          <RfidAuthorization
            recipientId={recipientId}
            selectedUnits={selectedUnits}
            notes={notes}
            onComplete={handleComplete}
            onError={handleError}
          />
        )
        
      default:
        return null
    }
  }
  
  // Loading Screen
  if (loadingMembers || loadingUnits) {
    return (
      <Backdrop open={true} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Neue Produktausgabe
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Dokumentieren Sie die Ausgabe von Cannabis-Produkten an Mitglieder
          </Typography>
        </Box>
        
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} completed={completed || index < activeStep}>
              <StepLabel
                StepIconProps={{
                  completed: completed || index < activeStep,
                  error: false
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Content */}
        {success ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ausgabe erfolgreich dokumentiert!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Die Produktausgabe wurde erfolgreich im System erfasst.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/trackandtrace/distributions')}
            >
              Zur Übersicht
            </Button>
          </Box>
        ) : (
          <>
            {/* Step Content */}
            <Box sx={{ minHeight: 400, mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>
            
            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {/* Zurück-Button: */}
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                color="secondary"
              >
                Zurück
              </Button>

              {/* Abbrechen-Button: */}
              {(activeStep > 0 && activeStep < steps.length - 1) && (
                <Button
                  onClick={() => setShowAbortDialog(true)}
                  variant="outlined"
                  color="error"
                >
                  Abbrechen
                </Button>
              )}

              {/* Weiter-Button: */}
              {activeStep === steps.length - 1 ? (
                <Box />
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  color="success"
                  disabled={processing}
                >
                  {activeStep === steps.length - 2 ? 'Zur Autorisierung' : 'Weiter'}
                </Button>
              )}
            </Box>
          </>
        )}
        
        {/* Error Dialog */}
        <Dialog
          open={showErrorDialog}
          onClose={() => setShowErrorDialog(false)}
          aria-labelledby="error-dialog-title"
        >
          <DialogTitle id="error-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" />
            Fehler
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {errorMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowErrorDialog(false)} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={showAbortDialog}
          onClose={() => setShowAbortDialog(false)}
          aria-labelledby="abort-dialog-title"
        >
          <DialogTitle id="abort-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" />
            Vorgang abbrechen?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sind Sie sicher, dass Sie die Produktausgabe abbrechen und zum Start zurückkehren möchten?<br />
              Nicht gespeicherte Eingaben gehen verloren.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAbortDialog(false)} autoFocus>
              Nein, zurück
            </Button>
            <Button 
              onClick={() => { 
                setShowAbortDialog(false); 
                handleReset();
              }} 
              color="error"
              variant="contained"
            >
              Ja, abbrechen
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  )
}