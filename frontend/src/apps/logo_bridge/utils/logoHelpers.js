// frontend/src/apps/logo_bridge/utils/logoHelpers.js

/**
 * Formatiert einen Logo-Wert basierend auf dem Datentyp
 */
export function formatLogoValue(value, dataType, unit = '') {
  if (value === null || value === undefined) {
    return '-'
  }

  switch (dataType) {
    case 'bool':
      return value ? 'EIN' : 'AUS'
    
    case 'int':
      return `${value}${unit ? ' ' + unit : ''}`
    
    case 'float':
      // Auf 2 Nachkommastellen runden
      return `${parseFloat(value).toFixed(2)}${unit ? ' ' + unit : ''}`
    
    case 'string':
      return value
    
    default:
      return `${value}${unit ? ' ' + unit : ''}`
  }
}

/**
 * Validiert eine Logo-Adresse basierend auf dem Protokoll
 */
export function validateLogoAddress(address, protocol) {
  if (!address) return false

  if (protocol === 'modbus_tcp') {
    // Modbus-Adressen: 00001-09999, 10001-19999, 30001-39999, 40001-49999
    const numericRegex = /^\d{1,5}$/
    if (numericRegex.test(address)) {
      const num = parseInt(address)
      return (num >= 1 && num <= 9999) ||
             (num >= 10001 && num <= 19999) ||
             (num >= 30001 && num <= 39999) ||
             (num >= 40001 && num <= 49999)
    }
    
    // Merker-Adressen: M0.0, MW0, MD0
    const merkerRegex = /^M[BWD]?\d+(\.\d+)?$/
    return merkerRegex.test(address)
  }
  
  if (protocol === 's7') {
    // S7-Adressen: I0.0, Q0.0, M0.0, VB0, etc.
    const s7Regex = /^[IQMV][BWD]?\d+(\.\d+)?$/
    return s7Regex.test(address)
  }
  
  return false
}

/**
 * Gibt den empfohlenen Datentyp für eine Adresse zurück
 */
export function suggestDataType(address, protocol) {
  if (!address) return 'int'

  // Bool für Bit-Adressen
  if (address.includes('.')) return 'bool'
  
  if (protocol === 'modbus_tcp') {
    const num = parseInt(address)
    if (num >= 1 && num <= 9999) return 'bool' // Coils
    if (num >= 10001 && num <= 19999) return 'bool' // Discrete Inputs
    return 'int' // Register
  }
  
  if (protocol === 's7') {
    // Ohne Suffix = Bit = Bool
    if (!/[BWD]/.test(address)) return 'bool'
    
    // Mit B = Byte = Int
    if (address.includes('B')) return 'int'
    
    // Mit W = Word = Int
    if (address.includes('W')) return 'int'
    
    // Mit D = DWord = Float oder Int
    if (address.includes('D')) return 'float'
  }
  
  return 'int'
}

/**
 * Gruppiert Variablen nach Kategorien
 */
export function groupVariablesByCategory(variables) {
  const groups = {
    inputs: [],
    outputs: [],
    memory: [],
    registers: [],
    other: []
  }

  variables.forEach(variable => {
    const addr = variable.address.toUpperCase()
    
    if (addr.startsWith('I')) {
      groups.inputs.push(variable)
    } else if (addr.startsWith('Q')) {
      groups.outputs.push(variable)
    } else if (addr.startsWith('M')) {
      groups.memory.push(variable)
    } else if (addr.startsWith('V') || /^[34]\d{4}$/.test(addr)) {
      groups.registers.push(variable)
    } else {
      groups.other.push(variable)
    }
  })

  return groups
}

/**
 * Konvertiert einen Eingabewert basierend auf dem Datentyp
 */
export function convertInputValue(value, dataType) {
  switch (dataType) {
    case 'bool':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || 
               value === '1' || 
               value.toLowerCase() === 'on' ||
               value.toLowerCase() === 'ein'
      }
      return Boolean(value)
    
    case 'int':
      return parseInt(value, 10)
    
    case 'float':
      return parseFloat(value)
    
    case 'string':
      return String(value)
    
    default:
      return value
  }
}

/**
 * Generiert eine Beispiel-Variable basierend auf Protokoll und Typ
 */
export function generateExampleVariable(protocol, dataType) {
  const examples = {
    modbus_tcp: {
      bool: { address: '00001', name: 'Ausgang_1' },
      int: { address: '40001', name: 'Register_1' },
      float: { address: '40010', name: 'Temperatur_1' }
    },
    s7: {
      bool: { address: 'Q0.0', name: 'Ausgang_1' },
      int: { address: 'MW100', name: 'Zähler_1' },
      float: { address: 'MD200', name: 'Temperatur_1' }
    }
  }

  return examples[protocol]?.[dataType] || { address: '', name: '' }
}

/**
 * Formatiert die Log-Nachricht für bessere Lesbarkeit
 */
export function formatLogMessage(log) {
  let message = ''
  
  switch (log.action) {
    case 'read':
      message = `Gelesen: ${log.variable_name || 'Variable'}`
      if (log.value?.value !== undefined) {
        message += ` = ${log.value.value}`
      }
      break
    
    case 'write':
      message = `Geschrieben: ${log.variable_name || 'Variable'}`
      if (log.value?.value !== undefined) {
        message += ` → ${log.value.value}`
      }
      break
    
    case 'command':
      message = `Befehl ausgeführt: ${log.value?.command || 'Unbekannt'}`
      break
    
    default:
      message = log.action
  }
  
  if (!log.success && log.error_message) {
    message += ` (Fehler: ${log.error_message})`
  }
  
  return message
}

/**
 * Sortiert Variablen nach Adresse
 */
export function sortVariablesByAddress(variables) {
  return [...variables].sort((a, b) => {
    // Versuche numerische Sortierung
    const aNum = parseInt(a.address.replace(/\D/g, ''))
    const bNum = parseInt(b.address.replace(/\D/g, ''))
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    
    // Fallback auf String-Sortierung
    return a.address.localeCompare(b.address)
  })
}

/**
 * Prüft ob eine Variable schreibbar ist
 */
export function isVariableWritable(variable) {
  return variable.access_mode === 'write' || variable.access_mode === 'read_write'
}

/**
 * Prüft ob eine Variable lesbar ist
 */
export function isVariableReadable(variable) {
  return variable.access_mode === 'read' || variable.access_mode === 'read_write'
}