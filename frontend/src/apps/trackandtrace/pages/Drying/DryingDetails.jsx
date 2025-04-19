// frontend/src/apps/trackandtrace/pages/Drying/DryingDetails.jsx
import React from 'react';
import { 
  Grid, 
  Typography, 
  Divider, 
  Button, 
  Paper,
  Box,
  Link,
  Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const DryingDetails = ({ data, onMarkAsDestroyed, onCompleteDrying, status }) => {
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

  // Helfer-Funktion für Gewichtsformatierung
  const formatWeight = (weight) => {
    if (!weight && weight !== 0) return 'Nicht angegeben';
    return Number(weight).toLocaleString('de-DE') + ' g';
  };

  // Berechnung des Gewichtsverlusts (wenn beide Gewichte vorhanden)
  const calculateWeightLoss = () => {
    if (data.fresh_weight && data.dried_weight) {
      const freshWeight = parseFloat(data.fresh_weight);
      const driedWeight = parseFloat(data.dried_weight);
      const loss = freshWeight - driedWeight;
      const lossPercentage = (loss / freshWeight) * 100;
      
      return {
        loss: formatWeight(loss),
        percentage: lossPercentage.toFixed(2) + '%'
      };
    }
    return null;
  };

  const weightLoss = calculateWeightLoss();

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
              <Typography variant="body2" color="textSecondary">Herkunft aus Ernte:</Typography>
              <Typography variant="body1">
                {data.harvest_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/ernte`} 
                    state={{ highlightUuid: data.harvest_source }}
                  >
                    {data.harvest_source_details.genetic_name} ({data.harvest_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Herkunftsdaten verfügbar'
                )}
              </Typography>
            </Grid>
            
            {/* Trocknungsstatus */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {data.drying_end_date ? (
                  <Chip 
                    label="Trocknung abgeschlossen" 
                    color="success" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    label="In Trocknung" 
                    color="warning" 
                    size="small" 
                  />
                )}
              </Box>
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
          <Typography variant="subtitle2">Trocknungsdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Trocknungsbeginn:</Typography>
              <Typography variant="body1">{formatDate(data.drying_start_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Trocknungsende:</Typography>
              <Typography variant="body1">{formatDate(data.drying_end_date) || 'Noch aktiv'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Frischgewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.fresh_weight)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Trockengewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.dried_weight) || 'Noch nicht ermittelt'}</Typography>
            </Grid>
            
            {/* Gewichtsverlust anzeigen, wenn Trockengewicht erfasst wurde */}
            {weightLoss && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Gewichtsverlust:</Typography>
                  <Typography variant="body1">{weightLoss.loss}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Feuchtigkeitsverlust:</Typography>
                  <Typography variant="body1">{weightLoss.percentage}</Typography>
                </Grid>
              </>
            )}
            
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Verbleibendes Trockengewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.remaining_dried_weight) || 'Noch nicht erfasst'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Trocknungsmethode:</Typography>
              <Typography variant="body1">{data.drying_method || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ziel-Luftfeuchtigkeit:</Typography>
              <Typography variant="body1">{data.target_humidity ? `${data.target_humidity}%` : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ziel-Temperatur:</Typography>
              <Typography variant="body1">{data.target_temperature ? `${data.target_temperature}°C` : 'Nicht angegeben'}</Typography>
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
        
        {/* Nur bei aktiven Einträgen Buttons anzeigen */}
        {status === 'active' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              {/* Trocknungsabschluss-Button nur anzeigen, wenn noch kein Trockengewicht erfasst wurde */}
              {!data.dried_weight && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => onCompleteDrying(data)}
                >
                  Trocknung abschließen
                </Button>
              )}
              
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

export default DryingDetails;