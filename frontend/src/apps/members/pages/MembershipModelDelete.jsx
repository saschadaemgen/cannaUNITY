
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import api from '../../../utils/api'

export default function MembershipModelDelete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/mitgliedschaftsmodelle/${id}/`)
      .then(res => setModel(res.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = () => {
    api.delete(`/mitgliedschaftsmodelle/${id}/`)
      .then(() => navigate('/beitragsmodelle'))
      .catch(err => {
        console.error(err)
        alert('Fehler beim Löschen')
      })
  }

  if (loading || !model) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Mitgliedschaftsmodell löschen
      </Typography>
      <Typography gutterBottom>
        Möchtest du das Modell <strong>{model.name}</strong> wirklich löschen?
      </Typography>
      <Box mt={3}>
        <Button variant="contained" color="error" onClick={handleDelete}>
          Ja, löschen
        </Button>
        <Button sx={{ ml: 2 }} onClick={() => navigate('/beitragsmodelle')}>
          Abbrechen
        </Button>
      </Box>
    </Box>
  )
}
