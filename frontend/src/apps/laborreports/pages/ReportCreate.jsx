// frontend/src/apps/laborreports/pages/ReportCreate.jsx
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ReportForm from '../components/ReportForm';

export default function ReportCreate() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Neuen Laborbericht erstellen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Füllen Sie die erforderlichen Informationen aus, um einen neuen Laborbericht zu erstellen.
        </Typography>
      </Box>
      
      <ReportForm />
    </Container>
  );
}