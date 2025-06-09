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
  Backdrop
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
  const [showAbortDialog, setShowAbortDialog] = useState(false)

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

  const handleComplete = () => {
    setSuccess(true)
    setCompleted(true)
    setTimeout(() => {
      navigate('/trackandtrace/distributions')
    }, 2000)
  }

  const handleNext = () => {
    switch (activeStep) {
      case 0:
        if (!recipientId) {
          handleError('Bitte wählen Sie einen Empfänger aus')
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

  const handleReset = () => {
    setActiveStep(0)
    setRecipientId('')
    setSelectedUnits([])
    setNotes('')
    setMemberLimits(null)
    setSuccess(false)
    setCompleted(false)
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

  if (loadingMembers || loadingUnits) {
    return (
      <Backdrop open={true} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return (
    <Box sx={{
      py: 4,
      mx: 'auto',
      width: '100%',
      maxWidth: '1700px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <Paper elevation={3} sx={{ p: 5 }}>
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
            <Box sx={{ minHeight: 400, mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                color="secondary"
              >
                Zurück
              </Button>
              {(activeStep > 0 && activeStep < steps.length - 1) && (
                <Button
                  onClick={() => setShowAbortDialog(true)}
                  variant="outlined"
                  color="error"
                >
                  Abbrechen
                </Button>
              )}
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
    </Box>
  )
}
