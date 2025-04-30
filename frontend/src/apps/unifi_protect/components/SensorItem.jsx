// src/apps/unifi_protect/components/SensorItem.jsx

import React, { memo } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Tooltip, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';

import SensorChart from './SensorChart';
import SensorStatsTable from './SensorStatsTable';

const getBatteryStatus = (level) => {
  if (!level && level !== 0) return { icon: null, color: 'default', text: 'Unbekannt' };
  if (level > 70) return { icon: <BatteryFullIcon />, color: 'success', text: 'Gut' };
  if (level > 30) return { icon: <BatteryFullIcon />, color: 'warning', text: 'Mittel' };
  return { icon: <BatteryAlertIcon />, color: 'error', text: 'Niedrig' };
};

const SensorItem = memo(({ 
  sensor,
  expanded,
  onExpand,
  history,
  historyLoading,
  onRefreshHistory,
  timeRange
}) => {
  const batteryStatus = getBatteryStatus(sensor.battery_level);
  const handleClick = () => onExpand(sensor.id);

  return (
    <Accordion
      key={sensor.id || `sensor-${sensor.name}`}
      expanded={expanded}
      onChange={handleClick}
      sx={{ mb: 1 }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{ '& .MuiAccordionSummary-content': {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'
        }}}
      >
        <Typography sx={{ fontWeight: 'bold' }}>{sensor.name}</Typography>
        <Box display="flex" alignItems="center">
          {sensor.battery_level !== undefined && (
            <Tooltip title={`Batterie: ${sensor.battery_level}%`}>
              <Box display="flex" alignItems="center" color={batteryStatus.color} mr={2}>
                {batteryStatus.icon}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {sensor.battery_level}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          <Typography>
            {sensor.temperature !== undefined ? `${sensor.temperature.toFixed(1)}°C` : '–'} / 
            {sensor.humidity !== undefined ? `${sensor.humidity.toFixed(0)}%` : '–'}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box mb={2}>
          <Typography variant="body2" gutterBottom>
            <strong>Typ:</strong> {sensor.sensor_type || 'Unbekannt'} | 
            <strong> Status:</strong> {sensor.status || 'Unbekannt'} | 
            <strong> Letzte Aktivität:</strong> {sensor.last_seen ? new Date(sensor.last_seen).toLocaleString() : 'Unbekannt'}
          </Typography>
          {sensor.mac_address && (
            <Typography variant="body2" color="text.secondary">
              <strong>MAC-Adresse:</strong> {sensor.mac_address}
            </Typography>
          )}
        </Box>

        {expanded && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Temperatur- und Feuchtigkeitsverlauf ({timeRange} {timeRange === 1 ? 'Tag' : 'Tage'})
              </Typography>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />} 
                onClick={() => onRefreshHistory(sensor.id)}
                disabled={historyLoading}
              >
                VERLAUF AKTUALISIEREN
              </Button>
            </Box>

            <SensorChart 
              historyData={history[sensor.id]} 
              isLoading={historyLoading} 
            />

            {history[sensor.id] && history[sensor.id].length > 0 && (
              <SensorStatsTable 
                sensorData={sensor} 
                historyData={history[sensor.id]} 
              />
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

export default SensorItem;