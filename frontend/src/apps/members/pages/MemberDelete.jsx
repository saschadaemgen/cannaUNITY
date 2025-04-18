import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import api from '../../../utils/api'

export default function MemberDelete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/members/${id}/`)
      .then(res => setMember(res.data))
      .catch(err => {
        console.error('Fehler beim Laden des Mitglieds:', err)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = () => {
    api.delete(`/members/${id}/`)
      .then(() => navigate('/mitglieder'))
      .catch(err => {
        console.error('Fehler beim Löschen:', err)
        alert('Fehler beim Löschen des Mitglieds.')
      })
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={4}><CircularProgress/></Box>
  }
  if (!member) {
    return <Typography color="error" mt={4}>Mitglied nicht gefunden.</Typography>
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Mitglied löschen
      </Typography>
      <Typography gutterBottom>
        Möchten Sie <strong>{member.first_name} {member.last_name}</strong> wirklich löschen?
      </Typography>
      <Box mt={3}>
        <Button variant="contained" color="error" onClick={handleDelete}>
          Ja, löschen
        </Button>
        <Button sx={{ ml: 2 }} onClick={() => navigate('/mitglieder')}>
          Abbrechen
        </Button>
      </Box>
    </Box>
  )
}
