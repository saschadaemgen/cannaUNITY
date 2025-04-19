// frontend/src/apps/trackandtrace/pages/Packaging/PackagingPage.jsx
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
import PackagingDetails from './PackagingDetails';
import PackagingForm from './PackagingForm';

const PackagingPage = () => {
  const [packagings, setPackagings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'partially_transferred', 'fully_transferred', 'destroyed', 'quality_checked', 'labeled'
  const [openForm, setOpenForm] = useState(false);
  const [currentPackaging, setCurrentPackaging] = useState(null);
  
  // Dialog-States
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState(''); // 'partially' oder 'fully'
  const [transferringMember, setTransferringMember] = useState('');
  const [openQualityCheckDialog, setOpenQualityCheckDialog] = useState(false);
  const [qualityCheckNotes, setQualityCheckNotes] = useState('');
  const [openLabelDialog, setOpenLabelDialog] = useState(false);
  const [labelDetails, setLabelDetails] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'packaging_date', 
      label: 'Verpackungsdatum', 
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
      id: 'packaging_type',
      label: 'Verpackungstyp',
      minWidth: 120,
      format: (value, row) => row.packaging_type_display || value
    },
    {
      id: 'product_type',
      label: 'Produkttyp',
      minWidth: 120,
      format: (value, row) => row.product_type_display || value
    },
    { 
      id: 'input_weight', 
      label: 'Eingangsgewicht (g)', 
      minWidth: 120, 
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : ''
    },
    {
      id: 'package_count',
      label: 'Pakete',
      minWidth: 80,
      align: 'right',
      format: (value) => value || '1'
    },
    {
      id: 'is_quality_checked',
      label: 'QS',
      minWidth: 80,
      align: 'center',
      format: (value) => value ? '✓' : '✗'
    },
    {
      id: 'has_labels',
      label: 'Etikettiert',
      minWidth: 80,
      align: 'center',
      format: (value) => value ? '✓' : '✗'
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Gewichtsberechnung
        if (row.input_weight !== undefined && row.remaining_weight !== undefined) {
          const used = parseFloat(row.input_weight) - parseFloat(row.remaining_weight);
          const percentage = Math.round((used / parseFloat(row.input_weight)) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}g/${row.input_weight}g)`;
          return `Teilweise übergeführt (${used}g/${row.input_weight}g, ${percentage}%)`;
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
        if (row.lab_testing_source_details) {
          return `${row.lab_testing_source_details.genetic_name} (${row.lab_testing_source_details.batch_number})`;
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
      case 'quality_checked':
        return '?is_quality_checked=true';
      case 'labeled':
        return '?has_labels=true';
      case 'active':
      default:
        return ''; // Aktive (nicht vernichtet)
    }
  };

  // Daten laden
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = getQueryParams();
      console.log(`Fetching packagings with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/packagings/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setPackagings(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setPackagings(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setPackagings([]);
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
      console.error('Fehler beim Laden der Verpackungs-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  // Formular-Handling
  const handleOpenForm = (packaging = null) => {
    setCurrentPackaging(packaging);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentPackaging(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentPackaging) {
        // Update
        await api.put(`/trackandtrace/packagings/${currentPackaging.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/packagings/', formData);
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
  const handleOpenDestroyDialog = (packaging) => {
    setCurrentPackaging(packaging);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentPackaging(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/packagings/${currentPackaging.uuid}/destroy_item/`, {
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
  const handleOpenTransferDialog = (packaging, type) => {
    setCurrentPackaging(packaging);
    setTransferType(type); // 'partially' oder 'fully'
    setOpenTransferDialog(true);
  };
  
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setCurrentPackaging(null);
    setTransferType('');
    setTransferringMember('');
  };
  
  const handleMarkAsTransferred = async () => {
    if (!transferringMember) return;
    
    try {
      const endpoint = transferType === 'partially' 
        ? 'mark_as_partially_transferred' 
        : 'mark_as_fully_transferred';
        
      await api.post(`/trackandtrace/packagings/${currentPackaging.uuid}/${endpoint}/`, {
        transferring_member: transferringMember
      });
      fetchData();
      handleCloseTransferDialog();
    } catch (err) {
      console.error(`Fehler beim Markieren als ${transferType === 'partially' ? 'teilweise' : 'vollständig'} übergeführt:`, err);
    }
  };
  
  // Quality Check Dialog
  const handleOpenQualityCheckDialog = (packaging) => {
    setCurrentPackaging(packaging);
    setQualityCheckNotes('');
    setOpenQualityCheckDialog(true);
  };
  
  const handleCloseQualityCheckDialog = () => {
    setOpenQualityCheckDialog(false);
    setCurrentPackaging(null);
    setQualityCheckNotes('');
  };
  
  const handleMarkQualityChecked = async () => {
    try {
      await api.post(`/trackandtrace/packagings/${currentPackaging.uuid}/mark_quality_checked/`, {
        quality_check_notes: qualityCheckNotes
      });
      fetchData();
      handleCloseQualityCheckDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als qualitätsgeprüft:', err);
    }
  };
  
  // Label Dialog
  const handleOpenLabelDialog = (packaging) => {
    setCurrentPackaging(packaging);
    setLabelDetails('');
    setOpenLabelDialog(true);
  };
  
  const handleCloseLabelDialog = () => {
    setOpenLabelDialog(false);
    setCurrentPackaging(null);
    setLabelDetails('');
  };
  
  const handleMarkLabeled = async () => {
    try {
      await api.post(`/trackandtrace/packagings/${currentPackaging.uuid}/mark_labeled/`, {
        label_details: labelDetails
      });
      fetchData();
      handleCloseLabelDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als etikettiert:', err);
    }
  };

  // Delete-Handling
  const handleDelete = async (packaging) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${packaging.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/packagings/${packaging.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && packagings.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Verpackungs-Verwaltung
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
            <Tooltip title="Qualitätskontrolle bestanden">
              <ToggleButton value="quality_checked" color="success">
                QS bestanden
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Etikettierte Produkte">
              <ToggleButton value="labeled" color="info">
                Etikettiert
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
            Neue Verpackung
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={packagings}
          detailsComponent={(props) => (
            <PackagingDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onMarkQualityChecked={handleOpenQualityCheckDialog}
              onMarkLabeled={handleOpenLabelDialog}
              onMarkAsPartiallyTransferred={(packaging) => handleOpenTransferDialog(packaging, 'partially')}
              onMarkAsFullyTransferred={(packaging) => handleOpenTransferDialog(packaging, 'fully')}
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
          {currentPackaging ? 'Verpackung bearbeiten' : 'Neue Verpackung'}
        </DialogTitle>
        <DialogContent>
          <PackagingForm 
            initialData={currentPackaging} 
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
        <DialogTitle>Verpackung als vernichtet markieren</DialogTitle>
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
              ? 'Markieren Sie diese Verpackung als teilweise an den nächsten Prozessschritt übergeführt.'
              : 'Markieren Sie diese Verpackung als vollständig an den nächsten Prozessschritt übergeführt.'}
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
      
      {/* Qualitätskontroll-Dialog */}
      <Dialog
        open={openQualityCheckDialog}
        onClose={handleCloseQualityCheckDialog}
      >
        <DialogTitle>Qualitätskontrolle bestätigen</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bestätigen Sie, dass die Qualitätskontrolle erfolgreich durchgeführt wurde.
          </Typography>
          <TextField
            margin="dense"
            label="Notizen zur Qualitätskontrolle"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={qualityCheckNotes}
            onChange={(e) => setQualityCheckNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQualityCheckDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkQualityChecked}
            color="success"
          >
            Qualitätskontrolle bestätigen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Etikettierungs-Dialog */}
      <Dialog
        open={openLabelDialog}
        onClose={handleCloseLabelDialog}
      >
        <DialogTitle>Als etikettiert markieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bestätigen Sie, dass das Produkt etikettiert wurde.
          </Typography>
          <TextField
            margin="dense"
            label="Etikettdetails"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={labelDetails}
            onChange={(e) => setLabelDetails(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLabelDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkLabeled}
            color="info"
          >
            Als etikettiert markieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PackagingPage;