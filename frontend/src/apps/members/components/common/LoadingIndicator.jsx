// frontend/src/apps/members/components/common/LoadingIndicator.jsx
import React from 'react';
import { Box, CircularProgress } from '@mui/material';

/**
 * LoadingIndicator Komponente für Ladeanzeige
 * 
 * @param {number} size - Größe des Ladeindikators
 */
const LoadingIndicator = ({ size = 40 }) => {
  return (
    <Box display="flex" justifyContent="center" my={4} width="100%">
      <CircularProgress size={size} />
    </Box>
  );
};

export default LoadingIndicator;