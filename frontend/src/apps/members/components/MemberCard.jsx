import React from 'react'
import {
  Card, CardContent, Typography, IconButton, Box
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export default function MemberCard({ member, onEdit, onDelete }) {
  return (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="h6">{member.first_name} {member.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              📧 {member.email || 'Keine E-Mail'}<br />
              🏠 {member.street} {member.house_number}, {member.zip_code} {member.city}<br />
              🎂 {member.birthdate || 'kein Geburtsdatum'}<br />
              💸 Kontostand: {member.kontostand} €<br />
              🧠 {member.mental_limitations || 'Keine geistigen Einschränkungen'}<br />
              💪 {member.physical_limitations || 'Keine körperlichen Einschränkungen'}
            </Typography>
          </Box>

          <Box>
            <IconButton color="primary" onClick={() => onEdit(member)}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => onDelete(member)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
