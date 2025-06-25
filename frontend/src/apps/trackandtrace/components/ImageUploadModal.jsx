// frontend/src/apps/trackandtrace/components/ImageUploadModal.jsx
import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Grid,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Card, CardMedia, CardContent, CardActions, Chip,
  LinearProgress, Alert, Fade, Zoom, CircularProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import api from '@/utils/api'

export default function ImageUploadModal({ 
  open, 
  onClose, 
  productType, // 'seed', 'mother-batch', 'motherplant', 'cutting-batch', etc.
  productId,
  productName,
  onImagesUpdated,
  additionalFields = [] // NEU: Für zusätzliche Felder wie growth_stage
}) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState('')
  
  // RFID-States
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [scannedMemberName, setScannedMemberName] = useState('')
  const [memberId, setMemberId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)
  
  // Formular für neue Bilder
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    image_type: 'overview',
    ...additionalFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  })

  // Dialog zurücksetzen beim Öffnen
  useEffect(() => {
    if (open) {
      loadImages()
      // Reset states
      setScanMode(false)
      setScanSuccess(false)
      setScannedMemberName('')
      setMemberId(null)
      setSelectedFiles([])
      setUploadForm({
        title: '',
        description: '',
        image_type: 'overview',
        ...additionalFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
      })
      setError('')
    }
  }, [open, productId])

  const loadImages = async () => {
    if (!productId) return
    
    try {
      let endpoint = ''
      let params = {}
      
      switch (productType) {
        case 'seed':
          endpoint = '/trackandtrace/seed-images/'
          params = { seed_id: productId }
          break
        case 'mother-batch':
          endpoint = '/trackandtrace/mother-batch-images/'
          params = { batch_id: productId }
          break
        case 'motherplant':
          endpoint = '/trackandtrace/motherplant-images/'
          params = { motherplant_id: productId }
          break
        case 'cutting-batch':
          endpoint = '/trackandtrace/cutting-batch-images/'
          params = { batch_id: productId }
          break
        case 'blooming-cutting-batch':
          endpoint = '/trackandtrace/blooming-cutting-batch-images/'
          params = { batch_id: productId }
          break
        case 'flowering-plant-batch':
          endpoint = '/trackandtrace/flowering-plant-batch-images/'
          params = { batch_id: productId }
          break
        case 'harvest-batch':
          endpoint = '/trackandtrace/harvest-batch-images/'
          params = { batch_id: productId }
          break
        case 'drying-batch':
          endpoint = '/trackandtrace/drying-batch-images/'
          params = { batch_id: productId }
          break
        case 'processing-batch':
          endpoint = '/trackandtrace/processing-batch-images/'
          params = { batch_id: productId }
          break
        case 'lab-testing-batch':
          endpoint = '/trackandtrace/lab-testing-batch-images/'
          params = { batch_id: productId }
          break
        case 'packaging-batch':
          endpoint = '/trackandtrace/packaging-batch-images/'
          params = { batch_id: productId }
          break
        default:
          endpoint = `/trackandtrace/${productType}-images/`
          params = { [`${productType}_id`]: productId }
      }
      
      const res = await api.get(endpoint, { params })
      setImages(res.data.results || res.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Medien:', error)
    }
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    
    // Validiere Dateitypen und Größen
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024 // 100MB für Videos, 10MB für Bilder
      
      if (!isImage && !isVideo) {
        setError(`${file.name} ist weder ein Bild noch ein Video`)
        return false
      }
      
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        setError(`${file.name} ist zu groß (max. ${maxSizeMB}MB)`)
        return false
      }
      
      return true
    })
    
    setSelectedFiles(validFiles)
    if (validFiles.length === files.length) {
      setError('')
    }
    
    // Wenn nur eine Datei, verwende den Dateinamen als Titel
    if (validFiles.length === 1 && !uploadForm.title) {
      setUploadForm(prev => ({
        ...prev,
        title: validFiles[0].name.split('.')[0]
      }))
    }
  }

  // RFID-Scan starten
  const startRfidScan = async () => {
    if (selectedFiles.length === 0) {
      setError('Bitte wählen Sie zuerst Bilder oder Videos aus')
      return
    }
    
    setScanMode(true)
    setScanSuccess(false)
    await handleRfidScan()
  }

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return
    
    const controller = new AbortController()
    setAbortController(controller)
    setLoading(true)
    
    try {
      console.log("🚀 Starte RFID-Scan für Medien-Upload...")
      
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      })
      
      if (isAborting) return
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }
      
      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      )
      
      const { member_id, member_name } = verifyRes.data
      
      // Erfolg setzen und Mitgliedsdaten speichern
      setMemberId(member_id)
      setScannedMemberName(member_name)
      setScanSuccess(true)
      
      // 3. Nach erfolgreicher Verifizierung die Medien hochladen
      setTimeout(async () => {
        await performUpload(member_id)
        
        // Nach weiteren 2 Sekunden den Scan-Modus beenden
        setTimeout(() => {
          setScanMode(false)
          setScanSuccess(false)
          setSelectedFiles([])
          setUploadForm({
            title: '',
            description: '',
            image_type: 'overview',
            ...additionalFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
          })
        }, 2000)
      }, 500)
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen')
      } else {
        console.error('RFID-Bindungsfehler:', error)
        setError(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen')
      }
      
      if (!isAborting) {
        setScanMode(false)
      }
    } finally {
      if (!isAborting) {
        setLoading(false)
      }
    }
  }

  // Medien hochladen mit member_id
  const performUpload = async (rfidMemberId) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Bestimme den richtigen Endpunkt
      let endpoint = ''
      switch (productType) {
        case 'seed':
          endpoint = '/trackandtrace/seed-images/'
          break
        case 'mother-batch':
          endpoint = '/trackandtrace/mother-batch-images/'
          break
        case 'motherplant':
          endpoint = '/trackandtrace/motherplant-images/'
          break
        case 'cutting-batch':
          endpoint = '/trackandtrace/cutting-batch-images/'
          break
        case 'blooming-cutting-batch':
          endpoint = '/trackandtrace/blooming-cutting-batch-images/'
          break
        case 'flowering-plant-batch':
          endpoint = '/trackandtrace/flowering-plant-batch-images/'
          break
        case 'harvest-batch':
          endpoint = '/trackandtrace/harvest-batch-images/'
          break
        case 'drying-batch':
          endpoint = '/trackandtrace/drying-batch-images/'
          break
        case 'processing-batch':
          endpoint = '/trackandtrace/processing-batch-images/'
          break
        case 'lab-testing-batch':
          endpoint = '/trackandtrace/lab-testing-batch-images/'
          break
        case 'packaging-batch':
          endpoint = '/trackandtrace/packaging-batch-images/'
          break
        default:
          endpoint = `/trackandtrace/${productType}-images/`
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        
        // Unterscheide zwischen Bild und Video
        if (file.type.startsWith('video/')) {
          formData.append('video', file)
        } else {
          formData.append('image', file)
        }
        
        // Je nach Produkttyp den richtigen Feldnamen verwenden
        switch (productType) {
          case 'seed':
            formData.append('seed_id', productId)
            break
          case 'mother-batch':
            formData.append('batch_id', productId)
            break
          case 'motherplant':
            formData.append('motherplant_id', productId)
            break
          case 'cutting-batch':
            formData.append('batch_id', productId)
            break
          case 'blooming-cutting-batch':
            formData.append('batch_id', productId)
            break
          case 'flowering-plant-batch':
            formData.append('batch_id', productId)
            break
          case 'harvest-batch':
            formData.append('batch_id', productId)
            break
          case 'drying-batch':
            formData.append('batch_id', productId)
            break
          case 'processing-batch':
            formData.append('batch_id', productId)
            break
          case 'lab-testing-batch':
            formData.append('batch_id', productId)
            break
          case 'packaging-batch':
            formData.append('batch_id', productId)
            break
          default:
            formData.append(`${productType}_id`, productId)
        }
        
        formData.append('title', uploadForm.title || file.name)
        formData.append('description', uploadForm.description)
        formData.append('image_type', uploadForm.image_type)
        formData.append('uploaded_by', rfidMemberId)
        
        // Zusätzliche Felder hinzufügen
        additionalFields.forEach(field => {
          if (uploadForm[field.name]) {
            formData.append(field.name, uploadForm[field.name])
          }
        })

        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              ((i + progressEvent.loaded / progressEvent.total) / selectedFiles.length) * 100
            )
            setUploadProgress(progress)
          }
        })
      }

      loadImages()
      if (onImagesUpdated) onImagesUpdated()
    } catch (error) {
      setError('Fehler beim Hochladen der Medien')
      console.error('Upload-Fehler:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    setIsAborting(true)
    
    if (abortController) {
      abortController.abort()
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/')
      console.log("RFID-Scan erfolgreich abgebrochen")
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error)
    } finally {
      setScanMode(false)
      setLoading(false)
      setScanSuccess(false)
      setScannedMemberName('')
      
      setTimeout(() => {
        setIsAborting(false)
      }, 500)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Möchten Sie dieses Medium wirklich löschen?')) return

    try {
      let endpoint = ''
      switch (productType) {
        case 'seed':
          endpoint = `/trackandtrace/seed-images/${imageId}/`
          break
        case 'mother-batch':
          endpoint = `/trackandtrace/mother-batch-images/${imageId}/`
          break
        case 'motherplant':
          endpoint = `/trackandtrace/motherplant-images/${imageId}/`
          break
        case 'cutting-batch':
          endpoint = `/trackandtrace/cutting-batch-images/${imageId}/`
          break
        case 'blooming-cutting-batch':
          endpoint = `/trackandtrace/blooming-cutting-batch-images/${imageId}/`
          break
        case 'flowering-plant-batch':
          endpoint = `/trackandtrace/flowering-plant-batch-images/${imageId}/`
          break
        case 'harvest-batch':
          endpoint = `/trackandtrace/harvest-batch-images/${imageId}/`
          break
        case 'drying-batch':
          endpoint = `/trackandtrace/drying-batch-images/${imageId}/`
          break
        case 'processing-batch':
          endpoint = `/trackandtrace/processing-batch-images/${imageId}/`
          break
        case 'lab-testing-batch':
          endpoint = `/trackandtrace/lab-testing-batch-images/${imageId}/`
          break
        case 'packaging-batch':
          endpoint = `/trackandtrace/packaging-batch-images/${imageId}/`
          break
        default:
          endpoint = `/trackandtrace/${productType}-images/${imageId}/`
      }
      
      await api.delete(endpoint)
      loadImages()
      if (onImagesUpdated) onImagesUpdated()
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    }
  }

  const handleClose = () => {
    if (scanMode) {
      handleCancelScan()
    } else {
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullScreen
      disableEscapeKeyDown={scanMode}
    >
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'primary.light',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1300
        }}>
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
                  Upload erfolgreich
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                  {selectedFiles.length} Datei(en) wurden hochgeladen
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  Hochgeladen von: {scannedMemberName}
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
                um die Medien hochzuladen
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
      )}

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhotoCameraIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Medien für {productName}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Upload-Bereich */}
        {!scanMode && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <input
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  id="media-upload"
                  multiple
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="media-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Bilder oder Videos auswählen
                  </Button>
                </label>
              </Grid>

              {selectedFiles.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      {selectedFiles.length} Datei(en) ausgewählt
                      {selectedFiles.some(f => f.type.startsWith('video/')) && ' (inkl. Videos)'}
                    </Alert>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Titel"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Beschreibung"
                      multiline
                      rows={2}
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Medientyp</InputLabel>
                      <Select
                        value={uploadForm.image_type}
                        onChange={(e) => setUploadForm({...uploadForm, image_type: e.target.value})}
                        label="Medientyp"
                      >
                        <MenuItem value="overview">Übersicht</MenuItem>
                        <MenuItem value="detail">Detail</MenuItem>
                        <MenuItem value="quality">Qualitätskontrolle</MenuItem>
                        <MenuItem value="documentation">Dokumentation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Zusätzliche Felder rendern */}
                  {additionalFields.map((field) => (
                    <Grid item xs={12} key={field.name}>
                      {field.type === 'select' ? (
                        <FormControl fullWidth>
                          <InputLabel>{field.label}</InputLabel>
                          <Select
                            value={uploadForm[field.name] || ''}
                            onChange={(e) => setUploadForm({...uploadForm, [field.name]: e.target.value})}
                            label={field.label}
                          >
                            {field.options?.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          label={field.label}
                          value={uploadForm[field.name] || ''}
                          onChange={(e) => setUploadForm({...uploadForm, [field.name]: e.target.value})}
                        />
                      )}
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={startRfidScan}
                      fullWidth
                      startIcon={<CreditCardIcon />}
                    >
                      Mit RFID autorisieren & hochladen
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" align="center">
                  {uploadProgress}% 
                  {selectedFiles.some(f => f.type.startsWith('video/')) && uploadProgress < 100 
                    ? ' - Videos können etwas länger dauern...' 
                    : ''}
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Medien-Galerie */}
        {!scanMode && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vorhandene Medien ({images.length})
            </Typography>
            
            <Grid container spacing={2}>
              {images.map((media) => (
                <Grid item xs={12} sm={6} md={4} key={media.id}>
                  <Card>
                    {media.media_type === 'video' ? (
                      // Video-Anzeige
                      <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: 'black' }}>
                        <video
                          controls
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                          }}
                          poster={media.thumbnail_url}
                        >
                          <source src={media.video_url || media.get_media_url} type="video/mp4" />
                          Ihr Browser unterstützt keine Videos.
                        </video>
                      </Box>
                    ) : (
                      // Bild-Anzeige
                      <CardMedia
                        component="img"
                        height="200"
                        image={media.thumbnail_url || media.image_url}
                        alt={media.title}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => window.open(media.image_url, '_blank')}
                      />
                    )}
                    <CardContent>
                      <Typography variant="body2" noWrap>
                        {media.title || 'Ohne Titel'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={media.media_type === 'video' ? '🎬 Video' : '🖼️ Bild'} 
                          size="small" 
                          color={media.media_type === 'video' ? 'secondary' : 'default'}
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={media.image_type} 
                          size="small" 
                        />
                        {media.growth_stage && (
                          <Chip 
                            label={media.growth_stage} 
                            size="small" 
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.drying_stage && (
                          <Chip 
                            label={media.drying_stage} 
                            size="small" 
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.processing_stage && (
                          <Chip 
                            label={
                              media.processing_stage === 'input' ? 'Input' :
                              media.processing_stage === 'processing' ? 'Verarbeitung' :
                              media.processing_stage === 'output' ? 'Fertig' :
                              media.processing_stage === 'quality' ? 'QK' :
                              media.processing_stage
                            } 
                            size="small" 
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.product_quality && (
                          <Chip 
                            label={
                              media.product_quality === 'premium' ? '⭐ Premium' :
                              media.product_quality === 'standard' ? 'Standard' :
                              media.product_quality === 'budget' ? 'Budget' :
                              media.product_quality
                            } 
                            size="small" 
                            color={
                              media.product_quality === 'premium' ? 'warning' :
                              media.product_quality === 'standard' ? 'default' :
                              'default'
                            }
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.test_stage && (
                          <Chip 
                            label={
                              media.test_stage === 'sample_prep' ? '🧪 Vorbereitung' :
                              media.test_stage === 'testing' ? '🔬 Test läuft' :
                              media.test_stage === 'results' ? '📊 Ergebnisse' :
                              media.test_stage === 'microscopy' ? '🔭 Mikroskopie' :
                              media.test_stage === 'chromatography' ? '📈 Chromatographie' :
                              media.test_stage
                            } 
                            size="small" 
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.test_type && (
                          <Chip 
                            label={
                              media.test_type === 'cannabinoid' ? '🌿 Cannabinoid' :
                              media.test_type === 'terpene' ? '🍋 Terpene' :
                              media.test_type === 'microbial' ? '🦠 Mikrobiologie' :
                              media.test_type === 'pesticide' ? '🚫 Pestizide' :
                              media.test_type === 'heavy_metal' ? '⚠️ Schwermetalle' :
                              media.test_type === 'visual' ? '👁️ Visuell' :
                              media.test_type
                            } 
                            size="small" 
                            color={
                              media.test_type === 'cannabinoid' ? 'success' :
                              media.test_type === 'microbial' || media.test_type === 'pesticide' || media.test_type === 'heavy_metal' ? 'error' :
                              'default'
                            }
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.packaging_stage && (
                          <Chip 
                            label={
                              media.packaging_stage === 'pre_packaging' ? '📦 Vor Verpackung' :
                              media.packaging_stage === 'packaging_process' ? '🔄 Während Verpackung' :
                              media.packaging_stage === 'final_product' ? '✅ Fertiges Produkt' :
                              media.packaging_stage === 'labeling' ? '🏷️ Etikettierung' :
                              media.packaging_stage === 'sealing' ? '🔒 Versiegelung' :
                              media.packaging_stage === 'batch_photo' ? '📸 Chargen-Übersicht' :
                              media.packaging_stage
                            } 
                            size="small" 
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {media.package_type && (
                          <Chip 
                            label={
                              media.package_type === 'primary' ? '📦 Primär' :
                              media.package_type === 'secondary' ? '📦📦 Sekundär' :
                              media.package_type === 'label' ? '🏷️ Etikett' :
                              media.package_type === 'seal' ? '🔒 Siegel' :
                              media.package_type === 'batch_overview' ? '📸 Übersicht' :
                              media.package_type
                            } 
                            size="small" 
                            color={
                              media.package_type === 'seal' ? 'error' :
                              media.package_type === 'label' ? 'info' :
                              'default'
                            }
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Von {media.uploaded_by_name} am{' '}
                        {new Date(media.uploaded_at).toLocaleDateString('de-DE')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteImage(media.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {images.length === 0 && !uploading && (
              <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                Noch keine Medien vorhanden
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      {!scanMode && (
        <DialogActions>
          <Button onClick={handleClose}>Schließen</Button>
        </DialogActions>
      )}
    </Dialog>
  )
}