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
  Box,
  Typography
} from '@mui/material';
import api from '../../../../utils/api';

const MotherPlantForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    seed_source: '',
    planting_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    plant_count: 1,
    growth_phase: 'seedling',
    growth_medium: '',
    fertilizer: '',
    light_cycle: '18/6',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder und Räume separat laden
  useEffect(() => {
    // Mitglieder laden
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members/');
        console.log('Mitglieder-Antwort:', response.data);
        
        if (Array.isArray(response.data)) {
          setMembers(response.data);
        } else if (response.data && Array.isArray(response.data.results)) {
          setMembers(response.data.results);
        } else {
          console.error('Unerwartetes Datenformat für Mitglieder:', response.data);
          setMembers([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Mitglieder:', err);
        setMembers([]);
      }
    };

  // Räume laden mit zusätzlichem Debugging
  const fetchRooms = async () => {
    console.log('Starte Räume-Anfrage...');
    try {
      // Verschiedene mögliche API-Pfade für Räume testen
      let response;
      try {
        response = await api.get('/rooms/');
        console.log('Erster Versuch (/rooms/):', response);
      } catch (err) {
        console.log('Erster Pfad fehlgeschlagen, versuche /api/rooms/');
        response = await api.get('/api/rooms/');
        console.log('Zweiter Versuch (/api/rooms/):', response);
      }

      console.log('Vollständige Raum-Antwort:', response);
      
      // Detaillierte Prüfung der Datenstruktur
      console.log('Datentyp:', typeof response.data);
      console.log('Ist Array?', Array.isArray(response.data));
      console.log('Datenstruktur:', JSON.stringify(response.data, null, 2).slice(0, 500));
      
      if (Array.isArray(response.data)) {
        console.log('Setze Räume aus Array:', response.data.length, 'Elemente');
        setRooms(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        console.log('Setze Räume aus results-Array:', response.data.results.length, 'Elemente');
        setRooms(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat für Räume:', response.data);
        setRooms([]);
      }
      
      // Prüfe, ob Räume-State korrekt gesetzt wurde
      setTimeout(() => {
        console.log('Räume-State nach Setzen:', rooms);
      }, 0);
    } catch (err) {
      console.error('Fehler beim Laden der Räume:', err);
      console.error('Fehlerdetails:', err.response ? err.response.data : 'Keine Antwortdaten');
      console.error('Status:', err.response ? err.response.status : 'Kein Status');
      setRooms([]);
    }
  };

    // Samen laden (wenn benötigt)
    const fetchSeeds = async () => {
      try {
        const response = await api.get('/trackandtrace/seeds/?destroyed=false');
        console.log('Samen-Antwort:', response.data);
        
        if (Array.isArray(response.data)) {
          setSeeds(response.data.filter(seed => seed.remaining_seeds > 0));
        } else if (response.data && Array.isArray(response.data.results)) {
          setSeeds(response.data.results.filter(seed => seed.remaining_seeds > 0));
        } else {
          console.error('Unerwartetes Datenformat für Samen:', response.data);
          setSeeds([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Samen:', err);
        setSeeds([]);
      }
    };

    // Alle Funktionen ausführen
    fetchMembers();
    fetchRooms();
    fetchSeeds();
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
    
    // Automatisches Setzen des Genetiknamens, wenn Samen ausgewählt wird
    if (name === 'seed_source' && value) {
      const selectedSeed = seeds.find(seed => seed.uuid === value);
      if (selectedSeed) {
        setFormData(prev => ({
          ...prev,
          seed_source: value,
          genetic_name: selectedSeed.strain_name // Genetikname vom Samen übernehmen
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.seed_source) newErrors.seed_source = 'Samenquelle ist erforderlich';
    if (!formData.planting_date) newErrors.planting_date = 'Pflanzungsdatum ist erforderlich';
    if (!formData.plant_count || formData.plant_count <= 0) {
      newErrors.plant_count = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Samen verfügbar sind (nur bei neuem Eintrag)
    if (!initialData && formData.seed_source && formData.plant_count) {
      const selectedSeed = seeds.find(seed => seed.uuid === formData.seed_source);
      if (selectedSeed && selectedSeed.remaining_seeds < formData.plant_count) {
        newErrors.plant_count = `Nicht genügend Samen verfügbar. Nur ${selectedSeed.remaining_seeds} übrig.`;
      }
    }
    
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
        {/* Stammdaten */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.seed_source}>
            <InputLabel>Samenquelle</InputLabel>
            <Select
              name="seed_source"
              value={formData.seed_source}
              onChange={handleChange}
              label="Samenquelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {seeds.length > 0 ? 
                seeds.map((seed) => (
                  <MenuItem key={seed.uuid} value={seed.uuid}>
                    {`${seed.strain_name} (${seed.batch_number}, ${seed.remaining_seeds} Samen übrig)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Samen verfügbar</MenuItem>
              }
            </Select>
            {errors.seed_source && <FormHelperText>{errors.seed_source}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Genetische Bezeichnung"
            name="genetic_name"
            value={formData.genetic_name}
            onChange={handleChange}
            error={!!errors.genetic_name}
            helperText={errors.genetic_name}
            margin="normal"
          />
        </Grid>
        
        {/* Pflanzendaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Pflanzungsdatum (YYYY-MM-DD)"
            name="planting_date"
            value={formData.planting_date}
            onChange={handleChange}
            error={!!errors.planting_date}
            helperText={errors.planting_date || "Format: YYYY-MM-DD"}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Anzahl Pflanzen"
            name="plant_count"
            type="number"
            inputProps={{ min: 1 }}
            value={formData.plant_count}
            onChange={handleChange}
            error={!!errors.plant_count}
            helperText={errors.plant_count}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Wachstumsphase</InputLabel>
            <Select
              name="growth_phase"
              value={formData.growth_phase}
              onChange={handleChange}
              label="Wachstumsphase"
            >
              <MenuItem value="seedling">Keimling</MenuItem>
              <MenuItem value="vegetative">Vegetative Phase</MenuItem>
              <MenuItem value="mother">Mutterpflanze</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Wachstumsmedium"
            name="growth_medium"
            value={formData.growth_medium}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. Erde, Kokos, Hydrokultur"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Dünger"
            name="fertilizer"
            value={formData.fertilizer}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Lichtzyklus"
            name="light_cycle"
            value={formData.light_cycle}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. 18/6, 24/0"
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
        
        {/* Raumauswahl */}
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Raum</InputLabel>
            <Select
              name="room"
              value={formData.room || ''}
              onChange={handleChange}
              label="Raum"
            >
              <MenuItem value="">Keinen Raum zuweisen</MenuItem>
              {Array.isArray(rooms) && rooms.length > 0 ? 
                rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Räume verfügbar</MenuItem>
              }
            </Select>
            <FormHelperText>Raum für diesen Prozessschritt (optional)</FormHelperText>
          </FormControl>
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

export default MotherPlantForm;