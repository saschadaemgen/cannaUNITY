// frontend/src/apps/controller/pages/MQTTTerminal/MQTTTerminalPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Chip, 
  CircularProgress, Fade, TextField, IconButton, Divider,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Tooltip, Accordion, AccordionSummary, 
  AccordionDetails, Alert, Snackbar
} from '@mui/material';
import { useTheme, alpha, styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { format } from 'date-fns';
import api from '@/utils/api';

// Styled Components
const MQTTConsole = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.common.black, 0.9),
  color: theme.palette.common.white,
  fontFamily: 'Courier New, monospace',
  fontSize: '0.9rem',
  padding: theme.spacing(2),
  overflow: 'auto',
  height: 400,
  whiteSpace: 'pre-wrap',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.common.white, 0.2),
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  }
}));

// Message types and their colors
const MESSAGE_TYPES = {
  COMMAND: { label: 'COMMAND', color: '#2196f3' },
  RESPONSE: { label: 'RESPONSE', color: '#4caf50' },
  STATUS: { label: 'STATUS', color: '#ff9800' },
  TELEMETRY: { label: 'TELEMETRY', color: '#9c27b0' },
  SYSTEM: { label: 'SYSTEM', color: '#607d8b' },
  ERROR: { label: 'ERROR', color: '#f44336' }
};

// Predefined command templates
const COMMAND_TEMPLATES = [
  {
    name: 'Manuelle Bewässerung',
    topic: 'controller/irrigation/{controller_id}/command',
    payload: {
      action: 'manual_irrigation',
      parameters: {
        duration: 5,
        intensity: 100
      }
    }
  },
  {
    name: 'Notfall-Stopp (Bewässerung)',
    topic: 'controller/irrigation/{controller_id}/command',
    payload: {
      action: 'emergency_stop',
      parameters: {
        status: true
      }
    }
  },
  {
    name: 'Lichtsteuerung',
    topic: 'controller/light/{controller_id}/command',
    payload: {
      action: 'manual_light_control',
      parameters: {
        intensity: 75,
        duration: 60,
        spectrum_red: 80,
        spectrum_blue: 100
      }
    }
  },
  {
    name: 'Notfall-Aus (Licht)',
    topic: 'controller/light/{controller_id}/command',
    payload: {
      action: 'emergency_off',
      parameters: {
        status: true
      }
    }
  },
  {
    name: 'Zyklustagwechsel',
    topic: 'controller/light/{controller_id}/command',
    payload: {
      action: 'advance_cycle_day',
      parameters: {}
    }
  },
  {
    name: 'Status abfragen',
    topic: 'controller/{controller_type}/{controller_id}/query',
    payload: {
      action: 'get_status'
    }
  }
];

// Simple syntax highlighter for JSON
const JsonHighlighter = ({ json }) => {
  const theme = useTheme();
  
  if (typeof json !== 'object') {
    return <Typography sx={{ color: theme.palette.common.white }}>{String(json)}</Typography>;
  }
  
  try {
    const formattedJson = JSON.stringify(json, null, 2);
    
    // Very basic syntax highlighting with regex
    const highlighted = formattedJson
      .replace(/"([^"]+)":/g, '<span style="color: #f92672;">"$1":</span>') // keys
      .replace(/"([^"]+)"/g, '<span style="color: #fd971f;">"$1"</span>') // strings
      .replace(/\b(true|false)\b/g, '<span style="color: #ae81ff;">$1</span>') // booleans
      .replace(/\b(\d+)\b/g, '<span style="color: #a6e22e;">$1</span>'); // numbers
    
    return (
      <Box
        sx={{ ml: 1 }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  } catch (error) {
    return <Typography sx={{ color: theme.palette.common.white }}>{JSON.stringify(json)}</Typography>;
  }
};

/**
 * MQTT Terminal für direkte Interaktion mit den Controllern
 */
export default function MQTTTerminalPage() {
  const theme = useTheme();
  const consoleRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [topic, setTopic] = useState('controller/#');
  const [payload, setPayload] = useState(JSON.stringify({ action: 'get_status' }, null, 2));
  const [savedCommands, setSavedCommands] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [controllers, setControllers] = useState({
    irrigation: [],
    light: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'disconnected',
    message: 'Nicht verbunden'
  });
  
  // Controller-Daten laden
  const loadControllers = useCallback(async () => {
    try {
      // Bewässerungscontroller laden
      const irrigationRes = await api.get('/api/controller/irrigation/');
      
      // Lichtcontroller laden
      const lightRes = await api.get('/api/controller/light/');
      
      setControllers({
        irrigation: irrigationRes.data.results || [],
        light: lightRes.data.results || []
      });
      
    } catch (error) {
      console.error('Fehler beim Laden der Controller:', error);
      showSnackbar('Fehler beim Laden der Controller', 'error');
    }
  }, []);
  
  // MQTT-Client-Verbindung verwalten
  useEffect(() => {
    let mqttClient = null;
    
    const connectToMQTT = async () => {
      setLoading(true);
      setConnectionStatus({
        status: 'connecting',
        message: 'Verbindung wird hergestellt...'
      });
      
      try {
        // MQTT-Client-Konfiguration vom Backend abrufen
        const configRes = await api.get('/api/mqtt/config/');
        const config = configRes.data;
        
        // Gespeicherte Befehle aus dem localStorage laden
        const savedCmds = localStorage.getItem('mqtt_saved_commands');
        if (savedCmds) {
          setSavedCommands(JSON.parse(savedCmds));
        }
        
        // Simulierte Verbindung (in einer echten Anwendung würde hier die MQTT-Verbindung aufgebaut werden)
        setTimeout(() => {
          setConnected(true);
          setConnectionStatus({
            status: 'connected',
            message: 'Verbunden mit MQTT-Broker'
          });
          
          // Systemmeldung hinzufügen
          addMessage('SYSTEM', `Verbunden mit MQTT-Broker (${config.host}:${config.port})`, null);
          addMessage('SYSTEM', `Abonniere Topic: ${topic}`, null);
          setLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Fehler beim Verbinden mit MQTT:', error);
        setConnectionStatus({
          status: 'error',
          message: 'Verbindungsfehler: ' + (error.message || 'Unbekannter Fehler')
        });
        addMessage('ERROR', `Verbindungsfehler: ${error.message || 'Unbekannter Fehler'}`, null);
        setLoading(false);
      }
    };
    
    // Verbinden und Controller laden
    connectToMQTT();
    loadControllers();
    
    // Simulierte zufällige MQTT-Nachrichten (nur für die Demo)
    const interval = setInterval(() => {
      if (connected) {
        // Zufällige Telemetrie-Nachrichten simulieren
        const randomController = Math.random() > 0.5 ? 'irrigation' : 'light';
        const controllerId = randomController === 'irrigation' 
          ? (controllers.irrigation[0]?.id || 'unknown')
          : (controllers.light[0]?.id || 'unknown');
        
        const randomTopic = `controller/${randomController}/${controllerId}/telemetry`;
        
        let randomPayload;
        if (randomController === 'irrigation') {
          randomPayload = {
            timestamp: new Date().toISOString(),
            status: {
              connected: true,
              water_level: Math.floor(Math.random() * 100),
              pump_active: Math.random() > 0.7,
              soil_moisture: Math.floor(Math.random() * 100)
            },
            resources: {
              water: {
                amount: Math.random() * 2,
                timestamp: new Date().toISOString()
              }
            }
          };
        } else {
          randomPayload = {
            timestamp: new Date().toISOString(),
            status: {
              connected: true,
              light_active: Math.random() > 0.3,
              intensity: Math.floor(Math.random() * 100),
              spectrum_red: Math.floor(Math.random() * 100),
              spectrum_blue: Math.floor(Math.random() * 100)
            },
            resources: {
              electricity: {
                amount: Math.random() * 0.5,
                timestamp: new Date().toISOString()
              }
            }
          };
        }
        
        // Nur manchmal Nachrichten hinzufügen (um keine Überflutung zu verursachen)
        if (Math.random() > 0.7) {
          addMessage('TELEMETRY', randomPayload, randomTopic);
        }
      }
    }, 5000);
    
    // Aufräumen
    return () => {
      clearInterval(interval);
      
      if (mqttClient) {
        setConnected(false);
        addMessage('SYSTEM', 'Verbindung getrennt', null);
      }
    };
  }, [controllers, loadControllers, topic]);
  
  // Auto-Scroll zur letzten Nachricht
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  // Neue Nachricht hinzufügen
  const addMessage = (type, payload, messageTopic) => {
    const newMessage = {
      id: Date.now(),
      timestamp: new Date(),
      type,
      topic: messageTopic,
      payload
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  // Nachricht senden
  const sendMessage = () => {
    if (!connected) {
      showSnackbar('Nicht mit MQTT-Broker verbunden', 'error');
      return;
    }
    
    try {
      // Payload validieren
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (error) {
        showSnackbar('Ungültiges JSON-Format', 'error');
        return;
      }
      
      // Aktuelle Zeit und Request-ID hinzufügen, falls nicht vorhanden
      if (!parsedPayload.timestamp) {
        parsedPayload.timestamp = new Date().toISOString();
      }
      
      if (!parsedPayload.request_id) {
        parsedPayload.request_id = Date.now().toString();
      }
      
      // Nachricht simulieren (in einer echten Anwendung würde hier eine Nachricht gesendet werden)
      const finalPayload = parsedPayload;
      
      // Nachricht zum Protokoll hinzufügen
      addMessage('COMMAND', finalPayload, topic);
      
      // JSON im Textfeld aktualisieren
      setPayload(JSON.stringify(finalPayload, null, 2));
      
      // Simulierte Antwort nach kurzer Verzögerung
      setTimeout(() => {
        const responsePayload = {
          request_id: finalPayload.request_id,
          timestamp: new Date().toISOString(),
          success: Math.random() > 0.2, // 20% Fehlerchance simulieren
          message: Math.random() > 0.2 ? 'Befehl erfolgreich ausgeführt' : 'Fehler bei der Ausführung',
          data: {}
        };
        
        // Antwort-Topic generieren
        const responseTopic = topic.replace('/command', '/response');
        
        // Antwort zum Protokoll hinzufügen
        addMessage(
          responsePayload.success ? 'RESPONSE' : 'ERROR', 
          responsePayload, 
          responseTopic
        );
        
      }, 500 + Math.random() * 1000); // Zufällige Verzögerung
      
    } catch (error) {
      showSnackbar(`Fehler beim Senden der Nachricht: ${error.message}`, 'error');
    }
  };
  
  // Vorlage auswählen
  const handleSelectTemplate = (event) => {
    const templateName = event.target.value;
    setSelectedTemplate(templateName);
    
    if (!templateName) return;
    
    // Vorlage suchen
    const template = [...COMMAND_TEMPLATES, ...savedCommands].find(t => t.name === templateName);
    
    if (template) {
      // Controller-ID einfügen, wenn verfügbar und nötig
      let topicValue = template.topic;
      
      if (topicValue.includes('{controller_id}')) {
        // Ersten verfügbaren Controller verwenden
        const controllersArray = 
          topicValue.includes('irrigation') ? controllers.irrigation : 
          topicValue.includes('light') ? controllers.light : [];
        
        const controllerId = controllersArray[0]?.id || 'unknown';
        topicValue = topicValue.replace('{controller_id}', controllerId);
      }
      
      if (topicValue.includes('{controller_type}')) {
        // Controller-Typ vom Benutzer auswählen lassen oder Standard verwenden
        topicValue = topicValue.replace('{controller_type}', 'irrigation');
      }
      
      setTopic(topicValue);
      
      // Aktuelle Zeit und Request-ID einfügen
      const payloadWithTimestamp = {
        ...template.payload,
        timestamp: new Date().toISOString(),
        request_id: Date.now().toString()
      };
      
      setPayload(JSON.stringify(payloadWithTimestamp, null, 2));
    }
  };
  
  // Befehl speichern
  const saveCommand = () => {
    // Dialog zum Speichern öffnen
    const commandName = prompt('Name für den gespeicherten Befehl:', 'Mein Befehl');
    
    if (!commandName) return;
    
    try {
      // Payload validieren
      const parsedPayload = JSON.parse(payload);
      
      // Zeitstempel und Request-ID entfernen
      const cleanPayload = { ...parsedPayload };
      delete cleanPayload.timestamp;
      delete cleanPayload.request_id;
      
      // Neuen Befehl erstellen
      const newCommand = {
        name: commandName,
        topic,
        payload: cleanPayload
      };
      
      // Zu gespeicherten Befehlen hinzufügen
      const updatedCommands = [...savedCommands, newCommand];
      setSavedCommands(updatedCommands);
      
      // Im localStorage speichern
      localStorage.setItem('mqtt_saved_commands', JSON.stringify(updatedCommands));
      
      showSnackbar('Befehl erfolgreich gespeichert', 'success');
    } catch (error) {
      showSnackbar(`Fehler beim Speichern: ${error.message}`, 'error');
    }
  };
  
  // Gespeicherten Befehl löschen
  const deleteCommand = (commandName) => {
    if (window.confirm(`Möchten Sie den Befehl "${commandName}" wirklich löschen?`)) {
      // Befehl aus der Liste entfernen
      const updatedCommands = savedCommands.filter(cmd => cmd.name !== commandName);
      setSavedCommands(updatedCommands);
      
      // Im localStorage aktualisieren
      localStorage.setItem('mqtt_saved_commands', JSON.stringify(updatedCommands));
      
      // Wenn aktuell ausgewählte Vorlage gelöscht wurde, zurücksetzen
      if (selectedTemplate === commandName) {
        setSelectedTemplate('');
      }
      
      showSnackbar('Befehl erfolgreich gelöscht', 'success');
    }
  };
  
  // Konsole löschen
  const clearConsole = () => {
    if (window.confirm('Möchten Sie alle Konsolennachrichten löschen?')) {
      setMessages([]);
      addMessage('SYSTEM', 'Konsole gelöscht', null);
    }
  };
  
  // Snackbar anzeigen
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Formatierte Nachricht für die Konsole
  const formatMessage = (message) => {
    const { timestamp, type, topic, payload } = message;
    const typeConfig = MESSAGE_TYPES[type] || MESSAGE_TYPES.SYSTEM;
    
    return (
      <Box key={message.id} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography 
            component="span" 
            sx={{ 
              color: alpha(theme.palette.common.white, 0.7),
              mr: 1,
              fontSize: '0.85rem'
            }}
          >
            {format(timestamp, 'HH:mm:ss.SSS')}
          </Typography>
          
          <Chip 
            label={typeConfig.label} 
            size="small" 
            sx={{ 
              backgroundColor: alpha(typeConfig.color, 0.2),
              color: typeConfig.color,
              height: 20,
              fontSize: '0.7rem',
              mr: 1
            }}
          />
          
          {topic && (
            <Typography 
              component="span" 
              sx={{ 
                color: alpha(theme.palette.common.white, 0.9),
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}
            >
              {topic}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mt: 0.5, ml: 2 }}>
          <JsonHighlighter json={payload} />
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 0 }}>
                MQTT Terminal
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Direkte Kommunikation mit Ihren Controllern über MQTT
              </Typography>
            </Box>
            
            <Box>
              <Chip 
                label={connectionStatus.message}
                color={
                  connectionStatus.status === 'connected' ? 'success' :
                  connectionStatus.status === 'connecting' ? 'warning' :
                  connectionStatus.status === 'error' ? 'error' : 'default'
                }
                sx={{ mr: 2 }}
              />
              
              <Button 
                variant={connected ? "outlined" : "contained"}
                color={connected ? "error" : "primary"}
                startIcon={connected ? <StopIcon /> : <PlayArrowIcon />}
                onClick={() => {
                  if (connected) {
                    setConnected(false);
                    setConnectionStatus({
                      status: 'disconnected',
                      message: 'Nicht verbunden'
                    });
                    addMessage('SYSTEM', 'Verbindung getrennt', null);
                  } else {
                    setConnectionStatus({
                      status: 'connecting',
                      message: 'Verbindung wird hergestellt...'
                    });
                    // Verbindung simulieren
                    setTimeout(() => {
                      setConnected(true);
                      setConnectionStatus({
                        status: 'connected',
                        message: 'Verbunden mit MQTT-Broker'
                      });
                      addMessage('SYSTEM', 'Verbindung hergestellt', null);
                    }, 1000);
                  }
                }}
              >
                {connected ? 'Verbindung trennen' : 'Verbinden'}
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {/* Linke Spalte: Message Console */}
            <Grid item xs={12} md={7}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    p: 1.5, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'medium',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FormatListBulletedIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    MQTT Nachrichtenprotokoll
                  </Typography>
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch 
                          size="small" 
                          checked={autoScroll} 
                          onChange={(e) => setAutoScroll(e.target.checked)}
                        />
                      }
                      label="Auto-Scroll"
                      sx={{ mr: 1 }}
                    />
                    
                    <Tooltip title="Protokoll löschen">
                      <IconButton 
                        size="small" 
                        onClick={clearConsole}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <MQTTConsole ref={consoleRef}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress color="inherit" size={24} sx={{ mr: 2 }} />
                      <Typography>Verbindung wird hergestellt...</Typography>
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%',
                        color: alpha(theme.palette.common.white, 0.6)
                      }}
                    >
                      <InfoIcon sx={{ fontSize: 40, mb: 2 }} />
                      <Typography>Keine Nachrichten vorhanden</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Senden Sie eine Nachricht oder warten Sie auf eingehende Nachrichten
                      </Typography>
                    </Box>
                  ) : (
                    messages.map(message => formatMessage(message))
                  )}
                </MQTTConsole>
              </Paper>
            </Grid>
            
            {/* Rechte Spalte: Message Control */}
            <Grid item xs={12} md={5}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  NACHRICHT SENDEN
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Befehlsvorlage</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={handleSelectTemplate}
                      label="Befehlsvorlage"
                    >
                      <MenuItem value="">
                        <em>Keine Vorlage auswählen</em>
                      </MenuItem>
                      <MenuItem value="" disabled>
                        <strong>Standardbefehle</strong>
                      </MenuItem>
                      {COMMAND_TEMPLATES.map((template, index) => (
                        <MenuItem key={`template-${index}`} value={template.name}>
                          {template.name}
                        </MenuItem>
                      ))}
                      
                      {savedCommands.length > 0 && (
                        <MenuItem value="" disabled>
                          <strong>Gespeicherte Befehle</strong>
                        </MenuItem>
                      )}
                      
                      {savedCommands.map((command, index) => (
                        <MenuItem 
                          key={`saved-${index}`} 
                          value={command.name}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{command.name}</span>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCommand(command.name);
                            }}
                            sx={{ 
                              ml: 1,
                              visibility: 'hidden',
                              '.MuiMenuItem-root:hover &': {
                                visibility: 'visible'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Topic"
                    fullWidth
                    size="small"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Payload (JSON)"
                    fullWidth
                    multiline
                    rows={8}
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    sx={{ 
                      mb: 2,
                      fontFamily: 'monospace',
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace'
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<SaveIcon />}
                      onClick={saveCommand}
                    >
                      Speichern
                    </Button>
                    
                    <Button 
                      variant="contained" 
                      startIcon={<SendIcon />}
                      onClick={sendMessage}
                      disabled={!connected}
                    >
                      Senden
                    </Button>
                  </Box>
                </Box>
              </Paper>
              
              <Accordion 
                variant="outlined"
                sx={{ 
                  borderRadius: '8px !important',
                  '&:before': {
                    display: 'none'
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                    MQTT-Hilfe und Informationen
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" gutterBottom>
                    Beispiel-Topics
                  </Typography>
                  <Box 
                    component="ul" 
                    sx={{ 
                      pl: 2,
                      mb: 2,
                      '& li': {
                        mb: 0.5
                      }
                    }}
                  >
                    <li><code>controller/irrigation/{'{controller_id}'}/command</code> - Befehle an Bewässerungscontroller</li>
                    <li><code>controller/light/{'{controller_id}'}/command</code> - Befehle an Lichtcontroller</li>
                    <li><code>controller/+/+/status</code> - Status aller Controller</li>
                    <li><code>controller/#</code> - Alle Controller-Nachrichten</li>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    JSON-Payloads
                  </Typography>
                  <Typography variant="body2" paragraph>
                    JSON-Payloads müssen gültiges JSON sein und sollten mindestens ein "action"-Feld enthalten.
                    Die Felder "timestamp" und "request_id" werden automatisch hinzugefügt, wenn sie nicht vorhanden sind.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Hinweis: In einer realen Umgebung würden die Nachrichten mit dem tatsächlichen MQTT-Broker kommunizieren. 
                    In dieser Demo-Version werden die Antworten simuliert.
                  </Alert>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
          
          {/* Snackbar für Benachrichtigungen */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity} 
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
}