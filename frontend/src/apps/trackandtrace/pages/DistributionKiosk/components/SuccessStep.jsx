// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/SuccessStep.jsx

export default function SuccessStep({ selectedMember, totalWeight }) {
  return (
    <div className="step-container">
      <div className="success-container">
        <div className="success-icon">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
        
        <h1 className="success-title">Ausgabe erfolgreich!</h1>
        
        <div className="success-details">
          <p className="success-summary">
            <strong>{totalWeight.toFixed(2)}g</strong> wurden an <strong>{selectedMember?.name}</strong> ausgegeben
          </p>
          
          <div className="success-info">
            <div className="info-item">
              <span className="info-label">Empfänger:</span>
              <span className="info-value">{selectedMember?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gesamtmenge:</span>
              <span className="info-value">{totalWeight.toFixed(2)}g</span>
            </div>
            <div className="info-item">
              <span className="info-label">Zeitpunkt:</span>
              <span className="info-value">{new Date().toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>
        
        <div className="auto-reset-info">
          <div className="countdown-spinner"></div>
          <p>System wird automatisch zurückgesetzt...</p>
        </div>
      </div>
    </div>
  )
}