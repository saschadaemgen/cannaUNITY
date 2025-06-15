// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ErrorAlert.jsx

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null

  return (
    <div className="error-alert">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{message}</div>
        <button className="error-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  )
}