// frontend/src/apps/trackandtrace/pages/LabTesting/LabTestingDetails.jsx
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
import CancelIcon from '@mui/icons-material/Cancel';

const LabTestingDetails = ({ 
  data, 
  onMarkAsDestroyed, 
  onUpdateTestStatus,
  onApprove,
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
    if (data.sample_weight !== undefined && data.remaining_weight !== undefined) {
      const used = parseFloat(data.sample_weight) - parseFloat(data.remaining_weight);
      percentage = Math.round((used / parseFloat(data.sample_weight)) * 100);
      label = `${used.toFixed(2)}g/${parseFloat(data.sample_weight).toFixed(2)}g (${percentage}%)`;
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

  // Test-Status als Chip anzeigen
  const getTestStatusChip = () => {
    let color;
    
    switch(data.test_status) {
      case 'pending':
        color = 'default';
        break;
      case 'in_progress':
        color = 'warning';
        break;
      case 'completed':
        color = 'success';
        break;
      case 'failed':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        color={color} 
        label={data.test_status_display || data.test_status} 
        size="small" 
      />
    );
  };

  // Freigabe-Status als Chip anzeigen
  const getApprovalChip = () => {
    if (data.test_status !== 'completed') {
      return <Chip color="default" label="Prüfung ausstehend" size="small" />;
    }
    
    if (data.is_approved) {
      return <Chip 
        color="success" 
        label={`Freigegeben am ${formatDate(data.approval_date)}`} 
        size="small" 
        icon={<CheckCircleIcon />} 
      />;
    }
    
    return <Chip color="error" label="Nicht freigegeben" size="small" icon={<CancelIcon />} />;
  };

  // Check-Status-Icon für Qualitätstests
  const getCheckIcon = (isChecked) => {
    return isChecked ? 
      <CheckCircleIcon color="success" /> : 
      <CancelIcon color="error" />;
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
              <Typography variant="body2" color="textSecondary">Herkunft aus Verarbeitung:</Typography>
              <Typography variant="body1">
                {data.processing_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/verarbeitung`} 
                    state={{ highlightUuid: data.processing_source }}
                  >
                    {data.processing_source_details.genetic_name} ({data.processing_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Herkunftsdaten verfügbar'
                )}
              </Typography>
            </Grid>
            
            {/* Status-Anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Test-Status:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {getTestStatusChip()}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Freigabe-Status:</Typography>
              <Box sx={{ mt: 0.5 }}>
                {getApprovalChip()}
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
          <Typography variant="subtitle2">Testdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Probenahmedatum:</Typography>
              <Typography variant="body1">{formatDate(data.sample_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Testdatum:</Typography>
              <Typography variant="body1">{formatDate(data.test_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Laborname:</Typography>
              <Typography variant="body1">{data.lab_name || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Testmethode:</Typography>
              <Typography variant="body1">{data.test_method || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Probengewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.sample_weight)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Verbleibendes Gewicht:</Typography>
              <Typography variant="body1">{formatWeight(data.remaining_weight)}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Analyseergebnisse</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">THC-Gehalt:</Typography>
              <Typography variant="body1">{data.thc_content ? `${data.thc_content}%` : 'Nicht gemessen'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">CBD-Gehalt:</Typography>
              <Typography variant="body1">{data.cbd_content ? `${data.cbd_content}%` : 'Nicht gemessen'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Feuchtigkeitsgehalt:</Typography>
              <Typography variant="body1">{data.moisture_content ? `${data.moisture_content}%` : 'Nicht gemessen'}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Qualitätsprüfungen</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                {getCheckIcon(data.contaminants_check)}
                <Typography variant="body1" sx={{ ml: 1 }}>Verunreinigungen</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                {getCheckIcon(data.pesticides_check)}
                <Typography variant="body1" sx={{ ml: 1 }}>Pestizide</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                {getCheckIcon(data.microbes_check)}
                <Typography variant="body1" sx={{ ml: 1 }}>Mikrobiologisch</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                {getCheckIcon(data.heavy_metals_check)}
                <Typography variant="body1" sx={{ ml: 1 }}>Schwermetalle</Typography>
              </Box>
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
        
        {data.lab_report && (
          <Grid item xs={12}>
            <Typography variant="subtitle2">Laborbericht</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              component="a"
              href={data.lab_report}
              target="_blank"
            >
              Laborbericht herunterladen
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
          <Typography variant="subtitle2">Notizen</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Bemerkungen:</Typography>
              <Typography variant="body1">
                {data.notes || 'Keine Bemerkungen vorhanden'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Notizen vom Labor:</Typography>
              <Typography variant="body1">
                {data.notes_from_lab || 'Keine Labornotizen vorhanden'}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Aktionsbuttons basierend auf Status anzeigen */}
        {status === 'active' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              {/* Test-Status Buttons anzeigen, je nach aktuellem Status */}
              {data.test_status === 'pending' && (
                <Button 
                  variant="outlined" 
                  color="warning"
                  onClick={() => onUpdateTestStatus && onUpdateTestStatus(data, 'in_progress')}
                >
                  Test starten
                </Button>
              )}
              
              {data.test_status === 'in_progress' && (
                <Button 
                  variant="outlined" 
                  color="success"
                  onClick={() => onUpdateTestStatus && onUpdateTestStatus(data, 'completed')}
                >
                  Test abschließen
                </Button>
              )}
              
              {data.test_status === 'completed' && !data.is_approved && (
                <Button 
                  variant="outlined" 
                  color="success"
                  onClick={() => onApprove && onApprove(data)}
                >
                  Ergebnis freigeben
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

export default LabTestingDetails;