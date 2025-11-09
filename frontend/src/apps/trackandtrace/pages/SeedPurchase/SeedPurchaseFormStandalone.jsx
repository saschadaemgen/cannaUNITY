// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseFormStandalone.jsx
import { useState, useEffect, useMemo } from 'react'
import {
  Paper,
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
  Grid,
  Fade,
  Zoom,
  Card,
  CardContent
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../../../../utils/api'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import GrassIcon from '@mui/icons-material/Grass'
import StrainFormModal from './components/StrainFormModal'

export default function SeedPurchaseFormStandalone() {
  const navigate = useNavigate()
  
  // State für den RFID-Scan-Modus
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  
  const [formData, setFormData] = useState({
    strain_name: '',
    quantity: 1,
    remaining_quantity: 1,
    room_id: '',
    strain_id: null,
    thc_percentage_min: null,
    thc_percentage_max: null,
    cbd_percentage_min: null,
    cbd_percentage_max: null,
    flowering_time_min: null,
    flowering_time_max: null,
    member_id: null,
    member_name: null
  })
  
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [strains, setStrains] = useState([])
  const [loadingStrains, setLoadingStrains] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  const [breeders, setBreeders] = useState([])
  const [loadingBreeders, setLoadingBreeders] = useState(false)
  const [selectedBreeder, setSelectedBreeder] = useState(null)
  const [openStrainModal, setOpenStrainModal] = useState(false)
  const [initialStrainName, setInitialStrainName] = useState('')
  const [initialBreederName, setInitialBreederName] = useState('')
  const [searchTextStrain, setSearchTextStrain] = useState('')
  const [searchTextBreeder, setSearchTextBreeder] = useState('')
  const [breederFieldFocused, setBreederFieldFocused] = useState(false)

  // Erfolgshandler
  const handleSuccess = () => {
    if (window.opener) {
      // Falls als Popup geöffnet, Parent benachrichtigen
      window.opener.postMessage({ type: 'seedCreated', memberName: scannedMemberName }, '*')
      window.close()
    } else {
      // Normal navigieren
      navigate('/trace/samen')
    }
  }
  
  // Funktion zum Abbrechen des RFID-Scans
  const handleCancelScan = async () => {
    setIsAborting(true);
    
    if (abortController) {
      abortController.abort();
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/');
      console.log("RFID-Scan erfolgreich abgebrochen");
    } catch (error) {
      console.error("Fehler beim Abbrechen des RFID-Scans:", error);
    } finally {
      setScanMode(false);
      setLoading(false);
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };
  
  // RFID-Scan-Funktion
  const startRfidScan = async () => {
    if (isAborting) return;
    
    const selectedRoom = rooms.find(room => room.id === formData.room_id);
    const deviceId = selectedRoom?.unifi_device_id;
    
    if (!deviceId) {
      alert('Der ausgewählte Raum hat kein zugeordnetes RFID-Gerät!');
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    
    setLoading(true);
    setScanMode(true);
    setScanSuccess(false);
    
    try {
      if (isAborting) return;
      
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        params: { device_id: deviceId },
        signal: controller.signal
      });
      
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;

      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }
      
      if (isAborting) return;

      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );

      const { member_id, member_name } = verifyRes.data
      
      const updatedData = {
        ...formData,
        member_id: member_id,
        member_name: member_name
      };
      
      submitForm(updatedData);
      
      setFormData(updatedData);
      setScannedMemberName(member_name);
      setScanSuccess(true);
      
      setTimeout(() => {
        handleSuccess();
      }, 2000);
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
      }
      
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      if (!isAborting) {
        setLoading(false);
      }
    }
  };

  // Formular absenden
  const submitForm = async (data) => {
    setLoading(true);
    try {
      console.log("Sending seed data:", data);
      
      const result = await api.post('/trackandtrace/seeds/', data);
      
      if (!scanSuccess) {
        setScanSuccess(true);
        setTimeout(() => {
          resetForm();
          handleSuccess();
        }, 2000);
      }
      
      return result;
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setScanMode(false);
      setLoading(false);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      strain_name: '',
      quantity: 1,
      remaining_quantity: 1,
      member_id: null,
      member_name: null,
      room_id: '',
      strain_id: null,
      thc_percentage_min: null,
      thc_percentage_max: null,
      cbd_percentage_min: null,
      cbd_percentage_max: null,
      flowering_time_min: null,
      flowering_time_max: null
    });
    
    setSelectedBreeder(null);
    setSelectedStrain(null);
    setScanMode(false);
    setScanSuccess(false);
    setAbortController(null);
    setIsAborting(false);
    setScannedMemberName('');
    setSearchTextBreeder('');
    setSearchTextStrain('');
  }

  useEffect(() => {
    loadRoomOptions()
    loadBreederOptions()
    loadStrainOptions()
  }, [])
  
  const loadRoomOptions = async () => {
    setLoadingOptions(true)
    try {
      const roomsRes = await api.get('rooms/')
      const anzuchtraume = (roomsRes.data.results || []).filter(room => 
        room.room_type === 'anzuchtraum'
      )
      
      setRooms(anzuchtraume)
      
      if (anzuchtraume.length > 0) {
        setFormData(prev => ({
          ...prev,
          room_id: anzuchtraume[0].id
        }))
      }
    } catch (error) {
      console.error('Fehler beim Laden der Anzuchträume:', error)
    } finally {
      setLoadingOptions(false)
    }
  }
  
  const loadBreederOptions = async () => {
    setLoadingBreeders(true)
    try {
      const res = await api.get('/trackandtrace/seeds/strain_options/')
      
      const uniqueBreeders = [...new Set(res.data.map(strain => strain.breeder))]
        .filter(breeder => breeder)
        .sort()
        .map(breeder => ({
          id: 'breeder-' + breeder,
          name: breeder
        }))
      
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
  
  const loadStrainOptions = async (breederName = null) => {
    setLoadingStrains(true)
    try {
      const res = await api.get('/trackandtrace/seeds/strain_options/')
      
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

  const filteredStrains = useMemo(() => {
    if (!selectedBreeder || selectedBreeder.id === 'all') {
      return strains
    }
    
    const breederName = selectedBreeder.name
    return strains.filter(strain => strain.breeder === breederName)
  }, [strains, selectedBreeder])
  
  const getFilteredBreeders = () => {
    return breederFieldFocused ? 
      breeders.filter(breeder => breeder.id !== 'all') : 
      breeders;
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'quantity') {
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
  
  const handleBreederChange = (event, newValue) => {
    if (newValue && newValue.isCreateOption) {
      setInitialBreederName(newValue.name)
      setInitialStrainName('')
      setOpenStrainModal(true)
      return
    }
    
    setSelectedBreeder(newValue)
    
    if (newValue && newValue.id !== 'all') {
      loadStrainOptions(newValue.name)
    } else {
      loadStrainOptions()
    }
    
    setSelectedStrain(null)
    
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
  
  const handleStrainChange = (event, newValue) => {
    if (newValue && newValue.isCreateOption) {
      setInitialStrainName(newValue.name)
      setInitialBreederName(selectedBreeder && selectedBreeder.id !== 'all' ? selectedBreeder.name : '')
      setOpenStrainModal(true)
      return
    }
    
    setSelectedStrain(newValue)
    
    if (newValue) {
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
  
  const handleCreateNewStrain = (newStrain) => {
    setStrains(prev => [...prev, newStrain])
    setSelectedStrain(newStrain)
    
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
    
    const newBreeder = {
      id: 'breeder-' + newStrain.breeder,
      name: newStrain.breeder
    }
    
    if (!breeders.some(b => b.name === newStrain.breeder)) {
      setBreeders(prev => [...prev, newBreeder])
    }
    
    setSelectedBreeder(newBreeder)
    setOpenStrainModal(false)
  }

  const isFormValid = () => {
    const hasValidBreeder = selectedBreeder && selectedBreeder.id !== 'all';
    const hasValidStrain = !!selectedStrain && !selectedStrain.isCreateOption;
    const hasValidQuantity = formData.quantity && Number(formData.quantity) > 0;
    const hasValidRoom = !!formData.room_id;
    
    return hasValidBreeder && hasValidStrain && hasValidQuantity && hasValidRoom;
  }

  if (scanMode) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent>
          <Box 
            sx={{ 
              bgcolor: 'success.light', 
              height: '400px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              p: 4,
              borderRadius: 1
            }}
          >
            {!scanSuccess && (
              <Button 
                onClick={handleCancelScan}
                variant="contained" 
                color="error"
                size="small"
                sx={{ 
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  minWidth: '100px'
                }}
              >
                Abbrechen
              </Button>
            )}
            
            {scanSuccess ? (
              <Fade in={scanSuccess}>
                <Box sx={{ textAlign: 'center' }}>
                  <Zoom in={scanSuccess}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                  </Zoom>
                  
                  <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                    Autorisierung erfolgreich
                  </Typography>
                  
                  <Typography variant="body1" align="center" color="white" sx={{ mt: 2, fontStyle: 'italic' }}>
                    Vielen Dank für Ihren Einkauf,
                  </Typography>
                  
                  <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                    {scannedMemberName}
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Bitte Ausweis jetzt scannen
                </Typography>
                
                <Typography variant="body1" align="center" color="white" gutterBottom>
                  um den Vorgang abzuschließen
                </Typography>
                
                {loading && (
                  <CircularProgress 
                    size={60} 
                    thickness={5} 
                    sx={{ 
                      color: 'white', 
                      mt: 4 
                    }} 
                  />
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <GrassIcon sx={{ color: 'success.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h6">Sameneinkauf erfassen</Typography>
        </Box>
        <Button 
          onClick={() => navigate('/trace/samen')} 
          variant="contained" 
          color="error"
          size="small"
          sx={{ minWidth: '100px' }}
        >
          Abbrechen
        </Button>
      </Box>
      
      {selectedStrain && !selectedStrain.isCreateOption && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
          <Grid container spacing={1} sx={{ width: '100%' }}>
            <Grid size={6}>
              <Typography variant="body2">
                THC: {selectedStrain.thc_percentage_min}-{selectedStrain.thc_percentage_max}%
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2">
                CBD: {selectedStrain.cbd_percentage_min}-{selectedStrain.cbd_percentage_max}%
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2">
                Blütezeit: {selectedStrain.flowering_time_min}-{selectedStrain.flowering_time_max} Tage
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2">
                Typ: {selectedStrain.strain_type}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
      
      <Autocomplete
        options={getFilteredBreeders()}
        loading={loadingBreeders}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option && value && option.id === value.id}
        onChange={handleBreederChange}
        value={selectedBreeder}
        inputValue={searchTextBreeder}
        onInputChange={(event, newInputValue) => {
          setSearchTextBreeder(newInputValue);
        }}
        onFocus={() => {
          setBreederFieldFocused(true);
          if (!selectedBreeder || selectedBreeder.id === 'all') {
            setSearchTextBreeder('');
          }
        }}
        onBlur={() => {
          setBreederFieldFocused(false);
          if (!searchTextBreeder.trim() && !selectedBreeder) {
            setSearchTextBreeder('Alle Hersteller anzeigen');
          }
        }}
        filterOptions={(options, params) => {
          const filtered = options.filter(option =>
            option.name.toLowerCase().includes(params.inputValue.toLowerCase())
          );
          
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
            label="Hersteller auswählen, suchen oder neu erstellen *"
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
          const { key, ...otherProps } = props;
          
          if (option.isCreateOption) {
            return (
              <MenuItem 
                key={key}
                {...otherProps} 
                onClick={() => {
                  setInitialBreederName(option.name)
                  setInitialStrainName('')
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
          
          return (
            <MenuItem key={key} {...otherProps}>
              <Typography variant="body1">
                {option.name}
              </Typography>
            </MenuItem>
          )
        }}
      />
      
      <Autocomplete
        options={filteredStrains}
        loading={loadingStrains}
        getOptionLabel={(option) => `${option.name} (${option.breeder})`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={handleStrainChange}
        value={selectedStrain}
        inputValue={searchTextStrain}
        onInputChange={(event, newInputValue) => {
          setSearchTextStrain(newInputValue)
        }}
        filterOptions={(options, params) => {
          const filtered = options.filter(option =>
            `${option.name} ${option.breeder}`.toLowerCase().includes(params.inputValue.toLowerCase())
          )
          
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
          const { key, ...otherProps } = props;
          
          if (option.isCreateOption) {
            return (
              <MenuItem 
                key={key}
                {...otherProps} 
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
          
          return (
            <MenuItem key={key} {...otherProps}>
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
      
      <StrainFormModal 
        open={openStrainModal} 
        onClose={() => setOpenStrainModal(false)}
        onSave={handleCreateNewStrain}
        initialName={initialStrainName}
        initialBreeder={initialBreederName}
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
      />
      
      {loadingOptions ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <FormControl fullWidth margin="normal">
          <InputLabel>Anzuchtraum *</InputLabel>
          <Select
            name="room_id"
            value={formData.room_id}
            onChange={handleChange}
            label="Anzuchtraum *"
          >
            <MenuItem value="">
              <em>Bitte Anzuchtraum auswählen</em>
            </MenuItem>
            {rooms.map(room => (
              <MenuItem key={room.id} value={room.id}>
                {room.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {!formData.member_id && (
        <Box textAlign="center" mt={3} mb={2}>
          <Button
            onClick={startRfidScan}
            variant="contained"
            color="primary"
            disabled={loading || !isFormValid()}
            startIcon={loading && !scanMode ? <CircularProgress size={16} /> : null}
            fullWidth
            sx={{ 
              height: '48px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}
          >
            Sameneinkauf abschließen und Mit RFID bestätigen
          </Button>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            (Bitte Angaben vorher genau prüfen - dieser Schritt kann nicht rückgängig gemacht werden)
          </Typography>
        </Box>
      )}
    </Paper>
  )
}