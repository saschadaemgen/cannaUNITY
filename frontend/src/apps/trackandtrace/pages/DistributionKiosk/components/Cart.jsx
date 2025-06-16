// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/Cart.jsx

export default function Cart({ 
  selectedUnits, 
  onRemoveUnit, 
  onClearAll, 
  totalWeight,
  memberLimits,
  dailyRemaining,
  monthlyRemaining 
}) {
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length

  return (
    <div className="cart-section">
      <div className="cart-header">
        <h4 className="cart-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="m1 1 4 4v16a2 2 0 0 0 2 2h14"/>
            <path d="M7 12h10l2-8H5"/>
          </svg>
          Warenkorb
          {selectedUnits.length > 0 && (
            <span className="cart-count">{selectedUnits.length}</span>
          )}
        </h4>
        
        {selectedUnits.length > 0 && (
          <div className="cart-summary">
            <div className="cart-stat">
              <div className="cart-stat-value">{totalWeight.toFixed(1)}g</div>
              <div className="cart-stat-label">Gewicht</div>
            </div>
            <div className="cart-stat">
              <div className="cart-stat-value">{selectedUnits.length}</div>
              <div className="cart-stat-label">Artikel</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="cart-items">
        {selectedUnits.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p>Warenkorb ist leer</p>
          </div>
        ) : (
          selectedUnits.map((unit, index) => {
            const batch = unit.batch || {}
            const isMarijuana = batch.product_type === 'marijuana'
            
            return (
              <div key={unit.id} className="cart-item">
                <button
                  className="cart-item-remove"
                  onClick={() => onRemoveUnit(unit.id)}
                  title="Entfernen"
                >
                  ✕
                </button>
                
                <div className="cart-item-header">
                  <span className="cart-item-batch">{unit.batch_number}</span>
                  <span className="cart-item-weight">{parseFloat(unit.weight).toFixed(1)}g</span>
                </div>
                
                <div className="cart-item-details">
                  <span className={`cart-item-type ${isMarijuana ? 'marijuana' : 'hashish'}`}>
                    {isMarijuana ? '🌿' : '🟫'} {batch.product_type_display || 'Unbekannt'}
                  </span>
                  
                  {batch.thc_content && (
                    <span className="cart-item-thc">
                      THC: {batch.thc_content}%
                    </span>
                  )}
                </div>
                
                <div className="cart-item-strain">
                  {batch.source_strain || 'Sorte unbekannt'}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {selectedUnits.length > 0 && (
        <div className="cart-actions">
          <button 
            className="cart-clear"
            onClick={onClearAll}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Alle entfernen
          </button>
        </div>
      )}
    </div>
  )
}