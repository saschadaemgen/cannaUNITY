// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionPage.jsx
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
import ProductDistributionDetails from './ProductDistributionDetails';
import ProductDistributionForm from './ProductDistributionForm';

const ProductDistributionPage = () => {
  const [distributions, setDistributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'partially_transferred', 'fully_transferred', 'destroyed', 'paid', 'unpaid', 'confirmed', 'unconfirmed'
  const [openForm, setOpenForm] = useState(false);
  const [currentDistribution, setCurrentDistribution] = useState(null);
  
  // Dialog-States
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false);
  const [destroyReason, setDestroyReason] = useState('');
  const [destroyingMember, setDestroyingMember] = useState('');
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState(''); // 'partially' oder 'fully'
  const [transferringMember, setTransferringMember] = useState('');
  const [openPaidDialog, setOpenPaidDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Tabellenspalten definieren
  const columns = [
    { id: 'batch_number', label: 'Charge', minWidth: 100 },
    { id: 'genetic_name', label: 'Genetik', minWidth: 150 },
    { 
      id: 'distribution_date', 
      label: 'Ausgabedatum', 
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
      id: 'distribution_type',
      label: 'Ausgabetyp',
      minWidth: 120,
      format: (value, row) => row.distribution_type_display || value
    },
    { 
      id: 'quantity', 
      label: 'Menge (g)', 
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
      id: 'total_price',
      label: 'Preis (€)',
      minWidth: 100,
      align: 'right',
      format: (value) => value ? Number(value).toLocaleString('de-DE') : ''
    },
    {
      id: 'is_paid',
      label: 'Bezahlt',
      minWidth: 80,
      align: 'center',
      format: (value) => value ? '✓' : '✗'
    },
    {
      id: 'is_confirmed',
      label: 'Bestätigt',
      minWidth: 80,
      align: 'center',
      format: (value) => value ? '✓' : '✗'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value, row) => row.status_display || value
    },
    {
      id: 'transfer_status',
      label: 'Überführungsstatus',
      minWidth: 180,
      format: (value, row) => {
        // Gewichtsberechnung
        if (row.quantity !== undefined && row.remaining_quantity !== undefined) {
          const used = parseFloat(row.quantity) - parseFloat(row.remaining_quantity);
          const percentage = Math.round((used / parseFloat(row.quantity)) * 100);
          
          if (percentage === 0) return 'Nicht übergeführt';
          if (percentage === 100) return `Vollständig übergeführt (${used}g/${row.quantity}g)`;
          return `Teilweise übergeführt (${used}g/${row.quantity}g, ${percentage}%)`;
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
      id: 'receiving_member',
      label: 'Empfänger',
      minWidth: 150,
      format: (value, row) => {
        if (row.receiving_member_details) {
          return `${row.receiving_member_details.first_name} ${row.receiving_member_details.last_name}`;
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
      case 'paid':
        return '?is_paid=true';
      case 'unpaid':
        return '?is_paid=false';
      case 'confirmed':
        return '?is_confirmed=true';
      case 'unconfirmed':
        return '?is_confirmed=false';
      case 'pending':
        return '?status=pending';
      case 'completed':
        return '?status=completed';
      case 'cancelled':
        return '?status=cancelled';
      case 'returned':
        return '?status=returned';
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
      console.log(`Fetching distributions with status=${status}, query=${queryParams}`);
      const response = await api.get(`/trackandtrace/distributions/${queryParams}`);
      console.log('API Response:', response.data);
      
      // Prüfen, ob response.data ein Array ist oder eine paginierte Struktur hat
      if (Array.isArray(response.data)) {
        setDistributions(response.data);
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setDistributions(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setDistributions([]);
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
      console.error('Fehler beim Laden der Produktausgabe-Daten:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  // Formular-Handling
  const handleOpenForm = (distribution = null) => {
    setCurrentDistribution(distribution);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentDistribution(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentDistribution) {
        // Update
        await api.put(`/trackandtrace/distributions/${currentDistribution.uuid}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/distributions/', formData);
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
  const handleOpenDestroyDialog = (distribution) => {
    setCurrentDistribution(distribution);
    setOpenDestroyDialog(true);
  };

  const handleCloseDestroyDialog = () => {
    setOpenDestroyDialog(false);
    setCurrentDistribution(null);
    setDestroyReason('');
    setDestroyingMember('');
  };

  const handleMarkAsDestroyed = async () => {
    if (!destroyReason || !destroyingMember) return;
    
    try {
      await api.post(`/trackandtrace/distributions/${currentDistribution.uuid}/destroy_item/`, {
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
  const handleOpenTransferDialog = (distribution, type) => {
    setCurrentDistribution(distribution);
    setTransferType(type); // 'partially' oder 'fully'
    setOpenTransferDialog(true);
  };
  
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setCurrentDistribution(null);
    setTransferType('');
    setTransferringMember('');
  };
  
  const handleMarkAsTransferred = async () => {
    if (!transferringMember) return;
    
    try {
      const endpoint = transferType === 'partially' 
        ? 'mark_as_partially_transferred' 
        : 'mark_as_fully_transferred';
        
      await api.post(`/trackandtrace/distributions/${currentDistribution.uuid}/${endpoint}/`, {
        transferring_member: transferringMember
      });
      fetchData();
      handleCloseTransferDialog();
    } catch (err) {
      console.error(`Fehler beim Markieren als ${transferType === 'partially' ? 'teilweise' : 'vollständig'} übergeführt:`, err);
    }
  };
  
  // Paid Dialog
  const handleOpenPaidDialog = (distribution) => {
    setCurrentDistribution(distribution);
    setPaymentMethod('');
    setOpenPaidDialog(true);
  };
  
  const handleClosePaidDialog = () => {
    setOpenPaidDialog(false);
    setCurrentDistribution(null);
    setPaymentMethod('');
  };
  
  const handleMarkAsPaid = async () => {
    try {
      await api.post(`/trackandtrace/distributions/${currentDistribution.uuid}/mark_as_paid/`, {
        payment_method: paymentMethod
      });
      fetchData();
      handleClosePaidDialog();
    } catch (err) {
      console.error('Fehler beim Markieren als bezahlt:', err);
    }
  };
  
  // Confirm Receipt Dialog
  const handleOpenConfirmDialog = (distribution) => {
    setCurrentDistribution(distribution);
    setOpenConfirmDialog(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setCurrentDistribution(null);
  };
  
  const handleConfirmReceipt = async () => {
    try {
      await api.post(`/trackandtrace/distributions/${currentDistribution.uuid}/confirm_receipt/`, {});
      fetchData();
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Fehler beim Bestätigen des Empfangs:', err);
    }
  };
  
  // Status Update Dialog
  const handleOpenStatusDialog = (distribution, initialStatus) => {
    setCurrentDistribution(distribution);
    setNewStatus(initialStatus || '');
    setOpenStatusDialog(true);
  };
  
  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setCurrentDistribution(null);
    setNewStatus('');
  };
  
  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    
    try {
      await api.post(`/trackandtrace/distributions/${currentDistribution.uuid}/update_status/`, {
        status: newStatus
      });
      fetchData();
      handleCloseStatusDialog();
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
    }
  };

  // Delete-Handling
  const handleDelete = async (distribution) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${distribution.genetic_name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/distributions/${distribution.uuid}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && distributions.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Produktausgabe-Verwaltung
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
            <ToggleButton value="pending" color="warning">
              Ausstehend
            </ToggleButton>
            <ToggleButton value="completed" color="success">
              Abgeschlossen
            </ToggleButton>
            <Tooltip title="Empfang vom Mitglied bestätigt">
              <ToggleButton value="confirmed" color="success">
                Empfang bestätigt
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Empfang noch nicht bestätigt">
              <ToggleButton value="unconfirmed" color="warning">
                Nicht bestätigt
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Bezahlte Ausgaben">
              <ToggleButton value="paid" color="success">
                Bezahlt
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Unbezahlte Ausgaben">
              <ToggleButton value="unpaid" color="error">
                Unbezahlt
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
            Neue Produktausgabe
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={distributions}
          detailsComponent={(props) => (
            <ProductDistributionDetails 
              {...props} 
              onMarkAsDestroyed={handleOpenDestroyDialog}
              onMarkAsPaid={handleOpenPaidDialog}
              onConfirmReceipt={handleOpenConfirmDialog}
              onUpdateStatus={handleOpenStatusDialog}
              onMarkAsPartiallyTransferred={(distribution) => handleOpenTransferDialog(distribution, 'partially')}
              onMarkAsFullyTransferred={(distribution) => handleOpenTransferDialog(distribution, 'fully')}
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
          {currentDistribution ? 'Produktausgabe bearbeiten' : 'Neue Produktausgabe'}
        </DialogTitle>
        <DialogContent>
          <ProductDistributionForm 
            initialData={currentDistribution} 
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
        <DialogTitle>Produktausgabe als vernichtet markieren</DialogTitle>
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
              ? 'Markieren Sie diese Produktausgabe als teilweise an den nächsten Prozessschritt übergeführt.'
              : 'Markieren Sie diese Produktausgabe als vollständig an den nächsten Prozessschritt übergeführt.'}
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
      
      {/* Bezahlt-Dialog */}
      <Dialog
        open={openPaidDialog}
        onClose={handleClosePaidDialog}
      >
        <DialogTitle>Als bezahlt markieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Markieren Sie diese Produktausgabe als bezahlt.
          </Typography>
          <TextField
            margin="dense"
            label="Zahlungsmethode"
            fullWidth
            variant="outlined"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="z.B. Bar, Überweisung, Gutschrift"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaidDialog}>Abbrechen</Button>
          <Button 
            onClick={handleMarkAsPaid}
            color="success"
          >
            Als bezahlt markieren
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bestätigungs-Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Empfang bestätigen</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bestätigen Sie den Empfang dieser Produktausgabe durch das Mitglied.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Abbrechen</Button>
          <Button 
            onClick={handleConfirmReceipt}
            color="success"
          >
            Empfang bestätigen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Status-Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
      >
        <DialogTitle>Status aktualisieren</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Aktualisieren Sie den Status dieser Produktausgabe.
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Ausstehend</MenuItem>
              <MenuItem value="in_progress">In Bearbeitung</MenuItem>
              <MenuItem value="completed">Abgeschlossen</MenuItem>
              <MenuItem value="cancelled">Storniert</MenuItem>
              <MenuItem value="returned">Zurückgegeben</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Abbrechen</Button>
          <Button 
            onClick={handleUpdateStatus}
            color="primary"
            disabled={!newStatus}
          >
            Status aktualisieren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductDistributionPage;