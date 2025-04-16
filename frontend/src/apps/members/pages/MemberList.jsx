import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Box,
  Pagination,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
} from '@mui/material'
import api from '../../../utils/api'

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userGroups, setUserGroups] = useState([])

  const navigate = useNavigate()
  const isTeamleiter = userGroups.includes('teamleiter')

  // Benutzergruppen laden
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get('/user-info/')
        setUserGroups(res.data.groups || [])
      } catch {
        setUserGroups([])
      }
    }
    fetchUserInfo()
  }, [])

  // Mitglieder laden
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/members/?page=${page}`)
        if (Array.isArray(res.data.results)) {
          setMembers(res.data.results)
          setTotalPages(Math.ceil(res.data.count / 25))
          setError(null)
        } else {
          setError('API-Fehler: Kein gültiges results-Feld')
        }
      } catch {
        setError('Fehler beim Laden der Mitglieder.')
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [page])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Mitgliederliste</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/mitglieder/neu')}>
          Mitglied neu
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Geburtsdatum</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Kontostand</TableCell>
                {isTeamleiter && <TableCell align="right">Aktionen</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.first_name} {member.last_name}</TableCell>
                  <TableCell>{member.birthdate || '—'}</TableCell>
                  <TableCell>
                    {member.street} {member.house_number},<br />
                    {member.zip_code} {member.city}
                  </TableCell>
                  <TableCell>{member.email || '—'}</TableCell>
                  <TableCell>{member.kontostand} €</TableCell>
                  {isTeamleiter && (
                    <TableCell align="right">
                      <Button size="small" onClick={() => navigate(`/mitglieder/${member.id}/edit`)}>
                        Bearbeiten
                      </Button>
                      <Button size="small" color="error" onClick={() => navigate(`/mitglieder/${member.id}/delete`)}>
                        Löschen
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={4} display="flex" justifyContent="center">
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <Box mt={2} display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="text.secondary">
          Aktuell geladen: {members.length} Mitglieder
        </Typography>
      </Box>
    </Box>
  )
}
