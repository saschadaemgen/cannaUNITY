// frontend/src/apps/controller/components/dashboard/Dashboard.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';

/**
 * Endgültig optimiertes Dashboard nach allen Anforderungen:
 * - Systemstatus jetzt in der Mitte der oberen Reihe
 * - Ressourcenmonitor nach unten in die zweite Reihe verschoben
 * - Einheitliche Größe aller Karten pro Reihe (5x5 Layout)
 * - Titelhervorhebung ohne zusätzliche Linien
 * - Optimierte Kartenanordnung für bessere visuelle Balance
 */
const Dashboard = ({ 
  irrigationControllers = [], 
  lightingControllers = [],
  systemStatus = {},
  resourceData = {
    waterToday: 0,
    energyToday: 0,
    waterTotal: 0,
    energyTotal: 0,
    waterUsageHistory: []
  },
  alerts = [],
  activeControllers = []
}) => {
  const navigate = useNavigate();
  
  // Hilfsfunktion zum Navigieren
  const navigateToIrrigationController = () => navigate('/controllers/irrigation');
  const navigateToLightController = () => navigate('/controllers/lighting');
  const navigateToClimateController = () => navigate('/controllers/climate');
  const navigateToFertilizerController = () => navigate('/controllers/fertilizer');

  // Berechne aktiven/verbundenen Status
  const irrigationActive = irrigationControllers.filter(c => c.is_active).length;
  const irrigationConnected = irrigationControllers.filter(c => c.is_connected).length;
  const lightingActive = lightingControllers.filter(c => c.is_active).length;
  const lightingConnected = lightingControllers.filter(c => c.is_connected).length;
  
  // Gemeinsamer Kartenstil mit verstärktem Schatten und Rand
  const commonCardStyle = {
    flex: 1, 
    minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(16.666% - 14px)' },
    backgroundColor: '#effaf1', 
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  };
  
  // Stil für Kartentitel - verstärkte Hervorhebung ohne Linie
  const cardTitleStyle = {
    fontWeight: 'bold', 
    color: 'rgb(56, 142, 60)',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)'
  };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Dashboard Titel */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'rgb(56, 142, 60)', fontWeight: 'medium' }}>
          Grow Controller Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Echzeit-Überwachung der Bewässerungs- und Lichtsteuerungssysteme
        </Typography>
      </Box>
      
      {/* Erste Reihe - 5 Karten mit exakt gleicher Größe (ohne Ressourcenmonitor) */}
      <Box 
        sx={{ 
          display: 'flex', 
          mb: 3, 
          gap: '16px',
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}
      >
        {/* Bewässerungssteuerung */}
        <Box sx={{
          ...commonCardStyle,
          minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' }
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              BEWÄSSERUNGSSTEUERUNG
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {irrigationControllers.length} Controller konfiguriert
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {/* Aktiv */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Aktiv</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {irrigationActive} von {irrigationControllers.length} 
                  ({irrigationControllers.length > 0 
                    ? Math.round((irrigationActive / irrigationControllers.length) * 100) 
                    : 0}%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${irrigationControllers.length ? 
                    (irrigationActive / irrigationControllers.length) * 100 : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Verbunden */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Verbunden</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {irrigationConnected} von {irrigationControllers.length}
                  ({irrigationControllers.length > 0 
                    ? Math.round((irrigationConnected / irrigationControllers.length) * 100)
                    : 0}%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${irrigationControllers.length ? 
                    (irrigationConnected / irrigationControllers.length) * 100 : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Verbrauch heute */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Verbrauch heute</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  {(resourceData?.waterToday || 0).toFixed(1)} l
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Letzter Zyklus</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  0.85 l / 2 min
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Wasserdurchfluss</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  14.2 l/min
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                onClick={navigateToIrrigationController}
                sx={{ 
                  color: 'rgb(56, 142, 60)', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Details anzeigen →
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* NEUE DÜNGER COMPUTER KACHEL */}
        <Box sx={{
          ...commonCardStyle,
          minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' }
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              DÜNGER COMPUTER
            </Typography>
            <Typography variant="body2" color="text.secondary">
              5 Nährstofftanks aktiv
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {/* Aktiv */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Aktiv</Typography>
                <Typography variant="body2" fontWeight="bold">
                  5 von 6 (83%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '83%',
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Füllstand */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Ø Füllstand</Typography>
                <Typography variant="body2" fontWeight="bold">
                  78%
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '78%',
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Status */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Aktuelles Rezept</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  VegGrow 2.0
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">pH-Wert</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  6.2
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">EC-Wert</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  1.8 mS/cm
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                onClick={navigateToFertilizerController}
                sx={{ 
                  color: 'rgb(56, 142, 60)', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Details anzeigen →
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Systemstatus - JETZT IN DER MITTE */}
        <Box sx={{
          ...commonCardStyle,
          minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' }
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              SYSTEMSTATUS
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Aktuelle Betriebszustände
            </Typography>
            
            {/* Systemverfügbarkeit */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Systemverfügbarkeit</Typography>
              <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                {systemStatus?.uptime || '99.8%'}
              </Typography>
            </Box>
            
            {/* MQTT-Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">MQTT-Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: 'rgb(76, 175, 80)',
                    mr: 1
                  }} 
                />
                <Typography variant="body2" fontWeight="bold">
                  {systemStatus?.mqttStatus || 'Verbunden'}
                </Typography>
              </Box>
            </Box>
            
            {/* Antwortzeit */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Antwortzeit</Typography>
              <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                {systemStatus?.responseTime || '45ms'}
              </Typography>
            </Box>
            
            {/* Letzte Synchronisation */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 2,
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              pt: 2
            }}>
              <Typography variant="body2">Letzte Synchronisation</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SyncIcon sx={{ fontSize: 14, mr: 0.5, color: 'rgb(56, 142, 60)' }} />
                <Typography variant="caption" color="text.secondary">
                  {systemStatus?.lastSync 
                    ? new Date(systemStatus.lastSync).toLocaleString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      }) 
                    : '13.05.2025 22:00:01'}
                </Typography>
              </Box>
            </Box>
            
            {/* Aktive Warnungen */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Typography variant="body2">Aktive Warnungen</Typography>
              <Typography variant="body2" fontWeight="bold" color={alerts.length > 0 ? 'orange' : 'rgb(56, 142, 60)'}>
                {alerts.length}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Lichtsteuerung */}
        <Box sx={{
          ...commonCardStyle,
          minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' }
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              LICHTSTEUERUNG
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lightingControllers.length} Controller konfiguriert
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {/* Aktiv */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Aktiv</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {lightingActive} von {lightingControllers.length}
                  ({lightingControllers.length > 0 
                    ? Math.round((lightingActive / lightingControllers.length) * 100)
                    : 0}%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${lightingControllers.length ? 
                    (lightingActive / lightingControllers.length) * 100 : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Verbunden */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Verbunden</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {lightingConnected} von {lightingControllers.length}
                  ({lightingControllers.length > 0 
                    ? Math.round((lightingConnected / lightingControllers.length) * 100)
                    : 0}%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${lightingControllers.length ? 
                    (lightingConnected / lightingControllers.length) * 100 : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Status */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Verbrauch heute</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  {(resourceData?.energyToday || 0).toFixed(1)} kWh
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Aktuelle Leistung</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  420 W
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Zyklus-Phase</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  Blüte (Tag 18)
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                onClick={navigateToLightController}
                sx={{ 
                  color: 'rgb(56, 142, 60)', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Details anzeigen →
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Klimasteuerung */}
        <Box sx={{
          ...commonCardStyle,
          minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' }
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              KLIMASTEUERUNG
            </Typography>
            <Typography variant="body2" color="text.secondary">
              2 Controller konfiguriert
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {/* Aktiv */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Aktiv</Typography>
                <Typography variant="body2" fontWeight="bold">
                  2 von 2 (100%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '100%',
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Verbunden */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Verbunden</Typography>
                <Typography variant="body2" fontWeight="bold">
                  2 von 2 (100%)
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '100%',
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            
            {/* Status */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Verbrauch heute</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  3.2 kWh
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Aktuelle Leistung</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  180 W
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Betriebsstunden</Typography>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  17.5 h
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                onClick={navigateToClimateController}
                sx={{ 
                  color: 'rgb(56, 142, 60)', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Details anzeigen →
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Zweite Reihe - 5 Karten mit exakt gleicher Größe*/}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: '16px',
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}
      >
      {/* Ressourcenmonitor - verschoben in die untere Zeile */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' },
            backgroundColor: '#effaf1', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              RESSOURCENMONITOR
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wasser- und Energieverbrauch
            </Typography>
            
            {/* Wasser heute */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <OpacityIcon sx={{ mr: 0.5, color: 'rgb(56, 142, 60)', fontSize: 16 }} />
                  <Typography variant="body2">Wasser (heute)</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  {(resourceData?.waterToday || 0).toFixed(1)} l
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${resourceData?.waterTotal ? 
                    Math.min((resourceData.waterToday / resourceData.waterTotal) * 100, 100) : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                {resourceData?.waterTotal ? 
                  ((resourceData.waterToday / resourceData.waterTotal) * 100).toFixed(1) : 0}% des Monatsverbrauchs
              </Typography>
            </Box>
            
            {/* Energie heute */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WbSunnyIcon sx={{ mr: 0.5, color: 'rgb(56, 142, 60)', fontSize: 16 }} />
                  <Typography variant="body2">Energie (heute)</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                  {(resourceData?.energyToday || 0).toFixed(1)} kWh
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 4, 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${resourceData?.energyTotal ? 
                    Math.min((resourceData.energyToday / resourceData.energyTotal) * 100, 100) : 0}%`,
                  backgroundColor: 'rgb(76, 175, 80)',
                  borderRadius: 4
                }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                {resourceData?.energyTotal ? 
                  ((resourceData.energyToday / resourceData.energyTotal) * 100).toFixed(1) : 0}% des Monatsverbrauchs
              </Typography>
            </Box>
            
            {/* Gesamtverbrauch */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Wasser gesamt
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                    {(resourceData?.waterTotal || 0).toFixed(1)} l
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Monatsverbrauch Wasser
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                    {(resourceData?.waterTotal * 0.75 || 0).toFixed(1)} l
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Energie gesamt
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                    {(resourceData?.energyTotal || 0).toFixed(1)} kWh
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Monatsverbrauch Energie
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                    {(resourceData?.energyTotal * 0.82 || 0).toFixed(1)} kWh
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Wasserverbrauch Chart */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' },
            backgroundColor: '#effaf1', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              WASSERVERBRAUCH (LETZTE 7 TAGE)
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {resourceData?.waterUsageHistory && resourceData.waterUsageHistory.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {resourceData.waterUsageHistory.map((item, index) => {
                  // Berechne den max. Wert für die relative Skalierung
                  const maxValue = Math.max(...resourceData.waterUsageHistory.map(d => d.value || 0));
                  const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                  
                  return (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                          {(item.value || 0).toFixed(1)} l
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        height: 8, 
                        backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                        borderRadius: 4, 
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: 'rgb(76, 175, 80)',
                          borderRadius: 4
                        }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 8 }}>
                Keine Verbrauchsdaten verfügbar
              </Typography>
            )}
            
            {/* Statistik-Zusammenfassung */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gesamt
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  {resourceData?.waterUsageHistory ? 
                    resourceData.waterUsageHistory.reduce((sum, item) => sum + (item.value || 0), 0).toFixed(1) : 
                    '0.0'} l
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Durchschnitt
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  {resourceData?.waterUsageHistory && resourceData.waterUsageHistory.length > 0 ? 
                    (resourceData.waterUsageHistory.reduce((sum, item) => sum + (item.value || 0), 0) / 
                      resourceData.waterUsageHistory.length).toFixed(1) : 
                    '0.0'} l
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Maximum
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  {resourceData?.waterUsageHistory && resourceData.waterUsageHistory.length > 0 ? 
                    Math.max(...resourceData.waterUsageHistory.map(item => item.value || 0)).toFixed(1) : 
                    '0.0'} l
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Energie-Chart */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' },
            backgroundColor: '#effaf1', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              ENERGIEVERBRAUCH (LETZTE 7 TAGE)
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {/* Simulierte Energieverbrauchsdaten für 7 Tage */}
              {[
                { name: 'Mo', value: 1.7 },
                { name: 'Di', value: 1.9 },
                { name: 'Mi', value: 2.2 },
                { name: 'Do', value: 1.8 },
                { name: 'Fr', value: 2.3 },
                { name: 'Sa', value: 1.5 },
                { name: 'So', value: 1.4 }
              ].map((item, index) => {
                // Berechne den max. Wert für die relative Skalierung
                const maxValue = 2.3; // Höchster Wert in den Daten
                const percentage = (item.value / maxValue) * 100;
                
                return (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.name}</Typography>
                      <Typography variant="body2" fontWeight="bold" color="rgb(56, 142, 60)">
                        {item.value.toFixed(1)} kWh
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      height: 8, 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                      borderRadius: 4, 
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: 'rgb(76, 175, 80)',
                        borderRadius: 4
                      }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {/* Statistik-Zusammenfassung */}
            <Box sx={{ 
              mt: 'auto', 
              pt: 2, 
              borderTop: '1px dashed rgba(76, 175, 80, 0.2)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gesamt
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  12.8 kWh
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Durchschnitt
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  1.83 kWh
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Maximum
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="rgb(56, 142, 60)">
                  2.3 kWh
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Aktive Controller */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' },
            backgroundColor: '#effaf1', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              AKTIVE CONTROLLER
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {activeControllers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 8 }}>
                Keine aktiven Controller gefunden
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeControllers.map(controller => {
                  const isIrrigation = controller.controller_type === 'irrigation';
                  const isLight = controller.controller_type === 'light';
                  
                  // Controller-spezifische Daten bestimmen
                  let progressValue = 0;
                  let progressLabel = isIrrigation ? 'Wasserverbrauch' : 'Intensität';
                  let progressText = '';
                  
                  if (isIrrigation && controller.status?.current_schedule) {
                    progressValue = controller.status.current_schedule.progress || 0;
                    progressText = `${controller.status.current_schedule.volume || 0} l`;
                  } else if (isLight && controller.status?.current_light_state) {
                    progressValue = controller.status.current_light_state.intensity || 0;
                    progressText = `${progressValue}%`;
                  }
                  
                  return (
                    <Box 
                      key={controller.id} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid rgba(76, 175, 80, 0.1)', 
                        borderRadius: 1,
                        backgroundColor: '#fff',
                        '&:hover': { 
                          boxShadow: '0 0 5px rgba(76, 175, 80, 0.2)',
                          cursor: 'pointer' 
                        }
                      }}
                      onClick={() => isIrrigation ? navigateToIrrigationController() : navigateToLightController()}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isIrrigation ? (
                            <OpacityIcon sx={{ mr: 0.5, color: 'rgb(56, 142, 60)', fontSize: 16 }} />
                          ) : (
                            <WbSunnyIcon sx={{ mr: 0.5, color: 'rgb(56, 142, 60)', fontSize: 16 }} />
                          )}
                          <Typography variant="body2" fontWeight="medium">
                            {controller.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: controller.is_active ? 'rgb(76, 175, 80)' : 'grey.400',
                              mr: 0.5
                            }} 
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: controller.is_active ? 'rgb(56, 142, 60)' : 'text.secondary',
                              fontWeight: 'medium'
                            }}
                          >
                            Aktiv
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {isIrrigation ? 'Bewässerung' : isLight ? 'Licht' : 'Controller'}
                        {controller.room ? ` • ${controller.room.name}` : ''}
                      </Typography>
                      
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {progressLabel}
                          </Typography>
                          <Typography variant="caption" fontWeight="medium">
                            {progressText}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          height: 8, 
                          backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                          borderRadius: 4, 
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${progressValue}%`,
                            backgroundColor: isLight ? 'rgb(255, 152, 0)' : 'rgb(76, 175, 80)',
                            borderRadius: 4
                          }} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Aktuelle Alarme */}
        <Box 
          sx={{ 
            flex: 1, 
            minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(20% - 13px)' },
            backgroundColor: '#effaf1', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <Typography variant="subtitle1" sx={cardTitleStyle}>
              AKTUELLE ALARME
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, flexGrow: 1 }}>
            {alerts.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                my: 8,
                color: 'rgb(56, 142, 60)'
              }}>
                <CheckCircleIcon sx={{ fontSize: 36, mb: 1, color: 'rgb(56, 142, 60)' }} />
                <Typography variant="body1" sx={{ mb: 1, color: 'rgb(56, 142, 60)' }}>
                  Keine aktuellen Alarme
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Alle Systeme arbeiten normal
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {alerts.map((alert, index) => {
                  const isIrrigation = alert.controller_type === 'irrigation';
                  const isLight = alert.controller_type === 'light';
                  
                  return (
                    <Box 
                      key={alert.id || index} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid rgba(255, 152, 0, 0.2)', 
                        borderRadius: 1,
                        backgroundColor: 'rgba(255, 152, 0, 0.05)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isIrrigation ? (
                            <OpacityIcon sx={{ mr: 0.5, color: 'rgb(255, 152, 0)', fontSize: 16 }} />
                          ) : (
                            <WbSunnyIcon sx={{ mr: 0.5, color: 'rgb(255, 152, 0)', fontSize: 16 }} />
                          )}
                          <Typography variant="body2" fontWeight="medium" color="rgb(255, 152, 0)">
                            {isIrrigation ? 'Bewässerung' : isLight ? 'Licht' : ''}: 
                            {' '}{alert.action_type?.split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WarningIcon sx={{ mr: 0.5, color: 'rgb(255, 152, 0)', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'rgb(255, 152, 0)' }}>
                            Warnung
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {alert.error_message || 'Keine Details verfügbar'}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {alert.timestamp ? 
                          new Date(alert.timestamp).toLocaleTimeString('de-DE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 
                          '--:--'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;