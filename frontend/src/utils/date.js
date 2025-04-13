export function parseDate(ts) {
  if (!ts) return 'Ungültiges Datum'
  try {
    const [datePart, timePart] = ts.split(' ')
    const [day, month, year] = datePart.split('.')
    return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString()
  } catch {
    return 'Ungültiges Datum'
  }
}
