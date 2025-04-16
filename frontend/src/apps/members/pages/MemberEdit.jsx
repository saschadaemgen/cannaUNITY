
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, CircularProgress, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Divider, Tooltip
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import api from '../../../utils/api'

export default function MemberEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mojoOpen, setMojoOpen] = useState(false)

  const today = new Date()
  const minBirthdate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const minBirthdateISO = minBirthdate.toISOString().split('T')[0]

  useEffect(() => {
    api.get(`/members/${id}/`).then(res => {
      setMember(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'birthdate') {
      setMember((prev) => ({ ...prev, birthdate: value }))
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const inputDate = new Date(value)
        if (!isNaN(inputDate.getTime()) && inputDate > minBirthdate) {
          setMember((prev) => ({ ...prev, birthdate: minBirthdateISO }))
          setMojoOpen(true)
        }
      }
    } else {
      setMember((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    api.put(`/members/${id}/`, member)
      .then(() => navigate('/mitglieder'))
      .catch(err => {
        console.error(err)
        alert('Fehler beim Speichern. Bitte überprüfen Sie die Eingaben.')
      })
  }

  if (loading || !member) return <CircularProgress />

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: 'auto', mt: 4, backgroundColor: '#fafafa', boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>Mitglied bearbeiten</Typography>

      <Box mt={3}>
        <Typography variant="h6">🧍 Persönliche Daten</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="Vorname" name="first_name" value={member.first_name || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Nachname" name="last_name" value={member.last_name || ''} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="E-Mail" name="email" value={member.email || ''} onChange={handleChange} /></Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Geburtsdatum"
              type="date"
              name="birthdate"
              value={member.birthdate || minBirthdateISO}
              onChange={handleChange}
              inputProps={{ max: minBirthdateISO }}
              InputLabelProps={{ shrink: true }}
              helperText="Mindestalter: 18 Jahre (§ 3 Abs. 1 KCanG)"
            />
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">🏠 Adresse</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={3}><TextField fullWidth label="PLZ" name="zip_code" value={member.zip_code || ''} onChange={handleChange} /></Grid>
          <Grid item xs={5}><TextField fullWidth label="Stadt" name="city" value={member.city || ''} onChange={handleChange} /></Grid>
          <Grid item xs={3}><TextField fullWidth label="Straße" name="street" value={member.street || ''} onChange={handleChange} /></Grid>
          <Grid item xs={1}><TextField fullWidth label="Nr." name="house_number" value={member.house_number || ''} onChange={handleChange} /></Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">💳 Finanzen</Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField fullWidth label="Kontostand (€)" type="number" name="kontostand" value={member.kontostand || 0} onChange={handleChange} />
      </Box>

      <Box mt={4}>
        <Typography variant="h6">🧑‍⚕️ Gesundheit</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Körperliche Einschränkungen" name="physical_limitations" value={member.physical_limitations || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Geistige Einschränkungen" name="mental_limitations" value={member.mental_limitations || ''} onChange={handleChange} /></Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">📝 Intern</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Bemerkungen" name="notes" value={member.notes || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Verwarnungen" name="warnings" value={member.warnings || ''} onChange={handleChange} /></Grid>
        </Grid>
      </Box>

      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave}>Speichern</Button>
        <Button onClick={() => navigate('/mitglieder')} sx={{ ml: 2 }}>Abbrechen</Button>
      </Box>

      <Dialog open={mojoOpen} onClose={() => setMojoOpen(false)} PaperProps={{ sx: { p: 2, backdropFilter: 'blur(4px)', borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Altersprüfung nicht bestanden</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Laut § 3 Absatz 1 des Konsumcannabisgesetzes (KCanG) ist eine Mitgliedschaft ausschließlich volljährigen Personen ab 18 Jahren gestattet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Das eingegebene Geburtsdatum wurde automatisch auf das Mindestalter korrigiert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMojoOpen(false)} variant="contained">Verstanden</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
