// frontend/src/apps/laborreports/components/TerpeneChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';

export default function TerpeneChart({ data }) {
  const theme = useTheme();
  
  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Keine Terpen-Daten verfügbar
        </Typography>
      </Box>
    );
  }
  
  const chartOptions = {
    title: {
      text: 'Terpen-Profil',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.palette.secondary.dark
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}: ${params.value}%`;
      },
      textStyle: {
        fontSize: 14
      }
    },
    legend: {
      show: false
    },
    radar: {
      radius: '70%',
      splitNumber: 5,
      axisName: {
        color: theme.palette.text.primary,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: [3, 5]
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.1)', 'rgba(156, 39, 176, 0.05)'],
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 10
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(156, 39, 176, 0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(156, 39, 176, 0.3)'
        }
      },
      indicator: [
        { name: 'Myrcen', max: Math.max(data.myrcene * 2, 1) },
        { name: 'Limonen', max: Math.max(data.limonene * 2, 1) },
        { name: 'Caryophyllen', max: Math.max(data.caryophyllene * 2, 1) },
        { name: 'Terpinolen', max: Math.max(data.terpinolene * 2, 1) },
        { name: 'Linalool', max: Math.max(data.linalool * 2, 1) },
        { name: 'Pinen', max: Math.max(data.pinene * 2, 1) },
        { name: 'Humulen', max: Math.max(data.humulene * 2, 1) },
        { name: 'Ocimen', max: Math.max(data.ocimene * 2, 1) }
      ]
    },
    series: [
      {
        name: 'Terpene (%)',
        type: 'radar',
        data: [
          {
            value: [
              data.myrcene || 0,
              data.limonene || 0,
              data.caryophyllene || 0,
              data.terpinolene || 0,
              data.linalool || 0,
              data.pinene || 0,
              data.humulene || 0,
              data.ocimene || 0
            ],
            name: 'Gehalt (%)',
            areaStyle: {
              color: 'rgba(156, 39, 176, 0.3)'
            },
            lineStyle: {
              color: theme.palette.secondary.main,
              width: 2
            },
            itemStyle: {
              color: theme.palette.secondary.main,
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowBlur: 5
            },
            symbolSize: 8
          }
        ]
      }
    ]
  };
  
  return (
    <Box>
      <Box sx={{ height: { xs: 350, md: 450 }, width: '100%' }}>
        <ReactECharts
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </Box>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
        Zusammenfassung
      </Typography>
      
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: 'center',
          bgcolor: theme.palette.secondary.light,
          color: theme.palette.secondary.contrastText,
          border: `1px solid ${theme.palette.secondary.main}`,
          borderRadius: 2
        }}
      >
        <Typography variant="body1" fontWeight="medium" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>
          Gesamt-Terpene
        </Typography>
        <Typography variant="h3" fontWeight="bold">
          {data.total_terpenes}%
        </Typography>
      </Paper>
    </Box>
  );
}