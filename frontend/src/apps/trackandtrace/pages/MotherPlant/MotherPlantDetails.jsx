// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantDetails.jsx
import React from 'react';
import { 
  Grid, 
  Typography, 
  Divider, 
  Button, 
  Paper,
  Box,
  Chip,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const MotherPlantDetails = ({ data, onMarkAsDestroyed, onUpdatePhase, status }) => {
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

  // Helfer-Funktion für Wachstumsphasen-Farben
  const getGrowthPhaseColor = (phase) => {
    switch(phase) {
      case 'seedling': return 'info';
      case 'vegetative': return 'warning';
      case 'mother': return 'success';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Stammdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Genetik:</Typography>
              <Typography variant="body1">{data.genetic_name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Wachstumsphase:</Typography>
              <Box display="flex" alignItems="center">
                <Chip 
                  label={data.growth_phase_display || 'Unbekannt'} 
                  color={getGrowthPhaseColor(data.growth_phase)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {status === 'active' && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => onUpdatePhase(data)}
                  >
                    Ändern
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Herkunft aus Sameneinkauf:</Typography>
              <Typography variant="body1">
                {data.seed_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/samen`} 
                    state={{ highlightUuid: data.seed_source }}
                  >
                    {data.seed_source_details.strain_name} ({data.seed_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Daten verfügbar'
                )}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Pflanzendaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Pflanzungsdatum:</Typography>
              <Typography variant="body1">{formatDate(data.planting_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Wachstumsmedium:</Typography>
              <Typography variant="body1">{data.growth_medium || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Dünger:</Typography>
              <Typography variant="body1">{data.fertilizer || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Lichtzyklus:</Typography>
              <Typography variant="body1">{data.light_cycle || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Pflanzen gesamt:</Typography>
              <Typography variant="body1">{data.plant_count}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Pflanzen übrig:</Typography>
              <Typography variant="body1">{data.remaining_plants}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Prozessdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Verantwortlicher:</Typography>
              <Typography variant="body1">
                {data.responsible_member_details ? 
                  `${data.responsible_member_details.first_name} ${data.responsible_member_details.last_name}` : 
                  'Unbekannt'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Raum:</Typography>
              <Typography variant="body1">
                {data.room_details ? data.room_details.name : 'Nicht zugewiesen'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Erstelldatum:</Typography>
              <Typography variant="body1">{formatDate(data.created_at)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Temperatur/Luftfeuchte:</Typography>
              <Typography variant="body1">
                {data.temperature ? `${data.temperature}°C` : 'k.A.'} / 
                {data.humidity ? `${data.humidity}%` : 'k.A.'}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {data.is_destroyed && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="error">Vernichtungsdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtungsgrund:</Typography>
                <Typography variant="body1">{data.destruction_reason}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtungsdatum:</Typography>
                <Typography variant="body1">
                  {formatDate(data.destruction_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtet durch:</Typography>
                <Typography variant="body1">
                  {data.destroying_member_details ? 
                    `${data.destroying_member_details.first_name} ${data.destroying_member_details.last_name}` : 
                    'Nicht angegeben'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Bemerkungen</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {data.notes || 'Keine Bemerkungen vorhanden'}
          </Typography>
        </Grid>
        
        {status === 'active' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => onMarkAsDestroyed(data)}
              >
                Als vernichtet markieren
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default MotherPlantDetails;