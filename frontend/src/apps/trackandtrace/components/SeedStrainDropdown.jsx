// frontend/src/apps/trackandtrace/components/SeedStrainDropdown.jsx
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
  Slider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../utils/api';

const SeedStrainDropdown = ({ 
  value, 
  onChange, 
  error, 
  helperText,
  disabled = false,
  manufacturerId = null,
  onNewStrainCreated = () => {}
}) => {
  const [strains, setStrains] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStrain, setNewStrain] = useState({
    strain_name: '',
    strain_type: 'feminized',
    genetics: '',
    sativa_percentage: 50,
    indica_percentage: 50,
    thc_value: '',
    cbd_value: 1.0,
    flowering_time: '',
    height_indoor: '',
    height_outdoor: '',
    yield_indoor: '',
    yield_outdoor: '',
    effect: '',
    flavor: '',
    growing_tips: '',
    manufacturer: null,
    notes: ''
  });

  useEffect(() => {
    if (manufacturerId) {
      fetchStrains(manufacturerId);
    } else {
      setStrains([]);
    }
  }, [manufacturerId]);

  const fetchStrains = async (manufacturerId) => {
    if (!manufacturerId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/trackandtrace/strains/?manufacturer=${manufacturerId}`);
      const data = Array.isArray(response.data) ? response.data : 
                  (response.data && Array.isArray(response.data.results)) ? 
                  response.data.results : [];
      setStrains(data);
    } catch (err) {
      console.error('Fehler beim Laden der Sorten:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setNewStrain(prev => ({ 
      ...prev, 
      id: undefined,
      strain_name: inputValue,
      strain_type: 'feminized',
      genetics: '',
      sativa_percentage: 50,
      indica_percentage: 50,
      thc_value: '',
      cbd_value: 1.0,
      flowering_time: '',
      height_indoor: '',
      height_outdoor: '',
      yield_indoor: '',
      yield_outdoor: '',
      effect: '',
      flavor: '',
      growing_tips: '',
      manufacturer: manufacturerId,
      notes: ''
    }));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleStrainChange = (e) => {
    const { name, value } = e.target;
    setNewStrain(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSativaChange = (event, newValue) => {
    setNewStrain(prev => ({
      ...prev,
      sativa_percentage: newValue,
      indica_percentage: 100 - newValue
    }));
  };

  const handleEditStrain = (strain) => {
    setNewStrain({
      id: strain.id,
      strain_name: strain.strain_name,
      strain_type: strain.strain_type || 'feminized',
      genetics: strain.genetics || '',
      sativa_percentage: strain.sativa_percentage,
      indica_percentage: strain.indica_percentage,
      thc_value: strain.thc_value || '',
      cbd_value: strain.cbd_value || 1.0,
      flowering_time: strain.flowering_time || '',
      height_indoor: strain.height_indoor || '',
      height_outdoor: strain.height_outdoor || '',
      yield_indoor: strain.yield_indoor || '',
      yield_outdoor: strain.yield_outdoor || '',
      effect: strain.effect || '',
      flavor: strain.flavor || '',
      growing_tips: strain.growing_tips || '',
      manufacturer: manufacturerId,
      notes: strain.notes || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteStrain = async (strain) => {
    // Prüfen, ob noch Samen mit dieser Sorte verknüpft sind
    try {
      // Zuerst prüfen, ob es abhängige Samen gibt
      const response = await api.get(`/trackandtrace/seeds/?strain=${strain.id}`);
      const seedData = Array.isArray(response.data) ? response.data : 
                      (response.data && Array.isArray(response.data.results)) ? 
                      response.data.results : [];
      
      if (seedData.length > 0) {
        // Es gibt noch verknüpfte Samen
        alert(`Die Sorte "${strain.strain_name}" kann nicht gelöscht werden, da noch ${seedData.length} Samen damit verknüpft sind. Bitte löschen Sie zuerst alle zugehörigen Samen.`);
        return;
      }
      
      // Es gibt keine verknüpften Samen, also können wir löschen
      if (window.confirm(`Sorte "${strain.strain_name}" wirklich löschen?`)) {
        await api.delete(`/trackandtrace/strains/${strain.id}/`);
        // Liste aktualisieren
        fetchStrains(manufacturerId);
      }
    } catch (err) {
      console.error('Fehler beim Löschen der Sorte:', err);
      alert('Die Sorte konnte nicht gelöscht werden. Möglicherweise gibt es noch verknüpfte Daten.');
    }
  };

  const handleSaveNewStrain = async () => {
    if (!newStrain.strain_name || !manufacturerId) return;
    
    try {
      let response;
      
      if (newStrain.id) {
        // Aktualisieren einer bestehenden Sorte
        response = await api.put(`/trackandtrace/strains/${newStrain.id}/`, {
          ...newStrain,
          manufacturer: manufacturerId
        });
        // Liste aktualisieren
        setStrains(prev => 
          prev.map(s => s.id === response.data.id ? response.data : s)
        );
      } else {
        // Erstellen einer neuen Sorte
        response = await api.post('/trackandtrace/strains/', {
          ...newStrain,
          manufacturer: manufacturerId
        });
        // Neu erstellte Sorte zur Liste hinzufügen
        setStrains(prev => [...prev, response.data]);
      }
      
      onChange({ 
        target: { 
          name: 'strain', 
          value: response.data.id,
          strainData: response.data 
        } 
      });
      
      onNewStrainCreated(response.data);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Fehler beim Erstellen/Aktualisieren der Sorte:', err);
    }
  };

  return (
    <>
      <Autocomplete
        value={value ? strains.find(s => s.id === value) || null : null}
        onChange={(event, newValue) => {
          if (newValue === null) {
            onChange({ target: { name: 'strain', value: '' } });
            return;
          }
          
          if (typeof newValue === 'object' && newValue.id) {
            onChange({ 
              target: { 
                name: 'strain', 
                value: newValue.id,
                strainData: newValue 
              } 
            });
          }
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        options={strains}
        getOptionLabel={(option) => option.strain_name || ''}
        filterOptions={(options, params) => {
          const filtered = options.filter(option => 
            option.strain_name.toLowerCase().includes(params.inputValue.toLowerCase())
          );
          
          // Wenn Eingabe vorhanden ist und keine exakte Übereinstimmung
          const exactMatch = options.find(option => 
            option.strain_name.toLowerCase() === params.inputValue.toLowerCase()
          );
          
          if (params.inputValue !== '' && !exactMatch) {
            // Option zum Anlegen einer neuen Sorte hinzufügen
            filtered.push({
              id: 'new',
              strain_name: `"${params.inputValue}" anlegen`,
              isCreateOption: true
            });
          }
          
          return filtered;
        }}
        freeSolo
        renderInput={(params) => (
          <TextField
            {...params}
            label="Cannabis-Sorte"
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
                  <Typography variant="body1">{option.strain_name}</Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">{option.strain_name}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {option.genetics || 'Keine Genetik angegeben'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {option.sativa_percentage}% Sativa / {option.indica_percentage}% Indica
                    </Typography>
                  </Box>
                </Box>
                
                {/* Icons statt Text-Buttons */}
                <Box sx={{ display: 'flex', ml: 2 }}>
                  <Tooltip title="Bearbeiten">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditStrain(option);
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
                        handleDeleteStrain(option);
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
        noOptionsText={
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Keine Sorte gefunden
            </Typography>
            {manufacturerId ? (
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleOpenCreateDialog}
                disabled={!inputValue.trim()}
              >
                "{inputValue}" als neue Sorte anlegen
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Bitte zuerst einen Hersteller auswählen
              </Typography>
            )}
          </Box>
        }
        disabled={disabled || !manufacturerId}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {newStrain.id ? 'Cannabis-Sorte bearbeiten' : 'Neue Cannabis-Sorte anlegen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', pt: 2 }}>
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Sortenname *"
              name="strain_name"
              value={newStrain.strain_name}
              onChange={handleStrainChange}
              required
            />
            
            <FormControl sx={{ width: '350px', mb: 2 }}>
              <InputLabel>Sortentyp</InputLabel>
              <Select
                name="strain_type"
                value={newStrain.strain_type || 'feminized'}
                onChange={handleStrainChange}
                label="Sortentyp"
              >
                <MenuItem value="regular">Regulär</MenuItem>
                <MenuItem value="feminized">Feminisiert</MenuItem>
                <MenuItem value="auto">Autoflowering</MenuItem>
                <MenuItem value="f1">F1</MenuItem>
                <MenuItem value="f1_hybrid">F1 Hybrid</MenuItem>
                <MenuItem value="cbd">CBD-reich</MenuItem>
                <MenuItem value="ruderalis">Ruderalis</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Genetik (z.B. Kreuzung)"
              name="genetics"
              value={newStrain.genetics}
              onChange={handleStrainChange}
            />
            
            {/* Sativa/Indica-Verhältnis */}
            <Box sx={{ width: '350px', mb: 2 }}>
              <Typography gutterBottom>Sativa/Indica Verhältnis</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ width: 80 }}>Indica: {newStrain.indica_percentage}%</Typography>
                <Slider
                  value={newStrain.sativa_percentage}
                  onChange={handleSativaChange}
                  aria-labelledby="sativa-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `Sativa: ${value}%`}
                  sx={{ mx: 2 }}
                />
                <Typography sx={{ width: 80 }}>Sativa: {newStrain.sativa_percentage}%</Typography>
              </Box>
            </Box>
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="THC-Gehalt (%)"
              name="thc_value"
              type="number"
              inputProps={{ step: 0.1, min: 0 }}
              value={newStrain.thc_value}
              onChange={handleStrainChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="CBD-Gehalt (%)"
              name="cbd_value"
              type="number"
              inputProps={{ step: 0.1, min: 0 }}
              value={newStrain.cbd_value || 1.0}  // Vorausgewählt 1%
              onChange={handleStrainChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Blütezeit (Tage)"
              name="flowering_time"
              type="number"
              inputProps={{ min: 0 }}
              value={newStrain.flowering_time}
              onChange={handleStrainChange}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Wuchshöhe Indoor (cm)"
              name="height_indoor"
              type="number"
              inputProps={{ min: 0 }}
              value={newStrain.height_indoor}
              onChange={handleStrainChange}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Wuchshöhe Outdoor (cm)"
              name="height_outdoor"
              type="number"
              inputProps={{ min: 0 }}
              value={newStrain.height_outdoor}
              onChange={handleStrainChange}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Ertrag Indoor (g/m²)"
              name="yield_indoor"
              type="number"
              inputProps={{ min: 0 }}
              value={newStrain.yield_indoor}
              onChange={handleStrainChange}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Ertrag Outdoor (g/Pflanze)"
              name="yield_outdoor"
              type="number"
              inputProps={{ min: 0 }}
              value={newStrain.yield_outdoor}
              onChange={handleStrainChange}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Wirkung"
              name="effect"
              value={newStrain.effect}
              onChange={handleStrainChange}
              multiline
              rows={2}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Geschmack"
              name="flavor"
              value={newStrain.flavor}
              onChange={handleStrainChange}
              multiline
              rows={2}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Kultivierungshinweise"
              name="growing_tips"
              value={newStrain.growing_tips}
              onChange={handleStrainChange}
              multiline
              rows={3}
            />
            
            <TextField
              sx={{ width: '350px', mb: 2 }}
              label="Notizen"
              name="notes"
              value={newStrain.notes}
              onChange={handleStrainChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ABBRECHEN</Button>
          <Button 
            onClick={handleSaveNewStrain}
            variant="contained" 
            color="primary"
            disabled={!newStrain.strain_name.trim() || !manufacturerId}
          >
            {newStrain.id ? 'SORTE AKTUALISIEREN' : 'SORTE ANLEGEN'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SeedStrainDropdown;