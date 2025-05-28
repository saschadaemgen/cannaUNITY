import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Divider, Grid, 
  TextField, Button, Autocomplete, Chip, FormControl,
  InputLabel, MenuItem, Select, FormHelperText, Snackbar,
  Alert, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Fade, Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '@/utils/api';

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader';
import LoadingIndicator from '@/components/common/LoadingIndicator';

const ProductDistributionPage = () => {
  // States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  
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
  
  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true);
    setScanSuccess(false);
    await handleRfidScan();
  };
  
  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setSubmitting(true);
    
    try {
      console.log("🚀 Starte RFID-Scan für Produktausgabe...");
      
      if (isAborting) return;
      
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      });
      
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;
      
      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name });
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.');
      }
      
      if (isAborting) return;
      
      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );
      
      const { member_id, member_name } = verifyRes.data;
      
      // Erfolg setzen und Mitgliedsdaten speichern
      setDistributorId(member_id);
      setScannedMemberName(member_name);
      setScanSuccess(true);
      
      // 3. Nach erfolgreicher Verifizierung die Produktausgabe durchführen
      setTimeout(async () => {
        await submitDistribution(member_id);
        
        // Nach weiteren 2 Sekunden zurücksetzen
        setTimeout(() => {
          setScanMode(false);
          setScanSuccess(false);
          setScannedMemberName('');
          
          // Formular zurücksetzen
          setSelectedUnits([]);
          setNotes('');
          setRecipientId('');
          
          // Verfügbare Einheiten aktualisieren
          fetchAvailableUnits();
        }, 2000);
      }, 500);
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
        setError(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen');
      }
      
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      if (!isAborting) {
        setSubmitting(false);
      }
    }
  };
  
  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    setIsAborting(true);
    
    if (abortController) {
      abortController.abort();
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/');
      console.log("RFID-Scan erfolgreich abgebrochen");
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error);
    } finally {
      setScanMode(false);
      setSubmitting(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };
  
  // Produktausgabe durchführen
  const submitDistribution = async (rfidDistributorId) => {
    try {
      const response = await api.post('/trackandtrace/distributions/', {
        distributor_id: rfidDistributorId,
        recipient_id: recipientId,
        packaging_unit_ids: selectedUnits.map(unit => unit.id),
        notes: notes,
        distribution_date: new Date().toISOString()
      });
      
      // Erfolgsmeldung anzeigen
      setSuccess(true);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Speichern der Produktausgabe:', err);
      setError(err.response?.data?.error || 'Die Produktausgabe konnte nicht gespeichert werden');
      setScanMode(false);
      setScanSuccess(false);
    }
  };
  
  // Verfügbare Einheiten neu laden
  const fetchAvailableUnits = async () => {
    try {
      const unitsResponse = await api.get('/trackandtrace/distributions/available_units/');
      setAvailableUnits(unitsResponse.data);
    } catch (err) {
      console.error('Fehler beim Laden der verfügbaren Einheiten:', err);
    }
  };
  
  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recipientId) {
      setError('Bitte wählen Sie ein empfangendes Mitglied aus');
      return;
    }
    
    if (selectedUnits.length === 0) {
      setError('Bitte wählen Sie mindestens eine Verpackungseinheit aus');
      return;
    }
    
    // Starte RFID-Scan für Autorisierung
    startRfidScan();
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
  
  // Validierung
  const isFormValid = () => {
    return recipientId && selectedUnits.length > 0;
  };
  
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
      
      {error && !scanMode && (
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
      
      <Paper sx={{ p: 3, mb: 4, position: 'relative', overflow: scanMode ? 'hidden' : 'visible' }}>
        {/* RFID-Scan-Overlay */}
        {scanMode && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.light',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            zIndex: 1300
          }}>
            {/* Abbrechen-Button nur anzeigen, wenn wir NICHT im Erfolgs-Modus sind */}
            {!scanSuccess && (
              <Button 
                onClick={handleCancelScan}
                variant="contained" 
                color="error"
                size="small"
                sx={{ 
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  minWidth: '100px'
                }}
              >
                Abbrechen
              </Button>
            )}
            
            {scanSuccess ? (
              // Erfolgsmeldung nach erfolgreichem Scan
              <Fade in={scanSuccess}>
                <Box sx={{ textAlign: 'center' }}>
                  <Zoom in={scanSuccess}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                  </Zoom>
                  
                  <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                    Autorisierung erfolgreich
                  </Typography>
                  
                  <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                    {selectedUnits.length} {selectedUnits.length === 1 ? 'Einheit' : 'Einheiten'} mit {totalWeight.toFixed(2)}g wurden ausgegeben
                  </Typography>
                  
                  <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                    Ausgegeben von: {scannedMemberName}
                  </Typography>
                </Box>
              </Fade>
            ) : (
              // Scan-Aufforderung
              <>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Bitte Ausweis jetzt scannen
                </Typography>
                
                <Typography variant="body1" align="center" color="white" gutterBottom>
                  um die Produktausgabe zu autorisieren
                </Typography>
                
                {submitting && (
                  <CircularProgress 
                    size={60} 
                    thickness={5} 
                    sx={{ 
                      color: 'white', 
                      mt: 4 
                    }} 
                  />
                )}
              </>
            )}
          </Box>
        )}
        
        <Typography variant="h6" gutterBottom>
          Neue Produktausgabe erstellen
        </Typography>
        
        <Grid container spacing={3} component="form" onSubmit={handleSubmit}>
          {/* Info-Box für ausgebenden Mitarbeiter */}
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'info.light', 
                color: 'info.contrastText',
                borderRadius: 1,
                height: '100%'
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                <strong>Ausgebender Mitarbeiter</strong>
              </Typography>
              <Typography variant="body2">
                Die Zuordnung des ausgebenden Mitarbeiters erfolgt automatisch per RFID-Autorisierung beim Speichern.
              </Typography>
            </Box>
          </Grid>
          
          {/* Empfänger */}
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
                  setRecipientId('');
                }}
                disabled={selectedUnits.length === 0 && !notes && !recipientId}
              >
                Zurücksetzen
              </Button>
              
              <Button 
                type="submit"
                variant="contained" 
                color="primary"
                disabled={!isFormValid() || submitting}
                startIcon={submitting ? <CircularProgress size={16} /> : <CreditCardIcon />}
              >
                Mit RFID autorisieren & ausgeben
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProductDistributionPage;