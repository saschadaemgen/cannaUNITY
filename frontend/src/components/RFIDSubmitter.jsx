// components/RFIDSubmitter.jsx
import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Typography, Box } from '@mui/material';
import NfcIcon from '@mui/icons-material/Nfc';
import RFIDAuthenticator from './RFIDAuthenticator';

export default function RFIDSubmitter({ onAuthorize, disabled = false, label = "Per RFID autorisieren & speichern" }) {
  const [showRFIDDialog, setShowRFIDDialog] = useState(false);

  const handleAuthenticated = (memberId, memberName) => {
    // Formular mit dem authentifizierten Mitglied speichern
    onAuthorize(memberId, memberName);
    setShowRFIDDialog(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<NfcIcon />}
        onClick={() => setShowRFIDDialog(true)}
        disabled={disabled}
        sx={{ minWidth: 220 }}
      >
        {label}
      </Button>

      <Dialog 
        open={showRFIDDialog} 
        onClose={() => setShowRFIDDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Autorisierung erforderlich</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Bitte legen Sie Ihre RFID-Karte auf, um die Änderungen zu autorisieren und zu speichern.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Die Aktion wird mit Ihrem Benutzerkonto verknüpft.
            </Typography>
          </Box>
          
          <RFIDAuthenticator 
            onAuthenticated={handleAuthenticated}
            targetApp="form_submitter"
            autoClose={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}