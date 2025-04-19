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
  ClickAwayListener,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const handleToggleMenu = (index) => {
    setOpenMenuIndex((prev) => (prev === index ? null : index));
  };

  const handleCloseMenu = () => {
    setOpenMenuIndex(null);
  };

  const menuItems = [
    { label: 'Gemeinschaftsnetzwerk', path: '/mitglieder', icon: <GroupsIcon /> },
    {
      label: 'Track & Trace',
      path: '/trace',
      icon: <TimelineIcon />,
      children: [
        { label: 'Step 1 - Übersicht', path: '/trace', icon: <TimelineIcon /> },
        { label: 'Step 2 - Samen', path: '/trace/samen', icon: <GrassIcon /> },
        { label: 'Step 3 - Mutterpflanzen', path: '/trace/mutterpflanzen', icon: <LocalFloristIcon /> },
        { label: 'Step 4 - Stecklinge', path: '/trace/stecklinge', icon: <ContentCutIcon /> },
        { label: 'Step 5 - Blühpflanzen', path: '/trace/bluehpflanzen', icon: <AcUnitIcon /> },
        { label: 'Step 6 - Ernte', path: '/trace/ernte', icon: <AgricultureIcon /> },
        { label: 'Step 7 - Trocknung', path: '/trace/trocknung', icon: <AcUnitIcon /> },
        { label: 'Step 8 - Verarbeitung', path: '/trace/verarbeitung', icon: <ScienceIcon fontSize="small" /> },

      ],
    },
    {
      label: 'Buchhaltung',
      path: '/buchhaltung',
      icon: <PaymentsIcon />,
      children: [
        { label: 'Dashboard', path: '/buchhaltung' },
        { label: 'Kontenübersicht', path: '/buchhaltung/konten' },
        { label: 'Neues Konto', path: '/buchhaltung/konten/neu' },
        { label: 'Buchungsjournal', path: '/buchhaltung/journal' },
        { label: 'Neue Buchung', path: '/buchhaltung/buchung/neu' },
        { label: 'Hauptbuch', path: '/buchhaltung/hauptbuch' },
        { label: 'GuV', path: '/buchhaltung/guv' },
        { label: 'Bilanz', path: '/buchhaltung/bilanz' },
        { label: 'Jahresabschluss', path: '/buchhaltung/jahresabschluss' },
      ],
    },
    { label: 'Raumverwaltung', path: '/rooms', icon: <MeetingRoomIcon /> },
    { label: 'Sicherheit', path: '/unifi-access/dashboard', icon: <VpnKeyIcon /> },
  ];

  return (
    <ClickAwayListener onClickAway={handleCloseMenu}>
      <Box>
        <AppBar position="fixed" color="success" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ justifyContent: 'space-between', px: 4, height: '64px' }}>
            <Typography variant="h6" fontWeight="bold">
              Anbauvereinigung Recklinghausen e.V.
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {menuItems.map((item, index) => (
                <Box key={item.label}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: 1,
                      color: 'white',
                      height: '64px',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => (item.children ? handleToggleMenu(index) : navigate(item.path))}
                  >
                    {item.icon}
                    <Typography variant="body1">{item.label}</Typography>
                  </Box>
                </Box>
              ))}
              <IconButton onClick={() => navigate('/options')} color="inherit">
                <SettingsIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {menuItems.map((item, index) => (
          item.children && (
            <Collapse in={openMenuIndex === index} timeout="auto" unmountOnExit key={`collapse-${item.label}`}>
              <Box sx={{ backgroundColor: '#f4f4f4', py: 4, px: 10, boxShadow: 3 }}>
                <Grid container spacing={4}>
                  {item.children.map((sub) => (
                    <Grid item xs={12} sm={6} md={3} key={sub.label}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          cursor: 'pointer',
                          height: '100%',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                          },
                        }}
                        onClick={() => navigate(sub.path)}
                      >
                        {sub.icon || <Box sx={{ width: 24 }} />}
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {sub.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            (Weitere Modul Informationen)
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          )
        ))}
      </Box>
    </ClickAwayListener>
  );
}
