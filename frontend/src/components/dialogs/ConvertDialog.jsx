// frontend/src/apps/trackandtrace/components/dialogs/ConvertDialog.jsx
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography 
  } from '@mui/material'
  
  /**
   * ConvertDialog Komponente für den Konvertierungsdialog (Samen zu Mutter-/Blühpflanzen)
   * 
   * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
   * @param {function} onClose - Handler für Schließen des Dialogs
   * @param {function} onConvert - Handler für Konvertierung
   * @param {string} type - Typ der Konvertierung ('mother' oder 'flower')
   * @param {number} quantity - Anzahl zu konvertierender Samen
   * @param {function} setQuantity - Funktion zum Setzen der Anzahl
   * @param {string} notes - Notizen zur Konvertierung
   * @param {function} setNotes - Funktion zum Setzen der Notizen
   * @param {Array} members - Array mit Mitgliedern
   * @param {string} selectedMemberId - ID des ausgewählten Mitglieds
   * @param {function} setSelectedMemberId - Funktion zum Setzen des ausgewählten Mitglieds
   * @param {Array} rooms - Array mit Räumen
   * @param {string} selectedRoomId - ID des ausgewählten Raums
   * @param {function} setSelectedRoomId - Funktion zum Setzen des ausgewählten Raums
   * @param {number} maxQuantity - Maximale Anzahl (verfügbare Samen)
   */
  const ConvertDialog = ({
    open,
    onClose,
    onConvert,
    type,
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
    maxQuantity = 1
  }) => {
    const title = type === 'mother' ? 'Zu Mutterpflanze konvertieren' : 'Zu Blühpflanze konvertieren'
  
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Verfügbare Samen: {maxQuantity || 0}
          </Typography>
          <TextField
            label="Anzahl"
            type="number"
            fullWidth
            margin="normal"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: maxQuantity }}
          />
          
          {/* Mitgliederauswahl mit verbesserten Stilen */}
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
          
          {/* Raumauswahl mit verbesserten Stilen */}
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
          <Button onClick={onConvert} variant="contained" color="success">Konvertieren</Button>
        </DialogActions>
      </Dialog>
    )
  }
  
  export default ConvertDialog