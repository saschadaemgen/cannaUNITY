// frontend/src/apps/rooms/pages/RoomItemTypeCreate.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RoomItemTypeForm from '../components/RoomItemTypeForm';

const RoomItemTypeCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/room-item-types/', formData);
      // Nach erfolgreicher Erstellung zurück zur Liste navigieren
      navigate('/rooms/item-types');
    } catch (error) {
      console.error('Error creating room item type:', error);
      setError('Ein Fehler ist beim Erstellen des Elementtyps aufgetreten.');
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Neuen Raumelement-Typ erstellen
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <RoomItemTypeForm onSubmit={handleSubmit} isLoading={loading} />
        
        <Box sx={{ mt: 2 }}>
          <Button component={Link} to="/rooms/item-types" variant="text">
            Zurück zur Liste
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RoomItemTypeCreate;