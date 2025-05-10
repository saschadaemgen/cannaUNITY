import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Link,
} from '@mui/material'
import { login } from '@/utils/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/')
    } else {
      setError('Login fehlgeschlagen.')
    }
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: '#fff',
        px: 2,
      }}
    >
      <Box
        maxWidth={420}
        width="100%"
        sx={{ animation: 'fadeInUp 0.6s ease-out' }}
      >
        {/* Titel */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            cannaUNITY Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sichere Anmeldung für autorisierte Mitglieder.
          </Typography>
        </Box>

        {/* Formular-Karte */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px) scale(1.01)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            },
          }}
        >
          <form onSubmit={handleLogin}>
            <TextField
              label="Mitgliedsname"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <TextField
              label="Passwort"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && (
              <Typography color="error" mt={1}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Einloggen
            </Button>
          </form>

          <Typography
            variant="caption"
            color="text.secondary"
            mt={2}
            display="block"
            textAlign="center"
          >
            Probleme beim Login?{' '}
            <Link href="mailto:kontakt@cannaunity.de">Support kontaktieren</Link>
          </Typography>
        </Paper>
      </Box>

      {/* Footer */}
      <Box mt={6} textAlign="center">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ opacity: 0.7 }}
        >
          cannaUNITY (Pre-Alpha) Version 0.6.18
        </Typography>
      </Box>

      {/* Animationen */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  )
}
