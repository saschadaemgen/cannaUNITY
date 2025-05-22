// frontend/src/apps/taskmanager/pages/TaskBookingList.jsx

import { useState, useEffect } from 'react'
import {
  Container, Typography, Button, Box, Card, CardContent,
  Grid, Chip, Alert, IconButton, Stack, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Rating, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import {
  CheckCircle, Cancel, Edit, Visibility, Person,
  Schedule, Room, Star, AccessTime, Assignment
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import api from '@/utils/api'

export default function TaskBookingList() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterMember, setFilterMember] = useState('')
  
  // Complete Dialog
  const [completeDialog, setCompleteDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [completionData, setCompletionData] = useState({
    rating: 0,
    work_quality_rating: 0,
    notes: '',
    supervisor_notes: ''
  })

  const loadBookings = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterDate) params.append('date', filterDate)
      if (filterMember) params.append('member', filterMember)
      
      const response = await api.get(`/taskmanager/bookings/?${params}`)
      setBookings(response.data.results || response.data)
      
    } catch (err) {
      setError('Fehler beim Laden der Buchungen')
      console.error('Bookings loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [filterStatus, filterDate, filterMember])

  const handleComplete = async () => {
    if (!selectedBooking) return
    
    try {
      await api.post(`/taskmanager/bookings/${selectedBooking.id}/complete/`, completionData)
      
      setCompleteDialog(false)
      setSelectedBooking(null)
      setCompletionData({
        rating: 0,
        work_quality_rating: 0,
        notes: '',
        supervisor_notes: ''
      })
      loadBookings()
      
    } catch (err) {
      console.error('Complete error:', err)
      setError('Fehler beim Abschließen der Buchung')
    }
  }

  const handleCancel = async (bookingId) => {
    const reason = prompt('Grund für die Stornierung (optional):')
    if (reason === null) return // User cancelled prompt
    
    try {
      await api.post(`/taskmanager/bookings/${bookingId}/cancel/`, {
        reason: reason || 'Storniert über Admin-Interface'
      })
      
      loadBookings()
      
    } catch (err) {
      console.error('Cancel error:', err)
      setError('Fehler beim Stornieren der Buchung')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'success',
      'cancelled': 'error',
      'completed': 'info',
      'no_show': 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'cancelled': 'Storniert',
      'completed': 'Abgeschlossen',
      'no_show': 'Nicht erschienen'
    }
    return labels[status] || status
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      const dateTime = new Date(`${dateString}T${timeString}`)
      return format(dateTime, 'dd.MM.yyyy HH:mm', { locale: de })
    } catch {
      return `${dateString} ${timeString}`
    }
  }

  const columns = [
    {
      field: 'member_details',
      headerName: 'Mitglied',
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {params.value.first_name[0]}
          </Avatar>
          <Typography variant="body2">
            {params.value.full_name}
          </Typography>
        </Box>
      )
    },
    {
      field: 'time_slot_details',
      headerName: 'Aufgabe & Zeit',
      width: 250,
      renderCell: (params) => {
        const slot = params.value
        const schedule = slot.schedule_details || {}
        const taskType = schedule.task_type_details || {}
        
        return (
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {taskType.name || 'Unbekannte Aufgabe'}
            </Typography>
            <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
              {formatDateTime(schedule.date, slot.start_time)} - {slot.end_time?.slice(0, 5)}
            </Typography>
            <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
              📍 {schedule.room_details?.name || 'Unbekannter Raum'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'booked_at',
      headerName: 'Gebucht am',
      width: 130,
      renderCell: (params) => (
        format(parseISO(params.value), 'dd.MM.yyyy HH:mm', { locale: de })
      )
    },
    {
      field: 'rating',
      headerName: 'Bewertung',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Rating value={params.value} readOnly size="small" />
        ) : (
          <Typography variant="body2" color="textSecondary">-</Typography>
        )
      )
    },
    {
      field: 'actions',
      headerName: 'Aktionen',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const booking = params.row
        
        return (
          <Stack direction="row" spacing={1}>
            {booking.status === 'confirmed' && (
              <IconButton
                size="small"
                color="success"
                onClick={() => {
                  setSelectedBooking(booking)
                  setCompleteDialog(true)
                }}
                title="Abschließen"
              >
                <CheckCircle />
              </IconButton>
            )}
            {booking.status === 'confirmed' && (
              <IconButton
                size="small"
                color="error"
                onClick={() => handleCancel(booking.id)}
                title="Stornieren"
              >
                <Cancel />
              </IconButton>
            )}
          </Stack>
        )
      }
    }
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Buchungen verwalten
        </Typography>
      </Box>

      {/* Filter */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>🔍 Filter</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Alle Status</MenuItem>
                  <MenuItem value="pending">Ausstehend</MenuItem>
                  <MenuItem value="confirmed">Bestätigt</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                  <MenuItem value="cancelled">Storniert</MenuItem>
                  <MenuItem value="no_show">Nicht erschienen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Datum"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Mitglieder-UUID (optional)"
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                fullWidth
                placeholder="z.B. member-uuid"
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
              rows={bookings}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'booked_at', sort: 'desc' }] }
              }}
              disableRowSelectionOnClick
            />
          </div>
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog
        open={completeDialog}
        onClose={() => setCompleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Buchung abschließen
        </DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  <strong>Mitglied:</strong> {selectedBooking.member_details.full_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Aufgabe:</strong> {selectedBooking.time_slot_details?.schedule_details?.task_type_details?.name}
                </Typography>
              </Box>
              
              <Box>
                <Typography component="legend" gutterBottom>
                  Mitgliederbewertung (1-5 Sterne)
                </Typography>
                <Rating
                  value={completionData.rating}
                  onChange={(event, newValue) => {
                    setCompletionData(prev => ({ ...prev, rating: newValue }))
                  }}
                />
              </Box>
              
              <Box>
                <Typography component="legend" gutterBottom>
                  Arbeitsqualität (1-5 Sterne)
                </Typography>
                <Rating
                  value={completionData.work_quality_rating}
                  onChange={(event, newValue) => {
                    setCompletionData(prev => ({ ...prev, work_quality_rating: newValue }))
                  }}
                />
              </Box>
              
              <TextField
                label="Öffentliche Notizen"
                multiline
                rows={3}
                value={completionData.notes}
                onChange={(e) => setCompletionData(prev => ({
                  ...prev, notes: e.target.value
                }))}
                placeholder="Öffentliche Anmerkungen zur Aufgabe..."
              />
              
              <TextField
                label="Betreuer-Notizen (intern)"
                multiline
                rows={2}
                value={completionData.supervisor_notes}
                onChange={(e) => setCompletionData(prev => ({
                  ...prev, supervisor_notes: e.target.value
                }))}
                placeholder="Interne Anmerkungen für Betreuer..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="success"
          >
            Buchung abschließen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}