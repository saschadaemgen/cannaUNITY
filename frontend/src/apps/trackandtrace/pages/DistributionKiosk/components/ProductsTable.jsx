// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductsTable.jsx

export default function ProductsTable({ 
  units, 
  selectedUnits, 
  onAddUnit, 
  loading,
  sortField,
  sortDirection,
  onSort
}) {
  if (loading) {
    return (
      <div className="loading-container" style={{
        background: 'var(--bg-paper)',
        borderRadius: '16px',
        margin: '24px',
        boxShadow: '0 8px 32px var(--shadow-medium)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--border-light)',
          borderTop: '4px solid var(--primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
          Cannabis-Produkte werden geladen...
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Bitte warten Sie einen Moment
        </p>
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="empty-state" style={{
        background: 'var(--bg-paper)',
        borderRadius: '16px',
        margin: '24px',
        padding: '60px 40px',
        boxShadow: '0 8px 32px var(--shadow-medium)',
        border: '1px solid var(--border-light)'
      }}>
        <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '24px' }}>
          🔍
        </div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
          Keine Produkte gefunden
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          Aktuell sind keine Cannabis-Produkte verfügbar, die Ihren Filterkriterien entsprechen. 
          Versuchen Sie, die Filter anzupassen oder die Suche zu erweitern.
        </p>
      </div>
    )
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
          <path d="M12 2v20M7 12l5-5 5 5"/>
        </svg>
      )
    }
    
    return sortDirection === 'asc' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-500)' }}>
        <path d="M12 2v20M7 12l5-5 5 5"/>
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-500)' }}>
        <path d="M12 22V2M17 12l-5 5-5-5"/>
      </svg>
    )
  }

  const SortableHeader = ({ field, children, align = 'left' }) => (
    <th 
      onClick={() => onSort && onSort(field)}
      style={{
        cursor: onSort ? 'pointer' : 'default',
        userSelect: 'none',
        textAlign: align,
        transition: 'all 0.2s ease',
        background: sortField === field ? 'var(--primary-50)' : 'var(--bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
      onMouseEnter={(e) => {
        if (onSort) {
          e.target.style.background = 'var(--primary-50)'
          e.target.style.color = 'var(--primary-700)'
        }
      }}
      onMouseLeave={(e) => {
        if (onSort) {
          e.target.style.background = sortField === field ? 'var(--primary-50)' : 'var(--bg-secondary)'
          e.target.style.color = 'var(--text-primary)'
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
      }}>
        {children}
        {onSort && getSortIcon(field)}
      </div>
    </th>
  )

  return (
    <div className="products-table-container" style={{
      background: 'var(--bg-paper)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px var(--shadow-medium)',
      border: '1px solid var(--border-light)',
      margin: '0 24px'
    }}>
      <table className="products-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <SortableHeader field="batch_number">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Batch-Nummer
            </SortableHeader>
            
            <SortableHeader field="batch__source_strain">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"/>
              </svg>
              Sorte/Genetik
            </SortableHeader>
            
            <SortableHeader field="batch__product_type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              Produktkategorie
            </SortableHeader>
            
            <SortableHeader field="weight" align="right">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27a2 2 0 0 0 1-1.73z"/>
              </svg>
              Gewicht
            </SortableHeader>
            
            <SortableHeader field="batch__thc_content" align="center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
              THC-Potenz
            </SortableHeader>
            
            <th style={{
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 12 2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Verfügbarkeit
              </div>
            </th>
            
            <th style={{
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="m1 1 4 4v16a2 2 0 0 0 2 2h14"/>
                  <path d="M7 12h10l2-8H5"/>
                </svg>
                Aktion
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit, index) => {
            const isSelected = selectedUnits.find(u => u.id === unit.id)
            const batch = unit.batch || {}
            const isMarijuana = batch.product_type === 'marijuana'
            const strain = batch.source_strain || 'Unbekannt'
            const thcContent = batch.thc_content || 'k.A.'
            
            return (
              <tr 
                key={unit.id} 
                className={isSelected ? 'selected' : ''}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(90deg, var(--primary-50), var(--success-50))' 
                    : index % 2 === 0 ? 'var(--bg-paper)' : 'var(--bg-secondary)',
                  transition: 'all 0.3s ease',
                  borderBottom: '1px solid var(--border-light)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'var(--primary-50)'
                    e.target.style.transform = 'scale(1.01)'
                    e.target.style.boxShadow = '0 4px 16px var(--shadow-medium)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.background = index % 2 === 0 ? 'var(--bg-paper)' : 'var(--bg-secondary)'
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = 'none'
                  }
                }}
              >
                <td style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div className="batch-cell" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: 'var(--text-primary)',
                      fontFamily: '"Roboto Mono", monospace'
                    }}>
                      {unit.batch_number}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      background: 'var(--grey-100)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      width: 'fit-content'
                    }}>
                      ID: {unit.id}
                    </div>
                  </div>
                </td>
                
                <td className="strain-cell" style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M2 12h20"/>
                    </svg>
                    {strain}
                  </div>
                </td>
                
                <td style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <span className={`type-badge ${isMarijuana ? 'marijuana' : 'hashish'}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: isMarijuana 
                      ? 'linear-gradient(135deg, var(--success-50), var(--success-100))' 
                      : 'linear-gradient(135deg, var(--warning-50), var(--warning-100))',
                    color: isMarijuana ? 'var(--success-700)' : 'var(--warning-700)',
                    border: `1px solid ${isMarijuana ? 'var(--success-200)' : 'var(--warning-200)'}`
                  }}>
                    {isMarijuana ? '🌿' : '🟫'} 
                    {batch.product_type_display || 'Unbekannt'}
                  </span>
                </td>
                
                <td className="weight-cell" style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27a2 2 0 0 0 1-1.73z"/>
                    </svg>
                    {parseFloat(unit.weight).toFixed(2)}g
                  </div>
                </td>
                
                <td className="thc-cell" style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: parseFloat(thcContent) > 20 
                      ? 'var(--error-50)' 
                      : parseFloat(thcContent) > 15 
                        ? 'var(--warning-50)' 
                        : 'var(--success-50)',
                    color: parseFloat(thcContent) > 20 
                      ? 'var(--error-700)' 
                      : parseFloat(thcContent) > 15 
                        ? 'var(--warning-700)' 
                        : 'var(--success-700)',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                    </svg>
                    {thcContent}%
                  </div>
                </td>
                
                <td style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--success-700)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: 'var(--success-50)'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 12 2 2 4-4"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    Verfügbar
                  </div>
                </td>
                
                <td style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'center'
                }}>
                  <button
                    className={`btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-success'}`}
                    onClick={() => onAddUnit(unit)}
                    disabled={isSelected}
                    style={{
                      background: isSelected 
                        ? 'var(--grey-300)' 
                        : 'linear-gradient(135deg, var(--success-500), var(--success-600))',
                      color: isSelected ? 'var(--text-disabled)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: isSelected ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'none' : '0 2px 8px rgba(76, 175, 80, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
                      }
                    }}
                  >
                    {isSelected ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m9 12 2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Ausgewählt
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="m1 1 4 4v16a2 2 0 0 0 2 2h14"/>
                          <path d="M7 12h10l2-8H5"/>
                        </svg>
                        In Warenkorb
                      </>
                    )}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}