// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionForm.jsx
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

const ProductDistributionForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [packagings, setPackagings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    genetic_name: '',
    packaging_source: '',
    distribution_date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    quantity: '',
    remaining_quantity: '',
    distribution_type: 'member',
    package_count: 1,
    price_per_unit: '',
    total_price: '',
    is_paid: false,
    payment_method: '',
    status: 'pending',
    is_confirmed: false,
    tracking_number: '',
    notes: '',
    responsible_member: '',
    receiving_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder, Verpackungen und Räume laden
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
        
        // Verfügbare Verpackungen laden
        const packagingsResponse = await api.get('/trackandtrace/packagings/?is_quality_checked=true&has_labels=true');
        if (packagingsResponse.data) {
          let availablePackagings = [];
          if (Array.isArray(packagingsResponse.data)) {
            availablePackagings = packagingsResponse.data;
          } else if (packagingsResponse.data && packagingsResponse.data.results && Array.isArray(packagingsResponse.data.results)) {
            availablePackagings = packagingsResponse.data.results;
          }
          
          // Filter für nicht vernichtete und mit verbleibender Menge
          const filteredPackagings = availablePackagings.filter(
            packaging => !packaging.is_destroyed && parseFloat(packaging.remaining_weight) > 0
          );
          
          setPackagings(filteredPackagings);
        } else {
          console.error('Unerwartetes Datenformat für Verpackungen:', packagingsResponse);
          setPackagings([]);
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
    
    // Automatisches Setzen von Daten, wenn Verpackungs-Quelle ausgewählt wird
    if (name === 'packaging_source' && value) {
      const selectedPackaging = packagings.find(packaging => packaging.uuid === value);
      if (selectedPackaging) {
        setFormData(prev => ({
          ...prev,
          packaging_source: value,
          genetic_name: selectedPackaging.genetic_name,
          quantity: selectedPackaging.remaining_weight,
          remaining_quantity: selectedPackaging.remaining_weight, // Anfangs gleich der Ausgabemenge
        }));
      }
    }
    
    // Automatische Berechnung des Gesamtpreises
    if ((name === 'price_per_unit' || name === 'quantity') && formData.price_per_unit && formData.quantity) {
      const pricePerUnit = name === 'price_per_unit' ? parseFloat(value) : parseFloat(formData.price_per_unit);
      const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity);
      
      if (!isNaN(pricePerUnit) && !isNaN(quantity)) {
        const totalPrice = (pricePerUnit * quantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          total_price: totalPrice
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.genetic_name) newErrors.genetic_name = 'Genetik ist erforderlich';
    if (!formData.packaging_source) newErrors.packaging_source = 'Verpackungsquelle ist erforderlich';
    if (!formData.distribution_date) newErrors.distribution_date = 'Ausgabedatum ist erforderlich';
    if (!formData.distribution_type) newErrors.distribution_type = 'Ausgabetyp ist erforderlich';
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Menge muss größer als 0 sein';
    }
    
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    if (!formData.receiving_member) newErrors.receiving_member = 'Empfänger ist erforderlich';
    
    // Überprüfen, ob genügend Material in der Verpackung verfügbar ist (nur bei neuem Eintrag)
    if (!initialData && formData.packaging_source && formData.quantity) {
      const selectedPackaging = packagings.find(packaging => packaging.uuid === formData.packaging_source);
      if (selectedPackaging && parseFloat(selectedPackaging.remaining_weight) < parseFloat(formData.quantity)) {
        newErrors.quantity = `Nicht genügend Material verfügbar. Nur ${selectedPackaging.remaining_weight}g übrig.`;
      }
    }
    
    // Validate date format (YYYY-MM-DD)
    if (formData.distribution_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.distribution_date)) {
      newErrors.distribution_date = 'Bitte Datum im Format YYYY-MM-DD eingeben';
    }
    
    // Preisvalidierung (optional)
    if (formData.price_per_unit && parseFloat(formData.price_per_unit) < 0) {
      newErrors.price_per_unit = 'Preis pro Einheit kann nicht negativ sein';
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
          <FormControl fullWidth margin="normal" error={!!errors.packaging_source}>
            <InputLabel>Verpackungsquelle</InputLabel>
            <Select
              name="packaging_source"
              value={formData.packaging_source}
              onChange={handleChange}
              label="Verpackungsquelle"
              disabled={!!initialData} // Nur bei neuem Eintrag bearbeitbar
            >
              {packagings.length > 0 ? 
                packagings.map((packaging) => (
                  <MenuItem key={packaging.uuid} value={packaging.uuid}>
                    {`${packaging.genetic_name} (${packaging.batch_number}, ${packaging.remaining_weight}g verfügbar)`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine verpackten Produkte verfügbar</MenuItem>
              }
            </Select>
            {errors.packaging_source && <FormHelperText>{errors.packaging_source}</FormHelperText>}
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
        
        {/* Ausgabedaten */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Ausgabedatum (YYYY-MM-DD)"
            name="distribution_date"
            value={formData.distribution_date}
            onChange={handleChange}
            error={!!errors.distribution_date}
            helperText={errors.distribution_date || "Format: YYYY-MM-DD"}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.distribution_type}>
            <InputLabel>Ausgabetyp</InputLabel>
            <Select
              name="distribution_type"
              value={formData.distribution_type}
              onChange={handleChange}
              label="Ausgabetyp"
            >
              <MenuItem value="member">Mitgliedsausgabe</MenuItem>
              <MenuItem value="return">Rückgabe</MenuItem>
              <MenuItem value="donation">Spende</MenuItem>
              <MenuItem value="disposal">Entsorgung</MenuItem>
              <MenuItem value="other">Sonstiges</MenuItem>
            </Select>
            {errors.distribution_type && <FormHelperText>{errors.distribution_type}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Referenznummer"
            name="tracking_number"
            value={formData.tracking_number}
            onChange={handleChange}
            margin="normal"
          />
        </Grid>
        
        {/* Gewichts- und Preisdaten */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Produkt- und Preisdaten
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Menge (g)"
            name="quantity"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.quantity}
            onChange={handleChange}
            error={!!errors.quantity}
            helperText={errors.quantity}
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
            label="Preis pro Einheit (€)"
            name="price_per_unit"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.price_per_unit}
            onChange={handleChange}
            error={!!errors.price_per_unit}
            helperText={errors.price_per_unit}
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gesamtpreis (€)"
            name="total_price"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.total_price}
            onChange={handleChange}
            margin="normal"
            helperText="Wird automatisch berechnet, kann aber manuell angepasst werden"
          />
        </Grid>
        
        {/* Zahlungs- und Statusdaten */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Zahlungs- und Statusdaten
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_paid}
                onChange={handleChange}
                name="is_paid"
                color="success"
              />
            }
            label="Bezahlung erhalten"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Zahlungsmethode"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            margin="normal"
            disabled={!formData.is_paid}
            placeholder="z.B. Bar, Überweisung, Gutschrift"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="pending">Ausstehend</MenuItem>
              <MenuItem value="in_progress">In Bearbeitung</MenuItem>
              <MenuItem value="completed">Abgeschlossen</MenuItem>
              <MenuItem value="cancelled">Storniert</MenuItem>
              <MenuItem value="returned">Zurückgegeben</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_confirmed}
                onChange={handleChange}
                name="is_confirmed"
                color="success"
              />
            }
            label="Empfang bestätigt"
          />
        </Grid>
        
        {/* Personen- und Raumdaten */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Verantwortliche Personen
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
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
        
        <Grid item xs={12} sm={6}>
          <FormControl 
            fullWidth 
            margin="normal"
            error={!!errors.receiving_member}
          >
            <InputLabel>Empfänger</InputLabel>
            <Select
              name="receiving_member"
              value={formData.receiving_member}
              onChange={handleChange}
              label="Empfänger"
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
            {errors.receiving_member && (
              <FormHelperText>{errors.receiving_member}</FormHelperText>
            )}
          </FormControl>
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

export default ProductDistributionForm;