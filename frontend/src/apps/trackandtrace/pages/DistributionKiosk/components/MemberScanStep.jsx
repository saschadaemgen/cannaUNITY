// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/MemberScanStep.jsx

import { useState } from 'react'
import { useEffect } from 'react'
import api from '@/utils/api'

export default function MemberScanStep({ onSuccess, onError, icons }) {
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState('ready') // 'ready', 'scanning'
  
  // Dynamic Organization Title
  const [organizationTitle, setOrganizationTitle] = useState('cannaUNITY')
  const [titleLoading, setTitleLoading] = useState(true)

  // Load dynamic organization title
  useEffect(() => {
    const loadTitle = async () => {
      try {
        const response = await api.get('/options/title/')
        if (response.data?.title) {
          setOrganizationTitle(response.data.title)
        }
      } catch (error) {
        console.warn('Titel-Laden fehlgeschlagen:', error)
        // Fallback bleibt 'cannaUNITY'
      } finally {
        setTitleLoading(false)
      }
    }
    loadTitle()
  }, [])

  const handleScan = async () => {
    setScanStep('scanning')
    setScanning(true)
    onError('')
    
    try {
      // 1. Card Scan - Direkter API-Aufruf
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_name } = bindRes.data
      
      if (!token || !unifi_name) {
        throw new Error('Mitgliedsausweis konnte nicht gelesen werden')
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
      
      const member = { 
        id: member_id, 
        name: unifi_name,
        first_name: unifi_name.split(' ')[0] || unifi_name,
        last_name: unifi_name.split(' ').slice(1).join(' ') || '',
        email: `${unifi_name.toLowerCase().replace(/\s+/g, '.')}@example.com`
      }

      // Direkt zum nächsten Schritt ohne Bestätigungsanzeige
      onSuccess(member, limitsRes.data)
      
    } catch (err) {
      console.error('Card Scan Error:', err)
      onError(err.response?.data?.detail || err.message || 'Fehler beim Lesen des Mitgliedsausweises')
      setScanStep('ready')
    } finally {
      setScanning(false)
    }
  }

  // Fullscreen Scan Animation
  if (scanStep === 'scanning') {
    return (
      <div className="scan-animation-step">
        <div className="card-animation-container">
          <div className="animated-card"></div>
          <div className="card-waves"></div>
        </div>
        
        <h1 className="scan-animation-title">Kartenlesegerät ist bereit</h1>
        <p className="scan-animation-subtitle">
          Legen Sie jetzt Ihren Mitgliedsausweis auf das Kartenlesegerät. 
          Das System liest Ihren Ausweis automatisch ein.
        </p>
        
        <div className="scanning-dots">
          <div className="scanning-dot"></div>
          <div className="scanning-dot"></div>
          <div className="scanning-dot"></div>
        </div>
        
        <div className="scanning-text">
          Warte auf Mitgliedsausweis...
        </div>
      </div>
    )
  }

  // Initial Scan Screen with Enhanced Background Animation
  return (
    <div className="scan-step">
      {/* Enhanced Visible Background Animation */}
      <div className="background-animation">
        <div className="background-pulse-ring ring-1"></div>
        <div className="background-pulse-ring ring-2"></div>
        <div className="background-pulse-ring ring-3"></div>
        <div className="background-pulse-ring ring-4"></div>
      </div>

      {/* Help Button - Top Right */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 1000
      }}>
        <button style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'white',
          border: '2px solid var(--border-light)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'var(--primary-50)'
          e.target.style.borderColor = 'var(--primary-500)'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white'
          e.target.style.borderColor = 'var(--border-light)'
          e.target.style.transform = 'scale(1)'
        }}
        >
          {icons ? (
            <icons.HelpOutline style={{
              fontSize: '1.5rem',
              color: 'var(--primary-500)'
            }} />
          ) : (
            <span style={{
              fontSize: '1.5rem',
              color: 'var(--primary-500)',
              fontWeight: 600
            }}>?</span>
          )}
        </button>
      </div>

      {/* Enhanced Organization Header with Sophisticated Border */}
      <div style={{
        textAlign: 'center',
        marginBottom: '48px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '28px 64px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '950px',
          margin: '0 auto',
          whiteSpace: 'nowrap',
          position: 'relative',
          // Sophisticated double green border with 3D effect
          border: '2px solid var(--primary-300)',
          outline: '1px solid var(--primary-500)',
          outlineOffset: '2px'
        }}>
          {/* Inner shadow for depth */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '24px',
            boxShadow: 'inset 0 2px 4px rgba(74, 147, 74, 0.1)',
            pointerEvents: 'none'
          }}></div>
          
          {/* Subtle corner highlights */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '16px',
            height: '16px',
            background: 'var(--primary-100)',
            borderRadius: '50%',
            opacity: 0.6
          }}></div>
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '16px',
            height: '16px',
            background: 'var(--primary-100)',
            borderRadius: '50%',
            opacity: 0.6
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {titleLoading ? (
              <div style={{
                height: '2rem',
                background: 'var(--grey-200)',
                borderRadius: '8px',
                margin: '0 0 8px 0',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            ) : (
              <h1 style={{
                color: 'var(--primary-600)',
                fontSize: '2rem',
                fontWeight: 800,
                margin: '0 0 8px 0',
                letterSpacing: '-0.75px',
                lineHeight: 1.2,
                textShadow: '0 1px 2px rgba(74, 147, 74, 0.2)'
              }}>
                {organizationTitle}
              </h1>
            )}

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              margin: '0',
              textTransform: 'uppercase',
              letterSpacing: '3px'
            }}>
              Digitales Cannabis Produkt Ausgabesystem
            </p>
          </div>
        </div>
      </div>
      
      <h1 className="scan-title" style={{ 
        marginBottom: '16px',
        color: 'var(--text-primary)'
      }}>
        Produktausgabe-Terminal
      </h1>
      <p className="scan-subtitle" style={{ 
        marginBottom: '48px', 
        maxWidth: '600px', 
        margin: '0 auto 48px',
        color: 'var(--text-primary)'
      }}>
        Drücken Sie den Button unten, um das Kartenlesegerät zu aktivieren. 
        Anschließend legen Sie Ihren Mitgliedsausweis auf das Lesegerät.
      </p>
      
      {/* Compact Technical Button */}
      <button 
        onClick={handleScan}
        disabled={scanning}
        style={{
          background: scanning ? 'var(--grey-500)' : 'var(--error-500)',
          color: 'white',
          border: '3px solid var(--grey-900)',
          borderRadius: '10px',
          padding: '20px 32px',
          fontSize: '1.125rem',
          fontWeight: 800,
          cursor: scanning ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: scanning ? 'none' : '0 5px 0 var(--grey-900)',
          marginBottom: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          textDecoration: 'none',
          outline: 'none',
          minWidth: '380px',
          minHeight: '75px',
          position: 'relative',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onMouseEnter={(e) => {
          if (!scanning) {
            e.target.style.background = 'var(--error-600)'
          }
        }}
        onMouseLeave={(e) => {
          if (!scanning) {
            e.target.style.background = 'var(--error-500)'
          }
        }}
        onMouseDown={(e) => {
          if (!scanning) {
            e.target.style.transform = 'translateY(5px)'
            e.target.style.boxShadow = '0 0 0 var(--grey-900)'
          }
        }}
        onMouseUp={(e) => {
          if (!scanning) {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 5px 0 var(--grey-900)'
          }
        }}
      >
        <div style={{
          fontSize: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          {icons ? <icons.TouchApp style={{ fontSize: '2.25rem', color: 'white' }} /> : '👆'}
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 900, 
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            HIER DRÜCKEN
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            opacity: 0.9,
            lineHeight: 1,
            marginTop: '4px',
            letterSpacing: '1px'
          }}>
            KARTENLESER AKTIVIEREN
          </span>
        </div>
      </button>
      
      {/* Compact Step History */}
      <div className="step-history enhanced-width" style={{
        maxWidth: '1000px',
        padding: '24px 32px'
      }}>
        <h3 className="step-history-title" style={{ 
          marginBottom: '24px', 
          fontSize: '1.125rem' 
        }}>
          {icons ? <icons.CheckCircle style={{ marginRight: '8px', fontSize: '1.25rem' }} /> : <span style={{ marginRight: '8px' }}>✓</span>}
          Ausgabeprozess in 3 einfachen Schritten
        </h3>
        
        <div className="step-history-list enhanced-layout" style={{ gap: '24px' }}>
          <div className="step-history-item enhanced-item current" style={{ 
            minHeight: '140px', 
            padding: '20px 16px' 
          }}>
            <div className="step-history-number">1</div>
            <div className="step-history-label" style={{ 
              height: '32px', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {icons ? <icons.Person style={{ fontSize: '1.25rem' }} /> : '👤'} Mitglied identifizieren
            </div>
            <div className="step-history-description" style={{ 
              height: '48px', 
              fontSize: '0.8rem' 
            }}>
              Drücken Sie den Button zum Aktivieren, dann legen Sie Ihren 
              Mitgliedsausweis auf das Kartenlesegerät.
            </div>
          </div>
          
          <div className="step-history-item enhanced-item" style={{ 
            minHeight: '140px', 
            padding: '20px 16px' 
          }}>
            <div className="step-history-number">2</div>
            <div className="step-history-label" style={{ 
              height: '32px', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {icons ? <icons.Inventory style={{ fontSize: '1.25rem' }} /> : '🌿'} Produkte auswählen
            </div>
            <div className="step-history-description" style={{ 
              height: '48px', 
              fontSize: '0.8rem' 
            }}>
              Wählen Sie aus den verfügbaren Produkten nach Ihren 
              persönlichen Limits aus.
            </div>
          </div>
          
          <div className="step-history-item enhanced-item" style={{ 
            minHeight: '140px', 
            padding: '20px 16px' 
          }}>
            <div className="step-history-number">3</div>
            <div className="step-history-label" style={{ 
              height: '32px', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {icons ? <icons.VerifiedUser style={{ fontSize: '1.25rem' }} /> : '✅'} Ausgabe autorisieren
            </div>
            <div className="step-history-description" style={{ 
              height: '48px', 
              fontSize: '0.8rem' 
            }}>
              Ein autorisierter Mitarbeiter bestätigt Ihre Auswahl und 
              gibt die Produkte frei.
            </div>
          </div>
        </div>

        {/* Compact Additional Info Section */}
        <div className="additional-info" style={{ 
          paddingTop: '16px', 
          gap: '12px' 
        }}>
          <div className="info-item" style={{ padding: '12px' }}>
            {icons ? <icons.Info style={{ marginRight: '8px', fontSize: '1rem' }} /> : ''}
            <span>Ihre Limits werden automatisch berechnet</span>
          </div>
          <div className="info-item" style={{ padding: '12px' }}>
            {icons ? <icons.Description style={{ marginRight: '8px', fontSize: '1rem' }} /> : ''}
            <span>Alle Ausgaben werden sicher dokumentiert</span>
          </div>
        </div>
      </div>
    </div>
  )
}