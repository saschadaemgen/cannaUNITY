// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductSelectionStep.jsx

import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import MemberProfile from './MemberProfile'
import LimitsOverview from './LimitsOverview'
import Cart from './Cart'
import ProductsTable from './ProductsTable'
import StepIndicator from './StepIndicator'

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const STEPS = [
  'Mitglied scannen',
  'Produkte wählen', 
  'Bestätigen & Autorisieren'
]

export default function ProductSelectionStep({ 
  selectedMember, 
  memberLimits, 
  selectedUnits, 
  setSelectedUnits,
  onNext,
  onReset,
  onError 
}) {
  // Data States
  const [availableUnits, setAvailableUnits] = useState([])
  const [weightOptions, setWeightOptions] = useState([])
  const [strainOptions, setStrainOptions] = useState([])
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [thcFilter, setThcFilter] = useState('')
  const [strainFilter, setStrainFilter] = useState('')
  const [weightFilter, setWeightFilter] = useState('')
  
  // Sorting & Pagination States
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  
  // UI States
  const [loading, setLoading] = useState(false)
  const [validationWarning, setValidationWarning] = useState('')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Get member limits and restrictions
  const isU21 = memberLimits?.member?.age_class === '18+'
  const dailyLimit = memberLimits?.limits?.daily_limit || 25
  const monthlyLimit = memberLimits?.limits?.monthly_limit || 50
  const thcLimit = isU21 ? 10 : null
  const dailyConsumed = memberLimits?.consumption?.daily?.consumed || 0
  const monthlyConsumed = memberLimits?.consumption?.monthly?.consumed || 0
  
  // Calculate current selection weight
  const currentSelectionWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  
  // Validation function for adding products
  const validateProductAddition = (unit) => {
    const unitWeight = parseFloat(unit.weight || 0)
    const newDailyTotal = dailyConsumed + currentSelectionWeight + unitWeight
    const newMonthlyTotal = monthlyConsumed + currentSelectionWeight + unitWeight
    
    const errors = []
    
    // Check daily limit
    if (newDailyTotal > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - dailyConsumed - currentSelectionWeight)
      errors.push(`Tageslimit würde überschritten! Noch verfügbar: ${remaining.toFixed(1)}g`)
    }
    
    // Check monthly limit
    if (newMonthlyTotal > monthlyLimit) {
      const remaining = Math.max(0, monthlyLimit - monthlyConsumed - currentSelectionWeight)
      errors.push(`Monatslimit würde überschritten! Noch verfügbar: ${remaining.toFixed(1)}g`)
    }
    
    // Check THC limit for U21
    if (isU21 && unit.batch?.thc_content) {
      const thcContent = parseFloat(unit.batch.thc_content)
      if (thcContent > thcLimit) {
        errors.push(`THC-Limit überschritten! Max. ${thcLimit}% THC für U21-Mitglieder (Produkt: ${thcContent}%)`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }
  
  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [weightsRes, strainsRes] = await Promise.all([
          api.get('/trackandtrace/packaging-units/distinct_weights/'),
          api.get('/trackandtrace/packaging-units/distinct_strains/')
        ])
        
        setWeightOptions(weightsRes.data)
        setStrainOptions(strainsRes.data)
        
      } catch (err) {
        console.error('Fehler beim Laden der Filter-Optionen:', err)
      }
    }
    
    loadOptions()
  }, [])
  
  // Load packaging units with proper filtering for U21, sorting and pagination
  const loadPackagingUnits = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      })
      
      // Add recipient filter for U21 restrictions
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      // Apply filters
      if (productTypeFilter) params.append('product_type', productTypeFilter)
      if (strainFilter) params.append('strain_name', strainFilter)
      if (weightFilter) params.append('weight', weightFilter)
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      
      // THC filter (only if not U21, as U21 are already filtered by recipient_id)
      if (!isU21 && thcFilter) {
        switch (thcFilter) {
          case 'low':
            params.append('max_thc', '15')
            break
          case 'medium':
            params.append('min_thc', '15')
            params.append('max_thc', '20')
            break
          case 'high':
            params.append('min_thc', '20')
            break
        }
      }
      
      // Add sorting
      if (sortField) {
        const orderPrefix = sortDirection === 'desc' ? '-' : ''
        params.append('ordering', `${orderPrefix}${sortField}`)
      }
      
      const response = await api.get(`/trackandtrace/distributions/available_units/?${params.toString()}`)
      
      setAvailableUnits(response.data.results || response.data || [])
      setTotalCount(response.data.count || 0)
      
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err)
      onError('Fehler beim Laden der verfügbaren Produkte')
    } finally {
      setLoading(false)
    }
  }, [productTypeFilter, thcFilter, strainFilter, weightFilter, debouncedSearchTerm, selectedMember?.id, isU21, sortField, sortDirection, currentPage, pageSize])

  // Load products when filters, sorting, or pagination change
  useEffect(() => {
    loadPackagingUnits()
  }, [loadPackagingUnits])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [productTypeFilter, thcFilter, strainFilter, weightFilter, debouncedSearchTerm])

  // Enhanced unit management with validation
  const handleAddUnit = (unit) => {
    // Clear previous warnings
    setValidationWarning('')
    
    // Check if already selected
    if (selectedUnits.find(u => u.id === unit.id)) {
      setValidationWarning('Dieses Produkt ist bereits ausgewählt.')
      setTimeout(() => setValidationWarning(''), 3000)
      return
    }
    
    // Validate the addition
    const validation = validateProductAddition(unit)
    
    if (!validation.isValid) {
      setValidationWarning(validation.errors.join(' '))
      setTimeout(() => setValidationWarning(''), 5000)
      return
    }
    
    // Add unit if validation passes
    setSelectedUnits([...selectedUnits, unit])
    
    // Show success message briefly
    setValidationWarning(`✅ ${unit.batch_number} hinzugefügt (${parseFloat(unit.weight).toFixed(1)}g)`)
    setTimeout(() => setValidationWarning(''), 2000)
  }
  
  const handleRemoveUnit = (unitId) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== unitId))
    setValidationWarning('')
  }

  const handleClearAll = () => {
    setSelectedUnits([])
    setValidationWarning('')
  }

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Pagination handlers
  const totalPages = Math.ceil(totalCount / pageSize)
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Calculate remaining limits for display
  const dailyRemaining = Math.max(0, dailyLimit - dailyConsumed - currentSelectionWeight)
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyConsumed - currentSelectionWeight)
  
  // Check if can proceed
  const canProceed = selectedUnits.length > 0 && dailyRemaining >= 0 && monthlyRemaining >= 0

  return (
    <div className="main-layout">
      {/* Enhanced Step Indicator */}
      <div style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--bg-paper)',
        padding: '16px 24px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px var(--shadow-medium)',
        border: '1px solid var(--border-light)'
      }}>
        <StepIndicator 
          steps={STEPS}
          currentStep={1}
          isCompleted={false}
        />
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        {/* Member Profile */}
        <MemberProfile 
          member={selectedMember}
          memberLimits={memberLimits}
        />
        
        {/* Limits Overview */}
        <LimitsOverview 
          memberLimits={memberLimits}
          currentSelectionWeight={currentSelectionWeight}
        />
        
        {/* Cart */}
        <Cart 
          selectedUnits={selectedUnits}
          onRemoveUnit={handleRemoveUnit}
          onClearAll={handleClearAll}
          totalWeight={currentSelectionWeight}
          memberLimits={memberLimits}
          dailyRemaining={dailyRemaining}
          monthlyRemaining={monthlyRemaining}
        />
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Products Section */}
        <div className="products-section">
          <div className="products-header">
            <h2 className="products-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              Verfügbare Cannabis-Produkte
            </h2>
            
            {/* Validation Warning */}
            {validationWarning && (
              <div className={`alert ${validationWarning.startsWith('✅') ? 'alert-success' : 'alert-warning'}`}>
                <span>{validationWarning}</span>
                <button 
                  className="alert-close" 
                  onClick={() => setValidationWarning('')}
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Enhanced Filters with Material Design */}
            <div className="products-filters" style={{
              background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
              border: '1px solid var(--border-light)',
              boxShadow: '0 4px 16px var(--shadow-light)'
            }}>
              <div className="filter-group">
                <label className="filter-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Suchbegriff
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Batch-Nummer, Sorte, Genetik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px var(--shadow-medium)'
                    }
                  }}
                />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L3 9v12h6v-7h6v7h6V9l-9-7z"/>
                  </svg>
                  Produktkategorie
                </label>
                <select
                  className="form-select"
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                >
                  <option value="">🌿 Alle Kategorien</option>
                  <option value="marijuana">🌱 Marihuana</option>
                  <option value="hashish">🟫 Haschisch</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                  </svg>
                  THC-Potenz
                  {isU21 && <span style={{ color: 'var(--warning-500)', fontSize: '0.75rem' }}>(Auto-Filter)</span>}
                </label>
                <select
                  className="form-select"
                  value={thcFilter}
                  onChange={(e) => setThcFilter(e.target.value)}
                  disabled={isU21}
                >
                  <option value="">⚡ Alle Stärken</option>
                  <option value="low">🌱 Niedrig (&lt; 15%)</option>
                  <option value="medium">⚡ Mittel (15-20%)</option>
                  <option value="high">🔥 Hoch (&gt; 20%)</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  Cannabis-Sorte
                </label>
                <select
                  className="form-select"
                  value={strainFilter}
                  onChange={(e) => setStrainFilter(e.target.value)}
                >
                  <option value="">🧬 Alle Genetiken</option>
                  {strainOptions.map((strain) => (
                    <option key={strain.name} value={strain.name}>
                      {strain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27a2 2 0 0 0 1-1.73z"/>
                  </svg>
                  Verpackungsgewicht
                </label>
                <select
                  className="form-select"
                  value={weightFilter}
                  onChange={(e) => setWeightFilter(e.target.value)}
                >
                  <option value="">⚖️ Alle Gewichte</option>
                  {weightOptions.map((weight) => (
                    <option key={weight.value} value={weight.value}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {isU21 && (
                <div className="u21-filter-notice" style={{
                  background: 'linear-gradient(135deg, var(--warning-500), #ff8f00)',
                  animation: 'pulse-warning 2s infinite'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  U21: Nur Produkte ≤ {thcLimit}% THC verfügbar
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Products Table with Sorting */}
          <div className="products-content">
            <ProductsTable
              units={availableUnits}
              selectedUnits={selectedUnits}
              onAddUnit={handleAddUnit}
              loading={loading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>

          {/* Pagination Controls */}
          {totalCount > pageSize && (
            <div style={{
              background: 'var(--bg-paper)',
              borderTop: '1px solid var(--border-light)',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Zeige {((currentPage - 1) * pageSize) + 1} bis {Math.min(currentPage * pageSize, totalCount)} von {totalCount} Produkten
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Zurück
                </button>
                
                <span style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '0.875rem',
                  padding: '0 12px'
                }}>
                  Seite {currentPage} von {totalPages}
                </span>
                
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Weiter
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Action Bar */}
        <div className="action-bar" style={{
          background: 'linear-gradient(135deg, var(--bg-paper), var(--bg-secondary))',
          boxShadow: '0 -4px 16px var(--shadow-medium)'
        }}>
          <div className="action-info">
            <div className="action-stat">
              <div className="action-stat-value" style={{ color: 'var(--primary-500)' }}>
                {selectedUnits.length}
              </div>
              <div className="action-stat-label">📦 Produkte</div>
            </div>
            <div className="action-stat">
              <div className="action-stat-value" style={{ color: 'var(--success-500)' }}>
                {currentSelectionWeight.toFixed(1)}g
              </div>
              <div className="action-stat-label">⚖️ Gewicht</div>
            </div>
            <div className="action-stat">
              <div className="action-stat-value" style={{ 
                color: dailyRemaining < 5 ? 'var(--error-500)' : 'var(--text-primary)' 
              }}>
                {dailyRemaining.toFixed(1)}g
              </div>
              <div className="action-stat-label">🕐 Heute verfügbar</div>
            </div>
            <div className="action-stat">
              <div className="action-stat-value" style={{ 
                color: monthlyRemaining < 10 ? 'var(--warning-500)' : 'var(--text-primary)' 
              }}>
                {monthlyRemaining.toFixed(1)}g
              </div>
              <div className="action-stat-label">📅 Monat verfügbar</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={onReset}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1,4 1,10 7,10"/>
                <path d="M3.51,15a9,9,0,0,0,2.13,3.09,9,9,0,0,0,13.68,0,9,9,0,0,0,0-12.72,9,9,0,0,0-13.68,0A8.79,8.79,0,0,0,1.51,9.4"/>
              </svg>
              Prozess zurücksetzen
            </button>
            
            <button 
              className="btn btn-primary btn-lg"
              onClick={onNext}
              disabled={!canProceed}
              style={{
                background: canProceed 
                  ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' 
                  : 'var(--grey-400)',
                boxShadow: canProceed 
                  ? '0 8px 24px rgba(74, 147, 74, 0.4)' 
                  : 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Zur Bestätigung ({currentSelectionWeight.toFixed(1)}g)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}