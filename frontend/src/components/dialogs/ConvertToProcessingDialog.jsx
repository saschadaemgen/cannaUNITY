// frontend/src/apps/trackandtrace/components/dialogs/ConvertToProcessingDialog.jsx
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
  IconButton,
  RadioGroup,
  Radio,
  Divider
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SpeedIcon from '@mui/icons-material/Speed'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'

/**
 * Dialog zur Konvertierung einer Trocknung zu Marihuana oder Haschisch
 */
const ConvertToProcessingDialog = ({
  open,
  onClose,
  onConvert,
  title,
  sourceBatch,
  members,
  rooms,
  loadingOptions
}) => {
  const [productType, setProductType] = useState('marijuana')
  const [outputWeight, setOutputWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [memberId, setMemberId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    if (!outputWeight || parseFloat(outputWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Produktgewicht ein')
      return
    }
    
    // Prüfen, ob das Produktgewicht kleiner als das Trockengewicht ist
    if (sourceBatch && parseFloat(outputWeight) > parseFloat(sourceBatch.final_weight)) {
      setError('Das Produktgewicht kann nicht größer als das Trockengewicht sein')
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
      product_type: productType,
      output_weight: outputWeight,
      notes,
      member_id: memberId,
      room_id: roomId
    })
  }
  
  // Berechne voraussichtliche Ausbeute
  const calculateYield = () => {
    if (sourceBatch && outputWeight && !isNaN(parseFloat(outputWeight))) {
      const inputWeight = parseFloat(sourceBatch.final_weight);
      const outWeight = parseFloat(outputWeight);
      
      if (outWeight <= inputWeight) {
        const percentage = (outWeight / inputWeight * 100).toFixed(1);
        const waste = inputWeight - outWeight;
        return {
          percentage,
          waste
        };
      }
    }
    return { percentage: 0, waste: 0 };
  };
  
  const yieldData = calculateYield();

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
          <SpeedIcon sx={{ mr: 1, color: 'secondary.main' }} />
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
                  Trocknungs-Charge:
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
                  Trockengewicht:
                </Typography>
                <Typography variant="body2">
                  {parseFloat(sourceBatch.final_weight).toLocaleString('de-DE')}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              Produkttyp
            </Typography>
            <RadioGroup
              row
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <FormControlLabel 
                value="marijuana" 
                control={<Radio color="secondary" />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalFloristIcon sx={{ mr: 0.5, color: 'secondary.main' }} />
                    <Typography variant="body2">Marihuana</Typography>
                  </Box>
                } 
                sx={{ flexGrow: 1 }}
              />
              <FormControlLabel 
                value="hashish" 
                control={<Radio color="secondary" />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterDramaIcon sx={{ mr: 0.5, color: 'secondary.main' }} />
                    <Typography variant="body2">Haschisch</Typography>
                  </Box>
                } 
                sx={{ flexGrow: 1 }}
              />
            </RadioGroup>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          <TextField
            autoFocus
            margin="dense"
            id="output-weight"
            label="Produktgewicht (g)"
            type="number"
            fullWidth
            value={outputWeight}
            onChange={(e) => setOutputWeight(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.1 }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          {outputWeight && sourceBatch && parseFloat(outputWeight) <= parseFloat(sourceBatch.final_weight) && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'secondary.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                Verarbeitungsausbeute
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Ausbeute:
                </Typography>
                <Typography variant="body2">
                  {yieldData.percentage}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verarbeitungsverlust:
                </Typography>
                <Typography variant="body2">
                  {yieldData.waste.toLocaleString('de-DE')}g
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
            color="secondary"
            startIcon={<SpeedIcon />}
          >
            {productType === 'marijuana' ? 'Marihuana' : 'Haschisch'} erstellen
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertToProcessingDialog;