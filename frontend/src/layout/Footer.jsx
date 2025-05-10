// src/layout/Footer.jsx
import { Box, Typography, Button, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/utils/api'
import { useEffect, useState } from 'react'
import api from '@/utils/api';

export default function Footer() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [footerMode, setFooterMode] = useState('full')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)

    const loadDesignOptions = async () => {
      if (!token) return // 🚨 Bugfix: keine Anfrage ohne Token!

      try {
        const savedOptions = localStorage.getItem('designOptions')
        if (savedOptions) {
          const parsedOptions = JSON.parse(savedOptions)
          if (parsedOptions.footerMode) {
            setFooterMode(parsedOptions.footerMode)
          }
        }

        const response = await api.get('/options/design-options/')
        const data = response.data

        if (data.options) {
          const designOptions = JSON.parse(data.options)
          if (designOptions.footerMode) {
            setFooterMode(designOptions.footerMode)
            localStorage.setItem('designOptions', JSON.stringify(designOptions))
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Footer-Einstellungen:', error)
      }
    }

    loadDesignOptions()

    const handleDesignChange = (event) => {
      if (event.detail?.designOptions?.footerMode) {
        setFooterMode(event.detail.designOptions.footerMode)
      }
    }

    window.addEventListener('designChanged', handleDesignChange)

    return () => {
      window.removeEventListener('designChanged', handleDesignChange)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsLoggedIn(false)
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const getFooterTitle = () => {
    switch (footerMode) {
      case 'full':
        return 'cannaUNITY (Pre-Alpha) Version 0.6.18'
      case 'title':
        return 'cannaUNITY'
      case 'none':
        return ''
      default:
        return 'cannaUNITY (Pre-Alpha) Version 0.6.18'
    }
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
        {getFooterTitle()}
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
