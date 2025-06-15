// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ReviewStep.jsx

export default function ReviewStep({ 
  selectedMember, 
  selectedUnits, 
  totalWeight, 
  notes, 
  setNotes,
  onBack,
  onNext 
}) {
  return (
    <div className="step-container">
      <h1 className="step-title">Ausgabe bestätigen</h1>
      
      <div className="review-layout">
        {/* Member and Summary Info */}
        <div className="review-header">
          <div className="card">
            <h3>Empfänger</h3>
            <div className="member-review">
              <div className="member-icon">👤</div>
              <div className="member-details">
                <span className="member-name">{selectedMember?.name}</span>
                <span className="member-id">ID: {selectedMember?.id}</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>Gesamtmenge</h3>
            <div className="total-weight">
              <span className="weight-value">{totalWeight.toFixed(2)}g</span>
              <span className="unit-count">({selectedUnits.length} Einheiten)</span>
            </div>
          </div>
        </div>
        
        {/* Products Table */}
        <div className="card">
          <h3>Ausgewählte Produkte</h3>
          <div className="review-table-container">
            <table className="review-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Sorte/Genetik</th>
                  <th>Typ</th>
                  <th>Gewicht</th>
                  <th>THC %</th>
                </tr>
              </thead>
              <tbody>
                {selectedUnits.map((unit) => {
                  const batch = unit.batch || {}
                  const isMarijuana = batch.product_type === 'marijuana'
                  
                  return (
                    <tr key={unit.id}>
                      <td className="batch-cell">{unit.batch_number}</td>
                      <td>{batch.source_strain || 'Unbekannt'}</td>
                      <td>
                        <span className={`badge ${isMarijuana ? 'badge-success' : 'badge-warning'}`}>
                          {batch.product_type_display || 'Unbekannt'}
                        </span>
                      </td>
                      <td className="weight-cell">
                        {parseFloat(unit.weight).toFixed(2)}g
                      </td>
                      <td className="thc-cell">
                        {batch.thc_content || 'k.A.'}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="card">
          <h3>Bemerkungen zur Ausgabe</h3>
          <textarea
            className="form-textarea"
            placeholder="Optional: Fügen Sie hier spezielle Hinweise oder Bemerkungen zur Ausgabe hinzu..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      
      {/* Navigation */}
      <div className="step-navigation">
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          ← Zurück zur Auswahl
        </button>
        <button 
          className="btn btn-primary"
          onClick={onNext}
        >
          Zur Autorisierung →
        </button>
      </div>
    </div>
  )
}