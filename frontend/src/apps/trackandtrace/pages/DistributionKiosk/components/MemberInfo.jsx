// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/MemberInfo.jsx

export default function MemberInfo({ member, limits }) {
  if (!member || !limits) return null

  const dailyPercentage = limits.consumption?.daily?.percentage || 0
  const monthlyPercentage = limits.consumption?.monthly?.percentage || 0
  const isU21 = limits.member?.age_class === '18+'
  const thcLimit = isU21 ? 10 : null

  // Determine warning levels for visual alerts
  const getDailyWarningLevel = () => {
    if (dailyPercentage >= 90) return 'critical'
    if (dailyPercentage >= 75) return 'warning'
    return 'normal'
  }

  const getMonthlyWarningLevel = () => {
    if (monthlyPercentage >= 90) return 'critical'
    if (monthlyPercentage >= 75) return 'warning'
    return 'normal'
  }

  return (
    <div className="card member-info">
      <div className="member-header">
        <div className="member-avatar">👤</div>
        <div className="member-details">
          <h2 className="member-name">
            {member.first_name} {member.last_name}
          </h2>
          <div className="member-meta">
            <span className="member-email">{member.email}</span>
            {isU21 && (
              <span className="age-badge u21-badge">U21</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="limits-container">
        <h3 className="limits-title">📊 Verfügbare Limits</h3>
        
        <div className="limits-grid">
          {/* Daily Limit */}
          <div className={`limit-card ${getDailyWarningLevel()}`}>
            <div className="limit-header">
              <div className="limit-icon">📅</div>
              <div className="limit-info">
                <span className="limit-label">Tageslimit</span>
                <span className="limit-values">
                  {limits.consumption.daily.consumed.toFixed(1)}g / {limits.limits.daily_limit}g
                </span>
              </div>
            </div>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getDailyWarningLevel()}`}
                  style={{ width: `${Math.min(100, dailyPercentage)}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {dailyPercentage.toFixed(1)}% verbraucht
              </div>
            </div>
            
            <div className="remaining-info">
              <span className="remaining-label">Noch verfügbar:</span>
              <span className={`remaining-value ${getDailyWarningLevel()}`}>
                {Math.max(0, limits.consumption.daily.remaining).toFixed(1)}g
              </span>
            </div>
          </div>
          
          {/* Monthly Limit */}
          <div className={`limit-card ${getMonthlyWarningLevel()}`}>
            <div className="limit-header">
              <div className="limit-icon">📆</div>
              <div className="limit-info">
                <span className="limit-label">Monatslimit</span>
                <span className="limit-values">
                  {limits.consumption.monthly.consumed.toFixed(1)}g / {limits.limits.monthly_limit}g
                </span>
              </div>
            </div>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getMonthlyWarningLevel()}`}
                  style={{ width: `${Math.min(100, monthlyPercentage)}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {monthlyPercentage.toFixed(1)}% verbraucht
              </div>
            </div>
            
            <div className="remaining-info">
              <span className="remaining-label">Noch verfügbar:</span>
              <span className={`remaining-value ${getMonthlyWarningLevel()}`}>
                {Math.max(0, limits.consumption.monthly.remaining).toFixed(1)}g
              </span>
            </div>
          </div>
          
          {/* THC Limit for U21 */}
          {isU21 && (
            <div className="limit-card thc-limit">
              <div className="limit-header">
                <div className="limit-icon">⚠️</div>
                <div className="limit-info">
                  <span className="limit-label">THC-Limit (U21)</span>
                  <span className="limit-values">
                    Max. {thcLimit}% THC
                  </span>
                </div>
              </div>
              
              <div className="thc-restriction-info">
                <div className="restriction-badge">
                  🚫 Nur Produkte ≤ {thcLimit}% THC verfügbar
                </div>
                <p className="restriction-text">
                  Aufgrund Ihres Alters sind nur niedrig-dosierte Produkte verfügbar.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* General Warnings */}
        {(dailyPercentage >= 75 || monthlyPercentage >= 75) && (
          <div className="limit-warnings">
            {dailyPercentage >= 90 && (
              <div className="warning-alert critical">
                🚨 <strong>Tageslimit fast erreicht!</strong> 
                Nur noch {Math.max(0, limits.consumption.daily.remaining).toFixed(1)}g verfügbar.
              </div>
            )}
            {monthlyPercentage >= 90 && (
              <div className="warning-alert critical">
                🚨 <strong>Monatslimit fast erreicht!</strong> 
                Nur noch {Math.max(0, limits.consumption.monthly.remaining).toFixed(1)}g verfügbar.
              </div>
            )}
            {dailyPercentage >= 75 && dailyPercentage < 90 && (
              <div className="warning-alert warning">
                ⚠️ Tageslimit zu 75% erreicht. Noch {Math.max(0, limits.consumption.daily.remaining).toFixed(1)}g verfügbar.
              </div>
            )}
            {monthlyPercentage >= 75 && monthlyPercentage < 90 && (
              <div className="warning-alert warning">
                ⚠️ Monatslimit zu 75% erreicht. Noch {Math.max(0, limits.consumption.monthly.remaining).toFixed(1)}g verfügbar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}