import React, { useEffect, useState } from 'react'
import api from '../../../utils/api'
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Pagination,
  CircularProgress,
} from '@mui/material'

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userGroups, setUserGroups] = useState([])

  // ✅ Benutzergruppen abrufen (für Teamleiter-Buttons)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get('/user-info/')
        setUserGroups(res.data.groups || [])
        console.debug('[user-info]', res.data)
      } catch (err) {
        console.warn('❌ Fehler beim Abrufen der Benutzerinfo', err)
        setUserGroups([])
      }
    }

    fetchUserInfo()
  }, [])

  // ✅ Mitglieder laden (paginiert)
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/members/?page=${page}`)
        console.debug('[members]', res.data)

        if (Array.isArray(res.data.results)) {
          setMembers(res.data.results)
          setTotalPages(Math.ceil(res.data.count / 25))
          setError(null)
        } else {
          setError('API-Fehler: Kein gültiges results-Feld')
        }
      } catch (err) {
        console.warn('❌ Fehler beim Laden der Mitglieder:', err)
        setError('Nicht autorisiert oder Serverfehler')
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [page])

  const isTeamleiter = userGroups.includes('teamleiter')

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mitgliederliste
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : members.length === 0 ? (
        <Typography>Keine Mitglieder gefunden.</Typography>
      ) : (
        <List>
          {members.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                isTeamleiter && (
                  <>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => console.log('Bearbeiten:', member.id)}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => console.log('Löschen:', member.id)}
                    >
                      Löschen
                    </Button>
                  </>
                )
              }
            >
              <ListItemText
                primary={`${member.first_name} ${member.last_name}`}
                secondary={member.email}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box mt={3} display="flex" justifyContent="center">
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
