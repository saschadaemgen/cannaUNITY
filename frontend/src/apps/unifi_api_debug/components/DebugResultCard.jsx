import { Card, CardContent, Typography } from '@mui/material'

export default function DebugResultCard({ result }) {
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Testergebnis</Typography>
        <Typography>
          <strong>Token:</strong> {result.token}
        </Typography>
        <Typography>
          <strong>UniFi-Nutzer:</strong> {result.unifi_name || '–'}
        </Typography>
        <Typography color={result.member_name !== 'Nicht gefunden' ? 'success.main' : 'error.main'}>
          <strong>Mitglied:</strong> {result.member_name}
        </Typography>
      </CardContent>
    </Card>
  )
}
