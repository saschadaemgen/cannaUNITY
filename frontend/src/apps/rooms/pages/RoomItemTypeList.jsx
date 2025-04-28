// frontend/src/apps/rooms/pages/RoomItemTypeList.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const RoomItemTypeList = () => {
  // Setze einen Anfangswert als leeres Array
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const categoryLabels = {
    'furniture': 'Möbel',
    'lighting': 'Beleuchtung',
    'sensor': 'Sensorik',
    'access': 'Zugang',
    'other': 'Sonstiges'
  };
  
  const categoryColors = {
    'furniture': 'primary',
    'lighting': 'warning',
    'sensor': 'info',
    'access': 'success',
    'other': 'default'
  };
  
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const response = await axios.get('/api/room-item-types/');
        // Überprüfe, ob die Antwort das paginierte Format hat
        if (response.data && Array.isArray(response.data.results)) {
          setItemTypes(response.data.results);
        } else if (Array.isArray(response.data)) {
          setItemTypes(response.data);
        } else {
          console.error('Unerwartetes Datenformat:', response.data);
          setItemTypes([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching room item types:', error);
        setError('Fehler beim Laden der Raumelement-Typen');
        setLoading(false);
      }
    };
    
    fetchItemTypes();
  }, []);
  
  if (loading) {
    return <Typography>Lädt...</Typography>;
  }
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Raumelement-Typen
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/rooms/item-types/new"
          >
            Neuen Elementtyp hinzufügen
          </Button>
        </Box>
        
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Kategorie</TableCell>
                  <TableCell>Standardgröße</TableCell>
                  <TableCell>Erlaubte Pflanzenanzahl</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(itemTypes) && itemTypes.map((itemType) => (
                  <TableRow key={itemType.id}>
                    <TableCell>{itemType.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={categoryLabels[itemType.category] || itemType.category} 
                        color={categoryColors[itemType.category] || 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{itemType.default_width} × {itemType.default_height} cm</TableCell>
                    <TableCell>
                      {itemType.allowed_quantities && itemType.allowed_quantities.length > 0 
                        ? itemType.allowed_quantities.join(', ') 
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        component={Link} 
                        to={`/rooms/item-types/${itemType.id}/edit`}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        component={Link} 
                        to={`/rooms/item-types/${itemType.id}/delete`}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default RoomItemTypeList;