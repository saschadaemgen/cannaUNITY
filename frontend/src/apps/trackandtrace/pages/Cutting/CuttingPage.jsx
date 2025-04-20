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
  ToggleButton,
  Tooltip
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../../../utils/api';
import TableComponent from '../../components/TableComponent';
import CuttingDetails from './CuttingDetails';
import CuttingForm from './CuttingForm';
import MassDestructionProgress from '../../components/MassDestructionProgress';

const CuttingPage = () => {
  const [cuttings, setCuttings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'destroyed', 'transferred'
  const [openForm, setOpenForm] = useState(false);
  const [currentCutting, setCurrentCutting] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openPhaseDialog, setOpenPhaseDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  
  // Neuer State für individuelle Vernichtung
  const [openDestroyIndividualDialog, setOpenDestroyIndividualDialog] = useState(false);
  const [currentIndividual, setCurrentIndividual] = useState(null);
  
  // Neuer State für "Alle vernichten"
  const [openDestroyAllDialog, setOpenDestroyAllDialog] = useState(false);
  
  // State für die Ladeanimation bei Massenvernichtung
  const [isDestroyingAll, setIsDestroyingAll] = useState(false);

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'cutting_date', 
      label: 'Schneidedatum', 
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
    { id: 'cutting_count', label: 'Stecklinge gesamt', minWidth: 120, align: 'right' },
    { id: 'remaining_cuttings', label: 'Stecklinge übrig', minWidth: 120, align: 'right' },
    { 
      id: 'growth_phase_display', 
      label: 'Wachstumsphase', 
      minWidth: 120 
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Bei Stecklingen
        if (row.cutting_count !== undefined && row.remaining_cuttings !== undefined) {
          const used = row.cutting_count - row.remaining_cuttings;
          const percentage = Math.round((used / row.cutting_count) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}/${row.cutting_count})`;
          return `Teilweise übergeführt (${used}/${row.cutting_count}, ${percentage}%)`;
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
    console.log("Fetching data with status:", status);
    setLoading(true);
    try {
      // API-Parameter je nach Status
      const queryParams = getQueryParams();
      
      console.log(`Fetching cuttings with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/cuttings/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setCuttings(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setCuttings(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setCuttings([]);
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
      
      console.log("Data fetched successfully:", response.data);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]); // Status als Abhängigkeit

  // Formular-Handling
  const handleOpenForm = (cutting = null) => {
    setCurrentCutting(cutting);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentCutting(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentCutting) {
        // Update
        await api.put(`/trackandtrace/cuttings/${currentCutting.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/cuttings/', formData);
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
  const handleOpenDestroyDialog = (cutting) => {
    setCurrentCutting(cutting);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentCutting(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/cuttings/${currentCutting.uuid}/destroy_item/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };

  // Handler für individuelle Vernichtung
  const handleOpenDestroyIndividualDialog = (individual) => {
    setCurrentIndividual(individual);
    setOpenDestroyIndividualDialog(true);
  };

  const handleCloseDestroyIndividualDialog = () => {
    setOpenDestroyIndividualDialog(false);
    setCurrentIndividual(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleDestroyIndividual = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/individualcuttings/${currentIndividual.uuid}/destroy_individual/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyIndividualDialog();
    } catch (err) {
      console.error('Fehler beim Vernichten des einzelnen Stecklings:', err);
    }
  };
  
  // Handler für "Alle vernichten"
  const handleOpenDestroyAllDialog = (cutting) => {
    setCurrentCutting(cutting);
    setOpenDestroyAllDialog(true);
  };
  
  const handleCloseDestroyAllDialog = () => {
    setOpenDestroyAllDialog(false);
    setCurrentCutting(null);
    setDestroyReason('');
    setDestroyingMember('');
  };
  
  // Verbesserte Callback-Funktion für das Beenden der Ladeanimation
  const handleMassDestructionComplete = () => {
    console.log("Massenvernichtung abgeschlossen, lade Daten neu...");
    
    // Animation deaktivieren
    setIsDestroyingAll(false);
    
    // Explizit Daten neu laden
    fetchData();
    
    // Optional: Feedback für den Benutzer
    // toast oder andere Benachrichtigungsmethode verwenden, falls vorhanden
    // Alternativ können Sie nach kurzer Verzögerung zur Listenseite navigieren
  };
  
  // Verbesserte handleDestroyAllIndividuals-Funktion
  const handleDestroyAllIndividuals = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      // Dialog zuerst schließen
      handleCloseDestroyAllDialog();
      
      // Dann Animation starten
      setIsDestroyingAll(true);
      
      // API-Aufruf zum Vernichten der Stecklinge
      await api.post(`/trackandtrace/cuttings/${currentCutting.uuid}/destroy_all_individuals/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      
      // Hier KEIN fetchData() aufrufen, das passiert später im onComplete
      
    } catch (err) {
      console.error('Fehler beim Vernichten aller Stecklinge:', err);
      alert('Es ist ein Fehler aufgetreten: ' + (err.response?.data?.error || err.message));
      
      // Animation beenden und Daten bei Fehler neu laden
      setIsDestroyingAll(false);
      fetchData();
    }
  };

  // Phase-Dialog-Handling
  const handleOpenPhaseDialog = (cutting) => {
    setCurrentCutting(cutting);
    setSelectedPhase(cutting.growth_phase);
    setOpenPhaseDialog(true);
  };

  const handleClosePhaseDialog = () => {
    setOpenPhaseDialog(false);
    setCurrentCutting(null);
    setSelectedPhase('');
  };

  const handleUpdatePhase = async () => {
    if (!selectedPhase) return;
    
    try {
      await api.post(`/trackandtrace/cuttings/${currentCutting.uuid}/update_growth_phase/`, {
        growth_phase: selectedPhase
      });
      fetchData();
      handleClosePhaseDialog();
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Wachstumsphase:', err);
    }
  };

  // Delete-Handling
  const handleDelete = async (cutting) => {
    // Hier sollte es eigentlich eine Bestätigungsdialog geben
    if (window.confirm(`Sind Sie sicher, dass Sie ${cutting.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/cuttings/${cutting.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
      }
    }
  };

  if (loading && cuttings.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stecklinge-Verwaltung
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
            Neuer Steckling
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={cuttings}
          detailsComponent={(props) => (
            <CuttingDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onUpdatePhase={handleOpenPhaseDialog}
              onDestroyIndividual={handleOpenDestroyIndividualDialog}
              onDestroyAllIndividuals={handleOpenDestroyAllDialog}
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
          {currentCutting ? 'Steckling bearbeiten' : 'Neuer Steckling'}
        </DialogTitle>
        <DialogContent>
          <CuttingForm 
            initialData={currentCutting} 
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
        <DialogTitle>Steckling als vernichtet markieren</DialogTitle>
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
      
      {/* Dialog für individuelle Vernichtung */}
      <Dialog
        open={openDestroyIndividualDialog}
        onClose={handleCloseDestroyIndividualDialog}
      >
        <DialogTitle>Einzelnen Steckling vernichten</DialogTitle>
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
          <Button onClick={handleCloseDestroyIndividualDialog}>Abbrechen</Button>
          <Button 
            onClick={handleDestroyIndividual}
            color="error"
            disabled={!destroyReason || !destroyingMember}
          >
            Steckling vernichten
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog für "Alle Stecklinge vernichten" */}
      <Dialog
        open={openDestroyAllDialog}
        onClose={handleCloseDestroyAllDialog}
      >
        <DialogTitle>Alle Stecklinge vernichten</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Sind Sie sicher, dass Sie alle verbleibenden Stecklinge ({currentCutting?.remaining_cuttings || 0}) 
            von "{currentCutting?.genetic_name}" vernichten möchten?
          </Typography>
          <Typography gutterBottom color="error" fontWeight="bold">
            Diese Aktion kann nicht rückgängig gemacht werden!
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
          <Button onClick={handleCloseDestroyAllDialog}>Abbrechen</Button>
          <Button 
            onClick={handleDestroyAllIndividuals}
            color="error"
            variant="contained"
            disabled={!destroyReason || !destroyingMember}
          >
            Alle Stecklinge vernichten
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
              <MenuItem value="cutting">Frischer Schnitt</MenuItem>
              <MenuItem value="rooting">Bewurzelung</MenuItem>
              <MenuItem value="vegetative">Vegetative Phase</MenuItem>
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
      
      {/* Ladeanimation für Massenvernichtung */}
      <MassDestructionProgress 
        open={isDestroyingAll} 
        totalItems={currentCutting?.remaining_cuttings || 0}
        geneticName={currentCutting?.genetic_name || ""}
        onComplete={handleMassDestructionComplete}
      />
    </Container>
  );
};

export default CuttingPage;