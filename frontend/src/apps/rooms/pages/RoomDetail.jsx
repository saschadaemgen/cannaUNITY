import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Grid, Chip, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/api/rooms/${id}/`);
        setRoom(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching room details:', error);
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [id]);
  
  if (loading) {
    return <Typography>Lädt...</Typography>;
  }
  
  if (!room) {
    return <Typography>Raum wurde nicht gefunden.</Typography>;
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {room.name}
            </Typography>
            <Chip 
              label={room.is_active ? 'Aktiv' : 'Inaktiv'} 
              color={room.is_active ? 'success' : 'error'} 
            />
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Beschreibung</Typography>
              <Typography paragraph>
                {room.description || 'Keine Beschreibung verfügbar'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Kapazität</Typography>
              <Typography>{room.capacity} Personen</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Erstellt von</Typography>
              <Typography>
                {room.created_by ? `${room.created_by.first_name} ${room.created_by.last_name}` : 'Unbekannt'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Erstellt am</Typography>
              <Typography>{new Date(room.created_at).toLocaleDateString()}</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Zuletzt aktualisiert</Typography>
              <Typography>{new Date(room.updated_at).toLocaleDateString()}</Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button variant="outlined" component={Link} to="/rooms">
              Zurück zur Raumliste
            </Button>
            
            <Button variant="contained" component={Link} to={`/rooms/${id}/edit`}>
              Bearbeiten
            </Button>
            <Button variant="contained" color="error" component={Link} to={`/rooms/${id}/delete`}>
              Löschen
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RoomDetail;