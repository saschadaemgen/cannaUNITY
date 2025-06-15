// frontend/src/apps/trackandtrace/pages/DistributionKiosk/DistributionKioskMain.jsx

import { useState, useEffect } from 'react'
import MemberScanStep from './components/MemberScanStep'
import ProductSelectionStep from './components/ProductSelectionStep'
import ReviewStep from './components/ReviewStep'
import AuthorizationStep from './components/AuthorizationStep'
import SuccessStep from './components/SuccessStep'
import StepIndicator from './components/StepIndicator'
import ErrorAlert from './components/ErrorAlert'
import './DistributionKiosk.css'

const STEPS = [
  'Mitglied scannen',
  'Produkte wählen', 
  'Bestätigen',
  'Autorisierung'
]

export default function DistributionKioskMain() {
  // Workflow States
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Data States
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberLimits, setMemberLimits] = useState(null)
  const [selectedUnits, setSelectedUnits] = useState([])
  const [notes, setNotes] = useState('')
  
  // UI States
  const [error, setError] = useState('')
  
  // Reset function
  const resetWorkflow = () => {
    setCurrentStep(0)
    setIsCompleted(false)
    setSelectedMember(null)
    setMemberLimits(null)
    setSelectedUnits([])
    setNotes('')
    setError('')
  }

  // Auto-reset after completion
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        resetWorkflow()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted])

  // Calculate totals
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)

  // Handle successful member scan
  const handleMemberScanSuccess = (member, limits) => {
    setSelectedMember(member)
    setMemberLimits(limits)
    setCurrentStep(1)
  }

  // Handle successful authorization
  const handleAuthorizationSuccess = () => {
    setIsCompleted(true)
  }

  const renderCurrentStep = () => {
    if (isCompleted) {
      return (
        <SuccessStep 
          selectedMember={selectedMember}
          totalWeight={totalWeight}
        />
      )
    }

    switch (currentStep) {
      case 0:
        return (
          <MemberScanStep 
            onSuccess={handleMemberScanSuccess}
            onError={setError}
          />
        )
      case 1:
        return (
          <ProductSelectionStep
            selectedMember={selectedMember}
            memberLimits={memberLimits}
            selectedUnits={selectedUnits}
            setSelectedUnits={setSelectedUnits}
            onNext={() => setCurrentStep(2)}
            onReset={resetWorkflow}
            onError={setError}
          />
        )
      case 2:
        return (
          <ReviewStep
            selectedMember={selectedMember}
            selectedUnits={selectedUnits}
            totalWeight={totalWeight}
            notes={notes}
            setNotes={setNotes}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )
      case 3:
        return (
          <AuthorizationStep
            selectedMember={selectedMember}
            selectedUnits={selectedUnits}
            notes={notes}
            onSuccess={handleAuthorizationSuccess}
            onError={setError}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="distribution-kiosk">
      {/* Header */}
      <div className="kiosk-header">
        <h1 className="kiosk-title">Cannabis Produktausgabe</h1>
        <StepIndicator 
          steps={STEPS}
          currentStep={currentStep}
          isCompleted={isCompleted}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert 
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Main Content */}
      <div className="kiosk-content">
        {renderCurrentStep()}
      </div>
    </div>
  )
}