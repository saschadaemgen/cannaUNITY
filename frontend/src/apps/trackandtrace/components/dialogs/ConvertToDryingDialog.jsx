// frontend/src/apps/trackandtrace/components/dialogs/ConvertToDryingDialog.jsx
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Box,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AcUnitIcon from '@mui/icons-material/AcUnit'

/**
 * Dialog zur Konvertierung einer Ernte zu einer Trocknung
 */
const ConvertToDryingDialog = ({
  open,
  onClose,
  onConvert,
  title,
  sourceBatch,
  members,
  rooms,
  loadingOptions
}) => {
  const [finalWeight, setFinalWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [memberId, setMemberId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Trockengewicht ein')
      return
    }
    
    // Prüfen, ob das Trockengewicht kleiner als das Erntegewicht ist
    if (sourceBatch && parseFloat(finalWeight) >= parseFloat(sourceBatch.weight)) {
      setError('Das Trockengewicht muss kleiner als das Erntegewicht sein')
      return
    }
    
    if (!memberId) {
      setError('Bitte wählen Sie ein verantwortliches Mitglied aus')
      return
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus')
      return
    }
    
    onConvert({
      final_weight: finalWeight,
      notes,
      member_id: memberId,
      room_id: roomId
    })
  }
  
  // Berechne voraussichtlichen Gewichtsverlust
  const calculateWeightLoss = () => {
    if (sourceBatch && finalWeight && !isNaN(parseFloat(finalWeight))) {
      const initialWeight = parseFloat(sourceBatch.weight);
      const dryWeight = parseFloat(finalWeight);
      
      if (dryWeight < initialWeight) {
        const loss = initialWeight - dryWeight;
        const percentage = (loss / initialWeight * 100).toFixed(1);
        return {
          loss,
          percentage
        };
      }
    }
    return { loss: 0, percentage: 0 };
  };
  
  const weightLoss = calculateWeightLoss();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AcUnitIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {sourceBatch && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Quell-Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Ernte-Charge:
                </Typography>
                <Typography variant="body2">
                  {sourceBatch.batch_number}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Genetik:
                </Typography>
                <Typography variant="body2">
                  {sourceBatch.source_strain}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Erntegewicht:
                </Typography>
                <Typography variant="body2">
                  {parseFloat(sourceBatch.weight).toLocaleString('de-DE')}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            id="final-weight"
            label="Trockengewicht (g)"
            type="number"
            fullWidth
            value={finalWeight}
            onChange={(e) => setFinalWeight(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.1 }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          {finalWeight && sourceBatch && parseFloat(finalWeight) < parseFloat(sourceBatch.weight) && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                Gewichtsverlust durch Trocknung
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Absolut:
                </Typography>
                <Typography variant="body2">
                  {weightLoss.loss.toLocaleString('de-DE')}g
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Prozentual:
                </Typography>
                <Typography variant="body2">
                  {weightLoss.percentage}%
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
            startIcon={<AcUnitIcon />}
          >
            Zu Trocknung konvertieren
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertToDryingDialog;