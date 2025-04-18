import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  MenuItem,
  CircularProgress
} from '@mui/material'
import api from '../../../utils/api'

export default function MemberCreate() {
  const navigate = useNavigate()

  // Heute - 18 Jahre
  const today = new Date()
  const minBirthdate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
  const minBirthdateISO = minBirthdate.toISOString().split('T')[0]

  const [member, setMember] = useState({
    first_name: '',
    last_name: '',
    email: '',
    birthdate: minBirthdateISO,
    zip_code: '',
    city: '',
    street: '',
    house_number: '',
    kontostand: 0,
    physical_limitations: '',
    mental_limitations: '',
    notes: '',
    warnings: '',
    beitragsmodell: ''
  })
  const [contributionModels, setContributionModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(true)

  // Beiträge laden
  useEffect(() => {
    api.get('/beitragsmodelle/')
      .then(res => setContributionModels(res.data.results))
      .catch(() => setContributionModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  const handleChange = (e) => {
    setMember({ ...member, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    api.post('/members/', member)
      .then(() => navigate('/mitglieder'))
      .catch((err) => {
        console.error('Fehler beim Speichern:', err)
        alert('Fehler beim Speichern. Bitte prüfen Sie die Eingaben.')
      })
  }

  if (loadingModels) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Neues Mitglied anlegen</Typography>
      <Grid container spacing={2}>
        {/* Vorname, Nachname, E‑Mail */}
        <Grid item xs={6}>
          <TextField fullWidth label="Vorname" name="first_name" value={member.first_name} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Nachname" name="last_name" value={member.last_name} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="E‑Mail" name="email" value={member.email} onChange={handleChange} />
        </Grid>

        {/* Geburtsdatum */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Geburtsdatum"
            type="date"
            name="birthdate"
            value={member.birthdate}
            onChange={handleChange}
            inputProps={{ max: minBirthdateISO }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Kontostand */}
        <Grid item xs={6}>
          <TextField fullWidth label="Kontostand (€)" type="number" name="kontostand" value={member.kontostand} onChange={handleChange} />
        </Grid>

        {/* Adresse */}
        <Grid item xs={3}>
          <TextField fullWidth label="PLZ" name="zip_code" value={member.zip_code} onChange={handleChange} />
        </Grid>
        <Grid item xs={5}>
          <TextField fullWidth label="Stadt" name="city" value={member.city} onChange={handleChange} />
        </Grid>
        <Grid item xs={3}>
          <TextField fullWidth label="Straße" name="street" value={member.street} onChange={handleChange} />
        </Grid>
        <Grid item xs={1}>
          <TextField fullWidth label="Nr." name="house_number" value={member.house_number} onChange={handleChange} />
        </Grid>

        {/* Dropdown Beitragsmodell */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            select
            label="Beitragsmodell"
            name="beitragsmodell"
            value={member.beitragsmodell}
            onChange={handleChange}
          >
            <MenuItem value="">– Keines –</MenuItem>
            {contributionModels.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name} – {m.preis_monatlich} € / {m.maximalmenge} g
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Weitere Felder */}
        <Grid item xs={6}>
          <TextField fullWidth multiline minRows={2} label="Körperliche Einschränkungen" name="physical_limitations" value={member.physical_limitations} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth multiline minRows={2} label="Geistige Einschränkungen" name="mental_limitations" value={member.mental_limitations} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth multiline minRows={2} label="Bemerkungen" name="notes" value={member.notes} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth multiline minRows={2} label="Verwarnungen" name="warnings" value={member.warnings} onChange={handleChange} />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Speichern
        </Button>
        <Button onClick={() => navigate('/mitglieder')} sx={{ ml: 2 }}>
          Abbrechen
        </Button>
      </Box>
    </Box>
  )
}
