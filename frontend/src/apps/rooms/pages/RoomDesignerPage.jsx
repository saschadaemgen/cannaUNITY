// frontend/src/apps/rooms/pages/RoomDesignerPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, Button, Paper, CircularProgress, 
  Snackbar, Alert, Divider, Grid, Tooltip, IconButton,
  Card, CardContent, CardActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import RoomDesigner, { getDesignerItems } from '../components/RoomDesigner';

const RoomDesignerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [itemTypes, setItemTypes] = useState([]);
  const [roomItems, setRoomItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starte Datenabruf für Raum ID:", id); // DEBUG
        
        // Hole die API-Daten
        const [roomResponse, itemTypesResponse, roomItemsResponse] = await Promise.all([
          axios.get(`/api/rooms/${id}/`),
          axios.get('/api/room-item-types/'),
          axios.get(`/api/room-items/?room=${id}`)
        ]);
        
        console.log("Empfangene Raumdaten:", roomResponse.data); // DEBUG
        setRoom(roomResponse.data);
        
        // Überprüfe, ob die Antwort das paginierte Format hat
        console.log("Empfangene Elementtypen:", itemTypesResponse.data); // DEBUG
        if (itemTypesResponse.data && Array.isArray(itemTypesResponse.data.results)) {
          console.log("Verwende paginierte Elementtypen"); // DEBUG
          setItemTypes(itemTypesResponse.data.results);
        } else if (Array.isArray(itemTypesResponse.data)) {
          console.log("Verwende Elementtypen als einfaches Array"); // DEBUG
          setItemTypes(itemTypesResponse.data);
        } else {
          console.error('Unerwartetes Format für Elementtypen:', itemTypesResponse.data);
          setItemTypes([]);
        }
        
        // Auch für roomItems überprüfen
        console.log("Empfangene Raumelemente:", roomItemsResponse.data); // DEBUG
        if (roomItemsResponse.data && Array.isArray(roomItemsResponse.data.results)) {
          console.log("Verwende paginierte Raumelemente"); // DEBUG
          setRoomItems(roomItemsResponse.data.results);
        } else if (Array.isArray(roomItemsResponse.data)) {
          console.log("Verwende Raumelemente als einfaches Array"); // DEBUG
          setRoomItems(roomItemsResponse.data);
        } else {
          console.error('Unerwartetes Format für Raumelemente:', roomItemsResponse.data);
          setRoomItems([]);
        }
        
        setLoading(false);
        console.log("Datenabruf abgeschlossen"); // DEBUG
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('API-Fehlerantwort:', error.response?.data); // DEBUG
        console.error('Stack trace:', error.stack); // DEBUG
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleSaveLayout = async (items) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log("Items zum Speichern (Eingabe):", items); // DEBUG
      
      // Prüfe, ob items ein Array ist
      if (!Array.isArray(items)) {
        console.error("items ist kein Array:", items); // DEBUG
        throw new Error('Ungültiges Layout-Format');
      }
      
      if (items.length === 0) {
        console.warn("Warnung: Speichere leeres Layout"); // DEBUG
      }
      
      console.log("Beginne mit dem Löschen vorhandener Elemente:", roomItems); // DEBUG
      
      // Bestehende Elemente löschen
      for (const item of roomItems) {
        try {
          console.log(`Lösche Element mit ID ${item.id}`); // DEBUG
          await axios.delete(`/api/room-items/${item.id}/`);
          console.log(`Element ${item.id} erfolgreich gelöscht`); // DEBUG
        } catch (deleteError) {
          console.error(`Fehler beim Löschen des Elements ${item.id}:`, deleteError);
          console.error('API-Fehlerantwort:', deleteError.response?.data); // DEBUG
          // Wir setzen fort, auch wenn ein einzelnes Element nicht gelöscht werden kann
        }
      }
      
      console.log("Alle vorhandenen Elemente gelöscht, beginne mit dem Speichern neuer Elemente"); // DEBUG
      
      // Neue Elemente speichern
      const savePromises = items.map((item, index) => {
        // Stelle sicher, dass alle Werte numerisch und definiert sind
        const roomId = parseInt(id, 10) || 0;
        const payload = {
          room: roomId,
          item_type: parseInt(item.item_type, 10) || 0,
          x_position: !isNaN(parseInt(item.x_position, 10)) ? parseInt(item.x_position, 10) : 0,
          y_position: !isNaN(parseInt(item.y_position, 10)) ? parseInt(item.y_position, 10) : 0,
          width: !isNaN(parseInt(item.width, 10)) ? parseInt(item.width, 10) : 1,
          height: !isNaN(parseInt(item.height, 10)) ? parseInt(item.height, 10) : 1,
          rotation: !isNaN(parseInt(item.rotation, 10)) ? parseInt(item.rotation, 10) : 0,
          properties: item.properties || {}
        };
        
        console.log(`Payload für Element ${index}:`, payload); // DEBUG
        return axios.post('/api/room-items/', payload);
      });
      
      const saveResults = await Promise.all(savePromises);
      console.log("Alle neuen Elemente gespeichert:", saveResults.map(r => r.data)); // DEBUG
      
      // Aktualisierte Liste laden
      console.log("Lade aktualisierte Elementliste..."); // DEBUG
      const response = await axios.get(`/api/room-items/?room=${id}`);
      console.log("Antwort bei aktualisierten Elementen:", response.data); // DEBUG
      
      // Verarbeite paginierte Antwort
      if (response.data && Array.isArray(response.data.results)) {
        console.log("Setze roomItems aus paginierten Ergebnissen:", response.data.results); // DEBUG
        setRoomItems(response.data.results);
      } else if (Array.isArray(response.data)) {
        console.log("Setze roomItems aus Array:", response.data); // DEBUG
        setRoomItems(response.data);
      } else {
        console.warn('Unerwartetes Format für Raumelemente:', response.data);
        console.log("Setze roomItems auf leeres Array wegen unerwartetem Format"); // DEBUG
        setRoomItems([]);
      }
      
      setSuccessMessage('Layout erfolgreich gespeichert');
      
      // Kurze Verzögerung, dann zurück zur Raumdetail-Seite navigieren
      console.log("Erfolg! Navigiere zurück zur Raumdetail-Seite in 1,5 Sekunden"); // DEBUG
      setTimeout(() => {
        navigate(`/rooms/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Speichern des Layouts:', error);
      console.error('Stack trace:', error.stack); // DEBUG
      console.error('Response-Daten (falls vorhanden):', error.response?.data); // DEBUG
      setError(`Fehler beim Speichern des Layouts: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };
  
  const handleCloseError = () => {
    setError(null);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error && !room) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert 
            severity="error" 
            onClose={handleCloseError}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
          <Button component={Link} to="/rooms" startIcon={<ArrowBackIcon />}>
            Zurück zur Raumliste
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!room) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography>Raum wurde nicht gefunden.</Typography>
          <Button component={Link} to="/rooms" startIcon={<HomeIcon />} sx={{ mt: 2 }}>
            Zurück zur Raumliste
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" component="h1">
                Raumdesigner: {room.name}
              </Typography>
              <Tooltip title="Info anzeigen">
                <IconButton onClick={() => setShowInfo(!showInfo)}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box>
              <Button 
                variant="outlined" 
                component={Link} 
                to={`/rooms/${id}`}
                startIcon={<VisibilityIcon />}
                sx={{ mr: 1 }}
              >
                Raumdetails
              </Button>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => {
                  const currentItems = getDesignerItems();
                  console.log("Aktuelle Designer-Items:", currentItems);
                  handleSaveLayout(currentItems);
                }}
                disabled={saving}
              >
                {saving ? 'Wird gespeichert...' : 'Layout speichern'}
              </Button>
            </Box>
          </Box>
          
          {showInfo && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Raumdetails</Typography>
                      <Typography variant="body2">
                        <strong>Größe:</strong> {(parseFloat(room.length) || 0)/100}m × {(parseFloat(room.width) || 0)/100}m × {(parseFloat(room.height) || 0)/100}m
                      </Typography>
                      <Typography variant="body2">
                        <strong>Volumen:</strong> {parseFloat(room.volume) || 0} m³
                      </Typography>
                      <Typography variant="body2">
                        <strong>Rastergröße:</strong> {parseFloat(room.grid_size) || 0} cm
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Elemente</Typography>
                      <Typography variant="body2">
                        <strong>Platziert:</strong> {roomItems.length} Elemente
                      </Typography>
                      <Typography variant="body2">
                        <strong>Verfügbar:</strong> {itemTypes.length} Elementtypen
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to="/rooms/item-types"
                      >
                        Elementtypen verwalten
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Anleitung</Typography>
                      <Typography variant="body2">
                        • Ziehe Elemente aus der Bibliothek in den Raum
                      </Typography>
                      <Typography variant="body2">
                        • Klicke ein Element an, um es zu konfigurieren
                      </Typography>
                      <Typography variant="body2">
                        • Ziehe an den Ecken, um die Größe zu ändern
                      </Typography>
                      <Typography variant="body2">
                        • Klicke auf "Layout speichern", um deine Änderungen zu sichern
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
        
        {error && (
          <Alert 
            severity="error" 
            onClose={handleCloseError}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        
        <RoomDesigner 
          room={room} 
          itemTypes={itemTypes} 
          initialItems={roomItems}
          onSave={(updatedItems) => {
            console.log("onSave von RoomDesigner aufgerufen mit:", updatedItems); // DEBUG
            handleSaveLayout(updatedItems);
          }}
        />
      </Box>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoomDesignerPage;