import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import api from '../../../utils/api'

export default function MemberDelete() {
  const { id } = useParams()
  const navigate = useNavigate()

  const handleDelete = () => {
    api.delete(`/members/${id}/`).then(() => {
      navigate('/mitglieder')
    })
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Mitglied wirklich löschen?
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Diese Aktion kann nicht rückgängig gemacht werden.
      </Typography>
      <Button variant="contained" color="error" onClick={handleDelete}>Löschen</Button>
      <Button onClick={() => navigate('/mitglieder')} sx={{ ml: 2 }}>Abbrechen</Button>
    </Box>
  )
}
