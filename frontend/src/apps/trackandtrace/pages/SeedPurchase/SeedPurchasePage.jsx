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
import SeedPurchaseDetails from './SeedPurchaseDetails';
import SeedPurchaseForm from './SeedPurchaseForm';

const SeedPurchasePage = () => {
  // Bestehende State-Variablen beibehalten
  const [seedPurchases, setSeedPurchases] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Anpassung für erweiterten Status
  const [status, setStatus] = useState('active'); // 'active', 'transferred', 'destroyed'
  const [openForm, setOpenForm] = useState(false);
  const [currentSeedPurchase, setCurrentSeedPurchase] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  // Neue Status-Variablen für Überführungsdialog
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState(''); // 'partially' oder 'fully'
  const [transferringMember, setTransferringMember] = useState('');

  // Bestehende Tabellenspalten beibehalten und um Überführungsstatus erweitern
  const columns = [
    // Bestehende Spalten beibehalten
    // Beispiel:
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'strain_name', label: 'Sortenname', minWidth: 150 },
    { id: 'genetics', label: 'Genetik', minWidth: 150 },
    // ... weitere Spalten ...
    
    // Neue Spalte für Überführungsstatus
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Bei Samen
        if (row.total_seeds !== undefined && row.remaining_seeds !== undefined) {
          const used = row.total_seeds - row.remaining_seeds;
          const percentage = Math.round((used / row.total_seeds) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}/${row.total_seeds})`;
          return `Teilweise übergeführt (${used}/${row.total_seeds}, ${percentage}%)`;
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

  // API-Parameter je nach Status
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

  // Bestehende Funktionen beibehalten
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = getQueryParams();
      const response = await api.get(`/trackandtrace/seeds/${queryParams}`);
      
      // Daten setzen (Anpassung je nach API-Struktur)
      if (Array.isArray(response.data)) {
        setSeedPurchases(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setSeedPurchases(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setSeedPurchases([]);
      }
      
      // Mitglieder laden (für Vernichtungs- und Überführungsdialog)
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
  }, [status]);

  // Formular-Handling (bestehend)
  const handleOpenForm = (seedPurchase = null) => {
    setCurrentSeedPurchase(seedPurchase);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentSeedPurchase(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentSeedPurchase) {
        // Update
        await api.put(`/trackandtrace/seeds/${currentSeedPurchase.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/seeds/', formData);
      }
      fetchData();
      handleCloseForm();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      if (err.response && err.response.data) {
        alert(`Fehler beim Speichern: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Destroy-Dialog-Handling (bestehend)
  const handleOpenDestroyDialog = (seedPurchase) => {
    setCurrentSeedPurchase(seedPurchase);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentSeedPurchase(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/seeds/${currentSeedPurchase.uuid}/destroy_item/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };
  
  // Neue Funktionen für Überführungsdialog
  const handleOpenTransferDialog = (seedPurchase, type) => {
    setCurrentSeedPurchase(seedPurchase);
    setTransferType(type); // 'partially' oder 'fully'
    setOpenTransferDialog(true);
  };
  
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setCurrentSeedPurchase(null);
    setTransferType('');
    setTransferringMember('');
  };
  
  const handleMarkAsTransferred = async () => {
    if (!transferringMember) return;
    
    try {
      const endpoint = transferType === 'partially' 
        ? 'mark_as_partially_transferred' 
        : 'mark_as_fully_transferred';
        
      await api.post(`/trackandtrace/seeds/${currentSeedPurchase.uuid}/${endpoint}/`, {
        transferring_member: transferringMember
      });
      fetchData();
      handleCloseTransferDialog();
    } catch (err) {
      console.error(`Fehler beim Markieren als ${transferType === 'partially' ? 'teilweise' : 'vollständig'} übergeführt:`, err);
      if (err.response && err.response.data) {
        alert(`Fehler: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Delete-Handling (bestehend)
  const handleDelete = async (seedPurchase) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${seedPurchase.strain_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/seeds/${seedPurchase.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && seedPurchases.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Samen-Verwaltung
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
            Neuer Samen-Einkauf
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={seedPurchases}
          detailsComponent={(props) => (
            <SeedPurchaseDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onMarkAsPartiallyTransferred={(seedPurchase) => handleOpenTransferDialog(seedPurchase, 'partially')}
              onMarkAsFullyTransferred={(seedPurchase) => handleOpenTransferDialog(seedPurchase, 'fully')}
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
          {currentSeedPurchase ? 'Samen-Einkauf bearbeiten' : 'Neuer Samen-Einkauf'}
        </DialogTitle>
        <DialogContent>
          <SeedPurchaseForm 
            initialData={currentSeedPurchase} 
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
        <DialogTitle>Samen-Einkauf als vernichtet markieren</DialogTitle>
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
      
      {/* Überführungs-Dialog */}
      <Dialog
        open={openTransferDialog}
        onClose={handleCloseTransferDialog}
      >
        <DialogTitle>
          {transferType === 'partially' 
            ? 'Als teilweise übergeführt markieren' 
            : 'Als vollständig übergeführt markieren'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {transferType === 'partially'
              ? 'Markieren Sie diesen Samen-Einkauf als teilweise an den nächsten Prozessschritt übergeführt.'
              : 'Markieren Sie diesen Samen-Einkauf als vollständig an den nächsten Prozessschritt übergeführt.'}
          </Typography>
          
          {/* Mitgliedauswahl für Überführung */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Verantwortliches Mitglied</InputLabel>
            <Select
              value={transferringMember}
              onChange={(e) => setTransferringMember(e.target.value)}
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
          <Button onClick={handleCloseTransferDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkAsTransferred}
            color={transferType === 'partially' ? 'info' : 'success'}
            disabled={!transferringMember}
          >
            {transferType === 'partially' 
              ? 'Als teilweise übergeführt markieren' 
              : 'Als vollständig übergeführt markieren'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SeedPurchasePage;