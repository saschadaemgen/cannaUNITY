import { Typography, Box, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'

export default function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Willkommen bei cannaUNITY 🌱
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        component={Link}
        to="/aufgaben"
      >
        Zu den Aufgaben
      </Button>
    </Box>
  )
}
