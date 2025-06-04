// frontend/src/apps/wawi/pages/Strain/components/form-tabs/ImagesTab.jsx
import { useCallback } from 'react';
import {
  Stack,
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import { DropZone } from '../shared/StyledComponents';
import ImageCard from '../form-components/ImageCard';

export default function ImagesTab({ 
  images = [], 
  pendingImages = [], 
  onImagesChange,
  onPendingImagesChange,
  onDeleteImage,
  onSetPrimaryImage,
  onUpdateImageCaption
}) {
  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file: file,
      preview: URL.createObjectURL(file),
      caption: '',
      is_primary: pendingImages.length === 0 && images.length === 0,
      uploading: false,
      error: null
    }));
    
    onPendingImagesChange([...pendingImages, ...newImages]);
  }, [pendingImages, images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': []},
    multiple: true
  });

  const handleRemovePendingImage = (imageId) => {
    onPendingImagesChange(pendingImages.filter(img => img.id !== imageId));
  };

  const handleUpdatePendingImageCaption = (imageId, newCaption) => {
    onPendingImagesChange(
      pendingImages.map(img => 
        img.id === imageId ? { ...img, caption: newCaption } : img
      )
    );
  };

  const handleSetPrimaryImage = (imageId, type) => {
    if (type === 'pending') {
      onPendingImagesChange(
        pendingImages.map(img => ({ ...img, is_primary: img.id === imageId }))
      );
      
      if (onImagesChange) {
        onImagesChange(
          images.map(img => ({ ...img, is_primary: false }))
        );
      }
    } else if (type === 'saved') {
      onSetPrimaryImage(imageId, 'saved');
      
      onPendingImagesChange(
        pendingImages.map(img => ({ ...img, is_primary: false }))
      );
    }
  };

  return (
    <Stack spacing={3}>
      {/* Drag & Drop Upload-Bereich */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Bilder hochladen
        </Typography>
        
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
                onRemove={() => onDeleteImage(image.id)}
                onSetPrimary={() => handleSetPrimaryImage(image.id, 'saved')}
                onCaptionChange={(caption) => onUpdateImageCaption(image.id, caption)}
                isPrimary={image.is_primary}
                isPending={false}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Stack>
  );
}