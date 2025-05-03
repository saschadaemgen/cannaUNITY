// frontend/src/apps/trackandtrace/components/dialogs/ConvertToHarvestDialog.jsx
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography 
} from '@mui/material';

const ConvertToHarvestDialog = ({
  open,
  onClose,
  onConvert,
  title,
  sourceBatch, // Blühpflanzen- oder BloomingCutting-Batch
  sourceType, // 'flowering' oder 'bloomingCutting'
  members = [],
  rooms = [],
  selectedPlants = [],
  loadingOptions = false
}) => {
  const [weight, setWeight] = useState('');
  const [memberId, setMemberId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Formular zurücksetzen, wenn der Dialog geöffnet wird
    if (open) {
      setWeight('');
      setMemberId('');
      setRoomId('');
      setNotes('');
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleConvert = () => {
    // Vorbereiten der Daten für die Konvertierung
    const formData = {
      weight: parseFloat(weight) || 0,
      member_id: memberId || null,
      room_id: roomId || null,
      notes,
      plant_ids: selectedPlants.length > 0 ? selectedPlants : []
    };
    
    onConvert(formData);
  };

  const isValidWeight = () => {
    const numWeight = parseFloat(weight);
    return !isNaN(numWeight) && numWeight > 0;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title || 'Pflanzen zu Ernte umwandeln'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          {selectedPlants.length > 0 
            ? `Sie wandeln ${selectedPlants.length} ausgewählte Pflanzen zu einer Ernte um.`
            : sourceBatch 
              ? `Sie erstellen eine Ernte aus ${sourceType === 'flowering' ? 'Blühpflanzen' : 'Blühpflanzen aus Stecklingen'}.`
              : 'Sie erstellen eine neue Ernte.'}
        </Typography>
        
        <TextField
          label="Gewicht in Gramm"
          type="number"
          fullWidth
          margin="normal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputProps={{ min: 0.01, step: 0.01 }}
          required
          error={!!weight && !isValidWeight()}
          helperText={weight && !isValidWeight() ? "Bitte geben Sie ein gültiges Gewicht ein." : ""}
        />
        
        <FormControl 
          fullWidth 
          margin="normal"
        >
          <InputLabel>Zuständiges Mitglied</InputLabel>
          <Select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            label="Zuständiges Mitglied"
            disabled={loadingOptions}
          >
            <MenuItem value="">
              <em>Kein Mitglied zugeordnet</em>
            </MenuItem>
            {members.map(member => (
              <MenuItem 
                key={member.id} 
                value={member.id}
              >
                {member.display_name || `${member.first_name} ${member.last_name}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl 
          fullWidth 
          margin="normal"
        >
          <InputLabel>Raum</InputLabel>
          <Select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            label="Raum"
            disabled={loadingOptions}
          >
            <MenuItem value="">
              <em>Kein Raum zugeordnet</em>
            </MenuItem>
            {rooms.map(room => (
              <MenuItem 
                key={room.id} 
                value={room.id}
              >
                {room.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Notizen"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button 
          onClick={handleConvert} 
          variant="contained" 
          color="success"
          disabled={!isValidWeight()}
        >
          Ernte erstellen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToHarvestDialog;