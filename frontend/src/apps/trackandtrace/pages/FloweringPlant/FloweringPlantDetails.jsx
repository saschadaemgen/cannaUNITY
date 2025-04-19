// frontend/src/apps/trackandtrace/pages/FloweringPlant/FloweringPlantDetails.jsx
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

const FloweringPlantDetails = ({ data, onMarkAsDestroyed, onUpdatePhase, onHarvest, onMarkAsPartiallyTransferred, onMarkAsFullyTransferred, status }) => {
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
      case 'vegetative': return 'info';
      case 'pre_flower': return 'warning';
      case 'flowering': return 'success';
      case 'late_flower': return 'success';
      case 'harvest_ready': return 'error';
      default: return 'default';
    }
  };

  // Überführungsstatus als Chip anzeigen
  const getTransferStatusChip = () => {
    let color = 'default';
    let label = 'Unbekannt';
    let percentage = null;
    
    // Prozentberechnung basierend auf dem jeweiligen Typ
    if (data.plant_count !== undefined && data.remaining_plants !== undefined) {
      // Pflanzen
      const used = data.plant_count - data.remaining_plants;
      percentage = Math.round((used / data.plant_count) * 100);
      label = `${used}/${data.plant_count} (${percentage}%)`;
    }
    
    const status = data.transfer_status || 'not_transferred';
    
    if (percentage === 100 || status === 'fully_transferred') {
      color = 'success';
      if (!percentage) label = 'Vollständig übergeführt';
      else label = `Vollständig übergeführt: ${label}`;
    } else if (percentage > 0 || status === 'partially_transferred') {
      color = 'info';
      if (!percentage) label = 'Teilweise übergeführt';
      else label = `Teilweise übergeführt: ${label}`;
    } else {
      color = 'default';
      label = 'Nicht übergeführt';
    }
    
    return <Chip color={color} label={label} size="small" />;
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
              <Typography variant="body2" color="textSecondary">Überführungsstatus:</Typography>
              <Box display="flex" alignItems="center">
                {getTransferStatusChip()}
              </Box>
            </Grid>
            
            {/* Herkunft - entweder aus Samen oder aus Stecklingen */}
            <Grid item xs={12}>
              {data.seed_source_details ? (
                <>
                  <Typography variant="body2" color="textSecondary">Herkunft aus Sameneinkauf:</Typography>
                  <Typography variant="body1">
                    <Link 
                      component={RouterLink} 
                      to={`/trace/samen`} 
                      state={{ highlightUuid: data.seed_source }}
                    >
                      {data.seed_source_details.strain_name} ({data.seed_source_details.batch_number})
                    </Link>
                  </Typography>
                </>
              ) : data.cutting_source_details ? (
                <>
                  <Typography variant="body2" color="textSecondary">Herkunft aus Steckling:</Typography>
                  <Typography variant="body1">
                    <Link 
                      component={RouterLink} 
                      to={`/trace/stecklinge`} 
                      state={{ highlightUuid: data.cutting_source }}
                    >
                      {data.cutting_source_details.genetic_name} ({data.cutting_source_details.batch_number})
                    </Link>
                  </Typography>
                </>
              ) : (
                <Typography variant="body1">Keine Herkunftsdaten verfügbar</Typography>
              )}
            </Grid>
            
            {/* UUID anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">UUID:</Typography>
              <Typography variant="body1" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {data.uuid}
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
              <Typography variant="body2" color="textSecondary">Erwartetes Erntedatum:</Typography>
              <Typography variant="body1">{formatDate(data.expected_harvest_date)}</Typography>
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
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Batch-Nummer:</Typography>
              <Typography variant="body1">{data.batch_number}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Vernichtungsdaten anzeigen, wenn vernichtet */}
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
        
        {/* Überführungsdaten anzeigen, wenn übergeführt */}
        {data.is_transferred && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="success">Überführungsdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Überführungsdatum:</Typography>
                <Typography variant="body1">
                  {formatDate(data.transfer_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Übergeführt durch:</Typography>
                <Typography variant="body1">
                  {data.transferring_member_details ? 
                    `${data.transferring_member_details.first_name} ${data.transferring_member_details.last_name}` : 
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
        
        {/* Aktionsbuttons basierend auf Status anzeigen */}
        {status === 'active' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              {/* Überführungsbutton sollte nur erscheinen, wenn besondere Umstände */}
              {false && (
                <>
                  <Button 
                    variant="outlined" 
                    color="info"
                    onClick={() => onMarkAsPartiallyTransferred && onMarkAsPartiallyTransferred(data)}
                  >
                    Als teilweise übergeführt markieren
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="success"
                    onClick={() => onMarkAsFullyTransferred && onMarkAsFullyTransferred(data)}
                  >
                    Als vollständig übergeführt markieren
                  </Button>
                </>
              )}
              
              {/* Erntebutton bei erntebereiten Pflanzen anzeigen */}
              {data.growth_phase === 'harvest_ready' && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => onHarvest && onHarvest(data)}
                >
                  Ernten
                </Button>
              )}
              
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => onMarkAsDestroyed && onMarkAsDestroyed(data)}
              >
                Als vernichtet markieren
              </Button>
            </Box>
          </Grid>
        )}

        {/* Bei teilweise übergeführtem Status nur den Vernichtungsbutton anbieten */}
        {status === 'partially_transferred' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => onMarkAsDestroyed && onMarkAsDestroyed(data)}
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

export default FloweringPlantDetails;