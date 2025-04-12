// src/layout/Footer.jsx
import { Box, Typography, Button, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { logout } from '../utils/api'
import { useEffect, useState } from 'react'

export default function Footer() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // ✅ Check ob eingeloggt beim Mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsLoggedIn(false)
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 2,
        textAlign: 'right',
        fontSize: '0.8rem',
        borderTop: '1px solid',
        borderTopColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[300],
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[100],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        ❤️ cannaUNITY v0.50.03
      </Typography>

      {isLoggedIn ? (
        <Button color="error" size="small" onClick={handleLogout}>
          Logout
        </Button>
      ) : (
        <Button color="success" size="small" onClick={handleLogin}>
          Login
        </Button>
      )}
    </Box>
  )
}
