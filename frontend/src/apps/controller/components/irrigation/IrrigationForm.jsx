// frontend/src/apps/controller/components/irrigation/IrrigationForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select,
  MenuItem, FormControlLabel, Switch, Typography, Box,
  InputAdornment, CircularProgress, Alert, Divider,
  Grid, useTheme, alpha, Avatar
} from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SettingsIcon from '@mui/icons-material/Settings';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import api from '@/utils/api';

/**
 * Formular zum Erstellen und Bearbeiten von Bewässerungscontrollern
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog anzeigen/ausblenden
 * @param {Function} props.onClose - Callback beim Schließen des Dialogs
 * @param {Function} props.onSuccess - Callback bei erfolgreichem Speichern
 * @param {Object|null} props.editController - Controller zum Bearbeiten (null für neu)
 */
export default function IrrigationForm({ 
  open, 
  onClose, 
  onSuccess,
  editController = null
}) {
  const theme = useTheme();
  const isEditMode = Boolean(editController);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Formularstatus initialisieren
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    room_id: '',
    created_by_id: '',
    pump_type: 'drip',
    water_source: '',
    flow_rate: 1.0,
    max_volume_per_day: 0,
    schedule_type: 'daily',
    sensor_feedback_enabled: false
  });
  
  // Verfügbare Räume und Members laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Räume laden
        const roomsRes = await api.get('/rooms/');
        setRooms(roomsRes.data.results || []);
        
        // Members laden
        const membersRes = await api.get('/members/');
        setMembers(membersRes.data.results || []);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError('Daten konnten nicht geladen werden.');
      }
    };
    
    fetchData();
  }, []);
  
  // Wenn ein Controller zum Bearbeiten übergeben wird, Formulardaten setzen
  useEffect(() => {
    if (editController) {
      setFormData({
        name: editController.name || '',
        description: editController.description || '',
        is_active: editController.is_active ?? true,
        room_id: editController.room?.id || '',
        created_by_id: editController.created_by?.id || '',
        pump_type: editController.pump_type || 'drip',
        water_source: editController.water_source || '',
        flow_rate: editController.flow_rate || 1.0,
        max_volume_per_day: editController.max_volume_per_day || 0,
        schedule_type: editController.schedule_type || 'daily',
        sensor_feedback_enabled: editController.sensor_feedback_enabled ?? false
      });
    } else {
      // Zurücksetzen für neuen Controller
      setFormData({
        name: '',
        description: '',
        is_active: true,
        room_id: '',
        created_by_id: '',
        pump_type: 'drip',
        water_source: '',
        flow_rate: 1.0,
        max_volume_per_day: 0,
        schedule_type: 'daily',
        sensor_feedback_enabled: false
      });
    }
    
    setError(null);
  }, [editController, open]);
  
  // Änderungen im Formular verarbeiten
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Formular absenden
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Daten validieren
      if (!formData.name.trim()) {
        throw new Error('Bitte geben Sie einen Namen ein.');
      }
      
      if (isNaN(parseFloat(formData.flow_rate)) || parseFloat(formData.flow_rate) <= 0) {
        throw new Error('Die Durchflussrate muss größer als 0 sein.');
      }
      
      if (isNaN(parseFloat(formData.max_volume_per_day)) || parseFloat(formData.max_volume_per_day) < 0) {
        throw new Error('Das maximale Volumen pro Tag muss 0 oder größer sein.');
      }
      
      // Daten für die API vorbereiten
      const apiData = {
        ...formData,
        flow_rate: parseFloat(formData.flow_rate),
        max_volume_per_day: parseFloat(formData.max_volume_per_day) || null
      };
      
      // API-Call zum Erstellen oder Aktualisieren
      let response;
      if (isEditMode) {
        response = await api.patch(`/controller/irrigation/${editController.id}/`, apiData);
      } else {
        response = await api.post('/controller/irrigation/', apiData);
      }
      
      // Erfolg signalisieren und Dialog schließen
      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (err) {
      console.error('Fehler beim Speichern des Controllers:', err);
      setError(err.response?.data?.error || err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <OpacityIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          {isEditMode ? 'Bewässerungscontroller bearbeiten' : 'Neuer Bewässerungscontroller'}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        <Grid container spacing={2}>
          {/* Grundlegende Informationen */}
          <Grid item xs={12}>
            <Box 
              sx={{ 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <SettingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Grundeinstellungen
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="name"
              label="Controller-Name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              autoFocus
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Raum</InputLabel>
              <Select
                name="room_id"
                value={formData.room_id}
                onChange={handleChange}
                label="Raum"
              >
                <MenuItem value="">
                  <em>Kein Raum</em>
                </MenuItem>
                {rooms.map(room => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Verantwortliches Mitglied</InputLabel>
              <Select
                name="created_by_id"
                value={formData.created_by_id}
                onChange={handleChange}
                label="Verantwortliches Mitglied"
                startAdornment={
                  formData.created_by_id ? (
                    <Avatar
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        fontSize: '0.75rem',
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      {members.find(m => m.id === formData.created_by_id)?.first_name?.charAt(0) || '?'}
                    </Avatar>
                  ) : null
                }
              >
                <MenuItem value="">
                  <em>Kein verantwortliches Mitglied</em>
                </MenuItem>
                {members.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          mr: 1,
                          fontSize: '0.75rem',
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {member.first_name?.charAt(0) || '?'}
                      </Avatar>
                      {member.first_name} {member.last_name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Controller aktiv"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Beschreibung"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          
          {/* Bewässerungsparameter */}
          <Grid item xs={12}>
            <Box 
              sx={{ 
                mt: 2, 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <WaterDropIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Bewässerungsdetails
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Pumpentyp</InputLabel>
              <Select
                name="pump_type"
                value={formData.pump_type}
                onChange={handleChange}
                label="Pumpentyp"
              >
                <MenuItem value="drip">Tropfbewässerung</MenuItem>
                <MenuItem value="sprinkler">Sprinkler</MenuItem>
                <MenuItem value="flood">Flut</MenuItem>
                <MenuItem value="mist">Vernebelung</MenuItem>
                <MenuItem value="custom">Benutzerdefiniert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="water_source"
              label="Wasserquelle"
              value={formData.water_source}
              onChange={handleChange}
              fullWidth
              placeholder="z.B. Tank 1, Hauptwasserleitung"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="flow_rate"
              label="Durchflussrate"
              value={formData.flow_rate}
              onChange={handleChange}
              fullWidth
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">l/min</InputAdornment>,
                inputProps: { min: 0.01, step: 0.1 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              name="max_volume_per_day"
              label="Max. Volumen pro Tag"
              value={formData.max_volume_per_day}
              onChange={handleChange}
              fullWidth
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">l</InputAdornment>,
                inputProps: { min: 0, step: 0.5 }
              }}
              helperText="0 = unbegrenzt"
            />
          </Grid>
          
          {/* Zeitplan und Sensor-Einstellungen */}
          <Grid item xs={12}>
            <Box 
              sx={{ 
                mt: 2, 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <DeviceThermostatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Zeitplan & Sensorik
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Zeitplantyp</InputLabel>
              <Select
                name="schedule_type"
                value={formData.schedule_type}
                onChange={handleChange}
                label="Zeitplantyp"
              >
                <MenuItem value="daily">Täglich</MenuItem>
                <MenuItem value="weekly">Wöchentlich</MenuItem>
                <MenuItem value="phase">Phasenbasiert</MenuItem>
                <MenuItem value="sensor">Sensorgesteuert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="sensor_feedback_enabled"
                  checked={formData.sensor_feedback_enabled}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Sensorrückmeldung aktiviert"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, px: 1 }}>
          <Alert severity="info">
            Nach dem Erstellen können Sie Zeitpläne für diesen Controller hinzufügen.
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {isEditMode ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}