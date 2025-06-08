// frontend/src/apps/trackandtrace/utils/cannabisLimits.js

/**
 * Cannabis-Limit-Helper Funktionen
 * Behandelt alle Limit-bezogenen Berechnungen und Validierungen
 */

// Konstanten für Cannabis-Limits
export const CANNABIS_LIMITS = {
  DAILY_LIMIT: 25.0, // Gramm pro Tag für alle Altersklassen
  MONTHLY_LIMIT_U21: 30.0, // Gramm pro Monat für unter 21-Jährige
  MONTHLY_LIMIT_21_PLUS: 50.0, // Gramm pro Monat für 21+ Jährige
  MAX_THC_U21: 10.0 // Maximaler THC-Gehalt in % für unter 21-Jährige
}

/**
 * Berechnet das Alter basierend auf dem Geburtsdatum
 * @param {string|Date} birthdate - Geburtsdatum
 * @returns {number|null} Alter in Jahren oder null
 */
export const calculateAge = (birthdate) => {
  if (!birthdate) return null
  
  const birth = new Date(birthdate)
  const today = new Date()
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Bestimmt die Altersklasse eines Mitglieds
 * @param {number|null} age - Alter des Mitglieds
 * @returns {string} Altersklasse ("18+" oder "21+")
 */
export const getAgeClass = (age) => {
  if (!age || age < 18) return "21+" // Default für fehlende Daten
  return age < 21 ? "18+" : "21+"
}

/**
 * Gibt die Limits für eine bestimmte Altersklasse zurück
 * @param {string} ageClass - Altersklasse ("18+" oder "21+")
 * @returns {Object} Limit-Objekt mit daily, monthly und maxThc
 */
export const getLimitsForAgeClass = (ageClass) => {
  const isU21 = ageClass === "18+"
  
  return {
    daily: CANNABIS_LIMITS.DAILY_LIMIT,
    monthly: isU21 ? CANNABIS_LIMITS.MONTHLY_LIMIT_U21 : CANNABIS_LIMITS.MONTHLY_LIMIT_21_PLUS,
    maxThc: isU21 ? CANNABIS_LIMITS.MAX_THC_U21 : null
  }
}

/**
 * Prüft, ob eine Einheit für einen U21-Empfänger geeignet ist
 * @param {Object} unit - Verpackungseinheit
 * @param {boolean} isU21 - Ist der Empfänger unter 21?
 * @returns {boolean} True wenn geeignet
 */
export const isUnitSuitableForRecipient = (unit, isU21) => {
  if (!isU21) return true // Keine Beschränkungen für 21+
  
  const thcContent = unit?.batch?.lab_testing_batch?.thc_content
  if (!thcContent) return true // Keine THC-Angabe = erlaubt
  
  return parseFloat(thcContent) <= CANNABIS_LIMITS.MAX_THC_U21
}

/**
 * Filtert Einheiten basierend auf THC-Limit für U21
 * @param {Array} units - Array von Verpackungseinheiten
 * @param {boolean} isU21 - Ist der Empfänger unter 21?
 * @returns {Array} Gefilterte Einheiten
 */
export const filterUnitsByThcLimit = (units, isU21) => {
  if (!isU21) return units
  
  return units.filter(unit => isUnitSuitableForRecipient(unit, isU21))
}

/**
 * Berechnet den Verbrauchsprozentsatz
 * @param {number} consumed - Verbrauchte Menge
 * @param {number} limit - Limit
 * @returns {number} Prozentsatz (0-100)
 */
export const calculateConsumptionPercentage = (consumed, limit) => {
  if (!limit || limit <= 0) return 0
  return Math.min(100, (consumed / limit) * 100)
}

/**
 * Gibt die Farbe basierend auf dem Verbrauchsprozentsatz zurück
 * @param {number} percentage - Verbrauchsprozentsatz
 * @returns {string} Material-UI Farbname
 */
export const getConsumptionColor = (percentage) => {
  if (percentage >= 100) return 'error'
  if (percentage >= 80) return 'warning'
  if (percentage >= 60) return 'info'
  return 'success'
}

/**
 * Formatiert Gewichtsangaben
 * @param {number} weight - Gewicht in Gramm
 * @param {number} decimals - Anzahl Dezimalstellen (default: 2)
 * @returns {string} Formatiertes Gewicht
 */
export const formatWeight = (weight, decimals = 2) => {
  return `${parseFloat(weight || 0).toFixed(decimals)}g`
}

/**
 * Formatiert THC-Prozentangaben
 * @param {number} thc - THC-Gehalt
 * @returns {string} Formatierter THC-Wert
 */
export const formatThc = (thc) => {
  if (thc === null || thc === undefined) return 'k.A.'
  return `${parseFloat(thc).toFixed(1)}%`
}

/**
 * Validiert eine geplante Ausgabe gegen die Limits
 * @param {Object} consumption - Aktueller Verbrauch {daily, monthly}
 * @param {Object} limits - Gültige Limits {daily, monthly, maxThc}
 * @param {number} additionalWeight - Zusätzliches Gewicht
 * @param {Array} selectedUnits - Ausgewählte Einheiten (für THC-Check)
 * @returns {Object} Validierungsergebnis
 */
export const validateDistribution = (consumption, limits, additionalWeight, selectedUnits = []) => {
  const newDailyTotal = (consumption.daily || 0) + additionalWeight
  const newMonthlyTotal = (consumption.monthly || 0) + additionalWeight
  
  const violations = {
    exceedsDailyLimit: newDailyTotal > limits.daily,
    exceedsMonthlyLimit: newMonthlyTotal > limits.monthly,
    thcViolations: []
  }
  
  // THC-Prüfung wenn maxThc gesetzt ist (U21)
  if (limits.maxThc) {
    selectedUnits.forEach(unit => {
      const thcContent = unit?.batch?.lab_testing_batch?.thc_content
      if (thcContent && parseFloat(thcContent) > limits.maxThc) {
        violations.thcViolations.push({
          unitId: unit.id,
          unitNumber: unit.batch_number,
          thcContent: parseFloat(thcContent),
          strain: unit.batch?.source_strain || 'Unbekannt'
        })
      }
    })
  }
  
  return {
    isValid: !violations.exceedsDailyLimit && 
             !violations.exceedsMonthlyLimit && 
             violations.thcViolations.length === 0,
    violations,
    remaining: {
      daily: limits.daily - newDailyTotal,
      monthly: limits.monthly - newMonthlyTotal
    },
    newTotals: {
      daily: newDailyTotal,
      monthly: newMonthlyTotal
    }
  }
}

/**
 * Erstellt eine Warnmeldung basierend auf Validierungsfehlern
 * @param {Object} violations - Validierungsfehler
 * @param {Object} remaining - Verbleibende Mengen
 * @returns {Array} Array von Warnmeldungen
 */
export const createWarningMessages = (violations, remaining) => {
  const messages = []
  
  if (violations.exceedsDailyLimit) {
    messages.push(`Tageslimit überschritten! Noch verfügbar: ${formatWeight(Math.abs(remaining.daily))}`)
  }
  
  if (violations.exceedsMonthlyLimit) {
    messages.push(`Monatslimit überschritten! Noch verfügbar: ${formatWeight(Math.abs(remaining.monthly))}`)
  }
  
  if (violations.thcViolations.length > 0) {
    const count = violations.thcViolations.length
    messages.push(`${count} Produkt${count > 1 ? 'e' : ''} überschreitet THC-Limit von 10% für U21-Mitglieder`)
  }
  
  return messages
}

/**
 * Berechnet Statistiken für ausgewählte Einheiten
 * @param {Array} units - Array von Verpackungseinheiten
 * @returns {Object} Statistik-Objekt
 */
export const calculateUnitStatistics = (units) => {
  const stats = {
    totalWeight: 0,
    marijuanaCount: 0,
    marijuanaWeight: 0,
    hashishCount: 0,
    hashishWeight: 0,
    averageThc: null,
    maxThc: 0,
    minThc: null
  }
  
  const thcValues = []
  
  units.forEach(unit => {
    const weight = parseFloat(unit.weight || 0)
    stats.totalWeight += weight
    
    const productType = unit.batch?.product_type
    if (productType === 'marijuana') {
      stats.marijuanaCount++
      stats.marijuanaWeight += weight
    } else if (productType === 'hashish') {
      stats.hashishCount++
      stats.hashishWeight += weight
    }
    
    const thc = unit.batch?.lab_testing_batch?.thc_content
    if (thc !== null && thc !== undefined) {
      const thcValue = parseFloat(thc)
      thcValues.push(thcValue)
      stats.maxThc = Math.max(stats.maxThc, thcValue)
      stats.minThc = stats.minThc === null ? thcValue : Math.min(stats.minThc, thcValue)
    }
  })
  
  if (thcValues.length > 0) {
    stats.averageThc = thcValues.reduce((sum, val) => sum + val, 0) / thcValues.length
  }
  
  return stats
}