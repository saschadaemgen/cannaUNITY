// frontend/src/apps/members/components/common/PageHeader.jsx
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

/**
 * PageHeader Komponente für den Seitenkopf mit Titel und Filter-Button
 * 
 * @param {string} title - Titel der Seite
 * @param {boolean} showFilters - Gibt an, ob Filter angezeigt werden
 * @param {function} setShowFilters - Funktion zum Umschalten der Filter-Anzeige
 * @param {React.ReactNode} actions - Zusätzliche Aktionen (Buttons)
 */
const PageHeader = ({ title, showFilters, setShowFilters, actions }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h5">{title}</Typography>
      <Box>
        <IconButton 
          onClick={() => setShowFilters(!showFilters)} 
          color={showFilters ? "primary" : "default"}
          sx={{ mr: 1 }}
        >
          <FilterAltIcon />
        </IconButton>
        {actions}
      </Box>
    </Box>
  );
};

export default PageHeader;