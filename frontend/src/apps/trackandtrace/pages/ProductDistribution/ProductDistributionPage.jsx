import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Divider, Grid, 
  TextField, Button, Autocomplete, Chip, FormControl,
  InputLabel, MenuItem, Select, FormHelperText, Snackbar,
  Alert, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '@/utils/api';

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader';
import LoadingIndicator from '@/components/common/LoadingIndicator';

const ProductDistributionPage = () => {
  // Zustände für Formularelemente
  const [distributorId, setDistributorId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Verfügbare Daten
  const [availableUnits, setAvailableUnits] = useState([]);
  const [members, setMembers] = useState([]);
  
  // UI-Zustände
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [filterProductType, setFilterProductType] = useState('');
  
  // Berechnete Werte
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0);
  
  // Gruppieren nach Produkttyp für die Zusammenfassung
  const productSummary = selectedUnits.reduce((acc, unit) => {
    const batch = unit.batch || {};
    const productType = batch.product_type || 'unknown';
    const displayType = batch.product_type_display || (
      productType === 'marijuana' ? 'Marihuana' : 
      productType === 'hashish' ? 'Haschisch' : 'Unbekannt'
    );
    
    if (!acc[productType]) {
      acc[productType] = {
        displayType: displayType,
        count: 0,
        weight: 0
      };
    }
    
    acc[productType].count += 1;
    acc[productType].weight += parseFloat(unit.weight || 0);
    
    return acc;
  }, {});
  
  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Verfügbare Verpackungseinheiten laden
        const unitsResponse = await api.get('/trackandtrace/distributions/available_units/');
        setAvailableUnits(unitsResponse.data);
        
        // Mitglieder laden
        const membersResponse = await api.get('/members/?limit=1000');
        setMembers(membersResponse.data.results || membersResponse.data || []);
        
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        setError('Die benötigten Daten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handler für Formularaktualisierungen
  const handleAddUnit = (unit) => {
    if (unit && !selectedUnits.some(u => u.id === unit.id)) {
      setSelectedUnits([...selectedUnits, unit]);
    }
  };
  
  const handleRemoveUnit = (unitId) => {
    setSelectedUnits(selectedUnits.filter(unit => unit.id !== unitId));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!distributorId) {
      setError('Bitte wählen Sie einen ausgebenden Mitarbeiter aus');
      return;
    }
    
    if (!recipientId) {
      setError('Bitte wählen Sie ein empfangendes Mitglied aus');
      return;
    }
    
    if (selectedUnits.length === 0) {
      setError('Bitte wählen Sie mindestens eine Verpackungseinheit aus');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post('/trackandtrace/distributions/', {
        distributor_id: distributorId,
        recipient_id: recipientId,
        packaging_unit_ids: selectedUnits.map(unit => unit.id),
        notes: notes,
        distribution_date: new Date().toISOString()
      });
      
      // Erfolgsmeldung anzeigen
      setSuccess(true);
      
      // Formular zurücksetzen
      setSelectedUnits([]);
      setNotes('');
      
      // Verfügbare Einheiten aktualisieren
      const unitsResponse = await api.get('/trackandtrace/distributions/available_units/');
      setAvailableUnits(unitsResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Speichern der Produktausgabe:', err);
      setError(err.response?.data?.error || 'Die Produktausgabe konnte nicht gespeichert werden');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filtere verfügbare Einheiten basierend auf dem ausgewählten Produkttyp
  const filteredUnits = filterProductType
    ? availableUnits.filter(unit => {
        const batch = unit.batch || {};
        const labBatch = batch.lab_testing_batch || {};
        const processingBatch = labBatch.processing_batch || {};
        return processingBatch.product_type === filterProductType;
      })
    : availableUnits;
  
  if (loading) {
    return (
      <Container maxWidth="xl">
        <PageHeader title="Produktausgabe" />
        <LoadingIndicator />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <PageHeader title="Produktausgabe" />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Produktausgabe wurde erfolgreich gespeichert!
        </Alert>
      </Snackbar>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Neue Produktausgabe erstellen
        </Typography>
        
        <Grid container spacing={3} component="form" onSubmit={handleSubmit}>
          {/* Ausgeber & Empfänger */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              id="distributor-select"
              options={members}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
              onChange={(_, newValue) => setDistributorId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ausgebender Mitarbeiter"
                  required
                  helperText="Wer gibt das Produkt aus?"
                />
              )}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              id="recipient-select"
              options={members}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
              onChange={(_, newValue) => setRecipientId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Empfangendes Mitglied"
                  required
                  helperText="Wer erhält das Produkt?"
                />
              )}
              fullWidth
            />
          </Grid>
          
          {/* Produktauswahl */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Produktauswahl
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="product-type-filter-label">Nach Produkttyp filtern</InputLabel>
                <Select
                  labelId="product-type-filter-label"
                  id="product-type-filter"
                  value={filterProductType}
                  label="Nach Produkttyp filtern"
                  onChange={(e) => setFilterProductType(e.target.value)}
                >
                  <MenuItem value="">Alle Produkttypen</MenuItem>
                  <MenuItem value="marijuana">Marihuana</MenuItem>
                  <MenuItem value="hashish">Haschisch</MenuItem>
                </Select>
                <FormHelperText>Optional: Einheiten nach Produkttyp filtern</FormHelperText>
              </FormControl>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Verfügbare Verpackungseinheiten ({filteredUnits.length})
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ height: 300, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Einheits-Nr.</TableCell>
                        <TableCell>Produkttyp</TableCell>
                        <TableCell align="right">Gewicht</TableCell>
                        <TableCell>THC</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUnits.length > 0 ? (
                        filteredUnits.map((unit) => {
                          const batch = unit.batch || {};
                          const productType = batch.product_type_display || 'Unbekannt';
                          const isMarijuana = productType.toLowerCase().includes('marihuana');
                          
                          return (
                            <TableRow key={unit.id}>
                              <TableCell>{unit.batch_number || '—'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {isMarijuana ? (
                                    <LocalFloristIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                  ) : (
                                    <FilterDramaIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                                  )}
                                  {productType}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{parseFloat(unit.weight).toFixed(2)}g</TableCell>
                              <TableCell>
                                {batch.thc_content ? `${batch.thc_content}%` : 'k.A.'}
                              </TableCell>
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleAddUnit(unit)}
                                  disabled={selectedUnits.some(u => u.id === unit.id)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Keine verfügbaren Einheiten
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Ausgewählte Einheiten ({selectedUnits.length})
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ height: 300, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Einheits-Nr.</TableCell>
                        <TableCell>Produkttyp</TableCell>
                        <TableCell align="right">Gewicht</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedUnits.length > 0 ? (
                        selectedUnits.map((unit) => {
                          const batch = unit.batch || {};
                          const productType = batch.product_type_display || 'Unbekannt';
                          const isMarijuana = productType.toLowerCase().includes('marihuana');
                          
                          return (
                            <TableRow key={unit.id}>
                              <TableCell>{unit.batch_number || '—'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {isMarijuana ? (
                                    <LocalFloristIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                  ) : (
                                    <FilterDramaIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                                  )}
                                  {productType}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{parseFloat(unit.weight).toFixed(2)}g</TableCell>
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleRemoveUnit(unit.id)}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            Keine Einheiten ausgewählt
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Zusammenfassung */}
          {selectedUnits.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#f9fbff' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Zusammenfassung
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.values(productSummary).map((product, idx) => (
                      <Chip
                        key={idx}
                        icon={product.displayType.toLowerCase().includes('marihuana') ? 
                              <LocalFloristIcon /> : <FilterDramaIcon />}
                        label={`${product.displayType}: ${product.count}× (${product.weight.toFixed(2)}g)`}
                        color={product.displayType.toLowerCase().includes('marihuana') ? 
                               'success' : 'warning'}
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      Gesamtgewicht:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {totalWeight.toFixed(2)}g
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Notizen */}
          <Grid item xs={12}>
            <TextField
              label="Bemerkungen"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
          
          {/* Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => {
                  setSelectedUnits([]);
                  setNotes('');
                }}
                disabled={selectedUnits.length === 0 && !notes}
              >
                Zurücksetzen
              </Button>
              
              <Button 
                type="submit"
                variant="contained" 
                color="primary"
                disabled={!distributorId || !recipientId || selectedUnits.length === 0 || submitting}
                endIcon={<ArrowForwardIcon />}
              >
                {submitting ? 'Speichern...' : 'Produkt ausgeben'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProductDistributionPage;