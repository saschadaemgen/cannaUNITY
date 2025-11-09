// frontend/src/apps/controller/components/ScheduleEditor.jsx

import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Button, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import { Add, Edit, Delete, Save } from '@mui/icons-material'
import { TimePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { de } from 'date-fns/locale'
import api from '@/utils/api'

const WEEKDAYS = [
  { value: 0, label: 'Montag' },
  { value: 1, label: 'Dienstag' },
  { value: 2, label: 'Mittwoch' },
  { value: 3, label: 'Donnerstag' },
  { value: 4, label: 'Freitag' },
  { value: 5, label: 'Samstag' },
  { value: 6, label: 'Sonntag' },
]

export default function ScheduleEditor({ controlUnitId, unitType }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    weekday: 0,
    start_time: null,
    end_time: null,
    target_value: 0,
    secondary_value: null,
    is_active: true,
  })

  useEffect(() => {
    loadSchedules()
  }, [controlUnitId])

  const loadSchedules = async () => {
    try {
      const response = await api.get('/controller/schedules/', {
        params: { control_unit: controlUnitId }
      })
      setSchedules(response.data.results || response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Zeitpläne:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        control_unit: controlUnitId,
        start_time: formData.start_time?.toTimeString().slice(0, 8),
        end_time: formData.end_time?.toTimeString().slice(0, 8),
      }

      if (editingSchedule) {
        await api.put(`/controller/schedules/${editingSchedule.id}/`, data)
      } else {
        await api.post('/controller/schedules/', data)
      }

      loadSchedules()
      handleCloseDialog()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Zeitplan wirklich löschen?')) {
      try {
        await api.delete(`/controller/schedules/${id}/`)
        loadSchedules()
      } catch (error) {
        console.error('Fehler beim Löschen:', error)
      }
    }
  }

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        ...schedule,
        start_time: new Date(`2000-01-01T${schedule.start_time}`),
        end_time: new Date(`2000-01-01T${schedule.end_time}`),
      })
    } else {
      setEditingSchedule(null)
      setFormData({
        weekday: 0,
        start_time: null,
        end_time: null,
        target_value: 0,
        secondary_value: null,
        is_active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingSchedule(null)
  }

  const getValueLabel = () => {
    const labels = {
      lighting: 'Dimmlevel (%)',
      climate: 'Temperatur (°C)',
      watering: 'Durchfluss (l/min)',
      co2: 'CO2-Level (ppm)',
      humidity: 'Luftfeuchtigkeit (%)',
    }
    return labels[unitType] || 'Zielwert'
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Zeitplan</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Neuer Eintrag
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Wochentag</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Ende</TableCell>
                <TableCell>{getValueLabel()}</TableCell>
                <TableCell>Aktiv</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.weekday_display}</TableCell>
                  <TableCell>{schedule.start_time}</TableCell>
                  <TableCell>{schedule.end_time}</TableCell>
                  <TableCell>{schedule.target_value}</TableCell>
                  <TableCell>
                    <Switch checked={schedule.is_active} disabled />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(schedule)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingSchedule ? 'Zeitplan bearbeiten' : 'Neuer Zeitplan'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Wochentag</InputLabel>
                <Select
                  value={formData.weekday}
                  onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                  label="Wochentag"
                >
                  {WEEKDAYS.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" gap={2}>
                <TimePicker
                  label="Startzeit"
                  value={formData.start_time}
                  onChange={(newValue) => setFormData({ ...formData, start_time: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                <TimePicker
                  label="Endzeit"
                  value={formData.end_time}
                  onChange={(newValue) => setFormData({ ...formData, end_time: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Box>

              <TextField
                label={getValueLabel()}
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                fullWidth
              />

              <FormControl>
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Typography variant="body2">Aktiv</Typography>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Abbrechen</Button>
            <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  )
}