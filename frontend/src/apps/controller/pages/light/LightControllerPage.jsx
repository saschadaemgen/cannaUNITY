// frontend/src/apps/controller/pages/Light/LightControllerPage.jsx
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
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import BrightnessLowIcon from '@mui/icons-material/BrightnessLow';
import WbIncandescentIcon from '@mui/icons-material/WbIncandescent';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';

import ReactECharts from 'echarts-for-react';
import api from '@/utils/api';

import LightControllerCard from '../../components/light/LightControllerCard';
import LightCycleCalendar from '../../components/light/LightCycleCalendar';
import LightSpectrumVisualizer from '../../components/light/LightSpectrumVisualizer';
import LightControlForm from '../../components/light/LightControlForm';
import LightScheduleForm from '../../components/light/LightScheduleForm';

export default function LightControllerPage() {
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
  const [openManualLightDialog, setOpenManualLightDialog] = useState(false);
  const [manualLightData, setManualLightData] = useState({
    intensity: 75,
    duration: 60,
    spectrum_red: 80,
    spectrum_blue: 100
  });
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    room: 'all',
    type: 'all'
  });
  
  // Daten laden
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Controller laden
      const res = await api.get('/api/controller/light/');
      setControllers(res.data.results || []);
      
      // Ersten Controller auswählen, wenn noch keiner ausgewählt ist
      if (!selectedControllerId && res.data.results && res.data.results.length > 0) {
        setSelectedControllerId(res.data.results[0].id);
      }
      
      // Zeitpläne für den ausgewählten Controller laden
      if (selectedControllerId) {
        const schedulesRes = await api.get(`/api/controller/light-schedules/?controller_id=${selectedControllerId}`);
        setSchedules(schedulesRes.data || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Lichtcontroller:', error);
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
    setOpenControllerForm(true);
    handleMenuClose();
  };
  
  // Formular für neuen Zeitplan öffnen
  const handleOpenScheduleForm = () => {
    setOpenScheduleForm(true);
    handleMenuClose();
  };
  
  // Dialog für manuelle Lichtsteuerung öffnen
  const handleOpenManualLightDialog = () => {
    setOpenManualLightDialog(true);
    handleMenuClose();
  };
  
  // Manuelle Lichtsteuerung durchführen
  const handleManualLightControl = async () => {
    if (!selectedControllerId) return;
    
    try {
      await api.post(`/api/controller/light/${selectedControllerId}/manual_light_control/`, manualLightData);
      // Erfolgsmeldung anzeigen oder Daten neu laden
      loadData();
    } catch (error) {
      console.error('Fehler bei der manuellen Lichtsteuerung:', error);
    } finally {
      setOpenManualLightDialog(false);
    }
  };
  
  // Notfall-Aus aktivieren/deaktivieren
  const handleEmergencyOff = async (controllerId, currentStatus) => {
    try {
      await api.post(`/api/controller/light/${controllerId}/emergency_off/`, {
        status: !currentStatus
      });
      // Controller-Daten neu laden
      loadData();
    } catch (error) {
      console.error('Fehler beim Ändern des Notfall-Aus:', error);
    }
  };
  
  // Tag im Zyklus erhöhen
  const handleAdvanceCycleDay = async (controllerId) => {
    try {
      await api.post(`/api/controller/light/${controllerId}/advance_cycle_day/`);
      // Controller-Daten neu laden
      loadData();
    } catch (error) {
      console.error('Fehler beim Erhöhen des Zyklustags:', error);
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
    
    if (filterOptions.type !== 'all' && controller.light_type !== filterOptions.type) {
      return false;
    }
    
    return true;
  });
  
  // Ausgewählter Controller
  const selectedController = controllers.find(c => c.id === selectedControllerId);
  
  // Lichtzyklusverlauf über 24h visualisieren
  const getLightCycleOptions = () => {
    // Für jeden Tag im Zyklus ein anderes Diagramm erstellen
    const selectedDay = 1; // Standardmäßig Tag 1
    
    // Zeitpunkte für diesen Tag finden
    const daySchedule = schedules.find(s => s.day_in_cycle === selectedDay);
    
    if (!daySchedule || !daySchedule.points || daySchedule.points.length === 0) {
      // Dummy-Daten, wenn keine Zeitpunkte vorhanden sind
      return {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c}% Intensität'
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          axisLabel: { interval: 2 }
        },
        yAxis: {
          type: 'value',
          name: 'Intensität (%)',
          min: 0,
          max: 100
        },
        series: [{
          name: 'Lichtintensität',
          type: 'line',
          smooth: true,
          data: Array(24).fill(0)
        }]
      };
    }
    
    // Sortierte Zeitpunkte
    const sortedPoints = [...daySchedule.points].sort((a, b) => {
      const timeA = a.time_point.split(':').map(Number);
      const timeB = b.time_point.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
    
    // 24h-Verlauf mit Interpolation erstellen
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const intensityData = Array(24).fill(0);
    const redData = Array(24).fill(0);
    const blueData = Array(24).fill(0);
    
    // Für jeden Zeitpunkt die entsprechende Stunde setzen
    sortedPoints.forEach(point => {
      const [hour, minute] = point.time_point.split(':').map(Number);
      const hourIndex = hour;
      
      intensityData[hourIndex] = point.intensity;
      redData[hourIndex] = point.spectrum_red;
      blueData[hourIndex] = point.spectrum_blue;
    });
    
    // Einfache lineare Interpolation für die Übergänge
    for (let i = 0; i < 24; i++) {
      if (intensityData[i] === 0 && i > 0) {
        // Finde den nächsten nicht-null Wert
        let nextValue = 0;
        let nextIndex = -1;
        for (let j = i + 1; j < 24; j++) {
          if (intensityData[j] !== 0) {
            nextValue = intensityData[j];
            nextIndex = j;
            break;
          }
        }
        
        if (nextIndex !== -1) {
          // Interpolieren
          const prevValue = intensityData[i - 1];
          const steps = nextIndex - (i - 1);
          const step = (nextValue - prevValue) / steps;
          
          intensityData[i] = prevValue + step;
          
          // Auch Spektrum interpolieren
          const redStep = (redData[nextIndex] - redData[i - 1]) / steps;
          const blueStep = (blueData[nextIndex] - blueData[i - 1]) / steps;
          
          redData[i] = redData[i - 1] + redStep;
          blueData[i] = blueData[i - 1] + blueStep;
        }
      }
    }
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const intensity = params[0].value;
          const red = params[1].value;
          const blue = params[2].value;
          return `${params[0].name}<br/>
                 ${params[0].seriesName}: ${intensity.toFixed(0)}%<br/>
                 ${params[1].seriesName}: ${red.toFixed(0)}%<br/>
                 ${params[2].seriesName}: ${blue.toFixed(0)}%`;
        }
      },
      legend: {
        data: ['Intensität', 'Rot-Spektrum', 'Blau-Spektrum'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLabel: { interval: 2 }
      },
      yAxis: {
        type: 'value',
        name: 'Prozent (%)',
        min: 0,
        max: 100
      },
      series: [
        {
          name: 'Intensität',
          type: 'line',
          smooth: true,
          data: intensityData,
          lineStyle: { width: 4 },
          itemStyle: { color: '#ffc107' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: alpha('#ffc107', 0.5) },
              { offset: 1, color: alpha('#ffc107', 0.1) }
            ])
          }
        },
        {
          name: 'Rot-Spektrum',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: redData,
          lineStyle: { width: 2 },
          itemStyle: { color: '#f44336' }
        },
        {
          name: 'Blau-Spektrum',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: blueData,
          lineStyle: { width: 2 },
          itemStyle: { color: '#2196f3' }
        }
      ]
    };
  };

  // Einfache Dummy-Komponente, falls die Komponenten noch nicht erstellt wurden
  const LightControllerCardTemp = ({ controller, selected, onSelect, onEmergencyOff }) => (
    <Paper 
      variant={selected ? "elevation" : "outlined"}
      elevation={selected ? 2 : 0}
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        cursor: 'pointer',
        borderLeft: `4px solid ${controller.emergency_off ? theme.palette.error.main : (controller.is_active ? theme.palette.success.main : theme.palette.grey[500])}`,
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
      }}
      onClick={onSelect}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1">{controller.name}</Typography>
        <Chip 
          size="small"
          label={controller.emergency_off ? "Notfall-Aus" : (controller.is_active ? "Aktiv" : "Inaktiv")}
          color={controller.emergency_off ? "error" : (controller.is_active ? "success" : "default")}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">{controller.light_type_display}</Typography>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Chip label={`${controller.current_day_in_cycle}. Tag im Zyklus`} size="small" />
        <Button
          size="small"
          variant="outlined"
          color={controller.emergency_off ? "primary" : "error"}
          onClick={(e) => {
            e.stopPropagation();
            onEmergencyOff(controller.id, controller.emergency_off);
          }}
        >
          {controller.emergency_off ? "Freigeben" : "Notfall-Aus"}
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 0 }}>
                Lichtsteuerung
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Verwalten und überwachen Sie Ihre Lichtcontroller und Zeitpläne
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
                <MenuItem onClick={handleOpenManualLightDialog} disabled={!selectedControllerId}>Manuelle Steuerung</MenuItem>
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
                    <InputLabel>Lichttyp</InputLabel>
                    <Select
                      value={filterOptions.type}
                      onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
                      label="Lichttyp"
                    >
                      <MenuItem value="all">Alle Typen</MenuItem>
                      <MenuItem value="led">LED</MenuItem>
                      <MenuItem value="hps">HPS (Natriumdampf)</MenuItem>
                      <MenuItem value="mh">MH (Metallhalogen)</MenuItem>
                      <MenuItem value="cfl">CFL (Energiesparlampe)</MenuItem>
                      <MenuItem value="mixed">Gemischt</MenuItem>
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
              <Typography variant="h6" gutterBottom>Keine Lichtcontroller gefunden</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Erstellen Sie Ihren ersten Lichtcontroller, um loszulegen.
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
                    backgroundColor: alpha(theme.palette.warning.main, 0.05)
                  }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Verfügbare Controller ({filteredControllers.length})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', p: 2 }}>
                    {filteredControllers.map(controller => (
                      <LightControllerCardTemp
                        key={controller.id}
                        controller={controller}
                        selected={controller.id === selectedControllerId}
                        onSelect={() => handleControllerSelect(controller.id)}
                        onEmergencyOff={() => handleEmergencyOff(controller.id, controller.emergency_off)}
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
                                  icon={<WbIncandescentIcon fontSize="small" />} 
                                  label={selectedController.light_type_display}
                                  size="small"
                                  color="warning"
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
                                  icon={<BrightnessAutoIcon fontSize="small" />} 
                                  label={selectedController.cycle_type_display}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                                
                                {selectedController.emergency_off && (
                                  <Chip 
                                    icon={<WarningIcon fontSize="small" />} 
                                    label="Notfall-Aus aktiv"
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            <Box>
                              <Button 
                                variant="contained" 
                                color={selectedController.emergency_off ? "warning" : "error"}
                                startIcon={selectedController.emergency_off ? <PlayArrowIcon /> : <StopIcon />}
                                onClick={() => handleEmergencyOff(selectedController.id, selectedController.emergency_off)}
                                sx={{ mb: 1 }}
                              >
                                {selectedController.emergency_off ? "Notfall-Aus aufheben" : "Notfall-Aus"}
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
                                  LICHT-DETAILS
                                </Typography>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Typ</Typography>
                                    <Typography variant="body1">{selectedController.light_type_display}</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Max. Leistung</Typography>
                                    <Typography variant="body1">{selectedController.max_power} W</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Spektrum</Typography>
                                    <Typography variant="body1">
                                      {selectedController.spectrum_type || "Standard"}
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Zyklustyp</Typography>
                                    <Typography variant="body1">{selectedController.cycle_type_display}</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Aktueller Tag</Typography>
                                    <Typography variant="body1">{selectedController.current_day_in_cycle}. Tag</Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Stromverbrauch</Typography>
                                    <Typography variant="body1">{selectedController.energy_consumption.toFixed(1)} kWh</Typography>
                                  </Box>
                                </Box>
                                
                                <Box sx={{ flexGrow: 1 }} />
                                
                                <Button 
                                  variant="contained"
                                  color="primary"
                                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                                  onClick={() => handleAdvanceCycleDay(selectedController.id)}
                                >
                                  Tag erhöhen
                                </Button>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  height: '100%',
                                  backgroundImage: 'linear-gradient(to bottom, rgba(255, 193, 7, 0.05), rgba(255, 193, 7, 0.01))'
                                }}
                              >
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  AKTUELLER LICHTSTATUS
                                </Typography>
                                
                                {selectedController.status?.current_light_state ? (
                                  <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="body2">Lichtzustand</Typography>
                                      <Chip 
                                        label={selectedController.status.current_light_state.is_on ? "An" : "Aus"} 
                                        color={selectedController.status.current_light_state.is_on ? "success" : "default"} 
                                        size="small"
                                      />
                                    </Box>
                                    
                                    {selectedController.status.current_light_state.is_on && (
                                      <>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                          <Typography variant="body2">Intensität</Typography>
                                          <Typography variant="body2" fontWeight="medium">
                                            {selectedController.status.current_light_state.intensity}%
                                          </Typography>
                                        </Box>
                                        
                                        <Box sx={{ mb: 3 }}>
                                          <Slider
                                            value={selectedController.status.current_light_state.intensity}
                                            disabled
                                            aria-labelledby="intensity-slider"
                                            valueLabelDisplay="off"
                                            sx={{
                                              color: theme.palette.warning.main,
                                              height: 8,
                                              '& .MuiSlider-thumb': {
                                                display: 'none'
                                              }
                                            }}
                                          />
                                        </Box>
                                        
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                          SPEKTRUM
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1 }}>
                                          <Box sx={{ width: '50%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <Typography variant="caption">Rot</Typography>
                                              <Typography variant="caption" fontWeight="medium">
                                                {selectedController.status.current_light_state.spectrum_red}%
                                              </Typography>
                                            </Box>
                                            <Slider
                                              value={selectedController.status.current_light_state.spectrum_red}
                                              disabled
                                              size="small"
                                              sx={{ color: '#f44336' }}
                                            />
                                          </Box>
                                          
                                          <Box sx={{ width: '50%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <Typography variant="caption">Blau</Typography>
                                              <Typography variant="caption" fontWeight="medium">
                                                {selectedController.status.current_light_state.spectrum_blue}%
                                              </Typography>
                                            </Box>
                                            <Slider
                                              value={selectedController.status.current_light_state.spectrum_blue}
                                              disabled
                                              size="small"
                                              sx={{ color: '#2196f3' }}
                                            />
                                          </Box>
                                        </Box>
                                      </>
                                    )}
                                    
                                    <Box sx={{ mt: 3 }}>
                                      <Button 
                                        variant="contained" 
                                        startIcon={selectedController.status.current_light_state.is_on ? <BrightnessLowIcon /> : <BrightnessMediumIcon />}
                                        color={selectedController.status.current_light_state.is_on ? "warning" : "primary"}
                                        onClick={handleOpenManualLightDialog}
                                        fullWidth
                                      >
                                        Licht {selectedController.status.current_light_state.is_on ? "dimmen" : "einschalten"}
                                      </Button>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    height: 'calc(100% - 24px)'
                                  }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                      Kein aktueller Lichtstatus verfügbar.
                                    </Typography>
                                    <Button 
                                      variant="contained" 
                                      startIcon={<BrightnessMediumIcon />}
                                      onClick={handleOpenManualLightDialog}
                                    >
                                      Licht manuell steuern
                                    </Button>
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {/* Aktueller Tageszyklus */}
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              mt: 3, 
                              p: 2, 
                              backgroundImage: 'linear-gradient(to bottom, rgba(255, 193, 7, 0.05), rgba(255, 193, 7, 0.01))'
                            }}
                          >
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              TAGESZYKLUS - TAG {selectedController.current_day_in_cycle}
                            </Typography>
                            
                            <Box sx={{ height: 250 }}>
                              <ReactECharts 
                                option={getLightCycleOptions()} 
                                style={{ height: '100%', width: '100%' }} 
                              />
                            </Box>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Weitere Tabs hier implementieren */}
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
      
      {/* Dialog für manuelle Lichtsteuerung */}
      <Dialog 
        open={openManualLightDialog} 
        onClose={() => setOpenManualLightDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manuelle Lichtsteuerung</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Intensität (%)</Typography>
            <Slider
              value={manualLightData.intensity}
              onChange={(e, newValue) => setManualLightData({...manualLightData, intensity: newValue})}
              aria-labelledby="intensity-slider"
              valueLabelDisplay="auto"
              min={0}
              max={100}
              marks={[
                { value: 0, label: 'Aus' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
            />
            
            <Typography gutterBottom sx={{ mt: 3 }}>Rot-Spektrum (%)</Typography>
            <Slider
              value={manualLightData.spectrum_red}
              onChange={(e, newValue) => setManualLightData({...manualLightData, spectrum_red: newValue})}
              aria-labelledby="red-spectrum-slider"
              valueLabelDisplay="auto"
              min={0}
              max={100}
              sx={{ color: '#f44336' }}
            />
            
            <Typography gutterBottom sx={{ mt: 3 }}>Blau-Spektrum (%)</Typography>
            <Slider
              value={manualLightData.spectrum_blue}
              onChange={(e, newValue) => setManualLightData({...manualLightData, spectrum_blue: newValue})}
              aria-labelledby="blue-spectrum-slider"
              valueLabelDisplay="auto"
              min={0}
              max={100}
              sx={{ color: '#2196f3' }}
            />
            
            <Typography gutterBottom sx={{ mt: 3 }}>Dauer (Minuten, 0 = unbegrenzt)</Typography>
            <Slider
              value={manualLightData.duration}
              onChange={(e, newValue) => setManualLightData({...manualLightData, duration: newValue})}
              aria-labelledby="duration-slider"
              valueLabelDisplay="auto"
              min={0}
              max={360}
              step={15}
              marks={[
                { value: 0, label: 'Unbegrenzt' },
                { value: 60, label: '1h' },
                { value: 180, label: '3h' },
                { value: 360, label: '6h' }
              ]}
            />
            
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Zusammenfassung</Typography>
              <Typography variant="body2">
                {manualLightData.intensity === 0 ? 
                  "Licht ausschalten" : 
                  `Licht mit ${manualLightData.intensity}% Intensität, ${manualLightData.spectrum_red}% Rot und ${manualLightData.spectrum_blue}% Blau ${manualLightData.duration === 0 ? "dauerhaft einschalten" : `für ${manualLightData.duration} Minuten einschalten`}.`}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualLightDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleManualLightControl}
            startIcon={<WbSunnyIcon />}
            color="warning"
          >
            Anwenden
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Formulare als Dialoge hier implementieren */}
    </Container>
  );
}