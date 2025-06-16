// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ThemeToggle.jsx

export default function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button 
      className="theme-toggle"
      onClick={onToggle}
      title={darkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
    >
      {darkMode ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}