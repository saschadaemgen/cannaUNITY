import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, CardActions, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/rooms/');
        console.log('API response:', response.data); // Debug: Schauen wir, was zurückkommt
        
        // Prüfen, ob es sich um ein paginiertes Ergebnis handelt
        if (response.data && response.data.results) {
          setRooms(response.data.results);
        } else if (Array.isArray(response.data)) {
          setRooms(response.data);
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
  }, []);
  
  if (loading) {
    return <Typography>Lädt...</Typography>;
  }
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  
  // Sicherheitsprüfung vor dem Rendern
  if (!Array.isArray(rooms)) {
    return <Typography color="error">Die Daten haben ein unerwartetes Format</Typography>;
  }
  
  if (rooms.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Raumliste
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              component={Link} 
              to="/rooms/new"
            >
              Neuen Raum hinzufügen
            </Button>
          </Box>
          <Typography>Keine Räume gefunden. Erstellen Sie einen neuen Raum.</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Raumliste
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/rooms/new"
          >
            Neuen Raum hinzufügen
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {room.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {room.description || 'Keine Beschreibung verfügbar'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={`Kapazität: ${room.capacity}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={room.is_active ? 'Aktiv' : 'Inaktiv'} 
                      size="small" 
                      color={room.is_active ? 'success' : 'error'} 
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to={`/rooms/${room.id}`}>
                    Details
                  </Button>
                  <Button size="small" component={Link} to={`/rooms/${room.id}/edit`}>
                    Bearbeiten
                  </Button>
                  <Button size="small" color="error" component={Link} to={`/rooms/${room.id}/delete`}>
                    Löschen
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default RoomList;