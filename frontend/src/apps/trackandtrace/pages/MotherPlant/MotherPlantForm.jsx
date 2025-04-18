// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantForm.jsx
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

const MotherPlantForm = ({ initialData, onSave, onCancel }) => {
  const [seeds, setSeeds] = useState([]);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    seed_source: '',
    planting_date: new Date().toISOString().split('T')[0],
    location: '',
    strain_name: '',
    nutrition_plan: '',
    status: 'vegetative',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder und Samen laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, seedsRes] = await Promise.all([
          api.get('/members/'),
          api.get('/trackandtrace/seeds/?destroyed=false')
        ]);
        
        // Setze Mitglieder
        if (Array.isArray(membersRes.data)) {
          setMembers(membersRes.data);
        } else if (membersRes.data && membersRes.data.results) {
          setMembers(membersRes.data.results);
        } else {
          setMembers([]);
        }
        
        // Setze Samen
        if (Array.isArray(seedsRes.data)) {
          setSeeds(seedsRes.data.filter(seed => seed.remaining_seeds > 0));
        } else if (seedsRes.data && seedsRes.data.results) {
          setSeeds(seedsRes.data.results.filter(seed => seed.remaining_seeds > 0));
        } else {
          setSeeds([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
      }
    };
    
    fetchData();
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
    
    // Wenn seed_source geändert wird, den strain_name automatisch setzen
    if (name === 'seed_source' && !initialData) {
      const selectedSeed = seeds.find(seed => seed.uuid === value);
      if (selectedSeed) {
        setFormData(prev => ({
          ...prev,
          seed_source: value,
          strain_name: selectedSeed.strain_name
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.seed_source) newErrors.seed_source = 'Samen-Quelle ist erforderlich';
    if (!formData.planting_date) newErrors.planting_date = 'Pflanztermin ist erforderlich';
    if (!formData.location) newErrors.location = 'Standort ist erforderlich';
    if (!formData.strain_name) newErrors.strain_name = 'Sortenname ist erforderlich';
    if (!formData.status) newErrors.status = 'Status ist erforderlich';
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Validate date format (YYYY-MM-DD)
    if (formData.planting_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.planting_date)) {
      newErrors.planting_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
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
        {/* Samendaten */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!errors.seed_source}
            disabled={!!initialData} // Nur bei neuer Pflanze änderbar
          >
            <InputLabel>Samen-Quelle</InputLabel>
            <Select
              name="seed_source"
              value={formData.seed_source}
              onChange={handleChange}
              label="Samen-Quelle"
            >
              {seeds.length > 0 ? (
                seeds.map((seed) => (
                  <MenuItem key={seed.uuid} value={seed.uuid}>
                    {`${seed.strain_name} (${seed.batch_number}) - ${seed.remaining_seeds} verfügbar`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Keine Samen verfügbar</MenuItem>
              )}
            </Select>
            {errors.seed_source && (
              <FormHelperText>{errors.seed_source}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Pflanzendaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Pflanztermin (YYYY-MM-DD)"
            name="planting_date"
            value={formData.planting_date}
            onChange={handleChange}
            error={!!errors.planting_date}
            helperText={errors.planting_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Standort"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={!!errors.location}
            helperText={errors.location}
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
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!errors.status}
          >
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="vegetative">Vegetativ</MenuItem>
              <MenuItem value="flowering">Blühend</MenuItem>
              <MenuItem value="harvested">Geerntet</MenuItem>
              <MenuItem value="retired">Ausgemustert</MenuItem>
            </Select>
            {errors.status && (
              <FormHelperText>{errors.status}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nährstoffplan"
            name="nutrition_plan"
            value={formData.nutrition_plan}
            onChange={handleChange}
            multiline
            rows={3}
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
              {Array.isArray(members) && members.length > 0 ? (
                members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {`${member.first_name} ${member.last_name}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Keine Mitglieder verfügbar</MenuItem>
              )}
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

export default MotherPlantForm;