import React, { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material'
import axios from '../../../utils/api'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const Dashboard = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get('/buchhaltung/dashboard/')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Fehler beim Laden der Dashboard-Daten:', err)
      })
  }, [])

  if (!data) return <p>Lade Daten…</p>

  const chartData = {
    labels: data.monthly_data.map(entry => entry.month),
    datasets: [
      {
        label: 'Einnahmen (€)',
        data: data.monthly_data.map(entry => entry.income),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46,125,50,0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Ausgaben (€)',
        data: data.monthly_data.map(entry => entry.expense),
        borderColor: '#c62828',
        backgroundColor: 'rgba(198,40,40,0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: val => `€ ${val.toLocaleString('de-DE')}`
        }
      }
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ color: '#009245', fontWeight: 'bold' }}>
        📊 Buchhaltungs-Dashboard
      </Typography>

      {/* Chart ganz oben */}
      <Grid container spacing={3} mb={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Finanzverlauf (Monatlich)
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistikkarten darunter */}
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
  )
}

export default Dashboard
