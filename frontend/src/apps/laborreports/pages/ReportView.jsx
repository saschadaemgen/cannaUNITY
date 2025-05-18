// frontend/src/apps/laborreports/pages/ReportView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import api from '@/utils/api';
import CannabinoidChart from '../components/CannabinoidChart';
import TerpeneChart from '../components/TerpeneChart';
import ContaminantsList from '../components/ContaminantsList';

// Formatiert ISO-Datum (YYYY-MM-DD) für die Anzeige
const formatDateFromISO = (isoDateString) => {
  if (!isoDateString) return '-';
  
  try {
    const parts = isoDateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return isoDateString;
  } catch (err) {
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

const getStatusIcon = (status) => {
  switch (status) {
    case 'passed': return <CheckCircleIcon color="success" />;
    case 'failed': return <CancelIcon color="error" />;
    case 'pending': return <HourglassEmptyIcon color="warning" />;
    default: return null;
  }
};

const getSampleTypeLabel = (type) => {
  const typeMap = {
    flower: 'Blüte',
    extract: 'Extrakt',
    concentrate: 'Konzentrat',
    oil: 'Öl',
    edible: 'Essbar',
    other: 'Sonstiges'
  };
  return typeMap[type] || type;
};

export default function ReportView() {
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
          startIcon={<ArrowBackIcon />}
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
          startIcon={<ArrowBackIcon />}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header-Bereich */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            bgcolor: (theme) => theme.palette[getStatusColor(report.overall_status)].main
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon fontSize="large" color="primary" />
              {report.sample_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              Bericht #{report.report_number} | Probe: {report.sample_id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Chip 
              icon={getStatusIcon(report.overall_status)}
              label={getStatusLabel(report.overall_status)} 
              color={getStatusColor(report.overall_status)} 
              size="medium"
              sx={{ px: 1, py: 2, fontSize: '1rem', mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {report.is_gmp_compliant && (
                <Chip label="GMP" color="info" size="small" variant="outlined" />
              )}
              {report.is_gacp_compliant && (
                <Chip label="GACP" color="info" size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/laborreports/${id}/edit`)}
          >
            Bearbeiten
          </Button>
        </Box>
      </Paper>
      
      {/* Informationsbereich */}
      <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
        <CardHeader 
          title="Allgemeine Informationen" 
          sx={{ 
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', width: '20%', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Probentyp
                  </TableCell>
                  <TableCell>{getSampleTypeLabel(report.sample_type)}</TableCell>
                  
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', width: '20%', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Sammeldatum
                  </TableCell>
                  <TableCell>{formatDateFromISO(report.collection_date)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Probensammler
                  </TableCell>
                  <TableCell>{report.collection_person}</TableCell>
                  
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Analysedatum
                  </TableCell>
                  <TableCell>{formatDateFromISO(report.analysis_date)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Analyst
                  </TableCell>
                  <TableCell>{report.analysis_person}</TableCell>
                  
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Freigabedatum
                  </TableCell>
                  <TableCell>{report.approval_date ? formatDateFromISO(report.approval_date) : '-'}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Freigabe durch
                  </TableCell>
                  <TableCell>{report.approval_person || '-'}</TableCell>
                  
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}
                  >
                    Track & Trace Batch
                  </TableCell>
                  <TableCell>{report.track_and_trace_batch || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {report.notes && (
            <Box sx={{ p: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" gutterBottom>Anmerkungen:</Typography>
              <Typography variant="body2">{report.notes}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Diagramme und Daten */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              title="Cannabinoid-Profil" 
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                '& .MuiCardHeader-title': {
                  fontSize: {xs: '1.1rem', md: '1.25rem'},
                  fontWeight: 'bold',
                  color: (theme) => theme.palette.success.dark
                }
              }}
            />
            <CardContent sx={{ p: {xs: 2, md: 3} }}>
              {report.cannabinoid_profile ? (
                <CannabinoidChart data={report.cannabinoid_profile} />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Cannabinoid-Daten verfügbar
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              title="Terpen-Profil" 
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                '& .MuiCardHeader-title': {
                  fontSize: {xs: '1.1rem', md: '1.25rem'},
                  fontWeight: 'bold',
                  color: (theme) => theme.palette.secondary.dark
                }
              }}
            />
            <CardContent sx={{ p: {xs: 2, md: 3} }}>
              {report.terpene_profile ? (
                <TerpeneChart data={report.terpene_profile} />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Keine Terpen-Daten verfügbar
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid item xs={12} sx={{ mt: 4 }}>
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardHeader 
            title="Verunreinigungstests" 
            sx={{ 
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              '& .MuiCardHeader-title': {
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: (theme) => theme.palette.info.dark
              }
            }}
          />
          <CardContent>
            {report.contaminant_tests && report.contaminant_tests.length > 0 ? (
              <ContaminantsList tests={report.contaminant_tests} />
            ) : (
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                  borderRadius: 1
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Keine Verunreinigungstests verfügbar
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Aktionen */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          zIndex: 1000,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/laborreports')}
        >
          Zurück zur Übersicht
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/laborreports/${id}/edit`)}
        >
          Bearbeiten
        </Button>
      </Paper>
    </Container>
  );
}