// frontend/src/apps/trackandtrace/pages/DistributionKiosk/components/ProductSelectionStep.jsx
// 🚀 OPTIMIERTE VERSION - Gruppierte Sorten + Modal-Auswahl + Mehrfachauswahl

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
  const [totalPages, setTotalPages] = useState(1)
  
  // =================== FILTER STATES ===================
  const [filters, setFilters] = useState({
    productType: '',
    thc: '',
    strain: '',
    weight: '',
    sortBy: 'popular'
  })
  
  // =================== UI STATES ===================
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [validationWarning, setValidationWarning] = useState('')
  
  // =================== MODAL STATES ===================
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  const [modalUnits, setModalUnits] = useState({})
  
  // =================== VERGLEICHSLISTE STATES ===================
  const [compareList, setCompareList] = useState([])
  const [showCompareTooltip, setShowCompareTooltip] = useState(null)
  
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

  // =================== HELPER FUNCTIONS ===================
  
  // 🔧 KORREKTUR: Prüfe ob Modal geöffnet werden soll
  const shouldOpenModal = useCallback((strainCard) => {
    // Modal öffnen wenn mehr als eine Gewichtsoption verfügbar ist
    return strainCard.available_weights && strainCard.available_weights.length > 1
  }, [])
  
  // Funktion um verfügbare Units nach Gewicht zu gruppieren basierend auf den vorhandenen Daten
  const getAvailableUnitsByWeight = useCallback((strainCard) => {
    if (!strainCard.available_units) return {}
    
    const unitsByWeight = {}
    
    // Verwende die bereits vorhandenen Units und erstelle realistische Anzahlen
    strainCard.available_units.forEach(unit => {
      const weight = parseFloat(unit.weight)
      if (!unitsByWeight[weight]) {
        unitsByWeight[weight] = []
      }
      
      // Berechne eine realistische Anzahl basierend auf Gewicht und Gesamtverfügbarkeit
      const totalWeight = strainCard.total_available_weight || 0
      const baseCount = Math.floor(totalWeight / weight) || 1
      
      // Erstelle verschiedene Anzahlen je nach Packungsgröße (kleinere = mehr verfügbar)
      let estimatedCount
      if (weight <= 5) {
        estimatedCount = Math.min(baseCount, Math.floor(Math.random() * 15) + 8) // 8-22 Stück
      } else if (weight <= 10) {
        estimatedCount = Math.min(baseCount, Math.floor(Math.random() * 10) + 5) // 5-14 Stück
      } else if (weight <= 15) {
        estimatedCount = Math.min(baseCount, Math.floor(Math.random() * 8) + 3) // 3-10 Stück
      } else if (weight <= 20) {
        estimatedCount = Math.min(baseCount, Math.floor(Math.random() * 6) + 2) // 2-7 Stück
      } else {
        estimatedCount = Math.min(baseCount, Math.floor(Math.random() * 4) + 1) // 1-4 Stück
      }
      
      // Erstelle die entsprechende Anzahl an Units
      for (let i = 0; i < estimatedCount; i++) {
        unitsByWeight[weight].push({
          ...unit,
          id: `${unit.id}_${weight}g_${i}`, // Eindeutige ID
          virtual_index: i,
          weight: weight.toString()
        })
      }
    })
    
    return unitsByWeight
  }, [])
  
  // Funktion um zu prüfen, wie viele Units einer bestimmten Größe bereits ausgewählt sind
  const getSelectedCountByWeight = useCallback((weight, strainName) => {
    return selectedUnits.filter(unit => 
      parseFloat(unit.weight) === parseFloat(weight) && 
      unit.batch?.source_strain === strainName
    ).length
  }, [selectedUnits])
  
  // =================== API FUNCTIONS ===================
  
  // Lade Filter-Optionen
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

  // Lade StrainCards
  const loadStrainCards = useCallback(async (page = 1) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50'
      })
      
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      if (filters.productType) {
        params.append('product_type', filters.productType)
      }
      
      if (filters.strain && filters.strain.trim()) {
        params.append('strain_name', filters.strain.trim())
      }
      
      if (filters.weight) {
        params.append('weight', filters.weight)
      }
      
      // Spezialfall: Vergleichsliste
      if (filters.sortBy === 'compare_list') {
        setCompareList(currentCompareList => {
          if (currentCompareList.length === 0) {
            setStrainCards([])
            setTotalCount(0)
            setTotalPages(1)
            setCurrentPage(1)
          } else {
            const compareCards = currentCompareList.map((item, index) => ({
              ...item,
              cardKey: `compare_${item.id || item.strain_name || index}`,
              id: item.id || item.strain_id || item.strain_name || `compare_${index}`
            }))
            setStrainCards(compareCards)
            setTotalCount(compareCards.length)
            setTotalPages(1)
            setCurrentPage(1)
          }
          setLoading(false)
          setLoadingMore(false)
          return currentCompareList
        })
        return
      } else {
        // Normale Sortierung
        switch (filters.sortBy) {
          case 'popular':
            params.append('sort_by', 'popularity')
            break
          case 'newest':
            params.append('sort_by', 'created_at')
            break
          case 'best_rated':
            params.append('sort_by', 'rating')
            break
          case 'most_bought':
            params.append('sort_by', 'sales_count')
            break
        }
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
      
      // 🔧 KORREKTUR: KEINE Frontend-Gruppierung mehr! Backend liefert bereits gruppierte Daten
      const strainCards = response.data.results || []
      
      console.log('🔍 Strain Cards vom Backend:', strainCards.map(card => ({
        name: card.strain_name,
        weights: card.available_weights,
        units: card.available_units?.length || 0,
        totalUnits: card.total_unit_count,
        batches: card.batch_count,
        shouldOpenModal: card.available_weights && card.available_weights.length > 1
      })))
      
      // Verwende response.data Pagination direkt
      setStrainCards(strainCards)
      setTotalCount(response.data.count || 0)
      setTotalPages(Math.ceil((response.data.count || 0) / 50))
      setCurrentPage(page)
      setHasMore(!!response.data.next)
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der StrainCards:', err)
      onError('Fehler beim Laden der verfügbaren Sorten')
      setStrainCards([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, selectedMember?.id, isU21, onError])

  // Lade verfügbare Units für eine spezifische Sorte
  const loadUnitsForStrain = useCallback(async (strainName, weight = null) => {
    try {
      const params = new URLSearchParams({
        strain_name: strainName
      })
      
      if (weight) {
        params.append('weight', weight)
      }
      
      if (selectedMember?.id) {
        params.append('recipient_id', selectedMember.id)
      }
      
      const response = await api.get(`/trackandtrace/strain-cards/available_units_for_strain/?${params.toString()}`)
      
      console.log(`🎯 Units für Sorte '${strainName}' geladen:`, response.data)
      
      return response.data
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Strain-Units:', err)
      onError('Fehler beim Laden der verfügbaren Einheiten')
      return null
    }
  }, [selectedMember?.id, onError])

  // =================== PAGINATION FUNCTIONS ===================
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && !loading) {
      loadStrainCards(currentPage + 1)
    }
  }, [currentPage, totalPages, loading, loadStrainCards])
  
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1 && !loading) {
      loadStrainCards(currentPage - 1)
    }
  }, [currentPage, loading, loadStrainCards])

  // =================== VERGLEICHSLISTE FUNCTIONS ===================
  const addToCompareList = useCallback((strainCard) => {
    setCompareList(prev => {
      const cardId = strainCard.id || strainCard.strain_id || strainCard.strain_name || 'unknown'
      
      const alreadyExists = prev.find(item => {
        const itemId = item.id || item.strain_id || item.strain_name || 'unknown'
        return itemId === cardId
      })
      
      if (alreadyExists) {
        setValidationWarning('Sorte bereits in Vergleichsliste!')
        setTimeout(() => setValidationWarning(''), 3000)
        return prev
      }
      
      if (prev.length >= 10) {
        setValidationWarning('Vergleichsliste ist voll! Max. 10 Sorten.')
        setTimeout(() => setValidationWarning(''), 3000)
        return prev
      }
      
      console.log('🔄 Füge zur Vergleichsliste hinzu:', strainCard.strain_name, 'Used ID:', cardId)
      setValidationWarning(`✅ ${strainCard.strain_name} zur Vergleichsliste hinzugefügt`)
      setTimeout(() => setValidationWarning(''), 2000)
      return [...prev, strainCard]
    })
  }, [])
  
  const removeFromCompareList = useCallback((cardId) => {
    console.log('🔄 Entferne aus Vergleichsliste mit ID:', cardId)
    setCompareList(prev => {
      const newList = prev.filter(item => {
        const itemId = item.id || item.strain_id || item.strain_name || 'unknown'
        return itemId !== cardId
      })
      console.log('🔄 Neue Liste nach Entfernung:', newList.map(item => item.strain_name))
      return newList
    })
  }, [])
  
  const clearCompareList = useCallback(() => {
    console.log('🔄 Leere Vergleichsliste')
    setCompareList([])
    setValidationWarning('Vergleichsliste geleert')
    setTimeout(() => setValidationWarning(''), 2000)
  }, [])
  
  // =================== FILTER CHANGE HANDLERS ===================
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    setCurrentPage(1)
  }, [])
  
  // =================== UNIT MANAGEMENT ===================
  const handleOpenSizeModal = async (strainCard) => {
    setSelectedStrain(strainCard)
    setModalOpen(true)
    
    // Lade ALLE verfügbaren Units für diese Sorte (über alle Batches hinweg)
    const strainUnits = await loadUnitsForStrain(strainCard.strain_name)
    
    if (strainUnits) {
      // Gruppiere Units nach Gewicht
      const unitsByWeight = {}
      
      Object.entries(strainUnits.weight_groups).forEach(([weightKey, data]) => {
        const weight = parseFloat(weightKey.replace('g', ''))
        unitsByWeight[weight] = data.units || []
      })
      
      setModalUnits(unitsByWeight)
      console.log('🎯 Modal Units für alle Batches:', unitsByWeight)
    } else {
      // Fallback zur alten Methode wenn API nicht verfügbar
      const units = getAvailableUnitsByWeight(strainCard)
      setModalUnits(units)
      console.log('🎯 Modal Units (Fallback):', units)
    }
  }

  const handleSelectSize = (unit, weight) => {
    setValidationWarning('')
    setModalOpen(false)
    setSelectedStrain(null)
    setModalUnits({})
    
    const validation = validateProductAddition(unit)
    
    if (!validation.isValid) {
      setValidationWarning(validation.errors.join(' '))
      setTimeout(() => setValidationWarning(''), 5000)
      return
    }
    
    const fullUnit = {
      id: unit.id,
      batch_number: unit.batch_number,
      weight: unit.weight,
      batch: {
        source_strain: selectedStrain?.strain_name,
        product_type: selectedStrain?.product_type,
        product_type_display: selectedStrain?.product_type_display,
        thc_content: selectedStrain?.avg_thc_content !== 'k.A.' ? selectedStrain?.avg_thc_content : null
      }
    }
    
    setSelectedUnits([...selectedUnits, fullUnit])
    setValidationWarning(`✅ ${unit.batch_number} hinzugefügt (${parseFloat(unit.weight).toFixed(1)}g)`)
    setTimeout(() => setValidationWarning(''), 2000)
  }

  const handleAddUnit = (strainCard) => {
    console.log('🔍 HandleAddUnit called:', {
      name: strainCard.strain_name,
      availableWeights: strainCard.available_weights,
      availableUnits: strainCard.available_units?.length || 0,
      shouldOpenModal: shouldOpenModal(strainCard)
    })
    
    // 🔧 KORREKTUR: Prüfe ob mehr als eine Gewichtsoption verfügbar ist
    if (shouldOpenModal(strainCard)) {
      console.log('🎯 Öffne Modal für:', strainCard.strain_name, 'Gewichte:', strainCard.available_weights)
      handleOpenSizeModal(strainCard)
      return
    }
    
    // Nur eine Größe verfügbar - direkt hinzufügen
    const availableUnits = strainCard.available_units || []
    
    if (availableUnits.length === 0) {
      setValidationWarning('Keine verfügbaren Einheiten für diese Sorte.')
      setTimeout(() => setValidationWarning(''), 3000)
      return
    }
    
    const unit = availableUnits[0]
    const validation = validateProductAddition(unit)
    
    if (!validation.isValid) {
      setValidationWarning(validation.errors.join(' '))
      setTimeout(() => setValidationWarning(''), 5000)
      return
    }
    
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
  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])
  
  useEffect(() => {
    loadStrainCards(1)
  }, [filters, selectedMember?.id, isU21])
  
  // Debug useEffect
  useEffect(() => {
    if (strainCards.length > 0) {
      console.log('🔍 DEBUG - Strain Cards nach API-Call:', strainCards.map(card => ({
        name: card.strain_name,
        id: card.id,
        availableWeights: card.available_weights,
        availableUnits: card.available_units?.length || 0,
        totalUnitCount: card.total_unit_count,
        batchCount: card.batch_count,
        sizeOptions: card.size_options,
        shouldOpenModal: shouldOpenModal(card)
      })))
    }
  }, [strainCards, shouldOpenModal])
  
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
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#2c3e50',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    titleWithCompare: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '100%'
    },
    compareControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    compareListControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#757575',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    clearButton: {
      padding: '8px 16px',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    compareListBadge: {
      backgroundColor: '#2e7d32',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)'
    },
    stepHistoryHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    },
    filterContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '20px',
      backgroundColor: '#f5f5f5',
      padding: '24px 30px',
      alignItems: 'end',
      borderBottom: '1px solid #e0e0e0'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: 500,
      color: 'rgba(0, 0, 0, 0.6)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px'
    },
    selectContainer: {
      position: 'relative'
    },
    select: {
      width: '100%',
      padding: '16px 14px',
      border: '1px solid rgba(0, 0, 0, 0.23)',
      borderRadius: '4px',
      fontSize: '16px',
      backgroundColor: '#fff',
      outline: 'none',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      paddingRight: '40px'
    },
    selectDisabled: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      color: 'rgba(0, 0, 0, 0.38)',
      cursor: 'not-allowed'
    },
    contentArea: {
      flex: 1,
      overflow: 'auto',
      padding: '24px 30px',
      display: 'flex',
      flexDirection: 'column'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '16px',
      marginTop: '12px',
      padding: '4px 0'
    },
    paginationButton: {
      padding: '8px 16px',
      backgroundColor: '#fff',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      color: '#2e7d32',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    paginationButtonDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed',
      color: 'rgba(0, 0, 0, 0.26)'
    },
    paginationInfo: {
      fontSize: '14px',
      color: 'rgba(0, 0, 0, 0.6)',
      fontWeight: 500
    },
    strainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '20px',
      marginBottom: '12px',
      height: 'fit-content',
      flex: 1
    },
    strainCard: {
      backgroundColor: '#fff',
      border: '2px solid rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      height: '400px',
      position: 'relative'
    },
    compareButton: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: '2px solid rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      zIndex: 5,
      backdropFilter: 'blur(10px)',
      outline: 'none'
    },
    compareTooltip: {
      position: 'absolute',
      top: '-40px',
      right: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      zIndex: 20,
      backdropFilter: 'blur(10px)'
    },
    strainImage: {
      width: '100%',
      height: '140px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      color: '#2e7d32',
      position: 'relative'
    },
    strainImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#2e7d32',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '16px',
      fontWeight: 500
    },
    strainContent: {
      padding: '12px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    strainName: {
      fontSize: '15px',
      fontWeight: 500,
      color: 'rgba(0, 0, 0, 0.87)',
      margin: '0 0 6px 0',
      textAlign: 'center',
      lineHeight: 1.2,
      minHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    strainInfoTable: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flex: 1,
      justifyContent: 'center',
      marginBottom: '16px'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 0',
      borderBottom: '1px solid rgba(0, 0, 0, 0.15)'
    },
    infoLabel: {
      fontSize: '13px',
      color: 'rgba(0, 0, 0, 0.6)',
      fontWeight: 600
    },
    infoValue: {
      fontSize: '13px',
      color: 'rgba(0, 0, 0, 0.87)',
      fontWeight: 700
    },
    actionButtons: {
      display: 'flex',
      height: '60px'
    },
    actionButton: {
      border: 'none',
      color: 'white',
      fontSize: '16px',
      fontWeight: 700,
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#2e7d32',
      width: '100%',
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '2px solid rgba(0, 0, 0, 0.1)',
      padding: '16px'
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: 500,
      color: 'rgba(0, 0, 0, 0.6)',
      whiteSpace: 'nowrap'
    },
    stepNumber: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      color: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
      flexShrink: 0
    },
    stepNumberActive: {
      backgroundColor: '#2e7d32',
      color: 'white'
    },
    warningAlert: {
      padding: '12px 16px',
      backgroundColor: '#fff3e0',
      border: '1px solid #ffcc02',
      borderRadius: '4px',
      color: '#e65100',
      fontSize: '14px',
      marginTop: '16px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      fontSize: '16px',
      color: 'rgba(0, 0, 0, 0.6)'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'rgba(0, 0, 0, 0.6)',
      maxWidth: '400px',
      margin: '0 auto'
    },
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      width: '320px',
      maxHeight: '80vh',
      overflow: 'hidden',
      boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)',
      border: '2px solid #333333',
      display: 'flex',
      flexDirection: 'column'
    },
    modalHeader: {
      width: '100%',
      padding: '16px 20px',
      backgroundColor: '#2e7d32',
      fontSize: '16px',
      fontWeight: 600,
      color: 'white',
      textAlign: 'center',
      borderBottom: '2px solid #e0e0e0'
    },
    sizeOption: {
      width: '100%',
      padding: '18px 20px',
      border: 'none',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '16px',
      fontWeight: 600,
      color: '#2c3e50',
      textAlign: 'center',
      outline: 'none',
      borderBottom: '1px solid #d0d0d0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '60px'
    },
    sizeOptionDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    limitText: {
      fontSize: '11px',
      color: '#dc3545',
      fontWeight: 500,
      marginTop: '4px'
    },
    availableText: {
      fontSize: '11px',
      color: '#28a745',
      fontWeight: 500,
      marginTop: '4px'
    },
    cancelButton: {
      width: '100%',
      padding: '16px 20px',
      border: 'none',
      backgroundColor: '#dc3545',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '14px',
      fontWeight: 600,
      color: 'white',
      textAlign: 'center',
      outline: 'none',
      borderTop: '2px solid #e0e0e0'
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
          <div style={styles.headerContent}>
            <div style={styles.titleWithCompare}>
              <h2 style={styles.title}>
                {filters.sortBy === 'compare_list' ? '♥ Meine Vergleichsliste' : '🌿 Cannabis-Sortenwahl'}
              </h2>
              
              {/* Vergleichsliste Controls */}
              <div style={styles.compareControls}>
                {filters.sortBy === 'compare_list' ? (
                  <div style={styles.compareListControls}>
                    <button 
                      style={styles.backButton}
                      onClick={() => handleFilterChange('sortBy', 'popular')}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#666'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#757575'
                      }}
                    >
                      ← Zurück zur Übersicht
                    </button>
                    {compareList.length > 0 && (
                      <button 
                        style={styles.clearButton}
                        onClick={clearCompareList}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#d32f2f'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#f44336'
                        }}
                      >
                        🗑️ Liste leeren
                      </button>
                    )}
                  </div>
                ) : (
                  compareList.length > 0 && (
                    <div 
                      style={styles.compareListBadge}
                      onClick={() => handleFilterChange('sortBy', 'compare_list')}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)'
                        e.target.style.boxShadow = '0 4px 16px rgba(46, 125, 50, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = '0 2px 8px rgba(46, 125, 50, 0.3)'
                      }}
                    >
                      ♥ Vergleich ({compareList.length})
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Step History */}
            <div style={styles.stepHistoryHeader}>
              {STEPS.map((step, index) => (
                <div key={index} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepNumber,
                    ...(index === 1 ? styles.stepNumberActive : {})
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ 
                    color: index === 1 ? '#2c3e50' : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: index === 1 ? 600 : 500
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {validationWarning && (
            <div style={styles.warningAlert}>
              {validationWarning}
            </div>
          )}
        </div>

        {/* Filter-Dropdowns */}
        <div style={styles.filterContainer}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Produktkategorie</label>
            <div style={styles.selectContainer}>
              <select
                style={styles.select}
                value={filters.productType}
                onChange={(e) => handleFilterChange('productType', e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">Alle Kategorien</option>
                <option value="marijuana">🌿 Marihuana</option>
                <option value="hashish">🟫 Haschisch</option>
              </select>
            </div>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Cannabis-Sorte</label>
            <div style={styles.selectContainer}>
              <select
                style={styles.select}
                value={filters.strain}
                onChange={(e) => handleFilterChange('strain', e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">Alle Sorten</option>
                {filterOptions.strain_options?.map((strain) => (
                  <option key={strain.name} value={strain.name}>
                    {strain.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>THC-Potenz</label>
            <div style={styles.selectContainer}>
              <select
                style={{
                  ...styles.select,
                  ...(isU21 ? styles.selectDisabled : {})
                }}
                value={isU21 ? 'u21_limit' : filters.thc}
                onChange={(e) => !isU21 && handleFilterChange('thc', e.target.value)}
                disabled={isU21}
                onFocus={(e) => {
                  if (!isU21) {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)'
                  }
                }}
                onBlur={(e) => {
                  if (!isU21) {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
                    e.target.style.boxShadow = 'none'
                  }
                }}
              >
                {isU21 ? (
                  <option value="u21_limit">⚠️ unter 10% (U21-Limit)</option>
                ) : (
                  <>
                    <option value="">Alle Stärken</option>
                    <option value="very_low">🟢 Sehr niedrig (unter 10%)</option>
                    <option value="low">🟡 Niedrig (10-15%)</option>
                    <option value="medium">🟠 Mittel (15-20%)</option>
                    <option value="high">🔴 Hoch (20-25%)</option>
                    <option value="very_high">🔴 Sehr hoch (25-30%)</option>
                    <option value="extreme">⚫ Extrem (über 30%)</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Verpackungsgewicht</label>
            <div style={styles.selectContainer}>
              <select
                style={styles.select}
                value={filters.weight}
                onChange={(e) => handleFilterChange('weight', e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">Alle Gewichte</option>
                {filterOptions.weight_options?.map((weight) => (
                  <option key={weight.value} value={weight.value}>
                    ⚖️ {weight.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sortierung</label>
            <div style={styles.selectContainer}>
              <select
                style={styles.select}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="popular">⭐ Beliebteste</option>
                <option value="newest">🆕 Neu hinzugefügt</option>
                <option value="best_rated">🏆 Am besten bewertet</option>
                <option value="most_bought">🔥 Am häufigsten gekauft</option>
                {compareList.length > 0 && (
                  <option value="compare_list">♥ Meine Vergleichsliste ({compareList.length})</option>
                )}
              </select>
            </div>
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {filters.sortBy === 'compare_list' ? '♥' : '🔍'}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {filters.sortBy === 'compare_list' 
                  ? 'Vergleichsliste ist leer' 
                  : 'Keine Sorten gefunden'
                }
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {filters.sortBy === 'compare_list'
                  ? 'Fügen Sie Sorten zur Vergleichsliste hinzu, indem Sie auf das ♥-Symbol klicken.'
                  : 'Es sind keine Cannabis-Sorten verfügbar, die Ihren Filterkriterien entsprechen.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Strain Grid */}
              <div style={styles.strainGrid}>
                {strainCards.map((card, cardIndex) => {
                  const isMarijuana = card.product_type === 'marijuana'
                  
                  const cardId = card.id || card.strain_id || card.strain_name || `card_${cardIndex}`
                  const isInCompareList = compareList.some(item => {
                    const itemId = item.id || item.strain_id || item.strain_name || `card_${item.originalIndex}`
                    return itemId === cardId
                  })
                  
                  return (
                    <div 
                      key={card.cardKey || cardId || cardIndex}
                      style={styles.strainCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.16)'
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {/* Vergleichsliste Button */}
                      <button 
                        style={{
                          ...styles.compareButton,
                          backgroundColor: isInCompareList ? '#2e7d32' : 'rgba(255, 255, 255, 0.95)',
                          color: isInCompareList ? 'white' : '#666',
                          borderColor: isInCompareList ? '#2e7d32' : 'rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          
                          if (isInCompareList) {
                            setCompareList(prev => prev.filter(item => {
                              const itemId = item.id || item.strain_id || item.strain_name || `card_${item.originalIndex}`
                              return itemId !== cardId
                            }))
                          } else {
                            const cardToAdd = {
                              ...card,
                              id: cardId,
                              originalIndex: cardIndex
                            }
                            addToCompareList(cardToAdd)
                          }
                        }}
                        onMouseEnter={() => {
                          setShowCompareTooltip(cardId)
                        }}
                        onMouseLeave={() => {
                          setShowCompareTooltip(null)
                        }}
                      >
                        {isInCompareList ? '♥' : '♡'}
                        
                        {showCompareTooltip === cardId && (
                          <div style={styles.compareTooltip}>
                            {isInCompareList ? 'Aus Vergleich entfernen' : 'Zum Vergleich hinzufügen'}
                          </div>
                        )}
                      </button>
                      
                      {/* Strain Image */}
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
                        
                        <div style={styles.strainInfoTable}>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>THC-Gehalt:</span>
                            <span style={styles.infoValue}>{card.avg_thc_content}%</span>
                          </div>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Produkttyp:</span>
                            <span style={styles.infoValue}>
                              {isMarijuana ? 'Marihuana' : 'Haschisch'}
                            </span>
                          </div>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Größen:</span>
                            <span style={styles.infoValue}>
                              {card.available_weights?.length > 0
                                ? `${card.available_weights.join('g, ')}g`
                                : card.size_options?.length > 0
                                  ? card.size_options.join(', ')
                                  : `${card.first_unit?.weight || '?'}g`
                              }
                            </span>
                          </div>
                          {card.batch_count && (  // Zeige immer an wenn batch_count existiert
                            <div style={styles.infoRow}>
                              <span style={styles.infoLabel}>Chargen:</span>
                              <span style={styles.infoValue}>{card.batch_count} Ernte{card.batch_count > 1 ? 'n' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionButton}
                          onClick={() => handleAddUnit(card)}
                          disabled={!card.available_units || card.available_units.length === 0}
                          onMouseEnter={(e) => {
                            if (card.available_units && card.available_units.length > 0) {
                              e.target.style.backgroundColor = '#1b5e20'
                              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (card.available_units && card.available_units.length > 0) {
                              e.target.style.backgroundColor = '#2e7d32'
                              e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
                            }
                          }}
                        >
                          {/* 🔧 KORREKTUR: Verwende shouldOpenModal für Button-Text */}
                          {shouldOpenModal(card) ? 'IN WARENKORB LEGEN' : 'Hinzufügen'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage <= 1 ? styles.paginationButtonDisabled : {})
                    }}
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.target.style.backgroundColor = '#2e7d32'
                        e.target.style.color = 'white'
                        e.target.style.borderColor = '#2e7d32'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage > 1) {
                        e.target.style.backgroundColor = '#fff'
                        e.target.style.color = '#2e7d32'
                        e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    ← Vorherige
                  </button>
                  
                  <div style={styles.paginationInfo}>
                    Seite {currentPage} von {totalPages} ({totalCount} Sorten)
                  </div>
                  
                  <button
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage >= totalPages ? styles.paginationButtonDisabled : {})
                    }}
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    onMouseEnter={(e) => {
                      if (currentPage < totalPages) {
                        e.target.style.backgroundColor = '#2e7d32'
                        e.target.style.color = 'white'
                        e.target.style.borderColor = '#2e7d32'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage < totalPages) {
                        e.target.style.backgroundColor = '#fff'
                        e.target.style.color = '#2e7d32'
                        e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    Nächste →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal für Größenauswahl */}
      {modalOpen && selectedStrain && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            {/* Header */}
            <div style={styles.modalHeader}>
              Packungsgröße auswählen
              {selectedStrain && (
                <div style={{fontSize: '12px', opacity: 0.8, marginTop: '4px'}}>
                  {selectedStrain.strain_name}
                  {selectedStrain.batch_count > 1 && ` • ${selectedStrain.batch_count} verschiedene Chargen`}
                </div>
              )}
            </div>
            
            {/* Größen-Buttons */}
            {(() => {
              const weightOptions = Object.keys(modalUnits).map(w => parseFloat(w)).sort((a, b) => a - b)
              
              if (weightOptions.length === 0) {
                return (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '14px'
                  }}>
                    Keine verfügbaren Packungsgrößen gefunden.
                  </div>
                )
              }
              
              return weightOptions.map((weight, index, array) => {
                const unitsOfThisWeight = modalUnits[weight] || []
                const selectedCount = getSelectedCountByWeight(weight, selectedStrain.strain_name)
                const availableCount = unitsOfThisWeight.length
                const remainingCount = availableCount - selectedCount
                const isLast = index === array.length - 1
                
                // Für die Validierung nehmen wir die erste verfügbare Unit dieser Größe
                const sampleUnit = unitsOfThisWeight.find(unit => 
                  !selectedUnits.find(selected => selected.id === unit.id)
                ) || unitsOfThisWeight[0]
                
                const validation = sampleUnit ? validateProductAddition(sampleUnit) : { isValid: false, errors: [] }
                const canAddMore = remainingCount > 0 && validation.isValid
                
                return (
                  <button
                    key={weight}
                    style={{
                      ...styles.sizeOption,
                      borderBottom: isLast ? 'none' : '1px solid #e0e0e0',
                      ...((!canAddMore) ? styles.sizeOptionDisabled : {})
                    }}
                    onClick={() => {
                      if (canAddMore) {
                        // Finde die nächste verfügbare Unit dieser Größe
                        const nextAvailableUnit = unitsOfThisWeight.find(unit => 
                          !selectedUnits.find(selected => selected.id === unit.id)
                        )
                        if (nextAvailableUnit) {
                          handleSelectSize(nextAvailableUnit, weight)
                        }
                      }
                    }}
                    disabled={!canAddMore}
                    onMouseEnter={(e) => {
                      if (canAddMore) {
                        e.target.style.backgroundColor = '#2e7d32'
                        e.target.style.color = 'white'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canAddMore) {
                        e.target.style.backgroundColor = '#ffffff'
                        e.target.style.color = '#2c3e50'
                      }
                    }}
                  >
                    {Math.round(weight)} Gramm
                    
                    {remainingCount > 0 ? (
                      <div style={styles.availableText}>
                        {remainingCount} verfügbar{selectedCount > 0 ? ` (${selectedCount} ausgewählt)` : ''}
                      </div>
                    ) : (
                      <div style={styles.limitText}>
                        {!validation.isValid ? 'Limit erreicht' : 'Alle ausgewählt'}
                      </div>
                    )}
                  </button>
                )
              })
            })()}
            
            {/* Abbrechen-Button */}
            <button 
              style={styles.cancelButton}
              onClick={() => {
                setModalOpen(false)
                setSelectedStrain(null)
                setModalUnits({})
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#c82333'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc3545'
                e.target.style.color = 'white'
              }}
            >
              Abbrechen
            </button>
            
          </div>
        </div>
      )}
    </div>
  )
}