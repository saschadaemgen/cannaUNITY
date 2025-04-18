
import React from 'react'
import { Box, Typography, Collapse } from '@mui/material'

export default function MemberDetails({ member, open }) {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderTop: '1px solid #ddd' }}>
        <Typography variant="subtitle2" gutterBottom>UUID: <code>{member.uuid}</code></Typography>
        <Typography variant="body2" gutterBottom>Geburtsdatum: {member.birthdate}</Typography>
        <Typography variant="body2" gutterBottom>Adresse: {member.street} {member.house_number}, {member.zip_code} {member.city}</Typography>
        {member.physical_limitations && (
          <Typography variant="body2" gutterBottom>Körperliche Einschränkungen: {member.physical_limitations}</Typography>
        )}
        {member.mental_limitations && (
          <Typography variant="body2" gutterBottom>Geistige Einschränkungen: {member.mental_limitations}</Typography>
        )}
        {member.notes && (
          <Typography variant="body2" gutterBottom>Bemerkungen: {member.notes}</Typography>
        )}
        {member.warnings && (
          <Typography variant="body2" color="error" gutterBottom>Verwarnungen: {member.warnings}</Typography>
        )}
      </Box>
    </Collapse>
  )
}
