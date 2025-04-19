// frontend/src/apps/trackandtrace/pages/LabTesting/LabTestingForm.jsx
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
  FormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import api from '../../../../utils/api';

const LabTestingForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [processings, setProcessings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    processing_source: '',
    sample_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    test_date: '',
    test_status: 'pending',
    sample_weight: '',
    lab_name: '',
    test_method: '',
    thc_content: '',
    cbd_content: '',
    moisture_content: '',
    contaminants_check: false,
    pesticides_check: false,
    microbes_check: false,
    heavy_metals_check: false,
    notes_from_lab: '',
    notes: '',
    is_approved: false,
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Verarbeitungen und Räume laden
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
        
        // Aktive Verarbeitungen laden
        const processingsResponse = await api.get('/trackandtrace/processings/');
        if (processingsResponse.data && Array.isArray(processingsResponse.data)) {
          // Nur Verarbeitungen mit remaining_weight > 0 anzeigen
          setProcessings(
            processingsResponse.data.filter(
              processing => parseFloat(processing.remaining_weight) > 0 &&
                          !processing.is_destroyed &&
                          processing.transfer_status !== 'fully_transferred'
            )
          );
        } else if (processingsResponse.data && processingsResponse.data.results && Array.isArray(processingsResponse.data.results)) {
          setProcessings(
            processingsResponse.data.results.filter(
              processing => parseFloat(processing.remaining_weight) > 0 &&
                          !processing.is_destroyed &&
                          processing.transfer_status !== 'fully_transferred'
            )
          );
        } else {
          console.error('Unerwartetes Datenformat für Verarbeitungen:', processingsResponse.data);
          setProcessings([]);
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
    const { name, value, type, checked } = e.target;
    
    // Für Checkboxen den checked-Wert verwenden, sonst den value-Wert
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Automatisches Setzen des Genetiknamens, wenn Verarbeitungsquelle ausgewählt wird
    if (name === 'processing_source' && value) {
      const selectedProcessing = processings.find(processing => processing.uuid === value);
      if (selectedProcessing) {
        setFormData(prev => ({
          ...prev,
          processing_source: value,
          genetic_name: selectedProcessing.genetic_name // Genetikname von der Verarbeitung übernehmen
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.processing_source) newErrors.processing_source = 'Verarbeitungsquelle ist erforderlich';
    if (!formData.sample_date) newErrors.sample_date = 'Probenahmedatum ist erforderlich';
    if (!formData.test_status) newErrors.test_status = 'Teststatus ist erforderlich';
    
    if (!formData.sample_weight || parseFloat(formData.sample_weight) <= 0) {
      newErrors.sample_weight = 'Probengewicht muss größer als 0 sein';
    }
    
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Material in der Verarbeitung verfügbar ist (nur bei neuem Eintrag)
    if (!initialData && formData.processing_source && formData.sample_weight) {
      const selectedProcessing = processings.find(processing => processing.uuid === formData.processing_source);
      if (selectedProcessing && parseFloat(selectedProcessing.remaining_weight) < parseFloat(formData.sample_weight)) {
        newErrors.sample_weight = `Nicht genügend Material verfügbar. Nur ${selectedProcessing.remaining_weight}g übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.sample_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.sample_date)) {
      newErrors.sample_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    if (formData.test_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.test_date)) {
      newErrors.test_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    // Validate content percentages
    if (formData.thc_content && (parseFloat(formData.thc_content) < 0 || parseFloat(formData.thc_content) > 100)) {
      newErrors.thc_content = 'THC-Gehalt muss zwischen 0 und 100% liegen';
    }
    
    if (formData.cbd_content && (parseFloat(formData.cbd_content) < 0 || parseFloat(formData.cbd_content) > 100)) {
      newErrors.cbd_content = 'CBD-Gehalt muss zwischen 0 und 100% liegen';
    }
    
    if (formData.moisture_content && (parseFloat(formData.moisture_content) < 0 || parseFloat(formData.moisture_content) > 100)) {
      newErrors.moisture_content = 'Feuchtigkeitsgehalt muss zwischen 0 und 100% liegen';
    }
    
    // Wenn Freigabe aktiviert ist, muss Teststatus 'completed' sein
    if (formData.is_approved && formData.test_status !== 'completed') {
      newErrors.is_approved = 'Der Test muss abgeschlossen sein, bevor er freigegeben werden kann';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Daten vorbereiten für API
    const submitData = { ...formData };
    
    // Wenn neuer Eintrag, dann remaining_weight = sample_weight (wird im Backend gesetzt)
    if (!initialData) {
      submitData.remaining_weight = submitData.sample_weight;
    }
    
    // Submit
    onSave(submitData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Stammdaten */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.processing_source}>
            <InputLabel>Verarbeitungsquelle</InputLabel>
            <Select
              name="processing_source"
              value={formData.processing_source}
              onChange={handleChange}
              label="Verarbeitungsquelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {processings.length > 0 ? 
                processings.map((processing) => (
                  <MenuItem key={processing.uuid} value={processing.uuid}>
                    {`${processing.genetic_name} (${processing.batch_number}, ${processing.remaining_weight}g verfügbar)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Verarbeitungen mit verfügbarem Material</MenuItem>
              }
            </Select>
            {errors.processing_source && <FormHelperText>{errors.processing_source}</FormHelperText>}
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
        
        {/* Testdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Probenahmedatum (YYYY-MM-DD)"
            name="sample_date"
            value={formData.sample_date}
            onChange={handleChange}
            error={!!errors.sample_date}
            helperText={errors.sample_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Testdatum (YYYY-MM-DD)"
            name="test_date"
            value={formData.test_date}
            onChange={handleChange}
            error={!!errors.test_date}
            helperText={errors.test_date || "Format: YYYY-MM-DD (leer lassen, wenn Test noch nicht durchgeführt)"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.test_status}>
            <InputLabel>Teststatus</InputLabel>
            <Select
              name="test_status"
              value={formData.test_status}
              onChange={handleChange}
              label="Teststatus"
            >
              <MenuItem value="pending">Ausstehend</MenuItem>
              <MenuItem value="in_progress">In Bearbeitung</MenuItem>
              <MenuItem value="completed">Abgeschlossen</MenuItem>
              <MenuItem value="failed">Nicht bestanden</MenuItem>
            </Select>
            {errors.test_status && <FormHelperText>{errors.test_status}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Probengewicht (g)"
            name="sample_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.sample_weight}
            onChange={handleChange}
            error={!!errors.sample_weight}
            helperText={errors.sample_weight}
            margin="normal"
            disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Laborname"
            name="lab_name"
            value={formData.lab_name}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Testmethode"
            name="test_method"
            value={formData.test_method}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        {/* Analyseergebnisse */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Analyseergebnisse
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="THC-Gehalt (%)"
            name="thc_content"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            value={formData.thc_content}
            onChange={handleChange}
            error={!!errors.thc_content}
            helperText={errors.thc_content}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="CBD-Gehalt (%)"
            name="cbd_content"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            value={formData.cbd_content}
            onChange={handleChange}
            error={!!errors.cbd_content}
            helperText={errors.cbd_content}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Feuchtigkeitsgehalt (%)"
            name="moisture_content"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            value={formData.moisture_content}
            onChange={handleChange}
            error={!!errors.moisture_content}
            helperText={errors.moisture_content}
            margin="normal"
          />
        </Grid>
        
        {/* Qualitätsprüfungen */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Qualitätsprüfungen
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.contaminants_check}
                  onChange={handleChange}
                  name="contaminants_check"
                />
              }
              label="Keine Verunreinigungen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.pesticides_check}
                  onChange={handleChange}
                  name="pesticides_check"
                />
              }
              label="Keine Pestizide"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.microbes_check}
                  onChange={handleChange}
                  name="microbes_check"
                />
              }
              label="Mikrobiologisch bestanden"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.heavy_metals_check}
                  onChange={handleChange}
                  name="heavy_metals_check"
                />
              }
              label="Keine Schwermetalle"
            />
          </FormGroup>
        </Grid>
        
        {/* Freigabe */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_approved}
                onChange={handleChange}
                name="is_approved"
              />
            }
            label="Produkt freigeben"
          />
          {errors.is_approved && (
            <FormHelperText error>{errors.is_approved}</FormHelperText>
          )}
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
            rows={3}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notizen vom Labor"
            name="notes_from_lab"
            value={formData.notes_from_lab}
            onChange={handleChange}
            multiline
            rows={3}
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

export default LabTestingForm;