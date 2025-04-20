// frontend/src/apps/trackandtrace/pages/Cutting/CuttingForm.jsx
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
import CuttingCreationProgress from '../../components/CuttingCreationProgress';
import api from '../../../../utils/api';

const CuttingForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [motherPlants, setMotherPlants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isCreatingCuttings, setIsCreatingCuttings] = useState(false);
  const [formData, setFormData] = useState({
    genetic_name: '',
    mother_plant_source: '',
    cutting_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    cutting_count: 1,
    growth_phase: 'cutting',
    growth_medium: '',
    rooting_agent: '',
    light_cycle: '18/6',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Mutterpflanzen und Räume laden
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
        
        // Aktive Mutterpflanzen laden
        const motherPlantsResponse = await api.get('/trackandtrace/motherplants/?destroyed=false');
        if (motherPlantsResponse.data && Array.isArray(motherPlantsResponse.data)) {
          setMotherPlants(motherPlantsResponse.data);
        } else if (motherPlantsResponse.data && motherPlantsResponse.data.results && Array.isArray(motherPlantsResponse.data.results)) {
          setMotherPlants(motherPlantsResponse.data.results);
        } else {
          console.error('Unerwartetes Datenformat für Mutterpflanzen:', motherPlantsResponse.data);
          setMotherPlants([]);
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
    
    // Automatisches Setzen des Genetiknamens, wenn Mutterpflanze ausgewählt wird
    if (name === 'mother_plant_source' && value) {
      const selectedMotherPlant = motherPlants.find(mp => mp.uuid === value);
      if (selectedMotherPlant) {
        setFormData(prev => ({
          ...prev,
          mother_plant_source: value,
          genetic_name: selectedMotherPlant.genetic_name // Genetikname von der Mutterpflanze übernehmen
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.mother_plant_source) newErrors.mother_plant_source = 'Mutterpflanze ist erforderlich';
    if (!formData.cutting_date) newErrors.cutting_date = 'Schneidedatum ist erforderlich';
    if (!formData.cutting_count || formData.cutting_count <= 0) {
      newErrors.cutting_count = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Validate date format (YYYY-MM-DD)
    if (formData.cutting_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.cutting_date)) {
      newErrors.cutting_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Daten vorbereiten für API
    const submitData = { ...formData };
    
    // Wenn es keine Bearbeitung ist und die Anzahl der Stecklinge groß ist (>= 20),
    // den Ladeindikator anzeigen
    if (!initialData && submitData.cutting_count >= 20) {
      setIsCreatingCuttings(true);
      
      try {
        // Submit - mit kurzer Verzögerung, damit die Ladeanzeige sichtbar wird
        await new Promise(resolve => setTimeout(resolve, 100));
        await onSave(submitData);
        // Kurze Verzögerung, bevor wir die Fortschrittsanzeige schließen
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsCreatingCuttings(false);
      } catch (error) {
        setIsCreatingCuttings(false);
        // Fehlerbehandlung wird vom übergeordneten onSave Handler durchgeführt
        throw error;
      }
    } else {
      // Normaler Submit ohne Ladeanzeige
      onSave(submitData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Stammdaten */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.mother_plant_source}>
            <InputLabel>Mutterpflanze</InputLabel>
            <Select
              name="mother_plant_source"
              value={formData.mother_plant_source}
              onChange={handleChange}
              label="Mutterpflanze"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {motherPlants.length > 0 ? 
                motherPlants.map((motherPlant) => (
                  <MenuItem key={motherPlant.uuid} value={motherPlant.uuid}>
                    {`${motherPlant.genetic_name} (${motherPlant.batch_number})`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Mutterpflanzen verfügbar</MenuItem>
              }
            </Select>
            {errors.mother_plant_source && <FormHelperText>{errors.mother_plant_source}</FormHelperText>}
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
        
        {/* Stecklingsdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Schneidedatum (YYYY-MM-DD)"
            name="cutting_date"
            value={formData.cutting_date}
            onChange={handleChange}
            error={!!errors.cutting_date}
            helperText={errors.cutting_date || "Format: YYYY-MM-DD"}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Anzahl Stecklinge"
            name="cutting_count"
            type="number"
            inputProps={{ min: 1 }}
            value={formData.cutting_count}
            onChange={handleChange}
            error={!!errors.cutting_count}
            helperText={errors.cutting_count}
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
              <MenuItem value="cutting">Frischer Schnitt</MenuItem>
              <MenuItem value="rooting">Bewurzelung</MenuItem>
              <MenuItem value="vegetative">Vegetative Phase</MenuItem>
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
            placeholder="z.B. Erde, Kokos, Wasser"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Bewurzelungsmittel"
            name="rooting_agent"
            value={formData.rooting_agent}
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
      
      {/* Ladeindikator für Stecklings-Erstellung */}
      <CuttingCreationProgress 
        open={isCreatingCuttings} 
        totalCuttings={formData.cutting_count || 1000}
        onComplete={() => setIsCreatingCuttings(false)}
      />
    </form>
  );
};

export default CuttingForm;