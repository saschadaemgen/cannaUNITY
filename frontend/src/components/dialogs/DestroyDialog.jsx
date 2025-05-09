// frontend/src/apps/trackandtrace/components/dialogs/DestroyDialog.jsx
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography 
  } from '@mui/material'
  
  /**
   * DestroyDialog Komponente für den Vernichtungsdialog
   * 
   * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
   * @param {function} onClose - Handler für Schließen des Dialogs
   * @param {function} onDestroy - Handler für Vernichtung
   * @param {string} title - Titel des Dialogs
   * @param {Array} members - Array mit Mitgliedern
   * @param {string} destroyedByMemberId - ID des ausgewählten Mitglieds
   * @param {function} setDestroyedByMemberId - Funktion zum Setzen des ausgewählten Mitglieds
   * @param {string} destroyReason - Vernichtungsgrund
   * @param {function} setDestroyReason - Funktion zum Setzen des Vernichtungsgrunds
   * @param {number} quantity - Menge (für teilweise Vernichtung)
   * @param {function} setQuantity - Funktion zum Setzen der Menge
   * @param {boolean} showQuantity - Gibt an, ob das Mengenfeld angezeigt werden soll
   * @param {number} maxQuantity - Maximale Menge
   */
  const DestroyDialog = ({
    open,
    onClose,
    onDestroy,
    title,
    members,
    destroyedByMemberId,
    setDestroyedByMemberId,
    destroyReason,
    setDestroyReason,
    quantity,
    setQuantity,
    showQuantity = false,
    maxQuantity = 1
  }) => {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {title}
        </DialogTitle>
        <DialogContent>
          {showQuantity && (
            <TextField
              label="Anzahl zu vernichtender Samen"
              type="number"
              fullWidth
              margin="normal"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1, max: maxQuantity }}
            />
          )}
          
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Vernichtet durch</InputLabel>
            <Select
              value={destroyedByMemberId}
              onChange={(e) => setDestroyedByMemberId(e.target.value)}
              label="Vernichtet durch"
              required
            >
              <MenuItem value="">
                <em>Bitte Mitglied auswählen</em>
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
          
          <Typography variant="body2" gutterBottom>
            Bitte gib einen Grund für die Vernichtung an:
          </Typography>
          <TextField
            label="Vernichtungsgrund"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={destroyReason}
            onChange={(e) => setDestroyReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button 
            onClick={onDestroy} 
            variant="contained" 
            color="error"
            disabled={!destroyReason || !destroyedByMemberId}
          >
            Vernichten
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
  
  export default DestroyDialog