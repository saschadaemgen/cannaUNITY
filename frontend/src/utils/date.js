// frontend/src/utils/date.js

/**
 * Parst ein Datum in verschiedenen Formaten und gibt eine formatierte Zeichenfolge zurück
 * @param {string} ts - Datums-String in verschiedenen Formaten
 * @param {boolean} returnDateObject - Wenn true, wird ein Date-Objekt zurückgegeben
 * @returns {string|Date} Formatiertes Datum als String oder Date-Objekt
 */
export function parseDate(ts, returnDateObject = false) {
  if (!ts) return returnDateObject ? null : 'Ungültiges Datum';
  
  try {
    let date;
    
    // Prüfen, ob es sich um ein ISO-Format handelt (YYYY-MM-DD oder YYYY-MM-DDTHH:MM:SS)
    if (typeof ts === 'string' && (ts.includes('-') && !ts.includes('.'))) {
      date = new Date(ts);
    } 
    // Deutsches Format (DD.MM.YYYY oder DD.MM.YYYY HH:MM:SS)
    else if (typeof ts === 'string' && ts.includes('.')) {
      const parts = ts.split(' ');
      const datePart = parts[0];
      const timePart = parts.length > 1 ? parts[1] : '00:00:00';
      
      const [day, month, year] = datePart.split('.');
      date = new Date(`${year}-${month}-${day}T${timePart}`);
    } 
    // Timestamp als Zahl
    else if (typeof ts === 'number') {
      date = new Date(ts);
    }
    // Unbekanntes Format - direkter Versuch
    else {
      date = new Date(ts);
    }
    
    // Prüfen, ob das Datum gültig ist
    if (isNaN(date.getTime())) {
      return returnDateObject ? null : 'Ungültiges Datum';
    }
    
    // Je nach Parameter ein Date-Objekt oder einen String zurückgeben
    return returnDateObject ? date : date.toLocaleString('de-DE');
    
  } catch (err) {
    console.warn('Fehler beim Parsen des Datums:', err, ts);
    return returnDateObject ? null : 'Ungültiges Datum';
  }
}

/**
 * Formatiert ein ISO-Datum (YYYY-MM-DD) in deutsches Format (DD.MM.YYYY)
 * @param {string} isoDateString - ISO-Datum als String (YYYY-MM-DD)
 * @returns {string} Formatiertes Datum in deutschem Format
 */
export function formatDateFromISO(isoDateString) {
  if (!isoDateString) return '-';
  
  try {
    // ISO-Format (YYYY-MM-DD) in Teile zerlegen und in deutsches Format umwandeln
    const parts = isoDateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    
    // Fallback - direkte Ausgabe
    return isoDateString;
  } catch (err) {
    console.warn('Fehler beim Formatieren des Datums:', err);
    return isoDateString || '-';
  }
}