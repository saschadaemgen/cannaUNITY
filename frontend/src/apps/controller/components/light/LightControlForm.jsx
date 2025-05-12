// frontend/src/apps/controller/components/light/LightControlForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  Box, Typography, Chip, Slider, Grid, Divider, Alert, InputAdornment
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SettingsIcon from '@mui/icons-material/Settings';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RoomIcon from '@mui/icons-material/Room';
import api from '@/utils/api';

/**
 * Formular zur Erstellung und Bearbeitung von Lichtcontrollern
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog öffnen/schließen
 * @param {function} props.onClose - Callback beim Schließen
 * @param {function} props.onSuccess - Callback bei erfolgreichem Speichern
 * @param {Object} props.editController - Controller zum Bearbeiten (oder null für Neuanlage)
 * @param {Array} props.rooms - Verfügbare Räume für Dropdown
 */
export default function LightControlForm({ 
  open, 
  onClose, 
  onSuccess, 
  editController = null,
  rooms = []
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableRooms, setAvailableRooms] = useState(rooms);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    is_active: true,
    mqtt_topic_prefix: '',
    room_id: '',
    light_type: 'led',
    max_power: 600,
    spectrum_type: 'full',
    supports_dimming: true,
    supports_spectrum_control: false,
    cycle_type: 'veg',
    current_day_in_cycle: 1,
    cycle_start_date: new Date().toISOString().split('T')[0], // Heutiges Datum als YYYY-MM-DD
    auto_increment_day: true
  });
  
  // Räume laden, falls nicht als Prop gegeben
  useEffect(() => {
    const loadRooms = async () => {
      if (rooms && rooms.length > 0) {
        setAvailableRooms(rooms);
        return;
      }
      
      try {
        const response = await api.get('/api/rooms/');
        setAvailableRooms(response.data.results || []);
      } catch (error) {
        console.error('Fehler beim Laden der Räume:', error);
        setError('Räume konnten nicht geladen werden');
      }
    };
    
    if (open) {
      loadRooms();
    }
  }, [open, rooms]);
  
  // Controller-Daten laden, wenn Bearbeitung
  useEffect(() => {
    if (editController) {
      setFormValues({
        name: editController.name || '',
        description: editController.description || '',
        is_active: editController.is_active !== false,
        mqtt_topic_prefix: editController.mqtt_topic_prefix || '',
        room_id: editController.room?.id || '',
        light_type: editController.light_type || 'led',
        max_power: editController.max_power || 600,
        spectrum_type: editController.spectrum_type || 'full',
        supports_dimming: editController.supports_dimming !== false,
        supports_spectrum_control: editController.supports_spectrum_control || false,
        cycle_type: editController.cycle_type || 'veg',
        current_day_in_cycle: editController.current_day_in_cycle || 1,
        cycle_start_date: editController.cycle_start_date ? editController.cycle_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        auto_increment_day: editController.auto_increment_day !== false
      });
    } else {
      // Zurücksetzen für neuen Controller
      setFormValues({
        name: '',
        description: '',
        is_active: true,
        mqtt_topic_prefix: '',
        room_id: '',
        light_type: 'led',
        max_power: 600,
        spectrum_type: 'full',
        supports_dimming: true,
        supports_spectrum_control: false,
        cycle_type: 'veg',
        current_day_in_cycle: 1,
        cycle_start_date: new Date().toISOString().split('T')[0],
        auto_increment_day: true
      });
    }
  }, [editController, open]);
  
  // Formular-Änderungen
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: name.includes('is_') || name.includes('supports_') || name === 'auto_increment_day' ? checked : value
    }));
  };
  
  // Slider-Änderungen
  const handleSliderChange = (name) => (event, newValue) => {
    setFormValues(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // MQTT-Topic automatisch generieren
  const generateMqttTopic = () => {
    if (formValues.name) {
      const sanitizedName = formValues.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      setFormValues(prev => ({
        ...prev,
        mqtt_topic_prefix: `controller/light/${sanitizedName}`
      }));
    }
  };
  
  // Controller speichern
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validierung
      if (!formValues.name) {
        setError('Name ist erforderlich');
        setLoading(false);
        return;
      }
      
      // API-Endpunkt und Methode basierend auf Bearbeitung/Neuanlage wählen
      let response;
      
      // Daten vorbereiten
      const submitData = {
        ...formValues,
        max_power: parseInt(formValues.max_power),
        current_day_in_cycle: parseInt(formValues.current_day_in_cycle)
      };
      
      if (editController) {
        // Controller aktualisieren
        response = await api.put(`/api/controller/light/${editController.id}/`, submitData);
      } else {
        // Neuen Controller erstellen
        response = await api.post('/api/controller/light/', submitData);
      }
      
      // Erfolg-Callback aufrufen
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Controllers:', error);
      setError(error.response?.data?.detail || 'Fehler beim Speichern des Controllers');
    } finally {
      setLoading(false);
    }
  };
  
  // Zyklustage basierend auf Typ
  const getCycleDays = () => {
    switch (formValues.cycle_type) {
      case 'veg':
        return '18/6 Stunden (Licht/Dunkelheit)';
      case 'flower':
        return '12/12 Stunden (Licht/Dunkelheit)';
      case 'seedling':
        return '20/4 Stunden (Licht/Dunkelheit)';
      case 'clone':
        return '24/0 Stunden (Licht/Dunkelheit)';
      case 'custom':
        return 'Benutzerdefiniert';
      default:
        return 'Automatisch';
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {editController ? 'Lichtcontroller bearbeiten' : 'Neuen Lichtcontroller erstellen'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Grundlegende Informationen */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <SettingsIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  GRUNDEINSTELLUNGEN
                </Typography>
                
                <TextField
                  label="Name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  onBlur={() => {
                    if (!formValues.mqtt_topic_prefix) {
                      generateMqttTopic();
                    }
                  }}
                />
                
                <TextField
                  label="Beschreibung"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="MQTT Topic-Präfix"
                  name="mqtt_topic_prefix"
                  value={formValues.mqtt_topic_prefix}
                  onChange={handleChange}
                  fullWidth
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button 
                          size="small" 
                          onClick={generateMqttTopic}
                          sx={{ ml: 1 }}
                        >
                          Generieren
                        </Button>
                      </InputAdornment>
                    )
                  }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="room-label">Raum</InputLabel>
                  <Select
                    labelId="room-label"
                    name="room_id"
                    value={formValues.room_id}
                    onChange={handleChange}
                    label="Raum"
                  >
                    <MenuItem value="">
                      <em>Kein Raum</em>
                    </MenuItem>
                    {availableRooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <RoomIcon fontSize="small" sx={{ mr: 1 }} />
                          {room.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.is_active}
                        onChange={handleChange}
                        name="is_active"
                        color="primary"
                      />
                    }
                    label="Controller aktiv"
                  />
                </Box>
              </Box>
            </Grid>
            
            {/* Licht-Einstellungen */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <WbSunnyIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.warning.main }} />
                  LICHTEINSTELLUNGEN
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="light-type-label">Lichttyp</InputLabel>
                  <Select
                    labelId="light-type-label"
                    name="light_type"
                    value={formValues.light_type}
                    onChange={handleChange}
                    label="Lichttyp"
                  >
                    <MenuItem value="led">LED</MenuItem>
                    <MenuItem value="hps">HPS (Natriumdampf)</MenuItem>
                    <MenuItem value="mh">MH (Metallhalogen)</MenuItem>
                    <MenuItem value="cfl">CFL (Energiesparlampe)</MenuItem>
                    <MenuItem value="mixed">Gemischt</MenuItem>
                    <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Maximale Leistung (W)"
                  name="max_power"
                  type="number"
                  value={formValues.max_power}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="Spektrumtyp"
                  name="spectrum_type"
                  value={formValues.spectrum_type}
                  onChange={handleChange}
                  fullWidth
                  placeholder="z.B. Vollspektrum, Blüte, usw."
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formValues.supports_dimming}
                            onChange={handleChange}
                            name="supports_dimming"
                            color="primary"
                          />
                        }
                        label="Dimmen möglich"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formValues.supports_spectrum_control}
                            onChange={handleChange}
                            name="supports_spectrum_control"
                            color="primary"
                          />
                        }
                        label="Spektrumkontrolle"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
            
            {/* Zykluseinstellungen */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 3 }} />
              
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <DateRangeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                ZYKLUSEINSTELLUNGEN
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="cycle-type-label">Zyklustyp</InputLabel>
                    <Select
                      labelId="cycle-type-label"
                      name="cycle_type"
                      value={formValues.cycle_type}
                      onChange={handleChange}
                      label="Zyklustyp"
                    >
                      <MenuItem value="veg">Vegetativ (18/6)</MenuItem>
                      <MenuItem value="flower">Blüte (12/12)</MenuItem>
                      <MenuItem value="seedling">Sämling (20/4)</MenuItem>
                      <MenuItem value="clone">Klon (24/0)</MenuItem>
                      <MenuItem value="auto">Automatisch</MenuItem>
                      <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      mb: 2, 
                      borderRadius: 1, 
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                    }}
                  >
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Lichtzyklus: {getCycleDays()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Der Lichtzyklus bestimmt die tägliche Beleuchtungsdauer basierend auf der Wachstumsphase.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Aktueller Tag im Zyklus"
                    name="current_day_in_cycle"
                    type="number"
                    value={formValues.current_day_in_cycle}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Zyklusstartdatum"
                    name="cycle_start_date"
                    type="date"
                    value={formValues.cycle_start_date}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.auto_increment_day}
                        onChange={handleChange}
                        name="auto_increment_day"
                        color="primary"
                      />
                    }
                    label="Tag automatisch erhöhen"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          startIcon={<CancelIcon />}
        >
          Abbrechen
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Wird gespeichert...' : (editController ? 'Aktualisieren' : 'Speichern')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}