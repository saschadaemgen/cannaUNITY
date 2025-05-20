// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseForm.jsx
import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  Zoom
} from '@mui/material'
import api from '@/utils/api'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import StrainFormModal from './components/StrainFormModal'

export default function SeedPurchaseForm({ open, onClose, onSuccess, initialData = {} }) {
  // State für den RFID-Scan-Modus
  const [scanMode, setScanMode] = useState(false)
  // Neuer State für erfolgreichen Scan
  const [scanSuccess, setScanSuccess] = useState(false)
  // State für den Namen des gescannten Mitglieds (für Erfolgsmeldung)
  const [scannedMemberName, setScannedMemberName] = useState('')
  
  // Angepasster onSuccess Handler, der die korrekten Daten zurück an die Elternkomponente gibt
  const handleSuccess = () => {
    // Generiere die passende Nachricht
    const message = initialData.id ? 'Samen erfolgreich aktualisiert' : 'Samen erfolgreich gespeichert';
    
    // Übergebe zwei separate Parameter anstatt eines Objekts: Nachricht und Mitgliedsname
    onSuccess(message, scannedMemberName);
  }
  
  // RFID-Scan-Funktion direkt in der Hauptkomponente
  const startRfidScan = async () => {
    setLoading(true);
    setScanMode(true);
    setScanSuccess(false);
    
    try {
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_user_id, message, unifi_name } = bindRes.data

      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name })

      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }

      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', {
        token,
        unifi_name
      })

      const { member_id, member_name } = verifyRes.data
      
      // Daten für direktes Absenden vorbereiten
      const updatedData = {
        ...formData,
        member_id: member_id,
        member_name: member_name
      };
      
      console.log("Formular mit Mitglied wird abgeschickt:", member_id);
      
      // Formular direkt mit den aktualisierten Daten absenden
      submitForm(updatedData);
      
      // State aktualisieren für die UI-Anzeige
      setFormData(updatedData);
      
      // Erfolgszustand setzen und Mitgliedsnamen speichern
      setScannedMemberName(member_name);
      setScanSuccess(true);
      
      // Nach 2 Sekunden das Modal schließen
      setTimeout(() => {
        handleSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('RFID-Bindungsfehler:', error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
      setScanMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Neue Hilfsfunktion zum Absenden des Formulars mit expliziten Daten
  const submitForm = async (data) => {
    setLoading(true);
    try {
      console.log("Sending seed data:", data);
      
      let result;
      if (initialData.id) {
        result = await api.patch(`/trackandtrace/seeds/${initialData.id}/`, data);
      } else {
        result = await api.post('/trackandtrace/seeds/', data);
      }
      
      // Bei erfolgreichem Speichern den Erfolgs-Modus aktivieren, wenn nicht bereits aktiviert
      if (!scanSuccess) {
        setScanSuccess(true);
        
        // Verzögerung hinzufügen (2 Sekunden) und dann zurück zur Liste
        setTimeout(() => {
          // Vollständiges Zurücksetzen vor dem Schließen
          resetForm();
          
          // Direkte Übergabe von Nachricht und Mitgliedsnamen als separate Parameter
          const successMessage = initialData.id ? 'Samen erfolgreich aktualisiert' : 'Samen erfolgreich gespeichert';
          onSuccess(successMessage, data.member_name || 'Unbekannt');
        }, 2000); // 2000 ms = 2 Sekunden
      }
      
      return result;
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setScanMode(false); // Scan-Modus beenden bei Fehler
      setLoading(false); // Bei Fehler sofort Loading-Status aufheben
      throw error; // Fehler weiterleiten
    }
    // Loading-Status nicht sofort aufheben bei Erfolg
    // (damit der Benutzer sieht, dass etwas passiert ist)
  };

  const [formData, setFormData] = useState({
    strain_name: '',
    quantity: 1,
    remaining_quantity: 1,
    room_id: '',
    strain_id: null,
    // Neue Felder
    thc_percentage_min: null,
    thc_percentage_max: null,
    cbd_percentage_min: null,
    cbd_percentage_max: null,
    flowering_time_min: null,
    flowering_time_max: null,
    // Member-Felder 
    member_id: null, // Geändert: responsible_member -> member_id
    member_name: null // Für die Anzeige
  })
  
  const [loading, setLoading] = useState(false)
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
  const [breederFieldFocused, setBreederFieldFocused] = useState(false)

  // Funktion zum vollständigen Zurücksetzen des Formulars
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
    setScannedMemberName('');
    setSearchTextBreeder('');
    setSearchTextStrain('');
  }

  useEffect(() => {
    if (open) {
      // Wenn Formulardaten bereitgestellt werden (für Bearbeitungsfall)
      if (initialData.id) {
        setFormData({
          strain_name: initialData.strain_name || '',
          quantity: initialData.quantity || 1,
          remaining_quantity: initialData.remaining_quantity || 1,
          member_id: initialData.member?.id || null, // Geändert
          member_name: initialData.member?.display_name || null, // Geändert
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
        // Für den Fall eines neuen Datensatzes - komplett zurücksetzen
        resetForm();
      }
      
      // Räume, Hersteller und Sorten laden
      loadRoomOptions()
      loadBreederOptions()
      loadStrainOptions()
      
      // Scan-Modus zurücksetzen
      setScanMode(false)
      setScanSuccess(false)
    }
  }, [open, initialData])
  
  // Modifizierte Funktion nur für Räume
  const loadRoomOptions = async () => {
    setLoadingOptions(true)
    try {
      // Räume laden
      const roomsRes = await api.get('rooms/')
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Räume:', error)
    } finally {
      setLoadingOptions(false)
    }
  }
  
  // Funktion zum Laden der Breeder-Optionen
  const loadBreederOptions = async () => {
    setLoadingBreeders(true)
    try {
      // Hier ein API-Aufruf, um alle eindeutigen Hersteller zu erhalten
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
      console.log("Sending seed data:", data); // Debug-Info
      
      let result;
      if (initialData.id) {
        result = await api.patch(`/trackandtrace/seeds/${initialData.id}/`, data)
      } else {
        result = await api.post('/trackandtrace/seeds/', data)
      }
      
      // Mitgliedsnamen aus der Antwort speichern (falls vorhanden)
      let displayName = 'Unbekannt';
      if (result?.data?.member?.display_name) {
        displayName = result.data.member.display_name;
      } else if (formData.member_name) {
        displayName = formData.member_name;
      }
      
      // Formular zurücksetzen und erfolgreichen Abschluss melden
      resetForm();
      
      // Erfolg mit Nachricht und Mitgliedsnamen als separate Parameter melden
      const successMessage = initialData.id ? 'Samen erfolgreich aktualisiert' : 'Samen erfolgreich gespeichert';
      onSuccess(successMessage, displayName);
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    } finally {
      setLoading(false)
    }
  }

  // Angepasster onClose Handler, verhindert Schließen bei Backdrop-Klick
  const handleDialogClose = (event, reason) => {
    // Nur schließen, wenn explizit auf den Abbrechen-Button geklickt wurde
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
    >
      {scanMode ? (
        // Scan-Modus mit grünem Hintergrund
        <Box 
          sx={{ 
            bgcolor: 'success.light', 
            height: '400px', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4,
            position: 'relative'
          }}
        >
          {/* Abbrechen-Button nur anzeigen, wenn wir NICHT im Erfolgs-Modus sind */}
          {!scanSuccess && (
            <Button 
              onClick={() => setScanMode(false)} 
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
            // Erfolgsmeldung nach erfolgreichem Scan
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
            // Scan-Aufforderung
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
      ) : (
        // Normaler Formularmodus
        <>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{initialData.id ? 'Samen bearbeiten' : 'Neuen Samen einkaufen'}</Typography>
            <Button 
              onClick={onClose} 
              variant="contained" 
              color="error"
              size="small"
              sx={{ minWidth: '100px' }}
            >
              Abbrechen
            </Button>
          </DialogTitle>
          <DialogContent>
            {/* Falls eine Sorte ausgewählt wurde, zeige die Details an */}
            {selectedStrain && !selectedStrain.isCreateOption && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
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
            
            {loadingOptions ? (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
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
            )}
            
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
            
            {/* Button zum Starten des RFID-Scans */}
            {!formData.member_id && (
              <Box textAlign="center" mt={2} mb={2}>
                <Button
                  onClick={startRfidScan}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading && !scanMode ? <CircularProgress size={16} /> : null}
                  fullWidth
                  sx={{ 
                    height: '48px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  Sameneinkauf abschliießen und Mit RFID bestätigen
                </Button>
              </Box>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  )
}