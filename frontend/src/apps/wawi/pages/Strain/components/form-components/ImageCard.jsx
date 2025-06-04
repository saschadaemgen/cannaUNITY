// frontend/src/apps/wawi/pages/Strain/components/form-components/ImageCard.jsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ImageCard({ 
  image, 
  onRemove, 
  onSetPrimary, 
  onCaptionChange, 
  isPrimary, 
  isPending 
}) {
  const [caption, setCaption] = useState(image.caption || '');
  const [isEditing, setIsEditing] = useState(false);
  
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
          display: 'block',
          cursor: 'pointer'
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
}