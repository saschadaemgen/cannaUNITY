// frontend/src/apps/controller/components/common/DateRangePicker.jsx
import React, { useState } from 'react';
import { 
  Box, Button, IconButton, Menu, MenuItem, 
  TextField, Typography, Popover, Paper,
  useTheme, alpha
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import DateAdapter from '@mui/lab/AdapterDateFns';
import { LocalizationProvider, StaticDatePicker } from '@mui/lab';
import { format, isAfter, isBefore, isEqual, isWithinInterval, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Komponente zur Auswahl eines Datumsbereichs mit Schnellauswahl-Optionen
 * und benutzerdefinierten Bereichen.
 *
 * @param {Object} props
 * @param {Object} props.initialRange - Anfänglicher Datumsbereich: { start, end }
 * @param {Function} props.onChange - Callback bei Änderung des Datumsbereichs
 * @param {boolean} props.compact - Kompakte Darstellung aktivieren/deaktivieren
 */
export default function DateRangePicker({ 
  initialRange = { 
    start: subDays(new Date(), 30), 
    end: new Date() 
  }, 
  onChange,
  compact = false
}) {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState(initialRange);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quickSelectAnchorEl, setQuickSelectAnchorEl] = useState(null);
  const [selectingStart, setSelectingStart] = useState(true);

  // Datumsformat für die Anzeige
  const formatDate = (date) => {
    return format(date, 'dd.MM.yyyy', { locale: de });
  };

  // Popover öffnen
  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectingStart(true);
  };

  // Popover schließen
  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  // Quick-Select-Menü öffnen
  const handleOpenQuickSelect = (event) => {
    setQuickSelectAnchorEl(event.currentTarget);
  };

  // Quick-Select-Menü schließen
  const handleCloseQuickSelect = () => {
    setQuickSelectAnchorEl(null);
  };

  // Schnellauswahl-Optionen
  const quickSelectOptions = [
    { 
      label: 'Heute', 
      value: 'today',
      getRange: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(new Date())
      })
    },
    { 
      label: 'Gestern', 
      value: 'yesterday',
      getRange: () => ({
        start: startOfDay(subDays(new Date(), 1)),
        end: endOfDay(subDays(new Date(), 1))
      })
    },
    { 
      label: 'Letzte 7 Tage', 
      value: 'last7days',
      getRange: () => ({
        start: startOfDay(subDays(new Date(), 6)),
        end: endOfDay(new Date())
      })
    },
    { 
      label: 'Letzte 30 Tage', 
      value: 'last30days',
      getRange: () => ({
        start: startOfDay(subDays(new Date(), 29)),
        end: endOfDay(new Date())
      })
    },
    { 
      label: 'Dieser Monat', 
      value: 'thisMonth',
      getRange: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: endOfDay(new Date())
        };
      }
    },
    { 
      label: 'Letzter Monat', 
      value: 'lastMonth',
      getRange: () => {
        const now = new Date();
        const lastMonth = now.getMonth() - 1;
        const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = lastMonth < 0 ? 11 : lastMonth;
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        return {
          start: new Date(year, month, 1),
          end: new Date(year, month, lastDay, 23, 59, 59)
        };
      }
    }
  ];

  // Schnellauswahl anwenden
  const applyQuickSelect = (option) => {
    const newRange = option.getRange();
    setDateRange(newRange);
    if (onChange) {
      onChange(newRange);
    }
    handleCloseQuickSelect();
    handleClosePopover();
  };

  // Datum auswählen (Start oder Ende)
  const handleDateChange = (date) => {
    date = startOfDay(date);
    
    if (selectingStart) {
      // Wenn Startdatum nach Enddatum liegt, setze Enddatum auf Startdatum
      const end = isAfter(date, dateRange.end) ? date : dateRange.end;
      setDateRange({ start: date, end });
      setSelectingStart(false);
    } else {
      // Wenn Enddatum vor Startdatum liegt, ignorieren
      if (isBefore(date, dateRange.start)) return;
      
      setDateRange({ ...dateRange, end: endOfDay(date) });
      
      // Wenn beide Daten ausgewählt wurden, Popover schließen
      handleClosePopover();
      
      // Änderung signalisieren
      if (onChange) {
        onChange({ ...dateRange, end: endOfDay(date) });
      }
    }
  };

  // Anwenden der Auswahl
  const applySelection = () => {
    if (onChange) {
      onChange(dateRange);
    }
    handleClosePopover();
  };

  // Ist das Popover geöffnet?
  const open = Boolean(anchorEl);
  const quickSelectOpen = Boolean(quickSelectAnchorEl);

  // Benutzerdefinierte Datumsvalidierung
  const shouldDisableDate = (date) => {
    const today = new Date();
    
    // Keine zukünftigen Daten erlauben
    if (isAfter(date, today)) {
      return true;
    }
    
    // Wenn Startdatum ausgewählt wird, keine Einschränkungen
    if (selectingStart) {
      return false;
    }
    
    // Wenn Enddatum ausgewählt wird, muss es nach dem Startdatum liegen
    return isBefore(date, dateRange.start);
  };

  // Datumsmarkierung anpassen
  const renderDay = (day, _value, DayComponentProps) => {
    const isSelected = 
      isEqual(day, dateRange.start) || 
      isEqual(day, dateRange.end);
    
    const isInRange = isWithinInterval(day, { 
      start: dateRange.start, 
      end: dateRange.end 
    });

    return (
      <Box
        sx={{
          position: 'relative',
          '&::after': isInRange && !isSelected ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: '50%',
            zIndex: -1
          } : {}
        }}
      >
        <DayComponentProps.Day {...DayComponentProps} />
      </Box>
    );
  };

  return (
    <Box>
      {/* Kompakte Anzeige */}
      {compact ? (
        <IconButton
          onClick={handleOpenPopover}
          size="small"
          sx={{ 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 0.5
          }}
        >
          <DateRangeIcon />
        </IconButton>
      ) : (
        <Button
          variant="outlined"
          startIcon={<DateRangeIcon />}
          onClick={handleOpenPopover}
          endIcon={<ArrowForwardIcon />}
          size="small"
          sx={{ 
            textTransform: 'none',
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}
        >
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </Button>
      )}

      {/* Quick-Select-Menü */}
      <Menu
        anchorEl={quickSelectAnchorEl}
        open={quickSelectOpen}
        onClose={handleCloseQuickSelect}
      >
        {quickSelectOptions.map((option) => (
          <MenuItem 
            key={option.value} 
            onClick={() => applyQuickSelect(option)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Popover für Datumsauswahl */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 350 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Zeitraum auswählen
            </Typography>
            <Box>
              <IconButton 
                size="small" 
                onClick={handleOpenQuickSelect}
                sx={{ mr: 1 }}
              >
                <TodayIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleClosePopover}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Von"
              value={formatDate(dateRange.start)}
              size="small"
              onClick={() => setSelectingStart(true)}
              InputProps={{
                readOnly: true,
                startAdornment: <EventIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
              }}
              sx={{ width: '48%' }}
            />
            <TextField
              label="Bis"
              value={formatDate(dateRange.end)}
              size="small"
              onClick={() => setSelectingStart(false)}
              InputProps={{
                readOnly: true,
                startAdornment: <EventIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
              }}
              sx={{ width: '48%' }}
            />
          </Box>

          <LocalizationProvider dateAdapter={DateAdapter} locale={de}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={selectingStart ? dateRange.start : dateRange.end}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
              showToolbar={false}
              disableFuture
              shouldDisableDate={shouldDisableDate}
              renderDay={renderDay}
            />
          </LocalizationProvider>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClosePopover} sx={{ mr: 1 }}>
              Abbrechen
            </Button>
            <Button 
              variant="contained" 
              onClick={applySelection}
            >
              Anwenden
            </Button>
          </Box>
        </Paper>
      </Popover>
    </Box>
  );
}