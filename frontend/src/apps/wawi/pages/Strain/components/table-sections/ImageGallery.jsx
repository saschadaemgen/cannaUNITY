// frontend/src/apps/wawi/pages/Strain/components/table-sections/ImageGallery.jsx
import { Box, Typography, Grid, IconButton } from '@mui/material'
import ZoomInIcon from '@mui/icons-material/ZoomIn'

const ImageGallery = ({ images, strainName, onImageClick }) => {
  return (
    <Box 
      sx={{ 
        mt: 3, 
        p: 2, 
        borderRadius: '4px', 
        border: '1px solid rgba(0, 0, 0, 0.12)', 
        backgroundColor: 'white'
      }}
    >
      <Typography variant="subtitle2" color="success.main" gutterBottom>
        Bilder
      </Typography>
      <Grid container spacing={2} sx={{ width: '100%' }}>
        {images.map((image, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={image.id}>
            <Box
              sx={{
                position: 'relative',
                '&:hover .image-overlay': {
                  opacity: 1
                }
              }}
            >
              <Box
                component="img"
                src={image.image}
                alt={image.caption || strainName}
                sx={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: image.is_primary ? '2px solid #4caf50' : '1px solid #ddd',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onImageClick(image, index)
                }}
              />
              <Box 
                className="image-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '4px',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageClick(image, index)
                  }}
                  sx={{ color: 'white' }}
                >
                  <ZoomInIcon />
                </IconButton>
              </Box>
              {image.caption && (
                <Typography variant="caption" display="block" align="center">
                  {image.caption}
                </Typography>
              )}
              {image.is_primary && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'success.main',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.8,
                    borderRadius: 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  Hauptbild
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ImageGallery