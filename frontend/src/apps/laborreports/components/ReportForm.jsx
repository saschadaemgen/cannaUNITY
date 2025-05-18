// frontend/src/apps/laborreports/components/ReportForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import api from '@/utils/api';

// TabPanel für die Tab-Navigation
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportForm({ initialData = {}, isEdit = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    // Hauptdaten
    report_number: '',
    sample_id: '',
    sample_name: '',
    sample_type: '',
    collection_person: '',
    analysis_person: '',
    approval_person: '',
    collection_date: '',
    analysis_date: '',
    approval_date: '',
    is_gmp_compliant: false,
    is_gacp_compliant: false,
    overall_status: 'pending',
    notes: '',
    track_and_trace_batch: '',
    
    // Cannabinoid-Profil
    cannabinoid_profile: {
      thc: 0,
      thca: 0,
      cbd: 0,
      cbda: 0,
      cbn: 0,
      cbg: 0,
      cbga: 0,
      notes: ''
    },
    
    // Terpen-Profil
    terpene_profile: {
      myrcene: 0,
      limonene: 0,
      caryophyllene: 0,
      terpinolene: 0,
      linalool: 0,
      pinene: 0,
      humulene: 0,
      ocimene: 0,
      notes: ''
    },
    
    // Verunreinigungstests
    contaminant_tests: []
  });
  
  // Laden der Kategorien für Verunreinigungstests
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/laborreports/contaminant-categories/');
        setCategories(res.data);
      } catch (err) {
        console.error('Fehler beim Laden der Kategorien:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Vorausfüllen des Formulars bei Bearbeitung
  useEffect(() => {
    if (isEdit && initialData && Object.keys(initialData).length > 0) {
      const formattedData = {
        ...initialData,
        cannabinoid_profile: initialData.cannabinoid_profile || formData.cannabinoid_profile,
        terpene_profile: initialData.terpene_profile || formData.terpene_profile,
        contaminant_tests: initialData.contaminant_tests || []
      };
      
      setFormData(formattedData);
    }
  }, [isEdit, initialData]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleAddContaminantTest = () => {
    const newTest = {
      id: Date.now().toString(), // Temporäre ID für UI-Zwecke
      category: categories.length > 0 ? categories[0].id : '',
      name: '',
      threshold_value: 0,
      detected_value: 0,
      unit: 'ppm',
      notes: ''
    };
    
    setFormData({
      ...formData,
      contaminant_tests: [...formData.contaminant_tests, newTest]
    });
  };
  
  const handleContaminantTestChange = (index, field, value) => {
    const updatedTests = [...formData.contaminant_tests];
    updatedTests[index] = {
      ...updatedTests[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      contaminant_tests: updatedTests
    });
  };
  
  const handleRemoveContaminantTest = (index) => {
    const updatedTests = formData.contaminant_tests.filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      contaminant_tests: updatedTests
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Daten für die API vorbereiten (tiefe Kopie)
      const apiData = JSON.parse(JSON.stringify(formData));
      
      // Stellen Sie sicher, dass Datum im richtigen Format ist
      ['collection_date', 'analysis_date', 'approval_date'].forEach(field => {
        if (apiData[field] === '') {
          apiData[field] = null;
        }
      });
      
      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      if (!apiData.report_number || !apiData.sample_id || !apiData.sample_name) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus');
      }
      
      // Verunreinigungstests bereinigen (leere entfernen)
      if (apiData.contaminant_tests) {
        apiData.contaminant_tests = apiData.contaminant_tests.filter(test => 
          test.name && test.category && test.category !== ''
        );
      }
      
      console.log('Sending data:', apiData); // Debugging
      
      let response;
      if (isEdit) {
        response = await api.put(`/laborreports/reports/${apiData.id}/`, apiData);
      } else {
        response = await api.post('/laborreports/reports/', apiData);
      }
      
      setSuccess(true);
      
      // Nach kurzer Verzögerung zur Liste navigieren
      setTimeout(() => {
        navigate('/laborreports');
      }, 1500);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      if (err.response && err.response.data) {
        // Zeige Details des Fehlers an
        console.error('API-Fehlerdetails:', err.response.data);
        setError('Fehler beim Speichern: ' + JSON.stringify(err.response.data));
      } else {
        setError('Fehler beim Speichern des Berichts: ' + (err.message || 'Unbekannter Fehler'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Card>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Allgemeine Informationen" />
          <Tab label="Cannabinoid-Profil" />
          <Tab label="Terpen-Profil" />
          <Tab label="Verunreinigungstests" />
        </Tabs>
        
        <CardContent>
          {/* Tab für allgemeine Informationen */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="report_number"
                  label="Berichtsnummer"
                  value={formData.report_number}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sample_id"
                  label="Proben-ID"
                  value={formData.sample_id}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sample_name"
                  label="Probenname"
                  value={formData.sample_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sample_type"
                  label="Probentyp"
                  value={formData.sample_type}
                  onChange={handleChange}
                  select
                  fullWidth
                  required
                >
                  <MenuItem value="flower">Blüte</MenuItem>
                  <MenuItem value="extract">Extrakt</MenuItem>
                  <MenuItem value="concentrate">Konzentrat</MenuItem>
                  <MenuItem value="oil">Öl</MenuItem>
                  <MenuItem value="edible">Essbar</MenuItem>
                  <MenuItem value="other">Sonstiges</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="subtitle2">Verantwortliche Personen</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  name="collection_person"
                  label="Probensammler"
                  value={formData.collection_person}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="analysis_person"
                  label="Analyst"
                  value={formData.analysis_person}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="approval_person"
                  label="Freigabe durch"
                  value={formData.approval_person}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="subtitle2">Daten</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  name="collection_date"
                  label="Sammeldatum"
                  type="date"
                  value={formData.collection_date}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="analysis_date"
                  label="Analysedatum"
                  type="date"
                  value={formData.analysis_date}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="approval_date"
                  label="Freigabedatum"
                  type="date"
                  value={formData.approval_date || ''}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="subtitle2">Konformität & Status</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_gmp_compliant"
                      checked={formData.is_gmp_compliant}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="GMP-konform"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_gacp_compliant"
                      checked={formData.is_gacp_compliant}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="GACP-konform"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="overall_status"
                  label="Gesamtstatus"
                  value={formData.overall_status}
                  onChange={handleChange}
                  select
                  fullWidth
                  required
                >
                  <MenuItem value="pending">Ausstehend</MenuItem>
                  <MenuItem value="passed">Bestanden</MenuItem>
                  <MenuItem value="failed">Nicht bestanden</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Anmerkungen"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="subtitle2">Track & Trace</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="track_and_trace_batch"
                  label="Track & Trace Batch-ID"
                  value={formData.track_and_trace_batch || ''}
                  onChange={handleChange}
                  fullWidth
                  helperText="Optional: Wird für zukünftige Integration verwendet"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Tab für Cannabinoid-Profil */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Cannabinoid-Profil
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Geben Sie die gemessenen Werte in Prozent (%) ein.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  name="cannabinoid_profile.thc"
                  label="THC"
                  type="number"
                  value={formData.cannabinoid_profile.thc}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="cannabinoid_profile.thca"
                  label="THCA"
                  type="number"
                  value={formData.cannabinoid_profile.thca}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="cannabinoid_profile.cbd"
                  label="CBD"
                  type="number"
                  value={formData.cannabinoid_profile.cbd}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="cannabinoid_profile.cbda"
                  label="CBDA"
                  type="number"
                  value={formData.cannabinoid_profile.cbda}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="cannabinoid_profile.cbn"
                  label="CBN"
                  type="number"
                  value={formData.cannabinoid_profile.cbn}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="cannabinoid_profile.cbg"
                  label="CBG"
                  type="number"
                  value={formData.cannabinoid_profile.cbg}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="cannabinoid_profile.cbga"
                  label="CBGA"
                  type="number"
                  value={formData.cannabinoid_profile.cbga}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="cannabinoid_profile.notes"
                  label="Anmerkungen zu Cannabinoiden"
                  value={formData.cannabinoid_profile.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Tab für Terpen-Profil */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Terpen-Profil
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Geben Sie die gemessenen Werte in Prozent (%) ein.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.myrcene"
                  label="Myrcen"
                  type="number"
                  value={formData.terpene_profile.myrcene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.limonene"
                  label="Limonen"
                  type="number"
                  value={formData.terpene_profile.limonene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.caryophyllene"
                  label="Caryophyllen"
                  type="number"
                  value={formData.terpene_profile.caryophyllene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.terpinolene"
                  label="Terpinolen"
                  type="number"
                  value={formData.terpene_profile.terpinolene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.linalool"
                  label="Linalool"
                  type="number"
                  value={formData.terpene_profile.linalool}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.pinene"
                  label="Pinen"
                  type="number"
                  value={formData.terpene_profile.pinene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.humulene"
                  label="Humulen"
                  type="number"
                  value={formData.terpene_profile.humulene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="terpene_profile.ocimene"
                  label="Ocimen"
                  type="number"
                  value={formData.terpene_profile.ocimene}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ step: 0.001, min: 0, max: 100 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="terpene_profile.notes"
                  label="Anmerkungen zu Terpenen"
                  value={formData.terpene_profile.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Tab für Verunreinigungstests */}
          <TabPanel value={activeTab} index={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Verunreinigungstests
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Fügen Sie Tests für verschiedene Verunreinigungen hinzu.
              </Typography>
              
              {formData.contaminant_tests.map((test, index) => (
                <Card key={test.id || index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Kategorie"
                        select
                        fullWidth
                        value={test.category}
                        onChange={(e) => handleContaminantTestChange(index, 'category', e.target.value)}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Verunreinigungsname"
                        fullWidth
                        value={test.name}
                        onChange={(e) => handleContaminantTestChange(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Grenzwert"
                        type="number"
                        fullWidth
                        value={test.threshold_value}
                        onChange={(e) => handleContaminantTestChange(index, 'threshold_value', e.target.value)}
                        inputProps={{ step: 0.0001, min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Gemessener Wert"
                        type="number"
                        fullWidth
                        value={test.detected_value}
                        onChange={(e) => handleContaminantTestChange(index, 'detected_value', e.target.value)}
                        inputProps={{ step: 0.0001, min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Einheit"
                        fullWidth
                        value={test.unit}
                        onChange={(e) => handleContaminantTestChange(index, 'unit', e.target.value)}
                        select
                      >
                        <MenuItem value="ppm">ppm</MenuItem>
                        <MenuItem value="ppb">ppb</MenuItem>
                        <MenuItem value="mg/kg">mg/kg</MenuItem>
                        <MenuItem value="µg/kg">µg/kg</MenuItem>
                        <MenuItem value="%">%</MenuItem>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => handleRemoveContaminantTest(index)}
                        >
                          Test entfernen
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              ))}
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleAddContaminantTest}
                >
                  Test hinzufügen
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/laborreports')}
        >
          Abbrechen
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {isEdit ? 'Speichern' : 'Bericht erstellen'}
        </Button>
      </Box>
      
      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          {isEdit ? 'Bericht erfolgreich aktualisiert!' : 'Bericht erfolgreich erstellt!'}
        </Alert>
      </Snackbar>
    </Box>
  );
}