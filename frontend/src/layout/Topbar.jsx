import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Link,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import GroupIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import PaymentsIcon from '@mui/icons-material/Payments';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/VpnKey';

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const handleOpenMenu = (event, index) => {
    setAnchorEl(event.currentTarget);
    setOpenMenuIndex(index);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setOpenMenuIndex(null);
  };

  const menuItems = [
    { label: 'Gemeinschaftsnetzwerk', path: '/mitglieder', icon: <GroupIcon fontSize="small" /> },
    {
      label: 'Track & Trace',
      path: '/trace',
      icon: <TimelineIcon fontSize="small" />,
      children: [
        { label: 'Übersicht', path: '/trace' },
        { label: 'Samen-Verwaltung', path: '/trace/samen' },
        { label: 'Mutterpflanzen', path: '/trace/mutterpflanzen' },
        { label: 'Stecklinge', path: '/trace/stecklinge' },
        { label: 'Blühpflanzen', path: '/trace/bluehpflanzen' }

      ],
    },
    {
      label: 'Buchhaltung',
      path: '/buchhaltung',
      icon: <PaymentsIcon fontSize="small" />,
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
    { label: 'Raumverwaltung', path: '/rooms', icon: <MeetingRoomIcon fontSize="small" /> },
    { label: 'Sicherheit', path: '/unifi-access/dashboard', icon: <KeyIcon fontSize="small" /> },
  ];

  const handleOptionsClick = () => {
    navigate('/options');
  };

  return (
    <AppBar position="fixed" color="success" elevation={2} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ height: '56px', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          Anbauvereinigung Recklinghausen e.V.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {menuItems.map((item, index) => (
            <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              {item.children ? (
                <>
                  <Link
                    component="button"
                    onClick={(e) => handleOpenMenu(e, index)}
                    color="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      '& svg': { color: 'inherit', fontSize: '20px' },
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                  <Menu
                    anchorEl={anchorEl}
                    open={openMenuIndex === index}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    MenuListProps={{ dense: true }}
                  >
                    {item.children.map((sub) => (
                      <MenuItem
                        key={sub.path}
                        component={NavLink}
                        to={sub.path}
                        onClick={handleCloseMenu}
                      >
                        {sub.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : (
                <Link
                  component={NavLink}
                  to={item.path}
                  color="inherit"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    fontSize: '0.9rem',
                    '& svg': { color: 'inherit', fontSize: '20px' },
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
              {index < menuItems.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.5)' }} />
              )}
            </Box>
          ))}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.5)' }} />

          <IconButton onClick={handleOptionsClick} color="inherit" sx={{ ml: 1 }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}