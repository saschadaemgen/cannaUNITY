// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx
import { useState, useEffect } from 'react'
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
  Box,
  Typography
} from '@mui/material'
import api from '@/utils/api'

export default function SeedPurchaseForm({ open, onClose, onSuccess, initialData = {} }) {
  const [formData, setFormData] = useState({
    strain_name: '',
    quantity: 1,
    remaining_quantity: 1,
    member_id: '',
    room_id: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    if (open) {
      // Wenn Formulardaten bereitgestellt werden (für Bearbeitungsfall)
      if (initialData.id) {
        setFormData({
          strain_name: initialData.strain_name || '',
          quantity: initialData.quantity || 1,
          remaining_quantity: initialData.remaining_quantity || 1,
          member_id: initialData.member?.id || '',
          room_id: initialData.room?.id || ''
        })
      } else {
        // Für den Fall eines neuen Datensatzes
        setFormData({
          strain_name: '',
          quantity: 1,
          remaining_quantity: 1,
          member_id: '',
          room_id: ''
        })
      }
      
      // Mitglieder und Räume laden
      loadMemberAndRoomOptions()
    }
  }, [open, initialData])
  
  const loadMemberAndRoomOptions = async () => {
    setLoadingOptions(true)
    try {
      // Mitglieder laden
      const membersRes = await api.get('members/')
      console.log('Mitglieder geladen:', membersRes.data)
      
      // Formatierte Mitglieder mit display_name
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden
      const roomsRes = await api.get('rooms/')
      console.log('Räume geladen:', roomsRes.data)
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Optionen:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Wenn quantity geändert wird, setze remaining_quantity auf denselben Wert (für neue Samen)
    if (name === 'quantity' && !initialData.id) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        remaining_quantity: value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = { ...formData }
      
      // Bei Bearbeitung eines bestehenden Datensatzes
      if (initialData.id) {
        await api.patch(`/trackandtrace/seeds/${initialData.id}/`, data)
      } else {
        // Bei Erstellung eines neuen Datensatzes
        await api.post('/trackandtrace/seeds/', data)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData.id ? 'Samen bearbeiten' : 'Neuen Samen hinzufügen'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Sortenname"
          name="strain_name"
          value={formData.strain_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        
        <TextField
          label="Menge"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          inputProps={{ min: 1 }}
          disabled={initialData.id} // Nur bei neuen Samen bearbeitbar
        />
        
        {initialData.id && (
          <TextField
            label="Verfügbare Menge"
            name="remaining_quantity"
            type="number"
            value={formData.remaining_quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            inputProps={{ min: 0, max: initialData.quantity }}
          />
        )}
        
        {loadingOptions ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Zuordnung
            </Typography>
            
            <FormControl 
              fullWidth 
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'black',
                  backgroundColor: 'white'
                },
                '& .MuiSelect-select': {
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiMenuItem-root': {
                  color: 'black',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            >
              <InputLabel>Mitglied</InputLabel>
              <Select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                label="Mitglied"
              >
                <MenuItem value="">
                  <em>Kein Mitglied zugeordnet</em>
                </MenuItem>
                {members.map(member => (
                  <MenuItem 
                    key={member.id} 
                    value={member.id}
                    sx={{ 
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {member.display_name || `${member.first_name} ${member.last_name}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl 
              fullWidth 
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'black',
                  backgroundColor: 'white'
                },
                '& .MuiSelect-select': {
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiMenuItem-root': {
                  color: 'black',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            >
              <InputLabel>Raum</InputLabel>
              <Select
                name="room_id"
                value={formData.room_id}
                onChange={handleChange}
                label="Raum"
              >
                <MenuItem value="">
                  <em>Kein Raum zugeordnet</em>
                </MenuItem>
                {rooms.map(room => (
                  <MenuItem 
                    key={room.id} 
                    value={room.id}
                    sx={{ 
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.strain_name || formData.quantity < 1}
        >
          {loading ? <CircularProgress size={24} /> : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}