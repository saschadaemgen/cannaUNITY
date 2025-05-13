// frontend/src/apps/controller/pages/Irrigation/IrrigationControllerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Chip, 
  CircularProgress, Fade, Tabs, Tab, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Slider,
  FormControl, InputLabel, Select
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import OpacityIcon from '@mui/icons-material/Opacity';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';

import ReactECharts from 'echarts-for-react';
import api from '@/utils/api';

// Eigene Komponenten für die Bewässerungssteuerung
import IrrigationControllerCard from '../../components/irrigation/IrrigationControllerCard';
import ScheduleCalendar from '../../components/irrigation/ScheduleCalendar';
import IrrigationForm from '../../components/irrigation/IrrigationForm';
import ScheduleForm from '../../components/irrigation/ScheduleForm';

export default function IrrigationControllerPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [controllers, setControllers] = useState([]);
  const [selectedControllerId, setSelectedControllerId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [openControllerForm, setOpenControllerForm] = useState(false);
  const [openScheduleForm, setOpenScheduleForm] = useState(false);
  const [openManualIrrigationDialog, setOpenManualIrrigationDialog] = useState(false);
  const [manualIrrigationData, setManualIrrigationData] = useState({
    duration: 5,
    intensity: 75
  });
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    room: 'all',
    type: 'all'
  });
  // Neue Zustandsvariablen für Bearbeiten und Löschen
  const [editingController, setEditingController] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [controllerToDelete, setControllerToDelete] = useState(null);
  
  // Daten laden
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Controller laden
      const res = await api.get('/controller/irrigation/');
      setControllers(res.data.results || []);
      
      // Ersten Controller auswählen, wenn noch keiner ausgewählt ist
      if (!selectedControllerId && res.data.results && res.data.results.length > 0) {
        setSelectedControllerId(res.data.results[0].id);
      }
      
      // Zeitpläne für den ausgewählten Controller laden
      if (selectedControllerId) {
        const schedulesRes = await api.get(`/controller/irrigation-schedules/?controller_id=${selectedControllerId}`);
        setSchedules(schedulesRes.data.results || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bewässerungscontroller:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedControllerId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Controller-Auswahl
  const handleControllerSelect = (controllerId) => {
    setSelectedControllerId(controllerId);
  };
  
  // Tab-Wechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Menü-Funktionen
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Formular für neuen Controller öffnen
  const handleOpenControllerForm = () => {
    setEditingController(null); // Sicherstellen, dass wir keinen Controller editieren
    setOpenControllerForm(true);
    handleMenuClose();
  };
  
  // Formular für Controller-Bearbeitung öffnen
  const handleEditController = (controller) => {
    setEditingController(controller);
    setOpenControllerForm(true);
  };
  
  // Controller-Löschung initiieren
  const handleDeleteController = (controller) => {
    setControllerToDelete(controller);
    setDeleteConfirmOpen(true);
  };
  
  // Controller-Löschung bestätigen und durchführen
  const confirmDeleteController = async () => {
    if (!controllerToDelete) return;
    
    try {
      await api.delete(`/controller/irrigation/${controllerToDelete.id}/`);
      // Nach erfolgreichem Löschen Daten neu laden
      loadData();
      // Dialog schließen
      setDeleteConfirmOpen(false);
      setControllerToDelete(null);
      // Wenn der gelöschte Controller der aktuell ausgewählte war, Auswahl zurücksetzen
      if (selectedControllerId === controllerToDelete.id) {
        setSelectedControllerId(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Controllers:', error);
      // Hier könnte man eine Fehlermeldung anzeigen
    }
  };
  
  // Formular für neuen Zeitplan öffnen
  const handleOpenScheduleForm = () => {
    setOpenScheduleForm(true);
    handleMenuClose();
  };
  
  // Dialog für manuelle Bewässerung öffnen
  const handleOpenManualIrrigationDialog = () => {
    setOpenManualIrrigationDialog(true);
    handleMenuClose();
  };
  
  // Manuelle Bewässerung durchführen
  const handleManualIrrigation = async () => {
    if (!selectedControllerId) return;
    
    try {
      await api.post(`/controller/irrigation/${selectedControllerId}/manual_irrigation/`, manualIrrigationData);
      // Erfolgsmeldung anzeigen oder Daten neu laden
      loadData();
    } catch (error) {
      console.error('Fehler bei der manuellen Bewässerung:', error);
    } finally {
      setOpenManualIrrigationDialog(false);
    }
  };
  
  // Notfall-Stopp aktivieren/deaktivieren
  const handleEmergencyStop = async (controllerId, currentStatus) => {
    try {
      await api.post(`/controller/irrigation/${controllerId}/emergency_stop/`, {
        status: !currentStatus
      });
      // Controller-Daten neu laden
      loadData();
    } catch (error) {
      console.error('Fehler beim Ändern des Notfall-Stopps:', error);
    }
  };
  
  // Gefilterte Controller basierend auf den Filteroptionen
  const filteredControllers = controllers.filter(controller => {
    if (filterOptions.status !== 'all' && 
        ((filterOptions.status === 'active' && !controller.is_active) || 
         (filterOptions.status === 'inactive' && controller.is_active))) {
      return false;
    }
    
    if (filterOptions.room !== 'all' && controller.room?.id !== filterOptions.room) {
      return false;
    }
    
    if (filterOptions.type !== 'all' && controller.pump_type !== filterOptions.type) {
      return false;
    }
    
    return true;
  });
  
  // Ausgewählter Controller
  const selectedController = controllers.find(c => c.id === selectedControllerId);
  
  // Wöchentliche Bewässerungszeit visualisieren
  const getScheduleHeatmapOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    // Daten für die Heatmap vorbereiten
    const data = [];
    
    // Zeitpläne in Heatmap-Daten umwandeln
    schedules.forEach(schedule => {
      if (!schedule.is_active) return;
      
      const day = schedule.day_of_week !== null ? schedule.day_of_week : 0; // 0 für tägliche Pläne
      const startHour = parseInt(schedule.start_time.split(':')[0]);
      const durationHours = schedule.duration / 60; // Minuten in Stunden umrechnen
      
      // Intensität für jeden betroffenen Stundenschritt setzen
      for (let h = 0; h < durationHours; h += 0.5) {
        if (startHour + h >= 24) continue;
        
        if (day === null) {
          // Täglicher Plan - für jeden Tag eintragen
          for (let d = 0; d < 7; d++) {
            data.push([d, Math.floor((startHour + h) * 2) / 2, schedule.intensity]);
          }
        } else {
          data.push([day, Math.floor((startHour + h) * 2) / 2, schedule.intensity]);
        }
      }
    });
    
    return {
      tooltip: {
        position: 'top',
        formatter: function (params) {
          return `${days[params.data[0]]}, ${hours[params.data[1]]}: ${params.data[2]}% Intensität`;
        }
      },
      grid: {
        height: '50%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        text: ['Intensität %'],
        color: ['#1976d2', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b']
      },
      series: [{
        name: 'Bewässerungsplan',
        type: 'heatmap',
        data: data,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 0 }}>
                Bewässerungssteuerung
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Verwalten und überwachen Sie Ihre Bewässerungscontroller und Zeitpläne
              </Typography>
            </Box>
            
            <Box>
              <IconButton onClick={handleFilterMenuOpen} sx={{ mr: 1 }}>
                <FilterListIcon />
              </IconButton>
              <IconButton onClick={loadData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleMenuOpen}
              >
                Neu
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleOpenControllerForm}>Neuer Controller</MenuItem>
                <MenuItem onClick={handleOpenScheduleForm} disabled={!selectedControllerId}>Neuer Zeitplan</MenuItem>
                <MenuItem onClick={handleOpenManualIrrigationDialog} disabled={!selectedControllerId}>Manuelle Bewässerung</MenuItem>
              </Menu>
              
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleFilterMenuClose}
              >
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterOptions.status}
                      onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
                      label="Status"
                    >
                      <MenuItem value="all">Alle Status</MenuItem>
                      <MenuItem value="active">Aktiv</MenuItem>
                      <MenuItem value="inactive">Inaktiv</MenuItem>
                    </Select>
                  </FormControl>
                </MenuItem>
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Raum</InputLabel>
                    <Select
                      value={filterOptions.room}
                      onChange={(e) => setFilterOptions({...filterOptions, room: e.target.value})}
                      label="Raum"
                    >
                      <MenuItem value="all">Alle Räume</MenuItem>
                      {/* Dynamisch die Räume aus den vorhandenen Controllern laden */}
                      {Array.from(new Set(controllers.map(c => c.room?.id))).map(roomId => {
                        if (!roomId) return null;
                        const room = controllers.find(c => c.room?.id === roomId)?.room;
                        return (
                          <MenuItem key={roomId} value={roomId}>{room.name}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </MenuItem>
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Pumpentyp</InputLabel>
                    <Select
                      value={filterOptions.type}
                      onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
                      label="Pumpentyp"
                    >
                      <MenuItem value="all">Alle Typen</MenuItem>
                      <MenuItem value="drip">Tropfbewässerung</MenuItem>
                      <MenuItem value="sprinkler">Sprinkler</MenuItem>
                      <MenuItem value="flood">Flut</MenuItem>
                      <MenuItem value="mist">Vernebelung</MenuItem>
                      <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                    </Select>
                  </FormControl>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : controllers.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Keine Bewässerungscontroller gefunden</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Erstellen Sie Ihren ersten Bewässerungscontroller, um loszulegen.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenControllerForm}
              >
                Controller erstellen
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {/* Controller-Karten */}
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 0, borderRadius: 2, height: '100%' }}>
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Verfügbare Controller ({filteredControllers.length})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', p: 2 }}>
                    {filteredControllers.map(controller => (
                      <IrrigationControllerCard
                        key={controller.id}
                        controller={controller}
                        selected={controller.id === selectedControllerId}
                        onSelect={() => handleControllerSelect(controller.id)}
                        onEmergencyStop={() => handleEmergencyStop(controller.id, controller.emergency_stop)}
                        onEdit={() => handleEditController(controller)}
                        onDelete={() => handleDeleteController(controller)}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Controller-Details */}
              <Grid item xs={12} lg={8}>
                {selectedController ? (
                  <Paper sx={{ borderRadius: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs value={tabValue} onChange={handleTabChange} aria-label="controller tabs">
                        <Tab label="Übersicht" id="tab-0" />
                        <Tab label="Zeitplan" id="tab-1" />
                        <Tab label="Statistik" id="tab-2" />
                        <Tab label="Protokoll" id="tab-3" />
                      </Tabs>
                    </Box>
                    
                    {/* Übersicht Tab */}
                    <Box
                      role="tabpanel"
                      hidden={tabValue !== 0}
                      id={`tabpanel-0`}
                      aria-labelledby={`tab-0`}
                      sx={{ p: 3 }}
                    >
                      {tabValue === 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                              <Typography variant="h6">
                                {selectedController.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedController.description}
                              </Typography>
                              
                              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Chip 
                                  icon={<OpacityIcon fontSize="small" />} 
                                  label={selectedController.pump_type_display}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                
                                {selectedController.room && (
                                  <Chip 
                                    label={selectedController.room.name}
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                  />
                                )}
                                
                                <Chip 
                                  icon={<SpeedIcon fontSize="small" />} 
                                  label={`${parseFloat(selectedController.flow_rate || 0).toFixed(1)} l/min`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                                
                                {selectedController.emergency_stop && (
                                  <Chip 
                                    icon={<WarningIcon fontSize="small" />} 
                                    label="Notfall-Stopp aktiv"
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            <Box>
                              <Button 
                                variant="contained" 
                                color={selectedController.emergency_stop ? "error" : "primary"}
                                startIcon={selectedController.emergency_stop ? <PlayArrowIcon /> : <StopIcon />}
                                onClick={() => handleEmergencyStop(selectedController.id, selectedController.emergency_stop)}
                                sx={{ mb: 1 }}
                              >
                                {selectedController.emergency_stop ? "Notfall-Stopp aufheben" : "Notfall-Stopp"}
                              </Button>
                              
                              <Button 
                                variant="outlined" 
                                startIcon={<ScheduleIcon />}
                                fullWidth
                                onClick={handleOpenScheduleForm}
                              >
                                Zeitplan bearbeiten
                              </Button>
                            </Box>
                          </Box>
                          
                          <Grid container spacing={2} mt={2}>
                            <Grid item xs={12} md={6}>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  height: '100%', 
                                  display: 'flex',
                                  flexDirection: 'column'
                                }}
                              >
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  BEWÄSSERUNGS-DETAILS
                                </Typography>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Quelle</Typography>
                                    <Typography variant="body1">{selectedController.water_source || "Nicht angegeben"}</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Durchflussrate</Typography>
                                    <Typography variant="body1">{parseFloat(selectedController.flow_rate || 0).toFixed(1)} l/min</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Max pro Tag</Typography>
                                    <Typography variant="body1">
                                      {selectedController.max_volume_per_day ? 
                                        `${parseFloat(selectedController.max_volume_per_day || 0).toFixed(1)} l` : 
                                        "Unbegrenzt"}
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Zeitplantyp</Typography>
                                    <Typography variant="body1">{selectedController.schedule_type_display}</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Gesamtverbrauch</Typography>
                                    <Typography variant="body1">{parseFloat(selectedController.total_volume_used || 0).toFixed(1)} l</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Sensor-Feedback</Typography>
                                    <Typography variant="body1">{selectedController.sensor_feedback_enabled ? "Aktiviert" : "Deaktiviert"}</Typography>
                                  </Box>
                                </Box>
                                
                                <Box sx={{ flexGrow: 1 }} />
                                
                                <Button 
                                  variant="contained"
                                  color="primary"
                                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                                  onClick={handleOpenManualIrrigationDialog}
                                >
                                  Manuelle Bewässerung
                                </Button>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  height: '100%',
                                  backgroundImage: 'linear-gradient(to bottom, rgba(3, 169, 244, 0.05), rgba(3, 169, 244, 0.01))'
                                }}
                              >
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  AKTUELLE ZEITPLÄNE
                                </Typography>
                                
                                {schedules.length === 0 ? (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    height: 'calc(100% - 24px)'
                                  }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                      Keine Zeitpläne konfiguriert.
                                    </Typography>
                                    <Button 
                                      variant="outlined" 
                                      startIcon={<AddIcon />}
                                      size="small"
                                      onClick={handleOpenScheduleForm}
                                    >
                                      Zeitplan hinzufügen
                                    </Button>
                                  </Box>
                                ) : (
                                  <Box sx={{ mt: 1 }}>
                                    {schedules.map((schedule, index) => (
                                      <Box 
                                        key={schedule.id} 
                                        sx={{ 
                                          p: 1, 
                                          mb: 1, 
                                          borderRadius: 1,
                                          backgroundColor: schedule.is_active ? 
                                            alpha(theme.palette.primary.main, 0.05) : 
                                            alpha(theme.palette.grey[500], 0.05),
                                          border: `1px solid ${schedule.is_active ? 
                                            alpha(theme.palette.primary.main, 0.1) : 
                                            alpha(theme.palette.grey[500], 0.1)}`
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                              {schedule.day_of_week !== null ? 
                                                `${schedule.day_of_week_display}, ` : 
                                                "Täglich, "}
                                              {schedule.start_time} Uhr
                                              {!schedule.is_active && " (inaktiv)"}
                                            </Typography>
                                          </Box>
                                          <Chip 
                                            label={`${parseFloat(schedule.duration || 0)} min, ${parseFloat(schedule.intensity || 0)}%`}
                                            size="small"
                                            variant="outlined"
                                            color={schedule.is_active ? "primary" : "default"}
                                          />
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Zeitplan Tab */}
                    <Box
                      role="tabpanel"
                      hidden={tabValue !== 1}
                      id={`tabpanel-1`}
                      aria-labelledby={`tab-1`}
                      sx={{ p: 3 }}
                    >
                      {tabValue === 1 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>Bewässerungszeitplan</Typography>
                          
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              height: '400px',
                              mb: 3,
                              backgroundImage: 'linear-gradient(to bottom, rgba(3, 169, 244, 0.05), rgba(3, 169, 244, 0.01))'
                            }}
                          >
                            {schedules.length === 0 ? (
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: 'calc(100% - 24px)'
                              }}>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                  Keine Zeitpläne konfiguriert.
                                </Typography>
                                <Button 
                                  variant="contained" 
                                  startIcon={<AddIcon />}
                                  onClick={handleOpenScheduleForm}
                                >
                                  Zeitplan hinzufügen
                                </Button>
                              </Box>
                            ) : (
                              <ReactECharts 
                                option={getScheduleHeatmapOptions()} 
                                style={{ height: '100%', width: '100%' }} 
                              />
                            )}
                          </Paper>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                              variant="contained" 
                              startIcon={<AddIcon />}
                              onClick={handleOpenScheduleForm}
                            >
                              Neuer Zeitplan
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Statistik Tab */}
                    <Box
                      role="tabpanel"
                      hidden={tabValue !== 2}
                      id={`tabpanel-2`}
                      aria-labelledby={`tab-2`}
                      sx={{ p: 3 }}
                    >
                      {tabValue === 2 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>Bewässerungsstatistik</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Detaillierte Statistiken für {selectedController.name}
                          </Typography>
                          
                          {/* Hier würden weitere Statistiken und Diagramme angezeigt */}
                        </Box>
                      )}
                    </Box>
                    
                    {/* Protokoll Tab */}
                    <Box
                      role="tabpanel"
                      hidden={tabValue !== 3}
                      id={`tabpanel-3`}
                      aria-labelledby={`tab-3`}
                      sx={{ p: 3 }}
                    >
                      {tabValue === 3 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>Bewässerungsprotokolle</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Aktivitätsprotokolle für {selectedController.name}
                          </Typography>
                          
                          {/* Hier würden die Protokolldaten angezeigt */}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Bitte wählen Sie einen Controller aus, um die Details anzuzeigen.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Fade>
      
      {/* Dialog für manuelle Bewässerung */}
      <Dialog 
        open={openManualIrrigationDialog} 
        onClose={() => setOpenManualIrrigationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manuelle Bewässerung</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Dauer (Minuten)</Typography>
            <Slider
              value={manualIrrigationData.duration}
              onChange={(e, newValue) => setManualIrrigationData({...manualIrrigationData, duration: newValue})}
              aria-labelledby="duration-slider"
              valueLabelDisplay="auto"
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
            
            <Typography gutterBottom sx={{ mt: 3 }}>Intensität (%)</Typography>
            <Slider
              value={manualIrrigationData.intensity}
              onChange={(e, newValue) => setManualIrrigationData({...manualIrrigationData, intensity: newValue})}
              aria-labelledby="intensity-slider"
              valueLabelDisplay="auto"
              min={10}
              max={100}
              marks={[
                { value: 10, label: '10%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
            />
            
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Zusammenfassung</Typography>
              <Typography variant="body2">
                {selectedController && `${manualIrrigationData.duration} Minuten mit ${manualIrrigationData.intensity}% Intensität entspricht etwa ${((parseFloat(selectedController.flow_rate || 0) * manualIrrigationData.duration * manualIrrigationData.intensity) / 100).toFixed(1)} Liter Wasser.`}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualIrrigationDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleManualIrrigation}
            startIcon={<OpacityIcon />}
          >
            Jetzt bewässern
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Formulare als Dialoge */}
      {openControllerForm && (
        <IrrigationForm 
          open={openControllerForm}
          onClose={() => {
            setOpenControllerForm(false);
            setEditingController(null);
          }}
          onSuccess={() => {
            setOpenControllerForm(false);
            setEditingController(null);
            loadData();
          }}
          editController={editingController}
        />
      )}
      
      {openScheduleForm && selectedControllerId && (
        <ScheduleForm 
          open={openScheduleForm}
          onClose={() => setOpenScheduleForm(false)}
          onSuccess={() => {
            setOpenScheduleForm(false);
            loadData();
          }}
          controllerId={selectedControllerId}
          editSchedule={null}
        />
      )}
      
      {/* Dialog für Löschbestätigung */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Controller löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie den Controller "{controllerToDelete?.name}" löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={confirmDeleteController} 
            color="error" 
            variant="contained"
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}