// frontend/src/apps/controller/components/irrigation/ScheduleCalendar.jsx
import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Grid, Button, IconButton, 
  Tooltip, Chip, useTheme, alpha 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpacityIcon from '@mui/icons-material/Opacity';
import SpeedIcon from '@mui/icons-material/Speed';
import TuneIcon from '@mui/icons-material/Tune';
import EventNoteIcon from '@mui/icons-material/EventNote';

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
      ? alpha(theme.palette.primary.main, 0.1) 
      : 'transparent',
    border: `1px solid ${selectedDay === day 
      ? theme.palette.primary.main 
      : alpha(theme.palette.divider, 0.5)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
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
    <Box>
      {/* Tages-Navigation */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <EventNoteIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          WOCHENTAGE
        </Typography>
        
        <Grid container spacing={1}>
          {Object.entries(schedulesByDay).map(([day, { label }]) => (
            <Grid item key={day}>
              <Box 
                sx={getDayTabStyle(day !== 'null' ? parseInt(day) : null)} 
                onClick={() => setSelectedDay(day !== 'null' ? parseInt(day) : null)}
              >
                <Typography variant="body2" fontWeight={selectedDay === (day !== 'null' ? parseInt(day) : null) ? 'medium' : 'normal'}>
                  {label}
                </Typography>
                
                {getScheduleCount(day) > 0 && (
                  <Chip 
                    label={getScheduleCount(day)}
                    size="small"
                    color={selectedDay === (day !== 'null' ? parseInt(day) : null) ? "primary" : "default"}
                    sx={{ mt: 0.5, height: 20 }}
                  />
                )}
              </Box>
            </Grid>
          ))}
          
          <Grid item>
            <Box 
              sx={getDayTabStyle('all')} 
              onClick={() => setSelectedDay(null)}
            >
              <Typography variant="body2" fontWeight={selectedDay === null ? 'medium' : 'normal'}>
                Alle anzeigen
              </Typography>
              
              <Chip 
                label={schedules.length}
                size="small"
                color={selectedDay === null ? "primary" : "default"}
                sx={{ mt: 0.5, height: 20 }}
              />
            </Box>
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
          <Typography variant="subtitle2" color="text.secondary">
            {selectedDay !== null 
              ? `Zeitpläne für ${schedulesByDay[selectedDay]?.label}`
              : 'Alle Zeitpläne'
            }
          </Typography>
          
          <Button 
            startIcon={<AddIcon />} 
            size="small"
            onClick={onAddSchedule}
          >
            Zeitplan hinzufügen
          </Button>
        </Box>
        
        {schedulesToDisplay.length === 0 ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderStyle: 'dashed'
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Keine Zeitpläne für diesen Tag konfiguriert
            </Typography>
            <Button 
              startIcon={<AddIcon />} 
              size="small" 
              onClick={onAddSchedule}
              sx={{ mt: 1 }}
            >
              Zeitplan hinzufügen
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {schedulesToDisplay.map((schedule) => (
              <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 2,
                    borderLeft: schedule.is_active 
                      ? `3px solid ${theme.palette.primary.main}` 
                      : `3px solid ${theme.palette.grey[400]}`,
                    backgroundColor: schedule.is_active
                      ? alpha(theme.palette.primary.main, 0.02)
                      : alpha(theme.palette.grey[100], 0.3)
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <AccessTimeIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5, 
                            color: schedule.is_active ? theme.palette.primary.main : theme.palette.grey[500]
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
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Zeitplan löschen">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => onDeleteSchedule(schedule)}
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
                        sx={{ color: theme.palette.primary.main, mr: 1 }} 
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
                    <Box sx={{ mt: 2, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.repeated_cycles}x Wiederholung mit {schedule.cycle_pause} Min. Pause
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}