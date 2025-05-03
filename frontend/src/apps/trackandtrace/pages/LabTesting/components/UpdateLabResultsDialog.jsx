// frontend/src/apps/trackandtrace/pages/LabTesting/components/UpdateLabResultsDialog.jsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BiotechIcon from '@mui/icons-material/Biotech';

const UpdateLabResultsDialog = ({
  open,
  onClose,
  onUpdateLabResults,
  labTesting
}) => {
  const [status, setStatus] = useState('pending');
  const [thcContent, setThcContent] = useState('');
  const [cbdContent, setCbdContent] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && labTesting) {
      setStatus(labTesting.status || 'pending');
      setThcContent(labTesting.thc_content || '');
      setCbdContent(labTesting.cbd_content || '');
      setLabNotes(labTesting.lab_notes || '');
      setError('');
    }
  }, [open, labTesting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validierung
    if (!status) {
      setError('Bitte wählen Sie einen Status aus');
      return;
    }
    
    if (thcContent && (isNaN(parseFloat(thcContent)) || parseFloat(thcContent) < 0 || parseFloat(thcContent) > 100)) {
      setError('THC-Gehalt muss zwischen 0 und 100 Prozent liegen');
      return;
    }
    
    if (cbdContent && (isNaN(parseFloat(cbdContent)) || parseFloat(cbdContent) < 0 || parseFloat(cbdContent) > 100)) {
      setError('CBD-Gehalt muss zwischen 0 und 100 Prozent liegen');
      return;
    }
    
    // Submit-Daten
    const formData = {
      status,
      thc_content: thcContent ? parseFloat(thcContent) : null,
      cbd_content: cbdContent ? parseFloat(cbdContent) : null,
      lab_notes: labNotes
    };
    
    onUpdateLabResults(formData);
  };

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BiotechIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">Laborergebnisse aktualisieren</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {labTesting && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Laborkontrolle-Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Genetik:
                </Typography>
                <Typography variant="body2">
                  {labTesting.source_strain || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Produkttyp:
                </Typography>
                <Typography variant="body2">
                  {labTesting.product_type_display || labTesting.product_type || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Charge-Nummer:
                </Typography>
                <Typography variant="body2">
                  {labTesting.batch_number}
                </Typography>
              </Box>
            </Box>
          )}
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
              required
            >
              <MenuItem value="pending">In Bearbeitung</MenuItem>
              <MenuItem value="passed">Freigegeben</MenuItem>
              <MenuItem value="failed">Nicht bestanden</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            autoFocus
            margin="dense"
            id="thc-content"
            label="THC-Gehalt (%)"
            type="number"
            fullWidth
            value={thcContent}
            onChange={(e) => setThcContent(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="cbd-content"
            label="CBD-Gehalt (%)"
            type="number"
            fullWidth
            value={cbdContent}
            onChange={(e) => setCbdContent(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="lab-notes"
            label="Laborergebnisse/Bericht"
            multiline
            rows={4}
            fullWidth
            value={labNotes}
            onChange={(e) => setLabNotes(e.target.value)}
            variant="outlined"
          />
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="info"
            startIcon={<BiotechIcon />}
          >
            Laborergebnisse aktualisieren
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateLabResultsDialog;