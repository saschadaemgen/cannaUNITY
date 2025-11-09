// frontend/src/apps/wawi/pages/Strain/components/table-sections/TableDetailView.jsx
import { Box, Typography, Grid } from '@mui/material'
import DetailInfoCards from './DetailInfoCards'
import PriceInfoSection from './PriceInfoSection'
import ImageGallery from './ImageGallery'
import TrackTraceSection from './TrackTraceSection'
import ActionsSection from './ActionsSection'

const TableDetailView = ({ 
  item, 
  onOpenEditForm, 
  onOpenDestroyDialog,
  onOpenLightbox 
}) => {
  return (
    <>
      {/* Info Cards */}
      <DetailInfoCards item={item} />
      
      {/* Beschreibungen */}
      {(item.general_information || item.growing_information) && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: '4px', 
            border: '1px solid rgba(0, 0, 0, 0.12)', 
            backgroundColor: 'white'
          }}
        >
          <Grid container spacing={2} sx={{ width: '100%' }}>
            {item.general_information && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Allgemeine Informationen
                </Typography>
                <Typography variant="body2">
                  {item.general_information}
                </Typography>
              </Grid>
            )}
            
            {item.growing_information && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Anbauspezifische Informationen
                </Typography>
                <Typography variant="body2">
                  {item.growing_information}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      
      {/* Bilder Galerie */}
      {item.images && item.images.length > 0 && (
        <ImageGallery 
          images={item.images} 
          strainName={item.name}
          onImageClick={(image, index) => onOpenLightbox(image, item.images, index)}
        />
      )}
      
      {/* Track & Trace Bestandsübersicht */}
      <TrackTraceSection strainId={item.id} />
      
      {/* Aktionsbereich - JETZT AUSGELAGERT */}
      <ActionsSection 
        item={item}
        onOpenEditForm={onOpenEditForm}
        onOpenDestroyDialog={onOpenDestroyDialog}
      />
    </>
  )
}

export default TableDetailView