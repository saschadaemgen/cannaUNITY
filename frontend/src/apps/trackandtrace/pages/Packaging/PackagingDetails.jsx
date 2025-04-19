// frontend/src/apps/trackandtrace/pages/Packaging/PackagingDetails.jsx
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
import DownloadIcon from '@mui/icons-material/Download';

const PackagingDetails = ({ 
  data, 
  onMarkAsDestroyed, 
  onMarkQualityChecked,
  onMarkLabeled,
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

  // Helfer-Funktion für Gewichtsformatierung
  const formatWeight = (weight) => {
    if (!weight && weight !== 0) return 'Nicht angegeben';
    return Number(weight).toLocaleString('de-DE') + ' g';
  };

  // Überführungsstatus als Chip anzeigen
  const getTransferStatusChip = () => {
    let color = 'default';
    let label = 'Unbekannt';
    let percentage = null;
    
    // Prozentberechnung basierend auf Gewicht
    if (data.input_weight !== undefined && data.remaining_weight !== undefined) {
      const used = parseFloat(data.input_weight) - parseFloat(data.remaining_weight);
      percentage = Math.round((used / parseFloat(data.input_weight)) * 100);
      label = `${used.toFixed(2)}g/${parseFloat(data.input_weight).toFixed(2)}g (${percentage}%)`;
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
              <Typography variant="body1">{data.genetic_name || 'Nicht angegeben'}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Herkunft aus Laborkontrolle:</Typography>
              <Typography variant="body1">
                {data.lab_testing_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/laborkontrolle`} 
                    state={{ highlightUuid: data.lab_testing_source }}
                  >
                    {data.lab_testing_source_details.genetic_name} ({data.lab_testing_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Herkunftsdaten verfügbar'
                )}
              </Typography>
            </Grid>
            
            {/* Status-Anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Qualitätskontrolle:</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  color={data.is_quality_checked ? "success" : "default"} 
                  label={data.is_quality_checked ? `Qualitätskontrolle bestanden (${formatDate(data.quality_check_date)})` : "Keine Qualitätskontrolle"} 
                  size="small" 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Etikettierung:</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  color={data.has_labels ? "success" : "default"} 
                  label={data.has_labels ? "Etikettiert" : "Nicht etikettiert"} 
                  size="small" 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Überführungsstatus:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {getTransferStatusChip()}
              </Box>
            </Grid>
            
            {/* UUID anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">UUID:</Typography>
              <Typography variant="body1" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {data.uuid || 'Nicht angegeben'}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Verpackungsdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Verpackungsdatum:</Typography>
              <Typography variant="body1">{formatDate(data.packaging_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Verpackungstyp:</Typography>
              <Typography variant="body1">{data.packaging_type_display || data.packaging_type || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Produkttyp:</Typography>
              <Typography variant="body1">{data.product_type_display || data.product_type || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Verpackungsmaterial:</Typography>
              <Typography variant="body1">{data.packaging_material || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Haltbarkeit:</Typography>
              <Typography variant="body1">{data.shelf_life ? `${data.shelf_life} Tage` : 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ablaufdatum:</Typography>
              <Typography variant="body1">{formatDate(data.expiry_date)}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Gewichtsdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Eingangsgewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.input_weight)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Verbleibendes Gewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.remaining_weight)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Paketanzahl:</Typography>
              <Typography variant="body1">{data.package_count || '1'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Gewicht pro Einheit:</Typography>
              <Typography variant="body1">{formatWeight(data.unit_weight)}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Lagerdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Lagerbedingungen:</Typography>
              <Typography variant="body1">{data.storage_conditions || 'Nicht angegeben'}</Typography>
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
              <Typography variant="body2" color="textSecondary">Batch-Nummer:</Typography>
              <Typography variant="body1">{data.batch_number || 'Nicht angegeben'}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {data.label_image && (
          <Grid item xs={12}>
            <Typography variant="subtitle2">Etikett</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              component="a"
              href={data.label_image}
              target="_blank"
            >
              Etikett anzeigen
            </Button>
          </Grid>
        )}
        
        {/* Vernichtungsdaten anzeigen, wenn vernichtet */}
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
                <Typography variant="body2" color="textSecondary">Überführungsdatum:</Typography>
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
              {!data.is_quality_checked && (
                <Button 
                  variant="outlined" 
                  color="success"
                  onClick={() => onMarkQualityChecked && onMarkQualityChecked(data)}
                >
                  Qualitätskontrolle bestätigen
                </Button>
              )}
              
              {!data.has_labels && (
                <Button 
                  variant="outlined" 
                  color="info"
                  onClick={() => onMarkLabeled && onMarkLabeled(data)}
                >
                  Als etikettiert markieren
                </Button>
              )}
              
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

export default PackagingDetails;