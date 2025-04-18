
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress
} from '@mui/material'
import api from '../../../utils/api'

export default function MembershipModelList() {
  const [modelle, setModelle] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api.get('/mitgliedschaftsmodelle/')
      .then(res => setModelle(res.data))
      .catch(err => {
        console.error(err)
        setModelle([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Mitgliedschaftsmodelle</Typography>
        <Button variant="contained" onClick={() => navigate('/beitragsmodelle/neu')}>
          Neues Modell
        </Button>
      </Box>

      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Modellname</TableCell>
                <TableCell>Monatsbeitrag (€)</TableCell>
                <TableCell>Monatsmenge (g)</TableCell>
                <TableCell>Stecklings-Abo</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelle.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{parseFloat(m.preis_monatlich).toFixed(2)} €</TableCell>
                  <TableCell>{m.menge_gramm} g</TableCell>
                  <TableCell>{m.vermehrungsmaterial ? 'Ja' : 'Nein'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/beitragsmodelle/${m.id}/edit`)}>
                      Bearbeiten
                    </Button>
                    <Button size="small" color="error" onClick={() => navigate(`/beitragsmodelle/${m.id}/delete`)}>
                      Löschen
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
