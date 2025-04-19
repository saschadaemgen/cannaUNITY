// frontend/src/apps/trackandtrace/pages/Harvest/HarvestForm.jsx
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
  Divider
} from '@mui/material';
import api from '../../../../utils/api';

const HarvestForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [floweringPlants, setFloweringPlants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    flowering_plant_source: '',
    harvest_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    plant_count: 1,
    fresh_weight: '',
    flower_weight: '',
    leaf_weight: '',
    stem_weight: '',
    harvest_method: '',
    expected_drying_date: '',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Blühpflanzen und Räume laden
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
        
        // Aktive Blühpflanzen mit Status "erntereif" laden
        const floweringPlantsResponse = await api.get('/trackandtrace/floweringplants/');
        if (floweringPlantsResponse.data && Array.isArray(floweringPlantsResponse.data)) {
          // Nur erntereife Pflanzen mit remaining_plants > 0 anzeigen
          setFloweringPlants(
            floweringPlantsResponse.data.filter(
              plant => plant.growth_phase === 'harvest_ready' && 
                      plant.remaining_plants > 0 &&
                      !plant.is_destroyed &&
                      !plant.is_transferred
            )
          );
        } else if (floweringPlantsResponse.data && floweringPlantsResponse.data.results && Array.isArray(floweringPlantsResponse.data.results)) {
          setFloweringPlants(
            floweringPlantsResponse.data.results.filter(
              plant => plant.growth_phase === 'harvest_ready' && 
                      plant.remaining_plants > 0 &&
                      !plant.is_destroyed &&
                      !plant.is_transferred
            )
          );
        } else {
          console.error('Unerwartetes Datenformat für Blühpflanzen:', floweringPlantsResponse.data);
          setFloweringPlants([]);
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
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Automatisches Setzen des Genetiknamens, wenn Quelle ausgewählt wird
    if (name === 'flowering_plant_source' && value) {
      const selectedPlant = floweringPlants.find(plant => plant.uuid === value);
      if (selectedPlant) {
        setFormData(prev => ({
          ...prev,
          flowering_plant_source: value,
          genetic_name: selectedPlant.genetic_name // Genetikname von der Blühpflanze übernehmen
        }));
      }
    }
    
    // Wenn Frischgewicht gesetzt wird und die Gewichtsverteilung noch nicht gesetzt ist,
    // kann optional eine automatische Verteilung vorgeschlagen werden (z.B. 70% Blüten, 20% Blätter, 10% Stängel)
    if (name === 'fresh_weight' && value && 
        (!formData.flower_weight || !formData.leaf_weight || !formData.stem_weight)) {
      const freshWeight = parseFloat(value);
      if (!isNaN(freshWeight)) {
        setFormData(prev => ({
          ...prev,
          fresh_weight: value,
          flower_weight: prev.flower_weight || (freshWeight * 0.7).toFixed(2),
          leaf_weight: prev.leaf_weight || (freshWeight * 0.2).toFixed(2),
          stem_weight: prev.stem_weight || (freshWeight * 0.1).toFixed(2)
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.flowering_plant_source) newErrors.flowering_plant_source = 'Blühpflanzenquelle ist erforderlich';
    if (!formData.harvest_date) newErrors.harvest_date = 'Erntedatum ist erforderlich';
    if (!formData.plant_count || formData.plant_count <= 0) {
      newErrors.plant_count = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.fresh_weight || parseFloat(formData.fresh_weight) <= 0) {
      newErrors.fresh_weight = 'Frischgewicht muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Pflanzen verfügbar sind (nur bei neuem Eintrag)
    if (!initialData && formData.flowering_plant_source && formData.plant_count) {
      const selectedPlant = floweringPlants.find(plant => plant.uuid === formData.flowering_plant_source);
      if (selectedPlant && selectedPlant.remaining_plants < formData.plant_count) {
        newErrors.plant_count = `Nicht genügend Pflanzen verfügbar. Nur ${selectedPlant.remaining_plants} übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.harvest_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.harvest_date)) {
      newErrors.harvest_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    if (formData.expected_drying_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expected_drying_date)) {
      newErrors.expected_drying_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    // Gewichtsvalidierung
    const freshWeight = parseFloat(formData.fresh_weight || '0');
    const flowerWeight = parseFloat(formData.flower_weight || '0');
    const leafWeight = parseFloat(formData.leaf_weight || '0');
    const stemWeight = parseFloat(formData.stem_weight || '0');
    
    // Überprüfen, ob die Summe der Gewichte das Frischgewicht überschreitet
    if (flowerWeight + leafWeight + stemWeight > freshWeight) {
      newErrors.flower_weight = 'Die Summe der Teilgewichte kann nicht größer als das Frischgewicht sein';
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
          <FormControl fullWidth margin="normal" error={!!errors.flowering_plant_source}>
            <InputLabel>Blühpflanzenquelle</InputLabel>
            <Select
              name="flowering_plant_source"
              value={formData.flowering_plant_source}
              onChange={handleChange}
              label="Blühpflanzenquelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {floweringPlants.length > 0 ? 
                floweringPlants.map((plant) => (
                  <MenuItem key={plant.uuid} value={plant.uuid}>
                    {`${plant.genetic_name} (${plant.batch_number}, ${plant.remaining_plants} Pflanzen übrig)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine erntereifen Blühpflanzen verfügbar</MenuItem>
              }
            </Select>
            {errors.flowering_plant_source && <FormHelperText>{errors.flowering_plant_source}</FormHelperText>}
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
        
        {/* Erntedaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Erntedatum (YYYY-MM-DD)"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleChange}
            error={!!errors.harvest_date}
            helperText={errors.harvest_date || "Format: YYYY-MM-DD"}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Erwartetes Trocknungsdatum (YYYY-MM-DD)"
            name="expected_drying_date"
            value={formData.expected_drying_date}
            onChange={handleChange}
            error={!!errors.expected_drying_date}
            helperText={errors.expected_drying_date || "Format: YYYY-MM-DD (optional)"}
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
          <TextField
            fullWidth
            label="Erntemethode"
            name="harvest_method"
            value={formData.harvest_method}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. Handtrimm, Maschine"
          />
        </Grid>
        
        {/* Gewichtsdaten */}
        <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Gewichtsdaten (in Gramm)
        </Typography>
        <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} sm={6}>
        <TextField
            fullWidth
            label="Frischgewicht (g)"
            name="fresh_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.fresh_weight}
            onChange={handleChange}
            error={!!errors.fresh_weight}
            helperText={errors.fresh_weight}
            margin="normal"
        />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Blütengewicht (g)"
            name="flower_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.flower_weight}
            onChange={handleChange}
            error={!!errors.flower_weight}
            helperText={errors.flower_weight}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Blattgewicht (g)"
            name="leaf_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.leaf_weight}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Stängelgewicht (g)"
            name="stem_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.stem_weight}
            onChange={handleChange}
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

export default HarvestForm;