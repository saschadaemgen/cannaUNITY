// frontend/src/apps/rooms/components/RoomTable.jsx
import React from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip,
  TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AccordionRow from './common/AccordionRow';
import TableHeader from './common/TableHeader';
import PaginationFooter from './common/PaginationFooter';
import DetailCards from './common/DetailCards';

/**
 * RoomTable Komponente für die Darstellung der Raumliste mit Details
 */
const RoomTable = ({
  data,
  expandedRoomId,
  onExpandRoom,
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Name', width: '13%', align: 'left' },
    { label: 'Raumtyp', width: '10%', align: 'left' },
    { label: 'Beschreibung', width: '16%', align: 'left' },
    { label: 'Größe', width: '10%', align: 'center' },
    { label: 'Fläche (m²)', width: '8%', align: 'center' },
    { label: 'Volumen (m³)', width: '8%', align: 'center' },
    { label: 'Kapazität', width: '7%', align: 'center' },
    { label: 'Pflanzen', width: '7%', align: 'center' },
    { label: 'Status', width: '7%', align: 'center' },
    { label: 'Aktionen', width: '11%', align: 'center' }
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
        width: '13%',
        bold: true,
        icon: TableChartIcon,
        iconColor: 'success.main'
      },
      {
        content: room.room_type_display || 'Sonstiges',
        width: '10%'
      },
      {
        content: room.description || 'Keine Beschreibung vorhanden',
        width: '16%'
      },
      {
        content: `${(room.length / 100).toFixed(1)}m × ${(room.width / 100).toFixed(1)}m`,
        width: '10%',
        align: 'center'
      },
      {
        content: flaeche.toFixed(1),
        width: '8%',
        align: 'center'
      },
      {
        content: volumen.toFixed(1),
        width: '8%',
        align: 'center'
      },
      {
        content: room.capacity,
        width: '7%',
        align: 'center'
      },
      {
        content: room.pflanzenanzahl,
        width: '7%',
        align: 'center'
      },
      {
        content: room.is_active ? 'Aktiv' : 'Inaktiv',
        width: '7%',
        align: 'center',
        color: room.is_active ? 'success.main' : 'error.main'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', pl: 1 }}>
            <Tooltip title="Details anzeigen">
              <IconButton 
                component={Link} 
                to={`/rooms/${room.id}`}
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'info.main',
                  '&:hover': { backgroundColor: 'info.dark' },
                  width: '28px',
                  height: '28px',
                  mr: 0.5
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Raumdesigner öffnen">
              <IconButton 
                component={Link} 
                to={`/rooms/${room.id}/designer`}
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'secondary.main',
                  '&:hover': { backgroundColor: 'secondary.dark' },
                  width: '28px',
                  height: '28px',
                  mr: 0.5
                }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bearbeiten">
              <IconButton 
                component={Link} 
                to={`/rooms/${room.id}/edit`}
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: '28px',
                  height: '28px',
                  mr: 0.5
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Löschen">
              <IconButton 
                component={Link} 
                to={`/rooms/${room.id}/delete`}
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'error.main',
                  '&:hover': { backgroundColor: 'error.dark' },
                  width: '28px',
                  height: '28px',
                  mr: 0.5
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
        width: '11%',
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
            backgroundColor: 'white', 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {room.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Raumtyp:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {room.room_type_display}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Kapazität:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {room.capacity} Personen
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Pflanzenanzahl:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {room.pflanzenanzahl}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Erstellt am:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {new Date(room.created_at).toLocaleDateString('de-DE')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Zuletzt aktualisiert:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Länge:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(room.length / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Breite:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(room.width / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Höhe:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {(room.height / 100).toFixed(2)} m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Fläche:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {flaeche.toFixed(2)} m²
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Volumen:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {volume.toFixed(2)} m³
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Rastergröße:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
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
                    backgroundColor: 'white',
                    p: 2,
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
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
                      color: room.description ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
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
        <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 1 }}>
          <Button 
            variant="contained" 
            color="info" 
            component={Link} 
            to={`/rooms/${room.id}`}
            startIcon={<VisibilityIcon />}
          >
            Details anzeigen
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to={`/rooms/${room.id}/edit`}
            startIcon={<EditIcon />}
          >
            Raum bearbeiten
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            component={Link} 
            to={`/rooms/${room.id}/designer`}
            startIcon={<TableChartIcon />}
          >
            Raumdesigner öffnen
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            component={Link} 
            to={`/rooms/${room.id}/delete`}
            startIcon={<DeleteIcon />}
          >
            Raum löschen
          </Button>
        </Box>
      </>
    );
  };

  // Tabellenkopf vereinfacht mit der TableHeader-Komponente
  const renderTableHeader = () => {
    return <TableHeader columns={headerColumns} />;
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Tabellenkopf */}
      {renderTableHeader()}
  
      {/* Tabellenzeilen */}
      {data && data.length > 0 ? (
        data.map((room) => (
          <AccordionRow
            key={room.id}
            isExpanded={expandedRoomId === room.id}
            onClick={() => onExpandRoom(room.id)}
            columns={getRowColumns(room)}
            borderColor="primary.main"
            expandIconPosition="none" // Deaktiviere das Standard-Icon, da wir ein eigenes verwenden
          >
            {renderRoomDetails(room)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Räume vorhanden
        </Typography>
      )}
  
      {/* Pagination vereinfacht mit der PaginationFooter-Komponente */}
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage="Keine Räume vorhanden"
        color="primary"
      />
    </Box>
  );
};

export default RoomTable;