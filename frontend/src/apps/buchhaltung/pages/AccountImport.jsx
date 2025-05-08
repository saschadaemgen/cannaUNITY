import React from 'react'
import { Box, Typography, Button, Alert } from '@mui/material'
import axios from '@/utils/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AccountImport = () => {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleImport = () => {
    axios.post('/buchhaltung/accounts/import/')
      .then(res => setResult(res.data))
      .catch(err => {
        setError('Fehler beim Importieren.')
        console.error(err)
      })
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#009245' }}>
        📥 Konten importieren
      </Typography>

      <Typography gutterBottom>
        Mit einem Klick werden alle Standardkonten (ohne Förderkredit) importiert.
      </Typography>

      <Button variant="contained" color="success" onClick={handleImport}>
        Import starten
      </Button>

      {result && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {result.message}<br />
          Erstellt: {result.erstellt} &nbsp;–&nbsp; Übersprungen: {result.übersprungen}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/buchhaltung/konten')}>
        Zurück zur Kontenübersicht
      </Button>
    </Box>
  )
}

export default AccountImport
