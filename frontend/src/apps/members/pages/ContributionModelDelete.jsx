
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import api from '../../../utils/api'

export default function ContributionModelDelete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/beitragsmodelle/${id}/`)
      .then(res => setModel(res.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = () => {
    api.delete(`/beitragsmodelle/${id}/`)
      .then(() => navigate('/beitragsmodelle'))
      .catch(err => alert('Error deleting'))
  }

  if (loading || !model) return <CircularProgress />

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Delete Contribution Model</Typography>
      <Typography>Are you sure you want to delete <strong>{model.name}</strong>?</Typography>
      <Box mt={3}>
        <Button variant="contained" color="error" onClick={handleDelete}>Yes, delete</Button>
        <Button sx={{ ml: 2 }} onClick={() => navigate('/beitragsmodelle')}>Cancel</Button>
      </Box>
    </Box>
  )
}
