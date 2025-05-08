import { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Divider,
  Grid,
  TextField,
  MenuItem,
  Paper,
  useTheme,
} from '@mui/material'
import { AssignmentInd, DoorFront, AccessTime } from '@mui/icons-material'
import api from '@/utils/api'
import EventTable from '../components/EventTable'

const getCurrentYear = () => new Date().getFullYear()

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [lastEvent, setLastEvent] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    year: getCurrentYear(),
    timeframe: 'all',
    authMethod: 'all',
    limit: 10,
  })

  const theme = useTheme()

  // 📡 Events laden
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/unifi_access/api/events/?limit=100')
        const all = res.data.events || []
        setEvents(all)
        if (all.length > 0) setLastEvent(all[0])
      } catch (e) {
        console.error('Fehler beim Laden der Events:', e)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [])

  const parseDate = (ts) => {
    if (!ts) return 'Ungültiges Datum'
    try {
      const [datePart, timePart] = ts.split(' ')
      const [day, month, year] = datePart.split('.')
      return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString()
    } catch (e) {
      return 'Ungültiges Datum'
    }
  }  

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        RFID-Zugriffsüberwachung
      </Typography>

      {/* 🌟 Letzte Aktivität */}
      {lastEvent && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            borderLeft: '5px solid #2e7d32',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f7f9f8'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <AccessTime fontSize="large" color="success" sx={{ verticalAlign: 'middle', position: 'relative', top: -2 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="subtitle2" color="textSecondary">
                Letzte Aktivität
              </Typography>
              <Typography variant="body1">
                <AssignmentInd sx={{ mr: 1, verticalAlign: 'middle', position: 'relative', top: -2 }} fontSize="small" />
                <strong>{lastEvent.actor}</strong> hat sich am{' '}
                <strong>{parseDate(lastEvent.timestamp)}</strong>{' '}
                über <strong>{lastEvent.authentication}</strong> am{' '}
                <DoorFront fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', position: 'relative', top: -2 }} />
                <strong>{lastEvent.door}</strong> eingeloggt.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 🎛️ Filterleiste */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            label="Suche (Name oder Tür)"
            variant="outlined"
            fullWidth
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.5}>
          <TextField
            select
            label="Jahr"
            fullWidth
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            {[getCurrentYear(), getCurrentYear() - 1, getCurrentYear() - 2].map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={4} md={2.5}>
          <TextField
            select
            label="Zeitraum"
            fullWidth
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
          >
            <MenuItem value="all">Gesamte Historie</MenuItem>
            <MenuItem value="today">Heute</MenuItem>
            <MenuItem value="week">Letzte 7 Tage</MenuItem>
            <MenuItem value="month">Aktueller Monat</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={4} md={2.5}>
          <TextField
            select
            label="Authentifizierung"
            fullWidth
            value={filters.authMethod}
            onChange={(e) => setFilters({ ...filters, authMethod: e.target.value })}
          >
            <MenuItem value="all">Alle Methoden</MenuItem>
            <MenuItem value="NFC">NFC</MenuItem>
            <MenuItem value="Face">Face</MenuItem>
            <MenuItem value="PIN">PIN</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      {/* 📊 Tabelle */}
      <EventTable events={events} filters={filters} />
    </Box>
  )
}
