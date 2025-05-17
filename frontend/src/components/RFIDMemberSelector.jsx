// components/RFIDMemberSelector.jsx
import { useState } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RFIDAuthenticator from './RFIDAuthenticator';

export default function RFIDMemberSelector({ 
  selectedMemberId, 
  onMemberSelected, 
  memberName = null,
  members = [],
  label = "Zugeordnetes Mitglied",
  buttonVariant = "outlined"
}) {
  const [showRFIDAuth, setShowRFIDAuth] = useState(false);
  
  // Mitgliedsname ermitteln
  const displayName = memberName || 
    (selectedMemberId ? members.find(m => m.id === selectedMemberId)?.display_name : null) ||
    'Ausgewähltes Mitglied';
  
  const handleMemberAuthenticated = (memberId, name) => {
    onMemberSelected(memberId, name);
    setShowRFIDAuth(false);
  };
  
  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}:
        </Typography>
        
        {selectedMemberId ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography>{displayName}</Typography>
            <Button 
              size="small" 
              sx={{ ml: 2 }}
              onClick={() => setShowRFIDAuth(true)}
            >
              Ändern
            </Button>
          </Box>
        ) : (
          <Button
            variant={buttonVariant}
            onClick={() => setShowRFIDAuth(true)}
            startIcon={<PersonIcon />}
          >
            Mitglied per RFID auswählen
          </Button>
        )}
      </Box>
      
      <Dialog 
        open={showRFIDAuth} 
        onClose={() => setShowRFIDAuth(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mitglied auswählen</DialogTitle>
        <DialogContent>
          <RFIDAuthenticator 
            onAuthenticated={handleMemberAuthenticated}
            targetApp="member_selector"
            autoClose={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}