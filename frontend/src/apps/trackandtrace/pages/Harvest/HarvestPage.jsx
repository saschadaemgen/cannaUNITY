// frontend/src/apps/trackandtrace/pages/Harvest/HarvestPage.jsx
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
import HarvestDetails from './HarvestDetails';
import HarvestForm from './HarvestForm';

const HarvestPage = () => {
  const [harvests, setHarvests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Erweiterte Status-Optionen
  const [status, setStatus] = useState('active'); // 'active', 'transferred', 'destroyed'
  const [openForm, setOpenForm] = useState(false);
  const [currentHarvest, setCurrentHarvest] = useState(null);
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState(''); // 'partially' oder 'fully'
  const [transferringMember, setTransferringMember] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'harvest_date', 
      label: 'Erntedatum', 
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
    { id: 'plant_count', label: 'Pflanzen', minWidth: 100, align: 'right' },
    { 
      id: 'fresh_weight', 
      label: 'Frischgewicht (g)', 
      minWidth: 150, 
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : ''
    },
    { 
      id: 'remaining_fresh_weight', 
      label: 'Verbleibendes Gew. (g)', 
      minWidth: 180, 
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : ''
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Bei Gewichten (Ernte, Trocknung)
        if (row.fresh_weight !== undefined && row.remaining_fresh_weight !== undefined) {
          const used = parseFloat(row.fresh_weight) - parseFloat(row.remaining_fresh_weight);
          const percentage = Math.round((used / parseFloat(row.fresh_weight)) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used.toFixed(2)}g/${parseFloat(row.fresh_weight).toFixed(2)}g)`;
          return `Teilweise übergeführt (${used.toFixed(2)}g/${parseFloat(row.fresh_weight).toFixed(2)}g, ${percentage}%)`;
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
    {
      id: 'source',
      label: 'Herkunft',
      minWidth: 150,
      format: (value, row) => {
        if (row.flowering_plant_source_details) {
          return `${row.flowering_plant_source_details.genetic_name} (${row.flowering_plant_source_details.batch_number})`;
        }
        return 'Unbekannt';
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
        return ''; // Aktive (weder vernichtet noch vollständig übergeführt)
    }
  };

  // Daten laden
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = getQueryParams();
      console.log(`Fetching harvests with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/harvests/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setHarvests(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setHarvests(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setHarvests([]);
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
      console.error('Fehler beim Laden der Ernte-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  // Formular-Handling
  const handleOpenForm = (harvest = null) => {
    setCurrentHarvest(harvest);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentHarvest(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentHarvest) {
        // Update
        await api.put(`/trackandtrace/harvests/${currentHarvest.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/harvests/', formData);
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
  const handleOpenDestroyDialog = (harvest) => {
    setCurrentHarvest(harvest);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentHarvest(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/harvests/${currentHarvest.uuid}/destroy_item/`, {
        reason: destroyReason,
        destroying_member: destroyingMember
      });
      fetchData();
      handleCloseDestroyDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als vernichtet:', err);
    }
  };
  
  // Transfer-Dialog-Handling
  const handleOpenTransferDialog = (harvest, type) => {
    setCurrentHarvest(harvest);
    setTransferType(type); // 'partially' oder 'fully'
    setOpenTransferDialog(true);
  };
  
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setCurrentHarvest(null);
    setTransferType('');
    setTransferringMember('');
  };
  
  const handleMarkAsTransferred = async () => {
    if (!transferringMember) return;
    
    try {
      const endpoint = transferType === 'partially' 
        ? 'mark_as_partially_transferred' 
        : 'mark_as_fully_transferred';
        
      await api.post(`/trackandtrace/harvests/${currentHarvest.uuid}/${endpoint}/`, {
        transferring_member: transferringMember
      });
      fetchData();
      handleCloseTransferDialog();
    } catch (err) {
      console.error(`Fehler beim Markieren als ${transferType === 'partially' ? 'teilweise' : 'vollständig'} übergeführt:`, err);
    }
  };

  // Delete-Handling
  const handleDelete = async (harvest) => {
    // Hier sollte es eigentlich einen Bestätigungsdialog geben
    if (window.confirm(`Sind Sie sicher, dass Sie ${harvest.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/harvests/${harvest.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && harvests.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ernte-Verwaltung
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
            Neue Ernte
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={harvests}
          detailsComponent={(props) => (
            <HarvestDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onMarkAsPartiallyTransferred={(harvest) => handleOpenTransferDialog(harvest, 'partially')}
              onMarkAsFullyTransferred={(harvest) => handleOpenTransferDialog(harvest, 'fully')}
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
          {currentHarvest ? 'Ernte bearbeiten' : 'Neue Ernte'}
        </DialogTitle>
        <DialogContent>
          <HarvestForm 
            initialData={currentHarvest} 
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
        <DialogTitle>Ernte als vernichtet markieren</DialogTitle>
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
              ? 'Markieren Sie diese Ernte als teilweise an den nächsten Prozessschritt übergeführt.'
              : 'Markieren Sie diese Ernte als vollständig an den nächsten Prozessschritt übergeführt.'}
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

export default HarvestPage;