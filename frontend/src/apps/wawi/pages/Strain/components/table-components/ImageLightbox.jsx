// frontend/src/apps/wawi/pages/Strain/components/table-components/ImageLightbox.jsx
import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  IconButton, 
  Box, 
  Typography 
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

const ImageLightbox = ({ 
  open, 
  onClose, 
  selectedImage, 
  images = [], 
  currentIndex = 0 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imageIndex, setImageIndex] = useState(currentIndex)
  const [displayImage, setDisplayImage] = useState(selectedImage)

  useEffect(() => {
    setImageIndex(currentIndex)
    setDisplayImage(selectedImage)
    setZoomLevel(1)
  }, [currentIndex, selectedImage])

  const handlePrevImage = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1)
    
    const imageContainer = document.getElementById('lightbox-image-container')
    if (imageContainer) {
      imageContainer.style.opacity = 0
      
      setTimeout(() => {
        const newIndex = (imageIndex - 1 + images.length) % images.length
        setImageIndex(newIndex)
        setDisplayImage(images[newIndex])
        
        setTimeout(() => {
          imageContainer.style.opacity = 1
        }, 50)
      }, 200)
    }
  }

  const handleNextImage = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1)
    
    const imageContainer = document.getElementById('lightbox-image-container')
    if (imageContainer) {
      imageContainer.style.opacity = 0
      
      setTimeout(() => {
        const newIndex = (imageIndex + 1) % images.length
        setImageIndex(newIndex)
        setDisplayImage(images[newIndex])
        
        setTimeout(() => {
          imageContainer.style.opacity = 1
        }, 50)
      }, 200)
    }
  }

  const handleZoomIn = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleResetZoom = (event) => {
    if (event) event.stopPropagation()
    setZoomLevel(1)
  }

  if (!displayImage) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullScreen
      PaperProps={{
        sx: { 
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
          borderRadius: 0,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: { xs: 8, sm: 16, md: 24 },
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                },
                zIndex: 10,
                p: { xs: 1, sm: 1.5 }
              }}
            >
              <NavigateBeforeIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
            </IconButton>

            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: { xs: 8, sm: 16, md: 24 },
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                },
                zIndex: 10,
                p: { xs: 1, sm: 1.5 }
              }}
            >
              <NavigateNextIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
            </IconButton>
          </>
        )}

        <Box
          sx={{
            width: '100%',
            height: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: '30px',
            mb: '30px',
            position: 'relative'
          }}
        >
          {/* Image Container */}
          <Box
            id="lightbox-image-container"
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              opacity: 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            <Box
              component="img"
              src={displayImage.image}
              alt={displayImage.caption || "Bild"}
              sx={{
                height: zoomLevel === 1 ? '100%' : 'auto',
                width: 'auto',
                maxWidth: zoomLevel === 1 ? '100%' : 'none',
                maxHeight: zoomLevel === 1 ? '100%' : 'none',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                borderRadius: 1,
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.3s ease',
                cursor: zoomLevel > 1 ? 'move' : 'default'
              }}
            />
            
            {/* Counter */}
            {images.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 16, sm: 20 },
                  left: { xs: 16, sm: 20 },
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 'bold',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  zIndex: 5,
                }}
              >
                {imageIndex + 1} / {images.length}
              </Box>
            )}
            
            {/* Zoom Controls */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, sm: 20 },
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 4,
                padding: '4px',
                zIndex: 10,
              }}
            >
              <IconButton
                onClick={handleZoomOut}
                size="small"
                sx={{ color: 'white', p: 0.8 }}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              
              <Box 
                sx={{ 
                  color: 'white', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  mx: 0.5,
                  minWidth: '40px',
                  textAlign: 'center'
                }}
              >
                {Math.round(zoomLevel * 100)}%
              </Box>
              
              <IconButton
                onClick={handleZoomIn}
                size="small"
                sx={{ color: 'white', p: 0.8 }}
                disabled={zoomLevel >= 3}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                onClick={handleResetZoom}
                size="small"
                sx={{ 
                  color: 'white', 
                  p: 0.8,
                  ml: 0.5,
                  display: zoomLevel !== 1 ? 'flex' : 'none'
                }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {/* Caption */}
            {displayImage.caption && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 16, sm: 20 },
                  right: { xs: 16, sm: 20 },
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  maxWidth: { xs: '80%', sm: '60%' },
                  textAlign: 'right',
                  zIndex: 5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'medium' }}
                >
                  {displayImage.caption}
                </Typography>
              </Box>
            )}
            
            {/* Primary Badge */}
            {displayImage.is_primary && (
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 16, sm: 20 },
                  right: { xs: 16, sm: 20 },
                  backgroundColor: '#4caf50',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  zIndex: 5,
                }}
              >
                Hauptbild
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default ImageLightbox