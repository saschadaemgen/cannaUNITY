
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress
} from '@mui/material'
import api from '../../../utils/api'

export default function ContributionModelList() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api.get('/beitragsmodelle/')
      .then(res => setModels(res.data))
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Beitragsmodelle</Typography>
        <Button variant="contained" onClick={() => navigate('/beitragsmodelle/neu')}>
          Neues Beitragsmodell
        </Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Monatsbeitrag (€)</TableCell>
                <TableCell>Maximalmenge (g)</TableCell>
                <TableCell>Stecklings-Abo</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{parseFloat(m.preis_monatlich).toFixed(2)}</TableCell>
                  <TableCell>{m.maximalmenge}</TableCell>
                  <TableCell>{m.ist_mixmodell ? 'Ja' : 'Nein'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/beitragsmodelle/${m.id}/edit`)}>
                      Bearbeiten
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
)
}
