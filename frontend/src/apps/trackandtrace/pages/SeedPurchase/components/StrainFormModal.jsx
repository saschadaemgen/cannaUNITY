// frontend/src/apps/trackandtrace/pages/SeedPurchase/components/StrainFormModal.jsx
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
  Grid,
  Typography,
  Box,
  Divider,
  IconButton,
  Chip,
  Paper,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import api from '@/utils/api'

export default function StrainFormModal({ open, onClose, onSave, initialName = '', initialBreeder = '' }) {
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    // Basis-Informationen
    name: initialName,
    breeder: initialBreeder,
    batch_number: '',
    
    // Genetik-Informationen
    strain_type: 'feminized',
    indica_percentage: 50,
    genetic_origin: '',
    
    // Wachstums-Eigenschaften
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
    
    // Chemische Eigenschaften
    thc_percentage_min: 10,
    thc_percentage_max: 20,
    cbd_percentage_min: 0.1,
    cbd_percentage_max: 1.0,
    
    // Terpene und sensorische Eigenschaften
    dominant_terpenes: '',
    flavors: '',
    effects: '',
    
    // Ausführliche Beschreibungen
    general_information: '',
    growing_information: '',
    
    // Erweiterte Informationen
    suitable_climate: 'all',
    growing_method: 'all',
    resistance_mold: 3,
    resistance_pests: 3,
    resistance_cold: 3,
    
    // Zusatzinformationen
    awards: '',
    release_year: null,
    rating: 4.0,
    
    // Preisinformationen
    price_per_seed: null,
    seeds_per_pack: 1,
    
    // Status
    is_active: true
  })
  
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileUploading, setFileUploading] = useState(false)
  
  useEffect(() => {
    // Bei Öffnen des Modals die Initialwerte übernehmen
    if (open) {
      setFormData(prev => ({
        ...prev,
        name: initialName || prev.name,
        breeder: initialBreeder || prev.breeder
      }))
    }
  }, [open, initialName, initialBreeder])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }
  
  const handleSliderChange = (name) => (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }
  
  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('is_primary', uploadedImages.length === 0) // Erstes Bild ist standardmäßig primär
    
    setFileUploading(true)
    
    try {
      // Diesen Endpunkt müssten wir normalerweise nach der Erstellung der Sorte aufrufen,
      // hier machen wir es erstmal so, als ob wir das Bild hochladen würden
      /*
      const response = await api.post(
        `/wawi/strains/${strainId}/upload_image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      */
      
      // Simulierter Upload für das UI
      setTimeout(() => {
        setUploadedImages([
          ...uploadedImages,
          {
            id: Date.now(),
            preview: URL.createObjectURL(selectedFile),
            file: selectedFile,
            is_primary: uploadedImages.length === 0
          }
        ])
        setSelectedFile(null)
        setFileUploading(false)
      }, 500)
      
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error)
      alert('Fehler beim Hochladen des Bildes')
      setFileUploading(false)
    }
  }
  
  const handleRemoveImage = (imageId) => {
    const newImages = uploadedImages.filter(img => img.id !== imageId)
    
    // Wenn das primäre Bild entfernt wurde und es noch andere Bilder gibt,
    // machen wir das erste Bild zum primären
    if (uploadedImages.find(img => img.id === imageId)?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    setUploadedImages(newImages)
  }
  
  const handleSetPrimaryImage = (imageId) => {
    setUploadedImages(prev => 
      prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
    )
  }
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }
  
  const handleSubmit = async () => {
    setLoading(true)
    
    // Minimal erforderliche Felder validieren
    if (!formData.name || !formData.breeder) {
      alert('Bitte geben Sie mindestens den Sortennamen und Züchter ein')
      setLoading(false)
      return
    }
    
    try {
      // 1. Zuerst die Sorte anlegen
      const strainResponse = await api.post('/wawi/strains/', formData)
      const newStrain = strainResponse.data
      
      // 2. Dann die Bilder für diese Sorte hochladen
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          const imageFormData = new FormData()
          imageFormData.append('image', image.file)
          imageFormData.append('is_primary', image.is_primary)
          
          try {
            await api.post(
              `/wawi/strains/${newStrain.id}/upload_image/`,
              imageFormData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            )
          } catch (imageError) {
            console.error('Fehler beim Hochladen des Bildes:', imageError)
            // Wir setzen hier fort, auch wenn ein Bild nicht hochgeladen werden konnte
          }
        }
      }
      
      // 3. Erfolg an das übergeordnete Formular melden
      onSave(newStrain)
      
    } catch (error) {
      console.error('Fehler beim Speichern der Sorte:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist beim Erstellen der Sorte aufgetreten')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Neue Cannabis-Sorte anlegen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bitte füllen Sie die erforderlichen Felder aus, um eine neue Sorte zu erstellen.
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="strain form tabs">
          <Tab label="Basisinformationen" />
          <Tab label="Wachstum & Ertrag" />
          <Tab label="Chemie & Sensorik" />
          <Tab label="Beschreibungen" />
          <Tab label="Bilder" />
          <Tab label="Weitere Infos" />
        </Tabs>
      </Box>
      
      <DialogContent>
        {/* Tab 1: Basisinformationen */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Sortenname"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="breeder"
                label="Hersteller/Züchter"
                value={formData.breeder}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="indica_percentage"
                label="Indica-Anteil (%)"
                type="number"
                value={formData.indica_percentage}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                helperText={`Sativa-Anteil: ${100 - formData.indica_percentage}%`}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="genetic_origin"
                label="Genetische Herkunft"
                value={formData.genetic_origin}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleSwitchChange}
                  />
                }
                label="Aktiv"
              />
            </Grid>
          </Grid>
        )}
        
        {/* Tab 2: Wachstum & Ertrag */}
        {activeTab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Blütezeit (Tage)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="flowering_time_min"
                    label="Minimum"
                    type="number"
                    value={formData.flowering_time_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 150 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="flowering_time_max"
                    label="Maximum"
                    type="number"
                    value={formData.flowering_time_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 150 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Höhe Indoor (cm)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="height_indoor_min"
                    label="Minimum"
                    type="number"
                    value={formData.height_indoor_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 300 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="height_indoor_max"
                    label="Maximum"
                    type="number"
                    value={formData.height_indoor_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 300 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Höhe Outdoor (cm)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="height_outdoor_min"
                    label="Minimum"
                    type="number"
                    value={formData.height_outdoor_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 500 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="height_outdoor_max"
                    label="Maximum"
                    type="number"
                    value={formData.height_outdoor_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 20, max: 500 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Ertrag Indoor (g/m²)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="yield_indoor_min"
                    label="Minimum"
                    type="number"
                    value={formData.yield_indoor_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 100, max: 1000 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="yield_indoor_max"
                    label="Maximum"
                    type="number"
                    value={formData.yield_indoor_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 100, max: 1000 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Ertrag Outdoor (g/Pflanze)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="yield_outdoor_min"
                    label="Minimum"
                    type="number"
                    value={formData.yield_outdoor_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 100, max: 2000 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="yield_outdoor_max"
                    label="Maximum"
                    type="number"
                    value={formData.yield_outdoor_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 100, max: 2000 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Anbaumethode</InputLabel>
                <Select
                  name="growing_method"
                  value={formData.growing_method}
                  onChange={handleChange}
                  label="Anbaumethode"
                >
                  <MenuItem value="soil">Erde</MenuItem>
                  <MenuItem value="hydro">Hydrokultur</MenuItem>
                  <MenuItem value="coco">Kokos</MenuItem>
                  <MenuItem value="all">Alle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {/* Tab 3: Chemie & Sensorik */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                THC-Gehalt (%)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="thc_percentage_min"
                    label="Minimum"
                    type="number"
                    value={formData.thc_percentage_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 35, step: 0.1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="thc_percentage_max"
                    label="Maximum"
                    type="number"
                    value={formData.thc_percentage_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 35, step: 0.1 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                CBD-Gehalt (%)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="cbd_percentage_min"
                    label="Minimum"
                    type="number"
                    value={formData.cbd_percentage_min}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 35, step: 0.1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="cbd_percentage_max"
                    label="Maximum"
                    type="number"
                    value={formData.cbd_percentage_max}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 0, max: 35, step: 0.1 } }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="dominant_terpenes"
                label="Dominante Terpene (kommagetrennt)"
                value={formData.dominant_terpenes}
                onChange={handleChange}
                fullWidth
                margin="normal"
                helperText="z.B. myrcene, limonene, caryophyllene"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="flavors"
                label="Geschmacksrichtungen (kommagetrennt)"
                value={formData.flavors}
                onChange={handleChange}
                fullWidth
                margin="normal"
                helperText="z.B. sweet, earthy, citrus"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="effects"
                label="Effekte/Wirkungen (kommagetrennt)"
                value={formData.effects}
                onChange={handleChange}
                fullWidth
                margin="normal"
                helperText="z.B. relaxed, uplifting, creative"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Resistenzen (1-5)
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Schimmelresistenz: {formData.resistance_mold}</Typography>
                  <Slider
                    value={formData.resistance_mold}
                    onChange={handleSliderChange('resistance_mold')}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={5}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Schädlingsresistenz: {formData.resistance_pests}</Typography>
                  <Slider
                    value={formData.resistance_pests}
                    onChange={handleSliderChange('resistance_pests')}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={5}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography gutterBottom>Kälteresistenz: {formData.resistance_cold}</Typography>
                  <Slider
                    value={formData.resistance_cold}
                    onChange={handleSliderChange('resistance_cold')}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={5}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        {/* Tab 4: Beschreibungen */}
        {activeTab === 3 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="general_information"
                label="Allgemeine Informationen"
                value={formData.general_information}
                onChange={handleChange}
                fullWidth
                multiline
                rows={6}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="growing_information"
                label="Anbauspezifische Informationen"
                value={formData.growing_information}
                onChange={handleChange}
                fullWidth
                multiline
                rows={6}
                margin="normal"
              />
            </Grid>
          </Grid>
        )}
        
        {/* Tab 5: Bilder */}
        {activeTab === 4 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Sortenbilder
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Fügen Sie Bilder für diese Cannabis-Sorte hinzu. Das erste Bild wird automatisch als Hauptbild verwendet.
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<AddPhotoAlternateIcon />}
                  disabled={fileUploading}
                >
                  Bild auswählen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                
                {selectedFile && (
                  <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      {selectedFile.name}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleFileUpload}
                      disabled={fileUploading}
                    >
                      {fileUploading ? <CircularProgress size={24} /> : 'Hochladen'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              {uploadedImages.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {uploadedImages.map((img) => (
                    <Grid item xs={6} md={3} key={img.id}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 1,
                          border: img.is_primary ? '2px solid #4caf50' : 'none',
                          position: 'relative'
                        }}
                      >
                        <Box
                          component="img"
                          src={img.preview}
                          alt="Sortenbild"
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 1
                          }}
                        />
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 1
                        }}>
                          {img.is_primary ? (
                            <Chip 
                              label="Hauptbild" 
                              color="success" 
                              size="small" 
                            />
                          ) : (
                            <Button
                              size="small"
                              onClick={() => handleSetPrimaryImage(img.id)}
                            >
                              Als Hauptbild
                            </Button>
                          )}
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveImage(img.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        )}
        
        {/* Tab 6: Weitere Infos */}
        {activeTab === 5 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="awards"
                label="Auszeichnungen"
                value={formData.awards}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="release_year"
                label="Jahr der Markteinführung"
                type="number"
                value={formData.release_year || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1960, max: 2025 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2 }}>
                <Typography id="rating-slider" gutterBottom>
                  Bewertung: {formData.rating}/5
                </Typography>
                <Slider
                  aria-labelledby="rating-slider"
                  value={formData.rating}
                  onChange={handleSliderChange('rating')}
                  step={0.1}
                  marks
                  min={1}
                  max={5}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="price_per_seed"
                label="Preis pro Samen (€)"
                type="number"
                value={formData.price_per_seed || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="seeds_per_pack"
                label="Anzahl Samen pro Packung"
                type="number"
                value={formData.seeds_per_pack}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 100 } }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          <Button 
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
          >
            Zurück
          </Button>
          <Button 
            onClick={() => setActiveTab(Math.min(5, activeTab + 1))}
            disabled={activeTab === 5}
            sx={{ ml: 1 }}
          >
            Weiter
          </Button>
        </Box>
        
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="success"
            disabled={loading || !formData.name || !formData.breeder}
          >
            {loading ? <CircularProgress size={24} /> : 'Sorte speichern'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}