// src/apps/unifi_protect/components/SensorChart.jsx

import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
  ChartContainer,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  ChartsLegend,
  LinePlot
} from '@mui/x-charts';

const SensorChart = ({ historyData, isLoading }) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={2}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Keine Verlaufsdaten verfügbar.
      </Alert>
    );
  }

  const timestamps = historyData.map(d =>
    new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const temperatures = historyData.map(d => d.temperature ?? null);
  const humidities = historyData.map(d => d.humidity ?? null);

  return (
    <Box mt={2}>
      <Typography variant="subtitle1" gutterBottom>
        Temperatur- und Luftfeuchtigkeitsverlauf
      </Typography>
      <ChartContainer
        height={300}
        xAxis={[{ id: 'x', data: timestamps, scaleType: 'point', label: 'Zeit' }]}
        yAxis={[
          { id: 'left', label: 'Temperatur (°C)', scaleType: 'linear' },
          { id: 'right', label: 'Luftfeuchte (%)', position: 'right', scaleType: 'linear' }
        ]}
        series={[
          {
            type: 'line',
            yAxisKey: 'left',
            id: 'temp',
            label: 'Temperatur (°C)',
            color: '#1976d2',
            data: temperatures
          },
          {
            type: 'line',
            yAxisKey: 'right',
            id: 'humid',
            label: 'Luftfeuchte (%)',
            color: '#66bb6a',
            data: humidities
          }
        ]}
      >
        <ChartsTooltip />
        <ChartsLegend />
        <ChartsXAxis />
        <ChartsYAxis />
        <LinePlot />
      </ChartContainer>
    </Box>
  );
};

export default SensorChart;
