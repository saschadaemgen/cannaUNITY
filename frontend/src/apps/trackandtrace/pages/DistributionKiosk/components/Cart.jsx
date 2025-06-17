// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/Cart.jsx

export default function Cart({ 
  selectedUnits, 
  onRemoveUnit, 
  onClearAll, 
  totalWeight,
  memberLimits,
  dailyRemaining,
  monthlyRemaining,
  onNext,
  onReset,
  canProceed
}) {
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length

  // Get limits data
  const dailyLimit = memberLimits?.limits?.daily_limit || 25
  const monthlyLimit = memberLimits?.limits?.monthly_limit || 50
  const dailyConsumed = memberLimits?.consumption?.daily?.consumed || 0
  const monthlyConsumed = memberLimits?.consumption?.monthly?.consumed || 0

  // Calculate percentages including current selection
  const dailyUsed = dailyConsumed + totalWeight
  const monthlyUsed = monthlyConsumed + totalWeight
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

  const styles = {
    cartSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    },
    limitsSection: {
      padding: '20px 24px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#f8f9fa'
    },
    limitsTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#2c3e50',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    limitProgress: {
      marginBottom: '16px'
    },
    limitLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
      fontSize: '12px'
    },
    limitName: {
      color: '#2c3e50',
      fontWeight: 500
    },
    limitValue: {
      color: '#6c757d',
      fontSize: '11px'
    },
    progressBar: {
      height: '6px',
      backgroundColor: '#e9ecef',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative'
    },
    progressFill: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 0.6s ease, background-color 0.3s ease',
      position: 'relative'
    },
    progressNormal: {
      backgroundColor: '#28a745'
    },
    progressWarning: {
      backgroundColor: '#ffc107'
    },
    progressCritical: {
      backgroundColor: '#dc3545'
    },
    cartHeader: {
      padding: '20px 24px 16px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#ffffff'
    },
    cartTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#2c3e50',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    cartCount: {
      backgroundColor: '#4a934a',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600
    },
    cartSummary: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    cartStat: {
      textAlign: 'center',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px'
    },
    cartStatValue: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#2c3e50',
      marginBottom: '4px'
    },
    cartStatLabel: {
      fontSize: '11px',
      color: '#6c757d',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    cartItems: {
      flex: 1,
      overflow: 'auto',
      padding: '16px 24px'
    },
    cartEmpty: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6c757d'
    },
    cartEmptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5
    },
    cartItem: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e0e0e0',
      position: 'relative'
    },
    cartItemRemove: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },
    cartItemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    cartItemBatch: {
      fontFamily: 'monospace',
      fontWeight: 600,
      color: '#2c3e50',
      fontSize: '13px'
    },
    cartItemWeight: {
      fontWeight: 600,
      color: '#4a934a',
      fontSize: '13px'
    },
    cartItemDetails: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    cartItemType: {
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500
    },
    cartItemTypeMarijuana: {
      backgroundColor: '#e8f5e8',
      color: '#28a745'
    },
    cartItemTypeHashish: {
      backgroundColor: '#fff3e0',
      color: '#ff9800'
    },
    cartItemThc: {
      fontSize: '11px',
      color: '#6c757d'
    },
    cartItemStrain: {
      fontSize: '11px',
      color: '#6c757d',
      fontStyle: 'italic'
    },
    cartActions: {
      padding: '16px 24px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#ffffff'
    },
    cartClear: {
      width: '100%',
      backgroundColor: '#fff5f5',
      color: '#dc3545',
      border: '1px solid #dc3545',
      padding: '10px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '16px'
    },
    actionButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px 24px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#f8f9fa'
    },
    resetButton: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.2s ease'
    },
    nextButton: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#4a934a',
      color: 'white',
      border: 'none',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.2s ease'
    },
    nextButtonDisabled: {
      backgroundColor: '#dee2e6',
      color: '#6c757d',
      cursor: 'not-allowed'
    }
  }

  return (
    <div style={styles.cartSection}>
      {/* Limits Overview */}
      {memberLimits && (
        <div style={styles.limitsSection}>
          <h4 style={styles.limitsTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Limits & Verbrauch
          </h4>
          
          {/* Daily Limit */}
          <div style={styles.limitProgress}>
            <div style={styles.limitLabel}>
              <span style={styles.limitName}>Tageslimit</span>
              <span style={styles.limitValue}>
                {dailyUsed.toFixed(1)}g / {dailyLimit}g
              </span>
            </div>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  ...(getDailyLevel() === 'critical' ? styles.progressCritical :
                      getDailyLevel() === 'warning' ? styles.progressWarning : styles.progressNormal),
                  width: `${dailyPercentage}%`
                }}
              />
            </div>
          </div>
          
          {/* Monthly Limit */}
          <div style={styles.limitProgress}>
            <div style={styles.limitLabel}>
              <span style={styles.limitName}>Monatslimit</span>
              <span style={styles.limitValue}>
                {monthlyUsed.toFixed(1)}g / {monthlyLimit}g
              </span>
            </div>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  ...(getMonthlyLevel() === 'critical' ? styles.progressCritical :
                      getMonthlyLevel() === 'warning' ? styles.progressWarning : styles.progressNormal),
                  width: `${monthlyPercentage}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={styles.cartHeader}>
        <h4 style={styles.cartTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="m1 1 4 4v16a2 2 0 0 0 2 2h14"/>
            <path d="M7 12h10l2-8H5"/>
          </svg>
          Warenkorb
          {selectedUnits.length > 0 && (
            <span style={styles.cartCount}>{selectedUnits.length}</span>
          )}
        </h4>
        
        {selectedUnits.length > 0 && (
          <div style={styles.cartSummary}>
            <div style={styles.cartStat}>
              <div style={styles.cartStatValue}>{totalWeight.toFixed(1)}g</div>
              <div style={styles.cartStatLabel}>Gewicht</div>
            </div>
            <div style={styles.cartStat}>
              <div style={styles.cartStatValue}>{selectedUnits.length}</div>
              <div style={styles.cartStatLabel}>Artikel</div>
            </div>
          </div>
        )}
      </div>
      
      <div style={styles.cartItems}>
        {selectedUnits.length === 0 ? (
          <div style={styles.cartEmpty}>
            <div style={styles.cartEmptyIcon}>🛒</div>
            <p>Warenkorb ist leer</p>
          </div>
        ) : (
          selectedUnits.map((unit, index) => {
            const batch = unit.batch || {}
            const isMarijuana = batch.product_type === 'marijuana'
            
            return (
              <div key={unit.id} style={styles.cartItem}>
                <button
                  style={styles.cartItemRemove}
                  onClick={() => onRemoveUnit(unit.id)}
                  title="Entfernen"
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c82333'
                    e.target.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc3545'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  ✕
                </button>
                
                <div style={styles.cartItemHeader}>
                  <span style={styles.cartItemBatch}>{unit.batch_number}</span>
                  <span style={styles.cartItemWeight}>{parseFloat(unit.weight).toFixed(1)}g</span>
                </div>
                
                <div style={styles.cartItemDetails}>
                  <span style={{
                    ...styles.cartItemType,
                    ...(isMarijuana ? styles.cartItemTypeMarijuana : styles.cartItemTypeHashish)
                  }}>
                    {isMarijuana ? '🌿' : '🟫'} {batch.product_type_display || 'Unbekannt'}
                  </span>
                  
                  {batch.thc_content && (
                    <span style={styles.cartItemThc}>
                      THC: {batch.thc_content}%
                    </span>
                  )}
                </div>
                
                <div style={styles.cartItemStrain}>
                  {batch.source_strain || 'Sorte unbekannt'}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {selectedUnits.length > 0 && (
        <div style={styles.cartActions}>
          <button 
            style={styles.cartClear}
            onClick={onClearAll}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc3545'
              e.target.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff5f5'
              e.target.style.color = '#dc3545'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <polyline points="3,6 5,6 21,6"/>
              <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Alle entfernen
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <button 
          style={styles.resetButton}
          onClick={onReset}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5a6268'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#6c757d'
          }}
        >
          Prozess zurücksetzen
        </button>
        
        <button 
          style={{
            ...styles.nextButton,
            ...(canProceed ? {} : styles.nextButtonDisabled)
          }}
          onClick={onNext}
          disabled={!canProceed}
          onMouseEnter={(e) => {
            if (canProceed) {
              e.target.style.backgroundColor = '#3d7a3d'
            }
          }}
          onMouseLeave={(e) => {
            if (canProceed) {
              e.target.style.backgroundColor = '#4a934a'
            }
          }}
        >
          Zur Bestätigung ({totalWeight.toFixed(1)}g)
        </button>
      </div>
    </div>
  )
}