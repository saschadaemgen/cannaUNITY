import { useContext, useState } from 'react'
import { Grid, Typography, Box, useTheme } from '@mui/material'
import OptionCard from '../components/OptionCard'
import { ColorModeContext } from '../../../context/ColorModeContext'

export default function OptionsDashboard() {
  const colorMode = useContext(ColorModeContext)
  const theme = useTheme()
  const [mode, setMode] = useState(theme.palette.mode)

  const toggleMode = () => {
    colorMode.toggleColorMode()
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const options = [
    {
      id: 1,
      title: 'Dark Mode',
      value: mode === 'dark' ? '🌑 Dunkel' : '🌕 Hell',
      description: 'Wechselt zwischen hellem und dunklem Erscheinungsbild.',
      toggleValue: mode === 'dark',
      onToggle: () => toggleMode(),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Systemoptionen</Typography>
      <Grid container spacing={2}>
        {options.map((opt) => (
          <Grid item xs={12} sm={6} md={4} key={opt.id}>
            <OptionCard {...opt} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
