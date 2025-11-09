// frontend/src/apps/laborreports/components/ReportCard.jsx
import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { parseDate } from '../../../utils/date';

// Formatiert ISO-Datum (YYYY-MM-DD) für die Anzeige
const formatDateFromISO = (isoDateString) => {
  if (!isoDateString) return '-';
  
  try {
    // ISO-Format (YYYY-MM-DD) in Teile zerlegen und in deutsches Format umwandeln
    const parts = isoDateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    
    // Fallback - direkte Ausgabe
    return isoDateString;
  } catch (err) {
    console.warn('Fehler beim Formatieren des Datums:', err);
    return isoDateString || '-';
  }
};

const getStatusColor = (status) => {
  const statusMap = {
    passed: 'success',
    failed: 'error',
    pending: 'warning'
  };
  return statusMap[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusMap = {
    passed: 'Bestanden',
    failed: 'Nicht bestanden',
    pending: 'Ausstehend'
  };
  return statusMap[status] || status;
};

export default function ReportCard({ report }) {
  const navigate = useNavigate();

  return (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2, 
        borderLeft: (theme) => `4px solid ${theme.palette[getStatusColor(report.overall_status)].main}`
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div">
              {report.sample_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Bericht #{report.report_number}
            </Typography>
          </Box>
          <Chip 
            label={getStatusLabel(report.overall_status)} 
            color={getStatusColor(report.overall_status)} 
            size="small"
          />
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap',
            mb: 2
          }}
        >
          <Box sx={{ minWidth: '200px' }}>
            <Typography variant="body2" color="text.secondary">
              Probentyp
            </Typography>
            <Typography variant="body1">
              {report.sample_type}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: '200px' }}>
            <Typography variant="body2" color="text.secondary">
              Analysedatum
            </Typography>
            <Typography variant="body1">
              {formatDateFromISO(report.analysis_date)}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: '200px' }}>
            <Typography variant="body2" color="text.secondary">
              Erstellt am
            </Typography>
            <Typography variant="body1">
              {report.created_at ? new Date(report.created_at).toLocaleString('de-DE') : '-'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => navigate(`/laborreports/${report.id}`)}
          >
            Details anzeigen
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}