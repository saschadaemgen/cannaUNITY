// frontend/src/apps/trackandtrace/components/dialogs/CreateCuttingDialog.jsx
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography 
  } from '@mui/material'
  
  /**
   * CreateCuttingDialog Komponente für den Dialog zum Erstellen von Stecklingen
   * 
   * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
   * @param {function} onClose - Handler für Schließen des Dialogs
   * @param {function} onCreateCuttings - Handler für Erstellung der Stecklinge
   * @param {number} quantity - Anzahl zu erstellender Stecklinge
   * @param {function} setQuantity - Funktion zum Setzen der Anzahl
   * @param {string} notes - Notizen zu den Stecklingen
   * @param {function} setNotes - Funktion zum Setzen der Notizen
   * @param {Array} members - Array mit Mitgliedern
   * @param {string} selectedMemberId - ID des ausgewählten Mitglieds
   * @param {function} setSelectedMemberId - Funktion zum Setzen des ausgewählten Mitglieds
   * @param {Array} rooms - Array mit Räumen
   * @param {string} selectedRoomId - ID des ausgewählten Raums
   * @param {function} setSelectedRoomId - Funktion zum Setzen des ausgewählten Raums
   * @param {object} motherBatch - Ausgewählte Mutterpflanzen-Charge
   */
  const CreateCuttingDialog = ({
    open,
    onClose,
    onCreateCuttings,
    quantity,
    setQuantity,
    notes,
    setNotes,
    members,
    selectedMemberId,
    setSelectedMemberId,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    motherBatch
  }) => {
    if (!motherBatch) return null;
  
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Stecklinge von Mutterpflanzen-Charge erstellen
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Stecklinge aus der Mutterpflanzen-Charge: <strong>{motherBatch.batch_number}</strong>
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Genetik: <strong>{motherBatch.seed_strain}</strong>
          </Typography>
  
          <TextField
            label="Anzahl der Stecklinge"
            type="number"
            fullWidth
            margin="normal"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1 }}
          />
          
          {/* Mitgliederauswahl */}
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Mitglied</InputLabel>
            <Select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              label="Mitglied"
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
          
          {/* Raumauswahl */}
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Raum</InputLabel>
            <Select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              label="Raum"
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
          <Button onClick={onClose}>Abbrechen</Button>
          <Button onClick={onCreateCuttings} variant="contained" color="primary">
            Stecklinge erstellen
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
  
  export default CreateCuttingDialog