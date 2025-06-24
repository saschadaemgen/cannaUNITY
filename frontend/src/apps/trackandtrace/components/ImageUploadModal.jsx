// frontend/src/apps/trackandtrace/components/ImageUploadModal.jsx
import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Grid,  // Grid statt Grid2
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
        default:
          endpoint = `/trackandtrace/${productType}-images/`
          params = { [`${productType}_id`]: productId }
      }
      
      const res = await api.get(endpoint, { params })
      setImages(res.data.results || res.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error)
    }
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(files)
    setError('')
    
    // Wenn nur eine Datei, verwende den Dateinamen als Titel
    if (files.length === 1 && !uploadForm.title) {
      setUploadForm(prev => ({
        ...prev,
        title: files[0].name.split('.')[0]
      }))
    }
  }

  // RFID-Scan starten
  const startRfidScan = async () => {
    if (selectedFiles.length === 0) {
      setError('Bitte wählen Sie zuerst Bilder aus')
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
      console.log("🚀 Starte RFID-Scan für Bilder-Upload...")
      
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
      
      // 3. Nach erfolgreicher Verifizierung die Bilder hochladen
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

  // Bilder hochladen mit member_id
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
        default:
          endpoint = `/trackandtrace/${productType}-images/`
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        
        formData.append('image', file)
        
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
      setError('Fehler beim Hochladen der Bilder')
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
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return

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
                  {selectedFiles.length} Bild(er) wurden hochgeladen
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
                um die Bilder hochzuladen
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
            Bilder für {productName}
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
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Bilder auswählen
                  </Button>
                </label>
              </Grid>

              {selectedFiles.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      {selectedFiles.length} Datei(en) ausgewählt
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
                      <InputLabel>Bildtyp</InputLabel>
                      <Select
                        value={uploadForm.image_type}
                        onChange={(e) => setUploadForm({...uploadForm, image_type: e.target.value})}
                        label="Bildtyp"
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

        {/* Bilder-Galerie */}
        {!scanMode && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vorhandene Bilder ({images.length})
            </Typography>
            
            <Grid container spacing={2}>
              {images.map((image) => (
                <Grid item xs={12} sm={6} md={4} key={image.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={image.thumbnail_url || image.image_url}
                      alt={image.title}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => window.open(image.image_url, '_blank')}
                    />
                    <CardContent>
                      <Typography variant="body2" noWrap>
                        {image.title || 'Ohne Titel'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={image.image_type} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        {image.growth_stage && (
                          <Chip 
                            label={image.growth_stage} 
                            size="small" 
                            color="primary"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Von {image.uploaded_by_name} am{' '}
                        {new Date(image.uploaded_at).toLocaleDateString('de-DE')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteImage(image.id)}
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
                Noch keine Bilder vorhanden
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