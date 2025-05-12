// frontend/src/apps/controller/components/common/StatusBadge.jsx
import React from 'react';
import { Chip, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PendingIcon from '@mui/icons-material/Pending';

/**
 * Statusanzeige-Chip mit verschiedenen vordefinierten Stilen
 * 
 * @param {Object} props
 * @param {string} props.status - Status: 'success', 'error', 'warning', 'info', 'pending'
 * @param {string} props.label - Anzeigetext
 * @param {string} props.size - Größe: 'small', 'medium'
 * @param {Object} props.sx - Zusätzliche Stileigenschaften
 * @param {boolean} props.outlined - Umriss-Variante anstatt gefüllt
 */
export default function StatusBadge({
  status = 'info',
  label,
  size = 'small',
  sx = {},
  outlined = false
}) {
  const theme = useTheme();
  
  // Status-Konfigurationen
  const statusConfig = {
    success: {
      color: 'success',
      icon: <CheckCircleIcon fontSize="inherit" />,
      defaultLabel: 'Erfolgreich'
    },
    error: {
      color: 'error',
      icon: <ErrorIcon fontSize="inherit" />,
      defaultLabel: 'Fehler'
    },
    warning: {
      color: 'warning',
      icon: <WarningIcon fontSize="inherit" />,
      defaultLabel: 'Warnung'
    },
    info: {
      color: 'info',
      icon: <InfoIcon fontSize="inherit" />,
      defaultLabel: 'Info'
    },
    pending: {
      color: 'default',
      icon: <PendingIcon fontSize="inherit" />,
      defaultLabel: 'Ausstehend'
    }
  };
  
  // Standardkonfiguration verwenden, wenn der Status nicht bekannt ist
  const config = statusConfig[status] || statusConfig.info;
  
  // Konfiguration anwenden
  return (
    <Chip
      label={label || config.defaultLabel}
      icon={config.icon}
      color={config.color}
      size={size}
      variant={outlined ? "outlined" : "filled"}
      sx={{
        fontWeight: 500,
        ...sx
      }}
    />
  );
}