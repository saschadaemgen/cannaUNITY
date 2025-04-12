import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RoomForm from '../components/RoomForm';

const RoomCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/rooms/', formData);
      navigate('/rooms');
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Ein Fehler ist beim Erstellen des Raums aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Neuen Raum erstellen
          </Typography>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <RoomForm onSubmit={handleSubmit} isLoading={loading} />
        
        <Box sx={{ mt: 2 }}>
          <Button component={Link} to="/rooms" variant="text">
            Zurück zur Raumliste
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RoomCreate;