// src/apps/unifi_protect/components/SensorChart.jsx

import React, { useEffect } from 'react';
import { Box, CircularProgress, Alert, Paper } from '@mui/material';
import ReactECharts from 'echarts-for-react';

const SensorChart = ({ historyData, isLoading, animate = true, onRendered = () => {} }) => {
  useEffect(() => {
    if (!isLoading && historyData?.length) {
      const timeout = setTimeout(onRendered, 1000); // Mark as rendered after initial animation
      return () => clearTimeout(timeout);
    }
  }, [historyData, isLoading, onRendered]);

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

  const option = {
    animation: animate,
    animationDuration: 2000,
    animationDurationUpdate: 2000,
    animationEasing: 'quarticOut',
    animationEasingUpdate: 'quarticOut',
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Temperatur', 'Luftfeuchtigkeit'],
      top: 10,
      textStyle: {
        fontWeight: 'bold',
      },
      itemGap: 40,
      left: 'center',
    },
    grid: {
      left: '1.5%',
      right: '1.5%',
      bottom: 55,
      top: 50,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timestamps,
      axisLine: {
        lineStyle: {
          color: '#aaa',
        },
      },
      axisLabel: {
        color: '#555',
        margin: 12,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#eee',
          type: 'dashed',
        },
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        nameTextStyle: {
          align: 'center',
          padding: [0, 30, 0, 0],
          fontWeight: 'bold',
          color: '#1565c0',
        },
        min: value => Math.floor(Math.min(20, value.min - 1)),
        max: value => Math.ceil(Math.max(35, value.max + 1)),
        axisLine: {
          lineStyle: {
            color: '#aaa',
          },
        },
        axisLabel: {
          color: '#555',
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee',
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: '%',
        position: 'right',
        nameTextStyle: {
          align: 'center',
          padding: [0, 0, 0, 30],
          fontWeight: 'bold',
          color: '#2e7d32',
        },
        min: value => Math.floor(Math.min(40, value.min - 1)),
        max: value => Math.ceil(Math.max(80, value.max + 1)),
        axisLine: {
          lineStyle: {
            color: '#aaa',
          },
        },
        axisLabel: {
          color: '#555',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        throttle: 80,
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
        moveOnMouseWheel: false,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 28,
        bottom: 6,
        handleSize: 18,
        showDetail: false,
        borderColor: '#bbb',
        fillerColor: 'rgba(21, 101, 192, 0.2)',
        handleStyle: {
          color: '#1976d2',
          borderColor: '#1976d2',
          shadowBlur: 4,
          shadowColor: 'rgba(0,0,0,0.1)',
          shadowOffsetX: 0,
          shadowOffsetY: 1,
        },
      },
    ],
    series: [
      {
        name: 'Temperatur',
        type: 'line',
        data: temperatures,
        yAxisIndex: 0,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        areaStyle: {
          color: 'rgba(21, 101, 192, 0.12)',
        },
        itemStyle: {
          color: '#1565c0',
        },
        lineStyle: {
          color: '#1565c0',
        },
      },
      {
        name: 'Luftfeuchtigkeit',
        type: 'line',
        data: humidities,
        yAxisIndex: 1,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        areaStyle: {
          color: 'rgba(46, 125, 50, 0.12)',
        },
        itemStyle: {
          color: '#2e7d32',
        },
        lineStyle: {
          color: '#2e7d32',
        },
      },
    ],
  };

  return (
    <Box mt={2}>
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
        <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
      </Paper>
    </Box>
  );
};

export default SensorChart;
