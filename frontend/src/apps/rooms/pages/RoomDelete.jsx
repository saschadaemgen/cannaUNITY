import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RoomDelete = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/api/rooms/${id}/`);
        setRoom(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching room:', error);
        setError('Raum konnte nicht geladen werden.');
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [id]);
  
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    
    try {
      await axios.delete(`/api/rooms/${id}/`);
      navigate('/rooms');
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Ein Fehler ist beim Löschen des Raums aufgetreten.');
      setDeleting(false);
      setDialogOpen(false);
    }
  };
  
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
          <Typography variant="h4" component="h1" gutterBottom>
            Raum löschen
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Möchten Sie wirklich den folgenden Raum löschen?
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <Typography variant="body1">
              <strong>Name:</strong> {room.name}
            </Typography>
            <Typography variant="body1">
              <strong>Beschreibung:</strong> {room.description || 'Keine Beschreibung'}
            </Typography>
            <Typography variant="body1">
              <strong>Kapazität:</strong> {room.capacity}
            </Typography>
            <Typography variant="body1">
              <strong>Status:</strong> {room.is_active ? 'Aktiv' : 'Inaktiv'}
            </Typography>
          </Box>
          
          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button variant="outlined" component={Link} to={`/rooms/${id}`}>
              Abbrechen
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleOpenDialog}
            >
              Löschen
            </Button>
          </Box>
        </Paper>
      </Box>
      
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Raum löschen bestätigen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sind Sie sicher, dass Sie den Raum "{room.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Abbrechen
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoomDelete;