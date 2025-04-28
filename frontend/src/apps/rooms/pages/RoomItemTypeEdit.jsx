// frontend/src/apps/rooms/pages/RoomItemTypeEdit.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RoomItemTypeForm from '../components/RoomItemTypeForm';

const RoomItemTypeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itemType, setItemType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchItemType = async () => {
      try {
        const response = await axios.get(`/api/room-item-types/${id}/`);
        setItemType(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching room item type:', error);
        setError('Elementtyp konnte nicht geladen werden.');
        setLoading(false);
      }
    };
    
    fetchItemType();
  }, [id]);
  
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      await axios.put(`/api/room-item-types/${id}/`, formData);
      navigate('/rooms/item-types');
    } catch (error) {
      console.error('Error updating room item type:', error);
      setError('Ein Fehler ist beim Aktualisieren des Elementtyps aufgetreten.');
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
            Raumelement-Typ bearbeiten: {itemType?.name}
          </Typography>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <RoomItemTypeForm 
          initialData={itemType} 
          onSubmit={handleSubmit} 
          isLoading={submitting} 
        />
        
        <Box sx={{ mt: 2 }}>
          <Button component={Link} to="/rooms/item-types" variant="text">
            Zurück zur Liste
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RoomItemTypeEdit;