// frontend/src/apps/controller/components/light/LightScheduleForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  Box, Typography, Chip, Slider, Grid, Divider, Alert, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Card, CardContent
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/LightMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TimerIcon from '@mui/icons-material/Timer';
import api from '@/utils/api';

/**
 * Formular zur Erstellung und Bearbeitung von Lichtzeitplänen
 * 
 * @param {Object} props
 * @param {boolean} props.open - Dialog öffnen/schließen
 * @param {function} props.onClose - Callback beim Schließen
 * @param {function} props.onSuccess - Callback bei erfolgreichem Speichern
 * @param {string} props.controllerId - ID des zugehörigen Controllers
 * @param {Object} props.editSchedule - Zeitplan zum Bearbeiten (oder null für Neuanlage)
 * @param {Array} props.days - Verfügbare Tage für Dropdown (falls mehrere Tage im Zyklus)
 */
export default function LightScheduleForm({ 
  open, 
  onClose, 
  onSuccess, 
  controllerId, 
  editSchedule = null,
  days = []
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  
  // Hauptformularwerte
  const [formValues, setFormValues] = useState({
    name: '',
    day_in_cycle: 1,
    is_active: true
  });
  
  // Zeitpunkte im Zeitplan
  const [timePoints, setTimePoints] = useState([]);
  
  // Aktuell bearbeiteter Zeitpunkt
  const [editingPoint, setEditingPoint] = useState(null);
  const [pointFormOpen, setPointFormOpen] = useState(false);
  const [pointFormValues, setPointFormValues] = useState({
    time_point: '08:00',
    intensity: 100,
    spectrum_red: 100,
    spectrum_blue: 100,
    transition_duration: 30
  });
  
  // Controller-Details und Zeitplan laden
  useEffect(() => {
    const loadData = async () => {
      if (!controllerId) return;
      
      try {
        // Controller-Details laden
        const controllerRes = await api.get(`/api/controller/light/${controllerId}/`);
        setController(controllerRes.data);
        
        // Wenn ein Zeitplan bearbeitet wird
        if (editSchedule) {
          setFormValues({
            name: editSchedule.name || '',
            day_in_cycle: editSchedule.day_in_cycle || 1,
            is_active: editSchedule.is_active !== false
          });
          
          // Zeitpunkte laden
          if (editSchedule.id) {
            const pointsRes = await api.get(`/api/controller/light-schedule-points/?schedule_id=${editSchedule.id}`);
            setTimePoints(pointsRes.data || []);
          } else if (editSchedule.points) {
            setTimePoints(editSchedule.points);
          }
        } else {
          // Neuer Zeitplan, Tag aus Controller nehmen
          setFormValues(prev => ({
            ...prev,
            day_in_cycle: controllerRes.data.current_day_in_cycle || 1
          }));
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
  
  // Zeitplan-Formularwerte ändern
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'is_active' ? checked : value
    }));
  };
  
  // Zeitpunkt-Formularwerte ändern
  const handlePointChange = (event) => {
    const { name, value } = event.target;
    
    setPointFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Slider-Änderungen für Zeitpunkte
  const handlePointSliderChange = (name) => (event, newValue) => {
    setPointFormValues(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Neuen Zeitpunkt hinzufügen
  const handleAddPoint = () => {
    setEditingPoint(null);
    setPointFormValues({
      time_point: '08:00',
      intensity: 100,
      spectrum_red: 100,
      spectrum_blue: 100,
      transition_duration: 30
    });
    setPointFormOpen(true);
  };
  
  // Zeitpunkt bearbeiten
  const handleEditPoint = (point) => {
    setEditingPoint(point);
    setPointFormValues({
      time_point: point.time_point,
      intensity: point.intensity,
      spectrum_red: point.spectrum_red,
      spectrum_blue: point.spectrum_blue,
      transition_duration: point.transition_duration
    });
    setPointFormOpen(true);
  };
  
  // Zeitpunkt speichern
  const handleSavePoint = () => {
    // Validierung
    if (!pointFormValues.time_point) {
      setError('Zeitpunkt ist erforderlich');
      return;
    }
    
    if (editingPoint) {
      // Bestehenden Zeitpunkt aktualisieren
      const updatedPoints = timePoints.map(point => 
        point.id === editingPoint.id ? { ...point, ...pointFormValues } : point
      );
      setTimePoints(updatedPoints);
    } else {
      // Neuen Zeitpunkt hinzufügen
      const newPoint = {
        ...pointFormValues,
        id: `temp_${Date.now()}` // Temporäre ID für neue Zeitpunkte
      };
      setTimePoints([...timePoints, newPoint]);
    }
    
    setPointFormOpen(false);
  };
  
  // Zeitpunkt löschen
  const handleDeletePoint = (pointId) => {
    const updatedPoints = timePoints.filter(point => point.id !== pointId);
    setTimePoints(updatedPoints);
  };
  
  // Generiert automatisch Tageslichtpunkte
  const handleGenerateDayCycle = () => {
    // Basis-Lichtparameter basierend auf Controller-Typ
    let lightHours = 16; // Standard
    let maxIntensity = 100;
    let redSpectrum = 100;
    let blueSpectrum = 100;
    
    if (controller) {
      // Anpassung basierend auf Zyklustyp
      if (controller.cycle_type === 'veg') {
        lightHours = 18;
        blueSpectrum = 100;
        redSpectrum = 80;
      } else if (controller.cycle_type === 'flower') {
        lightHours = 12;
        redSpectrum = 100;
        blueSpectrum = 70;
      } else if (controller.cycle_type === 'seedling') {
        lightHours = 20;
        blueSpectrum = 100;
        redSpectrum = 70;
        maxIntensity = 80;
      } else if (controller.cycle_type === 'clone') {
        lightHours = 24;
        blueSpectrum = 90;
        redSpectrum = 80;
        maxIntensity = 70;
      }
    }
    
    // Startzeit festlegen (Standard: 6 Uhr morgens)
    const startHour = 6;
    const startTime = `0${startHour}:00`.slice(-5);
    
    // Übergangszeit in Minuten
    const transitionDuration = 30;
    
    // Zeitpunkte generieren
    const newPoints = [];
    
    // 1. Sonnenaufgang Beginn
    newPoints.push({
      id: `temp_sunrise_start_${Date.now()}`,
      time_point: startTime,
      intensity: 0, // Start mit 0%
      spectrum_red: redSpectrum,
      spectrum_blue: blueSpectrum,
      transition_duration: transitionDuration
    });
    
    // 2. Volle Helligkeit
    const fullBrightnessHour = startHour;
    const fullBrightnessMinute = transitionDuration;
    const fullBrightnessTime = `${fullBrightnessHour.toString().padStart(2, '0')}:${fullBrightnessMinute.toString().padStart(2, '0')}`;
    
    newPoints.push({
      id: `temp_full_brightness_${Date.now()}`,
      time_point: fullBrightnessTime,
      intensity: maxIntensity,
      spectrum_red: redSpectrum,
      spectrum_blue: blueSpectrum,
      transition_duration: 0
    });
    
    // 3. Beginn Sonnenuntergang
    const sunsetHour = (startHour + lightHours - (transitionDuration / 60)) % 24;
    const sunsetMinute = (transitionDuration % 60);
    const sunsetTime = `${Math.floor(sunsetHour).toString().padStart(2, '0')}:${sunsetMinute.toString().padStart(2, '0')}`;
    
    newPoints.push({
      id: `temp_sunset_start_${Date.now()}`,
      time_point: sunsetTime,
      intensity: maxIntensity,
      spectrum_red: redSpectrum,
      spectrum_blue: blueSpectrum,
      transition_duration: transitionDuration
    });
    
    // 4. Komplette Dunkelheit
    const darknessHour = (sunsetHour + (transitionDuration / 60)) % 24;
    const darknessMinute = (sunsetMinute + (transitionDuration % 60)) % 60;
    const darknessTime = `${Math.floor(darknessHour).toString().padStart(2, '0')}:${Math.floor(darknessMinute).toString().padStart(2, '0')}`;
    
    newPoints.push({
      id: `temp_darkness_${Date.now()}`,
      time_point: darknessTime,
      intensity: 0,
      spectrum_red: 0,
      spectrum_blue: 0,
      transition_duration: 0
    });
    
    // Zeitpunkte setzen
    setTimePoints(newPoints);
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
      let scheduleResponse;
      
      const scheduleData = {
        ...formValues,
        day_in_cycle: parseInt(formValues.day_in_cycle)
      };
      
      if (editSchedule && editSchedule.id) {
        // Zeitplan aktualisieren
        scheduleResponse = await api.put(`/api/controller/light-schedules/${editSchedule.id}/`, scheduleData);
      } else {
        // Neuen Zeitplan erstellen
        scheduleResponse = await api.post(`/api/controller/light-schedules/?controller_id=${controllerId}`, scheduleData);
      }
      
      const scheduleId = scheduleResponse.data.id;
      
      // Alle Zeitpunkte für diesen Zeitplan löschen und neu erstellen
      if (editSchedule && editSchedule.id) {
        // Bestehende Zeitpunkte löschen
        await api.delete(`/api/controller/light-schedule-points/?schedule_id=${scheduleId}`);
      }
      
      // Neue Zeitpunkte erstellen
      if (timePoints.length > 0) {
        const pointsData = {
          schedule_id: scheduleId,
          points: timePoints.map(point => ({
            time_point: point.time_point,
            intensity: point.intensity,
            spectrum_red: point.spectrum_red,
            spectrum_blue: point.spectrum_blue,
            transition_duration: point.transition_duration
          }))
        };
        
        await api.post('/api/controller/light-schedule-points/bulk_create/', pointsData);
      }
      
      // Erfolg-Callback aufrufen
      if (onSuccess) {
        onSuccess(scheduleResponse.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Zeitplans:', error);
      setError(error.response?.data?.detail || 'Fehler beim Speichern des Zeitplans');
    } finally {
      setLoading(false);
    }
  };
  
  // Zeit formatieren
  const formatTime = (timeString) => {
    return timeString;
  };
  
  // Zeitpunkte sortieren
  const sortedTimePoints = [...timePoints].sort((a, b) => {
    const timeA = a.time_point.split(':').map(Number);
    const timeB = b.time_point.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editSchedule ? 'Lichtzeitplan bearbeiten' : 'Neuen Lichtzeitplan erstellen'}
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
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LightModeIcon sx={{ mr: 1, fontSize: '1rem', color: theme.palette.warning.main }} />
                  ZEITPLAN-DETAILS
                </Typography>
                
                <TextField
                  label="Name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="z.B. Vegetativer Tag 1, Blütewoche 3, usw."
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="Tag im Zyklus"
                  name="day_in_cycle"
                  type="number"
                  value={formValues.day_in_cycle}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  sx={{ mb: 2 }}
                />
                
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
                
                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    borderRadius: 1, 
                    backgroundColor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Automatische Generierung
                  </Typography>
                  <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                    Erstellen Sie automatisch einen typischen Tageszyklus basierend auf dem Zyklustyp des Controllers.
                  </Typography>
                  <Button 
                    variant="outlined"
                    color="warning"
                    onClick={handleGenerateDayCycle}
                    startIcon={<WbSunnyIcon />}
                    fullWidth
                  >
                    Tageszyklus generieren
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      ZEITPUNKTE
                    </Typography>
                    
                    <Button 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={handleAddPoint}
                    >
                      Zeitpunkt
                    </Button>
                  </Box>
                  
                  {sortedTimePoints.length === 0 ? (
                    <Box 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary" gutterBottom>
                        Keine Zeitpunkte definiert
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Fügen Sie Zeitpunkte hinzu oder generieren Sie einen typischen Tageszyklus.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddPoint}
                      >
                        Zeitpunkt hinzufügen
                      </Button>
                    </Box>
                  ) : (
                    <List 
                      sx={{ 
                        maxHeight: 300, 
                        overflow: 'auto',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1
                      }}
                    >
                      {sortedTimePoints.map((point, index) => (
                        <ListItem 
                          key={point.id || index}
                          sx={{ 
                            borderBottom: index < sortedTimePoints.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            backgroundColor: point.intensity > 0 ? alpha(theme.palette.warning.main, 0.05) : 'transparent'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {point.intensity > 0 ? (
                                  <Brightness7Icon sx={{ mr: 1, color: theme.palette.warning.main }} />
                                ) : (
                                  <Brightness4Icon sx={{ mr: 1, color: theme.palette.text.disabled }} />
                                )}
                                <Typography variant="body2" fontWeight="medium">
                                  {formatTime(point.time_point)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Chip 
                                  size="small" 
                                  label={`${point.intensity}% Intensität`}
                                  sx={{ 
                                    mr: 0.5, 
                                    backgroundColor: point.intensity > 0 ? 
                                      alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                                    color: point.intensity > 0 ? theme.palette.warning.main : theme.palette.text.disabled
                                  }}
                                />
                                {point.transition_duration > 0 && (
                                  <Chip 
                                    size="small" 
                                    icon={<TimerIcon fontSize="small" />}
                                    label={`${point.transition_duration} Min. Übergang`}
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleEditPoint(point)} size="small" sx={{ mr: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeletePoint(point.id)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
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
            color="warning"
          >
            {loading ? 'Wird gespeichert...' : (editSchedule ? 'Aktualisieren' : 'Speichern')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog für Zeitpunkt bearbeiten/erstellen */}
      <Dialog 
        open={pointFormOpen} 
        onClose={() => setPointFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPoint ? 'Zeitpunkt bearbeiten' : 'Neuen Zeitpunkt hinzufügen'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Zeitpunkt"
                  name="time_point"
                  type="time"
                  value={pointFormValues.time_point}
                  onChange={handlePointChange}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 3 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Übergangszeit (Min.)"
                  name="transition_duration"
                  type="number"
                  value={pointFormValues.transition_duration}
                  onChange={handlePointChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 120 }
                  }}
                  sx={{ mb: 3 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Intensität (%)
                </Typography>
                <Slider
                  value={pointFormValues.intensity}
                  onChange={handlePointSliderChange('intensity')}
                  aria-labelledby="intensity-slider"
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: 'Aus' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                  sx={{ 
                    mb: 3,
                    color: theme.palette.warning.main
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Rot-Spektrum (%)
                </Typography>
                <Slider
                  value={pointFormValues.spectrum_red}
                  onChange={handlePointSliderChange('spectrum_red')}
                  aria-labelledby="red-spectrum-slider"
                  valueLabelDisplay="auto"
                  sx={{ 
                    mb: 3,
                    color: theme.palette.error.main
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Blau-Spektrum (%)
                </Typography>
                <Slider
                  value={pointFormValues.spectrum_blue}
                  onChange={handlePointSliderChange('spectrum_blue')}
                  aria-labelledby="blue-spectrum-slider"
                  valueLabelDisplay="auto"
                  sx={{ 
                    mb: 3,
                    color: theme.palette.info.main
                  }}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 1,
                backgroundColor: alpha(
                  pointFormValues.intensity > 0 ? theme.palette.warning.main : theme.palette.grey[500], 
                  0.05
                ),
                border: `1px solid ${alpha(
                  pointFormValues.intensity > 0 ? theme.palette.warning.main : theme.palette.grey[500], 
                  0.1
                )}`
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Vorschau
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Intensität
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.warning.main }}>
                      {pointFormValues.intensity}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Rot
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
                      {pointFormValues.spectrum_red}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Blau
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.info.main }}>
                      {pointFormValues.spectrum_blue}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPointFormOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSavePoint}
            color="warning"
          >
            {editingPoint ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}