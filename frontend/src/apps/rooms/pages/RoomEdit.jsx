import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RoomForm from '../components/RoomForm';

const RoomEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      await axios.put(`/api/rooms/${id}/`, formData);
      navigate(`/rooms/${id}`);
    } catch (error) {
      console.error('Error updating room:', error);
      setError('Ein Fehler ist beim Aktualisieren des Raums aufgetreten.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <Typography>Lädt...</Typography>;
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Raum bearbeiten: {room?.name}
          </Typography>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <RoomForm 
          initialData={room} 
          onSubmit={handleSubmit} 
          isLoading={submitting} 
        />
        
        <Box sx={{ mt: 2 }}>
          <Button component={Link} to={`/rooms/${id}`} variant="text">
            Zurück zu Raumdetails
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RoomEdit;