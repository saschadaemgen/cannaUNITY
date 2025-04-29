// src/apps/members/components/ExternalIntegration.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Divider, 
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
  DialogActions, CircularProgress, TextField, Tooltip, 
  Accordion, AccordionSummary, AccordionDetails, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockResetIcon from '@mui/icons-material/LockReset';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../../utils/api';

/**
 * Komponente zur Verwaltung der externen Integrationen für ein Mitglied
 * (Joomla und UniFi Access)
 */
const ExternalIntegration = ({ memberId }) => {
  // State für UI
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState({
    joomlaCreate: false,
    joomlaUpdate: false,
    joomlaPassword: false,
    joomlaDelete: false,
    unifiCreate: false,
    unifiUpdate: false,
    unifiDelete: false,
    unifiStatus: false,
    unifiReactivate: false
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    password: '',
    username: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: '',
    service: '',
    message: ''
  });
  const [unifiStatus, setUnifiStatus] = useState({
    checked: false,
    status: null,
    isActive: false,
    unifi_id: null
  });

  // Status der UniFi-Integration beim Öffnen prüfen
  useEffect(() => {
    if (expanded && !unifiStatus.checked) {
      checkUnifiStatus();
    }
  }, [expanded]);

  // Hilfsfunktion für das Anzeigen von Benachrichtigungen
  const showAlert = (message, severity = 'success') => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  // Hilfsfunktion für das Schließen der Benachrichtigung
  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // Hilfsfunktion für das Kopieren eines Textes in die Zwischenablage
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showAlert('In die Zwischenablage kopiert!', 'success');
      })
      .catch(() => {
        showAlert('Fehler beim Kopieren in die Zwischenablage', 'error');
      });
  };

  // UniFi-Status prüfen - verbesserte Version mit Fehlerbehandlung
  const checkUnifiStatus = async () => {
    setLoading(prev => ({ ...prev, unifiStatus: true }));
    
    try {
      const response = await api.get(`/members/${memberId}/unifi/status/`);
      
      if (response.data.success) {
        setUnifiStatus({
          checked: true,
          status: response.data.status,
          isActive: response.data.is_active,
          unifi_id: response.data.unifi_id
        });
        
        // Erfolg anzeigen, wenn wir aktiv nach einer Statusprüfung gefragt haben
        if (expanded) {
          showAlert(`Status abgerufen: ${response.data.status}`, 'info');
        }
      } else {
        // Wenn kein Status gefunden wurde, setzen wir checked auf true,
        // aber status und isActive bleiben null bzw. false
        setUnifiStatus({
          checked: true,
          status: null,
          isActive: false,
          unifi_id: null
        });
        
        // Nur wenn der Benutzer explizit nach dem Status gefragt hat, zeigen wir die Warnung
        if (expanded) {
          showAlert(response.data.error || 'Kein UniFi-Zugang gefunden', 'warning');
        }
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des UniFi-Status:', error);
      
      // Bei einem Fehler gehen wir davon aus, dass kein UniFi-Benutzer existiert
      setUnifiStatus({
        checked: true,
        status: null,
        isActive: false,
        unifi_id: null
      });
      
      // Status-Fehler anzeigen, aber nur wenn der Benutzer explizit danach gefragt hat
      if (expanded) {
        // Prüfen, ob das Backend eine bestimmte Fehlermeldung zurückgibt
        const errorMessage = error.response?.data?.error || 
                            'Fehler beim Prüfen des UniFi-Status';
        showAlert(errorMessage, 'error');
      }
    } finally {
      setLoading(prev => ({ ...prev, unifiStatus: false }));
    }
  };

  // ===== JOOMLA FUNKTIONEN =====

  // Joomla-Benutzer erstellen
  const handleCreateJoomlaUser = async () => {
    setLoading(prev => ({ ...prev, joomlaCreate: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/joomla/create/`);
      
      if (response.data.success) {
        showAlert('Joomla-Benutzer erfolgreich erstellt!', 'success');
        
        // Zeige das Passwort-Dialog an
        setPasswordDialog({
          open: true,
          password: response.data.password || '(Das Passwort wurde im Mitgliedseintrag gespeichert)',
          username: response.data.username || 'joomla_user'
        });
      } else {
        showAlert(response.data.error || 'Fehler beim Erstellen des Joomla-Benutzers', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      showAlert(
        error.response?.data?.error || 'Fehler beim Erstellen des Joomla-Benutzers',
        'error'
      );
    } finally {
      setLoading(prev => ({ ...prev, joomlaCreate: false }));
    }
  };

  // Joomla-Benutzer aktualisieren
  const handleUpdateJoomlaUser = async () => {
    setLoading(prev => ({ ...prev, joomlaUpdate: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/joomla/update/`);
      
      if (response.data.success) {
        showAlert('Joomla-Benutzer erfolgreich aktualisiert!', 'success');
      } else {
        showAlert(response.data.error || 'Fehler beim Aktualisieren des Joomla-Benutzers', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      
      // Spezielle Behandlung, wenn der Benutzer zuerst erstellt werden muss
      if (error.response?.data?.create_first) {
        setConfirmDialog({
          open: true,
          type: 'create',
          service: 'joomla',
          message: 'Joomla-Benutzer nicht gefunden. Möchten Sie einen neuen Benutzer erstellen?'
        });
      } else {
        showAlert(
          error.response?.data?.error || 'Fehler beim Aktualisieren des Joomla-Benutzers',
          'error'
        );
      }
    } finally {
      setLoading(prev => ({ ...prev, joomlaUpdate: false }));
    }
  };

  // Joomla-Passwort neu generieren
  const handleRegenerateJoomlaPassword = async () => {
    setLoading(prev => ({ ...prev, joomlaPassword: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/joomla/password/`);
      
      if (response.data.success) {
        showAlert('Neues Passwort erfolgreich generiert!', 'success');
        
        // Zeige das Passwort-Dialog an
        setPasswordDialog({
          open: true,
          password: response.data.password,
          username: response.data.username || 'joomla_user'
        });
      } else {
        showAlert(response.data.error || 'Fehler beim Generieren des Passworts', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      
      // Spezielle Behandlung, wenn der Benutzer zuerst erstellt werden muss
      if (error.response?.data?.create_first) {
        setConfirmDialog({
          open: true,
          type: 'create',
          service: 'joomla',
          message: 'Joomla-Benutzer nicht gefunden. Möchten Sie einen neuen Benutzer erstellen?'
        });
      } else {
        showAlert(
          error.response?.data?.error || 'Fehler beim Generieren des Passworts',
          'error'
        );
      }
    } finally {
      setLoading(prev => ({ ...prev, joomlaPassword: false }));
    }
  };

  // Joomla-Benutzer löschen
  const handleDeleteJoomlaUser = async () => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      service: 'joomla',
      message: 'Möchten Sie den Joomla-Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
    });
  };

  // Bestätigte Löschung eines Joomla-Benutzers
  const confirmDeleteJoomlaUser = async () => {
    setLoading(prev => ({ ...prev, joomlaDelete: true }));
    setConfirmDialog(prev => ({ ...prev, open: false }));
    
    try {
      const response = await api.delete(`/members/${memberId}/joomla/delete/`);
      
      if (response.data.success) {
        showAlert('Joomla-Benutzer erfolgreich gelöscht!', 'success');
      } else {
        showAlert(response.data.error || 'Fehler beim Löschen des Joomla-Benutzers', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      showAlert(
        error.response?.data?.error || 'Fehler beim Löschen des Joomla-Benutzers',
        'error'
      );
    } finally {
      setLoading(prev => ({ ...prev, joomlaDelete: false }));
    }
  };

  // ===== UNIFI FUNKTIONEN =====

  // UniFi-Benutzer erstellen
  const handleCreateUnifiUser = async () => {
    setLoading(prev => ({ ...prev, unifiCreate: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/unifi/create/`);
      
      if (response.data.success) {
        showAlert('UniFi-Benutzer erfolgreich erstellt!', 'success');
        // Status aktualisieren
        await checkUnifiStatus();
      } else {
        showAlert(response.data.error || 'Fehler beim Erstellen des UniFi-Benutzers', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      showAlert(
        error.response?.data?.error || 'Fehler beim Erstellen des UniFi-Benutzers',
        'error'
      );
    } finally {
      setLoading(prev => ({ ...prev, unifiCreate: false }));
    }
  };

  // UniFi-Benutzer aktualisieren
  const handleUpdateUnifiUser = async () => {
    setLoading(prev => ({ ...prev, unifiUpdate: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/unifi/update/`);
      
      if (response.data.success) {
        showAlert('UniFi-Benutzer erfolgreich aktualisiert!', 'success');
        // Status aktualisieren
        await checkUnifiStatus();
      } else {
        showAlert(response.data.error || 'Fehler beim Aktualisieren des UniFi-Benutzers', 'error');
      }
    } catch (error) {
      console.error('Fehler:', error);
      showAlert(
        error.response?.data?.error || 'Fehler beim Aktualisieren des UniFi-Benutzers',
        'error'
      );
    } finally {
      setLoading(prev => ({ ...prev, unifiUpdate: false }));
    }
  };

  // UniFi-Benutzer deaktivieren
  const handleDeactivateUnifiUser = async () => {
    // Speichern der aktuellen unifi_id bevor wir deaktivieren
    const currentUnifiId = unifiStatus.unifi_id;
    
    setConfirmDialog({
      open: true,
      type: 'delete',
      service: 'unifi',
      message: 'Möchten Sie den UniFi-Benutzer wirklich deaktivieren? Die Zugangs-ID wird für eine spätere Reaktivierung gespeichert.'
    });
  };

  // UniFi-Benutzer reaktivieren - verbesserte Version
  const handleReactivateUnifiUser = async () => {
    setLoading(prev => ({ ...prev, unifiReactivate: true }));
    
    try {
      const response = await api.post(`/members/${memberId}/unifi/reactivate/`);
      
      if (response.data.success) {
        showAlert('UniFi-Benutzer erfolgreich reaktiviert!', 'success');
        // Status aktualisieren
        await checkUnifiStatus();
      } else {
        // Warnhinweis mit Tipp, wenn dies nicht erfolgreich war
        const errorMessage = response.data.error || 'Fehler beim Reaktivieren des UniFi-Benutzers';
        const tipMessage = response.data.tip || '';
        
        showAlert(`${errorMessage} ${tipMessage}`, 'warning');
        
        // Nach einer Verzögerung Status aktualisieren, um den aktuellen Zustand zu zeigen
        setTimeout(() => checkUnifiStatus(), 1000);
      }
    } catch (error) {
      console.error('Fehler:', error);
      
      let errorMessage = 'Fehler beim Reaktivieren des UniFi-Benutzers';
      let tipMessage = '';
      
      // Spezifischere Fehlermeldung aus Backend extrahieren, falls vorhanden
      if (error.response?.data) {
        errorMessage = error.response.data.error || errorMessage;
        tipMessage = error.response.data.tip || '';
      }
      
      showAlert(`${errorMessage} ${tipMessage}`, 'error');
      
      // Nach einer Verzögerung Status aktualisieren, um den aktuellen Zustand zu zeigen
      setTimeout(() => checkUnifiStatus(), 1000);
    } finally {
      setLoading(prev => ({ ...prev, unifiReactivate: false }));
    }
  };

  // Bestätigte Deaktivierung eines UniFi-Benutzers - verbesserte Version
  const confirmDeactivateUnifiUser = async () => {
    setLoading(prev => ({ ...prev, unifiDelete: true }));
    setConfirmDialog(prev => ({ ...prev, open: false }));
    
    try {
      const response = await api.delete(`/members/${memberId}/unifi/delete/`);
      
      if (response.data.success) {
        // Extrahiere die unifi_id aus der Antwort für spätere Verwendung
        const deactivatedId = response.data.unifi_id;
        
        showAlert('UniFi-Benutzer erfolgreich deaktiviert!', 'success');
        
        // Status temporär auf deaktiviert setzen
        setUnifiStatus(prev => ({
          ...prev,
          isActive: false,
          status: 'DEACTIVATED',
          unifi_id: deactivatedId // ID für spätere Reaktivierung speichern
        }));
        
        // Nach kurzer Verzögerung Status vom Server abfragen
        setTimeout(() => checkUnifiStatus(), 1000);
      } else {
        showAlert(response.data.error || 'Fehler beim Deaktivieren des UniFi-Benutzers', 'error');
        
        // Status aktualisieren
        await checkUnifiStatus();
      }
    } catch (error) {
      console.error('Fehler:', error);
      showAlert(
        error.response?.data?.error || 'Fehler beim Deaktivieren des UniFi-Benutzers',
        'error'
      );
      
      // Status aktualisieren
      await checkUnifiStatus();
    } finally {
      setLoading(prev => ({ ...prev, unifiDelete: false }));
    }
  };

  // Handler für die Bestätigungsaktionen
  const handleConfirmAction = () => {
    const { type, service } = confirmDialog;
    
    if (type === 'delete') {
      if (service === 'joomla') {
        confirmDeleteJoomlaUser();
      } else if (service === 'unifi') {
        confirmDeactivateUnifiUser();
      }
    } else if (type === 'create') {
      if (service === 'joomla') {
        handleCreateJoomlaUser();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 0, mt: 4, bgcolor: 'background.paper', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 1 }}>
      <Accordion 
        expanded={expanded} 
        onChange={() => setExpanded(!expanded)}
        sx={{ 
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            borderBottom: expanded ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudIcon sx={{ mr: 1 }} />
            Externe Dienste und Integrationen
          </Typography>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          {/* Joomla Integration */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
              🌐 Joomla CMS Integration
              <Tooltip title="Das Mitglied wird in der Joomla-Datenbank angelegt und kann sich dort einloggen. Zugriff auf das Mitgliederportal und digitale Dienste." arrow>
                <InfoIcon fontSize="small" sx={{ ml: 1, color: 'rgba(0, 0, 0, 0.6)' }} />
              </Tooltip>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verwalten Sie den Joomla-Benutzer für dieses Mitglied im Mitgliederportal.
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudIcon />}
                  disabled={loading.joomlaCreate}
                  onClick={handleCreateJoomlaUser}
                >
                  {loading.joomlaCreate ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Benutzer erstellen'}
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudSyncIcon />}
                  disabled={loading.joomlaUpdate}
                  onClick={handleUpdateJoomlaUser}
                >
                  {loading.joomlaUpdate ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Daten synchronisieren'}
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<LockResetIcon />}
                  disabled={loading.joomlaPassword}
                  onClick={handleRegenerateJoomlaPassword}
                >
                  {loading.joomlaPassword ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Passwort zurücksetzen'}
                </Button>
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={loading.joomlaDelete}
                  onClick={handleDeleteJoomlaUser}
                >
                  {loading.joomlaDelete ? (
                    <CircularProgress size={24} color="error" />
                  ) : 'Benutzer löschen'}
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* UniFi Integration */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
              🔐 UniFi Access Integration
              <Tooltip title="Das Mitglied erhält Zugangsberechtigung über die UniFi Access Zugangskontrolle. Ermöglicht physischen Zugang zu Räumlichkeiten." arrow>
                <InfoIcon fontSize="small" sx={{ ml: 1, color: 'rgba(0, 0, 0, 0.6)' }} />
              </Tooltip>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verwalten Sie die UniFi Access-Zugangsdaten für dieses Mitglied.
              {unifiStatus.checked && unifiStatus.status && (
                <span style={{ marginLeft: '8px', fontWeight: 'bold', color: unifiStatus.isActive ? '#4caf50' : '#f44336' }}>
                  Status: {unifiStatus.isActive ? 'Aktiv' : 'Deaktiviert'}
                </span>
              )}
            </Typography>
            
            <Grid container spacing={2}>
              {/* Wenn kein Status bekannt ist oder der Status nicht aktiv ist */}
              {(!unifiStatus.checked || !unifiStatus.status || !unifiStatus.isActive) && (
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudIcon />}
                    disabled={loading.unifiCreate || loading.unifiStatus}
                    onClick={handleCreateUnifiUser}
                  >
                    {loading.unifiCreate || loading.unifiStatus ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : 'Zugang erstellen'}
                  </Button>
                </Grid>
              )}
              
              {/* Nur anzeigen, wenn ein UniFi-Benutzer existiert (Status bekannt ist) */}
              {unifiStatus.checked && unifiStatus.status && (
                <>
                  {/* Update-Button immer anzeigen */}
                  <Grid item>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<CloudSyncIcon />}
                      disabled={loading.unifiUpdate || loading.unifiStatus}
                      onClick={handleUpdateUnifiUser}
                    >
                      {loading.unifiUpdate || loading.unifiStatus ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : 'Daten synchronisieren'}
                    </Button>
                  </Grid>
                  
                  {/* Je nach Status den passenden Button anzeigen */}
                  <Grid item>
                    {unifiStatus.isActive ? (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CloudOffIcon />}
                        disabled={loading.unifiDelete || loading.unifiStatus}
                        onClick={handleDeactivateUnifiUser}
                      >
                        {loading.unifiDelete || loading.unifiStatus ? (
                          <CircularProgress size={24} color="error" />
                        ) : 'Zugang deaktivieren'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<CloudDoneIcon />}
                        disabled={loading.unifiReactivate || loading.unifiStatus}
                        onClick={handleReactivateUnifiUser}
                      >
                        {loading.unifiReactivate || loading.unifiStatus ? (
                          <CircularProgress size={24} color="success" />
                        ) : 'Zugang aktivieren'}
                      </Button>
                    )}
                  </Grid>
                </>
              )}
              
              {/* Status-Prüfung-Button, falls der Bereich geöffnet ist */}
              {expanded && (
                <Grid item>
                  <Button
                    variant="text"
                    color="info"
                    startIcon={loading.unifiStatus ? <CircularProgress size={16} /> : <InfoIcon />}
                    disabled={loading.unifiStatus}
                    onClick={checkUnifiStatus}
                  >
                    Status prüfen
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Benachrichtigungen */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
      
      {/* Passwort-Dialog */}
      <Dialog
        open={passwordDialog.open}
        onClose={() => setPasswordDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Passwort-Information
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Bitte notieren Sie das Passwort oder teilen Sie es dem Mitglied direkt mit:
          </Typography>
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Benutzername:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={passwordDialog.username}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(passwordDialog.username)}
                    startIcon={<ContentCopyIcon />}
                  >
                    Kopieren
                  </Button>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Passwort:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={passwordDialog.password}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(passwordDialog.password)}
                    startIcon={<ContentCopyIcon />}
                  >
                    Kopieren
                  </Button>
                ),
              }}
            />
          </Box>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aus Sicherheitsgründen wird das Passwort nur einmal angezeigt. Es wurde jedoch in der Datenbank für dieses Mitglied gespeichert.
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPasswordDialog(prev => ({ ...prev, open: false }))}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bestätigungs-Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle sx={{ 
          bgcolor: confirmDialog.type === 'delete' ? 'error.main' : 'primary.main', 
          color: 'white'
        }}>
          {confirmDialog.type === 'delete' ? 'Löschen bestätigen' : 'Aktion bestätigen'}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmAction}
          >
            {confirmDialog.type === 'delete' ? 'Löschen' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExternalIntegration;