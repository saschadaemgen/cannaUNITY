// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/SuccessStep.jsx

export default function SuccessStep({ 
  selectedMember, 
  selectedUnits, 
  totalWeight,
  totalPrice,
  newBalance 
}) {
  const currentTime = new Date()
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length

  return (
    <div className="success-step">
      <div className="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      
      <h1 className="success-title">Ausgabe erfolgreich!</h1>
      
      <p className="success-summary">
        <strong>{totalWeight.toFixed(2)}g Cannabis</strong> im Wert von{' '}
        <strong style={{ color: 'var(--primary-600)' }}>{totalPrice?.toFixed(2) || '0.00'} €</strong> wurden erfolgreich an{' '}
        <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong> ausgegeben.
      </p>
      
      <div className="success-details">
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          marginBottom: '24px',
          color: 'var(--text-primary)'
        }}>
          📋 Ausgabe-Details
        </h3>
        
        <div className="success-info">
          <div className="success-info-item">
            <span className="success-info-label">👤 Empfänger:</span>
            <span className="success-info-value">
              {selectedMember?.first_name} {selectedMember?.last_name}
            </span>
          </div>
          
          <div className="success-info-item">
            <span className="success-info-label">🆔 Mitglieds-ID:</span>
            <span className="success-info-value">{selectedMember?.id}</span>
          </div>
          
          <div className="success-info-item">
            <span className="success-info-label">⚖️ Gesamtgewicht:</span>
            <span className="success-info-value">{totalWeight.toFixed(2)}g</span>
          </div>
          
          <div className="success-info-item">
            <span className="success-info-label">📦 Anzahl Produkte:</span>
            <span className="success-info-value">{selectedUnits.length}</span>
          </div>
          
          {marijuanaCount > 0 && (
            <div className="success-info-item">
              <span className="success-info-label">🌿 Marihuana:</span>
              <span className="success-info-value">{marijuanaCount} Einheiten</span>
            </div>
          )}
          
          {hashishCount > 0 && (
            <div className="success-info-item">
              <span className="success-info-label">🟫 Haschisch:</span>
              <span className="success-info-value">{hashishCount} Einheiten</span>
            </div>
          )}
          
          {/* 🆕 PREIS-INFORMATIONEN */}
          <div className="success-info-item" style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '16px',
            marginTop: '16px'
          }}>
            <span className="success-info-label">💰 Gesamtpreis:</span>
            <span className="success-info-value" style={{ 
              fontWeight: 700, 
              color: 'var(--primary-600)',
              fontSize: '1.125rem'
            }}>
              {totalPrice?.toFixed(2) || '0.00'} €
            </span>
          </div>
          
          <div className="success-info-item">
            <span className="success-info-label">💳 Neues Guthaben:</span>
            <span className="success-info-value" style={{ 
              fontWeight: 700,
              color: newBalance >= 0 ? 'var(--success-600)' : 'var(--error-600)',
              fontSize: '1.125rem'
            }}>
              {newBalance?.toFixed(2) || '0.00'} €
            </span>
          </div>
          
          {newBalance < 0 && (
            <div className="success-info-item" style={{
              background: 'var(--error-50)',
              border: '1px solid var(--error-200)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '12px'
            }}>
              <span style={{ 
                color: 'var(--error-700)',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Das Mitglied hat einen negativen Kontostand von {Math.abs(newBalance).toFixed(2)} €
              </span>
            </div>
          )}
          
          <div className="success-info-item">
            <span className="success-info-label">🕐 Zeitpunkt:</span>
            <span className="success-info-value">
              {currentTime.toLocaleString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
      
      <div className="auto-reset">
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-light)',
          borderTop: '3px solid var(--success-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0 8px' }}>
          System wird automatisch zurückgesetzt...
        </p>
        <small style={{ color: 'var(--text-disabled)' }}>
          In 5 Sekunden kehren Sie zur Startseite zurück
        </small>
      </div>
    </div>
  )
}