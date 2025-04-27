// Dateiname: src/components/Topbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Collapse,
  useTheme,
  Grid,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import PaymentsIcon from '@mui/icons-material/Payments';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GrassIcon from '@mui/icons-material/Grass';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import api from '../utils/api'; // API für die Titelanfrage importieren

// Standardwerte für die Designoptionen
const defaultDesignOptions = {
  // Topbar Titel
  title: 'cannaUNITY',
  titleFont: "'Roboto', sans-serif",
  titleWeight: 'bold',
  titleStyle: 'normal',
  titleDecoration: 'none',
  titleColor: '#ffffff',
  
  // Topbar und Menü
  topbarColor: 'success',
  menuFont: "'Roboto', sans-serif",
  menuWeight: 'normal',
  menuStyle: 'normal',
  menuDecoration: 'none',
  menuColor: '#ffffff',
  menuSpacing: 2, // Abstand zwischen Menüeinträgen (in MUI spacing units)
  
  // Divider
  showDividers: true,
  
  // Dark Mode
  darkMode: false,
  
  // Menü Sichtbarkeit
  menuVisibility: {
    showCommunity: true,
    showTrackTrace: true,
    showWawi: true,
    showFinance: true,
    showRooms: true,
    showSecurity: true,
  },
}

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [env, setEnv] = useState({ temperature: 22.7, humidity: 60 });
  const menuRef = useRef(null);
  const toolbarRef = useRef(null);
  const [title, setTitle] = useState('cannaUNITY'); // Standardtitel falls API fehlschlägt
  const [design, setDesign] = useState(defaultDesignOptions);

  // Lade Google Fonts
  useEffect(() => {
    const loadGoogleFonts = () => {
      const fonts = [
        'Roboto',
        'Open+Sans',
        'Montserrat',
        'Lato',
        'Poppins',
        'Oswald',
        'Raleway',
        'Playfair+Display',
      ]
      
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.join('&family=')}&display=swap`
      document.head.appendChild(link)
    }
    
    loadGoogleFonts()
  }, []);

  // API-Anfrage für den dynamischen Titel und Design-Optionen
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Titel laden
        const titleRes = await api.get('/options/title/');
        if (titleRes.data && titleRes.data.title) {
          setTitle(titleRes.data.title);
        }
        
        // Design-Optionen laden (falls vorhanden)
        try {
          const designRes = await api.get('/options/design-options/');
          if (designRes.data && designRes.data.options) {
            const loadedDesign = JSON.parse(designRes.data.options);
            setDesign(prev => ({
              ...prev,
              ...loadedDesign
            }));
          }
        } catch (designError) {
          console.error('Fehler beim Laden der Design-Optionen:', designError);
          
          // Fallback: Alte Style-Optionen versuchen zu laden
          try {
            const styleRes = await api.get('/options/title-style/');
            if (styleRes.data && styleRes.data.style) {
              const oldStyle = JSON.parse(styleRes.data.style);
              setDesign(prev => ({
                ...prev,
                titleFont: oldStyle.fontFamily || prev.titleFont,
                titleWeight: oldStyle.fontWeight || prev.titleWeight,
                titleStyle: oldStyle.fontStyle || prev.titleStyle,
                titleDecoration: oldStyle.textDecoration || prev.titleDecoration,
                titleColor: oldStyle.color || prev.titleColor
              }));
            }
          } catch (styleError) {
            console.error('Auch alte Style-Optionen nicht gefunden:', styleError);
            // Standardwerte bleiben erhalten
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden des Topbar-Titels:', error);
      }
    };
    fetchData();

    // Event-Listener für Titeländerungen
    const handleTitleChange = (event) => {
      if (event.detail) {
        if (event.detail.title) {
          setTitle(event.detail.title);
        }
        if (event.detail.style) {
          const newStyle = event.detail.style;
          setDesign(prev => ({
            ...prev,
            titleFont: newStyle.fontFamily || prev.titleFont,
            titleWeight: newStyle.fontWeight || prev.titleWeight,
            titleStyle: newStyle.fontStyle || prev.titleStyle,
            titleDecoration: newStyle.textDecoration || prev.titleDecoration,
            titleColor: newStyle.color || prev.titleColor
          }));
        }
      } else {
        fetchData();
      }
    };

    // Event-Listener für Design-Änderungen
    const handleDesignChange = (event) => {
      if (event.detail) {
        if (event.detail.title) {
          setTitle(event.detail.title);
        }
        if (event.detail.designOptions) {
          setDesign(prev => ({
            ...prev,
            ...event.detail.designOptions
          }));
        }
      } else {
        fetchData();
      }
    };

    // Höre auf beide Events
    window.addEventListener('topbarTitleChanged', handleTitleChange);
    window.addEventListener('designChanged', handleDesignChange);

    // Cleanup-Funktion
    return () => {
      window.removeEventListener('topbarTitleChanged', handleTitleChange);
      window.removeEventListener('designChanged', handleDesignChange);
    };
  }, []);

  // Aktualisierte traceData mit den neuen Step 4a und 4b anstelle der alten Einträge und allen weiteren Untertiteln
  const traceData = {
    'Step 1 - Samen': { 
      transferred: 0, 
      total: 100, 
      co2: 452, 
      dust: 16, 
      statusMsg: 'Keimung läuft planmäßig', 
      status: 'normal', 
      overdue: false,
      subtitle: 'Ausgangsmaterial'
    },
    'Step 2 - Mutterpflanzen': { 
      transferred: 10, 
      total: 120, 
      co2: 387, 
      dust: 19, 
      statusMsg: 'Wachstum regulär', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Samen'
    },
    'Step 3 - Stecklinge': { 
      transferred: 15, 
      total: 130, 
      co2: 493, 
      dust: 12, 
      statusMsg: 'Bewurzelung aktiv', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Mutterpflanzen'
    },
    'Step 4a - Blühpflanzen': { 
      transferred: 5, 
      total: 90, 
      co2: 412, 
      dust: 18, 
      statusMsg: 'Düngemittel niedrig', 
      status: 'warning', 
      overdue: false, 
      subtitle: 'überführt aus Samen' 
    },
    'Step 4b - Blühpflanzen': { 
      transferred: 8, 
      total: 85, 
      co2: 405, 
      dust: 14, 
      statusMsg: 'Wachstum optimal', 
      status: 'normal', 
      overdue: false, 
      subtitle: 'überführt aus Stecklingen' 
    },
    'Step 5 - Ernte': { 
      transferred: 0, 
      total: 85, 
      co2: 423, 
      dust: 15, 
      statusMsg: 'Zwei Ernten überfällig!', 
      status: 'error', 
      overdue: true,
      subtitle: 'überführt aus Blühpflanzen'
    },
    'Step 6 - Trocknung': { 
      transferred: 8, 
      total: 100, 
      co2: 436, 
      dust: 18, 
      statusMsg: 'Feuchtewerte im Zielbereich', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Ernte'
    },
    'Step 7 - Verarbeitung': { 
      transferred: 12, 
      total: 110, 
      co2: 347, 
      dust: 11, 
      statusMsg: 'Parameter kontrolliert', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Trocknung'
    },
    'Step 8 - Laborkontrolle': { 
      transferred: 9, 
      total: 95, 
      co2: 298, 
      dust: 17, 
      statusMsg: 'Tests laufen planmäßig', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Verarbeitung'
    },
    'Step 9 - Verpackung': { 
      transferred: 7, 
      total: 100, 
      co2: 362, 
      dust: 14, 
      statusMsg: 'Vorrat niedrig', 
      status: 'warning', 
      overdue: false,
      subtitle: 'überführt aus Laborkontrolle'
    },
    'Step 10 - Produktausgabe': { 
      transferred: 14, 
      total: 120, 
      co2: 428, 
      dust: 9, 
      statusMsg: 'Ausgabe im Zeitplan', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Verpackung'
    }
  };

  const financeData = {
    Dashboard: { period: '01.01.2025 – 30.04.2025', revenue: 185000, expenses: 112500, profit: 72500 },
    'Kontenübersicht': { accounts: 5, balance: 243500 },
    'Neues Konto': { createdThisPeriod: 1, accountName: 'Rücklagen', creationDate: '15.04.2025' },
    'Buchungsjournal': { entries: 278, pendingEntries: 4, lastJournalEntry: '29.04.2025' },
    'Neue Buchung': { drafts: 2, lastDraft: '30.04.2025' },
    'GuV': { revenue: 185000, expenses: 112500, profit: 72500, period: '01.01.2025 – 30.04.2025' },
    'Bilanz': { equity: 180000 },
    'Jahresabschluss': { closingDate: '31.12.2024' }
  };

  const wawiData = {
    'Samen-Verwaltung': { count: 25, pending: 3, status: 'Aktiv', lastUpdate: '19.04.2025' },
    'Hersteller-Verwaltung': { count: 12, pending: 2, status: 'Aktiv', lastUpdate: '18.04.2025' }
  };

  useEffect(() => {
    const id = setInterval(() => setEnv({ temperature: 22.7, humidity: 60 }), 60000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = idx => setOpenMenuIndex(openMenuIndex === idx ? null : idx);

  const handleClickItem = (path, hasChildren) => {
    if (!hasChildren) setOpenMenuIndex(null);
    navigate(path);
  };

  useEffect(() => {
    if (openMenuIndex === null) return;
    const onMove = e => {
      if (!menuRef.current || !toolbarRef.current) return;
      const m = menuRef.current.getBoundingClientRect();
      const t = toolbarRef.current.getBoundingClientRect();
      if (
        !(e.clientX >= m.left && e.clientX <= m.right && e.clientY >= m.top && e.clientY <= m.bottom) &&
        !(e.clientX >= t.left && e.clientX <= t.right && e.clientY >= t.top && e.clientY <= t.bottom)
      ) {
        setOpenMenuIndex(null);
      }
    };
    const thr = e => setTimeout(() => onMove(e), 200);
    document.addEventListener('mousemove', thr);
    return () => document.removeEventListener('mousemove', thr);
  }, [openMenuIndex]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes glow {
        0% { box-shadow: 0 0 0px rgba(255, 0, 0, 0.0); }
        100% { box-shadow: 0 0 12px rgba(255, 0, 0, 0.6); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Aktualisierte menuItems mit Step 4a und 4b und allen weiteren Untertiteln
  const menuItems = [
    { id: 'showCommunity', label: 'Gemeinschaftsnetzwerk', path: '/mitglieder', icon: <GroupsIcon /> },
    {
      id: 'showTrackTrace', 
      label: 'Track & Trace', 
      icon: <TimelineIcon />, 
      children: [
        { 
          label: 'Step 1 - Samen', 
          path: '/trace/samen', 
          icon: <GrassIcon />,
          subtitle: 'Ausgangsmaterial'
        },
        { 
          label: 'Step 2 - Mutterpflanzen', 
          path: '/trace/mutterpflanzen', 
          icon: <LocalFloristIcon />,
          subtitle: 'überführt aus Samen'
        },
        { 
          label: 'Step 3 - Stecklinge', 
          path: '/trace/stecklinge', 
          icon: <ContentCutIcon />,
          subtitle: 'überführt aus Mutterpflanzen'
        },
        { 
          label: 'Step 4a - Blühpflanzen', 
          path: '/trace/bluehpflanzen', 
          icon: <AcUnitIcon />,
          subtitle: 'überführt aus Samen'
        },
        { 
          label: 'Step 4b - Blühpflanzen', 
          path: '/trace/bluehpflanzen-aus-stecklingen', 
          icon: <LocalFloristIcon />,
          subtitle: 'überführt aus Stecklingen'
        },
        { 
          label: 'Step 5 - Ernte', 
          path: '/trace/ernte', 
          icon: <AgricultureIcon />,
          subtitle: 'überführt aus Blühpflanzen'
        },
        { 
          label: 'Step 6 - Trocknung', 
          path: '/trace/trocknung', 
          icon: <AcUnitIcon />,
          subtitle: 'überführt aus Ernte'
        },
        { 
          label: 'Step 7 - Verarbeitung', 
          path: '/trace/verarbeitung', 
          icon: <ScienceIcon />,
          subtitle: 'überführt aus Trocknung'
        },
        { 
          label: 'Step 8 - Laborkontrolle', 
          path: '/trace/laborkontrolle', 
          icon: <BiotechIcon />,
          subtitle: 'überführt aus Verarbeitung'
        },
        { 
          label: 'Step 9 - Verpackung', 
          path: '/trace/verpackung', 
          icon: <Inventory2Icon />,
          subtitle: 'überführt aus Laborkontrolle'
        },
        { 
          label: 'Step 10 - Produktausgabe', 
          path: '/trace/ausgabe', 
          icon: <ShoppingBasketIcon />,
          subtitle: 'überführt aus Verpackung'
        }
      ]
    },
    {
      id: 'showWawi',
      label: 'WaWi', 
      icon: <StorefrontIcon />, 
      children: [
        { label: 'Samen-Verwaltung', path: '/trace/samen', icon: <GrassIcon /> },
        { label: 'Hersteller-Verwaltung', path: '/trace/hersteller', icon: <BusinessIcon /> }
      ]
    },
    {
      id: 'showFinance',
      label: 'Buchhaltung', 
      icon: <PaymentsIcon />, 
      children: [
        { label: 'Dashboard', path: '/buchhaltung', icon: <PaymentsIcon /> },
        { label: 'Kontenübersicht', path: '/buchhaltung/konten', icon: <PaymentsIcon /> },
        { label: 'Neues Konto', path: '/buchhaltung/konten/neu', icon: <PaymentsIcon /> },
        { label: 'Buchungsjournal', path: '/buchhaltung/journal', icon: <PaymentsIcon /> },
        { label: 'Neue Buchung', path: '/buchhaltung/buchung/neu', icon: <PaymentsIcon /> },
        { label: 'GuV', path: '/buchhaltung/guv', icon: <PaymentsIcon /> },
        { label: 'Bilanz', path: '/buchhaltung/bilanz', icon: <PaymentsIcon /> },
        { label: 'Jahresabschluss', path: '/buchhaltung/jahresabschluss', icon: <PaymentsIcon /> }
      ]
    },
    { id: 'showRooms', label: 'Raumverwaltung', path: '/rooms', icon: <MeetingRoomIcon /> },
    { id: 'showSecurity', label: 'Sicherheit', path: '/unifi-access/dashboard', icon: <VpnKeyIcon /> }
  ];

  // Filtere die sichtbaren Menüpunkte basierend auf den Sichtbarkeitseinstellungen
  const visibleMenuItems = menuItems.filter(item => 
    design.menuVisibility && design.menuVisibility[item.id] !== false
  );

  return (
    <Box>
      <AppBar 
        position="fixed" 
        color={design.topbarColor || 'success'}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar ref={toolbarRef} sx={{ justifyContent: 'space-between', px: 4, height: 64 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: design.titleFont, 
              fontWeight: design.titleWeight, 
              fontStyle: design.titleStyle, 
              textDecoration: design.titleDecoration,
              color: design.titleColor,
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {visibleMenuItems.map((item, i) => (
              <React.Fragment key={item.id}>
                {/* Vertikaler Divider vor jedem Element außer dem ersten */}
                {i > 0 && design.showDividers && (
                  <Divider 
                    orientation="vertical" 
                    flexItem 
                    sx={{ 
                      mx: 1, 
                      my: 'auto', // Vertikale Zentrierung
                      height: '20px', // Angepasste Höhe
                      alignSelf: 'center', // Zusätzliche Zentrierung
                      borderColor: design.menuColor,
                      opacity: 0.5,
                    }} 
                  />
                )}
                <Box
                  sx={{
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer', 
                    gap: 1, 
                    color: design.menuColor,
                    px: design.menuSpacing / 2, // Abstand basierend auf menuSpacing
                    height: 64,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => item.children ? handleToggle(i) : handleClickItem(item.path, false)}
                >
                  {item.icon}
                  <Typography sx={{ 
                    fontFamily: design.menuFont,
                    fontWeight: design.menuWeight,
                    fontStyle: design.menuStyle,
                    textDecoration: design.menuDecoration,
                  }}>
                    {item.label}
                  </Typography>
                </Box>
              </React.Fragment>
            ))}
            {/* Divider vor dem Einstellungs-Icon */}
            {visibleMenuItems.length > 0 && design.showDividers && (
              <Divider 
                orientation="vertical" 
                flexItem 
                sx={{ 
                  mx: 1, 
                  my: 'auto', // Vertikale Zentrierung
                  height: '20px', // Angepasste Höhe
                  alignSelf: 'center', // Zusätzliche Zentrierung
                  borderColor: design.menuColor,
                  opacity: 0.5,
                }} 
              />
            )}
            <IconButton 
              onClick={() => handleClickItem('/options', false)} 
              sx={{ color: design.menuColor, px: design.menuSpacing / 2 }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Die ausklappbaren Menüs für sichtbare Menüpunkte */}
      {visibleMenuItems.map((item, i) => item.children && (
        <Collapse key={item.id} in={openMenuIndex === i} timeout="auto" unmountOnExit>
          <Box ref={openMenuIndex === i ? menuRef : null} sx={{ bgcolor: '#f4f4f4', py: 4, px: 8, boxShadow: 3 }}>
            <Grid container spacing={3} justifyContent="center">
              {item.children.map(sub => {
                const isFinance = item.label === 'Buchhaltung';
                const isTrace = item.label === 'Track & Trace';
                const isWawi = item.label === 'WaWi';
                const tData = traceData[sub.label] || {};
                const fData = financeData[sub.label] || {};
                const wData = wawiData[sub.label] || {};
                
                return (
                  <Grid item key={sub.label}>
                    <Paper
                      elevation={3}
                      sx={{
                        width: 300,
                        p: 2,
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
                      <Divider />
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: isTrace ? (tData.overdue ? '#d32f2f' : (tData.status === 'warning' ? '#ed6c02' : '#2e7d32')) : '#1976d2' }}>
                          {isTrace 
                            ? tData.statusMsg 
                            : (isFinance 
                              ? 'Finanzmodul aktiv' 
                              : (isWawi 
                                ? `Status: ${wData.status}` 
                                : 'System bereit'))}
                        </Typography>
                      </Box>
                      <Divider />
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
                      {isFinance && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Umsatz: {fData.revenue?.toLocaleString('de-DE')} €</Typography><br />
                          <Typography variant="caption">Ausgaben: {fData.expenses?.toLocaleString('de-DE')} €</Typography><br />
                          <Typography variant="caption">Gewinn: {fData.profit?.toLocaleString('de-DE')} €</Typography>
                          <Box sx={{ mt: 1, textAlign: 'right' }}><Typography variant="caption">{fData.period}</Typography></Box>
                        </Box>
                      )}
                      {isWawi && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Anzahl: {wData.count}</Typography><br />
                          <Typography variant="caption">Ausstehend: {wData.pending}</Typography><br />
                          <Box sx={{ mt: 1, textAlign: 'right' }}>
                            <Typography variant="caption">Letzte Aktualisierung: {wData.lastUpdate}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Collapse>
      ))}
    </Box>
  );
}