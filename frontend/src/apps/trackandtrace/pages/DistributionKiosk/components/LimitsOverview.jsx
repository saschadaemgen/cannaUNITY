// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/LimitsOverview.jsx

export default function LimitsOverview({ memberLimits, currentSelectionWeight }) {
  if (!memberLimits) return null

  const dailyLimit = memberLimits?.limits?.daily_limit || 25
  const monthlyLimit = memberLimits?.limits?.monthly_limit || 50
  const dailyConsumed = memberLimits?.consumption?.daily?.consumed || 0
  const monthlyConsumed = memberLimits?.consumption?.monthly?.consumed || 0

  // Calculate percentages including current selection
  const dailyUsed = dailyConsumed + currentSelectionWeight
  const monthlyUsed = monthlyConsumed + currentSelectionWeight
  const dailyPercentage = Math.min(100, (dailyUsed / dailyLimit) * 100)
  const monthlyPercentage = Math.min(100, (monthlyUsed / monthlyLimit) * 100)

  // Determine warning levels
  const getDailyLevel = () => {
    if (dailyPercentage >= 90) return 'critical'
    if (dailyPercentage >= 75) return 'warning'
    return 'normal'
  }

  const getMonthlyLevel = () => {
    if (monthlyPercentage >= 90) return 'critical'
    if (monthlyPercentage >= 75) return 'warning'
    return 'normal'
  }

  return (
    <div className="limits-overview">
      <h4 className="limits-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        Limits & Verbrauch
      </h4>
      
      {/* Daily Limit */}
      <div className="limit-progress">
        <div className="limit-label">
          <span className="limit-name">Tageslimit</span>
          <span className="limit-value">
            {dailyUsed.toFixed(1)}g / {dailyLimit}g
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getDailyLevel()}`}
            style={{ width: `${dailyPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Monthly Limit */}
      <div className="limit-progress">
        <div className="limit-label">
          <span className="limit-name">Monatslimit</span>
          <span className="limit-value">
            {monthlyUsed.toFixed(1)}g / {monthlyLimit}g
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getMonthlyLevel()}`}
            style={{ width: `${monthlyPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}