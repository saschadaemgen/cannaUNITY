// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionDetails.jsx
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const ProductDistributionDetails = ({ 
  data, 
  onMarkAsDestroyed, 
  onUpdateStatus,
  onMarkAsPaid,
  onConfirmReceipt,
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

  // Helfer-Funktion für Geldbetragsformatierung
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Nicht angegeben';
    return Number(amount).toLocaleString('de-DE') + ' €';
  };

  // Überführungsstatus als Chip anzeigen
  const getTransferStatusChip = () => {
    let color = 'default';
    let label = 'Unbekannt';
    let percentage = null;
    
    // Prozentberechnung basierend auf Gewicht
    if (data.quantity !== undefined && data.remaining_quantity !== undefined) {
      const used = parseFloat(data.quantity) - parseFloat(data.remaining_quantity);
      percentage = Math.round((used / parseFloat(data.quantity)) * 100);
      label = `${used.toFixed(2)}g/${parseFloat(data.quantity).toFixed(2)}g (${percentage}%)`;
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

  // Status-Chip anzeigen
  const getStatusChip = () => {
    let color;
    let label;
    
    switch(data.status) {
      case 'pending':
        color = 'default';
        label = 'Ausstehend';
        break;
      case 'in_progress':
        color = 'warning';
        label = 'In Bearbeitung';
        break;
      case 'completed':
        color = 'success';
        label = 'Abgeschlossen';
        break;
      case 'cancelled':
        color = 'error';
        label = 'Storniert';
        break;
      case 'returned':
        color = 'info';
        label = 'Zurückgegeben';
        break;
      default:
        color = 'default';
        label = data.status || 'Unbekannt';
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
              <Typography variant="body2" color="textSecondary">Herkunft aus Verpackung:</Typography>
              <Typography variant="body1">
                {data.packaging_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/verpackung`} 
                    state={{ highlightUuid: data.packaging_source }}
                  >
                    {data.packaging_source_details.genetic_name} ({data.packaging_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Herkunftsdaten verfügbar'
                )}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Empfänger:</Typography>
              <Typography variant="body1">
                {data.receiving_member_details ? 
                  `${data.receiving_member_details.first_name} ${data.receiving_member_details.last_name}` : 
                  'Nicht angegeben'}
              </Typography>
            </Grid>
            
            {/* Status-Anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Status:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {getStatusChip()}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Bezahlstatus:</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  color={data.is_paid ? "success" : "default"} 
                  label={data.is_paid ? `Bezahlt am ${formatDate(data.payment_date)}` : "Nicht bezahlt"} 
                  size="small" 
                  icon={data.is_paid ? <AttachMoneyIcon /> : undefined}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Empfangsbestätigung:</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  color={data.is_confirmed ? "success" : "default"} 
                  label={data.is_confirmed ? `Empfang bestätigt am ${formatDate(data.confirmation_date)}` : "Nicht bestätigt"} 
                  size="small" 
                  icon={data.is_confirmed ? <CheckCircleIcon /> : undefined}
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
          <Typography variant="subtitle2">Ausgabedaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ausgabedatum:</Typography>
              <Typography variant="body1">{formatDate(data.distribution_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Ausgabetyp:</Typography>
              <Typography variant="body1">{data.distribution_type_display || data.distribution_type || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Referenznummer:</Typography>
              <Typography variant="body1">{data.tracking_number || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Zahlungsmethode:</Typography>
              <Typography variant="body1">{data.payment_method || 'Nicht angegeben'}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Produkt- und Preisdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Menge:</Typography>
              <Typography variant="body1">{formatWeight(data.quantity)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Verbleibende Menge:</Typography>
              <Typography variant="body1">{formatWeight(data.remaining_quantity)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Paketanzahl:</Typography>
              <Typography variant="body1">{data.package_count || '1'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Einzelpreis:</Typography>
              <Typography variant="body1">{formatCurrency(data.price_per_unit)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Gesamtpreis:</Typography>
              <Typography variant="body1">{formatCurrency(data.total_price)}</Typography>
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
        
        {data.distribution_document && (
          <Grid item xs={12}>
            <Typography variant="subtitle2">Dokumente</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              component="a"
              href={data.distribution_document}
              target="_blank"
            >
              Ausgabedokument herunterladen
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
              {data.status === 'pending' && (
                <Button 
                  variant="outlined" 
                  color="warning"
                  onClick={() => onUpdateStatus && onUpdateStatus(data, 'in_progress')}
                >
                  Bearbeitung starten
                </Button>
              )}
              
              {data.status === 'in_progress' && (
                <Button 
                  variant="outlined" 
                  color="success"
                  onClick={() => onUpdateStatus && onUpdateStatus(data, 'completed')}
                >
                  Als abgeschlossen markieren
                </Button>
              )}
              
              {!data.is_paid && (
                <Button 
                  variant="outlined" 
                  color="success"
                  startIcon={<AttachMoneyIcon />}
                  onClick={() => onMarkAsPaid && onMarkAsPaid(data)}
                >
                  Als bezahlt markieren
                </Button>
              )}
              
              {!data.is_confirmed && (
                <Button 
                  variant="outlined" 
                  color="info"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => onConfirmReceipt && onConfirmReceipt(data)}
                >
                  Empfang bestätigen
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

export default ProductDistributionDetails;