// frontend/src/apps/taskmanager/pages/TaskTypeList.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, Chip, Alert, IconButton, Stack, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import {
  Add, Edit, Delete, Visibility, FilterList, Assignment,
  Star, Build, CheckCircle
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'

function TaskTypeList() {
  const navigate = useNavigate()
  const [taskTypes, setTaskTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter State
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterActive, setFilterActive] = useState('')
  
  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedTaskType, setSelectedTaskType] = useState(null)

  const loadTaskTypes = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterDifficulty) params.append('difficulty', filterDifficulty)
      
      const response = await api.get(`/taskmanager/task-types/?${params}`)
      let data = response.data.results || response.data
      
      // Frontend-Filterung für is_active, falls Backend es nicht unterstützt
      if (filterActive !== '') {
        data = data.filter(item => item.is_active === (filterActive === 'true'))
      }
      
      setTaskTypes(data)
      
    } catch (err) {
      setError('Fehler beim Laden der Aufgabentypen')
      console.error('TaskTypes loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaskTypes()
  }, [filterDifficulty, filterActive])

  const handleDelete = async () => {
    if (!selectedTaskType) return
    
    try {
      await api.delete(`/taskmanager/task-types/${selectedTaskType.id}/`)
      
      setDeleteDialog(false)
      setSelectedTaskType(null)
      loadTaskTypes()
      
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen des Aufgabentyps')
    }
  }

  const handleToggleActive = async (taskType) => {
    try {
      await api.patch(`/taskmanager/task-types/${taskType.id}/`, {
        is_active: !taskType.is_active
      })
      
      loadTaskTypes()
      
    } catch (err) {
      console.error('Toggle active error:', err)
      setError('Fehler beim Aktualisieren des Status')
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

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      'leicht': <CheckCircle />,
      'mittel': <Star />,
      'anspruchsvoll': <Build />
    }
    return icons[difficulty] || <Assignment />
  }

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar 
            sx={{ 
              bgcolor: params.row.color || 'primary.main',
              width: 32,
              height: 32
            }}
          >
            {getDifficultyIcon(params.row.difficulty)}
          </Avatar>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'difficulty',
      headerName: 'Schwierigkeit',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.difficulty}
          color={getDifficultyColor(params.value)}
          size="small"
          icon={getDifficultyIcon(params.value)}
        />
      )
    },
    {
      field: 'max_slots_per_day',
      headerName: 'Max. Slots/Tag',
      width: 130,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'min_experience_level',
      headerName: 'Min. Level',
      width: 100,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'requires_training',
      headerName: 'Einweisung',
      width: 120,
      renderCell: (params) => (
        params.value ? 
          <Chip label="Erforderlich" color="warning" size="small" /> :
          <Chip label="Nicht nötig" color="success" size="small" />
      )
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Aktiv' : 'Inaktiv'}
          color={params.value ? 'success' : 'error'}
          size="small"
          onClick={() => handleToggleActive(params.row)}
          sx={{ cursor: 'pointer' }}
        />
      )
    },
    {
      field: 'description',
      headerName: 'Beschreibung',
      width: 250,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          color="textSecondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {params.value || 'Keine Beschreibung'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Aktionen',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/taskmanager/task-types/${params.row.id}`)}
            title="Anzeigen"
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/taskmanager/task-types/${params.row.id}/edit`)}
            title="Bearbeiten"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedTaskType(params.row)
              setDeleteDialog(true)
            }}
            title="Löschen"
          >
            <Delete />
          </IconButton>
        </Stack>
      )
    }
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Aufgabentypen verwalten
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Erstellen und verwalten Sie verschiedene Arten von Aufgaben
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/taskmanager/task-types/new')}
          size="large"
        >
          Neuen Aufgabentyp erstellen
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {taskTypes.filter(t => t.difficulty === 'leicht').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Leichte Aufgaben
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Star />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {taskTypes.filter(t => t.difficulty === 'mittel').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Mittlere Aufgaben
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                <Build />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {taskTypes.filter(t => t.difficulty === 'anspruchsvoll').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Anspruchsvolle Aufgaben
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Assignment />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {taskTypes.filter(t => t.is_active).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aktive Typen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FilterList color="action" />
            <Typography variant="h6">Filter</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel>Schwierigkeit</InputLabel>
                <Select
                  value={filterDifficulty}
                  label="Schwierigkeit"
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <MenuItem value="">Alle Schwierigkeiten</MenuItem>
                  <MenuItem value="leicht">Leicht</MenuItem>
                  <MenuItem value="mittel">Mittel</MenuItem>
                  <MenuItem value="anspruchsvoll">Anspruchsvoll</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterActive}
                  label="Status"
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <MenuItem value="">Alle Status</MenuItem>
                  <MenuItem value="true">Nur Aktive</MenuItem>
                  <MenuItem value="false">Nur Inaktive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Card elevation={2}>
        <CardContent>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={taskTypes}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'name', sort: 'asc' }] }
              }}
              disableRowSelectionOnClick
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Aufgabentyp löschen
        </DialogTitle>
        <DialogContent>
          {selectedTaskType && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Achtung:</strong> Das Löschen dieses Aufgabentyps kann sich auf bestehende 
                  Aufgabenpläne und Buchungen auswirken!
                </Typography>
              </Alert>
              
              <Typography variant="body1" mb={2}>
                Möchten Sie den Aufgabentyp <strong>"{selectedTaskType.name}"</strong> wirklich löschen?
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: selectedTaskType.color || 'primary.main' }}>
                  {getDifficultyIcon(selectedTaskType.difficulty)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedTaskType.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedTaskType.difficulty} • Max. {selectedTaskType.max_slots_per_day} Slots/Tag
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default TaskTypeList