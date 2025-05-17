// frontend/src/apps/controller/pages/Irrigation/IrrigationControllerPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Chip, 
  CircularProgress, Fade, Tabs, Tab, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Slider,
  FormControl, InputLabel, Select, Zoom, Tooltip, useMediaQuery
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import OpacityIcon from '@mui/icons-material/Opacity';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListIcon from '@mui/icons-material/List';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ReactECharts from 'echarts-for-react';
import api from '@/utils/api';

// Eigene Komponenten für die Bewässerungssteuerung
import IrrigationControllerCard from '../../components/irrigation/IrrigationControllerCard';
import ScheduleCalendar from '../../components/irrigation/ScheduleCalendar';
import IrrigationForm from '../../components/irrigation/IrrigationForm';
import ScheduleForm from '../../components/irrigation/ScheduleForm';

export default function IrrigationControllerPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Grün-Farbschema konsistent mit anderen Komponenten
  const greenPalette = {
    main: theme.palette.success.main,
    light: theme.palette.success.light,
    dark: theme.palette.success.dark
  };
  
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
  
  // Ref für die Initialisierungsprüfung
  const hasInitializedRef = useRef(false);
  
  // Getrennte Funktionen für Controller und Zeitpläne
  const fetchControllers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/controller/irrigation/');
      const controllers = res.data.results || [];
      setControllers(controllers);
      
      // Ersten Controller auswählen, wenn noch keiner ausgewählt ist
      if (!selectedControllerId && controllers.length > 0) {
        setSelectedControllerId(controllers[0].id);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bewässerungscontroller:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedControllerId]); // selectedControllerId nur als Bedingung
  
  const fetchSchedules = useCallback(async () => {
    if (!selectedControllerId) return;
    
    try {
      const schedulesRes = await api.get(`/controller/irrigation-schedules/?controller_id=${selectedControllerId}`);
      setSchedules(schedulesRes.data.results || []);
    } catch (error) {
      console.error('Fehler beim Laden der Zeitpläne:', error);
    }
  }, [selectedControllerId]);
  
  // Eine gemeinsame Funktion für manuelle Neuladeaufforderungen
  const loadData = useCallback(() => {
    fetchControllers();
    fetchSchedules();
  }, [fetchControllers, fetchSchedules]);
  
  // Beim ersten Laden Controller holen
  useEffect(() => {
    fetchControllers();
  }, []); // [] bedeutet: nur einmal beim Mount
  
  // Zeitpläne laden, wenn sich der Controller ändert
  useEffect(() => {
    if (selectedControllerId) {
      fetchSchedules();
    }
  }, [selectedControllerId, fetchSchedules]);
  
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
        color: [greenPalette.light, greenPalette.main, greenPalette.dark]
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
    <Container maxWidth="xl" sx={{ pt: 3, pb: 5 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${alpha(greenPalette.main, 0.2)}`
            }}
          >
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                fontWeight="bold" 
                color={greenPalette.main} 
                sx={{ 
                  mb: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <WaterDropIcon sx={{ mr: 1 }} />
                Bewässerungssteuerung
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Verwalten und überwachen Sie Ihre Bewässerungscontroller und Zeitpläne
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Filter">
                <IconButton 
                  onClick={handleFilterMenuOpen} 
                  sx={{ 
                    mr: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Aktualisieren">
                <IconButton 
                  onClick={loadData} 
                  sx={{ 
                    mr: 1,
                    backgroundColor: alpha(greenPalette.main, 0.05),
                    '&:hover': {
                      backgroundColor: alpha(greenPalette.main, 0.1)
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleMenuOpen}
                color="success"
                sx={{
                  borderRadius: 8,
                  px: 2,
                  py: 1,
                  boxShadow: `0 4px 8px ${alpha(greenPalette.main, 0.25)}`,
                  '&:hover': {
                    boxShadow: `0 6px 12px ${alpha(greenPalette.main, 0.35)}`
                  }
                }}
              >
                Neu
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.15)}`
                  }
                }}
              >
                <MenuItem 
                  onClick={handleOpenControllerForm}
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(greenPalette.light, 0.1)
                    }
                  }}
                >
                  <OpacityIcon sx={{ mr: 1, color: greenPalette.main }} />
                  Neuer Controller
                </MenuItem>
                
                <MenuItem 
                  onClick={handleOpenScheduleForm} 
                  disabled={!selectedControllerId}
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(greenPalette.light, 0.1)
                    }
                  }}
                >
                  <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Neuer Zeitplan
                </MenuItem>
                
                <MenuItem 
                  onClick={handleOpenManualIrrigationDialog} 
                  disabled={!selectedControllerId}
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(greenPalette.light, 0.1)
                    }
                  }}
                >
                  <PlayArrowIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                  Manuelle Bewässerung
                </MenuItem>
              </Menu>
              
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleFilterMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 250,
                    p: 1,
                    boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.15)}`
                  }
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    color: theme.palette.primary.main,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 1
                  }}
                >
                  Filter anwenden
                </Typography>
                
                <MenuItem sx={{ py: 1.5 }}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
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
                
                <MenuItem sx={{ py: 1.5 }}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
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
                
                <MenuItem sx={{ py: 1.5 }}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
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
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, px: 2 }}>
                  <Button 
                    size="small"
                    onClick={() => {
                      setFilterOptions({
                        status: 'all',
                        room: 'all',
                        type: 'all'
                      });
                    }}
                    sx={{ mr: 1 }}
                  >
                    Zurücksetzen
                  </Button>
                  <Button 
                    variant="contained"
                    size="small"
                    onClick={handleFilterMenuClose}
                    color="primary"
                  >
                    Anwenden
                  </Button>
                </Box>
              </Menu>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '50vh' 
            }}>
              <CircularProgress 
                size={60} 
                thickness={4} 
                color="success" 
                sx={{ mb: 3 }}
              />
              <Typography variant="body2" color="text.secondary">
                Lade Bewässerungscontroller...
              </Typography>
            </Box>
          ) : controllers.length === 0 ? (
            <Zoom in={true}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 3,
                  backgroundColor: alpha(greenPalette.main, 0.02),
                  border: `1px dashed ${alpha(greenPalette.main, 0.3)}`
                }}
              >
                <OpacityIcon 
                  sx={{ 
                    fontSize: 60, 
                    color: alpha(greenPalette.main, 0.5),
                    mb: 2
                  }} 
                />
                <Typography variant="h6" gutterBottom>Keine Bewässerungscontroller gefunden</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Erstellen Sie Ihren ersten Bewässerungscontroller, um loszulegen.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenControllerForm}
                  color="success"
                  sx={{
                    borderRadius: 8,
                    px: 3,
                    py: 1.2,
                    boxShadow: `0 4px 12px ${alpha(greenPalette.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: `0 6px 16px ${alpha(greenPalette.main, 0.4)}`
                    }
                  }}
                >
                  Controller erstellen
                </Button>
              </Paper>
            </Zoom>
          ) : (
            <Grid container spacing={3}>
              {/* Controller-Karten */}
              <Grid item xs={12} lg={4}>
                {/* Bei Desktop/Tablet die Listenansicht zeigen */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Zoom in={true} style={{ transitionDelay: '50ms' }}>
                    <Paper 
                      sx={{ 
                        p: 0, 
                        borderRadius: 2, 
                        height: '100%',
                        overflow: 'hidden',
                        border: `1px solid ${alpha(greenPalette.main, 0.1)}`,
                        backgroundColor: alpha(greenPalette.main, 0.02),
                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`
                      }}
                    >
                      <Box sx={{ 
                        p: 2, 
                        borderBottom: `1px solid ${alpha(greenPalette.main, 0.1)}`,
                        backgroundColor: alpha(greenPalette.main, 0.08),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="medium"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: greenPalette.dark
                          }}
                        >
                          <OpacityIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                          Verfügbare Controller ({filteredControllers.length})
                        </Typography>
                        
                        <Tooltip title="Neuer Controller">
                          <IconButton 
                            size="small" 
                            onClick={handleOpenControllerForm}
                            sx={{
                              color: greenPalette.main,
                              backgroundColor: alpha(greenPalette.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(greenPalette.main, 0.2)
                              }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          maxHeight: 'calc(100vh - 250px)', 
                          overflowY: 'auto', 
                          p: 2,
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: alpha(theme.palette.common.black, 0.05),
                            borderRadius: 4
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha(greenPalette.main, 0.2),
                            borderRadius: 4,
                            '&:hover': {
                              backgroundColor: alpha(greenPalette.main, 0.3)
                            }
                          }
                        }}
                      >
                        {filteredControllers.map((controller, index) => (
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
                  </Zoom>
                </Box>
                
                {/* Bei Mobil den Dropdown anzeigen */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Zoom in={true}>
                    <FormControl 
                      fullWidth 
                      variant="outlined"
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          borderColor: alpha(greenPalette.main, 0.3),
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: greenPalette.main
                          }
                        }
                      }}
                    >
                      <InputLabel 
                        id="controller-select-label"
                        sx={{ color: greenPalette.main }}
                      >
                        Controller auswählen
                      </InputLabel>
                      <Select
                        labelId="controller-select-label"
                        value={selectedControllerId || ''}
                        onChange={(e) => handleControllerSelect(e.target.value)}
                        label="Controller auswählen"
                        color="success"
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              boxShadow: `0 5px 20px ${alpha(theme.palette.common.black, 0.15)}`
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography variant="body2" color="text.secondary">
                            Bitte wählen Sie einen Controller
                          </Typography>
                        </MenuItem>
                        
                        {filteredControllers.map(controller => (
                          <MenuItem key={controller.id} value={controller.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              {controller.emergency_stop ? (
                                <StopIcon 
                                  fontSize="small" 
                                  color="error" 
                                  sx={{ mr: 1 }} 
                                />
                              ) : controller.is_active ? (
                                <CheckCircleIcon 
                                  fontSize="small" 
                                  color="success" 
                                  sx={{ mr: 1 }} 
                                />
                              ) : (
                                <CancelIcon 
                                  fontSize="small" 
                                  color="disabled" 
                                  sx={{ mr: 1 }} 
                                />
                              )}
                              <Typography>
                                {controller.name}
                              </Typography>
                              
                              <Box sx={{ flexGrow: 1 }} />
                              
                              <Typography variant="caption" color="text.secondary">
                                {controller.room ? controller.room.name : "Kein Raum"}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Zoom>
                  
                  {selectedController && (
                    <Fade in={true}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 2,
                          px: 1
                        }}
                      >
                        <Button 
                          variant="outlined" 
                          color="error"
                          size="small"
                          onClick={() => handleEmergencyStop(selectedController.id, selectedController.emergency_stop)}
                          startIcon={selectedController.emergency_stop ? <PlayArrowIcon /> : <StopIcon />}
                        >
                          {selectedController.emergency_stop ? "Freigeben" : "Notfall-Stopp"}
                        </Button>
                        
                        <Button 
                          variant="outlined" 
                          color="success"
                          size="small"
                          onClick={handleOpenManualIrrigationDialog}
                          startIcon={<PlayArrowIcon />}
                        >
                          Manuelle Bewässerung
                        </Button>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Grid>
              
              {/* Controller-Details */}
              <Grid item xs={12} lg={8}>
                {selectedController ? (
                  <Zoom in={true} style={{ transitionDelay: '150ms' }}>
                    <Paper 
                      sx={{ 
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.07)}`,
                        border: `1px solid ${alpha(greenPalette.main, 0.1)}`
                      }}
                    >
                      <Box sx={{ 
                        borderBottom: `1px solid ${alpha(greenPalette.main, 0.1)}`,
                        backgroundColor: alpha(greenPalette.main, 0.05)
                      }}>
                        <Tabs 
                          value={tabValue} 
                          onChange={handleTabChange} 
                          aria-label="controller tabs"
                          textColor="success"
                          indicatorColor="success"
                          variant={isMobile ? "fullWidth" : "standard"}
                          sx={{
                            '& .MuiTab-root': {
                              minHeight: 56,
                              py: 1.5,
                              transition: 'all 0.2s',
                              '&:hover': {
                                color: greenPalette.main,
                                backgroundColor: alpha(greenPalette.main, 0.05),
                              },
                              '&.Mui-selected': {
                                color: greenPalette.main,
                                fontWeight: 'medium'
                              }
                            }
                          }}
                        >
                          <Tab 
                            label={isMobile ? undefined : "Übersicht"} 
                            icon={isMobile ? <DashboardIcon /> : undefined}
                            iconPosition="start"
                            id="tab-0" 
                          />
                          <Tab 
                            label={isMobile ? undefined : "Zeitplan"} 
                            icon={isMobile ? <CalendarMonthIcon /> : undefined}
                            iconPosition="start"
                            id="tab-1" 
                          />
                          <Tab 
                            label={isMobile ? undefined : "Statistik"} 
                            icon={isMobile ? <BarChartIcon /> : undefined}
                            iconPosition="start"
                            id="tab-2" 
                          />
                          <Tab 
                            label={isMobile ? undefined : "Protokoll"} 
                            icon={isMobile ? <ListIcon /> : undefined}
                            iconPosition="start"
                            id="tab-3" 
                          />
                        </Tabs>
                      </Box>
                      
                      {/* Übersicht Tab */}
                      <Box
                        role="tabpanel"
                        hidden={tabValue !== 0}
                        id={`tabpanel-0`}
                        aria-labelledby={`tab-0`}
                        sx={{ p: { xs: 2, sm: 3 } }}
                      >
                        {tabValue === 0 && (
                          <Box>
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: { xs: 'column', sm: 'row' },
                              justifyContent: 'space-between', 
                              alignItems: { xs: 'flex-start', sm: 'flex-start' }, 
                              mb: 3 
                            }}>
                              <Box>
                                <Typography 
                                  variant="h6"
                                  sx={{
                                    color: selectedController.is_active ? 
                                      (selectedController.emergency_stop ? theme.palette.error.dark : greenPalette.dark) : 
                                      theme.palette.text.secondary,
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  {selectedController.emergency_stop ? (
                                    <WarningIcon 
                                      sx={{ 
                                        mr: 1, 
                                        color: theme.palette.error.main,
                                        animation: 'pulse 1.5s infinite ease-in-out',
                                        '@keyframes pulse': {
                                          '0%': { opacity: 0.6, transform: 'scale(0.9)' },
                                          '50%': { opacity: 1, transform: 'scale(1.1)' },
                                          '100%': { opacity: 0.6, transform: 'scale(0.9)' }
                                        }
                                      }} 
                                    />
                                  ) : selectedController.status && selectedController.status.is_watering ? (
                                    <WaterDropIcon 
                                      sx={{ 
                                        mr: 1, 
                                        color: greenPalette.main,
                                        animation: 'dropPulse 1.5s infinite ease-in-out',
                                        '@keyframes dropPulse': {
                                          '0%': { opacity: 0.7, transform: 'scale(1)' },
                                          '50%': { opacity: 1, transform: 'scale(1.2) translateY(2px)' },
                                          '100%': { opacity: 0.7, transform: 'scale(1)' }
                                        }
                                      }} 
                                    />
                                  ) : (
                                    <OpacityIcon 
                                      sx={{ 
                                        mr: 1, 
                                        color: selectedController.is_active ? greenPalette.main : theme.palette.grey[500]
                                      }} 
                                    />
                                  )}
                                  {selectedController.name}
                                </Typography>
                                
                                {selectedController.description && (
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ ml: 0.5 }}
                                  >
                                    {selectedController.description}
                                  </Typography>
                                )}
                                
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  <Chip 
                                    icon={<OpacityIcon fontSize="small" />} 
                                    label={selectedController.pump_type_display}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ 
                                      borderRadius: 4,
                                      '& .MuiChip-label': {
                                        px: 1
                                      }
                                    }}
                                  />
                                  
                                  {selectedController.room && (
                                    <Chip 
                                      label={selectedController.room.name}
                                      size="small"
                                      color="default"
                                      variant="outlined"
                                      sx={{ 
                                        borderRadius: 4,
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  )}
                                  
                                  <Chip 
                                    icon={<SpeedIcon fontSize="small" />} 
                                    label={`${parseFloat(selectedController.flow_rate || 0).toFixed(1)} l/min`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ 
                                      borderRadius: 4,
                                      '& .MuiChip-label': {
                                        px: 1
                                      }
                                    }}
                                  />
                                  
                                  {selectedController.emergency_stop && (
                                    <Chip 
                                      icon={<WarningIcon fontSize="small" />} 
                                      label="Notfall-Stopp aktiv"
                                      size="small"
                                      color="error"
                                      sx={{ 
                                        borderRadius: 4,
                                        animation: 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                          '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.5)}` },
                                          '70%': { boxShadow: `0 0 0 6px ${alpha(theme.palette.error.main, 0)}` },
                                          '100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` }
                                        },
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              
                              <Box sx={{ mt: { xs: 2, sm: 0 } }}>
                                <Button 
                                  variant="contained" 
                                  color={selectedController.emergency_stop ? "error" : "warning"}
                                  startIcon={selectedController.emergency_stop ? <PlayArrowIcon /> : <StopIcon />}
                                  onClick={() => handleEmergencyStop(selectedController.id, selectedController.emergency_stop)}
                                  sx={{ 
                                    mb: 1,
                                    borderRadius: 2,
                                    boxShadow: selectedController.emergency_stop ?
                                      `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}` :
                                      `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
                                    '&:hover': {
                                      boxShadow: selectedController.emergency_stop ?
                                        `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}` :
                                        `0 6px 16px ${alpha(theme.palette.warning.main, 0.4)}`
                                    }
                                  }}
                                >
                                  {selectedController.emergency_stop ? "Notfall-Stopp aufheben" : "Notfall-Stopp"}
                                </Button>
                                
                                <Button 
                                  variant="outlined" 
                                  color="success"
                                  startIcon={<ScheduleIcon />}
                                  fullWidth
                                  onClick={handleOpenScheduleForm}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Zeitplan bearbeiten
                                </Button>
                              </Box>
                            </Box>
                            
                            <Grid container spacing={2} mt={2}>
                              <Grid item xs={12} md={6}>
                                <Fade in={true} timeout={800}>
                                  <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                      p: 2, 
                                      height: '100%', 
                                      display: 'flex',
                                      flexDirection: 'column',
                                      borderRadius: 2,
                                      borderColor: alpha(greenPalette.main, 0.2),
                                      backgroundColor: alpha(greenPalette.main, 0.02)
                                    }}
                                  >
                                    <Typography 
                                      variant="subtitle2" 
                                      color={greenPalette.main}
                                      gutterBottom
                                      sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      <TuneIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                      BEWÄSSERUNGS-DETAILS
                                    </Typography>
                                    
                                    <Box sx={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                                      gap: 2, 
                                      mt: 1 
                                    }}>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Quelle</Typography>
                                        <Typography variant="body1">{selectedController.water_source || "Nicht angegeben"}</Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Durchflussrate</Typography>
                                        <Typography 
                                          variant="body1"
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <SpeedIcon 
                                            sx={{ 
                                              mr: 0.5, 
                                              fontSize: '1rem',
                                              color: theme.palette.info.main
                                            }} 
                                          />
                                          {parseFloat(selectedController.flow_rate || 0).toFixed(1)} l/min
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Max pro Tag</Typography>
                                        <Typography 
                                          variant="body1"
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <WaterDropIcon 
                                            sx={{ 
                                              mr: 0.5, 
                                              fontSize: '1rem',
                                              color: theme.palette.error.main
                                            }} 
                                          />
                                          {selectedController.max_volume_per_day ? 
                                            `${parseFloat(selectedController.max_volume_per_day || 0).toFixed(1)} l` : 
                                            "Unbegrenzt"}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Zeitplantyp</Typography>
                                        <Typography 
                                          variant="body1"
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <ScheduleIcon 
                                            sx={{ 
                                              mr: 0.5, 
                                              fontSize: '1rem',
                                              color: theme.palette.primary.main
                                            }} 
                                          />
                                          {selectedController.schedule_type_display}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Gesamtverbrauch</Typography>
                                        <Typography 
                                          variant="body1" 
                                          sx={{ 
                                            color: theme.palette.info.dark,
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <OpacityIcon 
                                            sx={{ 
                                              mr: 0.5, 
                                              fontSize: '1rem',
                                              color: greenPalette.main
                                            }} 
                                          />
                                          {parseFloat(selectedController.total_volume_used || 0).toFixed(1)} l
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">Sensor-Feedback</Typography>
                                        <Typography 
                                          variant="body1"
                                          sx={{
                                            color: selectedController.sensor_feedback_enabled ? 
                                              greenPalette.main : theme.palette.text.secondary,
                                            fontWeight: selectedController.sensor_feedback_enabled ? 'medium' : 'normal'
                                          }}
                                        >
                                          {selectedController.sensor_feedback_enabled ? "Aktiviert" : "Deaktiviert"}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    
                                    <Box sx={{ flexGrow: 1 }} />
                                    
                                    <Button 
                                      variant="contained"
                                      color="success"
                                      sx={{ 
                                        mt: 3, 
                                        alignSelf: 'flex-start',
                                        borderRadius: 8,
                                        px: 2,
                                        py: 1,
                                        boxShadow: `0 4px 12px ${alpha(greenPalette.main, 0.25)}`,
                                        '&:hover': {
                                          boxShadow: `0 6px 16px ${alpha(greenPalette.main, 0.35)}`,
                                          transform: 'translateY(-2px)'
                                        }
                                      }}
                                      onClick={handleOpenManualIrrigationDialog}
                                      startIcon={<PlayArrowIcon />}
                                    >
                                      Manuelle Bewässerung
                                    </Button>
                                  </Paper>
                                </Fade>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Fade in={true} timeout={1000}>
                                  <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                      p: 2, 
                                      height: '100%',
                                      borderRadius: 2,
                                      borderColor: alpha(greenPalette.main, 0.2),
                                      backgroundImage: `linear-gradient(to bottom, ${alpha(greenPalette.main, 0.05)}, ${alpha(greenPalette.main, 0.01)})`
                                    }}
                                  >
                                    <Typography 
                                      variant="subtitle2" 
                                      color={greenPalette.main}
                                      gutterBottom
                                      sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      <ScheduleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                      AKTUELLE ZEITPLÄNE
                                    </Typography>
                                    
                                    {schedules.length === 0 ? (
                                      <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        height: 'calc(100% - 24px)',
                                        py: 4
                                      }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                          Keine Zeitpläne konfiguriert.
                                        </Typography>
                                        <Button 
                                          variant="outlined" 
                                          startIcon={<AddIcon />}
                                          size="small"
                                          color="success"
                                          onClick={handleOpenScheduleForm}
                                          sx={{ 
                                            borderRadius: 8,
                                            px: 2,
                                            '&:hover': {
                                              transform: 'translateY(-2px)',
                                              boxShadow: `0 4px 8px ${alpha(greenPalette.main, 0.15)}`
                                            }
                                          }}
                                        >
                                          Zeitplan hinzufügen
                                        </Button>
                                      </Box>
                                    ) : (
                                      <Box sx={{ mt: 1 }}>
                                        {schedules.map((schedule, index) => (
                                          <Zoom 
                                            in={true} 
                                            key={schedule.id}
                                            style={{ transitionDelay: `${index * 50}ms` }}
                                          >
                                            <Box 
                                              sx={{ 
                                                p: 1.5, 
                                                mb: 1, 
                                                borderRadius: 1.5,
                                                backgroundColor: schedule.is_active ? 
                                                  alpha(greenPalette.main, 0.08) : 
                                                  alpha(theme.palette.grey[500], 0.05),
                                                border: `1px solid ${schedule.is_active ? 
                                                  alpha(greenPalette.main, 0.2) : 
                                                  alpha(theme.palette.grey[500], 0.1)}`,
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                  backgroundColor: schedule.is_active ? 
                                                    alpha(greenPalette.main, 0.12) : 
                                                    alpha(theme.palette.grey[500], 0.08),
                                                  transform: 'translateY(-2px)',
                                                  boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`
                                                }
                                              }}
                                              onClick={() => {
                                                // Hier könnte man z.B. den Zeitplan bearbeiten
                                                setTabValue(1); // Zur Zeitplan-Ansicht wechseln
                                              }}
                                            >
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                  <AccessTimeIcon 
                                                    fontSize="small" 
                                                    sx={{ 
                                                      mr: 1, 
                                                      color: schedule.is_active ? greenPalette.main : 'text.secondary'
                                                    }} 
                                                  />
                                                  <Typography 
                                                    variant="body2"
                                                    fontWeight={schedule.is_active ? 'medium' : 'normal'}
                                                  >
                                                    {schedule.day_of_week !== null ? 
                                                      `${schedule.day_of_week_display}, ` : 
                                                      "Täglich, "}
                                                    {schedule.start_time} Uhr
                                                    {!schedule.is_active && (
                                                      <Box component="span" sx={{ 
                                                        color: theme.palette.text.secondary,
                                                        fontStyle: 'italic',
                                                        ml: 0.5
                                                      }}>
                                                        (inaktiv)
                                                      </Box>
                                                    )}
                                                  </Typography>
                                                </Box>
                                                <Chip 
                                                  label={`${parseFloat(schedule.duration || 0)} min, ${parseFloat(schedule.intensity || 0)}%`}
                                                  size="small"
                                                  variant="outlined"
                                                  color={schedule.is_active ? "success" : "default"}
                                                  sx={{ 
                                                    borderRadius: 4,
                                                    '& .MuiChip-label': {
                                                      px: 1
                                                    }
                                                  }}
                                                />
                                              </Box>
                                            </Box>
                                          </Zoom>
                                        ))}
                                        
                                        <Box sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'center',
                                          mt: 2 
                                        }}>
                                          <Button
                                            variant="outlined"
                                            color="success"
                                            size="small"
                                            onClick={() => setTabValue(1)}
                                            sx={{ 
                                              borderRadius: 8,
                                              px: 2
                                            }}
                                          >
                                            Alle Zeitpläne anzeigen
                                          </Button>
                                        </Box>
                                      </Box>
                                    )}
                                  </Paper>
                                </Fade>
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
                        sx={{ p: { xs: 2, sm: 3 } }}
                      >
                        {tabValue === 1 && (
                          <Box>
                            <Box sx={{ 
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 3
                            }}>
                              <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{
                                  color: greenPalette.dark,
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 0
                                }}
                              >
                                <ScheduleIcon sx={{ mr: 1 }} />
                                Bewässerungszeitplan
                              </Typography>
                              
                              <Button 
                                variant="contained" 
                                startIcon={<AddIcon />}
                                onClick={handleOpenScheduleForm}
                                color="success"
                                size="small"
                                sx={{ 
                                  borderRadius: 8,
                                  px: 2
                                }}
                              >
                                Neuer Zeitplan
                              </Button>
                            </Box>
                            
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                height: '400px',
                                mb: 3,
                                borderRadius: 2,
                                borderColor: alpha(greenPalette.main, 0.2),
                                backgroundImage: `linear-gradient(to bottom, ${alpha(greenPalette.main, 0.05)}, ${alpha(greenPalette.main, 0.01)})`
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
                                    color="success"
                                    sx={{ 
                                      borderRadius: 8,
                                      px: 3,
                                      py: 1,
                                      boxShadow: `0 4px 12px ${alpha(greenPalette.main, 0.25)}`,
                                      '&:hover': {
                                        boxShadow: `0 6px 16px ${alpha(greenPalette.main, 0.35)}`
                                      }
                                    }}
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
                            
                            {schedules.length > 0 && (
                              <ScheduleCalendar
                                schedules={schedules}
                                onEditSchedule={() => {}} // Noch zu implementieren
                                onDeleteSchedule={() => {}} // Noch zu implementieren
                                onAddSchedule={handleOpenScheduleForm}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                      
                      {/* Statistik Tab */}
                      <Box
                        role="tabpanel"
                        hidden={tabValue !== 2}
                        id={`tabpanel-2`}
                        aria-labelledby={`tab-2`}
                        sx={{ p: { xs: 2, sm: 3 } }}
                      >
                        {tabValue === 2 && (
                          <Fade in={true}>
                            <Box>
                              <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{
                                  color: greenPalette.dark,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <BarChartIcon sx={{ mr: 1 }} />
                                Bewässerungsstatistik
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Detaillierte Statistiken für {selectedController.name}
                              </Typography>
                              
                              <Box sx={{ 
                                height: 400, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: 2,
                                border: `1px dashed ${alpha(greenPalette.main, 0.3)}`,
                                backgroundColor: alpha(greenPalette.main, 0.02),
                                p: 3
                              }}>
                                <Typography color="text.secondary" align="center">
                                  <InfoIcon sx={{ fontSize: 40, color: alpha(greenPalette.main, 0.5), mb: 2 }} />
                                  <Typography variant="h6" gutterBottom>
                                    Statistiken werden vorbereitet
                                  </Typography>
                                  Detaillierte Verbrauchsstatistiken und Analysedaten werden hier angezeigt.
                                </Typography>
                              </Box>
                            </Box>
                          </Fade>
                        )}
                      </Box>
                      
                      {/* Protokoll Tab */}
                      <Box
                        role="tabpanel"
                        hidden={tabValue !== 3}
                        id={`tabpanel-3`}
                        aria-labelledby={`tab-3`}
                        sx={{ p: { xs: 2, sm: 3 } }}
                      >
                        {tabValue === 3 && (
                          <Fade in={true}>
                            <Box>
                              <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{
                                  color: greenPalette.dark,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <ListIcon sx={{ mr: 1 }} />
                                Bewässerungsprotokolle
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Aktivitätsprotokolle für {selectedController.name}
                              </Typography>
                              
                              <Box sx={{ 
                                height: 400, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: 2,
                                border: `1px dashed ${alpha(greenPalette.main, 0.3)}`,
                                backgroundColor: alpha(greenPalette.main, 0.02),
                                p: 3
                              }}>
                                <Typography color="text.secondary" align="center">
                                  <InfoIcon sx={{ fontSize: 40, color: alpha(greenPalette.main, 0.5), mb: 2 }} />
                                  <Typography variant="h6" gutterBottom>
                                    Keine Protokolle verfügbar
                                  </Typography>
                                  Hier werden Aktivitätsprotokolle und Ereignisse für diesen Controller angezeigt.
                                </Typography>
                              </Box>
                            </Box>
                          </Fade>
                        )}
                      </Box>
                    </Paper>
                  </Zoom>
                ) : (
                  <Zoom in={true}>
                    <Paper 
                      sx={{ 
                        p: 4, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 2,
                        backgroundColor: alpha(greenPalette.main, 0.02),
                        border: `1px dashed ${alpha(greenPalette.main, 0.2)}`
                      }}
                    >
                      <OpacityIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: alpha(greenPalette.main, 0.3),
                          mb: 2
                        }} 
                      />
                      <Typography variant="h6" color="text.primary" gutterBottom>
                        Kein Controller ausgewählt
                      </Typography>
                      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Bitte wählen Sie einen Controller aus, um die Details anzuzeigen.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={handleOpenControllerForm}
                        sx={{ 
                          borderRadius: 8,
                          px: 3
                        }}
                      >
                        Neuen Controller erstellen
                      </Button>
                    </Paper>
                  </Zoom>
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
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            backgroundColor: alpha(greenPalette.main, 0.05),
            borderBottom: `1px solid ${alpha(greenPalette.main, 0.1)}`
          }}
        >
          <PlayArrowIcon sx={{ mr: 1, color: greenPalette.main }} />
          Manuelle Bewässerung starten
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mt: 2 }}>
            <Typography 
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary
              }}
            >
              <AccessTimeIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
              Dauer (Minuten)
            </Typography>
            
            <Slider
              value={manualIrrigationData.duration}
              onChange={(e, newValue) => setManualIrrigationData({...manualIrrigationData, duration: newValue})}
              aria-labelledby="duration-slider"
              valueLabelDisplay="auto"
              min={1}
              max={60}
              color="success"
              marks={[
                { value: 1, label: '1' },
                { value: 15, label: '15' },
                { value: 30, label: '30' },
                { value: 45, label: '45' },
                { value: 60, label: '60' }
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${alpha(greenPalette.main, 0.16)}`
                  }
                }
              }}
            />
            
            <Typography 
              gutterBottom 
              sx={{ 
                mt: 3,
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary
              }}
            >
              <SpeedIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
              Intensität (%)
            </Typography>
            
            <Slider
              value={manualIrrigationData.intensity}
              onChange={(e, newValue) => setManualIrrigationData({...manualIrrigationData, intensity: newValue})}
              aria-labelledby="intensity-slider"
              valueLabelDisplay="auto"
              min={10}
              max={100}
              color="success"
              marks={[
                { value: 10, label: '10%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${alpha(greenPalette.main, 0.16)}`
                  }
                }
              }}
            />
            
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: alpha(greenPalette.main, 0.05), 
              borderRadius: 2,
              border: `1px solid ${alpha(greenPalette.main, 0.1)}`
            }}>
              <Typography variant="subtitle2" gutterBottom color={greenPalette.main}>
                Zusammenfassung
              </Typography>
              <Typography variant="body2">
                {selectedController && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <WaterDropIcon 
                      sx={{ 
                        mr: 1, 
                        color: greenPalette.main, 
                        fontSize: '1.2rem'
                      }} 
                    />
                    <span>
                      <strong>{manualIrrigationData.duration} Minuten</strong> mit <strong>{manualIrrigationData.intensity}% Intensität</strong> entspricht etwa <strong>{((parseFloat(selectedController.flow_rate || 0) * manualIrrigationData.duration * manualIrrigationData.intensity) / 100).toFixed(1)} Liter</strong> Wasser.
                    </span>
                  </Box>
                )}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            borderTop: `1px solid ${alpha(greenPalette.main, 0.1)}`,
            padding: 2
          }}
        >
          <Button 
            onClick={() => setOpenManualIrrigationDialog(false)}
            startIcon={<CloseIcon />}
          >
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleManualIrrigation}
            startIcon={<PlayArrowIcon />}
            color="success"
            sx={{
              borderRadius: 8,
              px: 3,
              py: 1,
              boxShadow: `0 4px 12px ${alpha(greenPalette.main, 0.25)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(greenPalette.main, 0.35)}`
              }
            }}
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
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }}
        >
          <WarningIcon sx={{ mr: 1, color: theme.palette.error.main }} />
          Controller löschen
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2, px: 3 }}>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Sind Sie sicher, dass Sie den Controller <strong>"{controllerToDelete?.name}"</strong> löschen möchten?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Zeitpläne werden ebenfalls gelöscht.
          </Typography>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            padding: 2
          }}
        >
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            startIcon={<CloseIcon />}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={confirmDeleteController} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{
              borderRadius: 8,
              px: 2
            }}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}