// frontend/src/apps/trackandtrace/utils/cannabisLimitsApi.js

import api from '@/utils/api'

/**
 * API-Helper für Cannabis-Limit-bezogene Anfragen
 */

/**
 * Holt die Verbrauchsdaten eines Mitglieds
 * @param {string} memberId - UUID des Mitglieds
 * @returns {Promise<Object>} Verbrauchsdaten mit Limits
 */
export const getMemberConsumption = async (memberId) => {
  try {
    const response = await api.get(
      `/trackandtrace/distributions/member_consumption_summary/?member_id=${memberId}`
    )
    return response.data
  } catch (error) {
    console.error('Fehler beim Abrufen der Mitglieder-Verbrauchsdaten:', error)
    throw error
  }
}

/**
 * Validiert eine geplante Distribution gegen die Limits
 * @param {string} recipientId - UUID des Empfängers
 * @param {Array} selectedUnits - Array von ausgewählten Einheiten
 * @returns {Promise<Object>} Validierungsergebnis
 */
export const validateDistributionLimits = async (recipientId, selectedUnits) => {
  try {
    const response = await api.post('/trackandtrace/distributions/validate_distribution_limits/', {
      recipient_id: recipientId,
      selected_units: selectedUnits.map(unit => ({
        id: unit.id,
        weight: unit.weight
      }))
    })
    return response.data
  } catch (error) {
    console.error('Fehler bei der Limit-Validierung:', error)
    throw error
  }
}

/**
 * Holt verfügbare Einheiten mit optionalem Empfänger-Filter
 * @param {Object} params - Filter-Parameter
 * @param {string} params.recipientId - Optional: Empfänger-ID für THC-Filter
 * @param {string} params.productType - Optional: Produkttyp-Filter
 * @returns {Promise<Array>} Verfügbare Einheiten
 */
export const getAvailableUnits = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.recipientId) {
      queryParams.append('recipient_id', params.recipientId)
    }
    
    if (params.productType) {
      queryParams.append('product_type', params.productType)
    }
    
    const queryString = queryParams.toString()
    const url = `/trackandtrace/distributions/available_units/${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error('Fehler beim Abrufen verfügbarer Einheiten:', error)
    throw error
  }
}

/**
 * Prüft ob ein Mitglied U21 ist basierend auf der ID
 * @param {string} memberId - UUID des Mitglieds
 * @returns {Promise<Object>} Altersklassen-Information
 */
export const checkMemberAgeClass = async (memberId) => {
  try {
    // Nutze die member_consumption_summary, die bereits Altersinfos enthält
    const response = await getMemberConsumption(memberId)
    
    return {
      ageClass: response.member.age_class,
      age: response.member.age,
      isU21: response.member.age_class === "18+",
      limits: response.limits
    }
  } catch (error) {
    console.error('Fehler beim Prüfen der Altersklasse:', error)
    // Fallback-Werte bei Fehler
    return {
      ageClass: "21+",
      age: null,
      isU21: false,
      limits: {
        daily_limit: 25.0,
        monthly_limit: 50.0,
        max_thc_percentage: null
      }
    }
  }
}

/**
 * Erstellt eine neue Produktausgabe mit Limit-Validierung
 * @param {Object} distributionData - Ausgabedaten
 * @returns {Promise<Object>} Erstellte Ausgabe oder Fehler
 */
export const createDistribution = async (distributionData) => {
  try {
    const response = await api.post('/trackandtrace/distributions/', {
      distributor_id: distributionData.distributorId,
      recipient_id: distributionData.recipientId,
      packaging_unit_ids: distributionData.unitIds,
      notes: distributionData.notes,
      // Stelle sicher, dass das Datum timezone-aware ist
      distribution_date: distributionData.date || new Date().toISOString()
    })
    return response.data
  } catch (error) {
    // Backend gibt detaillierte Validierungsfehler zurück
    if (error.response?.data?.validation) {
      const validationError = new Error('Limit-Validierung fehlgeschlagen')
      validationError.validation = error.response.data.validation
      validationError.details = error.response.data.details
      throw validationError
    }
    throw error
  }
}

/**
 * Holt die Tages- und Monatsstatistiken für ein Mitglied
 * @param {string} memberId - UUID des Mitglieds
 * @param {Date} date - Optional: Datum für die Abfrage (default: heute)
 * @returns {Promise<Object>} Verbrauchsstatistiken
 */
export const getMemberConsumptionStats = async (memberId, date = new Date()) => {
  try {
    const response = await getMemberConsumption(memberId)
    
    // Extrahiere relevante Statistiken
    const { consumption, limits, member } = response
    
    return {
      member: {
        id: member.id,
        name: member.name,
        ageClass: member.age_class,
        isU21: member.age_class === "18+"
      },
      daily: {
        consumed: consumption.daily.consumed,
        remaining: consumption.daily.remaining,
        limit: limits.daily_limit,
        percentage: consumption.daily.percentage
      },
      monthly: {
        consumed: consumption.monthly.consumed,
        remaining: consumption.monthly.remaining,
        limit: limits.monthly_limit,
        percentage: consumption.monthly.percentage
      },
      thcLimit: limits.max_thc_percentage
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Verbrauchsstatistiken:', error)
    throw error
  }
}

/**
 * Cache für Mitglieder-Limits (um unnötige API-Calls zu vermeiden)
 */
const memberLimitsCache = new Map()

/**
 * Holt Mitglieder-Limits mit Cache
 * @param {string} memberId - UUID des Mitglieds
 * @param {boolean} forceRefresh - Cache ignorieren
 * @returns {Promise<Object>} Limits und Verbrauchsdaten
 */
export const getCachedMemberLimits = async (memberId, forceRefresh = false) => {
  const cacheKey = `${memberId}-${new Date().toDateString()}`
  
  if (!forceRefresh && memberLimitsCache.has(cacheKey)) {
    return memberLimitsCache.get(cacheKey)
  }
  
  const data = await getMemberConsumptionStats(memberId)
  memberLimitsCache.set(cacheKey, data)
  
  // Cache nach 5 Minuten löschen
  setTimeout(() => {
    memberLimitsCache.delete(cacheKey)
  }, 5 * 60 * 1000)
  
  return data
}

/**
 * Formatiert Validierungsfehler für die Anzeige
 * @param {Object} validationError - Fehler von der API
 * @returns {Object} Formatierte Fehlermeldungen
 */
export const formatValidationErrors = (validationError) => {
  const formatted = {
    title: 'Ausgabe nicht möglich',
    messages: [],
    severity: 'error'
  }
  
  if (validationError.details) {
    formatted.messages = validationError.details
  }
  
  if (validationError.validation) {
    const { violations, remaining } = validationError.validation
    
    if (violations.exceeds_daily_limit) {
      formatted.messages.push(
        `Tageslimit überschritten! Verfügbar: ${Math.abs(remaining.daily_remaining).toFixed(2)}g`
      )
    }
    
    if (violations.exceeds_monthly_limit) {
      formatted.messages.push(
        `Monatslimit überschritten! Verfügbar: ${Math.abs(remaining.monthly_remaining).toFixed(2)}g`
      )
    }
    
    if (violations.thc_violations?.length > 0) {
      const units = violations.thc_violations.map(v => v.unit_number).join(', ')
      formatted.messages.push(
        `THC-Limit überschritten für U21! Betroffene Einheiten: ${units}`
      )
    }
  }
  
  return formatted
}