// frontend/src/apps/wawi/pages/Strain/StrainForm.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Alert
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import api from '@/utils/api';

// Import Tab Components
import BasicInfoTab from './components/form-tabs/BasicInfoTab';
import GrowthTab from './components/form-tabs/GrowthTab';
import CannabinoidsTab from './components/form-tabs/CannabinoidsTab';
import AromaEffectsTab from './components/form-tabs/AromaEffectsTab';
import DescriptionsTab from './components/form-tabs/DescriptionsTab';
import ImagesTab from './components/form-tabs/ImagesTab';
import MiscTab from './components/form-tabs/MiscTab';
import PricingTab from './components/form-tabs/PricingTab';

// Import Other Components
import RFIDScanOverlay from './components/form-components/RFIDScanOverlay';

// Tab Panel Component
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
  const tempIdRef = useRef(`temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

  // States for RFID verification
  const [scanMode, setScanMode] = useState(false);
  const [rfidLoading, setRfidLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');

  // Form data state
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
    member_id: '',
    is_active: true
  });

  // Price tiers state
  const [priceTiers, setPriceTiers] = useState([]);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  
  // Lists for select elements
  const [availableTerpenes, setAvailableTerpenes] = useState([]);
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [availableEffects, setAvailableEffects] = useState([]);
  
  // Validation state
  const [formValid, setFormValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // RFID Functions
  const startRfidScan = async () => {
    setScanMode(true);
    setScanSuccess(false);
    setScannedMemberName('');
    await handleRfidScan();
  };

  const handleRfidScan = async () => {
    if (isAborting) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    
    setRfidLoading(true);
    setScanSuccess(false);
    
    try {
      console.log("🚀 Starte RFID-Scan...");
      
      if (isAborting) return;
      
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      });
      
      console.log("📡 Bind-Response:", bindRes.data);
      
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;

      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name });

      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.');
      }
      
      if (isAborting) return;

      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );

      const { member_id, member_name } = verifyRes.data;
      
      setScannedMemberName(member_name);
      setScanSuccess(true);

      await handleSubmit(member_id, member_name);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
        console.error('Response:', error.response);
        setApiError(error.response?.data?.detail || error.response?.data?.message || 'RFID-Verifizierung fehlgeschlagen');
      }
      
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      if (!isAborting) {
        setRfidLoading(false);
      }
    }
  };

  const handleCancelRfidScan = async () => {
    setIsAborting(true);
    
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
      
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };

  // Load functions
  const loadHistory = async (strainId) => {
    if (!strainId) return;
    
    setHistoryLoading(true);
    try {
      const res = await api.get(`/wawi/strains/${strainId}/history/`);
      setHistory(res.data.results ? res.data.results : res.data);
    } catch (error) {
      console.error('Fehler beim Laden der History:', error);
      setApiError(prev => prev ? `${prev}\nFehler beim Laden der History.` : 'Fehler beim Laden der History.');
    } finally {
      setHistoryLoading(false);
    }
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

  const loadPriceTiers = async (strainId) => {
    try {
      const res = await api.get(`/wawi/strains/${strainId}/price_tiers/`);
      if (res.data && res.data.length > 0) {
        setPriceTiers(res.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Preisstaffeln:', error);
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

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  // Image handlers
  const handleUpdateImageCaption = async (imageId, newCaption) => {
    if (!initialData.id) return;
    
    try {
      setImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, caption: newCaption } : img
        )
      );
      
      await api.patch(`/wawi/strains/${initialData.id}/update_image_caption/`, {
        image_id: imageId,
        caption: newCaption
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bildunterschrift:', error);
      setApiError('Fehler beim Aktualisieren der Bildunterschrift');
    }
  };

  const handleSetPrimaryImage = (imageId, type) => {
    if (type === 'saved' && initialData.id) {
      setImages(prev => 
        prev.map(img => ({ ...img, is_primary: img.id === imageId }))
      );
      
      setPendingImages(prev => 
        prev.map(img => ({ ...img, is_primary: false }))
      );
      
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

  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`/wawi/strains/${initialData.id}/remove_image/?image_id=${imageId}`);
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

  // Validation
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    if (!formData.name) {
      newErrors.name = 'Sortenname ist erforderlich';
      isValid = false;
    }
    
    if (!formData.breeder) {
      newErrors.breeder = 'Hersteller/Züchter ist erforderlich';
      isValid = false;
    }
    
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

    // Validate price tiers
    if (priceTiers.length === 0) {
      newErrors.priceTiers = 'Mindestens eine Preisstaffel ist erforderlich';
      isValid = false;
    }
    
    setErrors(newErrors);
    setFormValid(isValid);
    
    return isValid;
  };

  // Submit handler
  const handleSubmit = async (memberId, memberName) => {
    if (!validateForm()) {
      setScanMode(false);
      return;
    }
    
    setLoading(true);
    setApiError('');
    
    try {
      const data = { ...formData };
      let strainId;
      
      data.member_id = memberId;
      
      if (initialData.id) {
        const response = await api.patch(`/wawi/strains/${initialData.id}/`, data);
        strainId = initialData.id;
      } else {
        const response = await api.post('/wawi/strains/', data);
        strainId = response.data.id;
      }
      
      if (pendingImages.length > 0) {
        await uploadPendingImages(strainId);
      }

      // Save price tiers
      // TODO: Implement price tier API calls here
      
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

  // Effects
  useEffect(() => {
    if (open) {
      setApiError('');
      setScanMode(false);
      setAbortController(null);
      setIsAborting(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
      if (initialData.id) {
        const data = {...initialData};
        
        if (data.member && typeof data.member === 'object') {
          data.member_id = data.member.id;
        }
        
        const numericFields = [
          'indica_percentage', 'flowering_time_min', 'flowering_time_max',
          'height_indoor_min', 'height_indoor_max', 'height_outdoor_min', 'height_outdoor_max',
          'yield_indoor_min', 'yield_indoor_max', 'yield_outdoor_min', 'yield_outdoor_max',
          'thc_percentage_min', 'thc_percentage_max', 'cbd_percentage_min', 'cbd_percentage_max',
          'resistance_mold', 'resistance_pests', 'resistance_cold',
          'release_year', 'rating'
        ];
        
        numericFields.forEach(field => {
          if (data[field] !== undefined && data[field] !== null) {
            data[field] = Number(data[field]);
          }
        });
        
        setFormData(data);
        loadImages(data.id);
        loadHistory(data.id);
        
        // Preisstaffeln laden
        if (data.id) {
          loadPriceTiers(data.id);
        }
      } else {
        // Reset for new entry
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
          member_id: '',
          is_active: true
        });
        
        setImages([]);
        setPendingImages([]);
        setPriceTiers([]);
      }
      
      loadTerpenes();
      loadFlavors();
      loadEffects();
      validateForm();
    }
  }, [open, initialData]);
  
  useEffect(() => {
    validateForm();
  }, [formData, priceTiers]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { 
          maxHeight: '90vh',
          position: 'relative',
          overflow: scanMode ? 'hidden' : 'auto'
        }
      }}
    >
      <RFIDScanOverlay 
        scanMode={scanMode}
        scanSuccess={scanSuccess}
        scannedMemberName={scannedMemberName}
        rfidLoading={rfidLoading}
        onCancel={handleCancelRfidScan}
        isEdit={!!initialData.id}
      />
      
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
          <Tab label="PREISE" />
          <Tab label="SONSTIGES" />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <BasicInfoTab 
            formData={formData}
            handleChange={handleChange}
            handleSliderChange={handleSliderChange}
            errors={errors}
            initialData={initialData}
            history={history}
            historyLoading={historyLoading}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <GrowthTab 
            formData={formData}
            handleChange={handleChange}
            handleDirectValueChange={handleDirectValueChange}
            handleSliderChange={handleSliderChange}
            errors={errors}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <CannabinoidsTab 
            formData={formData}
            handleChange={handleChange}
            handleDirectValueChange={handleDirectValueChange}
            errors={errors}
            availableTerpenes={availableTerpenes}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <AromaEffectsTab 
            formData={formData}
            handleChange={handleChange}
            handleDirectValueChange={handleDirectValueChange}
            availableFlavors={availableFlavors}
            availableEffects={availableEffects}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <DescriptionsTab 
            formData={formData}
            handleChange={handleChange}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <ImagesTab 
            images={images}
            pendingImages={pendingImages}
            onImagesChange={setImages}
            onPendingImagesChange={setPendingImages}
            onDeleteImage={handleDeleteImage}
            onSetPrimaryImage={handleSetPrimaryImage}
            onUpdateImageCaption={handleUpdateImageCaption}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={6}>
          <PricingTab 
            priceTiers={priceTiers}
            onPriceTiersChange={setPriceTiers}
            initialData={initialData}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={7}>
          <MiscTab 
            formData={formData}
            handleChange={handleChange}
            handleRatingChange={handleRatingChange}
          />
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