// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/SelectedProductsSummary.jsx

export default function SelectedProductsSummary({ 
  selectedUnits, 
  onRemoveUnit, 
  totalWeight,
  memberLimits,
  dailyRemaining,
  monthlyRemaining 
}) {
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length
  
  const isU21 = memberLimits?.member?.age_class === '18+'
  const dailyLimit = memberLimits?.limits?.daily_limit || 25
  const monthlyLimit = memberLimits?.limits?.monthly_limit || 50
  
  // Calculate warning levels
  const getDailyWarningLevel = () => {
    if (dailyRemaining <= 0) return 'critical'
    if (dailyRemaining < 5) return 'warning'
    return 'normal'
  }
  
  const getMonthlyWarningLevel = () => {
    if (monthlyRemaining <= 0) return 'critical'
    if (monthlyRemaining < 10) return 'warning'
    return 'normal'
  }

  return (
    <div className="card selected-products">
      <div className="summary-header">
        <h3 className="summary-title">
          🛒 Warenkorb
          {selectedUnits.length > 0 && (
            <span className="item-count">({selectedUnits.length})</span>
          )}
        </h3>
        {selectedUnits.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={() => selectedUnits.forEach(unit => onRemoveUnit(unit.id))}
            title="Alle entfernen"
          >
            🗑️ Alle entfernen
          </button>
        )}
      </div>
      
      {/* Current Selection Stats */}
      <div className="selection-stats">
        <div className="stat-card primary">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <span className="stat-value">{totalWeight.toFixed(1)}g</span>
            <span className="stat-label">Ausgewählt</span>
          </div>
        </div>
        
        {marijuanaCount > 0 && (
          <div className="stat-card success">
            <div className="stat-icon">🌿</div>
            <div className="stat-info">
              <span className="stat-value">{marijuanaCount}</span>
              <span className="stat-label">Marihuana</span>
            </div>
          </div>
        )}
        
        {hashishCount > 0 && (
          <div className="stat-card warning">
            <div className="stat-icon">🟫</div>
            <div className="stat-info">
              <span className="stat-value">{hashishCount}</span>
              <span className="stat-label">Haschisch</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Remaining Limits Display */}
      {selectedUnits.length > 0 && (
        <div className="limits-status">
          <h4 className="limits-status-title">📊 Verbleibende Limits</h4>
          
          <div className="limits-status-grid">
            <div className={`limit-status-card ${getDailyWarningLevel()}`}>
              <div className="limit-status-header">
                <span className="limit-status-icon">📅</span>
                <span className="limit-status-label">Heute noch</span>
              </div>
              <div className="limit-status-value">
                <span className={`value ${getDailyWarningLevel()}`}>
                  {Math.max(0, dailyRemaining).toFixed(1)}g
                </span>
                <span className="limit-total">/ {dailyLimit}g</span>
              </div>
              {getDailyWarningLevel() === 'critical' && (
                <div className="limit-warning">
                  ⚠️ Tageslimit erreicht!
                </div>
              )}
            </div>
            
            <div className={`limit-status-card ${getMonthlyWarningLevel()}`}>
              <div className="limit-status-header">
                <span className="limit-status-icon">📆</span>
                <span className="limit-status-label">Monat noch</span>
              </div>
              <div className="limit-status-value">
                <span className={`value ${getMonthlyWarningLevel()}`}>
                  {Math.max(0, monthlyRemaining).toFixed(1)}g
                </span>
                <span className="limit-total">/ {monthlyLimit}g</span>
              </div>
              {getMonthlyWarningLevel() === 'critical' && (
                <div className="limit-warning">
                  ⚠️ Monatslimit erreicht!
                </div>
              )}
            </div>
          </div>
          
          {isU21 && (
            <div className="thc-limit-reminder">
              <span className="thc-icon">⚠️</span>
              <span className="thc-text">Alle Produkte ≤ 10% THC (U21-Beschränkung)</span>
            </div>
          )}
        </div>
      )}
      
      {/* Selected Items List */}
      <div className="selected-items">
        {selectedUnits.length === 0 ? (
          <div className="empty-selection">
            <div className="empty-icon">🛒</div>
            <p className="empty-title">Warenkorb ist leer</p>
            <p className="empty-subtitle">Wählen Sie Produkte aus der Tabelle links aus</p>
          </div>
        ) : (
          <div className="items-list">
            <div className="items-header">
              <span className="items-title">Ausgewählte Produkte:</span>
            </div>
            {selectedUnits.map((unit, index) => {
              const batch = unit.batch || {}
              const isMarijuana = batch.product_type === 'marijuana'
              const thcContent = batch.thc_content
              
              return (
                <div key={unit.id} className="selected-item">
                  <div className="item-number">{index + 1}</div>
                  <div className="item-info">
                    <div className="item-main">
                      <span className="item-batch">{unit.batch_number}</span>
                      <span className="item-weight">{parseFloat(unit.weight).toFixed(1)}g</span>
                    </div>
                    <div className="item-details">
                      <span className={`item-type-badge ${isMarijuana ? 'marijuana' : 'hashish'}`}>
                        {isMarijuana ? '🌿' : '🟫'} {batch.product_type_display}
                      </span>
                      {thcContent && (
                        <span className="item-thc">THC: {thcContent}%</span>
                      )}
                    </div>
                    <div className="item-strain">{batch.source_strain || 'Sorte unbekannt'}</div>
                  </div>
                  <button
                    className="remove-item-btn"
                    onClick={() => onRemoveUnit(unit.id)}
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Summary Footer */}
      {selectedUnits.length > 0 && (
        <div className="selection-footer">
          <div className="footer-stats">
            <div className="footer-stat">
              <strong>{selectedUnits.length}</strong> Produkte
            </div>
            <div className="footer-stat">
              <strong>{totalWeight.toFixed(1)}g</strong> Gesamt
            </div>
            {(getDailyWarningLevel() === 'critical' || getMonthlyWarningLevel() === 'critical') && (
              <div className="footer-warning">
                🚨 Limit erreicht!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}