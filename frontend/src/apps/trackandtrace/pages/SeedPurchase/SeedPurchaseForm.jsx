// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  TextField, 
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Box
} from '@mui/material';
import api from '../../../../utils/api';

const SeedPurchaseForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    manufacturer: '',
    genetics: '',
    strain_name: '',
    sativa_percentage: 50,
    indica_percentage: 50,
    thc_value: '',
    cbd_value: '',
    purchase_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    total_seeds: 0,
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder laden
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members/');
        // Sicherstellen, dass response.data ein Array ist
        if (response.data && Array.isArray(response.data)) {
          setMembers(response.data);
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Für den Fall, dass die API paginierte Ergebnisse zurückgibt
          setMembers(response.data.results);
        } else {
          console.error('Unerwartetes Datenformat:', response.data);
          setMembers([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Mitglieder:', err);
        setMembers([]);
      }
    };
    
    fetchMembers();
  }, []);
  
  // Formulardaten initialisieren, wenn initialData vorhanden
  useEffect(() => {
    if (initialData) {
      // Daten kopieren und verwenden
      setFormData({...initialData});
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Wenn Sativa geändert wird, Indica automatisch anpassen
    if (name === 'sativa_percentage') {
      setFormData(prev => ({
        ...prev,
        sativa_percentage: value,
        indica_percentage: 100 - value
      }));
    }
    // Wenn Indica geändert wird, Sativa automatisch anpassen
    else if (name === 'indica_percentage') {
      setFormData(prev => ({
        ...prev,
        indica_percentage: value,
        sativa_percentage: 100 - value
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.manufacturer) newErrors.manufacturer = 'Hersteller ist erforderlich';
    if (!formData.strain_name) newErrors.strain_name = 'Sortenname ist erforderlich';
    if (!formData.genetics) newErrors.genetics = 'Genetik ist erforderlich';
    if (!formData.purchase_date) newErrors.purchase_date = 'Kaufdatum ist erforderlich';
    if (!formData.total_seeds || formData.total_seeds <= 0) {
      newErrors.total_seeds = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Validate date format (YYYY-MM-DD)
    if (formData.purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.purchase_date)) {
      newErrors.purchase_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Daten vorbereiten für API
    const submitData = { ...formData };
    
    // Submit
    onSave(submitData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Stammdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Hersteller"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            error={!!errors.manufacturer}
            helperText={errors.manufacturer}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sortenname"
            name="strain_name"
            value={formData.strain_name}
            onChange={handleChange}
            error={!!errors.strain_name}
            helperText={errors.strain_name}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Genetik"
            name="genetics"
            value={formData.genetics}
            onChange={handleChange}
            error={!!errors.genetics}
            helperText={errors.genetics}
            margin="normal"
          />
        </Grid>
        
        {/* Prozentuale Anteile */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sativa-Anteil (%)"
            name="sativa_percentage"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={formData.sativa_percentage}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Indica-Anteil (%)"
            name="indica_percentage"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={formData.indica_percentage}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        {/* THC und CBD */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="THC-Wert (%)"
            name="thc_value"
            type="number"
            inputProps={{ step: 0.01, min: 0, max: 100 }}
            value={formData.thc_value}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="CBD-Wert (%)"
            name="cbd_value"
            type="number"
            inputProps={{ step: 0.01, min: 0, max: 100 }}
            value={formData.cbd_value}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        {/* Einkaufsdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Kaufdatum (YYYY-MM-DD)"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
            error={!!errors.purchase_date}
            helperText={errors.purchase_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Anzahl Samen"
            name="total_seeds"
            type="number"
            inputProps={{ min: 1 }}
            value={formData.total_seeds}
            onChange={handleChange}
            error={!!errors.total_seeds}
            helperText={errors.total_seeds}
            margin="normal"
          />
        </Grid>
        
        {/* Umgebungsdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Temperatur (°C)"
            name="temperature"
            type="number"
            inputProps={{ step: 0.1 }}
            value={formData.temperature}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Luftfeuchtigkeit (%)"
            name="humidity"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={formData.humidity}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        {/* Verantwortlicher */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!errors.responsible_member}
          >
            <InputLabel>Verantwortlicher</InputLabel>
            <Select
              name="responsible_member"
              value={formData.responsible_member}
              onChange={handleChange}
              label="Verantwortlicher"
            >
              {Array.isArray(members) && members.length > 0 ? 
                members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {`${member.first_name} ${member.last_name}`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Mitglieder verfügbar</MenuItem>
              }
            </Select>
            {errors.responsible_member && (
              <FormHelperText>{errors.responsible_member}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Bemerkungen */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bemerkungen"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />
        </Grid>
        
        {/* Buttons */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="outlined" 
              onClick={onCancel}
              sx={{ mr: 1 }}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {initialData ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default SeedPurchaseForm;