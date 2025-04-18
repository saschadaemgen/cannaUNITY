
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, MenuItem, Grid, CircularProgress
} from '@mui/material'
import api from '../../../utils/api'

export default function MembershipModelForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)

  const [model, setModel] = useState({
    name: '',
    beschreibung: '',
    alterskategorie: '21+',
    produkttyp: 'cannabis',
    menge_gramm: '',
    preis_monatlich: '',
    vermehrungsmaterial: false,
    preis_vermehrung: ''
  })

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      api.get(`/mitgliedschaftsmodelle/${id}/`)
        .then(res => setModel(res.data))
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

  const handleSave = () => {
    const request = isEdit
      ? api.put(`/mitgliedschaftsmodelle/${id}/`, model)
      : api.post('/mitgliedschaftsmodelle/', model)

    request.then(() => navigate('/beitragsmodelle'))
      .catch(err => {
        console.error(err)
        alert('Fehler beim Speichern')
      })
  }

  if (loading) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Mitgliedschaftsmodell bearbeiten' : 'Neues Mitgliedschaftsmodell'}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Name" name="name" value={model.name} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Kurzbeschreibung" name="beschreibung" value={model.beschreibung} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth select label="Alterskategorie" name="alterskategorie" value={model.alterskategorie} onChange={handleChange}>
            <MenuItem value="18-21">18–21 Jahre (max. 10 % THC)</MenuItem>
            <MenuItem value="21+">21+ Jahre (über 10 % THC erlaubt)</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth select label="Produkttyp" name="produkttyp" value={model.produkttyp} onChange={handleChange}>
            <MenuItem value="cannabis">🌿 Marihuana</MenuItem>
            <MenuItem value="haschisch">🧱 Haschisch</MenuItem>
            <MenuItem value="mix">🔀 Mix</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Monatsmenge (g)" type="number" name="menge_gramm" value={model.menge_gramm} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Monatsbeitrag (€)" type="number" name="preis_monatlich" value={model.preis_monatlich} onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth select label="Stecklings-Abo" name="vermehrungsmaterial" value={model.vermehrungsmaterial} onChange={handleChange}>
            <MenuItem value={true}>Ja</MenuItem>
            <MenuItem value={false}>Nein</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Preis Stecklings-Abo (€)" type="number" name="preis_vermehrung" value={model.preis_vermehrung} onChange={handleChange} />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button variant="contained" onClick={handleSave}>
          Speichern
        </Button>
        <Button sx={{ ml: 2 }} onClick={() => navigate('/beitragsmodelle')}>
          Abbrechen
        </Button>
      </Box>
    </Box>
  )
}
