// frontend/src/apps/rooms/components/RoomTable.jsx
import React, { useState } from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip,
  Paper, useTheme, alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SecurityIcon from '@mui/icons-material/Security';
import BadgeIcon from '@mui/icons-material/Badge';

import AccordionRow from '@/components/common/AccordionRow';
import DetailCards from '@/components/common/DetailCards';
import PaginationFooter from '@/components/common/PaginationFooter';
import SensorDataModal from '@/components/SensorDataModal';

/**
 * RoomTable Komponente für die Darstellung der Raumliste mit Details
 * Vollständig mit Dark Mode Unterstützung
 */
const RoomTable = ({
  data,
  expandedRoomId,
  onExpandRoom,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const theme = useTheme();
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Raumbezeichnung', width: '12%', align: 'left' },
    { label: 'Raumtyp', width: '9%', align: 'left' },
    { label: 'UniFi Access', width: '15%', align: 'left' },
    { label: 'Größe', width: '9%', align: 'center' },
    { label: 'Fläche (m²)', width: '7%', align: 'center' },
    { label: 'Volumen (m³)', width: '7%', align: 'center' },
    { label: 'Max. Pers.', width: '6%', align: 'center' },
    { label: 'Anzahl', width: '7%', align: 'center' },
    { label: 'Status', width: '6%', align: 'center' },
    { label: 'Aktionen', width: '19%', align: 'center' }
  ];

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (room) => {
    // Berechnungen für Fläche und Volumen
    const flaeche = (room.length * room.width) / 10000; // Länge * Breite in m²
    const volumen = (room.length * room.width * room.height) / 1000000; // Volumen in m³
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandRoom(room.id);
            }}
            size="small"
            sx={{ 
              color: 'primary.main',
              width: '28px',
              height: '28px',
              transform: expandedRoomId === room.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        ),
        width: '3%',
        align: 'center'
      },
      {
        content: room.name,
        width: '12%',
        bold: true,
        icon: TableChartIcon,
        iconColor: 'success.main'
      },
      {
        content: room.room_type_display || 'Sonstiges',
        width: '9%'
      },
      {
        content: (() => {
          if (room.unifi_device_info) {
            return (
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                      Device ID: {room.unifi_device_id}
                    </Typography>
                    {room.unifi_device_info.name !== room.unifi_device_info.alias && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        System Name: {room.unifi_device_info.name}
                      </Typography>
                    )}
                  </Box>
                }
                arrow
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    cursor: 'help',
                    '&:hover': {
                      textDecoration: 'underline dotted',
                      textUnderlineOffset: '3px'
                    }
                  }}
                >
                  {room.unifi_device_info.alias || room.unifi_device_info.name}
                </Typography>
              </Tooltip>
            );
          }
          return <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.75rem' }}>Kein Device</Typography>;
        })(),
        width: '15%'
      },
      {
        content: `${(room.length / 100).toFixed(1)}m × ${(room.width / 100).toFixed(1)}m`,
        width: '9%',
        align: 'center'
      },
      {
        content: flaeche.toFixed(1),
        width: '7%',
        align: 'center'
      },
      {
        content: volumen.toFixed(1),
        width: '7%',
        align: 'center'
      },
      {
        content: room.capacity,
        width: '6%',
        align: 'center'
      },
      {
        content: (() => {
          // Für bestimmte Raumtypen spezielle Anzeige
          if (['Sonstiges', 'Produktausgabe'].includes(room.room_type_display)) {
            return '(keine)';
          } else if (['Labor', 'Trocknungsraum', 'Verarbeitung'].includes(room.room_type_display)) {
            return `${room.pflanzenanzahl} Gramm`;
          } else {
            return `${room.pflanzenanzahl} Stück`;
          }
        })(),
        width: '7%',
        align: 'center',
        color: ['Sonstiges', 'Produktausgabe'].includes(room.room_type_display) 
                ? 'text.secondary' 
                : 'text.primary'
      },
      {
        content: room.is_active ? 'Aktiv' : 'Inaktiv',
        width: '6%',
        align: 'center',
        color: room.is_active ? 'success.main' : 'error.main'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
            {/* Details anzeigen */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Details anzeigen">
                <IconButton 
                  component={Link} 
                  to={`/rooms/${room.id}`}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Sensordaten - immer anzeigen, aber disabled wenn keine Sensoren */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                opacity: room.protect_sensors_info && room.protect_sensors_info.length > 0 ? 1 : 0.5,
                '&:hover': room.protect_sensors_info && room.protect_sensors_info.length > 0 ? {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                } : {}
              }}
            >
              <Tooltip title={room.protect_sensors_info && room.protect_sensors_info.length > 0 ? "Sensordaten anzeigen" : "Keine Sensoren vorhanden"}>
                <span>
                  <IconButton 
                    onClick={(e) => {
                      if (room.protect_sensors_info && room.protect_sensors_info.length > 0) {
                        e.stopPropagation();
                        setSelectedRoom(room);
                        setSensorModalOpen(true);
                      }
                    }}
                    size="small"
                    disabled={!room.protect_sensors_info || room.protect_sensors_info.length === 0}
                    sx={{ 
                      p: 0.5,
                      color: room.protect_sensors_info && room.protect_sensors_info.length > 0 
                        ? theme.palette.text.secondary 
                        : theme.palette.action.disabled
                    }}
                  >
                    <ThermostatIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            {/* Sicherheitskamera Platzhalter */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Sicherheitskamera (Demnächst verfügbar)">
                <span>
                  <IconButton 
                    size="small"
                    disabled
                    sx={{ 
                      p: 0.5,
                      color: theme.palette.action.disabled
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            {/* Zeiterfassung Platzhalter */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Digitale Stempelkarte (Demnächst verfügbar)">
                <span>
                  <IconButton 
                    size="small"
                    disabled
                    sx={{ 
                      p: 0.5,
                      color: theme.palette.action.disabled
                    }}
                  >
                    <BadgeIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            {/* Raumdesigner */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Raumdesigner öffnen">
                <IconButton 
                  component={Link} 
                  to={`/rooms/${room.id}/designer`}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <TableChartIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Bearbeiten */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Bearbeiten">
                <IconButton 
                  component={Link} 
                  to={`/rooms/${room.id}/edit`}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <EditIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Löschen */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  borderColor: alpha(theme.palette.error.main, 0.5)
                }
              }}
            >
              <Tooltip title="Löschen">
                <IconButton 
                  component={Link} 
                  to={`/rooms/${room.id}/delete`}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),
        width: '19%',
        align: 'center'
      }
    ];
  };

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (room) => {
    return `Raum ${room.name} wurde am ${new Date(room.created_at).toLocaleDateString('de-DE')} erstellt.`;
  };

  // Detailansicht für einen Raum rendern
  const renderRoomDetails = (room) => {
    const flaeche = (room.length * room.width) / 10000; // Länge * Breite in m²
    const volume = (room.length * room.width * room.height) / 1000000; // m³

    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(room)}
          </Typography>
        </Box>

        {/* Raumdetails mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: 'Raum-Informationen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {room.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Raumtyp:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {room.room_type_display}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Kapazität:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {room.capacity} Personen
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Pflanzenanzahl:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {room.pflanzenanzahl}
                    </Typography>
                  </Box>
                  {room.protect_sensors_info && room.protect_sensors_info.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Sensoren:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {room.protect_sensors_info.length} aktiv
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Erstellt am:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {new Date(room.created_at).toLocaleDateString('de-DE')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Zuletzt aktualisiert:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {new Date(room.updated_at).toLocaleDateString('de-DE')}
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Abmessungen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Länge:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {(room.length / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Breite:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {(room.width / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Höhe:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {(room.height / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Fläche:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {flaeche.toFixed(2)} m²
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Volumen:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {volume.toFixed(2)} m³
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Rastergröße:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {room.grid_size} cm
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Beschreibung',
              content: (
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    p: 2,
                    borderRadius: '4px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: room.description ? 'flex-start' : 'center',
                    justifyContent: room.description ? 'flex-start' : 'center',
                    width: '100%'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontStyle: room.description ? 'normal' : 'italic',
                      color: room.description ? 'text.primary' : 'text.secondary',
                      width: '100%'
                    }}
                  >
                    {room.description || 'Keine Beschreibung für diesen Raum vorhanden'}
                  </Typography>
                </Box>
              )
            }
          ]}
          color="primary.main"
        />

        {/* Aktionsbereich mit ausreichend Abstand zu den Karten darüber */}
        <Box sx={{ display: 'flex', gap: 1, mt: 4, mb: 1, flexWrap: 'wrap' }}>
          {/* Details anzeigen */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/rooms/${room.id}`}
              startIcon={<VisibilityIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Details anzeigen
            </Button>
          </Box>
          
          {/* Sensordaten */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              opacity: room.protect_sensors_info && room.protect_sensors_info.length > 0 ? 1 : 0.5,
              '&:hover': room.protect_sensors_info && room.protect_sensors_info.length > 0 ? {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              } : {}
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => {
                if (room.protect_sensors_info && room.protect_sensors_info.length > 0) {
                  setSelectedRoom(room);
                  setSensorModalOpen(true);
                }
              }}
              startIcon={<ThermostatIcon />}
              disabled={!room.protect_sensors_info || room.protect_sensors_info.length === 0}
              sx={{ 
                textTransform: 'none', 
                color: room.protect_sensors_info && room.protect_sensors_info.length > 0 
                  ? 'text.primary' 
                  : 'text.disabled' 
              }}
            >
              Sensordaten {room.protect_sensors_info && room.protect_sensors_info.length > 0 ? 'anzeigen' : '(keine vorhanden)'}
            </Button>
          </Box>
          
          {/* Sicherheitskamera Platzhalter */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              startIcon={<SecurityIcon />}
              disabled
              sx={{ textTransform: 'none' }}
            >
              Sicherheitskamera (Demnächst)
            </Button>
          </Box>
          
          {/* Zeiterfassung Platzhalter */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              startIcon={<BadgeIcon />}
              disabled
              sx={{ textTransform: 'none' }}
            >
              Zeiterfassung (Demnächst)
            </Button>
          </Box>
          
          {/* Raumdesigner */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/rooms/${room.id}/designer`}
              startIcon={<TableChartIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Raumdesigner öffnen
            </Button>
          </Box>
          
          {/* Bearbeiten */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/rooms/${room.id}/edit`}
              startIcon={<EditIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Raum bearbeiten
            </Button>
          </Box>
          
          {/* Löschen */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                borderColor: alpha(theme.palette.error.main, 0.5)
              }
            }}
          >
            <Button 
              variant="text" 
              color="error" 
              component={Link} 
              to={`/rooms/${room.id}/delete`}
              startIcon={<DeleteIcon />}
              sx={{ textTransform: 'none' }}
            >
              Raum löschen
            </Button>
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default,
      overflow: 'hidden'  // Prevent outer container from scrolling
    }}>
      {/* Scrollbare Container für Header + Content */}
      <Box sx={{ 
        width: '100%',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        {/* Tabellenkopf - sticky innerhalb des scrollbaren Containers */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex',
          bgcolor: theme.palette.background.paper,
          height: '40px',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          // Subtiler Schatten beim Scrollen
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: '2px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
            pointerEvents: 'none'
          }
        }}>
          {headerColumns.map((column, index) => (
            <Box
              key={index}
              sx={{ 
                width: column.width || 'auto', 
                px: 1.5,
                textAlign: column.align || 'left', 
                whiteSpace: 'nowrap',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {column.label}
              </Typography>
            </Box>
          ))}
        </Box>
  
        {/* Tabellenzeilen */}
        {data && data.length > 0 ? (
          data.map((room) => (
            <AccordionRow
              key={room.id}
              isExpanded={expandedRoomId === room.id}
              onClick={() => onExpandRoom(room.id)}
              columns={getRowColumns(room)}
              borderColor="primary.main"
              expandIconPosition="none"
              borderless={true}
            >
              {renderRoomDetails(room)}
            </AccordionRow>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
            Keine Räume vorhanden
          </Typography>
        )}
        
        {/* Pagination innerhalb des scrollbaren Bereichs */}
        {data && data.length > 0 && totalPages > 1 && (
          <Box 
            sx={{ 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              mt: 2,
              pt: 2,
              pb: 1,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasData={true}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Sensor Data Modal */}
      <SensorDataModal
        open={sensorModalOpen}
        onClose={() => {
          setSensorModalOpen(false);
          setSelectedRoom(null);
        }}
        roomId={selectedRoom?.id}
        roomName={selectedRoom?.name}
      />
    </Box>
  );
};

export default RoomTable;