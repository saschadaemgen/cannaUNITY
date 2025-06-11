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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Backdrop,
  Tooltip,
  Snackbar
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import api from '@/utils/api'

import RecipientSelection from './RecipientSelection'
import ProductSelection from './ProductSelection'
import ReviewAndConfirm from './ReviewAndConfirm'
import RfidAuthorization from './RfidAuthorization'
import { formatWeight } from '@/apps/trackandtrace/utils/cannabisLimits'

const steps = [
  'Empfänger auswählen',
  'Produkte auswählen',
  'Überprüfen & Bestätigen',
  'RFID-Autorisierung'
]

export default function NewDistribution() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [selectedUnits, setSelectedUnits] = useState([])
  const [notes, setNotes] = useState('')
  const [memberLimits, setMemberLimits] = useState(null)
  const [members, setMembers] = useState([])
  const [availableUnits, setAvailableUnits] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    loadMembers()
    loadAvailableUnits()
  }, [])

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

  const handleLimitsLoaded = (limits) => {
    setMemberLimits(limits)
  }

  const handleRecipientChange = (newRecipientId) => {
    setRecipientId(newRecipientId)
    if (!newRecipientId) {
      setMemberLimits(null)
      setSelectedUnits([])
    }
  }

  const handleError = (message) => {
    setErrorMessage(message)
    setShowErrorDialog(true)
  }

  const handleComplete = async () => {
    setSuccess(true)
    setCompleted(true)
    
    setSuccessSnackbarMessage('Produktausgabe wurde erfolgreich dokumentiert!')
    setShowSuccessSnackbar(true)
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/')
      console.log('RFID-Session erfolgreich beendet')
    } catch (err) {
      console.log('Session cleanup fehlgeschlagen:', err)
    }
    
    setTimeout(() => {
      handleReset()
    }, 3000)
  }

  const handleNext = () => {
    switch (activeStep) {
      case 0:
        if (!recipientId) {
          handleError('Bitte scannen Sie zuerst einen Mitgliedsausweis')
          return
        }
        // Prüfen ob Tageslimit erreicht
        if (memberLimits && memberLimits.daily.percentage >= 100) {
          handleError('Tageslimit erreicht! Eine weitere Ausgabe ist heute nicht möglich.')
          return
        }
        break
      case 1:
        if (selectedUnits.length === 0) {
          handleError('Bitte wählen Sie mindestens ein Produkt aus')
          return
        }
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
      default:
        break
    }
    setActiveStep(prevStep => prevStep + 1)
  }

  const handleBack = () => setActiveStep(prevStep => prevStep - 1)

  const handleReset = async () => {
    setIsResetting(true)
    
    setActiveStep(0)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setRecipientId('')
    setSelectedUnits([])
    setNotes('')
    setMemberLimits(null)
    setSuccess(false)
    setCompleted(false)
    setError(null)
    
    await Promise.all([
      loadMembers(),
      loadAvailableUnits()
    ])
    
    setIsResetting(false)
  }

  const productSummary = selectedUnits.reduce((summary, unit) => {
    const productType = unit.batch?.product_type || 'unknown'
    const displayType = unit.batch?.product_type_display || 'Unbekannt'
    if (!summary[productType]) {
      summary[productType] = { count: 0, weight: 0, displayType }
    }
    summary[productType].count++
    summary[productType].weight += parseFloat(unit.weight || 0)
    return summary
  }, {})

  const renderStepContent = (step) => {
    if (isResetting) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      )
    }
    
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
        return !isResetting ? (
          <RfidAuthorization
            recipientId={recipientId}
            selectedUnits={selectedUnits}
            notes={notes}
            onComplete={handleComplete}
            onError={handleError}
          />
        ) : null
      default:
        return null
    }
  }

  if (loadingMembers || loadingUnits) {
    return (
      <Backdrop open={true} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return (
    <Box sx={{
      py: 3,
      mx: 'auto',
      width: '100%',
      maxWidth: '1700px',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* Erfolgs-Snackbar */}
      <Snackbar 
        open={showSuccessSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successSnackbarMessage}
        </Alert>
      </Snackbar>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Stepper mit Hintergrund */}
        <Box sx={{ 
          bgcolor: 'grey.100', 
          borderRadius: 2, 
          p: 3, 
          mb: 3 
        }}>
          <Stepper activeStep={activeStep}>
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
        </Box>

        {/* Content */}
        {success ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ausgabe erfolgreich dokumentiert!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Die Produktausgabe wurde erfolgreich im System erfasst.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Das System wird in wenigen Sekunden für eine neue Ausgabe zurückgesetzt...
            </Typography>
            <CircularProgress 
              size={40} 
              sx={{ 
                mt: 3,
                color: 'success.main' 
              }} 
            />
          </Box>
        ) : (
          <>
            <Box sx={{ minHeight: 350, mb: 3 }}>
              {renderStepContent(activeStep)}
            </Box>
            
            {/* Button-Bereich */}
            {activeStep < steps.length - 1 && (
              <Box sx={{ mt: 3 }}>
                {activeStep === 0 ? (
                  // Schritt 1: Nur Weiter-Button
                  <Tooltip 
                    title={
                      memberLimits && memberLimits.daily.percentage >= 100 
                        ? "Tageslimit erreicht - Gemäß § 9 Abs. 2 KCanG darf die Weitergabe 25g pro Tag nicht überschreiten" 
                        : ""
                    }
                  >
                    <span style={{ display: 'block' }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<ArrowForwardIcon />}
                        color="success"
                        fullWidth
                        disabled={
                          processing || 
                          (memberLimits && memberLimits.daily.percentage >= 100) ||
                          !recipientId
                        }
                        sx={{ 
                          height: 64, 
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Weiter zur Produktauswahl
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  // Schritt 2 & 3: Zurück und Weiter nebeneinander
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      onClick={handleBack}
                      startIcon={<ArrowBackIcon />}
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      sx={{ height: 56, fontSize: '1rem' }}
                    >
                      Zurück
                    </Button>
                    
                    <Tooltip 
                      title={
                        activeStep === 0 && memberLimits && memberLimits.daily.percentage >= 100 
                          ? "Tageslimit erreicht - Gemäß § 9 Abs. 2 KCanG darf die Weitergabe 25g pro Tag nicht überschreiten" 
                          : ""
                      }
                    >
                      <span style={{ flex: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<ArrowForwardIcon />}
                          color="success"
                          fullWidth
                          disabled={processing}
                          sx={{ height: 56, fontSize: '1rem' }}
                        >
                          {activeStep === 1 ? 'Weiter zur Überprüfung' :
                           activeStep === 2 ? 'Zur RFID-Autorisierung' : 
                           'Weiter'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            )}
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
      </Paper>
    </Box>
  )
}