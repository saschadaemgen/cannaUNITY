// src/apps/unifi_protect/components/SensorStatusChip.jsx

import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { keyframes } from '@emotion/react';

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const SensorStatusChip = ({ status }) => {
  let color = 'default';
  let icon = <HelpOutlineIcon />;
  let animate = false;

  if (status === 'Online') {
    color = 'success';
    icon = <CheckCircleIcon />;
    animate = true;
  } else if (status === 'Offline') {
    color = 'error';
    icon = <CancelIcon />;
  }

  return (
    <Chip
      label={status || 'Unbekannt'}
      color={color}
      icon={icon}
      size="small"
      variant="outlined"
      sx={{
        borderRadius: 2,
        animation: animate ? `${pulseGlow} 1s ease-out` : 'none'
      }}
    />
  );
};

export default SensorStatusChip;