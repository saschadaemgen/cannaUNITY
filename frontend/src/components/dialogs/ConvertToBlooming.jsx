// frontend/src/apps/trackandtrace/components/dialogs/ConvertToBlooming.jsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography 
} from '@mui/material';

const ConvertToBlooming = ({
  open,
  onClose,
  onConvert,
  title,
  cuttings = [],
  members = [],
  rooms = [],
  loadingOptions = false,
  convertAll = false, // Neuer Parameter
  batchActiveCount = 0 // Neuer Parameter für die Anzahl aller aktiven Stecklinge im Batch
}) => {
  // Bestimme die maximale Anzahl basierend auf den Stecklingen oder allen aktiven Stecklingen
  const maxQuantity = convertAll ? batchActiveCount : (cuttings.length || 1);
  
  const [quantity, setQuantity] = useState(1);
  const [memberId, setMemberId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Formular zurücksetzen, wenn der Dialog geöffnet wird
    if (open) {
      // Wenn alle Stecklinge konvertiert werden sollen, setze die Anzahl auf die Gesamtzahl
      setQuantity(convertAll ? batchActiveCount : 1);
      setMemberId('');
      setRoomId('');
      setNotes('');
    }
  }, [open, convertAll, batchActiveCount]);

  const handleClose = () => {
    onClose();
  };

  const handleConvert = () => {
    // Vorbereiten der Daten für die Konvertierung
    const formData = {
      quantity,
      member_id: memberId || null,
      room_id: roomId || null,
      notes,
      cutting_ids: (!convertAll && cuttings.length > 0) 
        ? cuttings.filter(c => c && c.id).map(c => c.id) 
        : []  // Leeres Array = alle Stecklinge
    };
    
    console.log("Convert form data:", formData);
    onConvert(formData);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title || 'Stecklinge zu Blühpflanzen umwandeln'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          {convertAll 
            ? `Sie wandeln alle ${batchActiveCount} Stecklinge dieser Charge in Blühpflanzen um.`
            : cuttings.length > 0 
              ? `Sie wandeln ${cuttings.length} ausgewählte Stecklinge in Blühpflanzen um.`
              : 'Sie wandeln Stecklinge in Blühpflanzen um.'}
        </Typography>
        
        <TextField
          label="Anzahl zu erstellender Blühpflanzen"
          type="number"
          fullWidth
          margin="normal"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1, max: maxQuantity }}
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
        <Button onClick={handleConvert} variant="contained" color="success">
          Zu Blühpflanzen umwandeln
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToBlooming;