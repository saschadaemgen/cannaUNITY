// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/AuthorizationStep.jsx

import { useState, useEffect } from 'react'
import api from '@/utils/api'

export default function AuthorizationStep({ 
  selectedMember, 
  selectedUnits, 
  notes, 
  onSuccess, 
  onError 
}) {
  const [scanning, setScanning] = useState(false)
  const [authorizedBy, setAuthorizedBy] = useState('')
  const [processing, setProcessing] = useState(false)

  // Auto-start scan when component mounts
  useEffect(() => {
    handleAuthorizationScan()
  }, [])

  const handleAuthorizationScan = async () => {
    setScanning(true)
    onError('')
    
    try {
      // 1. RFID Scan for Authorization
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_name } = bindRes.data
      
      if (!token || !unifi_name) {
        throw new Error('RFID-Autorisierung fehlgeschlagen')
      }

      // 2. Verify Distributor
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name })
      const { member_id: distributor_id } = verifyRes.data
      
      if (!distributor_id) {
        throw new Error('Mitarbeiter konnte nicht verifiziert werden')
      }

      setAuthorizedBy(unifi_name)
      setScanning(false)
      setProcessing(true)

      // 3. Submit Distribution
      await api.post('/trackandtrace/distributions/', {
        distributor_id,
        recipient_id: selectedMember.id,
        packaging_unit_ids: selectedUnits.map(unit => unit.id),
        notes,
        distribution_date: new Date().toISOString()
      })
      
      // Small delay to show processing state
      setTimeout(() => {
        onSuccess()
      }, 1000)
      
    } catch (err) {
      console.error('Authorization Error:', err)
      onError(err.response?.data?.detail || err.message || 'Fehler bei der Autorisierung')
      setScanning(false)
      setProcessing(false)
    }
  }

  const renderScanningState = () => (
    <div className="authorization-state">
      <div className="auth-icon scanning">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2>Mitarbeiter-Autorisierung</h2>
      <p>Halten Sie Ihren Mitarbeiterausweis an das Lesegerät</p>
      <div className="spinner"></div>
      <small>Scanvorgang läuft...</small>
    </div>
  )

  const renderProcessingState = () => (
    <div className="authorization-state">
      <div className="auth-icon processing">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <h2>Autorisierung erfolgreich</h2>
      <p className="authorized-by">Autorisiert von: <strong>{authorizedBy}</strong></p>
      <div className="spinner"></div>
      <small>Ausgabe wird dokumentiert...</small>
    </div>
  )

  return (
    <div className="step-container">
      <div className="authorization-container">
        {scanning && renderScanningState()}
        {processing && renderProcessingState()}
      </div>
    </div>
  )
}