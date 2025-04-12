import { Box, Typography, useTheme } from '@mui/material'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default function DateBar() {
  const theme = useTheme()
  const today = format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })

  return (
    <Box
      sx={{
        px: 2,
        py: 0.5,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[100],
        color: theme.palette.text.secondary,
        fontSize: '0.8rem',
        borderBottom: '1px solid',
        borderBottomColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[300],
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 4px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="caption">{today}</Typography>
    </Box>
  )
}
