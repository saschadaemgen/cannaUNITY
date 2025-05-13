// frontend/src/apps/controller/components/irrigation/ScheduleForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  Box, Typography, Chip, Slider, Grid, Divider, Alert
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import OpacityIcon from '@mui/icons-material/Opacity';
import LoopIcon from '@mui/icons-material/Loop';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import api from '@/utils/api';

/**
 * Formular zur Erstellung und Bearbeitung von Bewässerungszeitplänen
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog öffnen/schließen
 * @param {function} props.onClose - Callback beim Schließen
 * @param {function} props.onSuccess - Callback bei erfolgreichem Speichern
 * @param {string} props.controllerId - ID des zugehörigen Controllers
 * @param {Object} props.editSchedule - Zeitplan zum Bearbeiten (oder null für Neuanlage)
 */
export default function ScheduleForm({ 
  open, 
  onClose, 
  onSuccess, 
  controllerId, 
  editSchedule 
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const [formValues, setFormValues] = useState({
    day_of_week: null,
    start_time: '08:00',
    duration: 5,
    intensity: 100,
    volume: '',
    repeated_cycles: 1,
    cycle_pause: 5,
    is_active: true
  });
  
  // Controller-Details und Zeitplan laden
  useEffect(() => {
    const loadData = async () => {
      if (!controllerId) return;
      
      try {
        // Controller-Details laden
        const controllerRes = await api.get(`/controller/irrigation/${controllerId}/`);
        setController(controllerRes.data);
        
        // Formularwerte setzen, wenn ein Zeitplan bearbeitet wird
        if (editSchedule) {
          setFormValues({
            day_of_week: editSchedule.day_of_week,
            start_time: editSchedule.start_time,
            duration: editSchedule.duration,
            intensity: editSchedule.intensity,
            volume: editSchedule.volume ? String(editSchedule.volume) : '',
            repeated_cycles: editSchedule.repeated_cycles,
            cycle_pause: editSchedule.cycle_pause,
            is_active: editSchedule.is_active
          });
        } else {
          // Wenn kein Zeitplan bearbeitet wird, Volumen basierend auf Controller berechnen
          if (controllerRes.data && controllerRes.data.flow_rate) {
            const calculatedVolume = controllerRes.data.flow_rate * formValues.duration * (formValues.intensity / 100);
            setFormValues(prev => ({
              ...prev,
              volume: calculatedVolume.toFixed(1)
            }));
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Controller-Details:', error);
        setError('Fehler beim Laden der Controller-Details');
      }
    };
    
    if (open) {
      loadData();
    }
  }, [controllerId, editSchedule, open]);
  
  // Formularwerte ändern
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'is_active' ? checked : value
    }));
    
    // Volumen automatisch berechnen, wenn Dauer oder Intensität geändert wird
    if ((name === 'duration' || name === 'intensity') && controller) {
      // Aktuelle Werte für die Berechnung verwenden
      const duration = name === 'duration' ? value : formValues.duration;
      const intensity = name === 'intensity' ? value : formValues.intensity;
      
      const calculatedVolume = controller.flow_rate * duration * (intensity / 100);
      setFormValues(prev => ({
        ...prev,
        volume: calculatedVolume.toFixed(1)
      }));
    }
  };
  
  // Slider-Änderungen
  const handleSliderChange = (name) => (event, newValue) => {
    handleChange({
      target: {
        name,
        value: newValue
      }
    });
  };
  
  // Zeitplan speichern
  const handleSave = async () => {
    if (!controllerId) {
      setError('Kein Controller ausgewählt');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // API-Endpunkt und Methode basierend auf Bearbeitung/Neuanlage wählen
      let response;
      
      const submitData = {
        ...formValues,
        // Sicherstellen, dass numerische Werte als Zahlen übermittelt werden
        duration: parseInt(formValues.duration),
        intensity: parseInt(formValues.intensity),
        volume: formValues.volume ? parseFloat(formValues.volume) : null,
        repeated_cycles: parseInt(formValues.repeated_cycles),
        cycle_pause: parseInt(formValues.cycle_pause)
      };
      
      if (editSchedule) {
        // Zeitplan aktualisieren
        response = await api.put(`/controller/irrigation-schedules/${editSchedule.id}/`, submitData);
      } else {
        // Neuen Zeitplan erstellen
        response = await api.post(`/controller/irrigation-schedules/?controller_id=${controllerId}`, submitData);
      }
      
      // Erfolg-Callback aufrufen
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Zeitplans:', error);
      setError(error.response?.data?.detail || 'Fehler beim Speichern des Zeitplans');
    } finally {
      setLoading(false);
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
        {editSchedule ? 'Bewässerungszeitplan bearbeiten' : 'Neuen Bewässerungszeitplan erstellen'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
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
                  <CalendarTodayIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  ZEITPLAN
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Wochentag</InputLabel>
                  <Select
                    name="day_of_week"
                    value={formValues.day_of_week !== null ? formValues.day_of_week : ''}
                    onChange={handleChange}
                    label="Wochentag"
                  >
                    <MenuItem value="">Täglich</MenuItem>
                    <MenuItem value={0}>Montag</MenuItem>
                    <MenuItem value={1}>Dienstag</MenuItem>
                    <MenuItem value={2}>Mittwoch</MenuItem>
                    <MenuItem value={3}>Donnerstag</MenuItem>
                    <MenuItem value={4}>Freitag</MenuItem>
                    <MenuItem value={5}>Samstag</MenuItem>
                    <MenuItem value={6}>Sonntag</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Startzeit"
                  name="start_time"
                  type="time"
                  fullWidth
                  value={formValues.start_time}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 Minuten
                  }}
                  sx={{ mb: 2 }}
                />
                
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
                    label="Zeitplan aktiv"
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LoopIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  ZYKLEN
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <TextField
                      label="Wiederholte Zyklen"
                      name="repeated_cycles"
                      type="number"
                      fullWidth
                      value={formValues.repeated_cycles}
                      onChange={handleChange}
                      inputProps={{
                        min: 1,
                        max: 10,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Pause zwischen Zyklen (Min.)"
                      name="cycle_pause"
                      type="number"
                      fullWidth
                      value={formValues.cycle_pause}
                      onChange={handleChange}
                      inputProps={{
                        min: 1,
                        max: 60,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <OpacityIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  BEWÄSSERUNGSDETAILS
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Dauer (Minuten)
                  </Typography>
                  <Slider
                    value={formValues.duration}
                    onChange={handleSliderChange('duration')}
                    valueLabelDisplay="auto"
                    step={1}
                    min={1}
                    max={60}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 15, label: '15' },
                      { value: 30, label: '30' },
                      { value: 45, label: '45' },
                      { value: 60, label: '60' }
                    ]}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Intensität (%)
                  </Typography>
                  <Slider
                    value={formValues.intensity}
                    onChange={handleSliderChange('intensity')}
                    valueLabelDisplay="auto"
                    step={5}
                    min={10}
                    max={100}
                    marks={[
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                      { value: 75, label: '75' },
                      { value: 100, label: '100' }
                    ]}
                  />
                </Box>
                
                <TextField
                  label="Wasservolumen (l)"
                  name="volume"
                  type="number"
                  fullWidth
                  value={formValues.volume}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <Typography variant="body2">Liter</Typography>,
                  }}
                  helperText="Wird automatisch aus Dauer und Intensität berechnet. Manuelle Anpassung möglich."
                  sx={{ mb: 2 }}
                />
                
                {controller && (
                  <Box 
                    sx={{ 
                      mt: 2, 
                      p: 2, 
                      borderRadius: 1, 
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Berechnete Werte
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                      <Typography variant="body2">
                        Effektive Dauer: <strong>{formValues.duration * formValues.repeated_cycles} Min.</strong>
                        {formValues.repeated_cycles > 1 && (
                          <span> (inkl. {formValues.cycle_pause * (formValues.repeated_cycles - 1)} Min. Pause)</span>
                        )}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WaterDropIcon sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                      <Typography variant="body2">
                        Gesamtvolumen: <strong>{formValues.volume} Liter</strong> 
                        <span> (bei {controller.flow_rate} l/min Durchflussrate)</span>
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
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
          {loading ? 'Wird gespeichert...' : (editSchedule ? 'Aktualisieren' : 'Speichern')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}