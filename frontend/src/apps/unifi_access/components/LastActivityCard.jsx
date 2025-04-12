import { Box, Typography } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import DoorFrontIcon from '@mui/icons-material/DoorFront'

export default function ActivityInfo({ actor, timestamp, door, method }) {
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderLeft: '4px solid #388e3c',  // z.B. grün
        boxShadow: 3,
        p: 2,
        display: 'flex',
        alignItems: 'center',   // Diese Zeile sorgt für mittige Ausrichtung der Icons
        gap: 1,
        mt: 2,
      }}
    >
      {/* Vertikale Ausrichtung der Icons anpassen */}
      <AccessTimeIcon sx={{ color: '#388e3c', fontSize: 28, verticalAlign: 'middle' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', fontSize: 16 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
          Letzte Aktivität
        </Typography>
        <LockOpenIcon sx={{ fontSize: 18, mx: 0.5, verticalAlign: 'middle' }} />
        <strong>{actor}</strong>
        <Typography sx={{ mx: 0.5 }}>hat sich am</Typography>
        <strong>{timestamp}</strong>
        <Typography sx={{ mx: 0.5 }}>über {method} am</Typography>
        <DoorFrontIcon sx={{ fontSize: 18, mx: 0.5, verticalAlign: 'middle' }} />
        <strong>{door}</strong>
        <Typography sx={{ ml: 0.5 }}>eingeloggt.</Typography>
      </Box>
    </Box>
  )
}
