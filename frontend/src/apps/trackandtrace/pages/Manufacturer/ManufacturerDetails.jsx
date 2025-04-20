// frontend/src/apps/trackandtrace/pages/Manufacturer/ManufacturerDetails.jsx
import React from 'react';
import { 
  Grid, 
  Typography, 
  Divider, 
  Button, 
  Paper,
  Box,
  Container
} from '@mui/material';

const ManufacturerDetails = ({ 
  data, 
  onEdit,
  onDelete 
}) => {
  // Sicherstellen, dass data existiert
  if (!data) {
    return <Paper sx={{ p: 2 }}><Typography>Keine Daten verfügbar</Typography></Paper>;
  }

  // Helfer-Funktion für Datumsformatierung
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht angegeben';
    
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;  // DD.MM.YYYY
      }
      return dateString;
    } catch (e) {
      console.error('Fehler bei der Datumsformatierung:', e);
      return dateString;
    }
  };

  return (
    <Container maxWidth={false} sx={{ px: 0 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Kopfzeile mit Name und Aktionen */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                {data.name || 'Unbenannter Hersteller'}
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => onEdit(data)}
                  sx={{ mr: 1 }}
                >
                  Bearbeiten
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => onDelete(data)}
                >
                  Löschen
                </Button>
              </Box>
            </Box>
            <Divider />
          </Grid>

          {/* Kontaktdaten */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Kontaktdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Land:</Typography>
                <Typography variant="body1">{data.country || 'Nicht angegeben'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Website:</Typography>
                <Typography variant="body1">
                  {data.website ? (
                    <a href={data.website} target="_blank" rel="noopener noreferrer">
                      {data.website}
                    </a>
                  ) : 'Nicht angegeben'}
                </Typography>
              </Grid>
              {/* Anschrift */}
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Anschrift:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {data.address || 'Nicht angegeben'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Info-E-Mail:</Typography>
                <Typography variant="body1">
                  {data.email ? (
                    <a href={`mailto:${data.email}`}>
                      {data.email}
                    </a>
                  ) : 'Nicht angegeben'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Telefon:</Typography>
                <Typography variant="body1">
                  {data.phone ? (
                    <a href={`tel:${data.phone}`}>
                      {data.phone}
                    </a>
                  ) : 'Nicht angegeben'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Ansprechpartner-Informationen */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Ansprechpartner</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Name:</Typography>
                <Typography variant="body1">{data.contact_person || 'Nicht angegeben'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">E-Mail des Ansprechpartners:</Typography>
                <Typography variant="body1">
                  {data.contact_email ? (
                    <a href={`mailto:${data.contact_email}`}>
                      {data.contact_email}
                    </a>
                  ) : 'Nicht angegeben'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Lieferzeit:</Typography>
                <Typography variant="body1">
                  {data.delivery_time ? `${data.delivery_time} Tage` : 'Nicht angegeben'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Bestellhistorie */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Bestellhistorie</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {data.order_history || 'Keine Bestellhistorie vorhanden'}
            </Typography>
          </Grid>
          
          {/* Zusätzliche Notizen */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Bemerkungen</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {data.notes || 'Keine Bemerkungen vorhanden'}
            </Typography>
          </Grid>
          
          {/* Systemdaten */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Systemdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Erstellt am:</Typography>
                <Typography variant="body1">{formatDate(data.created_at)}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Letzte Aktualisierung:</Typography>
                <Typography variant="body1">{formatDate(data.updated_at)}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">ID:</Typography>
                <Typography variant="body1">{data.id || 'Nicht verfügbar'}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ManufacturerDetails;