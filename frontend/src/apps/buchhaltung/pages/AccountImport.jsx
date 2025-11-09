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

      <Typography gutterBottom sx={{ mb: 3 }}>
        Mit einem Klick werden alle Standardkonten importiert.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleImport}
          size="large"
        >
          Import starten
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => navigate('/buchhaltung/konten')}
          size="large"
        >
          Zurück zur Kontenübersicht
        </Button>
      </Box>

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
    </Box>
  )
}

export default AccountImport