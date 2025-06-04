// frontend/src/apps/wawi/pages/Strain/components/form-components/RFIDScanOverlay.jsx
import { Box, Button, Typography, CircularProgress, Fade, Zoom } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function RFIDScanOverlay({ 
  scanMode, 
  scanSuccess, 
  scannedMemberName, 
  rfidLoading, 
  onCancel,
  isEdit 
}) {
  if (!scanMode) return null;

  return (
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
      {!scanSuccess && (
        <Button 
          onClick={onCancel}
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
              Autorisierung erfolgreich
            </Typography>
            
            <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
              Sorte wurde erfolgreich {isEdit ? 'aktualisiert' : 'angelegt'}
            </Typography>
            
            <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
              Bearbeiter: {scannedMemberName}
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
  );
}