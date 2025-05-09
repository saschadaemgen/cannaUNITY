// frontend/src/apps/wawi/components/dialogs/DestroyDialog.jsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material'

/**
 * DestroyDialog Komponente für den Dialog zur Deaktivierung einer Sorte
 * 
 * @param {boolean} open - Gibt an, ob der Dialog geöffnet ist
 * @param {function} onClose - Handler für Schließen des Dialogs
 * @param {function} onDestroy - Handler für Deaktivierung
 * @param {string} title - Titel des Dialogs
 * @param {Array} members - Array mit Mitgliedern für die Auswahl
 * @param {string} destroyedByMemberId - ID des ausgewählten Mitglieds
 * @param {function} setDestroyedByMemberId - Setter für ausgewähltes Mitglied
 * @param {string} destroyReason - Grund für die Deaktivierung
 * @param {function} setDestroyReason - Setter für Deaktivierungsgrund
 * @param {boolean} showQuantity - Gibt an, ob Mengenfeld angezeigt wird
 * @param {number} quantity - Menge
 * @param {function} setQuantity - Setter für Menge
 * @param {number} maxQuantity - Maximale Menge
 */
const DestroyDialog = ({ 
  open, 
  onClose, 
  onDestroy, 
  title = "Deaktivieren",
  members = [],
  destroyedByMemberId,
  setDestroyedByMemberId,
  destroyReason,
  setDestroyReason,
  showQuantity = false,
  quantity = 1,
  setQuantity,
  maxQuantity = 1
}) => {
  const [loading, setLoading] = useState(false)

  const handleDestroy = async () => {
    setLoading(true)
    try {
      await onDestroy()
    } finally {
      setLoading(false)
    }
  }

  const isDestroyDisabled = !destroyReason || (members.length > 0 && !destroyedByMemberId) || 
                          (showQuantity && (!quantity || quantity < 1 || quantity > maxQuantity))

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: 500 } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {showQuantity && (
          <TextField
            label="Menge"
            type="number"
            fullWidth
            margin="normal"
            value={quantity}
            onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 0)))}
            inputProps={{ min: 1, max: maxQuantity }}
            helperText={`Maximale Menge: ${maxQuantity}`}
          />
        )}
        
        <TextField
          label="Grund"
          multiline
          rows={3}
          fullWidth
          margin="normal"
          value={destroyReason}
          onChange={(e) => setDestroyReason(e.target.value)}
          required
        />
        
        {members.length > 0 && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Durchgeführt von</InputLabel>
            <Select
              value={destroyedByMemberId}
              onChange={(e) => setDestroyedByMemberId(e.target.value)}
              label="Durchgeführt von"
              required
            >
              <MenuItem value="">
                <em>Bitte auswählen</em>
              </MenuItem>
              {members.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Hinweis: Diese Aktion kann nicht rückgängig gemacht werden.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button 
          onClick={handleDestroy} 
          color="error" 
          variant="contained"
          disabled={isDestroyDisabled || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Deaktivieren'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DestroyDialog