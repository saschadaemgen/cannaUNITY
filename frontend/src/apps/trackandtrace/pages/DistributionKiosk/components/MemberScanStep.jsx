// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/MemberScanStep.jsx

import { useState } from 'react'
import api from '@/utils/api'

export default function MemberScanStep({ onSuccess, onError }) {
  const [scanning, setScanning] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    onError('')
    
    try {
      // 1. RFID Scan
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_name } = bindRes.data
      
      if (!token || !unifi_name) {
        throw new Error('RFID-Scan fehlgeschlagen')
      }

      // 2. Member Verification
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name })
      const { member_id } = verifyRes.data
      
      if (!member_id) {
        throw new Error('Mitglied konnte nicht verifiziert werden')
      }

      // 3. Load Member Limits
      const limitsRes = await api.get(
        `/trackandtrace/distributions/member_consumption_summary/?member_id=${member_id}`
      )
      
      const member = { id: member_id, name: unifi_name }
      
      onSuccess(member, limitsRes.data)
      
    } catch (err) {
      console.error('RFID Scan Error:', err)
      onError(err.response?.data?.detail || err.message || 'Fehler beim Scannen des Mitgliedsausweises')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="step-container">
      <div className="scan-step">
        <div className="scan-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="9" cy="10" r="2"/>
            <path d="m15 8 2 2-2 2"/>
          </svg>
        </div>
        
        <h1 className="scan-title">Mitgliedsausweis scannen</h1>
        <p className="scan-subtitle">Halten Sie den Ausweis an das Lesegerät</p>
        
        {!scanning ? (
          <button 
            className="btn btn-primary btn-large"
            onClick={handleScan}
          >
            Scan starten
          </button>
        ) : (
          <div className="scanning-state">
            <div className="spinner"></div>
            <p>Scanvorgang läuft...</p>
          </div>
        )}
      </div>
    </div>
  )
}