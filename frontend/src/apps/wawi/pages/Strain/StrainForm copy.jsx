// frontend/src/apps/wawi/pages/Strain/StrainForm.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
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
import PersonIcon from '@mui/icons-material/Person';
import { styled } from '@mui/material/styles';
import api from '@/utils/api';
import { useDropzone } from 'react-dropzone';
import RFIDAuthenticator from '@/components/RFIDAuthenticator';

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

// Benutzerdefinierter Slider mit Markierungen unter dem Slider
const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-markLabel': {
    top: '26px', // Positioniere die Markierungen unter dem Slider
    fontSize: '0.75rem',
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.secondary,
    transform: 'none', // Verhindert Standard-Transformation
    whiteSpace: 'nowrap',
    '&[data-index="0"]': {
      transform: 'translateX(0%)', // Linksbündig für erste Markierung
    },
    '&[data-index="1"]': {
      transform: 'translateX(-50%)', // Mittig für mittlere Markierung
    },
    '&[data-index="2"]': {
      transform: 'translateX(-100%)', // Rechtsbündig für letzte Markierung
    }
  },
  '& .MuiSlider-track': {
    height: 6
  },
  '& .MuiSlider-rail': {
    height: 6
  },
  '& .MuiSlider-mark': {
    height: 6,
    width: 2
  }
}));

// DropZone für Drag & Drop Bilder Upload
const DropZone = styled(Box)(({ theme, isDragActive }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

// ImageCard Komponente für einheitliche Darstellung der Bilder
const ImageCard = ({ image, onRemove, onSetPrimary, onCaptionChange, isPrimary, isPending }) => {
  const [caption, setCaption] = useState(image.caption || '');
  const [isEditing, setIsEditing] = useState(false);
  
  // Caption-Änderungen mit Verzögerung übernehmen
  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };
  
  const handleCaptionSave = () => {
    onCaptionChange(caption);
    setIsEditing(false);
  };
  
  return (
    <Paper 
      variant="outlined"
      sx={{ 
        overflow: 'hidden',
        borderColor: isPrimary ? 'success.main' : 'divider',
        borderWidth: isPrimary ? 2 : 1,
        position: 'relative'
      }}
    >
      <Box 
        component="img"
        src={isPending ? image.preview : image.image}
        alt={image.caption || "Bild"}
        sx={{ 
          width: '100%',
          height: '160px',
          objectFit: 'cover',
          display: 'block'
        }}
        onClick={() => setIsEditing(true)}
      />
      
      {isPrimary && (
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
      
      {isPending && image.uploading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}
      
      <Box sx={{ p: 1.5 }}>
        {isEditing ? (
          <TextField
            fullWidth
            size="small"
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Bildunterschrift"
            onBlur={handleCaptionSave}
            onKeyPress={(e) => e.key === 'Enter' && handleCaptionSave()}
            autoFocus
            sx={{ mb: 1 }}
          />
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1.5, 
              fontStyle: 'italic',
              height: '40px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              cursor: 'pointer'
            }}
            onClick={() => setIsEditing(true)}
          >
            {caption || <Box component="span" sx={{ color: 'text.disabled' }}>Klicken zum Hinzufügen einer Bildunterschrift</Box>}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            size="small" 
            onClick={onSetPrimary} 
            color="success"
            disabled={isPrimary}
            variant="text"
          >
            Als Hauptbild
          </Button>
          <IconButton 
            color="error" 
            onClick={onRemove}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

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
  const imageUploadRef = useRef(null);
  const tempIdRef = useRef(`temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

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
  const [pendingImages, setPendingImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);
  const [showRFIDAuth, setShowRFIDAuth] = useState(false);
  const [memberName, setMemberName] = useState('');
  
  // Listen für Auswahlelemente
  const [availableTerpenes, setAvailableTerpenes] = useState([]);
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [availableEffects, setAvailableEffects] = useState([]);
  
  // Validierungsstatus
  const [formValid, setFormValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Handler für erfolgreiche Authentifizierung
  const handleMemberAuthenticated = (memberId, name) => {
    // Mitglieds-ID im Formular-State aktualisieren
    setFormData(prev => ({
      ...prev,
      member_id: memberId
    }));
    
    // Name für die Anzeige speichern
    setMemberName(name);
    
    // RFID-Dialog schließen
    setShowRFIDAuth(false);
  };

  // Drag & Drop-Funktionalität für den Bildupload
  const onDrop = useCallback((acceptedFiles) => {
    // Dateien in das richtige Format konvertieren und Vorschau-URLs erstellen
    const newImages = acceptedFiles.map(file => ({
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file: file,
      preview: URL.createObjectURL(file),
      caption: '',
      is_primary: pendingImages.length === 0 && images.length === 0, // Erstes Bild automatisch als Hauptbild
      uploading: false,
      error: null
    }));
    
    // Zur Liste der ausstehenden Bilder hinzufügen
    setPendingImages(prev => [...prev, ...newImages]);
  }, [pendingImages, images]);

  // Hook für Drag & Drop-Funktionalität
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': []},
    multiple: true
  });

  // Bildunterschrift einer ausstehenden Datei aktualisieren
  const handleUpdatePendingImageCaption = (imageId, newCaption) => {
    setPendingImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, caption: newCaption } : img
      )
    );
  };

  // Bildunterschrift einer gespeicherten Datei aktualisieren (via API)
  const handleUpdateImageCaption = async (imageId, newCaption) => {
    if (!initialData.id) return;
    
    try {
      // Lokalen Zustand aktualisieren
      setImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, caption: newCaption } : img
        )
      );
      
      // API-Aufruf zum Aktualisieren auf dem Server
      await api.patch(`/wawi/strains/${initialData.id}/update_image_caption/`, {
        image_id: imageId,
        caption: newCaption
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bildunterschrift:', error);
      setApiError('Fehler beim Aktualisieren der Bildunterschrift');
    }
  };

  // Hauptbild festlegen (für beide Bild-Typen)
  const handleSetPrimaryImage = (imageId, type) => {
    // Typ 'pending' für neue Bilder, 'saved' für bereits gespeicherte
    if (type === 'pending') {
      // Alle pendingImages aktualisieren
      setPendingImages(prev => 
        prev.map(img => ({ ...img, is_primary: img.id === imageId }))
      );
      
      // Auch alle gespeicherten Bilder als nicht-primär markieren
      setImages(prev => 
        prev.map(img => ({ ...img, is_primary: false }))
      );
    } else if (type === 'saved' && initialData.id) {
      // Lokalen Zustand aktualisieren
      setImages(prev => 
        prev.map(img => ({ ...img, is_primary: img.id === imageId }))
      );
      
      // Auch alle pendingImages als nicht-primär markieren
      setPendingImages(prev => 
        prev.map(img => ({ ...img, is_primary: false }))
      );
      
      // API-Aufruf für gespeicherte Bilder
      (async () => {
        try {
          await api.patch(`/wawi/strains/${initialData.id}/set_primary_image/`, {
            image_id: imageId
          });
        } catch (error) {
          console.error('Fehler beim Setzen des Hauptbildes:', error);
          setApiError('Fehler beim Setzen des Hauptbildes');
        }
      })();
    }
  };

  useEffect(() => {
    if (open) {
      // Fehler zurücksetzen beim Öffnen
      setApiError('');
      
      // Wenn Formulardaten bereitgestellt werden (für Bearbeitungsfall)
      if (initialData.id) {
        const data = {...initialData};
        
        // Name des bereits ausgewählten Mitglieds setzen
        if (data.member && typeof data.member === 'object') {
          setMemberName(`${data.member.first_name} ${data.member.last_name}`);
          data.member_id = data.member.id;
        } else if (data.member_id) {
          const member = members.find(m => m.id === data.member_id);
          if (member) {
            setMemberName(`${member.first_name} ${member.last_name}`);
          }
        }
        
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
        
        // Beim Erstellen: Bilder zurücksetzen
        setImages([]);
        setPendingImages([]);
      }
      
      // Lade verfügbare Terpene, Geschmacksrichtungen und Effekte
      loadTerpenes();
      loadFlavors();
      loadEffects();
      
      // Formular validieren
      validateForm();
    }
  }, [open, initialData, members]);
  
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

  // Handler für direkte Wertänderung (für Slider-Komponente)
  const handleDirectValueChange = (name, value) => {
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
  
  const handleAddPendingImage = () => {
    if (!selectedImage) return;
    
    // Erstelle eine URL für die Vorschau
    const imagePreviewUrl = URL.createObjectURL(selectedImage);
    
    // Füge das Bild zur Liste der ausstehenden Bilder hinzu
    const newPendingImage = {
      id: `pending-${Date.now()}-${pendingImages.length}`,
      file: selectedImage,
      preview: imagePreviewUrl,
      caption: imageCaption,
      is_primary: isPrimaryImage
    };
    
    // Wenn dieses Bild als Hauptbild markiert ist, andere Hauptbilder zurücksetzen
    if (isPrimaryImage) {
      setPendingImages(prev => prev.map(img => ({
        ...img,
        is_primary: false
      })));
      
      // Wenn wir einen bestehenden Datensatz bearbeiten, markiere auch dort die Hauptbilder als nicht primär
      if (initialData.id) {
        setImages(prev => prev.map(img => ({
          ...img,
          is_primary: false
        })));
      }
    }
    
    setPendingImages(prev => [...prev, newPendingImage]);
    
    // Zurücksetzen
    setSelectedImage(null);
    setImageCaption('');
    setIsPrimaryImage(false);
    
    // Input-Feld zurücksetzen
    if (imageUploadRef.current) {
      imageUploadRef.current.value = '';
    }
  };
  
  const handleRemovePendingImage = (imageId) => {
    setPendingImages(prev => prev.filter(img => img.id !== imageId));
  };
  
  const handleSetPrimaryPendingImage = (imageId) => {
    // Setze alle Bilder auf nicht-primär
    setPendingImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })));
    
    // Wenn wir einen bestehenden Datensatz bearbeiten, markiere auch dort die Hauptbilder als nicht primär
    if (initialData.id) {
      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: false
      })));
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
      
      // Input-Feld zurücksetzen
      if (imageUploadRef.current) {
        imageUploadRef.current.value = '';
      }
      
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
  
  const uploadPendingImages = async (strainId) => {
    if (pendingImages.length === 0) return;
    
    const uploads = pendingImages.map(async (pendingImage) => {
      const formData = new FormData();
      formData.append('image', pendingImage.file);
      formData.append('caption', pendingImage.caption || '');
      formData.append('is_primary', pendingImage.is_primary ? 'true' : 'false');
      
      try {
        await api.post(`/wawi/strains/${strainId}/upload_image/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (error) {
        console.error('Fehler beim Hochladen des Bildes:', error);
        setApiError(prev => prev + '\nFehler beim Hochladen des Bildes: ' + pendingImage.file.name);
      }
    });
    
    await Promise.all(uploads);
    setPendingImages([]);
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
      let strainId;
      
      // Bei Bearbeitung eines bestehenden Datensatzes
      if (initialData.id) {
        const response = await api.patch(`/wawi/strains/${initialData.id}/`, data);
        strainId = initialData.id;
      } else {
        // Bei Erstellung eines neuen Datensatzes
        const response = await api.post('/wawi/strains/', data);
        strainId = response.data.id;
      }
      
      // Ausstehende Bilder hochladen, wenn vorhanden
      if (pendingImages.length > 0) {
        await uploadPendingImages(strainId);
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
          <Tab label="GRUNDDATEN" />
          <Tab label="WACHSTUM" />
          <Tab label="CANNABINOIDE & TERPENE" />
          <Tab label="AROMA & WIRKUNG" />
          <Tab label="BESCHREIBUNGEN" />
          <Tab label="BILDER" />
          <Tab label="SONSTIGES" />
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
            
            {/* Verbesserter Indica/Sativa-Slider mit Markierungen unter dem Slider */}
            <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
              <Typography gutterBottom>
                Indica/Sativa Verhältnis: {formData.indica_percentage}% Indica / {sativaPercentage}% Sativa
              </Typography>
              
              <Box sx={{ mt: 1, mb: 3, width: '100%' }}>
                <StyledSlider
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
              </Box>
              
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
              
              <Box sx={{ mt: 2, mb: 3, width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Zugeordnetes Mitglied:
                </Typography>
                
                {formData.member_id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography>{memberName || members.find(m => m.id === formData.member_id)?.display_name || 'Ausgewähltes Mitglied'}</Typography>
                    <Button 
                      size="small" 
                      sx={{ ml: 2 }}
                      onClick={() => setShowRFIDAuth(true)}
                    >
                      Ändern
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => setShowRFIDAuth(true)}
                    startIcon={<PersonIcon />}
                    sx={{ mb: 2 }}
                  >
                    Mitglied per RFID auswählen
                  </Button>
                )}
                
                {/* Verstecktes Feld für die member_id */}
                <input type="hidden" name="member_id" value={formData.member_id || ''} />
              </Box>
            </Stack>
          </Stack>
        </TabPanel>
        
        {/* Tab 2: Wachstum */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Blütezeit (Tage)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="flowering_time_min"
                  type="number"
                  value={formData.flowering_time_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 30, max: formData.flowering_time_max }}
                  error={!!errors.flowering_time_min}
                />
                
                <Slider
                  value={[formData.flowering_time_min, formData.flowering_time_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('flowering_time_min', newValue[0]);
                    handleDirectValueChange('flowering_time_max', newValue[1]);
                  }}
                  min={30}
                  max={120}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value} Tage`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="flowering_time_max"
                  type="number"
                  value={formData.flowering_time_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.flowering_time_min, max: 120 }}
                  error={!!errors.flowering_time_max}
                />
              </Stack>
              {(errors.flowering_time_min || errors.flowering_time_max) && (
                <FormHelperText error>
                  {errors.flowering_time_min || errors.flowering_time_max}
                </FormHelperText>
              )}
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
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
            
            <Divider>Indoor-Wachstum</Divider>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Höhe Indoor (cm)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="height_indoor_min"
                  type="number"
                  value={formData.height_indoor_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 20, max: formData.height_indoor_max, step: 5 }}
                  error={!!errors.height_indoor_min}
                />
                
                <Slider
                  value={[formData.height_indoor_min, formData.height_indoor_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('height_indoor_min', newValue[0]);
                    handleDirectValueChange('height_indoor_max', newValue[1]);
                  }}
                  min={20}
                  max={400}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value} cm`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="height_indoor_max"
                  type="number"
                  value={formData.height_indoor_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.height_indoor_min, max: 400, step: 5 }}
                  error={!!errors.height_indoor_max}
                />
              </Stack>
              {(errors.height_indoor_min || errors.height_indoor_max) && (
                <FormHelperText error>
                  {errors.height_indoor_min || errors.height_indoor_max}
                </FormHelperText>
              )}
            </Box>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Ertrag Indoor (g/m²)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="yield_indoor_min"
                  type="number"
                  value={formData.yield_indoor_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 50, max: formData.yield_indoor_max, step: 10 }}
                  error={!!errors.yield_indoor_min}
                />
                
                <Slider
                  value={[formData.yield_indoor_min, formData.yield_indoor_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('yield_indoor_min', newValue[0]);
                    handleDirectValueChange('yield_indoor_max', newValue[1]);
                  }}
                  min={50}
                  max={1000}
                  step={10}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value} g/m²`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="yield_indoor_max"
                  type="number"
                  value={formData.yield_indoor_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.yield_indoor_min, max: 1000, step: 10 }}
                  error={!!errors.yield_indoor_max}
                />
              </Stack>
              {(errors.yield_indoor_min || errors.yield_indoor_max) && (
                <FormHelperText error>
                  {errors.yield_indoor_min || errors.yield_indoor_max}
                </FormHelperText>
              )}
            </Box>
            
            <Divider>Outdoor-Wachstum</Divider>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Höhe Outdoor (cm)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="height_outdoor_min"
                  type="number"
                  value={formData.height_outdoor_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 50, max: formData.height_outdoor_max, step: 10 }}
                  error={!!errors.height_outdoor_min}
                />
                
                <Slider
                  value={[formData.height_outdoor_min, formData.height_outdoor_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('height_outdoor_min', newValue[0]);
                    handleDirectValueChange('height_outdoor_max', newValue[1]);
                  }}
                  min={50}
                  max={500}
                  step={10}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value} cm`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="height_outdoor_max"
                  type="number"
                  value={formData.height_outdoor_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.height_outdoor_min, max: 500, step: 10 }}
                  error={!!errors.height_outdoor_max}
                />
              </Stack>
              {(errors.height_outdoor_min || errors.height_outdoor_max) && (
                <FormHelperText error>
                  {errors.height_outdoor_min || errors.height_outdoor_max}
                </FormHelperText>
              )}
            </Box>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Ertrag Outdoor (g/Pflanze)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="yield_outdoor_min"
                  type="number"
                  value={formData.yield_outdoor_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 50, max: formData.yield_outdoor_max, step: 50 }}
                  error={!!errors.yield_outdoor_min}
                />
                
                <Slider
                  value={[formData.yield_outdoor_min, formData.yield_outdoor_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('yield_outdoor_min', newValue[0]);
                    handleDirectValueChange('yield_outdoor_max', newValue[1]);
                  }}
                  min={50}
                  max={2000}
                  step={50}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value} g/Pflanze`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="yield_outdoor_max"
                  type="number"
                  value={formData.yield_outdoor_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.yield_outdoor_min, max: 2000, step: 50 }}
                  error={!!errors.yield_outdoor_max}
                />
              </Stack>
              {(errors.yield_outdoor_min || errors.yield_outdoor_max) && (
                <FormHelperText error>
                  {errors.yield_outdoor_min || errors.yield_outdoor_max}
                </FormHelperText>
              )}
            </Box>
            
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
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>THC-Gehalt (%)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="thc_percentage_min"
                  type="number"
                  value={formData.thc_percentage_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 0, max: formData.thc_percentage_max, step: 0.1 }}
                  error={!!errors.thc_percentage_min}
                />
                
                <Slider
                  value={[formData.thc_percentage_min, formData.thc_percentage_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('thc_percentage_min', newValue[0]);
                    handleDirectValueChange('thc_percentage_max', newValue[1]);
                  }}
                  min={0}
                  max={35}
                  step={0.1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="thc_percentage_max"
                  type="number"
                  value={formData.thc_percentage_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.thc_percentage_min, max: 35, step: 0.1 }}
                  error={!!errors.thc_percentage_max}
                />
              </Stack>
              {(errors.thc_percentage_min || errors.thc_percentage_max) && (
                <FormHelperText error>
                  {errors.thc_percentage_min || errors.thc_percentage_max}
                </FormHelperText>
              )}
            </Box>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>CBD-Gehalt (%)</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Minimum"
                  name="cbd_percentage_min"
                  type="number"
                  value={formData.cbd_percentage_min}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: 0, max: formData.cbd_percentage_max, step: 0.1 }}
                  error={!!errors.cbd_percentage_min}
                />
                
                <Slider
                  value={[formData.cbd_percentage_min, formData.cbd_percentage_max]}
                  onChange={(e, newValue) => {
                    handleDirectValueChange('cbd_percentage_min', newValue[0]);
                    handleDirectValueChange('cbd_percentage_max', newValue[1]);
                  }}
                  min={0}
                  max={25}
                  step={0.1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ mx: 2, flexGrow: 1 }}
                />
                
                <TextField
                  label="Maximum"
                  name="cbd_percentage_max"
                  type="number"
                  value={formData.cbd_percentage_max}
                  onChange={handleChange}
                  size="small"
                  sx={{ width: '120px' }}
                  inputProps={{ min: formData.cbd_percentage_min, max: 25, step: 0.1 }}
                  error={!!errors.cbd_percentage_max}
                />
              </Stack>
              {(errors.cbd_percentage_min || errors.cbd_percentage_max) && (
                <FormHelperText error>
                  {errors.cbd_percentage_min || errors.cbd_percentage_max}
                </FormHelperText>
              )}
            </Box>
            
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
        
        {/* Tab 6: Bilder mit optimiertem Drag & Drop-Upload */}
        <TabPanel value={tabValue} index={5}>
          <Stack spacing={3}>
            {/* Drag & Drop Upload-Bereich */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Bilder hochladen
              </Typography>
              
              {/* Implementierung des Drag & Drop-Bereichs mit react-dropzone */}
              <Box>
                <DropZone {...getRootProps()} isDragActive={isDragActive}>
                  <input {...getInputProps()} />
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                  {isDragActive ? (
                    <Typography>Bilder hier ablegen...</Typography>
                  ) : (
                    <>
                      <Typography>Bilder hier ablegen oder</Typography>
                      <Button variant="contained" size="small" sx={{ mt: 1 }}>
                        Dateien auswählen
                      </Button>
                    </>
                  )}
                </DropZone>
              </Box>
            </Paper>
            
            {/* Galerie mit hochgeladenen Bildern */}
            {(pendingImages.length > 0 || images.length > 0) && (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Bilder ({pendingImages.length + images.length})
                  </Typography>
                  {pendingImages.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Änderungen werden beim Speichern übernommen
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
                  gap: 2 
                }}>
                  {/* Ausstehende (neue) Bilder */}
                  {pendingImages.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onRemove={() => handleRemovePendingImage(image.id)}
                      onSetPrimary={() => handleSetPrimaryPendingImage(image.id)}
                      onCaptionChange={(caption) => {
                        // Bildunterschrift aktualisieren
                        setPendingImages(prev => 
                          prev.map(img => 
                            img.id === image.id ? { ...img, caption: caption } : img
                          )
                        );
                      }}
                      isPrimary={image.is_primary}
                      isPending={true}
                    />
                  ))}
                  
                  {/* Bereits gespeicherte Bilder */}
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onRemove={() => handleDeleteImage(image.id)}
                      onSetPrimary={() => {
                        // Setze das Bild als Hauptbild
                        // Alle gespeicherten Bilder aktualisieren
                        setImages(prev => 
                          prev.map(img => ({ ...img, is_primary: img.id === image.id }))
                        );
                        
                        // Alle ausstehenden Bilder als nicht-primär markieren
                        setPendingImages(prev => 
                          prev.map(img => ({ ...img, is_primary: false }))
                        );
                        
                        // API-Aufruf zum Aktualisieren auf dem Server
                        if (initialData.id) {
                          (async () => {
                            try {
                              // Diese Funktion müsste in der API implementiert sein,
                              // hier ist sie nur als Beispiel angegeben
                              await api.patch(`/wawi/strains/${initialData.id}/set_primary_image/`, {
                                image_id: image.id
                              });
                            } catch (error) {
                              console.error('Fehler beim Setzen des Hauptbildes:', error);
                              setApiError('Fehler beim Setzen des Hauptbildes');
                            }
                          })();
                        }
                      }}
                      onCaptionChange={(caption) => {
                        // Bildunterschrift aktualisieren
                        setImages(prev => 
                          prev.map(img => 
                            img.id === image.id ? { ...img, caption: caption } : img
                          )
                        );
                        
                        // API-Aufruf zum Aktualisieren auf dem Server
                        if (initialData.id) {
                          (async () => {
                            try {
                              // Diese Funktion müsste in der API implementiert sein,
                              // hier ist sie nur als Beispiel angegeben
                              await api.patch(`/wawi/strains/${initialData.id}/update_image_caption/`, {
                                image_id: image.id,
                                caption: caption
                              });
                            } catch (error) {
                              console.error('Fehler beim Aktualisieren der Bildunterschrift:', error);
                              setApiError('Fehler beim Aktualisieren der Bildunterschrift');
                            }
                          })();
                        }
                      }}
                      isPrimary={image.is_primary}
                      isPending={false}
                    />
                  ))}
                </Box>
              </Paper>
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
      
      {/* RFID Authenticator Dialog */}
      <Dialog 
        open={showRFIDAuth} 
        onClose={() => setShowRFIDAuth(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mitglied auswählen</DialogTitle>
        <DialogContent>
          <RFIDAuthenticator 
            onAuthenticated={handleMemberAuthenticated}
            targetApp="wawi_strain_form"
            autoClose={true}
          />
        </DialogContent>
      </Dialog>
      
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