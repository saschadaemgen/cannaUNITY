// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductSelectionStep.jsx
// 🚀 OPTIMIERTE VERSION - Backend-Aggregation + Infinite Scroll

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/utils/api'
import MemberProfile from './MemberProfile'
import Cart from './Cart'

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
  // =================== DATA STATES ===================
  const [strainCards, setStrainCards] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    weight_options: [],
    strain_options: []
  })
  
  // =================== PAGINATION STATES ===================
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // =================== FILTER STATES ===================
  const [filters, setFilters] = useState({
    productType: '',
    thc: '',
    strain: '',
    weight: ''
  })
  
  // =================== UI STATES ===================
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [validationWarning, setValidationWarning] = useState('')
  
  // =================== MEMBER CALCULATIONS ===================
  const isU21 = memberLimits?.member?.age_class === '18+'
  const dailyLimit = memberLimits?.limits?.daily_limit || 25
  const monthlyLimit = memberLimits?.limits?.monthly_limit || 50
  const thcLimit = isU21 ? 10 : null
  const dailyConsumed = memberLimits?.consumption?.daily?.consumed || 0
  const monthlyConsumed = memberLimits?.consumption?.monthly?.consumed || 0
  
  const currentSelectionWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  
  // =================== MEMOIZED CALCULATIONS ===================
  const dailyRemaining = useMemo(() => 
    Math.max(0, dailyLimit - dailyConsumed - currentSelectionWeight), 
    [dailyLimit, dailyConsumed, currentSelectionWeight]
  )
  
  const monthlyRemaining = useMemo(() => 
    Math.max(0, monthlyLimit - monthlyConsumed - currentSelectionWeight), 
    [monthlyLimit, monthlyConsumed, currentSelectionWeight]
  )
  
  const canProceed = selectedUnits.length > 0 && dailyRemaining >= 0 && monthlyRemaining >= 0
  
  // =================== VALIDATION FUNCTION ===================
  const validateProductAddition = useCallback((unit) => {
    const unitWeight = parseFloat(unit.weight || 0)
    const newDailyTotal = dailyConsumed + currentSelectionWeight + unitWeight
    const newMonthlyTotal = monthlyConsumed + currentSelectionWeight + unitWeight
    
    const errors = []
    
    if (newDailyTotal > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - dailyConsumed - currentSelectionWeight)
      errors.push(`Tageslimit würde überschritten! Noch verfügbar: ${remaining.toFixed(1)}g`)
    }
    
    if (newMonthlyTotal > monthlyLimit) {
      const remaining = Math.max(0, monthlyLimit - monthlyConsumed - currentSelectionWeight)
      errors.push(`Monatslimit würde überschritten! Noch verfügbar: ${remaining.toFixed(1)}g`)
    }
    
    if (isU21 && unit.batch?.thc_content) {
      const thcContent = parseFloat(unit.batch.thc_content)
      if (thcContent > thcLimit) {
        errors.push(`THC-Limit überschritten! Max. ${thcLimit}% THC für U21-Mitglieder`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }, [dailyLimit, monthlyLimit, thcLimit, dailyConsumed, monthlyConsumed, currentSelectionWeight, isU21])
  
  // =================== API FUNCTIONS ===================
  
  // 🔥 NEUE API-Funktion: Lade StrainCards (paginiert)
  const loadStrainCards = useCallback(async (page = 1, resetCards = true) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '12'
      })
      
      // Empfänger-ID für automatische THC-Filterung
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      // Filter-Parameter
      if (filters.productType) {
        params.append('product_type', filters.productType)
      }
      
      if (filters.strain && filters.strain.trim()) {
        params.append('strain_name', filters.strain.trim())
      }
      
      if (filters.weight) {
        params.append('weight', filters.weight)
      }
      
      // THC-Filter
      if (isU21) {
        params.append('max_thc', '10')
      } else if (filters.thc) {
        switch (filters.thc) {
          case 'very_low':
            params.append('max_thc', '10')
            break
          case 'low':
            params.append('min_thc', '10')
            params.append('max_thc', '15')
            break
          case 'medium':
            params.append('min_thc', '15')
            params.append('max_thc', '20')
            break
          case 'high':
            params.append('min_thc', '20')
            params.append('max_thc', '25')
            break
          case 'very_high':
            params.append('min_thc', '25')
            params.append('max_thc', '30')
            break
          case 'extreme':
            params.append('min_thc', '30')
            break
        }
      }
      
      const response = await api.get(`/trackandtrace/strain-cards/?${params.toString()}`)
      
      console.log(`🌿 StrainCards Seite ${page} geladen:`, response.data.results?.length || 0)
      
      const newCards = response.data.results || []
      const hasMoreData = !!response.data.next
      
      if (resetCards || page === 1) {
        setStrainCards(newCards)
        setCurrentPage(1)
      } else {
        setStrainCards(prev => [...prev, ...newCards])
      }
      
      setHasMore(hasMoreData)
      setTotalCount(response.data.count || 0)
      
      if (page > 1) {
        setCurrentPage(page)
      }
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der StrainCards:', err)
      onError('Fehler beim Laden der verfügbaren Sorten')
      if (resetCards || page === 1) {
        setStrainCards([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, selectedMember?.id, isU21, onError])
  
  // Lade Filter-Optionen (einmalig oder bei Empfänger-Wechsel)
  const loadFilterOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      const response = await api.get(`/trackandtrace/strain-cards/filter_options/?${params.toString()}`)
      
      console.log('🔍 Filter-Optionen geladen:', {
        weights: response.data.weight_options?.length || 0,
        strains: response.data.strain_options?.length || 0
      })
      
      setFilterOptions(response.data)
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Filter-Optionen:', err)
      setFilterOptions({ weight_options: [], strain_options: [] })
    }
  }, [selectedMember?.id])
  
  // Infinite Scroll Handler
  const loadMoreCards = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadStrainCards(currentPage + 1, false)
    }
  }, [loadStrainCards, currentPage, hasMore, loadingMore])
  
  // =================== FILTER CHANGE HANDLERS ===================
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    
    // Reset pagination bei Filter-Änderung
    setCurrentPage(1)
    setHasMore(true)
  }, [])
  
  // =================== UNIT MANAGEMENT ===================
  const handleAddUnit = async (strainCard) => {
    setValidationWarning('')
    
    // Hole erste verfügbare Unit für diese StrainCard
    const unit = strainCard.first_unit
    if (!unit) {
      setValidationWarning('Keine verfügbare Einheit für diese Sorte.')
      setTimeout(() => setValidationWarning(''), 3000)
      return
    }
    
    if (selectedUnits.find(u => u.id === unit.id)) {
      setValidationWarning('Dieses Produkt ist bereits ausgewählt.')
      setTimeout(() => setValidationWarning(''), 3000)
      return
    }
    
    const validation = validateProductAddition(unit)
    
    if (!validation.isValid) {
      setValidationWarning(validation.errors.join(' '))
      setTimeout(() => setValidationWarning(''), 5000)
      return
    }
    
    // Erstelle vollständiges Unit-Objekt für Cart
    const fullUnit = {
      id: unit.id,
      batch_number: unit.batch_number,
      weight: unit.weight,
      batch: {
        source_strain: strainCard.strain_name,
        product_type: strainCard.product_type,
        product_type_display: strainCard.product_type_display,
        thc_content: strainCard.avg_thc_content !== 'k.A.' ? strainCard.avg_thc_content : null
      }
    }
    
    setSelectedUnits([...selectedUnits, fullUnit])
    setValidationWarning(`✅ ${unit.batch_number} hinzugefügt (${parseFloat(unit.weight).toFixed(1)}g)`)
    setTimeout(() => setValidationWarning(''), 2000)
  }
  
  const handleRemoveUnit = useCallback((unitId) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== unitId))
    setValidationWarning('')
  }, [selectedUnits, setSelectedUnits])

  const handleClearAll = useCallback(() => {
    setSelectedUnits([])
    setValidationWarning('')
  }, [setSelectedUnits])
  
  // =================== EFFECTS ===================
  
  // Lade Filter-Optionen bei Mount oder Empfänger-Wechsel
  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])
  
  // Lade StrainCards bei Filter-Änderungen
  useEffect(() => {
    loadStrainCards(1, true)
  }, [loadStrainCards])
  
  // Scroll Detection für Infinite Loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // 1000px vor Ende
      ) {
        loadMoreCards()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreCards])
  
  // =================== STYLES ===================
  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: "'Roboto', sans-serif"
    },
    sidebar: {
      width: '380px',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #e0e0e0'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    header: {
      backgroundColor: '#ffffff',
      padding: '20px 30px',
      borderBottom: '1px solid #e0e0e0'
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#2c3e50',
      margin: '0 0 20px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    performanceInfo: {
      fontSize: '12px',
      color: '#6c757d',
      marginBottom: '10px'
    },
    filterContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      backgroundColor: '#f8f9fa',
      padding: '20px 30px'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#6c757d',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    select: {
      padding: '10px 12px',
      border: '1px solid #dee2e6',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      outline: 'none',
      cursor: 'pointer'
    },
    contentArea: {
      flex: 1,
      overflow: 'auto',
      padding: '30px'
    },
    strainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '25px'
    },
    strainCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      height: '420px'
    },
    strainImage: {
      width: '100%',
      height: '160px',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: '#4a934a',
      position: 'relative'
    },
    strainImagePlaceholder: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #4a934a 0%, #66bb6a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 600
    },
    strainContent: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    strainName: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#2c3e50',
      margin: '0 0 12px 0',
      textAlign: 'center',
      lineHeight: 1.2
    },
    weightBadge: {
      textAlign: 'center',
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: '#e3f2fd',
      color: '#1976d2',
      borderRadius: '12px',
      marginBottom: '12px'
    },
    strainType: {
      display: 'block',
      textAlign: 'center',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      marginBottom: '16px',
      borderRadius: '20px'
    },
    strainTypeMarijuana: {
      backgroundColor: '#e8f5e8',
      color: '#4a934a',
      border: '1px solid #c8e6c9'
    },
    strainTypeHashish: {
      backgroundColor: '#fff3e0',
      color: '#ff9800',
      border: '1px solid #ffcc80'
    },
    strainInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      flex: 1,
      justifyContent: 'center'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0'
    },
    infoLabel: {
      fontSize: '13px',
      color: '#6c757d',
      fontWeight: 500
    },
    infoValue: {
      fontSize: '13px',
      color: '#2c3e50',
      fontWeight: 700
    },
    actionButtons: {
      display: 'flex',
      height: '60px'
    },
    actionButton: {
      border: 'none',
      color: 'white',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.2s ease',
      backgroundColor: '#4a934a',
      width: '100%'
    },
    loadMoreContainer: {
      textAlign: 'center',
      padding: '20px',
      marginTop: '20px'
    },
    loadMoreButton: {
      padding: '12px 24px',
      backgroundColor: '#4a934a',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    footer: {
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e0e0e0',
      padding: '20px 30px',
      display: 'flex',
      justifyContent: 'center'
    },
    stepHistory: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '40px'
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: '#6c757d'
    },
    stepNumber: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#e0e0e0',
      color: '#6c757d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600
    },
    stepNumberActive: {
      backgroundColor: '#4a934a',
      color: 'white'
    },
    stepNumberCompleted: {
      backgroundColor: '#28a745',
      color: 'white'
    },
    warningAlert: {
      padding: '12px 16px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      color: '#856404',
      fontSize: '14px',
      marginBottom: '20px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      fontSize: '16px',
      color: '#6c757d'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6c757d'
    }
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <MemberProfile 
          member={selectedMember}
          memberLimits={memberLimits}
        />
        
        <Cart 
          selectedUnits={selectedUnits}
          onRemoveUnit={handleRemoveUnit}
          onClearAll={handleClearAll}
          totalWeight={currentSelectionWeight}
          memberLimits={memberLimits}
          dailyRemaining={dailyRemaining}
          monthlyRemaining={monthlyRemaining}
          onNext={onNext}
          onReset={onReset}
          canProceed={canProceed}
        />
      </div>
      
      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            🌿 Cannabis-Sortenwahl
          </h2>
          
          <div style={styles.performanceInfo}>
            📊 {strainCards.length} von {totalCount} Sorten geladen | 
            ⚡ Backend-Aggregation aktiv | 
            🚀 ~{Math.round(totalCount * 0.1)}KB statt ~{Math.round(totalCount * 2)}MB
          </div>
          
          {validationWarning && (
            <div style={styles.warningAlert}>
              {validationWarning}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filterContainer}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Produktkategorie</label>
            <select
              style={styles.select}
              value={filters.productType}
              onChange={(e) => handleFilterChange('productType', e.target.value)}
            >
              <option value="">Alle Kategorien</option>
              <option value="marijuana">Marihuana</option>
              <option value="hashish">Haschisch</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Cannabis-Sorte</label>
            <select
              style={styles.select}
              value={filters.strain}
              onChange={(e) => handleFilterChange('strain', e.target.value)}
            >
              <option value="">Alle Sorten</option>
              {filterOptions.strain_options?.map((strain) => (
                <option key={strain.name} value={strain.name}>
                  {strain.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>THC-Potenz</label>
            <select
              style={styles.select}
              value={isU21 ? 'u21_limit' : filters.thc}
              onChange={(e) => !isU21 && handleFilterChange('thc', e.target.value)}
            >
              {isU21 ? (
                <option value="u21_limit">Kleiner als 10% (U21-Limit)</option>
              ) : (
                <>
                  <option value="">Alle Stärken</option>
                  <option value="very_low">Sehr niedrig (&lt; 10%)</option>
                  <option value="low">Niedrig (10-15%)</option>
                  <option value="medium">Mittel (15-20%)</option>
                  <option value="high">Hoch (20-25%)</option>
                  <option value="very_high">Sehr hoch (25-30%)</option>
                  <option value="extreme">Extrem (&gt; 30%)</option>
                </>
              )}
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Verpackungsgewicht</label>
            <select
              style={styles.select}
              value={filters.weight}
              onChange={(e) => handleFilterChange('weight', e.target.value)}
            >
              <option value="">Alle Gewichte</option>
              {filterOptions.weight_options?.map((weight) => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Content Area */}
        <div style={styles.contentArea}>
          {loading ? (
            <div style={styles.loadingContainer}>
              🌿 Cannabis-Sorten werden geladen...
            </div>
          ) : strainCards.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3>Keine Sorten gefunden</h3>
              <p>Es sind keine Cannabis-Sorten verfügbar, die Ihren Filterkriterien entsprechen.</p>
            </div>
          ) : (
            <>
              <div style={styles.strainGrid}>
                {strainCards.map((card) => {
                  const isMarijuana = card.product_type === 'marijuana'
                  const isSelected = selectedUnits.find(u => u.id === card.first_unit?.id)
                  
                  return (
                    <div 
                      key={card.cardKey}
                      style={styles.strainCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Strain Image Placeholder */}
                      <div style={styles.strainImage}>
                        <div style={styles.strainImagePlaceholder}>
                          {isMarijuana ? '🌿' : '🟫'}
                        </div>
                      </div>
                      
                      {/* Strain Content */}
                      <div style={styles.strainContent}>
                        <h3 style={styles.strainName}>
                          {card.strain_name}
                        </h3>
                        
                        <div style={styles.weightBadge}>
                          {card.weight}g Verpackung
                        </div>
                        
                        <div style={{
                          ...styles.strainType,
                          ...(isMarijuana ? styles.strainTypeMarijuana : styles.strainTypeHashish)
                        }}>
                          {card.product_type_display}
                        </div>
                        
                        <div style={styles.strainInfo}>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>THC-Gehalt:</span>
                            <span style={styles.infoValue}>{card.avg_thc_content}%</span>
                          </div>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Verfügbar:</span>
                            <span style={styles.infoValue}>{card.unit_count} Stück</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div style={styles.actionButtons}>
                        <button
                          style={{
                            ...styles.actionButton,
                            backgroundColor: isSelected ? '#28a745' : '#4a934a'
                          }}
                          onClick={() => card.first_unit && handleAddUnit(card)}
                          disabled={isSelected || !card.first_unit}
                          onMouseEnter={(e) => {
                            if (!isSelected && card.first_unit) {
                              e.target.style.backgroundColor = '#3d7a3d'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && card.first_unit) {
                              e.target.style.backgroundColor = '#4a934a'
                            }
                          }}
                        >
                          {isSelected ? `✓ ${card.weight}g im Warenkorb` : `${card.weight}g in den Warenkorb`}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Load More / Infinite Scroll Indicator */}
              {hasMore && (
                <div style={styles.loadMoreContainer}>
                  {loadingMore ? (
                    <div>🔄 Weitere Sorten werden geladen...</div>
                  ) : (
                    <button
                      style={styles.loadMoreButton}
                      onClick={loadMoreCards}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#3d7a3d'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#4a934a'}
                    >
                      Weitere Sorten laden ({strainCards.length} von {totalCount})
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.stepHistory}>
            {STEPS.map((step, index) => (
              <div key={index} style={styles.stepItem}>
                <div style={{
                  ...styles.stepNumber,
                  ...(index < 1 ? styles.stepNumberCompleted : 
                      index === 1 ? styles.stepNumberActive : {})
                }}>
                  {index < 1 ? '✓' : index + 1}
                </div>
                <span style={{
                  color: index <= 1 ? '#2c3e50' : '#6c757d',
                  fontWeight: index === 1 ? 600 : 400
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}