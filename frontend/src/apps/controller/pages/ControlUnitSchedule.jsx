// frontend/src/apps/controller/pages/ControlUnitSchedule.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Paper, Typography, Box, Button,
  CircularProgress, Alert, Breadcrumbs, Link
} from '@mui/material'
import { ArrowBack, Schedule } from '@mui/icons-material'
import api from '@/utils/api'
import ScheduleEditor from '../components/ScheduleEditor'

export default function ControlUnitSchedule() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUnit()
  }, [id])

  const loadUnit = async () => {
    try {
      const response = await api.get(`/controller/units/${id}/`)
      setUnit(response.data)
    } catch (err) {
      setError('Fehler beim Laden der Steuerungseinheit')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error || !unit) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Steuerungseinheit nicht gefunden'}</Alert>
        <Button 
          onClick={() => navigate('/controller')} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBack />}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body1" 
          onClick={() => navigate('/controller')}
          underline="hover"
        >
          Steuerung
        </Link>
        <Link 
          component="button" 
          variant="body1" 
          onClick={() => navigate(`/controller/units/${id}/edit`)}
          underline="hover"
        >
          {unit.name}
        </Link>
        <Typography color="text.primary">Zeitplan</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Schedule sx={{ mr: 2, fontSize: 40 }} />
          <Box>
            <Typography variant="h5">{unit.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {unit.room_name} • {unit.unit_type_display}
            </Typography>
          </Box>
        </Box>

        <ScheduleEditor 
          controlUnitId={id} 
          unitType={unit.unit_type}
        />

        <Box display="flex" justifyContent="flex-start" mt={4}>
          <Button
            variant="outlined"
            onClick={() => navigate('/controller')}
            startIcon={<ArrowBack />}
          >
            Zurück zur Übersicht
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}