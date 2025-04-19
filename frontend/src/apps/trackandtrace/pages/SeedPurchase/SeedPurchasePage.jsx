// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchasePage.jsx
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
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButtonGroup,
  ToggleButton 
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../../../utils/api';
import TableComponent from '../../components/TableComponent';
import SeedPurchaseDetails from './SeedPurchaseDetails';
import SeedPurchaseForm from './SeedPurchaseForm';

const SeedPurchasePage = () => {
  const [seeds, setSeeds] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'destroyed', 'transferred'
  const [openForm, setOpenForm] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'strain_name', label: 'Sorte', minWidth: 150 },
    { id: 'manufacturer', label: 'Hersteller', minWidth: 120 },
    { 
      id: 'purchase_date', 
      label: 'Kaufdatum', 
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
    { id: 'total_seeds', label: 'Samen gesamt', minWidth: 120, align: 'right' },
    { id: 'remaining_seeds', label: 'Samen übrig', minWidth: 120, align: 'right' },
  ];

  // Daten laden
  const fetchData = async () => {
    setLoading(true);
    try {
      // API-Parameter je nach Status
      let queryParams = '';
      if (status === 'destroyed') {
        queryParams = '?destroyed=true';
      } else if (status === 'transferred') {
        queryParams = '?transferred=true';
      } else {
        queryParams = ''; // Aktive (weder vernichtet noch übergeführt)
      }
      
      console.log(`Fetching seeds with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/seeds/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setSeeds(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setSeeds(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setSeeds([]);
      }
      
      // Mitglieder laden (für Vernichtungsdialog)
      try {
        const membersResponse = await api.get('/members/');
        if (membersResponse.data && Array.isArray(membersResponse.data)) {
          setMembers(membersResponse.data);
        } else if (membersResponse.data && membersResponse.data.results && Array.isArray(membersResponse.data.results)) {
          setMembers(membersResponse.data.results);
        } else {
          console.error('Unerwartetes Datenformat für Mitglieder:', membersResponse.data);
          setMembers([]);
        }
      } catch (membersErr) {
        console.error('Fehler beim Laden der Mitglieder:', membersErr);
        setMembers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Samen-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]); // Status statt showDestroyed als Abhängigkeit

  // Formular-Handling
  const handleOpenForm = (seed = null) => {
    setCurrentSeed(seed);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentSeed(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentSeed) {
        // Update
        await api.put(`/trackandtrace/seeds/${currentSeed.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/seeds/', formData);
      }
      fetchData();
      handleCloseForm();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      // Hier könnte man ein Fehler-Feedback im Formular anzeigen
    }
  };

  // Destroy-Dialog-Handling
  const handleOpenDestroyDialog = (seed) => {
    setCurrentSeed(seed);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentSeed(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/seeds/${currentSeed.uuid}/destroy_item/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };

  // Delete-Handling
  const handleDelete = async (seed) => {
    // Hier sollte es eigentlich eine Bestätigungsdialog geben
    if (window.confirm(`Sind Sie sicher, dass Sie ${seed.strain_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/seeds/${seed.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
      }
    }
  };

  if (loading && seeds.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Samen-Verwaltung
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          {/* Status-Buttons als ToggleButtonGroup */}
          <ToggleButtonGroup
            value={status}
            exclusive
            onChange={(e, newStatus) => newStatus && setStatus(newStatus)}
            aria-label="Status-Filter"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="active" color="primary">
              Aktiv
            </ToggleButton>
            <ToggleButton value="destroyed" color="error">
              Vernichtet
            </ToggleButton>
            <ToggleButton value="transferred" color="success">
              Überführt
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
            disabled={status !== 'active'} // Nur bei aktivem Filter neue Einträge zulassen
          >
            Neuer Samen-Einkauf
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={seeds}
          detailsComponent={(props) => (
            <SeedPurchaseDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              status={status} // Status als Prop übergeben
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
          {currentSeed ? 'Samen-Einkauf bearbeiten' : 'Neuer Samen-Einkauf'}
        </DialogTitle>
        <DialogContent>
          <SeedPurchaseForm 
            initialData={currentSeed} 
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
        <DialogTitle>Samen als vernichtet markieren</DialogTitle>
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
          
          {/* Mitgliedauswahl für Vernichtung */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Verantwortliches Mitglied</InputLabel>
            <Select
              value={destroyingMember}
              onChange={(e) => setDestroyingMember(e.target.value)}
              label="Verantwortliches Mitglied"
            >
              {Array.isArray(members) && members.length > 0 ? 
                members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {`${member.first_name} ${member.last_name}`}
                  </MenuItem>
                )) : 
                <MenuItem disabled>Keine Mitglieder verfügbar</MenuItem>
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDestroyDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkAsDestroyed}
            color="error"
            disabled={!destroyReason || !destroyingMember}
          >
            Als vernichtet markieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SeedPurchasePage;