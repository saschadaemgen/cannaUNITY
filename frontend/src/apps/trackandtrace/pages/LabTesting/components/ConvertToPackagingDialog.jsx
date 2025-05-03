// frontend/src/apps/trackandtrace/pages/LabTesting/components/ConvertToPackagingDialog.jsx
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
import InventoryIcon from '@mui/icons-material/Inventory';

const ConvertToPackagingDialog = ({
  open,
  onClose,
  onConvert,
  labTesting,
  members,
  rooms,
  loadingOptions
}) => {
  const [totalWeight, setTotalWeight] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [unitWeight, setUnitWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [memberId, setMemberId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  
  // Berechnete Werte
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isWeightValid, setIsWeightValid] = useState(false);

  useEffect(() => {
    if (open && labTesting) {
      // Setze Standardwerte: Standardmäßig das gesamte verbleibende Gewicht konvertieren
      const remainingWeight = parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight);
      setTotalWeight(remainingWeight.toString());
      
      // Standardwerte für Anzahl und Einheitsgewicht
      setUnitCount('10');
      setUnitWeight((remainingWeight / 10).toFixed(2));
      
      // Zurücksetzen der anderen Felder
      setNotes('');
      setMemberId('');
      setRoomId('');
      setError('');
      
      // Kalkulierte Werte aktualisieren
      updateCalculatedTotal(remainingWeight, 10);
      validateWeight(remainingWeight, remainingWeight);
    }
  }, [open, labTesting]);
  
  // Berechne das Gesamtgewicht basierend auf Einheitsgewicht * Anzahl
  useEffect(() => {
    if (unitWeight && unitCount) {
      const weight = parseFloat(unitWeight) * parseInt(unitCount);
      updateCalculatedTotal(weight, parseInt(unitCount));
    }
  }, [unitWeight, unitCount]);
  
  // Validiere, ob das Gesamtgewicht gültig ist
  useEffect(() => {
    if (labTesting && totalWeight) {
      const remainingWeight = parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight);
      validateWeight(parseFloat(totalWeight), remainingWeight);
    }
  }, [totalWeight, labTesting]);
  
  const updateCalculatedTotal = (weight, count) => {
    if (!isNaN(weight) && !isNaN(count) && count > 0) {
      setCalculatedTotal(weight);
    } else {
      setCalculatedTotal(0);
    }
  };
  
  const validateWeight = (weight, remainingWeight) => {
    if (!isNaN(weight) && !isNaN(remainingWeight)) {
      setIsWeightValid(weight > 0 && weight <= remainingWeight);
    } else {
      setIsWeightValid(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validierung
    if (!totalWeight || parseFloat(totalWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Gesamtgewicht ein');
      return;
    }
    
    if (!unitCount || parseInt(unitCount) <= 0) {
      setError('Bitte geben Sie eine gültige Anzahl der Einheiten ein');
      return;
    }
    
    if (!unitWeight || parseFloat(unitWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Gewicht pro Einheit ein');
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
    
    // Prüfen, ob das berechnete Gesamtgewicht mit dem eingegebenen übereinstimmt
    const calculated = parseFloat(unitWeight) * parseInt(unitCount);
    if (Math.abs(calculated - parseFloat(totalWeight)) > 0.1) {
      setError(`Gesamtgewicht (${parseFloat(totalWeight).toFixed(2)}g) stimmt nicht mit Einheitsgewicht * Anzahl (${calculated.toFixed(2)}g) überein`);
      return;
    }
    
    // Submit-Daten
    const formData = {
      total_weight: parseFloat(totalWeight),
      unit_count: parseInt(unitCount),
      unit_weight: parseFloat(unitWeight),
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
          <InventoryIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6">Zu Verpackung konvertieren</Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Charge-Nummer:
                </Typography>
                <Typography variant="body2">
                  {labTesting.batch_number}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  THC-Gehalt:
                </Typography>
                <Typography variant="body2">
                  {labTesting.thc_content ? `${labTesting.thc_content}%` : "Nicht getestet"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verfügbares Gewicht:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {labTesting ? (parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE') : 0}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            id="total-weight"
            label="Gesamtgewicht (g)"
            type="number"
            fullWidth
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
            required
            inputProps={{ min: 0.01, step: 0.01 }}
            variant="outlined"
            sx={{ mb: 2 }}
            error={!isWeightValid && totalWeight !== ''}
            helperText={!isWeightValid && totalWeight !== '' ? "Gewicht muss größer als 0 und kleiner gleich dem verfügbaren Gewicht sein" : ""}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              id="unit-count"
              label="Anzahl der Einheiten"
              type="number"
              fullWidth
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value)}
              required
              inputProps={{ min: 1, step: 1 }}
              variant="outlined"
            />
            
            <TextField
              margin="dense"
              id="unit-weight"
              label="Gewicht pro Einheit (g)"
              type="number"
              fullWidth
              value={unitWeight}
              onChange={(e) => setUnitWeight(e.target.value)}
              required
              inputProps={{ min: 0.01, step: 0.01 }}
              variant="outlined"
            />
          </Box>
          
          {unitCount && unitWeight && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Berechnetes Gesamtgewicht
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {parseInt(unitCount)} × {parseFloat(unitWeight).toFixed(2)}g =
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {calculatedTotal.toFixed(2)}g
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
            color="success"
            startIcon={<InventoryIcon />}
            disabled={!isWeightValid}
          >
            Zu Verpackung konvertieren
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertToPackagingDialog;