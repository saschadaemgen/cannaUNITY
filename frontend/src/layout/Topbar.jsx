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

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [env, setEnv] = useState({ temperature: 22.7, humidity: 60 });
  const menuRef = useRef(null);
  const toolbarRef = useRef(null);

  const traceData = {
    'Step 1 - Samen': { transferred: 0, total: 100, co2: 452, dust: 16, statusMsg: 'Keimung läuft planmäßig', status: 'normal', overdue: false },
    'Step 2 - Mutterpflanzen': { transferred: 10, total: 120, co2: 387, dust: 19, statusMsg: 'Wachstum regulär', status: 'normal', overdue: false },
    'Step 3 - Stecklinge': { transferred: 15, total: 130, co2: 493, dust: 12, statusMsg: 'Bewurzelung aktiv', status: 'normal', overdue: false },
    'Step 4 - Blühpflanzen': { transferred: 5, total: 90, co2: 412, dust: 18, statusMsg: 'Düngemittel niedrig', status: 'warning', overdue: false },
    'Step 5 - Ernte': { transferred: 0, total: 85, co2: 423, dust: 15, statusMsg: 'Zwei Ernten überfällig!', status: 'error', overdue: true },
    'Step 6 - Trocknung': { transferred: 8, total: 100, co2: 436, dust: 18, statusMsg: 'Feuchtewerte im Zielbereich', status: 'normal', overdue: false },
    'Step 7 - Verarbeitung': { transferred: 12, total: 110, co2: 347, dust: 11, statusMsg: 'Parameter kontrolliert', status: 'normal', overdue: false },
    'Step 8 - Laborkontrolle': { transferred: 9, total: 95, co2: 298, dust: 17, statusMsg: 'Tests laufen planmäßig', status: 'normal', overdue: false },
    'Step 9 - Verpackung': { transferred: 7, total: 100, co2: 362, dust: 14, statusMsg: 'Vorrat niedrig', status: 'warning', overdue: false },
    'Step 10 - Produktausgabe': { transferred: 14, total: 120, co2: 428, dust: 9, statusMsg: 'Ausgabe im Zeitplan', status: 'normal', overdue: false }
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

  const menuItems = [
    { label: 'Gemeinschaftsnetzwerk', path: '/mitglieder', icon: <GroupsIcon /> },
    {
      label: 'Track & Trace', icon: <TimelineIcon />, children: [
        { label: 'Step 1 - Samen', path: '/trace/samen', icon: <GrassIcon /> },
        { label: 'Step 2 - Mutterpflanzen', path: '/trace/mutterpflanzen', icon: <LocalFloristIcon /> },
        { label: 'Step 3 - Stecklinge', path: '/trace/stecklinge', icon: <ContentCutIcon /> },
        { label: 'Step 4 - Blühpflanzen', path: '/trace/bluehpflanzen', icon: <AcUnitIcon /> },
        { label: 'Step 5 - Ernte', path: '/trace/ernte', icon: <AgricultureIcon /> },
        { label: 'Step 6 - Trocknung', path: '/trace/trocknung', icon: <AcUnitIcon /> },
        { label: 'Step 7 - Verarbeitung', path: '/trace/verarbeitung', icon: <ScienceIcon /> },
        { label: 'Step 8 - Laborkontrolle', path: '/trace/laborkontrolle', icon: <BiotechIcon /> },
        { label: 'Step 9 - Verpackung', path: '/trace/verpackung', icon: <Inventory2Icon /> },
        { label: 'Step 10 - Produktausgabe', path: '/trace/ausgabe', icon: <ShoppingBasketIcon /> }
      ]
    },
    {
      label: 'Buchhaltung', icon: <PaymentsIcon />, children: [
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
    { label: 'Raumverwaltung', path: '/rooms', icon: <MeetingRoomIcon /> },
    { label: 'Sicherheit', path: '/unifi-access/dashboard', icon: <VpnKeyIcon /> }
  ];

  return (
    <Box>
      <AppBar position="fixed" color="success" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar ref={toolbarRef} sx={{ justifyContent: 'space-between', px: 4, height: 64 }}>
          <Typography variant="h6" fontWeight="bold">Anbauvereinigung Recklinghausen e.V.</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {menuItems.map((item, i) => (
              <Box key={item.label}>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1, color: 'white', height: 64,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => item.children ? handleToggle(i) : handleClickItem(item.path, false)}
                >
                  {item.icon}
                  <Typography>{item.label}</Typography>
                </Box>
              </Box>
            ))}
            <IconButton onClick={() => handleClickItem('/options', false)} color="inherit"><SettingsIcon /></IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {menuItems.map((item, i) => item.children && (
        <Collapse key={item.label} in={openMenuIndex === i} timeout="auto" unmountOnExit>
          <Box ref={openMenuIndex === i ? menuRef : null} sx={{ bgcolor: '#f4f4f4', py: 4, px: 8, boxShadow: 3 }}>
            <Grid container spacing={3} justifyContent="center">
              {item.children.map(sub => {
                const isFinance = item.label === 'Buchhaltung';
                const isTrace = item.label === 'Track & Trace';
                const tData = traceData[sub.label] || {};
                const fData = financeData[sub.label] || {};
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
                          animation: sub.overdue ? 'glow 0.8s ease-in-out infinite alternate' : 'none'
                        }
                      }}
                      onClick={() => handleClickItem(sub.path, false)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {sub.icon}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>{sub.label}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: isTrace ? (tData.overdue ? '#d32f2f' : (tData.status === 'warning' ? '#ed6c02' : '#2e7d32')) : '#1976d2' }}>
                          {isTrace ? tData.statusMsg : (isFinance ? 'Finanzmodul aktiv' : 'System bereit')}
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
