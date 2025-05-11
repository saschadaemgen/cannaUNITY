// src/apps/accounting/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import ReactECharts from 'echarts-for-react';
import axios from '@/utils/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/buchhaltung/dashboard/')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        setError('Daten konnten nicht geladen werden.');
      });
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box textAlign="center" py={5}><CircularProgress /></Box>;

  const labels = data.monthly_data.map(entry => entry.month);
  const einnahmen = data.monthly_data.map(entry => entry.income);
  const ausgaben = data.monthly_data.map(entry => entry.expense);

  const chartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Einnahmen', 'Ausgaben'],
      top: 10,
      textStyle: { fontWeight: 'bold' },
      itemGap: 40,
      left: 'center'
    },
    grid: {
      left: '1.5%',
      right: '1.5%',
      bottom: 55,
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '€ {value}' }
    },
    series: [
      {
        name: 'Einnahmen',
        type: 'line',
        smooth: true,
        data: einnahmen,
        areaStyle: { color: 'rgba(46, 125, 50, 0.15)' },
        itemStyle: { color: '#2e7d32' },
        lineStyle: { color: '#2e7d32' }
      },
      {
        name: 'Ausgaben',
        type: 'line',
        smooth: true,
        data: ausgaben,
        areaStyle: { color: 'rgba(198, 40, 40, 0.15)' },
        itemStyle: { color: '#c62828' },
        lineStyle: { color: '#c62828' }
      }
    ]
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        📊 Buchhaltungs-Dashboard
      </Typography>

      <Box my={4}>
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
          <ReactECharts option={chartOption} style={{ height: 400, width: '100%' }} />
        </Paper>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '5px solid #2e7d32' }}>
            <CardContent>
              <Typography variant="h6">📈 Einnahmen</Typography>
              <Typography variant="h5" color="green">€ {Number(data.total_income).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '5px solid #c62828' }}>
            <CardContent>
              <Typography variant="h6">📉 Ausgaben</Typography>
              <Typography variant="h5" color="error">€ {Number(data.total_expense).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderTop: '5px solid #fbc02d' }}>
            <CardContent>
              <Typography variant="h6">🏦 Bestandskonten</Typography>
              <Typography variant="h5" color="primary">€ {Number(data.balance).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
