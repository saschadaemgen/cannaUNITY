// frontend/src/apps/trackandtrace/components/SeedManufacturerDropdown.jsx
import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Box,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  FormControl,
  FormHelperText,
  Paper
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../utils/api';
import { fullWidthDialogStyle } from '../utils/DialogStyles';

const SeedManufacturerDropdown = ({ 
  value, 
  onChange, 
  error, 
  helperText,
  disabled = false,
  sx = {}
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newManufacturer, setNewManufacturer] = useState({
    name: '',
    website: '',
    country: '',
    contact_person: '',
    email: '',
    phone: '',
    order_history: '',
    notes: '',
    // Neue Felder hinzugefügt
    address: '',
    contact_email: '',
    delivery_time: ''
  });

  // Laden aller Hersteller beim ersten Rendern
  useEffect(() => {
    fetchManufacturers();
  }, []);

  // Hersteller von der API laden
  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trackandtrace/manufacturers/');
      const data = Array.isArray(response.data) ? response.data : 
                  (response.data && Array.isArray(response.data.results)) ? 
                  response.data.results : [];
      setManufacturers(data);
    } catch (err) {
      console.error('Fehler beim Laden der Hersteller:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dialog zum Erstellen eines neuen Herstellers öffnen
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setFormError(null);
    setNewManufacturer(prev => ({ 
      name: inputValue,
      website: '',
      country: '',
      contact_person: '',
      email: '',
      phone: '',
      order_history: '',
      notes: '',
      // Neue Felder mit Defaultwerten
      address: '',
      contact_email: '',
      delivery_time: ''
    }));
    setOpenDialog(true);
  };

  // Dialog zum Bearbeiten eines Herstellers öffnen
  const handleEditManufacturer = (manufacturer) => {
    setIsEditMode(true);
    setFormError(null);
    setNewManufacturer({
      id: manufacturer.id,
      name: manufacturer.name,
      website: manufacturer.website || '',
      country: manufacturer.country || '',
      contact_person: manufacturer.contact_person || '',
      email: manufacturer.email || '',
      phone: manufacturer.phone || '',
      order_history: manufacturer.order_history || '',
      notes: manufacturer.notes || '',
      // Neue Felder mit existierenden Werten oder leer
      address: manufacturer.address || '',
      contact_email: manufacturer.contact_email || '',
      delivery_time: manufacturer.delivery_time || ''
    });
    setOpenDialog(true);
  };

  // Löschen eines Herstellers
  const handleDeleteManufacturer = async (manufacturer) => {
    try {
      // Prüfen auf abhängige Samen
      const response = await api.get(`/trackandtrace/seeds/?manufacturer=${manufacturer.id}`);
      const seedData = Array.isArray(response.data) ? response.data : 
                     (response.data && Array.isArray(response.data.results)) ? 
                     response.data.results : [];
      
      if (seedData.length > 0) {
        alert(`Der Hersteller "${manufacturer.name}" kann nicht gelöscht werden, da noch ${seedData.length} Samen damit verknüpft sind. Bitte löschen Sie zuerst alle zugehörigen Samen.`);
        return;
      }
      
      if (window.confirm(`Hersteller "${manufacturer.name}" wirklich löschen?`)) {
        await api.delete(`/trackandtrace/manufacturers/${manufacturer.id}/`);
        fetchManufacturers();
      }
    } catch (err) {
      console.error('Fehler beim Löschen des Herstellers:', err);
      alert('Der Hersteller konnte nicht gelöscht werden.');
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError(null);
  };

  // Änderungen im Formular für neue/bearbeitete Hersteller verarbeiten
  const handleManufacturerChange = (e) => {
    const { name, value } = e.target;
    setNewManufacturer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hersteller speichern (erstellen oder aktualisieren)
  const handleSaveManufacturer = async () => {
    if (!newManufacturer.name) {
      setFormError('Name des Herstellers ist erforderlich');
      return;
    }
    
    try {
      let response;
      if (isEditMode) {
        // Hersteller aktualisieren
        response = await api.put(`/trackandtrace/manufacturers/${newManufacturer.id}/`, newManufacturer);
        // Liste aktualisieren
        setManufacturers(prev => prev.map(m => m.id === newManufacturer.id ? response.data : m));
      } else {
        // Neuen Hersteller erstellen
        response = await api.post('/trackandtrace/manufacturers/', newManufacturer);
        // Neu erstellten Hersteller zur Liste hinzufügen
        setManufacturers(prev => [...prev, response.data]);
      }
      
      // Setzt den Hersteller als ausgewählten Wert
      onChange({ target: { name: 'manufacturer', value: response.data.id } });
      handleCloseDialog();
    } catch (err) {
      console.error(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} des Herstellers:`, err);
      setFormError(
        err.response?.data?.detail || 
        `Der Hersteller konnte nicht ${isEditMode ? 'aktualisiert' : 'erstellt'} werden.`
      );
    }
  };

  return (
    <>
      <Autocomplete
        value={value ? manufacturers.find(m => m.id === value) || null : null}
        onChange={(event, newValue) => {
          // Wenn null, dann wurde die Auswahl gelöscht
          if (newValue === null) {
            onChange({ target: { name: 'manufacturer', value: '' } });
            return;
          }
          
          // Wenn newValue ein Objekt ist, wurde ein bestehender Hersteller ausgewählt
          if (typeof newValue === 'object' && newValue.id) {
            onChange({ target: { name: 'manufacturer', value: newValue.id } });
          }
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        options={manufacturers}
        getOptionLabel={(option) => option.name || ''}
        filterOptions={(options, params) => {
          const filtered = options.filter(option => 
            option.name.toLowerCase().includes(params.inputValue.toLowerCase())
          );
          
          // Wenn Eingabe vorhanden ist und keine exakte Übereinstimmung
          const exactMatch = options.find(option => 
            option.name.toLowerCase() === params.inputValue.toLowerCase()
          );
          
          if (params.inputValue !== '' && !exactMatch) {
            // Option zum Anlegen eines neuen Herstellers hinzufügen
            filtered.push({
              id: 'new',
              name: `"${params.inputValue}" anlegen`,
              isCreateOption: true
            });
          }
          
          return filtered;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Hersteller"
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          if (option.isCreateOption) {
            return (
              <li {...props} onClick={handleOpenCreateDialog}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  color: 'success.main',
                  fontWeight: 'bold'
                }}>
                  <Typography variant="body1">{option.name}</Typography>
                </Box>
              </li>
            );
          }
          
          return (
            <li 
              {...props} 
              onClick={(e) => {
                // Nur wenn nicht auf einen Button geklickt wurde
                if (!e.defaultPrevented) {
                  props.onClick(e);
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: '100%', 
                alignItems: 'center' 
              }}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.country && (
                    <Typography variant="caption" color="text.secondary">
                      {option.country}
                    </Typography>
                  )}
                </Box>
                
                {/* Icons statt Text-Buttons */}
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title="Bearbeiten">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditManufacturer(option);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Löschen">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteManufacturer(option);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </li>
          );
        }}
        sx={{ minWidth: 300, ...sx }}
        disabled={disabled}
      />

      {/* Dialog zum Erstellen oder Bearbeiten eines Herstellers - mit zentralisiertem Dialog-Style */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="xl" 
        fullWidth
        sx={fullWidthDialogStyle}
      >
        <DialogTitle>
          {isEditMode ? `Hersteller "${newManufacturer.name}" bearbeiten` : 'Neuen Hersteller anlegen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Allgemeine Informationen */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: 'primary.main', 
                  fontWeight: 500,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Allgemeine Informationen
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Name des Herstellers"
                    name="name"
                    value={newManufacturer.name}
                    onChange={handleManufacturerChange}
                    error={formError && !newManufacturer.name}
                    helperText={formError && !newManufacturer.name ? formError : ''}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Land"
                    name="country"
                    value={newManufacturer.country}
                    onChange={handleManufacturerChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Anschrift"
                    name="address"
                    value={newManufacturer.address}
                    onChange={handleManufacturerChange}
                    multiline
                    rows={2}
                    placeholder="Straße, Hausnummer, PLZ, Ort"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={newManufacturer.website}
                    onChange={handleManufacturerChange}
                    placeholder="https://"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Lieferzeit (Tage)"
                    name="delivery_time"
                    type="number"
                    value={newManufacturer.delivery_time}
                    onChange={handleManufacturerChange}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Kontaktinformationen */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: 'primary.main', 
                  fontWeight: 500,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Kontaktinformationen
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ansprechpartner"
                    name="contact_person"
                    value={newManufacturer.contact_person}
                    onChange={handleManufacturerChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefonnummer"
                    name="phone"
                    value={newManufacturer.phone}
                    onChange={handleManufacturerChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Info E-Mail"
                    name="email"
                    value={newManufacturer.email}
                    onChange={handleManufacturerChange}
                    placeholder="info@beispiel.de"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-Mail des Ansprechpartners"
                    name="contact_email"
                    value={newManufacturer.contact_email}
                    onChange={handleManufacturerChange}
                    placeholder="kontakt@beispiel.de"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Zusätzliche Informationen */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: 'primary.main', 
                  fontWeight: 500,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Zusätzliche Informationen
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bestellhistorie"
                    name="order_history"
                    value={newManufacturer.order_history}
                    onChange={handleManufacturerChange}
                    multiline
                    rows={4}
                    placeholder="Informationen zu bisherigen Bestellungen"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notizen"
                    name="notes"
                    value={newManufacturer.notes}
                    onChange={handleManufacturerChange}
                    multiline
                    rows={4}
                    placeholder="Zusätzliche Informationen zum Hersteller"
                  />
                </Grid>
              </Grid>
            </Paper>

            {formError && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                {formError}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ABBRECHEN</Button>
          <Button 
            onClick={handleSaveManufacturer} 
            variant="contained" 
            color="primary"
            disabled={!newManufacturer.name.trim()}
          >
            {isEditMode ? 'AKTUALISIEREN' : 'HERSTELLER ANLEGEN'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SeedManufacturerDropdown;