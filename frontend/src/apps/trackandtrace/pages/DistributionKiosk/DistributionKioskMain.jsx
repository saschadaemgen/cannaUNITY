// frontend/src/apps/trackandtrace/pages/DistributionKiosk/DistributionKioskMain.jsx

import { useState, useEffect } from 'react'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonIcon from '@mui/icons-material/Person'
import InventoryIcon from '@mui/icons-material/Inventory'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MemberScanStep from './components/MemberScanStep'
import ProductSelectionStep from './components/ProductSelectionStep'
import ReviewStep from './components/ReviewStep'
import SuccessStep from './components/SuccessStep'
import StepIndicator from './components/StepIndicator'
import ThemeToggle from './components/ThemeToggle'
import ErrorAlert from './components/ErrorAlert'
import './DistributionKiosk.css'

const STEPS = [
  'Mitglied scannen',
  'Produkte wählen', 
  'Bestätigen & Autorisieren'
]

// Material UI Icons für Child Components
export const MaterialIcons = {
  CreditCard: CreditCardIcon,
  CheckCircle: CheckCircleIcon,
  Info: InfoIcon,
  Description: DescriptionIcon,
  Person: PersonIcon,
  Inventory: InventoryIcon,
  VerifiedUser: VerifiedUserIcon,
  TouchApp: TouchAppIcon,
  HelpOutline: HelpOutlineIcon
}

export default function DistributionKioskMain() {
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('kiosk-theme')
    return saved ? JSON.parse(saved) : false
  })
  
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
  
  // Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('kiosk-theme', JSON.stringify(darkMode))
  }, [darkMode])
  
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

  // Handle successful review/authorization - directly process the distribution
  const handleReviewSuccess = () => {
    setIsCompleted(true)
  }

  const renderCurrentStep = () => {
    if (isCompleted) {
      return (
        <SuccessStep 
          selectedMember={selectedMember}
          selectedUnits={selectedUnits}
          totalWeight={totalWeight}
          icons={MaterialIcons}
        />
      )
    }

    switch (currentStep) {
      case 0:
        return (
          <MemberScanStep 
            onSuccess={handleMemberScanSuccess}
            onError={setError}
            icons={MaterialIcons}
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
            icons={MaterialIcons}
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
            onSuccess={handleReviewSuccess}
            onError={setError}
            icons={MaterialIcons}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="distribution-kiosk">
      {/* Theme Toggle */}
      <ThemeToggle 
        darkMode={darkMode}
        onToggle={() => setDarkMode(!darkMode)}
      />

      {/* Global Error Alert */}
      {error && (
        <div style={{ 
          position: 'fixed', 
          top: '24px', 
          right: '24px',
          zIndex: 1001,
          width: '400px',
          maxWidth: 'calc(100vw - 48px)'
        }}>
          <ErrorAlert 
            message={error}
            onClose={() => setError('')}
          />
        </div>
      )}

      {/* Step Indicator for Review Step */}
      {currentStep === 2 && !isCompleted && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'var(--bg-paper)',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px var(--shadow-medium)',
          border: '1px solid var(--border-light)'
        }}>
          <StepIndicator 
            steps={STEPS}
            currentStep={currentStep}
            isCompleted={isCompleted}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="kiosk-content">
        {renderCurrentStep()}
      </div>
    </div>
  )
}