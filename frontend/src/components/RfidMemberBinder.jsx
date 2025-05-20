// components/RfidMemberBinder.jsx
import React, { useState, useEffect } from 'react'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import api from '@/utils/api'
import CreditCardIcon from '@mui/icons-material/CreditCard'

const RfidMemberBinder = ({ onMemberSelected, scanMode, setScanMode }) => {
  const [loading, setLoading] = useState(false)

  // Automatisch scannen starten, wenn scanMode aktiviert wird
  useEffect(() => {
    if (scanMode) {
      handleScan();
    }
  }, [scanMode]);

  const handleScan = async () => {
    setLoading(true)
    try {
      // 1. Karte scannen und User auslesen
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/')
      const { token, unifi_user_id, message, unifi_name } = bindRes.data

      console.log("🔍 Sende an secure-member-binding:", { token, unifi_user_id, unifi_name })

      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }

      // 2. Mitglied validieren
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', {
        token,
        unifi_name
      })

      const { member_id, member_name } = verifyRes.data

      // Übergabe an das Elternformular
      if (onMemberSelected) {
        onMemberSelected({ id: member_id, name: member_name })
      }
    } catch (error) {
      console.error('RFID-Bindungsfehler:', error.response?.data?.detail || 'Ein Fehler ist aufgetreten.')
      if (setScanMode) setScanMode(false);
    } finally {
      setLoading(false)
    }
  }

  // Wenn wir nicht im Scan-Modus sind, zeigen wir den normalen Button an
  if (!scanMode) {
    return (
      <Box textAlign="center" mt={2} mb={2}>
        <Button
          onClick={() => setScanMode && setScanMode(true)}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          fullWidth
          sx={{ 
            height: '48px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          Jetzt Speichern und Mit RFID bestätigen
        </Button>
      </Box>
    )
  }
  
  // Im Scan-Modus zeigen wir nichts an, da die Hauptkomponente das Scan-Interface übernimmt
  return null;
}

export default RfidMemberBinder