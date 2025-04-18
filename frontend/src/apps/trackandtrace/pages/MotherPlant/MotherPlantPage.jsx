// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../../../utils/api';
import TableComponent from '../../components/TableComponent';
import MotherPlantDetails from './MotherPlantDetails';
import MotherPlantForm from './MotherPlantForm';

const MotherPlantPage = () => {
  const [motherPlants, setMotherPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDestroyed, setShowDestroyed] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [currentMotherPlant, setCurrentMotherPlant] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'strain_name', label: 'Sorte', minWidth: 150 },
    { 
      id: 'planting_date', 
      label: 'Pflanztermin', 
      minWidth: 120,
      format: (value) => {
        // Einfache Datumsformatierung
        if (value) {
          try {
            const parts = value.split('-');
            if (parts.length === 3) {
              return `${parts[2]}.${parts[1]}.${parts[0]}`;  // DD.MM.YYYY
            }
            return value;
          } catch (e) {
            console.error('Fehler bei der Datumsformatierung:', e);
            return value;
          }
        }
        return '';
      }
    },
    { id: 'location', label: 'Standort', minWidth: 120 },
    { 
      id: 'status', 
      label: 'Status', 
      minWidth: 120,
      format: (value) => {
        switch(value) {
          case 'vegetative': return 'Vegetativ';
          case 'flowering': return 'Blühend';
          case 'harvested': return 'Geerntet';
          case 'retired': return 'Ausgemustert';
          default: return value;
        }
      }
    },
  ];

  // Daten laden
  const fetchMotherPlants = async () => {
    setLoading(true);
    try {
      console.log(`Fetching motherplants with destroyed=${showDestroyed}`);
      const response = await api.get(`/trackandtrace/motherplants/?destroyed=${showDestroyed}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setMotherPlants(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setMotherPlants(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setMotherPlants([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Mutterpflanzen-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotherPlants();
  }, [showDestroyed]);

  // Formular-Handling
  const handleOpenForm = (motherPlant = null) => {
    setCurrentMotherPlant(motherPlant);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentMotherPlant(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentMotherPlant) {
        // Update
        await api.put(`/trackandtrace/motherplants/${currentMotherPlant.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/motherplants/', formData);
      }
      fetchMotherPlants();
      handleCloseForm();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      // Hier könnte man ein Fehler-Feedback im Formular anzeigen
    }
  };

  // Destroy-Dialog-Handling
  const handleOpenDestroyDialog = (motherPlant) => {
    setCurrentMotherPlant(motherPlant);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentMotherPlant(null);
    setDestroyReason('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason) return;
    
    try {
      await api.post(`/trackandtrace/motherplants/${currentMotherPlant.uuid}/destroy_item/`, {
        reason: destroyReason
      });
      fetchMotherPlants();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };

  // Delete-Handling
  const handleDelete = async (motherPlant) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${motherPlant.strain_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/motherplants/${motherPlant.uuid}/`);
        fetchMotherPlants();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
      }
    }
  };

  if (loading) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mutterpflanzen-Verwaltung
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button 
            variant="outlined" 
            color={showDestroyed ? "primary" : "secondary"}
            onClick={() => setShowDestroyed(!showDestroyed)}
            sx={{ mr: 2 }}
          >
            {showDestroyed ? "Aktive anzeigen" : "Vernichtete anzeigen"}
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
          >
            Neue Mutterpflanze
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={motherPlants}
          detailsComponent={(props) => (
            <MotherPlantDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
            />
          )}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
        />
      </Box>
      
      {/* Formular-Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentMotherPlant ? 'Mutterpflanze bearbeiten' : 'Neue Mutterpflanze'}
        </DialogTitle>
        <DialogContent>
          <MotherPlantForm 
            initialData={currentMotherPlant} 
            onSave={handleSaveForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
      
      {/* Vernichtungs-Dialog */}
      <Dialog
        open={openDestroyDialog}
        onClose={handleCloseDestroyDialog}
      >
        <DialogTitle>Mutterpflanze als vernichtet markieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bitte geben Sie einen Grund für die Vernichtung an:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Vernichtungsgrund"
            fullWidth
            variant="outlined"
            value={destroyReason}
            onChange={(e) => setDestroyReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDestroyDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkAsDestroyed}
            color="error"
            disabled={!destroyReason}
          >
            Als vernichtet markieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MotherPlantPage;