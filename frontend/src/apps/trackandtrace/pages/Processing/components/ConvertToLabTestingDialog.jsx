// frontend/src/apps/trackandtrace/pages/Processing/components/ConvertToLabTestingDialog.jsx
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
import ScienceIcon from '@mui/icons-material/Science';

const ConvertToLabTestingDialog = ({
  open,
  onClose,
  onConvert,
  processing,
  members,
  rooms,
  loadingOptions
}) => {
  const [inputWeight, setInputWeight] = useState('');
  const [sampleWeight, setSampleWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [memberId, setMemberId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  
  // Berechnete Werte
  const [remainingWeight, setRemainingWeight] = useState(0);
  const [isWeightValid, setIsWeightValid] = useState(false);

  useEffect(() => {
    if (open && processing) {
      // Setze Standardwerte: Standardmäßig das gesamte Output-Gewicht als Input
      const outputWeight = parseFloat(processing.output_weight);
      setInputWeight(outputWeight.toString());
      
      // Standardmäßig 10% als Probengewicht
      const defaultSampleWeight = Math.min(1.0, outputWeight * 0.1).toFixed(2);
      setSampleWeight(defaultSampleWeight);
      
      // Zurücksetzen der anderen Felder
      setNotes('');
      setMemberId('');
      setRoomId('');
      setError('');
      
      // Kalkulierte Werte aktualisieren
      updateRemainingWeight(outputWeight, defaultSampleWeight);
      validateWeights(outputWeight, defaultSampleWeight, outputWeight);
    }
  }, [open, processing]);
  
  // Berechne das verbleibende Gewicht basierend auf Input - Sample
  useEffect(() => {
    if (inputWeight && sampleWeight) {
      updateRemainingWeight(parseFloat(inputWeight), parseFloat(sampleWeight));
    }
  }, [inputWeight, sampleWeight]);
  
  // Validiere, ob die Gewichte gültig sind
  useEffect(() => {
    if (processing && inputWeight && sampleWeight) {
      const output = parseFloat(processing.output_weight);
      validateWeights(parseFloat(inputWeight), parseFloat(sampleWeight), output);
    }
  }, [inputWeight, sampleWeight, processing]);
  
  const updateRemainingWeight = (input, sample) => {
    if (!isNaN(input) && !isNaN(sample)) {
      setRemainingWeight(Math.max(0, input - sample));
    } else {
      setRemainingWeight(0);
    }
  };
  
  const validateWeights = (input, sample, output) => {
    if (!isNaN(input) && !isNaN(sample) && !isNaN(output)) {
      setIsWeightValid(
        input > 0 && 
        input <= output && 
        sample > 0 && 
        sample < input
      );
    } else {
      setIsWeightValid(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validierung
    if (!inputWeight || parseFloat(inputWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Eingangsgewicht ein');
      return;
    }
    
    if (!sampleWeight || parseFloat(sampleWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Probengewicht ein');
      return;
    }
    
    const inputVal = parseFloat(inputWeight);
    const sampleVal = parseFloat(sampleWeight);
    const outputVal = parseFloat(processing.output_weight);
    
    if (inputVal > outputVal) {
      setError(`Das Eingangsgewicht kann nicht größer als das Verarbeitungsgewicht (${outputVal}g) sein`);
      return;
    }
    
    if (sampleVal >= inputVal) {
      setError('Das Probengewicht muss kleiner als das Eingangsgewicht sein');
      return;
    }
    
    if (!memberId) {
      setError('Bitte wählen Sie ein verantwortliches Mitglied aus');
      return;
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus');
      return;
    }
    
    // Submit-Daten
    const formData = {
      input_weight: parseFloat(inputWeight),
      sample_weight: parseFloat(sampleWeight),
      notes,
      member_id: memberId,
      room_id: roomId
    };
    
    onConvert(formData);
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
          <ScienceIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">Zu Laborkontrolle konvertieren</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {processing && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Verarbeitungs-Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Genetik:
                </Typography>
                <Typography variant="body2">
                  {processing.source_strain || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Produkttyp:
                </Typography>
                <Typography variant="body2">
                  {processing.product_type_display || processing.product_type || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Charge-Nummer:
                </Typography>
                <Typography variant="body2">
                  {processing.batch_number}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verfügbares Gewicht:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {processing ? parseFloat(processing.output_weight).toLocaleString('de-DE') : 0}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            id="input-weight"
            label="Eingangsgewicht (g)"
            type="number"
            fullWidth
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            required
            inputProps={{ min: 0.01, step: 0.01 }}
            variant="outlined"
            sx={{ mb: 2 }}
            error={inputWeight !== '' && (!isWeightValid || parseFloat(inputWeight) > parseFloat(processing?.output_weight || 0))}
            helperText={inputWeight !== '' && !isWeightValid ? 
              "Gewicht muss größer als 0 und kleiner gleich dem verfügbaren Gewicht sein" : ""}
          />
          
          <TextField
            margin="dense"
            id="sample-weight"
            label="Probengewicht (g)"
            type="number"
            fullWidth
            value={sampleWeight}
            onChange={(e) => setSampleWeight(e.target.value)}
            required
            inputProps={{ min: 0.01, step: 0.01 }}
            variant="outlined"
            sx={{ mb: 2 }}
            error={sampleWeight !== '' && (!isWeightValid || parseFloat(sampleWeight) >= parseFloat(inputWeight || 0))}
            helperText={sampleWeight !== '' && !isWeightValid ? 
              "Probengewicht muss größer als 0 und kleiner als das Eingangsgewicht sein" : ""}
          />
          
          {inputWeight && sampleWeight && isWeightValid && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                Berechnetes verbleibendes Gewicht
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verbleibendes Gewicht nach Probenentnahme:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {remainingWeight.toFixed(2)}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="member-label">Verantwortliches Mitglied</InputLabel>
            <Select
              labelId="member-label"
              id="member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              label="Verantwortliches Mitglied"
              required
              disabled={loadingOptions}
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.display_name || `${member.first_name} ${member.last_name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="room-label">Raum</InputLabel>
            <Select
              labelId="room-label"
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              label="Raum"
              required
              disabled={loadingOptions}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            id="notes"
            label="Notizen"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            startIcon={<ScienceIcon />}
            disabled={!isWeightValid}
          >
            Zu Laborkontrolle konvertieren
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertToLabTestingDialog;