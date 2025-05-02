// Dateiname: src/layout/TopbarDropdownMenu.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Collapse,
  Grid,
  Paper,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { 
  traceData, 
  financeData, 
  wawiData, 
  securityData 
} from './TopbarConfig';

// Komponente für ein einzelnes Dropdown-Menü
function TopbarDropdownMenu({ isOpen, menuItem, menuRef, handleClickItem }) {
  const theme = useTheme();
  const location = useLocation();
  const [env] = useState({ temperature: 22.7, humidity: 60 });
  
  // Beim Routenwechsel sofort schließen
  useEffect(() => {
    // Wenn sich die Route ändert, schließen wir alle Menüs
    const closeMenuEvent = new CustomEvent('closeAllMenus');
    window.dispatchEvent(closeMenuEvent);
  }, [location.pathname]);
  
  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <Box 
        ref={menuRef} 
        sx={{ 
          bgcolor: '#f4f4f4', 
          py: 4, 
          px: 8, 
          boxShadow: 3,
          position: 'relative',
          zIndex: 1000
        }}
      >
        <Grid container spacing={3} justifyContent="center">
          {menuItem.children.map(sub => {
            // Bestimme den Typ des Menüeintrags
            const isFinance = menuItem.label === 'Buchhaltung';
            const isTrace = menuItem.label === 'Track & Trace';
            const isWawi = menuItem.label === 'WaWi';
            const isRooms = menuItem.label === 'Raumverwaltung';
            const isSecurity = menuItem.label === 'Sicherheit';
            
            // Hole die entsprechenden Daten zum Menüeintrag
            const tData = traceData[sub.label] || {};
            const fData = financeData[sub.label] || {};
            const wData = wawiData[sub.label] || {};
            const sData = securityData[sub.label] || {};
            
            return (
              <Grid item key={sub.label}>
                <Paper
                  elevation={3}
                  sx={{
                    width: 300,
                    height: 200,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      border: '2px solid #4caf50',
                      backgroundColor: '#f0fdf4',
                      animation: tData.overdue ? 'glow 0.8s ease-in-out infinite alternate' : 'none'
                    }
                  }}
                  onClick={() => handleClickItem(sub.path, false)}
                >
                  {/* Header mit Icon und Titel */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ mr: 1, mt: '2px' }}>{sub.icon}</Box>
                    <Box>
                      <Typography variant="subtitle1">
                        {sub.label}
                      </Typography>
                      {sub.subtitle && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            lineHeight: 1, 
                            mt: 0.3,
                            color: 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          {sub.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Status-Bereich */}
                  <Divider />
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: isTrace 
                          ? (tData.overdue ? '#d32f2f' : (tData.status === 'warning' ? '#ed6c02' : '#2e7d32')) 
                          : (isSecurity ? '#1565c0' : '#1976d2')
                      }}>
                      {isTrace 
                        ? tData.statusMsg 
                        : (isFinance 
                          ? 'Finanzmodul aktiv (Demo)' 
                          : (isWawi 
                            ? `Status: ${wData.status}` 
                            : (isRooms
                              ? 'Raumverwaltung aktiv (Demo)'
                              : (isSecurity
                                ? `Status: ${sData.status || 'Aktiv (Demo)'}`
                                : 'System bereit (Demo)'))))}
                    </Typography>
                  </Box>
                  <Divider />
                  
                  {/* Inhalt je nach Menütyp */}
                  {/* Track & Trace Menüinhalt */}
                  {isTrace && (
                    <Box sx={{ mt: 1 }}>
                      <Chip label={`Überführt: ${tData.transferred} / ${tData.total}`} size="small" sx={{ mb: 1, width: '100%' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '3px' }}>
                        <Typography variant="caption">{env.temperature}°C</Typography>
                        <Typography variant="caption">{env.humidity}%</Typography>
                        <Typography variant="caption">CO₂ {tData.co2}</Typography>
                        <Typography variant="caption">Staub {tData.dust}</Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Finanz-Menüinhalt - nur Leerraum */}
                  {isFinance && (
                    <Box sx={{ mt: 1, flex: 1 }}></Box>
                  )}
                  
                  {/* WaWi-Menüinhalt - komplett leer */}
                  {isWawi && (
                    <Box sx={{ mt: 1, flex: 1 }}></Box>
                  )}
                  
                  {/* Raumverwaltungs-Menüinhalt - nur Systeminfo */}
                  {isRooms && (
                    <Box sx={{ mt: 1, flex: 1 }}>
                      <Typography variant="caption">Raumverwaltungssystem</Typography><br />
                      <Typography variant="caption">Zugriffsstatus: Aktiv (Demo)</Typography>
                    </Box>
                  )}
                  
                  {/* Sicherheits-Menüinhalt - gekürzt */}
                  {isSecurity && (
                    <Box sx={{ mt: 1, flex: 1 }}>
                      {sub.label === 'Zugangskontrolle' && (
                        <>
                          <Typography variant="caption">Aktive Benutzer: {sData.activeUsers || 14}</Typography><br />
                          <Typography variant="caption">Alarmstufe: {sData.alertLevel || 'Normal'}</Typography>
                        </>
                      )}
                      {sub.label === 'Sensoren' && (
                        <>
                          <Typography variant="caption">Aktive Geräte: {sData.activeDevices || 28}</Typography><br />
                          <Typography variant="caption">Offene Warnungen: {sData.alertCount || 0}</Typography><br />
                        </>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Collapse>
  );
}

export default TopbarDropdownMenu;