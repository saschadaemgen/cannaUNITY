// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx
import React, { useState, useEffect } from 'react';
import SeedManufacturerDropdown from '../../components/SeedManufacturerDropdown';
import SeedStrainDropdown from '../../components/SeedStrainDropdown';
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
  Paper
} from '@mui/material';
// MUI Datepicker importieren
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/de'; // Deutsche Lokalisierung importieren
import api from '../../../../utils/api';

// Styled Components für besseres Layout
const FormSection = ({ title, children }) => (
  <Paper sx={{ 
    p: 3, 
    mb: 3, 
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  }}>
    <Typography 
      variant="h6" 
      sx={{ 
        mb: 2, 
        color: 'primary.main', 
        fontWeight: 500,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 1
      }}
    >
      {title}
    </Typography>
    {children}
  </Paper>
);

const SeedPurchaseForm = ({ initialData, onSave, onCancel }) => {
  const [members, setMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    manufacturer: '',
    strain: '',  // Neues Feld für die Sorte als FK
    genetics: '',
    strain_name: '',
    sativa_percentage: 50,
    indica_percentage: 50,
    thc_value: '',
    cbd_value: '',
    purchase_date: dayjs().format('YYYY-MM-DD'),
    total_seeds: 0,
    notes: '',
    temperature: '',
    humidity: '',
    responsible_member: '',
    room: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Mitglieder und Räume laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lade Mitglieder
        const membersResponse = await api.get('/members/');
        if (Array.isArray(membersResponse.data)) {
          setMembers(membersResponse.data);
        } else if (membersResponse.data && Array.isArray(membersResponse.data.results)) {
          setMembers(membersResponse.data.results);
        } else {
          console.error('Unerwartetes Mitglieder-Datenformat:', membersResponse.data);
          setMembers([]);
        }
        
        // Lade Räume
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
          setRooms([]);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Mitglieder:', err);
        setMembers([]);
      }
    };
    
    fetchData();
  }, []);
  
  // Formulardaten initialisieren, wenn initialData vorhanden
  useEffect(() => {
    if (initialData) {
      setFormData({...initialData});
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Spezialfall für Strain-Änderung, um Daten zu übernehmen
    if (name === 'strain' && e.target.strainData) {
      // Stellt die Daten aus der Strain-Auswahl bereit
      const strainData = e.target.strainData;
      setFormData(prev => ({
        ...prev,
        strain: value,
        strain_name: strainData.strain_name,
        genetics: strainData.genetics || prev.genetics,
        sativa_percentage: strainData.sativa_percentage,
        indica_percentage: strainData.indica_percentage,
        thc_value: strainData.thc_value || prev.thc_value,
        cbd_value: strainData.cbd_value || prev.cbd_value
      }));
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Wenn Sativa geändert wird, Indica automatisch anpassen
    if (name === 'sativa_percentage') {
      setFormData(prev => ({
        ...prev,
        sativa_percentage: value,
        indica_percentage: 100 - value
      }));
    }
    else if (name === 'indica_percentage') {
      setFormData(prev => ({
        ...prev,
        indica_percentage: value,
        sativa_percentage: 100 - value
      }));
    }
  };

  // Handler für Datepicker-Änderungen
  const handleDateChange = (date) => {
    if (date) {
      setFormData({
        ...formData,
        purchase_date: date.format('YYYY-MM-DD')
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.manufacturer) newErrors.manufacturer = 'Hersteller ist erforderlich';
    if (!formData.strain_name) newErrors.strain_name = 'Sortenname ist erforderlich';
    if (!formData.genetics) newErrors.genetics = 'Genetik ist erforderlich';
    if (!formData.purchase_date) newErrors.purchase_date = 'Kaufdatum ist erforderlich';
    if (!formData.total_seeds || formData.total_seeds <= 0) {
      newErrors.total_seeds = 'Anzahl muss größer als 0 sein';
    }
    if (!formData.responsible_member) newErrors.responsible_member = 'Verantwortlicher ist erforderlich';
    
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
      <FormSection title="Hersteller & Sorte">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Hersteller
              </Typography>
              <SeedManufacturerDropdown
                value={formData.manufacturer}
                onChange={handleChange}
                error={!!errors.manufacturer}
                helperText={errors.manufacturer}
                disabled={loading}
                sx={{ minWidth: 300 }}
              />
              <FormHelperText>
                Eingeben um zu suchen oder neuen Hersteller anlegen
              </FormHelperText>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Cannabis-Sorte
              </Typography>
              <SeedStrainDropdown
                value={formData.strain}
                onChange={handleChange}
                error={!!errors.strain_name}
                helperText={errors.strain_name}
                disabled={loading || !formData.manufacturer}
                manufacturerId={formData.manufacturer}
                onNewStrainCreated={() => {}}
                sx={{ minWidth: 300 }}
              />
              <FormHelperText>
                Wählen Sie eine vorhandene Sorte oder legen Sie eine neue an
              </FormHelperText>
            </Box>
          </Grid>
        </Grid>
      </FormSection>
      
      <FormSection title="Sortendetails">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sortenname"
              name="strain_name"
              value={formData.strain_name}
              onChange={handleChange}
              error={!!errors.strain_name}
              helperText={errors.strain_name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Genetik"
              name="genetics"
              value={formData.genetics}
              onChange={handleChange}
              error={!!errors.genetics}
              helperText={errors.genetics}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sativa-Anteil (%)"
              name="sativa_percentage"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={formData.sativa_percentage}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Indica-Anteil (%)"
              name="indica_percentage"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={formData.indica_percentage}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="THC-Wert (%)"
              name="thc_value"
              type="number"
              inputProps={{ step: 0.01, min: 0, max: 100 }}
              value={formData.thc_value}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CBD-Wert (%)"
              name="cbd_value"
              type="number"
              inputProps={{ step: 0.01, min: 0, max: 100 }}
              value={formData.cbd_value}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </FormSection>
      
      <FormSection title="Einkaufsinformationen">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
              <DatePicker
                label="Kaufdatum"
                value={dayjs(formData.purchase_date)}
                onChange={handleDateChange}
                format="DD.MM.YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.purchase_date,
                    helperText: errors.purchase_date,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Anzahl Samen"
              name="total_seeds"
              type="number"
              inputProps={{ min: 1 }}
              value={formData.total_seeds}
              onChange={handleChange}
              error={!!errors.total_seeds}
              helperText={errors.total_seeds}
            />
          </Grid>
        </Grid>
      </FormSection>
      
      <FormSection title="Umgebungsdaten">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Temperatur (°C)"
              name="temperature"
              type="number"
              inputProps={{ step: 0.1 }}
              value={formData.temperature}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Luftfeuchtigkeit (%)"
              name="humidity"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={formData.humidity}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </FormSection>
      
      <FormSection title="Verantwortlichkeit & Lagerort">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
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
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Lagerraum</InputLabel>
              <Select
                name="room"
                value={formData.room || ''}
                onChange={handleChange}
                label="Lagerraum"
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
              <FormHelperText>Raum, in dem die Samen gelagert werden (optional)</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bemerkungen"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </FormSection>
      
      <Box display="flex" justifyContent="flex-end" mt={3} mb={2}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          sx={{ mr: 2 }}
        >
          Abbrechen
        </Button>
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          disabled={loading}
          size="large"
        >
          {initialData ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </Box>
    </form>
  );
};

export default SeedPurchaseForm;