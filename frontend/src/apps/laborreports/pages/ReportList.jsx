// frontend/src/apps/laborreports/pages/ReportList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '@/utils/api';
import ReportCard from '../components/ReportCard';

export default function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    sample_type: '',
    search: ''
  });
  
  useEffect(() => {
    fetchReports();
  }, []);
  
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get('/laborreports/reports/');
      
      // Korrigieren Sie hier die Datenextraktion
      // DRF kann ein Array oder ein Objekt mit results zurückgeben
      if (Array.isArray(res.data)) {
        setReports(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setReports(res.data.results);
      } else {
        console.warn('Unerwartetes Datenformat:', res.data);
        setReports([]);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Berichte:', err);
      setError('Die Berichte konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Funktion korrigiert: reports (nicht reports2)
  const applyFilters = (reportsArray) => {
    if (!Array.isArray(reportsArray)) {
      console.warn('Keine Array-Daten zum Filtern:', reportsArray);
      return [];
    }
    
    return reportsArray.filter((report) => {
      // Status-Filter
      if (filters.status && report.overall_status !== filters.status) {
        return false;
      }
      
      // Probentyp-Filter
      if (filters.sample_type && report.sample_type !== filters.sample_type) {
        return false;
      }
      
      // Suchfilter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          report.report_number.toLowerCase().includes(searchLower) ||
          report.sample_name.toLowerCase().includes(searchLower) ||
          report.sample_id.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };
  
  // Stelle sicher, dass wir ein Array haben
  const filteredReports = applyFilters(reports || []);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Laborberichte
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/laborreports/neu')}
        >
          Neuer Bericht
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filter
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              name="search"
              label="Suche"
              value={filters.search}
              onChange={handleFilterChange}
              fullWidth
              placeholder="Berichtsnummer, Probenname oder ID"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="passed">Bestanden</MenuItem>
                <MenuItem value="failed">Nicht bestanden</MenuItem>
                <MenuItem value="pending">Ausstehend</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Probentyp</InputLabel>
              <Select
                name="sample_type"
                value={filters.sample_type}
                onChange={handleFilterChange}
                label="Probentyp"
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="flower">Blüte</MenuItem>
                <MenuItem value="extract">Extrakt</MenuItem>
                <MenuItem value="concentrate">Konzentrat</MenuItem>
                <MenuItem value="oil">Öl</MenuItem>
                <MenuItem value="edible">Essbar</MenuItem>
                <MenuItem value="other">Sonstiges</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredReports.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Keine Berichte gefunden.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/laborreports/neu')}
          >
            Ersten Bericht erstellen
          </Button>
        </Paper>
      ) : (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {filteredReports.length} {filteredReports.length === 1 ? 'Bericht' : 'Berichte'} gefunden
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </Box>
      )}
    </Container>
  );
}