// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductTable.jsx

export default function ProductTable({ 
  units, 
  selectedUnits, 
  onAddUnit, 
  loading,
  page,
  totalPages,
  onPageChange 
}) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Lade Produkte...</p>
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="empty-state">
        <p>Keine Produkte gefunden</p>
      </div>
    )
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    if (page > 1) {
      pages.push(
        <button
          key="prev"
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
      )
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === page ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      )
    }

    // Next button
    if (page < totalPages) {
      pages.push(
        <button
          key="next"
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      )
    }

    return (
      <div className="pagination">
        {pages}
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="products-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Sorte/Genetik</th>
            <th>Typ</th>
            <th>Gewicht</th>
            <th>THC %</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => {
            const isSelected = selectedUnits.find(u => u.id === unit.id)
            const batch = unit.batch || {}
            const isMarijuana = batch.product_type === 'marijuana'
            const strain = batch.source_strain || 'Unbekannt'
            const thcContent = batch.thc_content || 'k.A.'
            
            return (
              <tr key={unit.id} className={isSelected ? 'selected' : ''}>
                <td>
                  <div className="batch-info">
                    <span className="batch-number">{unit.batch_number}</span>
                  </div>
                </td>
                <td>{strain}</td>
                <td>
                  <span className={`badge ${isMarijuana ? 'badge-success' : 'badge-warning'}`}>
                    {batch.product_type_display || 'Unbekannt'}
                  </span>
                </td>
                <td className="weight-cell">
                  {parseFloat(unit.weight).toFixed(2)}g
                </td>
                <td className="thc-cell">
                  {thcContent}%
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${isSelected ? 'btn-disabled' : 'btn-success'}`}
                    onClick={() => onAddUnit(unit)}
                    disabled={isSelected}
                  >
                    {isSelected ? '✓ Gewählt' : '+ Hinzufügen'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {renderPagination()}
    </div>
  )
}