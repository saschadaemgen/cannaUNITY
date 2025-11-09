// frontend/src/apps/taskmanager/pages/TaskScheduleList.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, Chip, LinearProgress, Alert, IconButton, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import {
  Add, Edit, Delete, ContentCopy, Visibility,
  FilterList, CalendarMonth, Room, Assignment
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'
import { useNavigate } from 'react-router-dom'

export default function TaskScheduleList() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter State
  const [filterDate, setFilterDate] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [filterTaskType, setFilterTaskType] = useState('')
  
  // Duplicate Dialog
  const [duplicateDialog, setDuplicateDialog] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [duplicateDate, setDuplicateDate] = useState('')

  const loadSchedules = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterDate) params.append('date', filterDate)
      if (filterRoom) params.append('room', filterRoom)
      if (filterTaskType) params.append('task_type', filterTaskType)
      
      const response = await api.get(`/taskmanager/schedules/?${params}`)
      setSchedules(response.data.results || response.data)
      
    } catch (err) {
      setError('Fehler beim Laden der Aufgabenpläne')
      console.error('Schedules loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
  }, [filterDate, filterRoom, filterTaskType])

  const handleDuplicate = async () => {
    if (!selectedSchedule || !duplicateDate) return
    
    try {
      await api.post(`/taskmanager/schedules/${selectedSchedule.id}/duplicate/`, {
        date: duplicateDate
      })
      
      setDuplicateDialog(false)
      setSelectedSchedule(null)
      setDuplicateDate('')
      loadSchedules()
      
    } catch (err) {
      console.error('Duplicate error:', err)
      setError('Fehler beim Duplizieren der Aufgabenplanung')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diese Aufgabenplanung wirklich löschen?')) return
    
    try {
      await api.delete(`/taskmanager/schedules/${id}/`)
      loadSchedules()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Fehler beim Löschen der Aufgabenplanung')
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

  const columns = [
    {
      field: 'date',
      headerName: 'Datum',
      width: 120,
      renderCell: (params) => (
        format(parseISO(`${params.value}T00:00:00`), 'dd.MM.yyyy', { locale: de })
      )
    },
    {
      field: 'task_type_details',
      headerName: 'Aufgabe',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={params.value.difficulty_display}
            color={getDifficultyColor(params.value.difficulty)}
            size="small"
          />
          <Typography variant="body2" fontWeight="bold">
            {params.value.name}
          </Typography>
        </Box>
      )
    },
    {
      field: 'room_details',
      headerName: 'Raum',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Room fontSize="small" color="action" />
          {params.value.name}
        </Box>
      )
    },
    {
      field: 'start_time',
      headerName: 'Zeit',
      width: 120,
      renderCell: (params) => (
        `${params.value.slice(0, 5)} - ${params.row.end_time.slice(0, 5)}`
      )
    },
    {
      field: 'utilization_percentage',
      headerName: 'Auslastung',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1} width="100%">
          <LinearProgress
            variant="determinate"
            value={params.value}
            sx={{ flex: 1, height: 8, borderRadius: 1 }}
          />
          <Typography variant="body2" fontSize="0.75rem">
            {params.value.toFixed(1)}%
          </Typography>
        </Box>
      )
    },
    {
      field: 'booked_slots_count',
      headerName: 'Gebucht',
      width: 100,
      renderCell: (params) => (
        `${params.value}/${params.row.max_slots}`
      )
    },
    {
      field: 'actions',
      headerName: 'Aktionen',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/taskmanager/schedules/${params.row.id}`)}
            title="Anzeigen"
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/taskmanager/schedules/${params.row.id}/edit`)}
            title="Bearbeiten"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="secondary"
            onClick={() => {
              setSelectedSchedule(params.row)
              setDuplicateDialog(true)
            }}
            title="Duplizieren"
          >
            <ContentCopy />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
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
        <Typography variant="h4" component="h1" fontWeight="bold">
          Aufgabenplanung verwalten
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/taskmanager/schedules/new')}
        >
          Neue Aufgabe planen
        </Button>
      </Box>

      {/* Filter */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FilterList color="action" />
            <Typography variant="h6">Filter</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Datum"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ minWidth: 160 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Raum-ID (optional)"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                fullWidth
                placeholder="z.B. room-uuid"
                sx={{ minWidth: 180 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Aufgabentyp-ID (optional)"
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
                fullWidth
                placeholder="z.B. task-type-uuid"
                sx={{ minWidth: 200 }}
              />
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
              rows={schedules}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'date', sort: 'desc' }] }
              }}
              disableRowSelectionOnClick
            />
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Dialog */}
      <Dialog
        open={duplicateDialog}
        onClose={() => setDuplicateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Aufgabenplanung duplizieren
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary">
              Ausgewählte Aufgabe: <strong>{selectedSchedule?.task_type_details?.name}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ursprüngliches Datum: <strong>
                {selectedSchedule && format(parseISO(`${selectedSchedule.date}T00:00:00`), 'dd. MMMM yyyy', { locale: de })}
              </strong>
            </Typography>
          </Box>
          
          <TextField
            label="Neues Datum"
            type="date"
            value={duplicateDate}
            onChange={(e) => setDuplicateDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            helperText="Die Aufgabenplanung wird mit allen Zeitslots für dieses Datum kopiert"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDuplicate}
            variant="contained"
            disabled={!duplicateDate}
          >
            Duplizieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}