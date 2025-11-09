// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ReviewStep.jsx

import { useState } from 'react'
import api from '@/utils/api'
import StepIndicator from './StepIndicator'

const STEPS = [
  'Mitglied scannen',
  'Produkte wählen', 
  'Bestätigen & Autorisieren'
]

export default function ReviewStep({ 
  selectedMember, 
  selectedUnits, 
  totalWeight, 
  notes, 
  setNotes,
  onBack,
  onSuccess,
  onError 
}) {
  const [processing, setProcessing] = useState(false)
  const [authStep, setAuthStep] = useState('review') // 'review', 'scanning', 'processing'
  const [authorizedBy, setAuthorizedBy] = useState('')

  // 🆕 PREISBERECHNUNG
  const totalPrice = selectedUnits.reduce((sum, unit) => sum + (unit.unit_price || 0), 0)
  const currentBalance = selectedMember?.kontostand || 0
  const newBalance = currentBalance - totalPrice

  const handleConfirmAndAuthorize = async () => {
    setAuthStep('scanning')
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
      setAuthStep('processing')

      // 3. Submit Distribution mit Preis
      const distributionRes = await api.post('/trackandtrace/distributions/', {
        distributor_id,
        recipient_id: selectedMember.id,
        packaging_unit_ids: selectedUnits.map(unit => unit.id),
        notes,
        distribution_date: new Date().toISOString(),
        total_price: totalPrice
      })
      
      const distributionId = distributionRes.data.id
      
      // 🔧 4. KORRIGIERTE URL für Kontostand-Update
      await api.post(`/members/${selectedMember.id}/balance/update/`, {
        amount: totalPrice,
        transaction_type: 'distribution',
        distribution_id: distributionId,
        notes: `Cannabis-Ausgabe: ${selectedUnits.length} Produkte, ${totalWeight.toFixed(1)}g`
      })
      
      // Success mit neuem Kontostand
      setTimeout(() => {
        onSuccess({ 
          newBalance: currentBalance - totalPrice,
          totalPrice: totalPrice 
        })
      }, 1500)
      
    } catch (err) {
      console.error('Authorization Error:', err)
      onError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Fehler bei der Autorisierung')
      setAuthStep('review')
      setAuthorizedBy('')
    }
  }

  if (authStep === 'scanning') {
    return (
      <div className="scan-animation-step">
        <div className="card-animation-container">
          <div className="animated-card"></div>
          <div className="card-waves"></div>
        </div>
        
        <h1 className="scan-animation-title">Mitarbeiter-Autorisierung erforderlich</h1>
        <p className="scan-animation-subtitle">
          Ein autorisierter Mitarbeiter muss seinen RFID-Ausweis an das Lesegerät halten, 
          um die Cannabis-Ausgabe freizugeben
        </p>
        
        <div className="scanning-dots">
          <div className="scanning-dot"></div>
          <div className="scanning-dot"></div>
          <div className="scanning-dot"></div>
        </div>
        
        <div className="scanning-text">
          Warte auf Mitarbeiter-Autorisierung...
        </div>
      </div>
    )
  }

  if (authStep === 'processing') {
    return (
      <div className="scan-animation-step">
        <div className="card-animation-container">
          <div className="animated-card"></div>
        </div>
        
        <h1 className="scan-animation-title" style={{ color: 'var(--success-700)' }}>
          ✅ Autorisierung erfolgreich
        </h1>
        <p className="scan-animation-subtitle">
          <strong>Autorisiert von:</strong> {authorizedBy}
        </p>
        
        <div className="scan-status">
          <div className="scan-success-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 12 2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Mitarbeiter erfolgreich autorisiert
          </div>
        </div>
        
        <div className="scanning-text">
          Cannabis-Ausgabe wird dokumentiert und abgeschlossen...
        </div>
      </div>
    )
  }

  // Review State
  return (
    <div className="main-layout">
      {/* Step Indicator */}
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
        padding: '16px 24px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px var(--shadow-medium)',
        border: '1px solid var(--border-light)',
        backdropFilter: 'blur(10px)'
      }}>
        <StepIndicator 
          steps={STEPS}
          currentStep={2}
          isCompleted={false}
        />
      </div>

      {/* Review Content */}
      <div className="main-content" style={{ paddingTop: '100px' }}>
        <div style={{ padding: '40px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 300, 
              marginBottom: '16px',
              color: 'var(--text-primary)',
              background: 'linear-gradient(135deg, var(--primary-600), var(--success-600))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Cannabis-Ausgabe bestätigen
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Bitte überprüfen Sie alle Details der Cannabis-Ausgabe sorgfältig, 
              bevor Sie den Vorgang durch einen autorisierten Mitarbeiter freigeben lassen.
            </p>
          </div>
          
          {/* Enhanced Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px', 
            marginBottom: '40px' 
          }}>
            {/* Member Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 48px var(--shadow-medium)',
              border: '1px solid var(--border-light)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--primary-500), var(--success-500))'
              }}></div>
              
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '20px',
                fontSize: '1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Empfänger
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(74, 147, 74, 0.3)'
                }}>
                  {selectedMember?.first_name?.[0]}{selectedMember?.last_name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: 'var(--text-primary)',
                    fontSize: '1.125rem',
                    marginBottom: '4px'
                  }}>
                    {selectedMember?.first_name} {selectedMember?.last_name}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    Mitglieds-ID: {selectedMember?.id}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weight Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--success-50), var(--success-100))',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 48px var(--shadow-medium)',
              border: '1px solid var(--success-200)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--success-500), var(--primary-500))'
              }}></div>
              
              <h3 style={{ 
                color: 'var(--success-700)', 
                marginBottom: '20px',
                fontSize: '1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27a2 2 0 0 0 1-1.73z"/>
                </svg>
                Gesamtgewicht
              </h3>
              
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 800, 
                color: 'var(--success-700)',
                marginBottom: '12px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {totalWeight.toFixed(2)}g
              </div>
              <div style={{ 
                color: 'var(--success-600)', 
                fontSize: '1rem',
                fontWeight: 600
              }}>
                {selectedUnits.length} Cannabis-Produkte
              </div>
            </div>
            
            {/* Product Types Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 48px var(--shadow-medium)',
              border: '1px solid var(--border-light)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--warning-500), var(--primary-500))'
              }}></div>
              
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '20px',
                fontSize: '1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                Produktkategorien
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--success-50)',
                    borderRadius: '12px',
                    border: '1px solid var(--success-200)'
                  }}>
                    <span style={{ 
                      color: 'var(--success-700)', 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🌿 Marihuana
                    </span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: 'var(--success-700)',
                      fontSize: '1.125rem'
                    }}>
                      {selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length}
                    </span>
                  </div>
                )}
                
                {selectedUnits.filter(u => u.batch?.product_type === 'hashish').length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--warning-50)',
                    borderRadius: '12px',
                    border: '1px solid var(--warning-200)'
                  }}>
                    <span style={{ 
                      color: 'var(--warning-700)', 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🟫 Haschisch
                    </span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: 'var(--warning-700)',
                      fontSize: '1.125rem'
                    }}>
                      {selectedUnits.filter(u => u.batch?.product_type === 'hashish').length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 🆕 PREIS-CARD */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 12px 48px var(--shadow-medium)',
              border: '1px solid var(--primary-200)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--primary-500), var(--secondary-500))'
              }}></div>
              
              <h3 style={{ 
                color: 'var(--primary-700)', 
                marginBottom: '20px',
                fontSize: '1.25rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path d="M9 12h6M12 9v6"/>
                </svg>
                Kostenübersicht
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>Aktuelles Guthaben:</span>
                  <span style={{ fontWeight: 600 }}>{currentBalance.toFixed(2)} €</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--primary-700)',
                  padding: '12px 0',
                  borderTop: '1px solid var(--primary-200)',
                  borderBottom: '1px solid var(--primary-200)'
                }}>
                  <span>Gesamtpreis:</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: newBalance >= 0 ? 'var(--success-600)' : 'var(--error-600)',
                  fontWeight: 600
                }}>
                  <span>Neues Guthaben:</span>
                  <span>{newBalance.toFixed(2)} €</span>
                </div>
                
                {newBalance < 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'var(--error-50)',
                    border: '1px solid var(--error-200)',
                    borderRadius: '8px',
                    color: 'var(--error-700)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    ⚠️ Achtung: Unzureichendes Guthaben!
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Products Table mit Preisen */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 12px 48px var(--shadow-medium)',
            border: '1px solid var(--border-light)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--primary-500), var(--success-500), var(--warning-500))'
            }}></div>
            
            <h3 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '24px',
              fontSize: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              Ausgewählte Cannabis-Produkte
            </h3>
            
            <div style={{ 
              overflow: 'auto',
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Batch-Nummer</th>
                    <th>Sorte/Genetik</th>
                    <th>Produktkategorie</th>
                    <th>Gewicht</th>
                    <th>THC-Potenz</th>
                    <th>Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUnits.map((unit, index) => {
                    const batch = unit.batch || {}
                    const isMarijuana = batch.product_type === 'marijuana'
                    
                    return (
                      <tr key={unit.id} style={{
                        background: index % 2 === 0 ? 'var(--bg-paper)' : 'var(--bg-secondary)'
                      }}>
                        <td className="batch-cell" style={{
                          fontFamily: '"Roboto Mono", monospace',
                          fontWeight: 700,
                          color: 'var(--primary-600)'
                        }}>
                          {unit.batch_number}
                        </td>
                        <td className="strain-cell" style={{
                          fontStyle: 'italic',
                          color: 'var(--text-secondary)'
                        }}>
                          {batch.source_strain || 'Unbekannt'}
                        </td>
                        <td>
                          <span className={`type-badge ${isMarijuana ? 'marijuana' : 'hashish'}`} style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isMarijuana 
                              ? 'linear-gradient(135deg, var(--success-50), var(--success-100))' 
                              : 'linear-gradient(135deg, var(--warning-50), var(--warning-100))',
                            color: isMarijuana ? 'var(--success-700)' : 'var(--warning-700)',
                            border: `1px solid ${isMarijuana ? 'var(--success-200)' : 'var(--warning-200)'}`
                          }}>
                            {isMarijuana ? '🌿' : '🟫'} {batch.product_type_display || 'Unbekannt'}
                          </span>
                        </td>
                        <td className="weight-cell" style={{
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                          fontSize: '1rem'
                        }}>
                          {parseFloat(unit.weight).toFixed(2)}g
                        </td>
                        <td className="thc-cell" style={{
                          fontWeight: 600,
                          color: parseFloat(batch.thc_content) > 20 
                            ? 'var(--error-600)' 
                            : parseFloat(batch.thc_content) > 15 
                              ? 'var(--warning-600)' 
                              : 'var(--success-600)'
                        }}>
                          {batch.thc_content || 'k.A.'}%
                        </td>
                        <td className="price-cell" style={{
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                          fontSize: '1rem'
                        }}>
                          {unit.unit_price ? `${unit.unit_price.toFixed(2)} €` : 'k.A.'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Enhanced Notes Section */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 12px 48px var(--shadow-medium)',
            border: '1px solid var(--border-light)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--primary-500), var(--secondary-500))'
            }}></div>
            
            <h3 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '20px',
              fontSize: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Bemerkungen zur Cannabis-Ausgabe
            </h3>
            
            <textarea
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '20px',
                border: '2px solid var(--border-medium)',
                borderRadius: '12px',
                background: 'var(--bg-paper)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px var(--shadow-light)'
              }}
              placeholder="Optional: Fügen Sie hier spezielle Hinweise, Bemerkungen oder besondere Umstände zur Cannabis-Ausgabe hinzu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-500)'
                e.target.style.boxShadow = '0 0 0 4px rgba(74, 147, 74, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)'
                e.target.style.boxShadow = '0 4px 16px var(--shadow-light)'
              }}
            />
          </div>
        </div>
        
        {/* Enhanced Action Bar */}
        <div className="action-bar" style={{
          background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
          borderTop: '2px solid var(--primary-500)',
          boxShadow: '0 -8px 32px var(--shadow-medium)'
        }}>
          <div className="action-info">
            <div className="action-stat" style={{
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              border: '1px solid var(--primary-200)'
            }}>
              <div className="action-stat-value" style={{ color: 'var(--primary-600)' }}>
                {selectedUnits.length}
              </div>
              <div className="action-stat-label">📦 Produkte</div>
            </div>
            
            <div className="action-stat" style={{
              background: 'linear-gradient(135deg, var(--success-50), var(--success-100))',
              border: '1px solid var(--success-200)'
            }}>
              <div className="action-stat-value" style={{ color: 'var(--success-600)' }}>
                {totalWeight.toFixed(1)}g
              </div>
              <div className="action-stat-label">⚖️ Gesamtgewicht</div>
            </div>
            
            {/* 🆕 PREIS-STAT */}
            <div className="action-stat" style={{
              background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
              border: '1px solid var(--primary-200)'
            }}>
              <div className="action-stat-value" style={{ color: 'var(--primary-600)' }}>
                {totalPrice.toFixed(2)}€
              </div>
              <div className="action-stat-label">💰 Gesamtpreis</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn btn-secondary btn-lg"
              onClick={onBack}
              disabled={processing}
              style={{
                background: 'linear-gradient(135deg, var(--grey-200), var(--grey-300))',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-medium)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Zurück zur Produktauswahl
            </button>
            
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleConfirmAndAuthorize}
              disabled={processing}
              style={{
                background: 'linear-gradient(135deg, var(--success-500), var(--success-700))',
                boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
                fontSize: '1.125rem',
                fontWeight: 700,
                padding: '18px 36px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Cannabis-Ausgabe autorisieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}