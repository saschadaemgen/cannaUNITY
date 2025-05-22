// frontend/src/apps/taskmanager/pages/TaskTypeDetail.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Card, CardContent, Box, Button,
  Chip, Avatar, Alert, CircularProgress, Grid, Stack,
  Paper, Divider
} from '@mui/material'
import {
  Edit, Delete, Assignment, ArrowBack, CheckCircle,
  Star, Build, Settings, Schedule, TrendingUp
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/utils/api'

const DIFFICULTY_ICONS = {
  'leicht': <CheckCircle />,
  'mittel': <Star />,
  'anspruchsvoll': <Build />
}

function TaskTypeDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [taskType, setTaskType] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      loadTaskType()
    }
  }, [id])

  const loadTaskType = async () => {
    try {
      setLoading(true)
      
      const response = await api.get(`/taskmanager/task-types/${id}/`)
      setTaskType(response.data)
      
    } catch (err) {
      console.error('Error loading task type:', err)
      setError('Fehler beim Laden des Aufgabentyps')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diesen Aufgabentyp wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }
    
    try {
      await api.delete(`/taskmanager/task-types/${id}/`)
      navigate('/taskmanager/task-types')
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen des Aufgabentyps')
    }
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'leicht': 'success',
      'mittel': 'warning',
      'anspruchsvoll': 'error'
    }
    return colors[difficulty] || 'default'
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!taskType) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Aufgabentyp nicht gefunden</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={4}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/taskmanager/task-types')}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          
          <Avatar 
            sx={{ 
              bgcolor: taskType.color || 'primary.main',
              mr: 2, 
              width: 56, 
              height: 56 
            }}
          >
            {DIFFICULTY_ICONS[taskType.difficulty] || <Assignment />}
          </Avatar>
          
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {taskType.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Chip
                label={taskType.difficulty}
                color={getDifficultyColor(taskType.difficulty)}
                size="small"
              />
              <Chip
                label={taskType.is_active ? 'Aktiv' : 'Inaktiv'}
                color={taskType.is_active ? 'success' : 'error'}
                size="small"
              />
              {taskType.requires_training && (
                <Chip
                  label="Einweisung erforderlich"
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/taskmanager/task-types/${id}/edit`)}
          >
            Bearbeiten
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Löschen
          </Button>
        </Stack>
      </Box>

      {/* Main Info Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            📋 Aufgabentyp-Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Name
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {taskType.name}
                  </Typography>
                </Box>
                
                {taskType.description && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Beschreibung
                    </Typography>
                    <Typography variant="body1">
                      {taskType.description}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Schwierigkeitsgrad
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar 
                      sx={{ 
                        bgcolor: taskType.color,
                        width: 32,
                        height: 32
                      }}
                    >
                      {DIFFICULTY_ICONS[taskType.difficulty]}
                    </Avatar>
                    <Typography variant="body1" fontWeight="bold">
                      {taskType.difficulty.charAt(0).toUpperCase() + taskType.difficulty.slice(1)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Farbcode
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        backgroundColor: taskType.color,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    />
                    <Typography variant="body1" fontFamily="monospace">
                      {taskType.color}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Icon
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {taskType.icon}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={taskType.is_active ? 'Aktiv' : 'Inaktiv'}
                    color={taskType.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            ⚙️ Einstellungen
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {taskType.max_slots_per_day}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Max. Slots pro Tag
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {taskType.min_experience_level}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Mindest-Erfahrungslevel
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" alignItems="center" gap={2}>
            <Settings color="action" />
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Einweisung erforderlich
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {taskType.requires_training 
                  ? 'Mitglieder benötigen eine spezielle Einweisung' 
                  : 'Keine besondere Einweisung erforderlich'
                }
              </Typography>
            </Box>
            <Chip
              label={taskType.requires_training ? 'Ja' : 'Nein'}
              color={taskType.requires_training ? 'warning' : 'success'}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card elevation={2} sx={{ bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            👁️ Vorschau
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            So wird dieser Aufgabentyp in der Anwendung dargestellt:
          </Typography>
          
          <Paper elevation={2} sx={{ p: 3, maxWidth: 400, border: `2px solid ${taskType.color}20` }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar 
                sx={{ 
                  bgcolor: taskType.color,
                  width: 48,
                  height: 48
                }}
              >
                {DIFFICULTY_ICONS[taskType.difficulty]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {taskType.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={taskType.difficulty}
                    color={getDifficultyColor(taskType.difficulty)}
                    size="small"
                  />
                  <Chip
                    label={taskType.is_active ? 'Aktiv' : 'Inaktiv'}
                    color={taskType.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
            
            {taskType.description && (
              <Typography variant="body2" color="textSecondary" mb={2}>
                {taskType.description}
              </Typography>
            )}
            
            <Stack direction="row" spacing={2} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              <Typography variant="body2">
                📊 Max. {taskType.max_slots_per_day} Slots/Tag
              </Typography>
              <Typography variant="body2">
                🎯 Level {taskType.min_experience_level}+
              </Typography>
              {taskType.requires_training && (
                <Typography variant="body2">
                  🎓 Einweisung
                </Typography>
              )}
            </Stack>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  )
}

export default TaskTypeDetail