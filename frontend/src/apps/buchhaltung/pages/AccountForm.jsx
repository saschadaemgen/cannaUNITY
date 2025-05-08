import React, { useEffect, useState } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import axios from '@/utils/api'
import { useNavigate, useParams } from 'react-router-dom'

const kontoTypen = [
  { value: 'AKTIV', label: 'Aktivkonto' },
  { value: 'PASSIV', label: 'Passivkonto' },
  { value: 'ERTRAG', label: 'Ertragskonto' },
  { value: 'AUFWAND', label: 'Aufwandskonto' },
]

const AccountForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    kontonummer: '',
    name: '',
    konto_typ: 'AKTIV',
    saldo: 0,
    category: ''
  })

  const [loading, setLoading] = useState(false)

  // Laden bei Bearbeitung
  useEffect(() => {
    if (isEdit) {
      axios.get(`/buchhaltung/accounts/${id}/`)
        .then(res => setFormData(res.data))
        .catch(err => console.error('Fehler beim Laden des Kontos:', err))
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    const method = isEdit ? 'put' : 'post'
    const url = isEdit ? `/buchhaltung/accounts/${id}/` : '/buchhaltung/accounts/'

    axios[method](url, formData)
      .then(() => navigate('/buchhaltung/konten'))
      .catch(err => {
        console.error('Fehler beim Speichern:', err)
        setLoading(false)
      })
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ color: '#009245', fontWeight: 'bold' }}>
        {isEdit ? '✏️ Konto bearbeiten' : '➕ Neues Konto anlegen'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Kontonummer"
                  name="kontonummer"
                  value={formData.kontonummer}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Kontoname"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Kontotyp"
                  name="konto_typ"
                  select
                  value={formData.konto_typ}
                  onChange={handleChange}
                  fullWidth
                >
                  {kontoTypen.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Saldo (€)"
                  name="saldo"
                  type="number"
                  value={formData.saldo}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Kategorie"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={loading}
                >
                  {isEdit ? 'Speichern' : 'Anlegen'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AccountForm
