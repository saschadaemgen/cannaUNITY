// frontend/src/apps/controller/components/irrigation/ScheduleCalendar.jsx
import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Grid, Button, IconButton, 
  Tooltip, Chip, useTheme, alpha, Zoom, Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpacityIcon from '@mui/icons-material/Opacity';
import SpeedIcon from '@mui/icons-material/Speed';
import TuneIcon from '@mui/icons-material/Tune';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ScheduleIcon from '@mui/icons-material/Schedule';

/**
 * Kalender-/Grid-Ansicht für Bewässerungszeitpläne
 *
 * @param {Object} props
 * @param {Array} props.schedules - Array mit Zeitplänen
 * @param {Function} props.onEditSchedule - Callback bei Bearbeitung
 * @param {Function} props.onDeleteSchedule - Callback bei Löschung
 * @param {Function} props.onAddSchedule - Callback zum Hinzufügen eines neuen Zeitplans
 */
export default function ScheduleCalendar({ 
  schedules = [], 
  onEditSchedule, 
  onDeleteSchedule, 
  onAddSchedule 
}) {
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Grün-Farbschema konsistent mit ScheduleForm
  const greenPalette = {
    main: theme.palette.success.main,
    light: theme.palette.success.light,
    dark: theme.palette.success.dark
  };
  
  // Zeitpläne nach Wochentagen gruppieren
  const getSchedulesByDay = () => {
    const days = {
      null: { label: 'Täglich', schedules: [] },
      0: { label: 'Montag', schedules: [] },
      1: { label: 'Dienstag', schedules: [] },
      2: { label: 'Mittwoch', schedules: [] },
      3: { label: 'Donnerstag', schedules: [] },
      4: { label: 'Freitag', schedules: [] },
      5: { label: 'Samstag', schedules: [] },
      6: { label: 'Sonntag', schedules: [] }
    };
    
    // Zeitpläne den Wochentagen zuordnen
    schedules.forEach(schedule => {
      const day = schedule.day_of_week !== undefined ? schedule.day_of_week : null;
      if (days[day]) {
        days[day].schedules.push(schedule);
      }
    });
    
    // Nach Startzeit sortieren
    Object.keys(days).forEach(day => {
      days[day].schedules.sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
      });
    });
    
    return days;
  };
  
  const schedulesByDay = getSchedulesByDay();
  
  // Styling für Tages-Tabs
  const getDayTabStyle = (day) => ({
    p: 1.5,
    cursor: 'pointer',
    borderRadius: 1,
    backgroundColor: selectedDay === day 
      ? alpha(greenPalette.main, 0.1) 
      : 'transparent',
    border: `1px solid ${selectedDay === day 
      ? greenPalette.main 
      : alpha(theme.palette.divider, 0.5)}`,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(greenPalette.main, 0.05),
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 8px ${alpha(greenPalette.main, 0.15)}`
    }
  });
  
  // Anzahl der Zeitpläne pro Tag ermitteln
  const getScheduleCount = (day) => {
    return schedulesByDay[day]?.schedules.length || 0;
  };
  
  // Aktive Zeitpläne für den ausgewählten Tag oder alle Tage anzeigen
  const schedulesToDisplay = selectedDay !== null 
    ? schedulesByDay[selectedDay]?.schedules || [] 
    : schedules;
  
  return (
    <Box sx={{ 
      backgroundColor: alpha(greenPalette.main, 0.02), 
      borderRadius: 2,
      p: 3,
      border: `1px solid ${alpha(greenPalette.main, 0.1)}`
    }}>
      {/* Titel */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${alpha(greenPalette.main, 0.1)}`
      }}>
        <ScheduleIcon sx={{ mr: 1, color: greenPalette.main }} />
        <Typography variant="h6" fontWeight="medium" color="text.primary">
          Bewässerungszeitpläne
        </Typography>
      </Box>

      {/* Tages-Navigation */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="subtitle2" 
          gutterBottom 
          color={greenPalette.main}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontWeight: 'bold'
          }}
        >
          <EventNoteIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          WOCHENTAGE
        </Typography>
        
        <Grid container spacing={1}>
          {Object.entries(schedulesByDay).map(([day, { label }]) => (
            <Grid item key={day}>
              <Zoom in={true} style={{ transitionDelay: `${parseInt(day) * 30}ms` }}>
                <Box 
                  sx={getDayTabStyle(day !== 'null' ? parseInt(day) : null)} 
                  onClick={() => setSelectedDay(day !== 'null' ? parseInt(day) : null)}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={selectedDay === (day !== 'null' ? parseInt(day) : null) ? 'medium' : 'normal'}
                    color={selectedDay === (day !== 'null' ? parseInt(day) : null) ? greenPalette.dark : 'text.primary'}
                  >
                    {label}
                  </Typography>
                  
                  {getScheduleCount(day) > 0 && (
                    <Chip 
                      label={getScheduleCount(day)}
                      size="small"
                      color={selectedDay === (day !== 'null' ? parseInt(day) : null) ? "success" : "default"}
                      sx={{ mt: 0.5, height: 20 }}
                    />
                  )}
                </Box>
              </Zoom>
            </Grid>
          ))}
          
          <Grid item>
            <Zoom in={true} style={{ transitionDelay: '250ms' }}>
              <Box 
                sx={getDayTabStyle('all')} 
                onClick={() => setSelectedDay(null)}
              >
                <Typography 
                  variant="body2" 
                  fontWeight={selectedDay === null ? 'medium' : 'normal'}
                  color={selectedDay === null ? greenPalette.dark : 'text.primary'}
                >
                  Alle anzeigen
                </Typography>
                
                <Chip 
                  label={schedules.length}
                  size="small"
                  color={selectedDay === null ? "success" : "default"}
                  sx={{ mt: 0.5, height: 20 }}
                />
              </Box>
            </Zoom>
          </Grid>
        </Grid>
      </Box>
      
      {/* Zeitplanliste */}
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography 
            variant="subtitle2" 
            color={greenPalette.main}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold'
            }}
          >
            <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem' }} />
            {selectedDay !== null 
              ? `ZEITPLÄNE FÜR ${schedulesByDay[selectedDay]?.label.toUpperCase()}`
              : 'ALLE ZEITPLÄNE'
            }
          </Typography>
          
          <Button 
            startIcon={<AddIcon />} 
            size="small"
            variant="contained"
            color="success"
            onClick={onAddSchedule}
            sx={{ 
              borderRadius: 8,
              px: 2,
              '&:hover': {
                boxShadow: `0 4px 8px ${alpha(greenPalette.main, 0.3)}`
              }
            }}
          >
            Zeitplan hinzufügen
          </Button>
        </Box>
        
        {schedulesToDisplay.length === 0 ? (
          <Fade in={true}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderStyle: 'dashed',
                borderColor: alpha(greenPalette.main, 0.3),
                backgroundColor: alpha(greenPalette.light, 0.05),
                borderRadius: 2
              }}
            >
              <Typography color="text.secondary" gutterBottom>
                Keine Zeitpläne für diesen Tag konfiguriert
              </Typography>
              <Button 
                startIcon={<AddIcon />} 
                size="small" 
                variant="outlined"
                color="success"
                onClick={onAddSchedule}
                sx={{ 
                  mt: 1,
                  borderRadius: 8,
                  px: 2
                }}
              >
                Zeitplan hinzufügen
              </Button>
            </Paper>
          </Fade>
        ) : (
          <Grid container spacing={2}>
            {schedulesToDisplay.map((schedule, index) => (
              <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      borderRadius: 2,
                      borderLeft: schedule.is_active 
                        ? `3px solid ${greenPalette.main}` 
                        : `3px solid ${theme.palette.grey[400]}`,
                      backgroundColor: schedule.is_active
                        ? alpha(greenPalette.main, 0.05)
                        : alpha(theme.palette.grey[100], 0.3),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.1)}`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AccessTimeIcon 
                            fontSize="small" 
                            sx={{ 
                              mr: 0.5, 
                              color: schedule.is_active ? greenPalette.main : theme.palette.grey[500]
                            }} 
                          />
                          <Typography variant="subtitle2" fontWeight="medium">
                            {schedule.start_time || "00:00"}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {schedule.day_of_week !== null 
                            ? schedule.day_of_week_display 
                            : "Täglich"}
                        </Typography>
                      </Box>
                      
                      <Box>
                        {!schedule.is_active && (
                          <Chip 
                            label="Inaktiv" 
                            size="small" 
                            color="default" 
                            sx={{ mb: 1 }}
                          />
                        )}
                        
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="Zeitplan bearbeiten">
                            <IconButton 
                              size="small" 
                              onClick={() => onEditSchedule(schedule)}
                              sx={{ 
                                mr: 0.5,
                                color: greenPalette.main,
                                '&:hover': {
                                  backgroundColor: alpha(greenPalette.main, 0.1)
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Zeitplan löschen">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => onDeleteSchedule(schedule)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1)
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <OpacityIcon 
                          fontSize="small" 
                          sx={{ color: greenPalette.main, mr: 1 }} 
                        />
                        <Typography variant="body2">
                          {schedule.volume} Liter
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TuneIcon 
                          fontSize="small" 
                          sx={{ color: theme.palette.info.main, mr: 1 }} 
                        />
                        <Typography variant="body2">
                          {schedule.duration} Minuten
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon 
                          fontSize="small" 
                          sx={{ color: theme.palette.warning.main, mr: 1 }} 
                        />
                        <Typography variant="body2">
                          {schedule.intensity}% Intensität
                        </Typography>
                      </Box>
                    </Box>
                    
                    {schedule.repeated_cycles > 1 && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 1, 
                        borderTop: `1px dashed ${alpha(greenPalette.main, 0.3)}`,
                        backgroundColor: alpha(greenPalette.main, 0.02),
                        p: 1,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {schedule.repeated_cycles}x Wiederholung mit {schedule.cycle_pause} Min. Pause
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}