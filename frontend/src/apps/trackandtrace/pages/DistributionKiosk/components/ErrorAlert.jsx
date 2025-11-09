// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ErrorAlert.jsx

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null

  return (
    <div className="alert alert-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      
      <div style={{ flex: 1 }}>
        <strong>Fehler:</strong> {message}
      </div>
      
      <button className="alert-close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}