// frontend/src/apps/trackandtrace/pages/FloweringPlant/FloweringPlantForm.jsx
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
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../../../utils/api';

const FloweringPlantForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sourceType, setSourceType] = useState('seed'); // 'seed' oder 'cutting'
  const [formData, setFormData] = useState({
    genetic_name: '',
    seed_source: '',
    cutting_source: '',
    planting_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    plant_count: 1,
    growth_phase: 'vegetative',
    growth_medium: '',
    fertilizer: '',
    light_cycle: '12/12',
    expected_harvest_date: '',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Samen, Stecklinge und Räume laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mitglieder laden
        const membersResponse = await api.get('/members/');
        if (membersResponse.data && Array.isArray(membersResponse.data)) {
          setMembers(membersResponse.data);
        } else if (membersResponse.data && membersResponse.data.results && Array.isArray(membersResponse.data.results)) {
          setMembers(membersResponse.data.results);
        } else {
          console.error('Unerwartetes Datenformat für Mitglieder:', membersResponse.data);
          setMembers([]);
        }
        
        // Aktive Samen mit verfügbaren Restmengen laden
        const seedsResponse = await api.get('/trackandtrace/seeds/');  // Ohne Parameter werden aktive angezeigt
        if (seedsResponse.data && Array.isArray(seedsResponse.data)) {
          setSeeds(seedsResponse.data.filter(seed => seed.remaining_seeds > 0));
        } else if (seedsResponse.data && seedsResponse.data.results && Array.isArray(seedsResponse.data.results)) {
          setSeeds(seedsResponse.data.results.filter(seed => seed.remaining_seeds > 0));
        } else {
          console.error('Unerwartetes Datenformat für Samen:', seedsResponse.data);
          setSeeds([]);
        }
        
        try {
          console.log("Stecklinge laden...");
          // Einfach nur aktive Stecklinge ohne Parameter laden
          const cuttingsResponse = await api.get('/trackandtrace/cuttings/');
          console.log('Cuttings API response:', cuttingsResponse.data);
          
          if (cuttingsResponse.data && Array.isArray(cuttingsResponse.data)) {
            setCuttings(cuttingsResponse.data.filter(cutting => cutting.remaining_cuttings > 0));
          } else if (cuttingsResponse.data && cuttingsResponse.data.results && Array.isArray(cuttingsResponse.data.results)) {
            setCuttings(cuttingsResponse.data.results.filter(cutting => cutting.remaining_cuttings > 0));
          } else {
            console.error('Unerwartetes Datenformat für Stecklinge:', cuttingsResponse.data);
            setCuttings([]);
          }
        } catch (cuttingsErr) {
          console.error('Fehler beim Laden der Stecklinge:', cuttingsErr);
          console.error('Fehlerdetails:', cuttingsErr.response ? cuttingsErr.response.data : 'Keine Antwortdaten');
          setCuttings([]);
        }
        
        // Räume laden
        try {
          const roomsResponse = await api.get('/rooms/');
          console.log('Rooms API response:', roomsResponse.data);
          
          if (Array.isArray(roomsResponse.data)) {
            setRooms(roomsResponse.data);
          } else if (roomsResponse.data && Array.isArray(roomsResponse.data.results)) {
            setRooms(roomsResponse.data.results);
          } else {
            console.error('Unerwartetes Räume-Datenformat:', roomsResponse.data);
            setRooms([]);
          }
        } catch (roomErr) {
          console.error('Fehler beim Laden der Räume:', roomErr);
          setRooms([]); // Sicherstellen, dass rooms immer ein Array ist
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
      
      // SourceType basierend auf vorhandenen Daten setzen
      if (initialData.seed_source) {
        setSourceType('seed');
      } else if (initialData.cutting_source) {
        setSourceType('cutting');
      }
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Automatisches Setzen des Genetiknamens, wenn Quelle ausgewählt wird
    if (name === 'seed_source' && value) {
      const selectedSeed = seeds.find(seed => seed.uuid === value);
      if (selectedSeed) {
        setFormData(prev => ({
          ...prev,
          seed_source: value,
          cutting_source: '', // Andere Quelle leeren
          genetic_name: selectedSeed.strain_name // Genetikname vom Samen übernehmen
        }));
      }
    } else if (name === 'cutting_source' && value) {
      const selectedCutting = cuttings.find(cutting => cutting.uuid === value);
      if (selectedCutting) {
        setFormData(prev => ({
          ...prev,
          cutting_source: value,
          seed_source: '', // Andere Quelle leeren
          genetic_name: selectedCutting.genetic_name // Genetikname vom Steckling übernehmen
        }));
      }
    }
  };
  
  const handleSourceTypeChange = (e) => {
    const newSourceType = e.target.value;
    setSourceType(newSourceType);
    
    // Zurücksetzen der jeweils anderen Quelle
    if (newSourceType === 'seed') {
      setFormData(prev => ({
        ...prev,
        cutting_source: '',
        seed_source: prev.seed_source // Beibehalten des bisherigen Werts
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        seed_source: '',
        cutting_source: prev.cutting_source // Beibehalten des bisherigen Werts
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (sourceType === 'seed' && !formData.seed_source) newErrors.seed_source = 'Samenquelle ist erforderlich';
    if (sourceType === 'cutting' && !formData.cutting_source) newErrors.cutting_source = 'Stecklingsquelle ist erforderlich';
    if (!formData.planting_date) newErrors.planting_date = 'Pflanzungsdatum ist erforderlich';
    if (!formData.plant_count || formData.plant_count <= 0) {
      newErrors.plant_count = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Samen/Stecklinge verfügbar sind (nur bei neuem Eintrag)
    if (!initialData && sourceType === 'seed' && formData.seed_source && formData.plant_count) {
      const selectedSeed = seeds.find(seed => seed.uuid === formData.seed_source);
      if (selectedSeed && selectedSeed.remaining_seeds < formData.plant_count) {
        newErrors.plant_count = `Nicht genügend Samen verfügbar. Nur ${selectedSeed.remaining_seeds} übrig.`;
      }
    } else if (!initialData && sourceType === 'cutting' && formData.cutting_source && formData.plant_count) {
      const selectedCutting = cuttings.find(cutting => cutting.uuid === formData.cutting_source);
      if (selectedCutting && selectedCutting.remaining_cuttings < formData.plant_count) {
        newErrors.plant_count = `Nicht genügend Stecklinge verfügbar. Nur ${selectedCutting.remaining_cuttings} übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.planting_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.planting_date)) {
      newErrors.planting_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    if (formData.expected_harvest_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expected_harvest_date)) {
      newErrors.expected_harvest_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
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
        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormLabel component="legend">Herkunft wählen:</FormLabel>
            <RadioGroup row name="source_type" value={sourceType} onChange={handleSourceTypeChange}>
              <FormControlLabel value="seed" control={<Radio />} label="Aus Samen" />
              <FormControlLabel value="cutting" control={<Radio />} label="Aus Steckling" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        {sourceType === 'seed' && (
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
        )}
        
        {sourceType === 'cutting' && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.cutting_source}>
              <InputLabel>Stecklingsquelle</InputLabel>
              <Select
                name="cutting_source"
                value={formData.cutting_source}
                onChange={handleChange}
                label="Stecklingsquelle"
                disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
              >
                {cuttings.length > 0 ? 
                  cuttings.map((cutting) => (
                    <MenuItem key={cutting.uuid} value={cutting.uuid}>
                      {`${cutting.genetic_name} (${cutting.batch_number}, ${cutting.remaining_cuttings} Stecklinge übrig)`}
                    </MenuItem>
                  )) : 
                  <MenuItem disabled>Keine Stecklinge verfügbar</MenuItem>
                }
              </Select>
              {errors.cutting_source && <FormHelperText>{errors.cutting_source}</FormHelperText>}
            </FormControl>
          </Grid>
        )}
        
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
            label="Erwartetes Erntedatum (YYYY-MM-DD)"
            name="expected_harvest_date"
            value={formData.expected_harvest_date}
            onChange={handleChange}
            error={!!errors.expected_harvest_date}
            helperText={errors.expected_harvest_date || "Format: YYYY-MM-DD (optional)"}
            margin="normal"
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
              <MenuItem value="vegetative">Vegetative Phase</MenuItem>
              <MenuItem value="pre_flower">Vorblüte</MenuItem>
              <MenuItem value="flowering">Blütephase</MenuItem>
              <MenuItem value="late_flower">Spätblüte</MenuItem>
              <MenuItem value="harvest_ready">Erntereif</MenuItem>
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
            placeholder="z.B. 12/12, 11/13"
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

export default FloweringPlantForm;