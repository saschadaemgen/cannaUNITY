// src/apps/unifi_protect/components/SensorChart.jsx

import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
  LineChart,
  LineSeriesType,
  ChartContainer,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  ChartsLegend
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

  const timestamps = historyData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const temperatures = historyData.map(d => d.temperature);
  const humidities = historyData.map(d => d.humidity);

  return (
    <Box mt={2}>
      <Typography variant="subtitle1" gutterBottom>
        Temperatur- und Luftfeuchtigkeitsverlauf
      </Typography>
      <ChartContainer
        height={300}
        series={[
          {
            type: 'line',
            id: 'temperature',
            label: 'Temperatur (°C)',
            data: temperatures,
            color: '#1976d2',
            yAxisKey: 'left'
          },
          {
            type: 'line',
            id: 'humidity',
            label: 'Luftfeuchte (%)',
            data: humidities,
            color: '#66bb6a',
            yAxisKey: 'right'
          }
        ]}
        xAxis={[
          {
            id: 'time',
            data: timestamps,
            scaleType: 'point',
            label: 'Zeit',
          },
        ]}
        yAxis={[
          {
            id: 'left',
            scaleType: 'linear',
            label: 'Temperatur (°C)',
          },
          {
            id: 'right',
            scaleType: 'linear',
            label: 'Luftfeuchte (%)',
            position: 'right',
          },
        ]}
      >
        <ChartsTooltip />
        <ChartsLegend />
        <ChartsXAxis />
        <ChartsYAxis />
      </ChartContainer>
    </Box>
  );
};

export default SensorChart;
