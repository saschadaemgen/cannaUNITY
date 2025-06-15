// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductFilters.jsx

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  productTypeFilter,
  setProductTypeFilter,
  thcFilter,
  setThcFilter,
  strainFilter,
  setStrainFilter,
  weightFilter,
  setWeightFilter,
  strainOptions,
  weightOptions,
  isU21 = false
}) {
  return (
    <div className="filters-container">
      <div className="filters-header">
        <h4 className="filters-title">🔍 Produktfilter</h4>
        {isU21 && (
          <div className="u21-filter-info">
            <span className="u21-badge">U21</span>
            <span className="u21-text">Automatische THC-Filterung aktiv (≤ 10%)</span>
          </div>
        )}
      </div>
      
      <div className="filter-grid">
        <div className="filter-group">
          <label className="filter-label">
            <span className="label-icon">🔤</span>
            Suche
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Batch, Sorte oder Genetik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label className="filter-label">
            <span className="label-icon">🌿</span>
            Produkttyp
          </label>
          <select
            className="form-select"
            value={productTypeFilter}
            onChange={(e) => setProductTypeFilter(e.target.value)}
          >
            <option value="">Alle Typen</option>
            <option value="marijuana">🌱 Marihuana</option>
            <option value="hashish">🟫 Haschisch</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">
            <span className="label-icon">⚡</span>
            THC-Gehalt
            {isU21 && <span className="disabled-note">(automatisch gefiltert)</span>}
          </label>
          <select
            className="form-select"
            value={thcFilter}
            onChange={(e) => setThcFilter(e.target.value)}
            disabled={isU21}
            title={isU21 ? "THC-Filter ist für U21-Mitglieder automatisch aktiv" : ""}
          >
            <option value="">Alle Stärken</option>
            <option value="low">Niedrig (&lt; 15%)</option>
            <option value="medium">Mittel (15-20%)</option>
            <option value="high">Hoch (&gt; 20%)</option>
          </select>
          {isU21 && (
            <div className="filter-help">
              Nur Produkte ≤ 10% THC verfügbar
            </div>
          )}
        </div>
        
        <div className="filter-group">
          <label className="filter-label">
            <span className="label-icon">🧬</span>
            Sorte/Genetik
          </label>
          <select
            className="form-select"
            value={strainFilter}
            onChange={(e) => setStrainFilter(e.target.value)}
          >
            <option value="">Alle Sorten</option>
            {strainOptions.map((strain) => (
              <option key={strain.name} value={strain.name}>
                {strain.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">
            <span className="label-icon">⚖️</span>
            Verpackungsgröße
          </label>
          <select
            className="form-select"
            value={weightFilter}
            onChange={(e) => setWeightFilter(e.target.value)}
          >
            <option value="">Alle Größen</option>
            {weightOptions.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {(searchTerm || productTypeFilter || thcFilter || strainFilter || weightFilter) && (
        <div className="active-filters">
          <span className="active-filters-label">Aktive Filter:</span>
          <div className="active-filters-list">
            {searchTerm && (
              <span className="filter-tag">
                Suche: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>✕</button>
              </span>
            )}
            {productTypeFilter && (
              <span className="filter-tag">
                Typ: {productTypeFilter === 'marijuana' ? 'Marihuana' : 'Haschisch'}
                <button onClick={() => setProductTypeFilter('')}>✕</button>
              </span>
            )}
            {thcFilter && !isU21 && (
              <span className="filter-tag">
                THC: {thcFilter === 'low' ? 'Niedrig' : thcFilter === 'medium' ? 'Mittel' : 'Hoch'}
                <button onClick={() => setThcFilter('')}>✕</button>
              </span>
            )}
            {strainFilter && (
              <span className="filter-tag">
                Sorte: {strainFilter}
                <button onClick={() => setStrainFilter('')}>✕</button>
              </span>
            )}
            {weightFilter && (
              <span className="filter-tag">
                Größe: {weightOptions.find(w => w.value === weightFilter)?.label}
                <button onClick={() => setWeightFilter('')}>✕</button>
              </span>
            )}
            {isU21 && (
              <span className="filter-tag u21-auto-filter">
                THC ≤ 10% (automatisch)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}