// frontend/src/apps/laborreports/components/CannabinoidChart.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Typography, Card, CardContent, Grid, Paper, useTheme } from '@mui/material';

export default function CannabinoidChart({ data }) {
  const theme = useTheme();
  
  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Keine Cannabinoid-Daten verfügbar
        </Typography>
      </Box>
    );
  }
  
  const chartOptions = {
    title: {
      text: 'Cannabinoid-Profil',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.palette.success.dark
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
          color: ['rgba(255, 255, 255, 0.1)', 'rgba(76, 175, 80, 0.05)'],
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 10
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(76, 175, 80, 0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(76, 175, 80, 0.3)'
        }
      },
      indicator: [
        { name: 'THC', max: 30 },
        { name: 'THCA', max: 30 },
        { name: 'CBD', max: 30 },
        { name: 'CBDA', max: 30 },
        { name: 'CBN', max: 5 },
        { name: 'CBG', max: 5 },
        { name: 'CBGA', max: 5 }
      ]
    },
    series: [
      {
        name: 'Cannabinoide (%)',
        type: 'radar',
        data: [
          {
            value: [
              data.thc || 0,
              data.thca || 0,
              data.cbd || 0,
              data.cbda || 0,
              data.cbn || 0,
              data.cbg || 0,
              data.cbga || 0
            ],
            name: 'Gehalt (%)',
            areaStyle: {
              color: 'rgba(76, 175, 80, 0.3)'
            },
            lineStyle: {
              color: theme.palette.success.main,
              width: 2
            },
            itemStyle: {
              color: theme.palette.success.main,
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
  
  const ValueBox = ({ label, value }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        textAlign: 'center',
        bgcolor: theme.palette.success.light,
        color: theme.palette.success.contrastText,
        border: `1px solid ${theme.palette.success.main}`,
        borderRadius: 2,
        height: '100%'
      }}
    >
      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight="bold">
        {value}%
      </Typography>
    </Paper>
  );
  
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
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <ValueBox label="Gesamt-THC" value={data.total_thc} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ValueBox label="Gesamt-CBD" value={data.total_cbd} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ValueBox label="Gesamt-Cannabinoide" value={data.total_cannabinoids} />
        </Grid>
      </Grid>
    </Box>
  );
}