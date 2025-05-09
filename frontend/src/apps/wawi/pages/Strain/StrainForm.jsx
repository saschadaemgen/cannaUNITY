// frontend/src/apps/wawi/pages/Strain/StrainForm.jsx
import { useState, useEffect } from 'react';
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
  Stack,
  Slider,
  Divider,
  Chip,
  OutlinedInput,
  Tabs,
  Tab,
  IconButton,
  FormHelperText,
  Rating,
  useMediaQuery,
  useTheme,
  Paper,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import api from '@/utils/api';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#4caf50',
  },
});

// Tab Panel Komponente
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`strain-tabpanel-${index}`}
      aria-labelledby={`strain-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function StrainForm({ open, onClose, onSuccess, initialData = {}, members = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    name: '',
    breeder: '',
    strain_type: 'feminized',
    indica_percentage: 50,
    genetic_origin: '',
    flowering_time_min: 50,
    flowering_time_max: 65,
    height_indoor_min: 80,
    height_indoor_max: 120,
    height_outdoor_min: 120,
    height_outdoor_max: 180,
    yield_indoor_min: 400,
    yield_indoor_max: 500,
    yield_outdoor_min: 500,
    yield_outdoor_max: 700,
    difficulty: 'intermediate',
    thc_percentage_min: 15,
    thc_percentage_max: 20,
    cbd_percentage_min: 0.1,
    cbd_percentage_max: 1.0,
    dominant_terpenes: '',
    flavors: '',
    effects: '',
    general_information: '',
    growing_information: '',
    suitable_climate: 'all',
    growing_method: 'all',
    resistance_mold: 3,
    resistance_pests: 3,
    resistance_cold: 3,
    awards: '',
    release_year: new Date().getFullYear(),
    rating: 4.0,
    price_per_seed: '',
    seeds_per_pack: 1,
    member_id: '',
    is_active: true
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);
  
  // Listen für Auswahlelemente
  const [availableTerpenes, setAvailableTerpenes] = useState([]);
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [availableEffects, setAvailableEffects] = useState([]);
  
  // Validierungsstatus
  const [formValid, setFormValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (open) {
      // Fehler zurücksetzen beim Öffnen
      setApiError('');
      
      // Wenn Formulardaten bereitgestellt werden (für Bearbeitungsfall)
      if (initialData.id) {
        const data = {...initialData};
        
        // Objekte in IDs konvertieren, falls nötig
        if (data.member && typeof data.member === 'object') {
          data.member_id = data.member.id;
        }
        
        // Numeric Werte sicherstellen
        const numericFields = [
          'indica_percentage', 'flowering_time_min', 'flowering_time_max',
          'height_indoor_min', 'height_indoor_max', 'height_outdoor_min', 'height_outdoor_max',
          'yield_indoor_min', 'yield_indoor_max', 'yield_outdoor_min', 'yield_outdoor_max',
          'thc_percentage_min', 'thc_percentage_max', 'cbd_percentage_min', 'cbd_percentage_max',
          'resistance_mold', 'resistance_pests', 'resistance_cold',
          'release_year', 'rating', 'price_per_seed', 'seeds_per_pack'
        ];
        
        numericFields.forEach(field => {
          if (data[field] !== undefined && data[field] !== null) {
            data[field] = Number(data[field]);
          }
        });
        
        setFormData(data);
        
        // Bilder laden
        loadImages(data.id);
      } else {
        // Für den Fall eines neuen Datensatzes
        setFormData({
          name: '',
          breeder: '',
          strain_type: 'feminized',
          indica_percentage: 50,
          genetic_origin: '',
          flowering_time_min: 50,
          flowering_time_max: 65,
          height_indoor_min: 80,
          height_indoor_max: 120,
          height_outdoor_min: 120,
          height_outdoor_max: 180,
          yield_indoor_min: 400,
          yield_indoor_max: 500,
          yield_outdoor_min: 500,
          yield_outdoor_max: 700,
          difficulty: 'intermediate',
          thc_percentage_min: 15,
          thc_percentage_max: 20,
          cbd_percentage_min: 0.1,
          cbd_percentage_max: 1.0,
          dominant_terpenes: '',
          flavors: '',
          effects: '',
          general_information: '',
          growing_information: '',
          suitable_climate: 'all',
          growing_method: 'all',
          resistance_mold: 3,
          resistance_pests: 3,
          resistance_cold: 3,
          awards: '',
          release_year: new Date().getFullYear(),
          rating: 4.0,
          price_per_seed: '',
          seeds_per_pack: 1,
          member_id: '',
          is_active: true
        });
        
        setImages([]);
      }
      
      // Lade verfügbare Terpene, Geschmacksrichtungen und Effekte
      loadTerpenes();
      loadFlavors();
      loadEffects();
      
      // Formular validieren
      validateForm();
    }
  }, [open, initialData]);
  
  // Formular validieren, wenn sich Daten ändern
  useEffect(() => {
    validateForm();
  }, [formData]);
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Pflichtfelder prüfen
    if (!formData.name) {
      newErrors.name = 'Sortenname ist erforderlich';
      isValid = false;
    }
    
    if (!formData.breeder) {
      newErrors.breeder = 'Hersteller/Züchter ist erforderlich';
      isValid = false;
    }
    
    // Numerische Wertebereiche prüfen
    if (formData.indica_percentage < 0 || formData.indica_percentage > 100) {
      newErrors.indica_percentage = 'Muss zwischen 0 und 100 sein';
      isValid = false;
    }
    
    if (formData.thc_percentage_min > formData.thc_percentage_max) {
      newErrors.thc_percentage_min = 'Min. THC kann nicht größer als Max. THC sein';
      isValid = false;
    }
    
    if (formData.cbd_percentage_min > formData.cbd_percentage_max) {
      newErrors.cbd_percentage_min = 'Min. CBD kann nicht größer als Max. CBD sein';
      isValid = false;
    }
    
    if (formData.flowering_time_min > formData.flowering_time_max) {
      newErrors.flowering_time_min = 'Min. Blütezeit kann nicht größer als Max. Blütezeit sein';
      isValid = false;
    }
    
    if (formData.height_indoor_min > formData.height_indoor_max) {
      newErrors.height_indoor_min = 'Min. Höhe kann nicht größer als Max. Höhe sein';
      isValid = false;
    }
    
    if (formData.height_outdoor_min > formData.height_outdoor_max) {
      newErrors.height_outdoor_min = 'Min. Höhe kann nicht größer als Max. Höhe sein';
      isValid = false;
    }
    
    if (formData.yield_indoor_min > formData.yield_indoor_max) {
      newErrors.yield_indoor_min = 'Min. Ertrag kann nicht größer als Max. Ertrag sein';
      isValid = false;
    }
    
    if (formData.yield_outdoor_min > formData.yield_outdoor_max) {
      newErrors.yield_outdoor_min = 'Min. Ertrag kann nicht größer als Max. Ertrag sein';
      isValid = false;
    }
    
    setErrors(newErrors);
    setFormValid(isValid);
    
    return isValid;
  };
  
  const loadImages = async (strainId) => {
    try {
      const res = await api.get(`/wawi/strains/${strainId}/`);
      if (res.data.images) {
        setImages(res.data.images);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
      setApiError('Bilder konnten nicht geladen werden');
    }
  };
  
  const loadTerpenes = async () => {
    try {
      const res = await api.get('/wawi/strains/terpenes/');
      setAvailableTerpenes(res.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Terpene:', error);
    }
  };
  
  const loadFlavors = async () => {
    try {
      const res = await api.get('/wawi/strains/flavors/');
      setAvailableFlavors(res.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Geschmacksrichtungen:', error);
    }
  };
  
  const loadEffects = async () => {
    try {
      const res = await api.get('/wawi/strains/effects/');
      setAvailableEffects(res.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Effekte:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSliderChange = (name) => (e, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const handleRatingChange = (e, newValue) => {
    setFormData(prev => ({
      ...prev,
      rating: newValue
    }));
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };
  
  const handleImageUpload = async () => {
    if (!selectedImage || !initialData.id) return;
    
    setImageLoading(true);
    setApiError('');
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('caption', imageCaption);
    formData.append('is_primary', isPrimaryImage ? 'true' : 'false');
    
    try {
      await api.post(`/wawi/strains/${initialData.id}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Bilder neu laden
      loadImages(initialData.id);
      
      // Reset
      setSelectedImage(null);
      setImageCaption('');
      setIsPrimaryImage(false);
      
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      setApiError('Fehler beim Hochladen des Bildes: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    } finally {
      setImageLoading(false);
    }
  };
  
  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`/wawi/strains/${initialData.id}/remove_image/?image_id=${imageId}`);
      
      // Bilder neu laden
      loadImages(initialData.id);
      
    } catch (error) {
      console.error('Fehler beim Löschen des Bildes:', error);
      setApiError('Fehler beim Löschen des Bildes: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const handleSubmit = async () => {
    // Nochmals validieren
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setApiError('');
    
    try {
      const data = { ...formData };
      
      // Bei Bearbeitung eines bestehenden Datensatzes
      if (initialData.id) {
        await api.patch(`/wawi/strains/${initialData.id}/`, data);
      } else {
        // Bei Erstellung eines neuen Datensatzes
        await api.post('/wawi/strains/', data);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setApiError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Berechne Sativa-Prozentsatz
  const sativaPercentage = 100 - formData.indica_percentage;

  // Generiert ein Menü für einen Monat basierend auf min und max Werten
  const generateRangeMenu = (min, max, step = 1) => {
    const items = [];
    for (let i = min; i <= max; i += step) {
      items.push(
        <MenuItem key={i} value={i}>
          {i}
        </MenuItem>
      );
    }
    return items;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        {initialData.id ? `Sorte bearbeiten: ${initialData.name}` : 'Neue Cannabis-Sorte hinzufügen'}
      </DialogTitle>
      
      {apiError && (
        <Alert severity="error" sx={{ mx: 2 }} onClose={() => setApiError('')}>
          {apiError}
        </Alert>
      )}
      
      <Box sx={{ px: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2
          }}
        >
          <Tab label="Grunddaten" />
          <Tab label="Wachstum" />
          <Tab label="Cannabinoide & Terpene" />
          <Tab label="Aroma & Wirkung" />
          <Tab label="Beschreibungen" />
          <Tab label="Bilder" />
          <Tab label="Sonstiges" />
        </Tabs>
      </Box>
      
      <DialogContent>
        {/* Tab 1: Grunddaten */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Sortenname"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
              
              <TextField
                label="Hersteller/Züchter"
                name="breeder"
                value={formData.breeder}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.breeder}
                helperText={errors.breeder}
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Samentyp</InputLabel>
                <Select
                  name="strain_type"
                  value={formData.strain_type}
                  onChange={handleChange}
                  label="Samentyp"
                >
                  <MenuItem value="feminized">Feminisiert</MenuItem>
                  <MenuItem value="regular">Regulär</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
                  <MenuItem value="f1_hybrid">F1 Hybrid</MenuItem>
                  <MenuItem value="cbd">CBD-Samen</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Genetische Herkunft"
                name="genetic_origin"
                value={formData.genetic_origin}
                onChange={handleChange}
                fullWidth
                placeholder="z.B. OG Kush x Sour Diesel"
              />
            </Stack>
            
            <Box>
              <Typography gutterBottom>
                Indica/Sativa Verhältnis: {formData.indica_percentage}% Indica / {sativaPercentage}% Sativa
              </Typography>
              <Slider
                value={formData.indica_percentage}
                onChange={handleSliderChange('indica_percentage')}
                aria-labelledby="indica-percentage-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={value => `${value}% Indica`}
                marks={[
                  { value: 0, label: '100% Sativa' },
                  { value: 50, label: '50/50' },
                  { value: 100, label: '100% Indica' }
                ]}
              />
              {errors.indica_percentage && (
                <FormHelperText error>{errors.indica_percentage}</FormHelperText>
              )}
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Preis pro Samen (€)"
                name="price_per_seed"
                type="number"
                value={formData.price_per_seed}
                onChange={handleChange}
                fullWidth
                inputProps={{ step: "0.1" }}
              />
              
              <TextField
                label="Anzahl Samen pro Packung"
                name="seeds_per_pack"
                type="number"
                value={formData.seeds_per_pack}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {initialData.id && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value={true}>Aktiv</MenuItem>
                    <MenuItem value={false}>Inaktiv</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <FormControl fullWidth>
                <InputLabel>Zugeordnetes Mitglied</InputLabel>
                <Select
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleChange}
                  label="Zugeordnetes Mitglied"
                >
                  <MenuItem value="">Keines</MenuItem>
                  {members.map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </TabPanel>
        
        {/* Tab 2: Wachstum */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Blütezeit (Tage)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. Tage"
                    name="flowering_time_min"
                    type="number"
                    value={formData.flowering_time_min}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 30, max: 120 }}
                    error={!!errors.flowering_time_min}
                    helperText={errors.flowering_time_min}
                  />
                  <TextField
                    label="Max. Tage"
                    name="flowering_time_max"
                    type="number"
                    value={formData.flowering_time_max}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 30, max: 120 }}
                    error={!!errors.flowering_time_max}
                    helperText={errors.flowering_time_max}
                  />
                </Stack>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>Schwierigkeitsgrad</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label="Schwierigkeitsgrad"
                >
                  <MenuItem value="beginner">Anfänger</MenuItem>
                  <MenuItem value="intermediate">Mittel</MenuItem>
                  <MenuItem value="advanced">Fortgeschritten</MenuItem>
                  <MenuItem value="expert">Experte</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <Divider>Indoor-Wachstum</Divider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Höhe Indoor (cm)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. Höhe"
                    name="height_indoor_min"
                    type="number"
                    value={formData.height_indoor_min}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 20, max: 400 }}
                    error={!!errors.height_indoor_min}
                    helperText={errors.height_indoor_min}
                  />
                  <TextField
                    label="Max. Höhe"
                    name="height_indoor_max"
                    type="number"
                    value={formData.height_indoor_max}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 20, max: 400 }}
                    error={!!errors.height_indoor_max}
                    helperText={errors.height_indoor_max}
                  />
                </Stack>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Ertrag Indoor (g/m²)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. Ertrag"
                    name="yield_indoor_min"
                    type="number"
                    value={formData.yield_indoor_min}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 1000 }}
                    error={!!errors.yield_indoor_min}
                    helperText={errors.yield_indoor_min}
                  />
                  <TextField
                    label="Max. Ertrag"
                    name="yield_indoor_max"
                    type="number"
                    value={formData.yield_indoor_max}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 1000 }}
                    error={!!errors.yield_indoor_max}
                    helperText={errors.yield_indoor_max}
                  />
                </Stack>
              </Box>
            </Stack>
            
            <Divider>Outdoor-Wachstum</Divider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Höhe Outdoor (cm)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. Höhe"
                    name="height_outdoor_min"
                    type="number"
                    value={formData.height_outdoor_min || ''}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 500 }}
                    error={!!errors.height_outdoor_min}
                    helperText={errors.height_outdoor_min}
                  />
                  <TextField
                    label="Max. Höhe"
                    name="height_outdoor_max"
                    type="number"
                    value={formData.height_outdoor_max || ''}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 500 }}
                    error={!!errors.height_outdoor_max}
                    helperText={errors.height_outdoor_max}
                  />
                </Stack>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>Ertrag Outdoor (g/Pflanze)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. Ertrag"
                    name="yield_outdoor_min"
                    type="number"
                    value={formData.yield_outdoor_min || ''}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 2000 }}
                    error={!!errors.yield_outdoor_min}
                    helperText={errors.yield_outdoor_min}
                  />
                  <TextField
                    label="Max. Ertrag"
                    name="yield_outdoor_max"
                    type="number"
                    value={formData.yield_outdoor_max || ''}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 50, max: 2000 }}
                    error={!!errors.yield_outdoor_max}
                    helperText={errors.yield_outdoor_max}
                  />
                </Stack>
              </Box>
            </Stack>
            
            <Divider>Wachstumsumgebung</Divider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Geeignetes Klima</InputLabel>
                <Select
                  name="suitable_climate"
                  value={formData.suitable_climate}
                  onChange={handleChange}
                  label="Geeignetes Klima"
                >
                  <MenuItem value="indoor">Indoor</MenuItem>
                  <MenuItem value="outdoor">Outdoor</MenuItem>
                  <MenuItem value="greenhouse">Gewächshaus</MenuItem>
                  <MenuItem value="all">Alle</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Bevorzugte Anbaumethode</InputLabel>
                <Select
                  name="growing_method"
                  value={formData.growing_method}
                  onChange={handleChange}
                  label="Bevorzugte Anbaumethode"
                >
                  <MenuItem value="soil">Erde</MenuItem>
                  <MenuItem value="hydro">Hydrokultur</MenuItem>
                  <MenuItem value="coco">Kokos</MenuItem>
                  <MenuItem value="all">Alle</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <Divider>Resistenzen</Divider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
              <Box sx={{ width: '100%' }}>
                <Typography gutterBottom>Schimmelresistenz: {formData.resistance_mold}/5</Typography>
                <Slider
                  value={formData.resistance_mold}
                  onChange={handleSliderChange('resistance_mold')}
                  aria-labelledby="mold-resistance-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={5}
                />
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Typography gutterBottom>Schädlingsresistenz: {formData.resistance_pests}/5</Typography>
                <Slider
                  value={formData.resistance_pests}
                  onChange={handleSliderChange('resistance_pests')}
                  aria-labelledby="pest-resistance-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={5}
                />
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Typography gutterBottom>Kälteresistenz: {formData.resistance_cold}/5</Typography>
                <Slider
                  value={formData.resistance_cold}
                  onChange={handleSliderChange('resistance_cold')}
                  aria-labelledby="cold-resistance-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={5}
                />
              </Box>
            </Stack>
          </Stack>
        </TabPanel>
        
        {/* Tab 3: Cannabinoide & Terpene */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            <Divider>THC & CBD-Gehalt</Divider>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>THC-Gehalt (%)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. THC"
                    name="thc_percentage_min"
                    type="number"
                    value={formData.thc_percentage_min}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 0, max: 35, step: 0.1 }}
                    error={!!errors.thc_percentage_min}
                    helperText={errors.thc_percentage_min}
                  />
                  <TextField
                    label="Max. THC"
                    name="thc_percentage_max"
                    type="number"
                    value={formData.thc_percentage_max}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 0, max: 35, step: 0.1 }}
                    error={!!errors.thc_percentage_max}
                    helperText={errors.thc_percentage_max}
                  />
                </Stack>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>CBD-Gehalt (%)</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Min. CBD"
                    name="cbd_percentage_min"
                    type="number"
                    value={formData.cbd_percentage_min}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 0, max: 25, step: 0.1 }}
                    error={!!errors.cbd_percentage_min}
                    helperText={errors.cbd_percentage_min}
                  />
                  <TextField
                    label="Max. CBD"
                    name="cbd_percentage_max"
                    type="number"
                    value={formData.cbd_percentage_max}
                    onChange={handleChange}
                    fullWidth
                    inputProps={{ min: 0, max: 25, step: 0.1 }}
                    error={!!errors.cbd_percentage_max}
                    helperText={errors.cbd_percentage_max}
                  />
                </Stack>
              </Box>
            </Stack>
            
            <Divider>Terpenprofil</Divider>
            
            <FormControl fullWidth>
              <InputLabel>Dominante Terpene</InputLabel>
              <Select
                multiple
                name="dominant_terpenes"
                value={formData.dominant_terpenes ? formData.dominant_terpenes.split(',').map(t => t.trim()).filter(Boolean) : []}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    dominant_terpenes: e.target.value.join(', ')
                  });
                }}
                input={<OutlinedInput label="Dominante Terpene" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {/* Standard Terpene */}
                <MenuItem value="Myrcen">Myrcen</MenuItem>
                <MenuItem value="Limonen">Limonen</MenuItem>
                <MenuItem value="Caryophyllen">Caryophyllen</MenuItem>
                <MenuItem value="Pinen">Pinen</MenuItem>
                <MenuItem value="Linalool">Linalool</MenuItem>
                <MenuItem value="Humulen">Humulen</MenuItem>
                <MenuItem value="Terpinolen">Terpinolen</MenuItem>
                <MenuItem value="Ocimen">Ocimen</MenuItem>
                
                {/* Dynamisch geladene Terpene */}
                {availableTerpenes
                  .filter(terpene => !['Myrcen', 'Limonen', 'Caryophyllen', 'Pinen', 'Linalool', 'Humulen', 'Terpinolen', 'Ocimen'].includes(terpene))
                  .map(terpene => (
                    <MenuItem key={terpene} value={terpene}>{terpene}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <TextField
              label="Andere Terpene (Komma-getrennt)"
              name="dominant_terpenes"
              value={formData.dominant_terpenes}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Geben Sie die Terpene direkt ein oder wählen Sie aus dem Dropdown oben"
            />
          </Stack>
        </TabPanel>
        
        {/* Tab 4: Aroma & Wirkung */}
        <TabPanel value={tabValue} index={3}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Geschmacksrichtungen</InputLabel>
              <Select
                multiple
                name="flavors"
                value={formData.flavors ? formData.flavors.split(',').map(f => f.trim()).filter(Boolean) : []}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    flavors: e.target.value.join(', ')
                  });
                }}
                input={<OutlinedInput label="Geschmacksrichtungen" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {/* Standard Geschmacksrichtungen */}
                <MenuItem value="Süß">Süß</MenuItem>
                <MenuItem value="Sauer">Sauer</MenuItem>
                <MenuItem value="Würzig">Würzig</MenuItem>
                <MenuItem value="Erdig">Erdig</MenuItem>
                <MenuItem value="Holzig">Holzig</MenuItem>
                <MenuItem value="Kiefer">Kiefer</MenuItem>
                <MenuItem value="Zitrus">Zitrus</MenuItem>
                <MenuItem value="Beeren">Beeren</MenuItem>
                <MenuItem value="Trauben">Trauben</MenuItem>
                <MenuItem value="Tropisch">Tropisch</MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
                <MenuItem value="Käse">Käse</MenuItem>
                <MenuItem value="Kaffee">Kaffee</MenuItem>
                <MenuItem value="Minze">Minze</MenuItem>
                <MenuItem value="Ammoniak">Ammoniak</MenuItem>
                <MenuItem value="Skunk">Skunk</MenuItem>
                <MenuItem value="Blumig">Blumig</MenuItem>
                
                {/* Dynamisch geladene Geschmacksrichtungen */}
                {availableFlavors
                  .filter(flavor => ![
                    'Süß', 'Sauer', 'Würzig', 'Erdig', 'Holzig', 'Kiefer', 'Zitrus', 
                    'Beeren', 'Trauben', 'Tropisch', 'Diesel', 'Käse', 'Kaffee', 
                    'Minze', 'Ammoniak', 'Skunk', 'Blumig'
                  ].includes(flavor))
                  .map(flavor => (
                    <MenuItem key={flavor} value={flavor}>{flavor}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <TextField
              label="Andere Geschmacksrichtungen (Komma-getrennt)"
              name="flavors"
              value={formData.flavors}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Geben Sie die Geschmacksrichtungen direkt ein oder wählen Sie aus dem Dropdown oben"
            />
            
            <FormControl fullWidth>
              <InputLabel>Effekte/Wirkungen</InputLabel>
              <Select
                multiple
                name="effects"
                value={formData.effects ? formData.effects.split(',').map(e => e.trim()).filter(Boolean) : []}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    effects: e.target.value.join(', ')
                  });
                }}
                input={<OutlinedInput label="Effekte/Wirkungen" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {/* Standard Effekte */}
                <MenuItem value="Entspannend">Entspannend</MenuItem>
                <MenuItem value="Aufmunternd">Aufmunternd</MenuItem>
                <MenuItem value="Kreativ">Kreativ</MenuItem>
                <MenuItem value="Energetisch">Energetisch</MenuItem>
                <MenuItem value="Fokussiert">Fokussiert</MenuItem>
                <MenuItem value="Schläfrig">Schläfrig</MenuItem>
                <MenuItem value="Euphorisch">Euphorisch</MenuItem>
                <MenuItem value="Glücklich">Glücklich</MenuItem>
                <MenuItem value="Hungrig">Hungrig</MenuItem>
                <MenuItem value="Gesprächig">Gesprächig</MenuItem>
                
                {/* Dynamisch geladene Effekte */}
                {availableEffects
                  .filter(effect => ![
                    'Entspannend', 'Aufmunternd', 'Kreativ', 'Energetisch', 'Fokussiert', 
                    'Schläfrig', 'Euphorisch', 'Glücklich', 'Hungrig', 'Gesprächig'
                  ].includes(effect))
                  .map(effect => (
                    <MenuItem key={effect} value={effect}>{effect}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <TextField
              label="Andere Effekte (Komma-getrennt)"
              name="effects"
              value={formData.effects}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Geben Sie die Effekte direkt ein oder wählen Sie aus dem Dropdown oben"
            />
          </Stack>
        </TabPanel>
        
        {/* Tab 5: Beschreibungen */}
        <TabPanel value={tabValue} index={4}>
          <Stack spacing={3}>
            <TextField
              label="Allgemeine Informationen"
              name="general_information"
              value={formData.general_information}
              onChange={handleChange}
              fullWidth
              multiline
              rows={6}
              placeholder="Geben Sie hier allgemeine Informationen zur Sorte ein..."
            />
            
            <TextField
              label="Anbauspezifische Informationen"
              name="growing_information"
              value={formData.growing_information}
              onChange={handleChange}
              fullWidth
              multiline
              rows={6}
              placeholder="Geben Sie hier anbauspezifische Informationen zur Sorte ein..."
            />
          </Stack>
        </TabPanel>
        
        {/* Tab 6: Bilder */}
        <TabPanel value={tabValue} index={5}>
          <Stack spacing={3}>
            {!initialData.id ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography>
                  Bitte speichern Sie zuerst die Sorte, bevor Sie Bilder hochladen können.
                </Typography>
              </Paper>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Neues Bild hochladen
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                    >
                      Bild auswählen
                      <VisuallyHiddenInput 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </Button>
                    
                    {selectedImage && (
                      <Typography variant="body2">
                        Ausgewählt: {selectedImage.name}
                      </Typography>
                    )}
                    
                    <TextField
                      label="Bildunterschrift"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      fullWidth
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Hauptbild?</InputLabel>
                      <Select
                        value={isPrimaryImage ? 'true' : 'false'}
                        onChange={(e) => setIsPrimaryImage(e.target.value === 'true')}
                        label="Hauptbild?"
                      >
                        <MenuItem value="true">Ja (als Hauptbild setzen)</MenuItem>
                        <MenuItem value="false">Nein</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleImageUpload}
                      disabled={!selectedImage || imageLoading}
                      fullWidth
                    >
                      {imageLoading ? <CircularProgress size={24} /> : 'Bild hochladen'}
                    </Button>
                  </Stack>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Vorhandene Bilder ({images.length})
                  </Typography>
                  
                  {images.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      Keine Bilder vorhanden
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                      {images.map((image) => (
                        <Paper 
                          key={image.id} 
                          variant="outlined"
                          sx={{ 
                            overflow: 'hidden',
                            borderColor: image.is_primary ? 'success.main' : 'divider',
                            borderWidth: image.is_primary ? 2 : 1,
                            position: 'relative'
                          }}
                        >
                          <Box 
                            component="img"
                            src={image.image}
                            alt={image.caption || "Sortenbild"}
                            sx={{ 
                              width: '100%',
                              height: '160px',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                          
                          {image.is_primary && (
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: 'success.main',
                                color: 'white',
                                py: 0.5,
                                px: 1,
                                borderBottomLeftRadius: 4,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              Hauptbild
                            </Box>
                          )}
                          
                          <Box sx={{ p: 1.5 }}>
                            {image.caption && (
                              <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                                {image.caption}
                              </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteImage(image.id)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Stack>
        </TabPanel>
        
        {/* Tab 7: Sonstiges */}
        <TabPanel value={tabValue} index={6}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
              <TextField
                label="Jahr der Markteinführung"
                name="release_year"
                type="number"
                value={formData.release_year}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 1970, max: new Date().getFullYear() }}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography component="legend" gutterBottom>Bewertung</Typography>
                <StyledRating
                  name="rating"
                  value={formData.rating}
                  precision={0.5}
                  onChange={handleRatingChange}
                  size="large"
                />
              </Box>
            </Stack>
            
            <TextField
              label="Auszeichnungen/Awards"
              name="awards"
              value={formData.awards}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Geben Sie hier Auszeichnungen und Awards ein..."
            />
          </Stack>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Abbrechen
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formValid}
          startIcon={loading && <CircularProgress size={18} color="inherit" />}
        >
          {loading ? 'Wird gespeichert...' : initialData.id ? 'Aktualisieren' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}