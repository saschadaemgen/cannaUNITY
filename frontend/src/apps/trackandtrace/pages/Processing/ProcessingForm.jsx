// frontend/src/apps/trackandtrace/pages/Processing/ProcessingForm.jsx
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

const ProcessingForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [dryings, setDryings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    drying_source: '',
    processing_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    input_weight: '',
    processing_method: '',
    product_type: 'flower',
    flower_weight: '',
    trim_weight: '',
    waste_weight: '',
    potency_estimate: '',
    expected_lab_date: '',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Trocknungen und Räume laden
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
        
        // Aktive Trocknungen laden (nicht vernichtet, nicht vollständig übergeführt)
        const dryingsResponse = await api.get('/trackandtrace/dryings/');
        if (dryingsResponse.data && Array.isArray(dryingsResponse.data)) {
          // Nur Trocknungen mit abgeschlossener Trocknung (dried_weight vorhanden) und remaining_dried_weight > 0
          setDryings(
            dryingsResponse.data.filter(
              drying => drying.dried_weight && 
                        parseFloat(drying.remaining_dried_weight) > 0 &&
                        !drying.is_destroyed &&
                        drying.transfer_status !== 'fully_transferred'
            )
          );
        } else if (dryingsResponse.data && dryingsResponse.data.results && Array.isArray(dryingsResponse.data.results)) {
          setDryings(
            dryingsResponse.data.results.filter(
              drying => drying.dried_weight && 
                        parseFloat(drying.remaining_dried_weight) > 0 &&
                        !drying.is_destroyed &&
                        drying.transfer_status !== 'fully_transferred'
            )
          );
        } else {
          console.error('Unerwartetes Datenformat für Trocknungen:', dryingsResponse.data);
          setDryings([]);
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
    
    // Automatisches Setzen von Daten, wenn Trocknungsquelle ausgewählt wird
    if (name === 'drying_source' && value) {
      const selectedDrying = dryings.find(drying => drying.uuid === value);
      if (selectedDrying) {
        setFormData(prev => ({
          ...prev,
          drying_source: value,
          genetic_name: selectedDrying.genetic_name, // Name von der Trocknung übernehmen
          input_weight: selectedDrying.remaining_dried_weight // Max. verfügbares Gewicht übernehmen
        }));
      }
    }
    
    // Berechnung des Abfallgewichts, wenn Gewichtsdaten eingegeben werden
    if (['input_weight', 'flower_weight', 'trim_weight'].includes(name)) {
      const inputWeight = parseFloat(name === 'input_weight' ? value : formData.input_weight) || 0;
      const flowerWeight = parseFloat(name === 'flower_weight' ? value : formData.flower_weight) || 0;
      const trimWeight = parseFloat(name === 'trim_weight' ? value : formData.trim_weight) || 0;
      
      // Wenn beide Werte vorhanden sind, berechne das Abfallgewicht
      if (inputWeight > 0 && (flowerWeight > 0 || trimWeight > 0)) {
        const calculatedWaste = Math.max(0, inputWeight - flowerWeight - trimWeight);
        
        setFormData(prev => ({
          ...prev,
          waste_weight: calculatedWaste.toFixed(2)
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.drying_source) newErrors.drying_source = 'Trocknungsquelle ist erforderlich';
    if (!formData.processing_date) newErrors.processing_date = 'Verarbeitungsdatum ist erforderlich';
    if (!formData.product_type) newErrors.product_type = 'Produkttyp ist erforderlich';
    
    if (!formData.input_weight || parseFloat(formData.input_weight) <= 0) {
      newErrors.input_weight = 'Eingangsgewicht muss größer als 0 sein';
    }
    
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Material in der Trocknung verfügbar ist (nur bei neuem Eintrag)
    if (!initialData && formData.drying_source && formData.input_weight) {
      const selectedDrying = dryings.find(drying => drying.uuid === formData.drying_source);
      if (selectedDrying && parseFloat(selectedDrying.remaining_dried_weight) < parseFloat(formData.input_weight)) {
        newErrors.input_weight = `Nicht genügend Material verfügbar. Nur ${selectedDrying.remaining_dried_weight}g übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.processing_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.processing_date)) {
      newErrors.processing_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    if (formData.expected_lab_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expected_lab_date)) {
      newErrors.expected_lab_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    // Gewichtsvalidierung: Summe der Gewichte darf nicht größer als Input-Gewicht sein
    const inputWeight = parseFloat(formData.input_weight || '0');
    const flowerWeight = parseFloat(formData.flower_weight || '0');
    const trimWeight = parseFloat(formData.trim_weight || '0');
    const wasteWeight = parseFloat(formData.waste_weight || '0');
    
    if (flowerWeight + trimWeight + wasteWeight > inputWeight + 0.01) { // Kleine Toleranz für Rundungsfehler
      newErrors.flower_weight = 'Die Summe der Teilgewichte kann nicht größer als das Eingangsgewicht sein';
    }
    
    // Potenz-Validierung
    if (formData.potency_estimate && (parseFloat(formData.potency_estimate) < 0 || parseFloat(formData.potency_estimate) > 100)) {
      newErrors.potency_estimate = 'Potenz muss zwischen 0 und 100% liegen';
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
          <FormControl fullWidth margin="normal" error={!!errors.drying_source}>
            <InputLabel>Trocknungsquelle</InputLabel>
            <Select
              name="drying_source"
              value={formData.drying_source}
              onChange={handleChange}
              label="Trocknungsquelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {dryings.length > 0 ? 
                dryings.map((drying) => (
                  <MenuItem key={drying.uuid} value={drying.uuid}>
                    {`${drying.genetic_name} (${drying.batch_number}, ${drying.remaining_dried_weight}g verfügbar)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Trocknungen mit verfügbarem Material</MenuItem>
              }
            </Select>
            {errors.drying_source && <FormHelperText>{errors.drying_source}</FormHelperText>}
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
        
        {/* Verarbeitungsdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Verarbeitungsdatum (YYYY-MM-DD)"
            name="processing_date"
            value={formData.processing_date}
            onChange={handleChange}
            error={!!errors.processing_date}
            helperText={errors.processing_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.product_type}>
            <InputLabel>Produkttyp</InputLabel>
            <Select
              name="product_type"
              value={formData.product_type}
              onChange={handleChange}
              label="Produkttyp"
            >
              <MenuItem value="flower">Blüte</MenuItem>
              <MenuItem value="trim">Schnittreste</MenuItem>
              <MenuItem value="extract">Extrakt</MenuItem>
              <MenuItem value="mix">Mischung</MenuItem>
            </Select>
            {errors.product_type && <FormHelperText>{errors.product_type}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Verarbeitungsmethode"
            name="processing_method"
            value={formData.processing_method}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. Trimmen, Mahlen, Extraktion"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Erwartetes Labordatum (YYYY-MM-DD)"
            name="expected_lab_date"
            value={formData.expected_lab_date}
            onChange={handleChange}
            error={!!errors.expected_lab_date}
            helperText={errors.expected_lab_date || "Format: YYYY-MM-DD (optional)"}
            margin="normal"
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
            label="Eingangsgewicht (g)"
            name="input_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.input_weight}
            onChange={handleChange}
            error={!!errors.input_weight}
            helperText={errors.input_weight}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
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
            label="Schnittreste (g)"
            name="trim_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.trim_weight}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Abfallgewicht (g)"
            name="waste_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.waste_weight}
            onChange={handleChange}
            margin="normal"
            helperText="Wird automatisch berechnet, kann aber manuell angepasst werden"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Potenz-Schätzung (%)"
            name="potency_estimate"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            value={formData.potency_estimate}
            onChange={handleChange}
            error={!!errors.potency_estimate}
            helperText={errors.potency_estimate}
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

export default ProcessingForm;