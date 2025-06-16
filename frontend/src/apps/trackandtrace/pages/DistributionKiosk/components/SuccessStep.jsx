// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/SuccessStep.jsx

export default function SuccessStep({ selectedMember, selectedUnits, totalWeight }) {
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
        <strong>{totalWeight.toFixed(2)}g Cannabis</strong> wurden erfolgreich an{' '}
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