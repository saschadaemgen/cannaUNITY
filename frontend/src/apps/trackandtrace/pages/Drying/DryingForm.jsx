// frontend/src/apps/trackandtrace/pages/Drying/DryingForm.jsx
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
  Divider,
  Alert
} from '@mui/material';
import api from '../../../../utils/api';

const DryingForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    harvest_source: '',
    drying_start_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    drying_end_date: '',
    fresh_weight: '',
    dried_weight: '',
    drying_method: '',
    target_humidity: '',
    target_temperature: '',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCompletingDrying, setIsCompletingDrying] = useState(false);
  
  // Mitglieder, Ernten und Räume laden
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
        
        // Aktive Ernten laden (nicht vernichtet, nicht komplett überführt)
        const harvestResponse = await api.get('/trackandtrace/harvests/');
        if (harvestResponse.data && Array.isArray(harvestResponse.data)) {
          // Nur Ernten mit remaining_fresh_weight > 0 anzeigen
          setHarvests(
            harvestResponse.data.filter(
              harvest => parseFloat(harvest.remaining_fresh_weight) > 0 &&
                      !harvest.is_destroyed &&
                      !harvest.is_transferred
            )
          );
        } else if (harvestResponse.data && harvestResponse.data.results && Array.isArray(harvestResponse.data.results)) {
          setHarvests(
            harvestResponse.data.results.filter(
              harvest => parseFloat(harvest.remaining_fresh_weight) > 0 &&
                      !harvest.is_destroyed &&
                      !harvest.is_transferred
            )
          );
        } else {
          console.error('Unerwartetes Datenformat für Ernten:', harvestResponse.data);
          setHarvests([]);
        }
        
        // Räume laden
        try {
          const roomsResponse = await api.get('/rooms/');
          
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
      // Prüfen, ob es sich um eine Trocknungsabschluss-Aktion handelt
      if (initialData.dried_weight === null && initialData.drying_end_date === null) {
        setIsCompletingDrying(true);
      }
      
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
    
    // Automatisches Setzen des Genetiknamens und Frischgewichts, wenn Erntequelle ausgewählt wird
    if (name === 'harvest_source' && value) {
      const selectedHarvest = harvests.find(harvest => harvest.uuid === value);
      if (selectedHarvest) {
        setFormData(prev => ({
          ...prev,
          harvest_source: value,
          genetic_name: selectedHarvest.genetic_name, // Genetikname von der Ernte übernehmen
          fresh_weight: selectedHarvest.remaining_fresh_weight // Frischgewicht von der Ernte übernehmen
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Wenn Trocknungsabschluss, nur das Trockengewicht validieren
    if (isCompletingDrying) {
      if (!formData.dried_weight || parseFloat(formData.dried_weight) <= 0) {
        newErrors.dried_weight = 'Trockengewicht muss größer als 0 sein';
      }
      
      // Trockengewicht darf nicht größer als Frischgewicht sein
      if (formData.dried_weight && formData.fresh_weight) {
        const driedWeight = parseFloat(formData.dried_weight);
        const freshWeight = parseFloat(formData.fresh_weight);
        
        if (driedWeight > freshWeight) {
          newErrors.dried_weight = `Trockengewicht (${driedWeight}g) kann nicht größer als Frischgewicht (${freshWeight}g) sein`;
        }
      }
    } else {
      // Normale Validierung für neue Trocknungseinträge
      if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
      if (!formData.harvest_source) newErrors.harvest_source = 'Erntequelle ist erforderlich';
      if (!formData.drying_start_date) newErrors.drying_start_date = 'Startdatum ist erforderlich';
      if (!formData.fresh_weight || parseFloat(formData.fresh_weight) <= 0) {
        newErrors.fresh_weight = 'Frischgewicht muss größer als 0 sein';
      }
      if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
      
      // Überprüfen, ob genügend Material in der Ernte verfügbar ist (nur bei neuem Eintrag)
      if (!initialData && formData.harvest_source && formData.fresh_weight) {
        const selectedHarvest = harvests.find(harvest => harvest.uuid === formData.harvest_source);
        if (selectedHarvest && parseFloat(selectedHarvest.remaining_fresh_weight) < parseFloat(formData.fresh_weight)) {
          newErrors.fresh_weight = `Nicht genügend Material verfügbar. Nur ${selectedHarvest.remaining_fresh_weight}g übrig.`;
        }
      }
      
      // Validate date format (YYYY-MM-DD)
      if (formData.drying_start_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.drying_start_date)) {
        newErrors.drying_start_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
      }
      
      if (formData.drying_end_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.drying_end_date)) {
        newErrors.drying_end_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
      }
      
      // Wenn Endedatum vorhanden, dann muss auch Trockengewicht vorhanden sein
      if (formData.drying_end_date && !formData.dried_weight) {
        newErrors.dried_weight = 'Bei Angabe eines Enddatums muss auch ein Trockengewicht angegeben werden';
      }
      
      // Wenn Trockengewicht vorhanden, dann muss es kleiner als Frischgewicht sein
      if (formData.dried_weight && formData.fresh_weight) {
        const driedWeight = parseFloat(formData.dried_weight);
        const freshWeight = parseFloat(formData.fresh_weight);
        
        if (driedWeight > freshWeight) {
          newErrors.dried_weight = `Trockengewicht (${driedWeight}g) kann nicht größer als Frischgewicht (${freshWeight}g) sein`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Daten vorbereiten für API
    const submitData = { ...formData };
    
    // Bei Trocknungsabschluss das aktuelle Datum als Enddatum setzen
    if (isCompletingDrying && submitData.dried_weight && !submitData.drying_end_date) {
      submitData.drying_end_date = new Date().toISOString().split('T')[0];
      // Remaining dried weight ist initial gleich dried weight
      submitData.remaining_dried_weight = submitData.dried_weight;
    }
    
    // Submit
    onSave(submitData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Information anzeigen, wenn es sich um einen Trocknungsabschluss handelt */}
        {isCompletingDrying && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sie schließen den Trocknungsprozess ab. Bitte geben Sie das endgültige Trockengewicht an.
            </Alert>
          </Grid>
        )}
        
        {/* Stammdaten - nur anzeigen, wenn es kein Trocknungsabschluss ist */}
        {!isCompletingDrying && (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!errors.harvest_source}>
                <InputLabel>Erntequelle</InputLabel>
                <Select
                  name="harvest_source"
                  value={formData.harvest_source}
                  onChange={handleChange}
                  label="Erntequelle"
                  disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
                >
                  {harvests.length > 0 ? 
                    harvests.map((harvest) => (
                      <MenuItem key={harvest.uuid} value={harvest.uuid}>
                        {`${harvest.genetic_name} (${harvest.batch_number}, ${harvest.remaining_fresh_weight}g übrig)`}
                      </MenuItem>
                    )) : 
                    <MenuItem disabled>Keine Ernten mit verbleibendem Material verfügbar</MenuItem>
                  }
                </Select>
                {errors.harvest_source && <FormHelperText>{errors.harvest_source}</FormHelperText>}
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
            
            {/* Trocknungsdaten */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trocknungsbeginn (YYYY-MM-DD)"
                name="drying_start_date"
                value={formData.drying_start_date}
                onChange={handleChange}
                error={!!errors.drying_start_date}
                helperText={errors.drying_start_date || "Format: YYYY-MM-DD"}
                margin="normal"
                disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trocknungsmethode"
                name="drying_method"
                value={formData.drying_method}
                onChange={handleChange}
                margin="normal"
                placeholder="z.B. Raumtrocknung, Schrank"
              />
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
                disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ziel-Luftfeuchtigkeit (%)"
                name="target_humidity"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                value={formData.target_humidity}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ziel-Temperatur (°C)"
                name="target_temperature"
                type="number"
                inputProps={{ step: 0.1 }}
                value={formData.target_temperature}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </>
        )}
        
        {/* Trockengewicht - immer anzeigen (bei normaler Erstellung optional, bei Trocknungsabschluss Pflichtfeld) */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Trockengewicht (g)"
            name="dried_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.dried_weight || ''}
            onChange={handleChange}
            error={!!errors.dried_weight}
            helperText={errors.dried_weight || (isCompletingDrying ? "Pflichtfeld" : "Optional, wird nach Abschluss der Trocknung erfasst")}
            margin="normal"
            required={isCompletingDrying}
          />
        </Grid>
        
        {/* Trocknungsendedatum - nur bei normaler Formularerstellung, bei Trocknungsabschluss wird automatisch gesetzt */}
        {!isCompletingDrying && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Trocknungsende (YYYY-MM-DD)"
              name="drying_end_date"
              value={formData.drying_end_date || ''}
              onChange={handleChange}
              error={!!errors.drying_end_date}
              helperText={errors.drying_end_date || "Format: YYYY-MM-DD (optional)"}
              margin="normal"
            />
          </Grid>
        )}
        
        {/* Umgebungsdaten - nur bei normaler Formularerstellung, nicht bei Trocknungsabschluss */}
        {!isCompletingDrying && (
          <>
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
          </>
        )}
        
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
              {isCompletingDrying ? 'Trocknung abschließen' : (initialData ? 'Aktualisieren' : 'Erstellen')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default DryingForm;