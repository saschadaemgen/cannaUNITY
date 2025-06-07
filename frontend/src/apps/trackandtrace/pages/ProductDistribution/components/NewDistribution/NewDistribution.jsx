// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/NewDistribution.jsx
import { useState } from 'react'
import { 
  Box, Paper, Stepper, Step, StepLabel, Button, Typography,
  Alert, Snackbar, Grid, Divider, Fade
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

// Workflow-Komponenten
import RecipientSelection from './RecipientSelection'
import ProductSelection from './ProductSelection'
import ReviewAndConfirm from './ReviewAndConfirm'
import RfidAuthorization from './RfidAuthorization'

const steps = [
  'Empfänger auswählen',
  'Produkte auswählen', 
  'Überprüfen & Bestätigen',
  'RFID-Autorisierung'
]

export default function NewDistribution({ members, rooms, availableUnits, onSuccess }) {
  // Workflow-States
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState({})
  
  // Formular-States
  const [recipientId, setRecipientId] = useState('')
  const [selectedUnits, setSelectedUnits] = useState([])
  const [notes, setNotes] = useState('')
  
  // UI-States
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Step-Validierung
  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return recipientId !== ''
      case 1:
        return selectedUnits.length > 0
      case 2:
        return true // Review ist immer gültig wenn vorherige Schritte abgeschlossen sind
      case 3:
        return true // RFID wird in der Komponente selbst validiert
      default:
        return false
    }
  }
  
  // Step Navigation
  const handleNext = () => {
    if (isStepValid(activeStep)) {
      const newCompleted = completed
      newCompleted[activeStep] = true
      setCompleted(newCompleted)
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }
  
  const handleStep = (step) => () => {
    // Nur zu bereits abgeschlossenen oder dem aktuellen Schritt navigieren
    if (step <= activeStep) {
      setActiveStep(step)
    }
  }
  
  // Reset Workflow
  const handleReset = () => {
    setActiveStep(0)
    setCompleted({})
    setRecipientId('')
    setSelectedUnits([])
    setNotes('')
    setError(null)
  }
  
  // Erfolgreiche Ausgabe
  const handleDistributionComplete = () => {
    setSuccess(true)
    setTimeout(() => {
      handleReset()
      onSuccess && onSuccess()
    }, 2000)
  }
  
  // Berechne Zusammenfassung
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  const productSummary = selectedUnits.reduce((acc, unit) => {
    const batch = unit.batch || {}
    const productType = batch.product_type || 'unknown'
    const displayType = batch.product_type_display || productType
    
    if (!acc[productType]) {
      acc[productType] = {
        displayType,
        count: 0,
        weight: 0
      }
    }
    
    acc[productType].count += 1
    acc[productType].weight += parseFloat(unit.weight || 0)
    
    return acc
  }, {})
  
  // Render Step Content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <RecipientSelection
            members={members}
            recipientId={recipientId}
            setRecipientId={setRecipientId}
          />
        )
      case 1:
        return (
          <ProductSelection
            availableUnits={availableUnits}
            selectedUnits={selectedUnits}
            setSelectedUnits={setSelectedUnits}
          />
        )
      case 2:
        return (
          <ReviewAndConfirm
            recipient={members.find(m => m.id === recipientId)}
            selectedUnits={selectedUnits}
            totalWeight={totalWeight}
            productSummary={productSummary}
            notes={notes}
            setNotes={setNotes}
          />
        )
      case 3:
        return (
          <RfidAuthorization
            recipientId={recipientId}
            selectedUnits={selectedUnits}
            notes={notes}
            onComplete={handleDistributionComplete}
            onError={setError}
          />
        )
      default:
        return 'Unbekannter Schritt'
    }
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Workflow-Indikator */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => {
            const stepProps = {}
            const labelProps = {}
            
            if (completed[index]) {
              stepProps.completed = true
            }
            
            return (
              <Step key={label} {...stepProps}>
                <StepLabel 
                  {...labelProps}
                  onClick={handleStep(index)}
                  sx={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
                >
                  {label}
                </StepLabel>
              </Step>
            )
          })}
        </Stepper>
      </Paper>
      
      {/* Fehleranzeige */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Step Content */}
      <Fade in key={activeStep} timeout={300}>
        <Paper sx={{ p: 4, minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Paper>
      </Fade>
      
      {/* Navigation Buttons */}
      {activeStep < steps.length - 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<NavigateBeforeIcon />}
          >
            Zurück
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid(activeStep)}
            endIcon={<NavigateNextIcon />}
          >
            {activeStep === steps.length - 2 ? 'Zur Autorisierung' : 'Weiter'}
          </Button>
        </Box>
      )}
      
      {/* Success Snackbar */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          icon={<CheckCircleIcon fontSize="inherit" />}
        >
          Produktausgabe erfolgreich abgeschlossen!
        </Alert>
      </Snackbar>
    </Box>
  )
}