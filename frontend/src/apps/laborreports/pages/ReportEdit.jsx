// frontend/src/apps/laborreports/pages/ReportEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, LinearProgress, Alert, Button } from '@mui/material';
import api from '@/utils/api';
import ReportForm from '../components/ReportForm';

export default function ReportEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await api.get(`/laborreports/reports/${id}/`);
        setReport(res.data);
      } catch (err) {
        console.error('Fehler beim Laden des Berichts:', err);
        setError('Der Bericht konnte nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/laborreports')} 
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }
  
  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Bericht nicht gefunden.</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/laborreports')} 
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Laborbericht bearbeiten
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bericht #{report.report_number} | {report.sample_name}
        </Typography>
      </Box>
      
      <ReportForm initialData={report} isEdit={true} />
    </Container>
  );
}