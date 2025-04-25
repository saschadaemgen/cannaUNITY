// frontend/src/apps/trackandtrace/components/common/PaginationFooter.jsx
import { Box, Pagination, Typography } from '@mui/material'

/**
 * PaginationFooter Komponente für die Paginierung am Ende der Tabelle
 * 
 * @param {number} currentPage - Aktuelle Seite
 * @param {number} totalPages - Gesamtanzahl der Seiten
 * @param {function} onPageChange - Handler für Seitenwechsel
 * @param {boolean} hasData - Gibt an, ob Daten vorhanden sind
 * @param {string} emptyMessage - Nachricht, wenn keine Daten vorhanden sind
 * @param {string} color - Farbe der Paginierung (default: 'primary')
 */
const PaginationFooter = ({
  currentPage,
  totalPages,
  onPageChange,
  hasData = true,
  emptyMessage = 'Keine Daten vorhanden',
  color = 'primary'
}) => {
  if (!hasData) {
    return (
      <Typography align="center" sx={{ mt: 4, width: '100%' }}>
        {emptyMessage}
      </Typography>
    )
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <Box display="flex" justifyContent="center" mt={4} width="100%">
      <Pagination 
        count={totalPages} 
        page={currentPage} 
        onChange={onPageChange}
        color={color}
      />
    </Box>
  )
}

export default PaginationFooter