// frontend/src/apps/rooms/components/common/PaginationFooter.jsx
import React from 'react';
import { Box, Pagination, Typography, FormControl, Select, MenuItem, InputLabel } from '@mui/material';

/**
 * PaginationFooter Komponente für die Paginierung am Ende der Tabelle
 * 
 * @param {number} currentPage - Aktuelle Seite
 * @param {number} totalPages - Gesamtanzahl der Seiten
 * @param {function} onPageChange - Handler für Seitenwechsel
 * @param {boolean} hasData - Gibt an, ob Daten vorhanden sind
 * @param {string} emptyMessage - Nachricht, wenn keine Daten vorhanden sind
 * @param {string} color - Farbe der Paginierung (default: 'primary')
 * @param {number} pageSize - Aktuelle Anzahl der Einträge pro Seite
 * @param {function} onPageSizeChange - Handler für Änderung der Einträge pro Seite
 * @param {Array} pageSizeOptions - Verfügbare Optionen für Einträge pro Seite
 */
const PaginationFooter = ({
  currentPage,
  totalPages,
  onPageChange,
  hasData = true,
  emptyMessage = 'Keine Daten vorhanden',
  color = 'primary',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}) => {
  if (!hasData) {
    return (
      <Typography align="center" sx={{ mt: 4, width: '100%' }}>
        {emptyMessage}
      </Typography>
    );
  }

  // Wenn keine Seitenauswahl benötigt wird
  if (totalPages <= 1 && !onPageSizeChange) {
    return null;
  }

  return (
    <Box 
      display="flex" 
      flexDirection={{ xs: 'column', sm: 'row' }} 
      justifyContent="space-between" 
      alignItems="center"
      mt={4} 
      width="100%"
    >
      {/* Einträge pro Seite Auswahl */}
      {onPageSizeChange && (
        <Box mb={{ xs: 2, sm: 0 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="entries-per-page-label">Einträge pro Seite</InputLabel>
            <Select
              labelId="entries-per-page-label"
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
              label="Einträge pro Seite"
            >
              {pageSizeOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option} Einträge
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Seitenzahlen Pagination */}
      {totalPages > 1 && (
        <Pagination 
          count={totalPages} 
          page={currentPage} 
          onChange={onPageChange}
          color={color}
          showFirstButton 
          showLastButton
        />
      )}
    </Box>
  );
};

export default PaginationFooter;