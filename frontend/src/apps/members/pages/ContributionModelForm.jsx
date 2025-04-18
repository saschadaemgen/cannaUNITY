
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, MenuItem, Grid, CircularProgress
} from '@mui/material'
import api from '../../../utils/api'

const QUALITY_LEVELS = [
  { value: 'Q1', label: 'Q1 – Basisqualität' },
  { value: 'Q2', label: 'Q2 – Mittlere Qualität' },
  { value: 'Q3', label: 'Q3 – Premiumqualität' },
]

export default function ContributionModelForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)

  const [model, setModel] = useState({
    name: '',
    beschreibung: '',
    maximalmenge: '',
    preis_monatlich: '',
    ist_mixmodell: false,
  })
  const [entries, setEntries] = useState([])

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      api.get(`/beitragsmodelle/${id}/`)
        .then(res => setModel(res.data))
        .then(() => api.get(`/beitragsmodell-eintraege/?modell=${id}`))
        .then(res => setEntries(res.data))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setModel(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries]
    newEntries[index][field] = value
    setEntries(newEntries)
  }

  const addEntry = () => {
    setEntries([...entries, { qualitaetsstufe: 'Q1', menge: '', preis_pro_gramm: '' }])
  }

  const removeEntry = (index) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      const res = isEdit
        ? await api.put(`/beitragsmodelle/${id}/`, model)
        : await api.post('/beitragsmodelle/', model)
      const modelId = isEdit ? id : res.data.id
      await Promise.all(entries.map(entry =>
        api.post('/beitragsmodell-eintraege/', { ...entry, modell: modelId })
      ))
      navigate('/beitragsmodelle')
    } catch (err) {
      console.error(err)
      alert('Fehler beim Speichern der Daten')
    }
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Beitragsmodell bearbeiten' : 'Neues Beitragsmodell'}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="Name" name="name" fullWidth value={model.name} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Monatsbeitrag (€)" name="preis_monatlich" type="number" fullWidth value={model.preis_monatlich} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Maximalmenge (g)" name="maximalmenge" type="number" fullWidth value={model.maximalmenge} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Stecklings-Abo" name="ist_mixmodell" select fullWidth value={model.ist_mixmodell} onChange={handleChange}>
            <MenuItem value={true}>Ja</MenuItem>
            <MenuItem value={false}>Nein</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="h6">Qualitätsstufen</Typography>
        {entries.map((e, idx) => (
          <Grid container spacing={2} key={idx} mt={1}>
            <Grid item xs={3}>
              <TextField select label="Stufe" fullWidth value={e.qualitaetsstufe} onChange={(ev) => handleEntryChange(idx, 'qualitaetsstufe', ev.target.value)}>
                {QUALITY_LEVELS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField label="Menge (g)" type="number" fullWidth value={e.menge} onChange={(ev) => handleEntryChange(idx, 'menge', ev.target.value)} />
            </Grid>
            <Grid item xs={3}>
              <TextField label="Preis pro g (€)" type="number" fullWidth value={e.preis_pro_gramm} onChange={(ev) => handleEntryChange(idx, 'preis_pro_gramm', ev.target.value)} />
            </Grid>
            <Grid item xs={3}>
              <Button color="error" onClick={() => removeEntry(idx)}>Entfernen</Button>
            </Grid>
          </Grid>
        ))}
        <Box mt={2}>
          <Button variant="outlined" onClick={addEntry}>+ Eintrag hinzufügen</Button>
        </Box>
      </Box>
      <Box mt={4}>
        <Button variant="contained" onClick={handleSave}>Speichern</Button>
        <Button sx={{ ml: 2 }} onClick={() => navigate('/beitragsmodelle')}>Abbrechen</Button>
      </Box>
    </Box>
)
}
