// frontend/src/apps/trackandtrace/pages/LabTesting/LabTestingPage.jsx
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
import LabTestingDetails from './LabTestingDetails';
import LabTestingForm from './LabTestingForm';

const LabTestingPage = () => {
  const [labTestings, setLabTestings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'partially_transferred', 'fully_transferred', 'destroyed', 'approved'
  const [openForm, setOpenForm] = useState(false);
  const [currentLabTesting, setCurrentLabTesting] = useState(null);
  
  // Dialog-States
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState(''); // 'partially' oder 'fully'
  const [transferringMember, setTransferringMember] = useState('');
  const [openUpdateStatusDialog, setOpenUpdateStatusDialog] = useState(false);
  const [newTestStatus, setNewTestStatus] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'sample_date', 
      label: 'Probenahme', 
      minWidth: 120,
      format: (value) => {
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
    { 
      id: 'test_date', 
      label: 'Testdatum', 
      minWidth: 120,
      format: (value) => {
        if (!value) return 'Ausstehend';
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
    },
    {
      id: 'test_status',
      label: 'Status',
      minWidth: 120,
      format: (value, row) => row.test_status_display || value
    },
    {
      id: 'is_approved',
      label: 'Freigabe',
      minWidth: 120,
      format: (value) => value ? 'Freigegeben' : 'Nicht freigegeben'
    },
    { 
      id: 'sample_weight', 
      label: 'Probengewicht (g)', 
      minWidth: 150, 
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : ''
    },
    { 
      id: 'thc_content', 
      label: 'THC (%)', 
      minWidth: 100, 
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : '-'
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Gewichtsberechnung
        if (row.sample_weight !== undefined && row.remaining_weight !== undefined) {
          const used = parseFloat(row.sample_weight) - parseFloat(row.remaining_weight);
          const percentage = Math.round((used / parseFloat(row.sample_weight)) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}g/${row.sample_weight}g)`;
          return `Teilweise übergeführt (${used}g/${row.sample_weight}g, ${percentage}%)`;
        }
        
        // Fallback
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
        if (row.processing_source_details) {
          return `${row.processing_source_details.genetic_name} (${row.processing_source_details.batch_number})`;
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
      case 'partially_transferred':
        return '?transfer_status=partially_transferred';
      case 'fully_transferred':
        return '?transfer_status=fully_transferred';
      case 'approved':
        return '?is_approved=true';
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
      console.log(`Fetching lab testings with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/labtestings/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setLabTestings(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setLabTestings(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setLabTestings([]);
      }
      
      // Mitglieder laden (für Dialoge)
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
      console.error('Fehler beim Laden der Laborkontroll-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  // Formular-Handling
  const handleOpenForm = (labTesting = null) => {
    setCurrentLabTesting(labTesting);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentLabTesting(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentLabTesting) {
        // Update
        await api.put(`/trackandtrace/labtestings/${currentLabTesting.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/labtestings/', formData);
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
  const handleOpenDestroyDialog = (labTesting) => {
    setCurrentLabTesting(labTesting);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentLabTesting(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/labtestings/${currentLabTesting.uuid}/destroy_item/`, {
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
  const handleOpenTransferDialog = (labTesting, type) => {
    setCurrentLabTesting(labTesting);
    setTransferType(type); // 'partially' oder 'fully'
    setOpenTransferDialog(true);
  };
  
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setCurrentLabTesting(null);
    setTransferType('');
    setTransferringMember('');
  };
  
  const handleMarkAsTransferred = async () => {
    if (!transferringMember) return;
    
    try {
      const endpoint = transferType === 'partially' 
        ? 'mark_as_partially_transferred' 
        : 'mark_as_fully_transferred';
        
      await api.post(`/trackandtrace/labtestings/${currentLabTesting.uuid}/${endpoint}/`, {
        transferring_member: transferringMember
      });
      fetchData();
      handleCloseTransferDialog();
    } catch (err) {
      console.error(`Fehler beim Markieren als ${transferType === 'partially' ? 'teilweise' : 'vollständig'} übergeführt:`, err);
    }
  };
  
  // Update Test Status Dialog
  const handleOpenUpdateStatusDialog = (labTesting, newStatus) => {
    setCurrentLabTesting(labTesting);
    setNewTestStatus(newStatus);
    setOpenUpdateStatusDialog(true);
  };
  
  const handleCloseUpdateStatusDialog = () => {
    setOpenUpdateStatusDialog(false);
    setCurrentLabTesting(null);
    setNewTestStatus('');
  };
  
  const handleUpdateTestStatus = async () => {
    if (!newTestStatus) return;
    
    try {
      await api.post(`/trackandtrace/labtestings/${currentLabTesting.uuid}/update_test_status/`, {
        test_status: newTestStatus
      });
      fetchData();
      handleCloseUpdateStatusDialog();
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Test-Status:', err);
    }
  };
  
  // Approve Testing
  const handleApprove = async (labTesting) => {
    try {
      await api.post(`/trackandtrace/labtestings/${labTesting.uuid}/approve_testing/`);
      fetchData();
    } catch (err) {
      console.error('Fehler beim Freigeben des Tests:', err);
      if (err.response && err.response.data) {
        alert(`Fehler: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Delete-Handling
  const handleDelete = async (labTesting) => {
    // Hier sollte es eigentlich einen Bestätigungsdialog geben
    if (window.confirm(`Sind Sie sicher, dass Sie ${labTesting.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/labtestings/${labTesting.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && labTestings.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Laborkontroll-Verwaltung
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
            <Tooltip title="Im Labor freigegebene Proben">
              <ToggleButton value="approved" color="success">
                Freigegeben
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Teilweise an den nächsten Prozessschritt übergeführt">
              <ToggleButton value="partially_transferred" color="info">
                Teilweise übergeführt
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Vollständig an den nächsten Prozessschritt übergeführt">
              <ToggleButton value="fully_transferred" color="success">
                Vollständig übergeführt
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
            Neue Laborkontrolle
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={labTestings}
          detailsComponent={(props) => (
            <LabTestingDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onUpdateTestStatus={handleOpenUpdateStatusDialog}
              onApprove={handleApprove}
              onMarkAsPartiallyTransferred={(labTesting) => handleOpenTransferDialog(labTesting, 'partially')}
              onMarkAsFullyTransferred={(labTesting) => handleOpenTransferDialog(labTesting, 'fully')}
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
          {currentLabTesting ? 'Laborkontrolle bearbeiten' : 'Neue Laborkontrolle'}
        </DialogTitle>
        <DialogContent>
          <LabTestingForm 
            initialData={currentLabTesting} 
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
        <DialogTitle>Laborkontrolle als vernichtet markieren</DialogTitle>
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
              ? 'Markieren Sie diese Laborkontrolle als teilweise an den nächsten Prozessschritt übergeführt.'
              : 'Markieren Sie diese Laborkontrolle als vollständig an den nächsten Prozessschritt übergeführt.'}
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
      
      {/* Test-Status-Update-Dialog */}
      <Dialog
        open={openUpdateStatusDialog}
        onClose={handleCloseUpdateStatusDialog}
      >
        <DialogTitle>Test-Status aktualisieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Möchten Sie den Status des Tests auf "{
              newTestStatus === 'in_progress' ? 'In Bearbeitung' : 
              newTestStatus === 'completed' ? 'Abgeschlossen' : 
              newTestStatus === 'failed' ? 'Nicht bestanden' : 
              'Ausstehend'
            }" ändern?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateStatusDialog}>Abbrechen</Button>
          <Button 
            onClick={handleUpdateTestStatus}
            color="primary"
          >
            Status aktualisieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LabTestingPage;