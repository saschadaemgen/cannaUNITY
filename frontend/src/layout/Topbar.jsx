// Dateiname: src/layout/Topbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../utils/api';
import TopbarMenuItems from './TopbarMenuItems';
import TopbarDropdownMenu from './TopbarDropdownMenu';
import { defaultDesignOptions } from './TopbarConfig';

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(null);
  const [floatingBar, setFloatingBar] = useState({ left: 0, width: 0, opacity: 0 });
  const menuRef = useRef(null);
  const toolbarRef = useRef(null);
  const menuItemsRef = useRef([]);
  const menuContainerRef = useRef(null);
  const [title, setTitle] = useState('cannaUNITY');
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
      ];

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.join('&family=')}&display=swap`;
      document.head.appendChild(link);
    };

    loadGoogleFonts();
  }, []);

  // API-Anfrage für den dynamischen Titel und Design-Optionen
  useEffect(() => {
    const fetchData = async () => {
      try {
        const titleRes = await api.get('/options/title/');
        if (titleRes.data && titleRes.data.title) {
          setTitle(titleRes.data.title);
        }

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
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden des Topbar-Titels:', error);
      }
    };
    fetchData();

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

    window.addEventListener('topbarTitleChanged', handleTitleChange);
    window.addEventListener('designChanged', handleDesignChange);

    return () => {
      window.removeEventListener('topbarTitleChanged', handleTitleChange);
      window.removeEventListener('designChanged', handleDesignChange);
    };
  }, []);

  useEffect(() => {
    const handleCloseAllMenus = () => {
      setOpenMenuIndex(null);
    };
    window.addEventListener('closeAllMenus', handleCloseAllMenus);
    return () => {
      window.removeEventListener('closeAllMenus', handleCloseAllMenus);
    };
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    setOpenMenuIndex(null);
    const visibleItems = TopbarMenuItems.filter(item => 
      design.menuVisibility && design.menuVisibility[item.id] !== false
    );
    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      if (item.path === currentPath) {
        setSelectedMenuIndex(i);
        updateFloatingBarPosition(i);
        return;
      }
      if (item.children) {
        const matchingChild = item.children.find(child => child.path === currentPath);
        if (matchingChild) {
          setSelectedMenuIndex(i);
          updateFloatingBarPosition(i);
          return;
        }
      }
    }
  }, [location.pathname, design.menuVisibility]);

  const updateFloatingBarPosition = (index) => {
    if (design.floatingBar?.enabled === false || 
        index === null || 
        !menuItemsRef.current[index] || 
        !menuContainerRef.current) return;
    const menuItem = menuItemsRef.current[index];
    const rect = menuItem.getBoundingClientRect();
    const containerRect = menuContainerRef.current.getBoundingClientRect();
    setFloatingBar({
      left: rect.left - containerRect.left,
      width: rect.width,
      opacity: 1
    });
  };

  const handleMenuHover = (index) => {
    if (design.floatingBar?.enabled !== false) {
      updateFloatingBarPosition(index);
    }
  };

  const handleMenuClick = (index, item) => {
    setSelectedMenuIndex(index);
    if (item.children) {
      handleToggle(index);
    } else if (item.path) {
      handleClickItem(item.path, false);
    }
  };

  const handleClickItem = (path, hasChildren) => {
    if (!hasChildren) {
      setOpenMenuIndex(null);
      setSelectedMenuIndex(null); // <--- Ergänzt: sorgt dafür, dass keine alte Auswahl bleibt
    } else {
      setOpenMenuIndex(index);
      setSelectedMenuIndex(index);
    }
    setFloatingBar({ left: 0, width: 0, opacity: 0 });
    navigate(path);
  };

  const handleToggle = idx => {
    setOpenMenuIndex(openMenuIndex === idx ? null : idx);
  };

  useEffect(() => {
    const visibleItems = TopbarMenuItems.filter(item => 
      design.menuVisibility && design.menuVisibility[item.id] !== false
    );
    menuItemsRef.current = menuItemsRef.current.slice(0, visibleItems.length);
    while (menuItemsRef.current.length < visibleItems.length) {
      menuItemsRef.current.push(null);
    }
    if (selectedMenuIndex !== null) {
      setTimeout(() => updateFloatingBarPosition(selectedMenuIndex), 100);
    }
  }, [design.menuVisibility]);

  useEffect(() => {
    const handleResize = () => {
      if (selectedMenuIndex !== null) {
        updateFloatingBarPosition(selectedMenuIndex);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedMenuIndex]);

  useEffect(() => {
    if (selectedMenuIndex !== null) {
      setTimeout(() => updateFloatingBarPosition(selectedMenuIndex), 300);
    }
  }, []);

  const visibleMenuItems = TopbarMenuItems.filter(item => 
    design.menuVisibility && design.menuVisibility[item.id] !== false
  );

  return (
    <Box>
      <AppBar 
        position="fixed"
        color={
          ['primary', 'secondary', 'success', 'error', 'info', 'warning'].includes(design.topbarColor)
            ? design.topbarColor
            : 'default'
        }
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          ...(design.topbarColor && !['primary', 'secondary', 'success', 'error', 'info', 'warning'].includes(design.topbarColor) && {
            bgcolor: design.topbarColor
          })
        }}
      >
        <Toolbar ref={toolbarRef} sx={{ justifyContent: 'space-between', px: 4, height: 64, position: 'relative' }}>
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
          <Box ref={menuContainerRef} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {design.floatingBar?.enabled !== false && (
              <Box
                sx={{
                  position: 'absolute',
                  height: `${design.floatingBar?.height || 3}px`,
                  backgroundColor: design.floatingBar?.color || 'white',
                  bottom: '11px',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                  left: `${floatingBar.left}px`,
                  width: `${floatingBar.width}px`,
                  opacity: floatingBar.opacity,
                  ...(design.floatingBar?.glow && {
                    boxShadow: `0 0 ${design.floatingBar?.glowStrength || 12}px ${design.floatingBar?.glowColor || 'rgba(255, 255, 255, 0.6)'}`,
                    animation: 'glow 1.5s ease-in-out infinite alternate'
                  }),
                  zIndex: 10
                }}
              />
            )}

            {visibleMenuItems.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && design.showDividers && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 'auto', height: '20px', alignSelf: 'center', borderColor: design.menuColor, opacity: 0.5 }} />
                )}
                <Box
                  ref={el => menuItemsRef.current[i] = el}
                  sx={{
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer', 
                    gap: 1, 
                    color: design.menuColor,
                    px: design.menuSpacing / 2,
                    height: 64,
                    position: 'relative'
                  }}
                  onMouseEnter={() => handleMenuHover(i)}
                  onClick={() => handleMenuClick(i, item)}
                >
                  {item.icon}
                  <Typography sx={{ fontFamily: design.menuFont, fontWeight: design.menuWeight, fontStyle: design.menuStyle, textDecoration: design.menuDecoration }}>
                    {item.label}
                  </Typography>
                </Box>
              </React.Fragment>
            ))}

            {visibleMenuItems.length > 0 && design.showDividers && (
              <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 'auto', height: '20px', alignSelf: 'center', borderColor: design.menuColor, opacity: 0.5 }} />
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

      {visibleMenuItems.map((item, i) => item.children && (
        <TopbarDropdownMenu
          key={item.id}
          isOpen={openMenuIndex === i}
          menuItem={item}
          menuRef={openMenuIndex === i ? menuRef : null}
          handleClickItem={handleClickItem}
        />
      ))}
    </Box>
  );
}
