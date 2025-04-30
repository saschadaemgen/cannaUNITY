// src/apps/unifi_protect/components/SensorStatsTable.jsx

import React, { memo } from 'react';
import {
  Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper
} from '@mui/material';

const SensorStatsTable = memo(({ sensorData, historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  const tempData = historyData.filter(d => d.temperature !== undefined && d.temperature !== null);
  const humidData = historyData.filter(d => d.humidity !== undefined && d.humidity !== null);

  const tempStats = {
    min: tempData.length ? Math.min(...tempData.map(d => d.temperature)).toFixed(1) : '-',
    max: tempData.length ? Math.max(...tempData.map(d => d.temperature)).toFixed(1) : '-',
    avg: tempData.length ? (tempData.reduce((sum, d) => sum + d.temperature, 0) / tempData.length).toFixed(1) : '-',
    current: sensorData.temperature !== undefined ? sensorData.temperature.toFixed(1) : '-'
  };

  const humidStats = {
    min: humidData.length ? Math.min(...humidData.map(d => d.humidity)).toFixed(0) : '-',
    max: humidData.length ? Math.max(...humidData.map(d => d.humidity)).toFixed(0) : '-',
    avg: humidData.length ? (humidData.reduce((sum, d) => sum + d.humidity, 0) / humidData.length).toFixed(0) : '-',
    current: sensorData.humidity !== undefined ? sensorData.humidity.toFixed(0) : '-'
  };

  return (
    <Box mt={3}>
      <Typography variant="subtitle1" gutterBottom>
        Statistik für den ausgewählten Zeitraum
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Metrik</strong></TableCell>
              <TableCell align="right"><strong>Min</strong></TableCell>
              <TableCell align="right"><strong>Max</strong></TableCell>
              <TableCell align="right"><strong>Durchschnitt</strong></TableCell>
              <TableCell align="right"><strong>Aktuell</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Temperatur</TableCell>
              <TableCell align="right">{tempStats.min}°C</TableCell>
              <TableCell align="right">{tempStats.max}°C</TableCell>
              <TableCell align="right">{tempStats.avg}°C</TableCell>
              <TableCell align="right">{tempStats.current}°C</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Luftfeuchte</TableCell>
              <TableCell align="right">{humidStats.min}%</TableCell>
              <TableCell align="right">{humidStats.max}%</TableCell>
              <TableCell align="right">{humidStats.avg}%</TableCell>
              <TableCell align="right">{humidStats.current}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

SensorStatsTable.displayName = 'SensorStatsTable';

export default SensorStatsTable;
