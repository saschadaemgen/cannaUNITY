// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx

import { useState, useEffect, useMemo } from 'react'
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
  Typography,
  Autocomplete,
  Grid
} from '@mui/material'
import api from '@/utils/api'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import StrainFormModal from './components/StrainFormModal'

export default function SeedPurchaseForm({ open, onClose, onSuccess, initialData = {} }) {
  const [formData, setFormData] = useState({
    strain_name: '',
    quantity: 1,
    remaining_quantity: 1,
    member_id: '',
    room_id: '',
    strain_id: null,
    // Neue Felder
    thc_percentage_min: null,
    thc_percentage_max: null,
    cbd_percentage_min: null,
    cbd_percentage_max: null,
    flowering_time_min: null,
    flowering_time_max: null
  })
  
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // States für die Strain-Auswahl
  const [strains, setStrains] = useState([])
  const [loadingStrains, setLoadingStrains] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  
  // Neue States für die Breeder-Auswahl
  const [breeders, setBreeders] = useState([])
  const [loadingBreeders, setLoadingBreeders] = useState(false)
  const [selectedBreeder, setSelectedBreeder] = useState(null) // Kann entweder ein Breeder-Objekt oder 'all' sein
  
  // States für das Modal
  const [openStrainModal, setOpenStrainModal] = useState(false)
  const [initialStrainName, setInitialStrainName] = useState('')
  const [initialBreederName, setInitialBreederName] = useState('')
  const [searchTextStrain, setSearchTextStrain] = useState('')
  const [searchTextBreeder, setSearchTextBreeder] = useState('')
  
  // State für den Fokus-Status
  const [breederFieldFocused, setBreederFieldFocused] = useState(false);

  useEffect(() => {
    if (open) {
      // Wenn Formulardaten bereitgestellt werden (für Bearbeitungsfall)
      if (initialData.id) {
        setFormData({
          strain_name: initialData.strain_name || '',
          quantity: initialData.quantity || 1,
          remaining_quantity: initialData.remaining_quantity || 1,
          member_id: initialData.member?.id || '',
          room_id: initialData.room?.id || '',
          strain_id: initialData.strain_id || null,
          thc_percentage_min: initialData.thc_percentage_min || null,
          thc_percentage_max: initialData.thc_percentage_max || null,
          cbd_percentage_min: initialData.cbd_percentage_min || null,
          cbd_percentage_max: initialData.cbd_percentage_max || null,
          flowering_time_min: initialData.flowering_time_min || null,
          flowering_time_max: initialData.flowering_time_max || null
        })
        
        // Wenn eine Strain vorhanden ist, setze den Breeder
        if (initialData.strain) {
          setSelectedBreeder({
            id: 'breeder-' + initialData.strain.breeder,
            name: initialData.strain.breeder
          })
        }
      } else {
        // Für den Fall eines neuen Datensatzes
        setFormData({
          strain_name: '',
          quantity: 1,
          remaining_quantity: 1,
          member_id: '',
          room_id: '',
          strain_id: null,
          thc_percentage_min: null,
          thc_percentage_max: null,
          cbd_percentage_min: null,
          cbd_percentage_max: null,
          flowering_time_min: null,
          flowering_time_max: null
        })
        
        // Anstatt ein echtes Breeder-Objekt zu verwenden, nur eine visuelle Repräsentation setzen
        if (!initialData.id) {
          setSelectedBreeder(null); // Kein echter Breeder ausgewählt
          setSearchTextBreeder('Alle Hersteller anzeigen'); // Nur als Anzeigetext verwenden
        }
      }
      
      // Mitglieder, Räume, Hersteller und Sorten laden
      loadMemberAndRoomOptions()
      loadBreederOptions()
      loadStrainOptions()
    }
  }, [open, initialData])
  
  const loadMemberAndRoomOptions = async () => {
    setLoadingOptions(true)
    try {
      // Mitglieder laden
      const membersRes = await api.get('members/')
      
      // Formatierte Mitglieder mit display_name
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden
      const roomsRes = await api.get('rooms/')
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Optionen:', error)
    } finally {
      setLoadingOptions(false)
    }
  }
  
  // Funktion zum Laden der Breeder-Optionen
  const loadBreederOptions = async () => {
    setLoadingBreeders(true)
    try {
      // Hier ein API-Aufruf, um alle eindeutigen Hersteller zu erhalten
      // Falls es keinen direkten Endpunkt gibt, können wir die Strains-API verwenden und die Hersteller extrahieren
      const res = await api.get('/trackandtrace/seeds/strain_options/')
      
      // Extrahiere einzigartige Hersteller aus Strains
      const uniqueBreeders = [...new Set(res.data.map(strain => strain.breeder))]
        .filter(breeder => breeder) // Leere Werte filtern
        .sort() // Alphabetisch sortieren
        .map(breeder => ({
          id: 'breeder-' + breeder,
          name: breeder
        }))
      
      // Füge "Alle Hersteller anzeigen" am Anfang hinzu
      uniqueBreeders.unshift({
        id: 'all',
        name: 'Alle Hersteller anzeigen'
      })
      
      setBreeders(uniqueBreeders)
    } catch (error) {
      console.error('Fehler beim Laden der Hersteller:', error)
    } finally {
      setLoadingBreeders(false)
    }
  }
  
  // Funktion zum Laden der Strain-Optionen
  const loadStrainOptions = async (breederName = null) => {
    setLoadingStrains(true)
    try {
      const res = await api.get('/trackandtrace/seeds/strain_options/')
      
      // Wenn ein Hersteller ausgewählt ist, filtere die Sorten
      if (breederName && breederName !== 'Alle Hersteller anzeigen') {
        setStrains(res.data.filter(strain => strain.breeder === breederName))
      } else {
        setStrains(res.data || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sorten:', error)
    } finally {
      setLoadingStrains(false)
    }
  }

  // Nach Ausgewähltem Hersteller gefilterte Strains
  const filteredStrains = useMemo(() => {
    if (!selectedBreeder || selectedBreeder.id === 'all') {
      return strains
    }
    
    const breederName = selectedBreeder.name
    return strains.filter(strain => strain.breeder === breederName)
  }, [strains, selectedBreeder])
  
  // Filtern der Breeder-Optionen
  const getFilteredBreeders = () => {
    // Wenn das Feld fokussiert ist, "Alle Hersteller anzeigen" nicht in den Optionen anzeigen
    return breederFieldFocused ? 
      breeders.filter(breeder => breeder.id !== 'all') : 
      breeders;
  };

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
  
  // Handler für die Breeder-Auswahl
  const handleBreederChange = (event, newValue) => {
    // Prüfen, ob die "Neuen Hersteller anlegen" Option ausgewählt wurde
    if (newValue && newValue.isCreateOption) {
      // Modal zum Anlegen eines neuen Herstellers öffnen
      // Im Modal eine neue Sorte mit diesem Hersteller anlegen
      setInitialBreederName(newValue.name)
      setInitialStrainName('') // Sortenname ist noch leer
      setOpenStrainModal(true)
      return
    }
    
    setSelectedBreeder(newValue)
    
    // Strains nach dem ausgewählten Breeder filtern
    if (newValue && newValue.id !== 'all') {
      loadStrainOptions(newValue.name)
    } else {
      loadStrainOptions()
    }
    
    // Strain zurücksetzen, wenn der Hersteller geändert wird
    setSelectedStrain(null)
    
    // Sortenname zurücksetzen
    setFormData(prev => ({
      ...prev,
      strain_id: null,
      strain_name: '',
      thc_percentage_min: null,
      thc_percentage_max: null,
      cbd_percentage_min: null,
      cbd_percentage_max: null,
      flowering_time_min: null,
      flowering_time_max: null
    }))
  }
  
  // Handler für die Strain-Auswahl
  const handleStrainChange = (event, newValue) => {
    // Prüfen, ob die "Neue Sorte anlegen" Option ausgewählt wurde
    if (newValue && newValue.isCreateOption) {
      // Modal zum Anlegen einer neuen Sorte öffnen
      setInitialStrainName(newValue.name)
      setInitialBreederName(selectedBreeder && selectedBreeder.id !== 'all' ? selectedBreeder.name : '')
      setOpenStrainModal(true)
      return
    }
    
    setSelectedStrain(newValue)
    
    if (newValue) {
      // Automatisches Ausfüllen des Sortennamens und weiterer Werte
      setFormData(prev => ({
        ...prev,
        strain_id: newValue.id,
        strain_name: newValue.name,
        thc_percentage_min: newValue.thc_percentage_min,
        thc_percentage_max: newValue.thc_percentage_max,
        cbd_percentage_min: newValue.cbd_percentage_min,
        cbd_percentage_max: newValue.cbd_percentage_max,
        flowering_time_min: newValue.flowering_time_min,
        flowering_time_max: newValue.flowering_time_max
      }))
    } else {
      // Zurücksetzen des Strains
      setFormData(prev => ({
        ...prev,
        strain_id: null,
        strain_name: '',
        thc_percentage_min: null,
        thc_percentage_max: null,
        cbd_percentage_min: null,
        cbd_percentage_max: null,
        flowering_time_min: null,
        flowering_time_max: null
      }))
    }
  }
  
  // Funktion zum Erstellen einer neuen Sorte (wird auch für neue Hersteller verwendet)
  const handleCreateNewStrain = (newStrain) => {
    // Neue Sorte zur Liste hinzufügen
    setStrains(prev => [...prev, newStrain])
    
    // Diese neue Sorte auswählen
    setSelectedStrain(newStrain)
    
    // Formulardaten aktualisieren
    setFormData(prev => ({
      ...prev,
      strain_id: newStrain.id,
      strain_name: newStrain.name,
      thc_percentage_min: newStrain.thc_percentage_min,
      thc_percentage_max: newStrain.thc_percentage_max,
      cbd_percentage_min: newStrain.cbd_percentage_min,
      cbd_percentage_max: newStrain.cbd_percentage_max,
      flowering_time_min: newStrain.flowering_time_min,
      flowering_time_max: newStrain.flowering_time_max
    }))
    
    // Hersteller aktualisieren
    const newBreeder = {
      id: 'breeder-' + newStrain.breeder,
      name: newStrain.breeder
    }
    
    // Prüfen, ob der Hersteller bereits existiert
    if (!breeders.some(b => b.name === newStrain.breeder)) {
      setBreeders(prev => [...prev, newBreeder])
    }
    
    setSelectedBreeder(newBreeder)
    
    // Modal schließen
    setOpenStrainModal(false)
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
      <DialogTitle>{initialData.id ? 'Samen bearbeiten' : 'Neuen Samen einkaufen'}</DialogTitle>
      <DialogContent>
        {/* Hersteller-Auswahl mit Suchfunktion und "Neuen Hersteller anlegen" Option */}
        <Autocomplete
          options={getFilteredBreeders()}
          loading={loadingBreeders}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
          onChange={handleBreederChange}
          value={selectedBreeder}
          disabled={initialData.id} // Nur bei neuen Samen auswählbar
          inputValue={searchTextBreeder}
          onInputChange={(event, newInputValue) => {
            setSearchTextBreeder(newInputValue);
          }}
          onFocus={() => {
            setBreederFieldFocused(true);
            // Beim Fokussieren des Feldes den Text "Alle Hersteller anzeigen" entfernen,
            // wenn kein tatsächlicher Breeder ausgewählt ist
            if (!selectedBreeder || selectedBreeder.id === 'all') {
              setSearchTextBreeder('');
            }
          }}
          onBlur={() => {
            setBreederFieldFocused(false);
            // Wenn das Feld leer ist und kein Breeder ausgewählt ist, 
            // beim Verlassen wieder "Alle Hersteller anzeigen" anzeigen
            if (!searchTextBreeder.trim() && !selectedBreeder) {
              setSearchTextBreeder('Alle Hersteller anzeigen');
            }
          }}
          filterOptions={(options, params) => {
            const filtered = options.filter(option =>
              option.name.toLowerCase().includes(params.inputValue.toLowerCase())
            );
            
            // Option zum Erstellen eines neuen Herstellers hinzufügen
            if (params.inputValue.trim() !== '' && 
                !filtered.some(option => option.name.toLowerCase() === params.inputValue.toLowerCase()) &&
                params.inputValue.toLowerCase() !== 'alle hersteller anzeigen') {
              filtered.push({
                id: 'new-breeder',
                name: params.inputValue,
                isCreateOption: true
              });
            }
            
            return filtered;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Hersteller auswählen, suchen oder neu erstellen"
              fullWidth
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingBreeders ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            // Spezielle Darstellung für "Neuen Hersteller anlegen" Option
            if (option.isCreateOption) {
              return (
                <MenuItem 
                  {...props} 
                  onClick={() => {
                    setInitialBreederName(option.name)
                    setInitialStrainName('') // Sortenname ist noch leer
                    setOpenStrainModal(true)
                  }}
                  sx={{ 
                    color: 'success.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <AddCircleOutlineIcon sx={{ mr: 1 }} />
                  Neuen Hersteller anlegen: "{option.name}"
                </MenuItem>
              )
            }
            
            // Standard-Darstellung für bestehende Hersteller
            return (
              <MenuItem {...props}>
                <Typography variant="body1">
                  {option.name}
                </Typography>
              </MenuItem>
            )
          }}
        />
        
        {/* Strain-Auswahl mit Suchfunktion und "Neue Sorte anlegen" Option */}
        <Autocomplete
          options={filteredStrains}
          loading={loadingStrains}
          getOptionLabel={(option) => `${option.name} (${option.breeder})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={handleStrainChange}
          value={selectedStrain}
          disabled={initialData.id} // Nur bei neuen Samen auswählbar
          inputValue={searchTextStrain}
          onInputChange={(event, newInputValue) => {
            setSearchTextStrain(newInputValue)
          }}
          filterOptions={(options, params) => {
            const filtered = options.filter(option =>
              `${option.name} ${option.breeder}`.toLowerCase().includes(params.inputValue.toLowerCase())
            )
            
            // Option zum Erstellen einer neuen Sorte hinzufügen
            if (params.inputValue.trim() !== '' && !filtered.some(option => 
              option.name.toLowerCase() === params.inputValue.toLowerCase())) {
              filtered.push({
                id: 'new-strain',
                name: params.inputValue,
                breeder: selectedBreeder && selectedBreeder.id !== 'all' ? selectedBreeder.name : '',
                isCreateOption: true
              })
            }
            
            return filtered
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cannabis-Sorte auswählen, suchen oder neu erstellen"
              fullWidth
              margin="normal"
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingStrains ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            // Spezielle Darstellung für "Neue Sorte erstellen" Option
            if (option.isCreateOption) {
              return (
                <MenuItem 
                  {...props} 
                  onClick={() => {
                    setInitialStrainName(option.name)
                    setInitialBreederName(selectedBreeder && selectedBreeder.id !== 'all' ? selectedBreeder.name : '')
                    setOpenStrainModal(true)
                  }}
                  sx={{ 
                    color: 'success.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <AddCircleOutlineIcon sx={{ mr: 1 }} />
                  Neue Sorte anlegen: "{option.name}"
                </MenuItem>
              )
            }
            
            // Standard-Darstellung für bestehende Sorten
            return (
              <MenuItem {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.breeder} | THC: {option.thc_percentage_max}% | CBD: {option.cbd_percentage_max}%
                  </Typography>
                </Box>
              </MenuItem>
            )
          }}
        />
        
        {/* StrainModal für die Neuanlage einer Sorte/eines Herstellers */}
        <StrainFormModal 
          open={openStrainModal} 
          onClose={() => setOpenStrainModal(false)}
          onSave={handleCreateNewStrain}
          initialName={initialStrainName}
          initialBreeder={initialBreederName}
        />
        
        {/* Falls eine Sorte ausgewählt wurde, zeige die Details an */}
        {selectedStrain && !selectedStrain.isCreateOption && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Sortendetails:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  THC: {selectedStrain.thc_percentage_min}-{selectedStrain.thc_percentage_max}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  CBD: {selectedStrain.cbd_percentage_min}-{selectedStrain.cbd_percentage_max}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Blütezeit: {selectedStrain.flowering_time_min}-{selectedStrain.flowering_time_max} Tage
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Typ: {selectedStrain.strain_type}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Das Sortenname-Textfeld wird nicht mehr angezeigt, da es durch die Auswahl übernommen wird */}
        
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