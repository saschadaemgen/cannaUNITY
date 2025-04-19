// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseDetails.jsx
import React from 'react';
import { 
  Grid, 
  Typography, 
  Divider, 
  Button, 
  Paper,
  Box,
  Chip
} from '@mui/material';

const SeedPurchaseDetails = ({ 
  data, 
  onMarkAsDestroyed, 
  onMarkAsPartiallyTransferred,
  onMarkAsFullyTransferred,
  status 
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

  // Überführungsstatus als Chip anzeigen
  const getTransferStatusChip = () => {
    let color = 'default';
    let label = 'Unbekannt';
    let percentage = null;
    
    // Prozentberechnung basierend auf dem jeweiligen Typ
    if (data.total_seeds !== undefined && data.remaining_seeds !== undefined) {
      // Samen
      const used = data.total_seeds - data.remaining_seeds;
      percentage = Math.round((used / data.total_seeds) * 100);
      label = `${used}/${data.total_seeds} (${percentage}%)`;
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
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Genetik:</Typography>
              <Typography variant="body1">{data.genetics || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Sortenname:</Typography>
              <Typography variant="body1">{data.strain_name || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Sativa-Anteil:</Typography>
              <Typography variant="body1">{data.sativa_percentage !== undefined ? `${data.sativa_percentage}%` : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Indica-Anteil:</Typography>
              <Typography variant="body1">{data.indica_percentage !== undefined ? `${data.indica_percentage}%` : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">THC-Wert:</Typography>
              <Typography variant="body1">{data.thc_value ? `${data.thc_value}%` : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">CBD-Wert:</Typography>
              <Typography variant="body1">{data.cbd_value ? `${data.cbd_value}%` : 'Nicht angegeben'}</Typography>
            </Grid>

            {/* Überführungsstatus anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Überführungsstatus:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {getTransferStatusChip()}
              </Box>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Einkaufsdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Hersteller:</Typography>
              <Typography variant="body1">{data.manufacturer || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Kaufdatum:</Typography>
              <Typography variant="body1">{formatDate(data.purchase_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Samen gesamt:</Typography>
              <Typography variant="body1">{data.total_seeds !== undefined ? data.total_seeds : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Samen verfügbar:</Typography>
              <Typography variant="body1">{data.remaining_seeds !== undefined ? data.remaining_seeds : 'Nicht angegeben'}</Typography>
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
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Lagerraum:</Typography>
              <Typography variant="body1">
                {data.room_details ? data.room_details.name : 'Nicht zugewiesen'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Erstelldatum:</Typography>
              <Typography variant="body1">{formatDate(data.created_at)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Letzte Änderung:</Typography>
              <Typography variant="body1">{formatDate(data.updated_at)}</Typography>
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
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Systemdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">UUID:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {data.uuid || 'Nicht angegeben'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Chargennummer:</Typography>
              <Typography variant="body1">
                {data.batch_number || 'Nicht angegeben'}
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
                <Typography variant="body1">{data.destruction_reason || 'Nicht angegeben'}</Typography>
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
        
        {/* Überführungsdaten anzeigen, wenn teilweise oder vollständig übergeführt */}
        {data.transfer_status && ['partially_transferred', 'fully_transferred'].includes(data.transfer_status) && (
          <Grid item xs={12}>
            <Typography 
              variant="subtitle2" 
              color={data.transfer_status === 'fully_transferred' ? 'success' : 'info'}
            >
              Überführungsdaten
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Überführungsstatus:</Typography>
                <Typography variant="body1">
                  {data.transfer_status === 'fully_transferred' ? 'Vollständig übergeführt' : 'Teilweise übergeführt'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Letzte Überführung:</Typography>
                <Typography variant="body1">
                  {formatDate(data.last_transfer_date || data.transfer_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
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

export default SeedPurchaseDetails;