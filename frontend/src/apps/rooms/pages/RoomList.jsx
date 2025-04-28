// frontend/src/apps/rooms/pages/RoomList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, Paper, 
  Fade, Alert, Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

// Komponenten importieren
import RoomTable from '../components/RoomTable';
import PageHeader from '../components/common/PageHeader';
import LoadingIndicator from '../components/common/LoadingIndicator';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Zusätzliche States für erweiterte Funktionalität
  const [expandedRoomId, setExpandedRoomId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/rooms/');
        console.log('API response:', response.data);
        
        // Prüfen, ob es sich um ein paginiertes Ergebnis handelt
        if (response.data && response.data.results) {
          setRooms(response.data.results);
          
          // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
          const total = response.data.count || 0;
          const pages = Math.ceil(total / 10); // Annahme: 10 Einträge pro Seite
          setTotalPages(pages);
        } else if (Array.isArray(response.data)) {
          setRooms(response.data);
          
          // Bei nicht-paginierten Daten Seitenzahl basierend auf Arraygröße berechnen
          const pages = Math.ceil(response.data.length / 10); 
          setTotalPages(pages);
        } else {
          // Fallback: Leeres Array, wenn das Format unbekannt ist
          console.error('Unerwartetes Datenformat:', response.data);
          setRooms([]);
          setError('Unerwartetes Datenformat von der API');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Fehler beim Laden der Räume');
        setRooms([]);
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [currentPage]); // Abhängigkeit hinzugefügt, damit bei Seitenwechsel neu geladen wird
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    // Beim Seitenwechsel alle geöffneten Akkordeons schließen
    setExpandedRoomId('');
  };
  
  const handleAccordionChange = (roomId) => {
    if (expandedRoomId === roomId) {
      setExpandedRoomId('');
    } else {
      setExpandedRoomId(roomId);
    }
  };
  
  const handleCloseError = () => {
    setError(null);
  };
  
  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };
  
  // Zeige einen Ladeindikator, falls die Daten noch geladen werden
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ my: 4 }}>
          <PageHeader 
            title="Raumliste"
            showFilters={false}
            setShowFilters={() => {}}
            actions={
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/rooms/new"
                startIcon={<AddIcon />}
                disabled
              >
                Neuen Raum hinzufügen
              </Button>
            }
          />
          <LoadingIndicator />
        </Box>
      </Container>
    );
  }
  
  // Sicherheitsprüfung vor dem Rendern
  if (!Array.isArray(rooms)) {
    return (
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ my: 4 }}>
          <Alert severity="error" onClose={handleCloseError}>
            Die Daten haben ein unerwartetes Format
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box sx={{ my: 4 }}>
          <PageHeader 
            title="Raumliste"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            actions={
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/rooms/new"
                startIcon={<AddIcon />}
              >
                Neuen Raum hinzufügen
              </Button>
            }
          />
          
          {error && (
            <Alert 
              severity="error" 
              onClose={handleCloseError}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}
          
          {/* Hier kann später ein Filter-Bereich eingefügt werden */}
          {showFilters && (
            <Fade in={showFilters} timeout={500}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">
                  Filter-Optionen können hier später hinzugefügt werden
                </Typography>
              </Paper>
            </Fade>
          )}
          
          {/* RoomTable Komponente einbinden */}
          <RoomTable 
            data={rooms}
            expandedRoomId={expandedRoomId}
            onExpandRoom={handleAccordionChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Box>
      </Fade>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={successMessage}
      />
    </Container>
  );
};

export default RoomList;