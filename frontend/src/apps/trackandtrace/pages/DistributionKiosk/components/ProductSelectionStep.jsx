// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductSelectionStep.jsx

import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import MemberInfo from './MemberInfo'
import ProductFilters from './ProductFilters'
import ProductTable from './ProductTable'
import SelectedProductsSummary from './SelectedProductsSummary'

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

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
  
  // Pagination States
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // UI States
  const [loading, setLoading] = useState(false)
  const [pendingFilterChange, setPendingFilterChange] = useState(false)
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
      errors: errors,
      unitWeight: unitWeight,
      newDailyTotal: newDailyTotal,
      newMonthlyTotal: newMonthlyTotal
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
        
        const formattedWeights = weightsRes.data.map(w => ({
          value: w,
          label: `${parseFloat(w).toFixed(2)}g`
        }))
        
        setWeightOptions(formattedWeights)
        setStrainOptions(strainsRes.data)
        
      } catch (err) {
        console.error('Fehler beim Laden der Filter-Optionen:', err)
      }
    }
    
    loadOptions()
  }, [])
  
  // Load packaging units with proper filtering for U21
  const loadPackagingUnits = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      
      // Add recipient filter for U21 restrictions - this will filter out high THC products
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      // Apply filters
      if (weightFilter) params.append('weight', weightFilter)
      if (productTypeFilter) params.append('product_type', productTypeFilter)
      if (strainFilter) params.append('strain_name', strainFilter)
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
      
      const response = await api.get(`/trackandtrace/distributions/available_units/?${params.toString()}`)
      
      setAvailableUnits(response.data.results || response.data || [])
      setTotalCount(response.data.count || (response.data.results || response.data || []).length)
      
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err)
      onError('Fehler beim Laden der verfügbaren Produkte')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, weightFilter, productTypeFilter, strainFilter, thcFilter, debouncedSearchTerm, selectedMember?.id, isU21])

  // Handle filter changes
  useEffect(() => {
    setPendingFilterChange(true)
    setPage(1)
  }, [productTypeFilter, thcFilter, strainFilter, weightFilter, debouncedSearchTerm])

  useEffect(() => {
    if (pendingFilterChange && page === 1) {
      loadPackagingUnits()
      setPendingFilterChange(false)
    }
  }, [pendingFilterChange, page, loadPackagingUnits])

  useEffect(() => {
    if (!pendingFilterChange) {
      loadPackagingUnits()
    }
  }, [page, loadPackagingUnits])

  // Enhanced unit management with validation
  const handleAddUnit = (unit) => {
    // Clear previous warnings
    setValidationWarning('')
    
    // Check if already selected
    if (selectedUnits.find(u => u.id === unit.id)) {
      setValidationWarning('Dieses Produkt ist bereits ausgewählt.')
      return
    }
    
    // Validate the addition
    const validation = validateProductAddition(unit)
    
    if (!validation.isValid) {
      setValidationWarning(validation.errors.join(' '))
      
      // Auto-clear warning after 5 seconds
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

  // Calculate remaining limits for display
  const dailyRemaining = Math.max(0, dailyLimit - dailyConsumed - currentSelectionWeight)
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyConsumed - currentSelectionWeight)
  
  // Calculate totals
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="step-container">
      <MemberInfo 
        member={selectedMember}
        limits={memberLimits}
      />
      
      {/* Validation Warning Alert */}
      {validationWarning && (
        <div className={`validation-alert ${validationWarning.startsWith('✅') ? 'success' : 'warning'}`}>
          <div className="alert-content">
            <span className="alert-icon">
              {validationWarning.startsWith('✅') ? '✅' : '⚠️'}
            </span>
            <span className="alert-message">{validationWarning}</span>
            <button 
              className="alert-close" 
              onClick={() => setValidationWarning('')}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Current Selection Summary */}
      {selectedUnits.length > 0 && (
        <div className="selection-summary-card">
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Aktuelle Auswahl:</span>
              <span className="summary-value">{totalWeight.toFixed(1)}g</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Verbleibendes Tageslimit:</span>
              <span className={`summary-value ${dailyRemaining < 5 ? 'warning' : ''}`}>
                {dailyRemaining.toFixed(1)}g
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Verbleibendes Monatslimit:</span>
              <span className={`summary-value ${monthlyRemaining < 10 ? 'warning' : ''}`}>
                {monthlyRemaining.toFixed(1)}g
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="product-selection-layout">
        <div className="products-section">
          <div className="card">
            <div className="card-header">
              <h2>Verfügbare Produkte</h2>
              {isU21 && (
                <div className="u21-filter-notice">
                  🔒 Nur Produkte ≤ {thcLimit}% THC werden angezeigt
                </div>
              )}
            </div>
            
            <ProductFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              productTypeFilter={productTypeFilter}
              setProductTypeFilter={setProductTypeFilter}
              thcFilter={thcFilter}
              setThcFilter={setThcFilter}
              strainFilter={strainFilter}
              setStrainFilter={setStrainFilter}
              weightFilter={weightFilter}
              setWeightFilter={setWeightFilter}
              strainOptions={strainOptions}
              weightOptions={weightOptions}
              isU21={isU21}
            />
            
            <ProductTable
              units={availableUnits}
              selectedUnits={selectedUnits}
              onAddUnit={handleAddUnit}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              memberLimits={memberLimits}
              currentSelectionWeight={currentSelectionWeight}
            />
          </div>
        </div>
        
        <div className="selection-section">
          <SelectedProductsSummary
            selectedUnits={selectedUnits}
            onRemoveUnit={handleRemoveUnit}
            totalWeight={totalWeight}
            memberLimits={memberLimits}
            dailyRemaining={dailyRemaining}
            monthlyRemaining={monthlyRemaining}
          />
        </div>
      </div>
      
      {/* Navigation */}
      <div className="step-navigation">
        <button 
          className="btn btn-secondary"
          onClick={onReset}
        >
          Zurücksetzen
        </button>
        <button 
          className="btn btn-primary"
          onClick={onNext}
          disabled={selectedUnits.length === 0 || dailyRemaining < 0 || monthlyRemaining < 0}
        >
          Weiter zur Bestätigung
          {selectedUnits.length > 0 && ` (${totalWeight.toFixed(1)}g)`}
        </button>
      </div>
    </div>
  )
}