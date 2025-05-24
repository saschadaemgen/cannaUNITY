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
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Popover,
  Fade,
  Zoom
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import StarIcon from '@mui/icons-material/Star';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { styled } from '@mui/material/styles';
import api from '@/utils/api';
import { useDropzone } from 'react-dropzone';

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
  const [historyInfoAnchorEl, setHistoryInfoAnchorEl] = useState(null);

  // Neue States für RFID-Verifizierung
  const [scanMode, setScanMode] = useState(false);
  const [rfidLoading, setRfidLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');

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
  
  // Listen für Auswahlelemente
  const [availableTerpenes, setAvailableTerpenes] = useState([]);
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [availableEffects, setAvailableEffects] = useState([]);
  
  // Validierungsstatus
  const [formValid, setFormValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Neue State-Variablen für History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Funktion zum Starten des RFID-Scans
  const startRfidScan = async () => {
    setScanMode(true);
    setScanSuccess(false);
    setScannedMemberName('');
    await handleRfidScan();
  };

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    // Wenn ein Abbruch in Bearbeitung ist, nichts tun
    if (isAborting) return;
    
    // Abbruch-Controller erstellen
    const controller = new AbortController();
    setAbortController(controller);
    
    setRfidLoading(true);
    setScanSuccess(false);
    
    try {
      console.log("🚀 Starte RFID-Scan...");
      
      // Prüfen vor jeder API-Anfrage, ob ein Abbruch initiiert wurde
      if (isAborting) return;
      
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      });
      
      console.log("📡 Bind-Response:", bindRes.data);
      
      // Nochmals prüfen, ob ein Abbruch initiiert wurde
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;

      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name });

      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.');
      }
      
      // Nochmals prüfen vor dem nächsten API-Aufruf
      if (isAborting) return;

      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );

      const { member_id, member_name } = verifyRes.data;
      
      // Erfolg setzen und Mitgliedsnamen speichern
      setScannedMemberName(member_name);
      setScanSuccess(true);

      // 3. Nach erfolgreicher Verifizierung das Formular speichern
      await handleSubmit(member_id, member_name);
      
      // Nach 2 Sekunden das Modal schließen
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (error) {
      // AbortError ignorieren, diese sind erwartet bei Abbruch
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
        console.error('Response:', error.response);
        setApiError(error.response?.data?.detail || error.response?.data?.message || 'RFID-Verifizierung fehlgeschlagen');
      }
      
      // UI nur zurücksetzen, wenn kein Abbruch im Gange ist
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      // Loading-Status nur zurücksetzen, wenn kein Abbruch im Gange ist
      if (!isAborting) {
        setRfidLoading(false);
      }
    }
  };

  const handleCancelRfidScan = async () => {
    // Sofort den Abbruch-Status setzen, um alle neuen Anfragen zu blockieren
    setIsAborting(true);
    
    // Laufende Anfrage abbrechen, falls vorhanden
    if (abortController) {
      abortController.abort();
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/');
      console.log("RFID-Scan erfolgreich abgebrochen");
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error);
    } finally {
      setScanMode(false);
      setRfidLoading(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
      // Nach einer kurzen Verzögerung den Abbruch-Status zurücksetzen
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };

  // Funktion zum Laden der History
  const loadHistory = async (strainId) => {
    if (!strainId) return;
    
    setHistoryLoading(true);
    try {
      const res = await api.get(`/wawi/strains/${strainId}/history/`);
      // Hier die Korrektur: Prüfen, ob die Antwort paginiert ist
      setHistory(res.data.results ? res.data.results : res.data);
    } catch (error) {
      console.error('Fehler beim Laden der History:', error);
      setApiError(prev => prev ? `${prev}\nFehler beim Laden der History.` : 'Fehler beim Laden der History.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Hilfsfunktion für die HistorySection-Komponente
  const groupEditsByDate = (edits) => {
    if (!edits || !Array.isArray(edits) || edits.length === 0) return {};
    
    return edits.reduce((groups, edit) => {
      try {
        let dateStr;
        
        // Datum aus Zeitstempel extrahieren
        if (edit.timestamp) {
          if (typeof edit.timestamp === 'string') {
            if (edit.timestamp.includes('T')) {
              // ISO-Format
              dateStr = edit.timestamp.split('T')[0];
            } else if (edit.timestamp.includes(' um ')) {
              // Bereits formatiertes Datum
              dateStr = edit.timestamp.split(' um ')[0].replace('am ', '');
            } else if (edit.timestamp.includes('.')) {
              // Datum im Format TT.MM.YYYY
              dateStr = edit.timestamp;
            } else {
              // Undefiniertes Format
              dateStr = 'Unbekanntes Datum';
            }
          } else {
            // Nicht-String-Wert
            dateStr = 'Unbekanntes Datum';
          }
        } else {
          dateStr = 'Unbekanntes Datum';
        }
        
        // Gruppe für dieses Datum erstellen, falls noch nicht vorhanden
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        
        // Edit zur entsprechenden Gruppe hinzufügen
        groups[dateStr].push(edit);
        
        return groups;
      } catch (error) {
        console.error('Fehler beim Gruppieren nach Datum:', error);
        return groups;
      }
    }, {});
  };

  // Die optimierte History-Komponente mit narrativer Darstellung
  const HistorySection = () => {
    // Hilfsfunktion zum Formatieren des Zeitstempels
    const formatDateTime = (timestampStr) => {
      if (!timestampStr) return '';
      
      // Falls bereits formatiert, direkt zurückgeben
      if (typeof timestampStr === 'string' && timestampStr.includes('.') && !timestampStr.includes('T')) {
        return `am ${timestampStr}`;
      }
      
      try {
        const date = new Date(timestampStr);
        return `am ${date.toLocaleDateString('de-DE')} um ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
      } catch (e) {
        // Falls Zeitstempel im unbekannten Format vorliegt
        return `am ${timestampStr}`;
      }
    };

    // Erstellt narrativen Text für eine einzelne Änderung
    const getNarrativeForChange = (field, values, memberName, timestamp) => {
      // Feldnamen Übersetzung
      const fieldLabels = {
        name: 'den Sortennamen',
        breeder: 'den Hersteller',
        strain_type: 'den Samentyp',
        indica_percentage: 'das Indica/Sativa Verhältnis',
        genetic_origin: 'die genetische Herkunft',
        flowering_time_min: 'die minimale Blütezeit',
        flowering_time_max: 'die maximale Blütezeit',
        height_indoor_min: 'die minimale Indoor-Höhe',
        height_indoor_max: 'die maximale Indoor-Höhe',
        height_outdoor_min: 'die minimale Outdoor-Höhe',
        height_outdoor_max: 'die maximale Outdoor-Höhe',
        yield_indoor_min: 'den minimalen Indoor-Ertrag',
        yield_indoor_max: 'den maximalen Indoor-Ertrag',
        yield_outdoor_min: 'den minimalen Outdoor-Ertrag',
        yield_outdoor_max: 'den maximalen Outdoor-Ertrag',
        thc_percentage_min: 'den minimalen THC-Gehalt',
        thc_percentage_max: 'den maximalen THC-Gehalt',
        cbd_percentage_min: 'den minimalen CBD-Gehalt',
        cbd_percentage_max: 'den maximalen CBD-Gehalt',
        difficulty: 'den Schwierigkeitsgrad',
        dominant_terpenes: 'die dominanten Terpene',
        flavors: 'die Aromen',
        effects: 'die Effekte',
        growing_information: 'die Anbauinformationen',
        general_information: 'die allgemeinen Informationen',
        suitable_climate: 'das geeignete Klima',
        growing_method: 'die Anbaumethode',
        resistance_mold: 'die Schimmelresistenz',
        resistance_pests: 'die Schädlingsresistenz',
        resistance_cold: 'die Kälteresistenz',
        awards: 'die Auszeichnungen',
        release_year: 'das Erscheinungsjahr',
        rating: 'die Bewertung',
        price_per_seed: 'den Preis pro Samen',
        seeds_per_pack: 'die Anzahl der Samen pro Packung',
        is_active: 'den Status',
      };
      
      // Spezialformatierung für bestimmte Feldtypen
      let oldValueFormatted = values.old !== null && values.old !== undefined ? String(values.old) : '(leer)';
      let newValueFormatted = values.new !== null && values.new !== undefined ? String(values.new) : '(leer)';
      
      // Spezialformatierung für verschiedene Feldtypen
      switch (field) {
        case 'indica_percentage':
          oldValueFormatted = `${values.old}% Indica / ${100 - values.old}% Sativa`;
          newValueFormatted = `${values.new}% Indica / ${100 - values.new}% Sativa`;
          break;
        case 'strain_type':
          // Übersetzung der Samentypen
          const strainTypes = {
            'feminized': 'feminisiert',
            'regular': 'regulär',
            'autoflowering': 'automatisch blühend',
            'cbd': 'CBD-reich'
          };
          oldValueFormatted = strainTypes[values.old] || values.old;
          newValueFormatted = strainTypes[values.new] || values.new;
          break;
        case 'difficulty':
          // Übersetzung der Schwierigkeitsgrade
          const difficultyLevels = {
            'beginner': 'Anfänger',
            'intermediate': 'Mittel',
            'advanced': 'Fortgeschritten',
            'expert': 'Experte'
          };
          oldValueFormatted = difficultyLevels[values.old] || values.old;
          newValueFormatted = difficultyLevels[values.new] || values.new;
          break;
        case 'suitable_climate':
          // Übersetzung der Klimatypen
          const climateTypes = {
            'indoor': 'Indoor',
            'outdoor': 'Outdoor',
            'greenhouse': 'Gewächshaus',
            'all': 'Alle'
          };
          oldValueFormatted = climateTypes[values.old] || values.old;
          newValueFormatted = climateTypes[values.new] || values.new;
          break;
        case 'growing_method':
          // Übersetzung der Anbaumethoden
          const growingMethods = {
            'soil': 'Erde',
            'hydro': 'Hydrokultur',
            'coco': 'Kokos',
            'all': 'Alle'
          };
          oldValueFormatted = growingMethods[values.old] || values.old;
          newValueFormatted = growingMethods[values.new] || values.new;
          break;
        case 'is_active':
          oldValueFormatted = values.old ? 'Aktiv' : 'Inaktiv';
          newValueFormatted = values.new ? 'Aktiv' : 'Inaktiv';
          break;
        case 'rating':
          oldValueFormatted = `${values.old} Sterne`;
          newValueFormatted = `${values.new} Sterne`;
          break;
        case 'price_per_seed':
          oldValueFormatted = `${values.old}€`;
          newValueFormatted = `${values.new}€`;
          break;
      }
      
      // Narrative erstellen
      const timeStr = formatDateTime(timestamp);
      const fieldLabel = fieldLabels[field] || field;
      
      return (
        <Box 
          component="div" 
          sx={{ 
            display: 'flex',
            alignItems: 'baseline',
            mb: 0.5,
            py: 0.25,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              fontWeight: 'medium', 
              color: 'primary.main',
              minWidth: '120px'
            }}
          >
            {memberName}
          </Box>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {' änderte '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {timeStr.includes('am') ? timeStr.split('am ')[1] : timeStr}
            </Box>
            {' '}
            <Box component="span" sx={{ fontWeight: 'medium' }}>
              {fieldLabel}
            </Box>
            {' von '}
            <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
              {oldValueFormatted}
            </Box>
            {' zu '}
            <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
              {newValueFormatted}
            </Box>
            {'.'}
          </Typography>
        </Box>
      );
    };
    
    // Erstellt narrative Beschreibung für Bildaktionen
    const getNarrativeForImageAction = (edit) => {
      if (!edit || !edit.image_action) return null;
      
      const imageAction = edit.image_action;
      const memberName = edit.member_name;
      const timeStr = formatDateTime(edit.timestamp);
      const timeOnly = timeStr.includes('am') ? timeStr.split('am ')[1] : timeStr;
      const caption = edit.image_details?.caption || '';
      const oldCaption = edit.image_details?.old_caption || '';
      const newCaption = edit.image_details?.new_caption || '';
      
      // Icon je nach Aktion
      let icon;
      switch (imageAction) {
        case 'added':
          icon = <AddPhotoAlternateIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>;
          break;
        case 'removed':
          icon = <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }}/>;
          break;
        case 'set_primary':
          icon = <StarIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>;
          break;
        case 'caption_updated':
          icon = <EditIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>;
          break;
        default:
          icon = <EditIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }}/>;
      }
      
      // Narrative je nach Aktion erstellen
      const narrativeContent = (() => {
        switch (imageAction) {
          case 'added':
            return (
              <>
                {' fügte '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {timeOnly}
                </Box>
                {' ein neues Bild hinzu'}
                {caption && (
                  <>
                    {' mit der Beschreibung '}
                    <Box component="span" sx={{ color: 'success.main', fontStyle: 'italic' }}>
                      "{caption}"
                    </Box>
                  </>
                )}
                {'.'}
              </>
            );
          case 'removed':
            return (
              <>
                {' entfernte '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {timeOnly}
                </Box>
                {' ein Bild'}
                {caption && (
                  <>
                    {' mit der Beschreibung '}
                    <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                      "{caption}"
                    </Box>
                  </>
                )}
                {'.'}
              </>
            );
          case 'set_primary':
            return (
              <>
                {' legte '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {timeOnly}
                </Box>
                {' ein Bild als Hauptbild fest'}
                {caption && (
                  <>
                    {' mit der Beschreibung '}
                    <Box component="span" sx={{ color: 'success.main', fontStyle: 'italic' }}>
                      "{caption}"
                    </Box>
                  </>
                )}
                {'.'}
              </>
            );
          case 'caption_updated':
            return (
              <>
                {' änderte '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {timeOnly}
                </Box>
                {' die Bildbeschreibung von '}
                <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                  {oldCaption ? `"${oldCaption}"` : '(leer)'}
                </Box>
                {' zu '}
                <Box component="span" sx={{ color: 'success.main', fontStyle: 'italic' }}>
                  {newCaption ? `"${newCaption}"` : '(leer)'}
                </Box>
                {'.'}
              </>
            );
          default:
            return (
              <>
                {' bearbeitete '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {timeOnly}
                </Box>
                {' ein Bild.'}
              </>
            );
        }
      })();
      
      return (
        <Box 
          component="div" 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 0.5,
            py: 0.25,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'medium',
              color: 'primary.main',
              minWidth: '120px'
            }}
          >
            {icon}
            {memberName}
          </Box>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {narrativeContent}
          </Typography>
        </Box>
      );
    };
    
    // Haupt-Rendering für die Historie
    const renderHistoryContent = () => {
      // Ersteller finden
      const creator = history.find(entry => entry.action === 'created');
      
      // Bearbeitungen finden
      const edits = history
        .filter(entry => entry.action === 'updated')
        .sort((a, b) => {
          // Neueste Einträge zuerst
          try {
            return new Date(b.timestamp) - new Date(a.timestamp);
          } catch (e) {
            return 0;
          }
        });
      
      // Ersteller-Info rendern
      const creatorSection = creator ? (
        <Box sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1.5,
              p: 1,
              borderRadius: 1,
              bgcolor: 'success.light',
              color: 'success.contrastText'
            }}
          >
            <PersonIcon sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {creator.member_name} erstellte diese Sorte {formatDateTime(creator.timestamp)}
            </Typography>
          </Box>
        </Box>
      ) : null;
      
      // Gruppiere Änderungen nach Datum
      const groupedEdits = groupEditsByDate(edits);
      
      // Änderungen rendern
      const editSections = Object.entries(groupedEdits).map(([dateStr, dateEdits]) => {
        // Alle Änderungen für dieses Datum sammeln
        const allChanges = [];
        
        dateEdits.forEach(edit => {
          // Prüfen auf Bild-Aktionen
          if (edit.image_action) {
            allChanges.push({
              type: 'image',
              content: getNarrativeForImageAction(edit),
              timestamp: edit.timestamp,
              key: `img-${edit.id || Math.random()}`
            });
          }
          
          // Prüfen auf Feld-Änderungen
          if (edit.action === 'updated' && edit.changes) {
            const changeEntries = Object.entries(edit.changes);
            if (changeEntries.length === 0) return;
            
            // Für jede Änderung einen narrativen Satz erstellen
            changeEntries.forEach(([field, values]) => {
              allChanges.push({
                type: 'field',
                content: getNarrativeForChange(field, values, edit.member_name, edit.timestamp),
                timestamp: edit.timestamp,
                key: `${edit.id || Math.random()}-${field}`
              });
            });
          }
        });
        
        // Nach Zeitstempel sortieren (neueste zuerst)
        allChanges.sort((a, b) => {
          try {
            return new Date(b.timestamp) - new Date(a.timestamp);
          } catch (e) {
            return 0;
          }
        });
        
        if (allChanges.length === 0) return null;
        
        // Formatiertes Datum für die Überschrift
        const formattedDate = (() => {
          try {
            if (dateStr.includes('.')) {
              // Bereits formatiertes Datum im Format DD.MM.YYYY
              return dateStr;
            }
            
            const date = new Date(dateStr);
            return date.toLocaleDateString('de-DE', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            });
          } catch (e) {
            return dateStr;
          }
        })();
        
        // Änderungen für dieses Datum rendern
        return (
          <Box key={dateStr} sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                mt: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 0.5
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
            
            <Box sx={{ pl: 1 }}>
              {allChanges.map(change => (
                <Box key={change.key}>
                  {change.content}
                </Box>
              ))}
            </Box>
          </Box>
        );
      }).filter(Boolean); // Entfernt null-Werte
      
      if (!creatorSection && editSections.length === 0) {
        return (
          <Typography variant="body2" color="text.secondary">
            Keine Verlaufshistorie verfügbar.
          </Typography>
        );
      }
      
      return (
        <>
          {creatorSection}
          
          {editSections.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {editSections}
            </Box>
          )}
        </>
      );
    };

    // Ersteller finden für die Accordion-Überschrift
    const creator = history.find(entry => entry.action === 'created');
    const creatorInfo = creator ? (
      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
        <PersonIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'success.main' }} />
        Erstellt von: 
        <Box component="span" sx={{ ml: 0.5, fontWeight: 'medium', color: 'success.main' }}>
          {creator.member_name}
        </Box>
        <Box component="span" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.9rem' }}>
          {formatDateTime(creator.timestamp)}
        </Box>
      </Typography>
    ) : (
      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
        <PersonIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'success.main' }} />
        Keine Erstellerinformation
      </Typography>
    );

    return (
      <Accordion 
        defaultExpanded={false} 
        sx={{ 
          mt: 2, 
          mb: 2, 
          width: '100%',
          '& .MuiAccordionSummary-root': {
            borderLeft: '3px solid #4caf50'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            '&.Mui-expanded': {
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            {creatorInfo}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'success.main',
                  fontWeight: 'bold',
                  mr: 1
                }}
              >
                <HistoryIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                Verlaufshistorie
              </Typography>
              <Tooltip title="Zeigt die vollständige Änderungshistorie dieses Datensatzes an, inklusive Erstellung und nachfolgenden Bearbeitungen.">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistoryInfoAnchorEl(e.currentTarget);
                  }}
                >
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !history || history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Verlaufshistorie verfügbar.
            </Typography>
          ) : !Array.isArray(history) ? (
            <Typography variant="body2" color="text.secondary">
              Verlaufshistorie im falschen Format.
            </Typography>
          ) : (
            <Box sx={{ width: '100%' }}>
              {renderHistoryContent()}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
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
      setScanMode(false);
      setAbortController(null);
      setIsAborting(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
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
        
        // History laden
        loadHistory(data.id);
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

  const handleSubmit = async (memberId, memberName) => {
    // Nochmals validieren
    if (!validateForm()) {
      setScanMode(false);
      return;
    }
    
    setLoading(true);
    setApiError('');
    
    try {
      const data = { ...formData };
      let strainId;
      
      // Mitglied automatisch als zugeordnetes Mitglied setzen
      data.member_id = memberId;
      
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
      
      // Erfolg - aber Dialog bleibt offen für Erfolgsanzeige
      console.log("Sorte erfolgreich gespeichert!");
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setApiError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
      setScanMode(false);
      setScanSuccess(false);
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
        sx: { 
          maxHeight: '90vh',
          position: 'relative',
          overflow: scanMode ? 'hidden' : 'auto'
        }
      }}
    >
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'success.light',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1300
        }}>
          {/* Abbrechen-Button nur anzeigen, wenn wir NICHT im Erfolgs-Modus sind */}
          {!scanSuccess && (
            <Button 
              onClick={handleCancelRfidScan}
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
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                  Sorte wurde erfolgreich {initialData.id ? 'aktualisiert' : 'angelegt'}
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  Bearbeiter: {scannedMemberName}
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
              
              {rfidLoading && (
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
      )}
      
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
            </Stack>
            
            {/* Info-Box für RFID-Autorisierung */}
            {initialData.id && (
              <Box 
                sx={{ 
                  p: 2, 
                  mt: 2, 
                  mb: 2, 
                  bgcolor: 'info.light', 
                  color: 'info.contrastText',
                  borderRadius: 1,
                  width: '100%'
                }}
              >
                <Typography variant="body2">
                  <strong>Hinweis:</strong> Die Zuordnung des Mitglieds erfolgt automatisch beim Speichern per RFID-Autorisierung.
                </Typography>
              </Box>
            )}
            
            {/* Verlaufshistorie als Akkordeon mit Ersteller oben im Header */}
            {initialData.id && <HistorySection />}
            
            {/* Popover für detaillierte Info zur Historie */}
            <Popover
              open={Boolean(historyInfoAnchorEl)}
              anchorEl={historyInfoAnchorEl}
              onClose={() => setHistoryInfoAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <Box sx={{ p: 2, maxWidth: 350 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Verlaufshistorie
                </Typography>
                <Typography variant="body2">
                  Hier sehen Sie die komplette Änderungshistorie dieser Cannabis-Sorte, beginnend mit 
                  der ersten Erstellung bis hin zu allen nachfolgenden Bearbeitungen.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Jede Änderung wird mit Zeitstempel und dem verantwortlichen Mitglied protokolliert, 
                  was eine vollständige Nachverfolgbarkeit aller Aktivitäten gewährleistet.
                </Typography>
              </Box>
            </Popover>
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
                      onSetPrimary={() => handleSetPrimaryImage(image.id, 'pending')}
                      onCaptionChange={(caption) => handleUpdatePendingImageCaption(image.id, caption)}
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
                      onSetPrimary={() => handleSetPrimaryImage(image.id, 'saved')}
                      onCaptionChange={(caption) => handleUpdateImageCaption(image.id, caption)}
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
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          Abbrechen
        </Button>
        
        {/* Neuer RFID-Verifizierungs-Button */}
        {!scanMode ? (
          <Button
            onClick={startRfidScan}
            variant="contained"
            color="primary"
            disabled={loading || !formValid || rfidLoading}
            startIcon={<CreditCardIcon />}
            sx={{ minWidth: 220 }}
          >
            Per RFID autorisieren & speichern
          </Button>
        ) : (
          <Button
            onClick={handleCancelRfidScan}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{ minWidth: 220 }}
          >
            Scan abbrechen
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}