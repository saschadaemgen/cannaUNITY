// frontend/src/apps/trackandtrace/pages/Packaging/PackagingForm.jsx
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
  Switch
} from '@mui/material';
import api from '../../../../utils/api';

const PackagingForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [labTestings, setLabTestings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    lab_testing_source: '',
    packaging_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    input_weight: '',
    remaining_weight: '',
    packaging_type: 'single',
    product_type: 'flower',
    package_count: 1,
    unit_weight: '',
    packaging_material: '',
    is_quality_checked: false,
    quality_check_notes: '',
    has_labels: false,
    label_details: '',
    shelf_life: '',
    storage_conditions: '',
    expiry_date: '',
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Labor-Tests und Räume laden
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
        
        // Freigegebene Labortests laden
        const labTestingsResponse = await api.get('/trackandtrace/labtestings/?is_approved=true');
        if (labTestingsResponse.data) {
          let availableLabTestings = [];
          if (Array.isArray(labTestingsResponse.data)) {
            availableLabTestings = labTestingsResponse.data;
          } else if (labTestingsResponse.data && labTestingsResponse.data.results && Array.isArray(labTestingsResponse.data.results)) {
            availableLabTestings = labTestingsResponse.data.results;
          }
          
          // Filter für nicht vernichtete und mit verbleibender Menge
          const filteredLabTestings = availableLabTestings.filter(
            labTesting => !labTesting.is_destroyed && parseFloat(labTesting.remaining_weight) > 0
          );
          
          setLabTestings(filteredLabTestings);
        } else {
          console.error('Unerwartetes Datenformat für Laborkontrollen:', labTestingsResponse);
          setLabTestings([]);
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
    
    // Automatisches Setzen von Daten, wenn Labortest-Quelle ausgewählt wird
    if (name === 'lab_testing_source' && value) {
      const selectedLabTesting = labTestings.find(labTesting => labTesting.uuid === value);
      if (selectedLabTesting) {
        setFormData(prev => ({
          ...prev,
          lab_testing_source: value,
          genetic_name: selectedLabTesting.genetic_name,
          input_weight: selectedLabTesting.remaining_weight,
          remaining_weight: selectedLabTesting.remaining_weight, // Anfangs gleich dem Eingangsgewicht
          product_type: selectedLabTesting.processing_source_details?.product_type || 'flower'
        }));
      }
    }
    
    // Automatische Berechnung des Einheitsgewichts, wenn Paketanzahl und Eingangsgewicht vorhanden sind
    if ((name === 'package_count' || name === 'input_weight') && formData.package_count > 0 && formData.input_weight) {
      const packageCount = name === 'package_count' ? parseInt(value) : parseInt(formData.package_count);
      const inputWeight = name === 'input_weight' ? parseFloat(value) : parseFloat(formData.input_weight);
      
      if (!isNaN(packageCount) && !isNaN(inputWeight) && packageCount > 0) {
        const unitWeight = (inputWeight / packageCount).toFixed(2);
        setFormData(prev => ({
          ...prev,
          unit_weight: unitWeight
        }));
      }
    }
    
    // Automatische Berechnung des Ablaufdatums, wenn Haltbarkeit angegeben wird
    if (name === 'shelf_life' && value && formData.packaging_date) {
      const shelfLifeDays = parseInt(value);
      if (!isNaN(shelfLifeDays) && shelfLifeDays > 0) {
        const packagingDate = new Date(formData.packaging_date);
        const expiryDate = new Date(packagingDate);
        expiryDate.setDate(packagingDate.getDate() + shelfLifeDays);
        
        setFormData(prev => ({
          ...prev,
          expiry_date: expiryDate.toISOString().split('T')[0]
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.lab_testing_source) newErrors.lab_testing_source = 'Labortest-Quelle ist erforderlich';
    if (!formData.packaging_date) newErrors.packaging_date = 'Verpackungsdatum ist erforderlich';
    if (!formData.packaging_type) newErrors.packaging_type = 'Verpackungstyp ist erforderlich';
    if (!formData.product_type) newErrors.product_type = 'Produkttyp ist erforderlich';
    
    if (!formData.input_weight || parseFloat(formData.input_weight) <= 0) {
      newErrors.input_weight = 'Eingangsgewicht muss größer als 0 sein';
    }
    
    if (!formData.package_count || parseInt(formData.package_count) <= 0) {
      newErrors.package_count = 'Paketanzahl muss mindestens 1 sein';
    }
    
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
    // Überprüfen, ob genügend Material im Labortest verfügbar ist (nur bei neuem Eintrag)
    if (!initialData && formData.lab_testing_source && formData.input_weight) {
      const selectedLabTesting = labTestings.find(labTesting => labTesting.uuid === formData.lab_testing_source);
      if (selectedLabTesting && parseFloat(selectedLabTesting.remaining_weight) < parseFloat(formData.input_weight)) {
        newErrors.input_weight = `Nicht genügend Material verfügbar. Nur ${selectedLabTesting.remaining_weight}g übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.packaging_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.packaging_date)) {
      newErrors.packaging_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    if (formData.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expiry_date)) {
      newErrors.expiry_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
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
          <FormControl fullWidth margin="normal" error={!!errors.lab_testing_source}>
            <InputLabel>Labortest-Quelle</InputLabel>
            <Select
              name="lab_testing_source"
              value={formData.lab_testing_source}
              onChange={handleChange}
              label="Labortest-Quelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {labTestings.length > 0 ? 
                labTestings.map((labTesting) => (
                  <MenuItem key={labTesting.uuid} value={labTesting.uuid}>
                    {`${labTesting.genetic_name} (${labTesting.batch_number}, ${labTesting.remaining_weight}g verfügbar)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine freigegebenen Laborkontrollen verfügbar</MenuItem>
              }
            </Select>
            {errors.lab_testing_source && <FormHelperText>{errors.lab_testing_source}</FormHelperText>}
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
        
        {/* Verpackungsdaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Verpackungsdatum (YYYY-MM-DD)"
            name="packaging_date"
            value={formData.packaging_date}
            onChange={handleChange}
            error={!!errors.packaging_date}
            helperText={errors.packaging_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.packaging_type}>
            <InputLabel>Verpackungstyp</InputLabel>
            <Select
              name="packaging_type"
              value={formData.packaging_type}
              onChange={handleChange}
              label="Verpackungstyp"
            >
              <MenuItem value="bulk">Großgebinde</MenuItem>
              <MenuItem value="single">Einzelverpackung</MenuItem>
              <MenuItem value="mixed">Mischverpackung</MenuItem>
            </Select>
            {errors.packaging_type && <FormHelperText>{errors.packaging_type}</FormHelperText>}
          </FormControl>
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
              <MenuItem value="extract">Extrakt</MenuItem>
              <MenuItem value="oil">Öl</MenuItem>
              <MenuItem value="edible">Essbar</MenuItem>
              <MenuItem value="other">Sonstiges</MenuItem>
            </Select>
            {errors.product_type && <FormHelperText>{errors.product_type}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Verpackungsmaterial"
            name="packaging_material"
            value={formData.packaging_material}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. Glas, Kunststoff, Papier"
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
            label="Paketanzahl"
            name="package_count"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={formData.package_count}
            onChange={handleChange}
            error={!!errors.package_count}
            helperText={errors.package_count}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gewicht pro Einheit (g)"
            name="unit_weight"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.unit_weight}
            onChange={handleChange}
            margin="normal"
            helperText="Wird automatisch berechnet, kann aber manuell angepasst werden"
          />
        </Grid>
        
        {/* Qualitätssicherung */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Qualitätssicherung
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_quality_checked}
                onChange={handleChange}
                name="is_quality_checked"
                color="success"
              />
            }
            label="Qualitätskontrolle durchgeführt"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notizen zur Qualitätskontrolle"
            name="quality_check_notes"
            value={formData.quality_check_notes}
            onChange={handleChange}
            multiline
            rows={2}
            margin="normal"
            disabled={!formData.is_quality_checked}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.has_labels}
                onChange={handleChange}
                name="has_labels"
                color="success"
              />
            }
            label="Produkt etikettiert"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Etikettdetails"
            name="label_details"
            value={formData.label_details}
            onChange={handleChange}
            multiline
            rows={2}
            margin="normal"
            disabled={!formData.has_labels}
          />
        </Grid>
        
        {/* Haltbarkeit */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Haltbarkeitsdaten
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Haltbarkeit (in Tagen)"
            name="shelf_life"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={formData.shelf_life}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Ablaufdatum (YYYY-MM-DD)"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            error={!!errors.expiry_date}
            helperText={errors.expiry_date || "Format: YYYY-MM-DD (wird automatisch berechnet)"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Lagerbedingungen"
            name="storage_conditions"
            value={formData.storage_conditions}
            onChange={handleChange}
            margin="normal"
            placeholder="z.B. Kühl und trocken lagern, vor Licht schützen"
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

export default PackagingForm;