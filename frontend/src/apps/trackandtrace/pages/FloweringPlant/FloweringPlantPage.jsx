// frontend/src/apps/trackandtrace/pages/FloweringPlant/FloweringPlantPage.jsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../../../utils/api';
import TableComponent from '../../components/TableComponent';
import FloweringPlantDetails from './FloweringPlantDetails';
import FloweringPlantForm from './FloweringPlantForm';

const FloweringPlantPage = () => {
  const [floweringPlants, setFloweringPlants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'destroyed', 'transferred'
  const [openForm, setOpenForm] = useState(false);
  const [currentPlant, setCurrentPlant] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openPhaseDialog, setOpenPhaseDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  
  // Neuen State für Ernte-Dialog hinzufügen
  const [openHarvestDialog, setOpenHarvestDialog] = useState(false);

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'planting_date', 
      label: 'Pflanzungsdatum', 
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
    { id: 'plant_count', label: 'Pflanzen gesamt', minWidth: 120, align: 'right' },
    { id: 'remaining_plants', label: 'Pflanzen übrig', minWidth: 120, align: 'right' },
    { 
      id: 'growth_phase_display', 
      label: 'Wachstumsphase', 
      minWidth: 120 
    },
    {
      id: 'source',
      label: 'Herkunft',
      minWidth: 150,
      format: (value, row) => {
        if (row.seed_source_details) {
          return `Samen: ${row.seed_source_details.strain_name}`;
        } else if (row.cutting_source_details) {
          return `Steckling: ${row.cutting_source_details.genetic_name}`;
        }
        return 'Unbekannt';
      }
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Bei Pflanzen
        if (row.plant_count !== undefined && row.remaining_plants !== undefined) {
          const used = row.plant_count - row.remaining_plants;
          const percentage = Math.round((used / row.plant_count) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}/${row.plant_count})`;
          return `Teilweise übergeführt (${used}/${row.plant_count}, ${percentage}%)`;
        }
        
        // Fallback für andere Typen oder wenn keine entsprechenden Daten vorhanden sind
        switch (row.transfer_status) {
          case 'fully_transferred': return 'Vollständig übergeführt';
          case 'partially_transferred': return 'Teilweise übergeführt';
          case 'not_transferred':
          default:
            return 'Nicht übergeführt';
        }
      }
    },
  ];

  // Query-Parameter basierend auf Status
  const getQueryParams = () => {
    switch (status) {
      case 'destroyed':
        return '?destroyed=true';
      case 'transferred':
        return '?transfer_status=partially_transferred,fully_transferred';
      case 'active':
      default:
        return ''; // Aktive (weder vernichtet noch übergeführt)
    }
  };

  // Daten laden
  const fetchData = async () => {
    setLoading(true);
    try {
      // API-Parameter je nach Status
      const queryParams = getQueryParams();
      
      console.log(`Fetching flowering plants with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/floweringplants/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setFloweringPlants(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setFloweringPlants(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setFloweringPlants([]);
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
      console.error('Fehler beim Laden der Blühpflanzen-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  // Formular-Handling
  const handleOpenForm = (plant = null) => {
    setCurrentPlant(plant);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentPlant(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentPlant) {
        // Update
        await api.put(`/trackandtrace/floweringplants/${currentPlant.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/floweringplants/', formData);
      }
      fetchData();
      handleCloseForm();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      // Hier könnte man ein Fehler-Feedback im Formular anzeigen
      if (err.response && err.response.data) {
        alert(`Fehler beim Speichern: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Destroy-Dialog-Handling
  const handleOpenDestroyDialog = (plant) => {
    setCurrentPlant(plant);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentPlant(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/floweringplants/${currentPlant.uuid}/destroy_item/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };

  // Phase-Dialog-Handling
  const handleOpenPhaseDialog = (plant) => {
    setCurrentPlant(plant);
    setSelectedPhase(plant.growth_phase);
    setOpenPhaseDialog(true);
  };

  const handleClosePhaseDialog = () => {
    setOpenPhaseDialog(false);
    setCurrentPlant(null);
    setSelectedPhase('');
  };

  const handleUpdatePhase = async () => {
    if (!selectedPhase) return;
    
    try {
      await api.post(`/trackandtrace/floweringplants/${currentPlant.uuid}/update_growth_phase/`, {
        growth_phase: selectedPhase
      });
      fetchData();
      handleClosePhaseDialog();
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Wachstumsphase:', err);
    }
  };

  // Ernte-Dialog-Handling
  const handleOpenHarvestDialog = (plant) => {
    setCurrentPlant(plant);
    setOpenHarvestDialog(true);
  };

  const handleCloseHarvestDialog = () => {
    setOpenHarvestDialog(false);
    setCurrentPlant(null);
  };

  // Ernte-Funktion
  const handleHarvest = async (harvestData) => {
    try {
      // Ernte anlegen
      await api.post('/trackandtrace/harvests/', {
        ...harvestData,
        flowering_plant_source: currentPlant.uuid,
        genetic_name: currentPlant.genetic_name
      });
      
      // Daten neu laden
      fetchData();
      handleCloseHarvestDialog();
    } catch (err) {
      console.error('Fehler beim Anlegen der Ernte:', err);
      if (err.response && err.response.data) {
        alert(`Fehler beim Anlegen der Ernte: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Delete-Handling
  const handleDelete = async (plant) => {
    // Hier sollte es eigentlich einen Bestätigungsdialog geben
    if (window.confirm(`Sind Sie sicher, dass Sie ${plant.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/floweringplants/${plant.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && floweringPlants.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Blühpflanzen-Verwaltung
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
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
            <Tooltip title="An den nächsten Prozessschritt übergeführt (teilweise oder vollständig)">
              <ToggleButton value="transferred" color="success">
                Übergeführt
              </ToggleButton>
            </Tooltip>
            <ToggleButton value="destroyed" color="error">
              Vernichtet
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
            disabled={status !== 'active'} // Nur bei aktivem Filter neue Einträge zulassen
          >
            Neue Blühpflanze
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={floweringPlants}
          detailsComponent={(props) => (
            <FloweringPlantDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onUpdatePhase={handleOpenPhaseDialog}
              onHarvest={handleOpenHarvestDialog}  // Ernte-Funktion übergeben
              status={status}
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
          {currentPlant ? 'Blühpflanze bearbeiten' : 'Neue Blühpflanze'}
        </DialogTitle>
        <DialogContent>
          <FloweringPlantForm 
            initialData={currentPlant} 
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
        <DialogTitle>Blühpflanze als vernichtet markieren</DialogTitle>
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
      
      {/* Phase-Dialog */}
      <Dialog
        open={openPhaseDialog}
        onClose={handleClosePhaseDialog}
      >
        <DialogTitle>Wachstumsphase aktualisieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bitte wählen Sie die aktuelle Wachstumsphase:
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Wachstumsphase</InputLabel>
            <Select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              label="Wachstumsphase"
            >
              <MenuItem value="vegetative">Vegetative Phase</MenuItem>
              <MenuItem value="pre_flower">Vorblüte</MenuItem>
              <MenuItem value="flowering">Blütephase</MenuItem>
              <MenuItem value="late_flower">Spätblüte</MenuItem>
              <MenuItem value="harvest_ready">Erntereif</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePhaseDialog}>Abbrechen</Button>
          <Button 
            onClick={handleUpdatePhase}
            color="primary"
            disabled={!selectedPhase}
          >
            Aktualisieren
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ernte-Dialog */}
      <Dialog
        open={openHarvestDialog}
        onClose={handleCloseHarvestDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ernte erfassen für {currentPlant ? currentPlant.genetic_name : ''}</DialogTitle>
        <DialogContent>
          {currentPlant && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Erntedatum (YYYY-MM-DD)"
                  name="harvest_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputProps={{
                    readOnly: false,
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Anzahl Pflanzen"
                  name="plant_count"
                  type="number"
                  defaultValue={currentPlant.remaining_plants}
                  InputProps={{
                    inputProps: { min: 1, max: currentPlant.remaining_plants },
                  }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Frischgewicht (g)"
                  name="fresh_weight"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  margin="normal"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Erntemethode"
                  name="harvest_method"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Verantwortlicher</InputLabel>
                  <Select
                    name="responsible_member"
                    defaultValue=""
                    label="Verantwortlicher"
                    required
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
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bemerkungen"
                  name="notes"
                  multiline
                  rows={2}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHarvestDialog}>Abbrechen</Button>
          <Button 
            onClick={() => {
              // Daten aus dem Formular sammeln und an handleHarvest übergeben
              const harvestData = {
                harvest_date: document.querySelector('input[name="harvest_date"]').value,
                plant_count: document.querySelector('input[name="plant_count"]').value,
                fresh_weight: document.querySelector('input[name="fresh_weight"]').value,
                harvest_method: document.querySelector('input[name="harvest_method"]').value,
                responsible_member: document.querySelector('select[name="responsible_member"]').value,
                notes: document.querySelector('textarea[name="notes"]').value,
              };
              handleHarvest(harvestData);
            }}
            color="success"
            variant="contained"
          >
            Ernte erfassen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FloweringPlantPage;