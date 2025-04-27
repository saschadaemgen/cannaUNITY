// src/components/DesignOptionCard.jsx
import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  useTheme,
  Switch,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Grid,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  IconButton,
  Collapse,
  FormControlLabel,
  List,
  ListItem,
  Input,
  Stack,
  Radio,
  RadioGroup,
  Slider,
  Fade,
  Grow,
  Slide
} from '@mui/material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'
import InfoIcon from '@mui/icons-material/Info'
import TextFormatIcon from '@mui/icons-material/TextFormat'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import MotionPhotosAutoIcon from '@mui/icons-material/MotionPhotosAuto'

// Erweiterte Google Fonts Auswahl
const googleFonts = [
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'Oswald', family: "'Oswald', sans-serif" },
  { name: 'Raleway', family: "'Raleway', sans-serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Merriweather', family: "'Merriweather', serif" },
  { name: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
  { name: 'Ubuntu', family: "'Ubuntu', sans-serif" },
  { name: 'Nunito', family: "'Nunito', sans-serif" },
  { name: 'Quicksand', family: "'Quicksand', sans-serif" },
  { name: 'PT Sans', family: "'PT Sans', sans-serif" },
  { name: 'Fira Sans', family: "'Fira Sans', sans-serif" },
]

// Vordefinierte Farben
const colorOptions = [
  { name: 'Weiß', value: '#ffffff' },
  { name: 'Gelb', value: '#ffeb3b' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Rot', value: '#f44336' },
  { name: 'Pink', value: '#e91e63' },
  { name: 'Lila', value: '#9c27b0' },
  { name: 'Blau', value: '#2196f3' },
  { name: 'Grün', value: '#4caf50' },
  { name: 'Türkis', value: '#009688' },
  { name: 'Schwarz', value: '#000000' },
]

// Material UI Themes
const themeOptions = [
  { name: 'Grün (Standard)', value: 'success' },
  { name: 'Blau', value: 'primary' },
  { name: 'Rot', value: 'error' },
  { name: 'Lila', value: 'secondary' },
  { name: 'Orange', value: 'warning' },
  { name: 'Türkis', value: 'info' },
]

// Menüoptionen zum Ein-/Ausblenden
const menuVisibilityOptions = [
  { id: 'showCommunity', label: 'Gemeinschaftsnetzwerk', defaultVisible: true },
  { id: 'showTrackTrace', label: 'Track & Trace', defaultVisible: true },
  { id: 'showWawi', label: 'WaWi', defaultVisible: true },
  { id: 'showFinance', label: 'Buchhaltung', defaultVisible: true },
  { id: 'showRooms', label: 'Raumverwaltung', defaultVisible: true },
  { id: 'showSecurity', label: 'Sicherheit', defaultVisible: true },
]

// Footer Optionen
const footerOptions = [
  { id: 'showFullFooter', label: 'cannaUNITY mit Version anzeigen', value: 'full' },
  { id: 'showTitleOnly', label: 'Nur cannaUNITY anzeigen (ohne Version)', value: 'title' },
  { id: 'hideFooter', label: 'Keinen Titel anzeigen', value: 'none' },
]

// Animationstypen-Optionen
const animationTypes = [
  { id: 'slide', label: 'Gleiten', description: '(Elemente gleiten von der Seite herein)' },
  { id: 'fade', label: 'Einblenden', description: '(Elemente blenden sanft ein und aus)' },
  { id: 'grow', label: 'Wachsen', description: '(Elemente wachsen beim Erscheinen)' },
];

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
  
  // Footer Einstellungen
  footerMode: 'full', // 'full', 'title', 'none'
  
  // NEU: Animations-Einstellungen
  animations: {
    enabled: true,
    type: 'slide', // 'fade', 'slide', 'grow'
    duration: 500,
  },
}

// Die Animation Vorschau-Komponente
const AnimationPreview = ({ type, duration, enabled }) => {
  const [key, setKey] = useState(0);
  const [running, setRunning] = useState(false);
  
  // Eine Animation neu starten
  const triggerAnimation = () => {
    if (!enabled) return;
    setRunning(true);
    setKey(prevKey => prevKey + 1);
    setTimeout(() => setRunning(false), duration + 100);
  };
  
  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">Animation-Vorschau</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={triggerAnimation}
          disabled={running || !enabled}
        >
          Animation testen
        </Button>
      </Box>
      
      <Box sx={{ height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {enabled ? (
          type === 'fade' ? (
            <Fade key={key} in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Fade>
          ) : type === 'grow' ? (
            <Grow key={key} in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Grow>
          ) : (
            <Slide key={key} direction="right" in={!running} timeout={duration}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography>Animationseffekt</Typography>
              </Box>
            </Slide>
          )
        ) : (
          <Box sx={{ p: 2, bgcolor: 'grey.500', color: 'white', borderRadius: 1, opacity: 0.7 }}>
            <Typography>Animationen deaktiviert</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default function DesignOptionCard({ 
  value = '', 
  description,
  designOptions = {},
  onSave,
  onToggleDarkMode,
  isDarkMode,
}) {
  const theme = useTheme()
  
  // State für Designoptionen
  const [title, setTitle] = useState(value || 'cannaUNITY')
  const [design, setDesign] = useState({
    ...defaultDesignOptions,
    ...designOptions,
    title: value || 'cannaUNITY',
    darkMode: isDarkMode || false,
  })
  
  // UI State
  const [activeTab, setActiveTab] = useState(0)
  const [isChanged, setIsChanged] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  
  // Funktion, um die richtige Topbar-Farbe basierend auf dem Design-Modus zu bestimmen
  const getTopbarColor = (colorName, isDarkMode) => {
    // Die Farbe für den Dark Mode abhängig vom gewählten Farbschema
    if (isDarkMode) {
      switch (colorName) {
        case 'success':
          return '#1b5e20'; // Dunkles Grün
        case 'primary':
          return '#0d47a1'; // Dunkles Blau
        case 'secondary':
          return '#4a148c'; // Dunkles Lila
        case 'error':
          return '#b71c1c'; // Dunkles Rot
        case 'warning':
          return '#e65100'; // Dunkles Orange
        case 'info':
          return '#006064'; // Dunkles Türkis
        default:
          return '#1b5e20'; // Standard: Dunkles Grün
      }
    }
    
    // Im Light Mode die reguläre Farbe aus dem Theme verwenden
    return theme.palette[colorName]?.main || '#4caf50';
  };
  
  // Aktualisiere den Titel und die Designoptionen, wenn sich die Props ändern
  useEffect(() => {
    if (value) {
      setTitle(value)
      setDesign(prev => ({ ...prev, title: value }))
    }
    
    if (designOptions && Object.keys(designOptions).length > 0) {
      setDesign(prev => ({ ...prev, ...designOptions, darkMode: isDarkMode || false }))
    }
  }, [value, designOptions, isDarkMode])
  
  // Überprüfe, ob sich etwas geändert hat
  useEffect(() => {
    // Vergleiche aktuelle Werte mit den ursprünglichen Props
    const hasChanged = 
      title !== value || 
      JSON.stringify(design) !== JSON.stringify({
        ...defaultDesignOptions,
        ...designOptions,
        title: value || 'cannaUNITY',
        darkMode: isDarkMode || false
      })
    
    setIsChanged(hasChanged)
  }, [design, title, value, designOptions, isDarkMode])
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }
  
  const handleDesignChange = (key, value) => {
    setDesign(prev => ({ ...prev, [key]: value }))
  }
  
  const handleMenuVisibilityChange = (menuId, isVisible) => {
    setDesign(prev => ({
      ...prev,
      menuVisibility: {
        ...prev.menuVisibility,
        [menuId]: isVisible
      }
    }))
  }
  
  const getCurrentTitleFormats = () => {
    const formats = []
    if (design.titleWeight === 'bold') formats.push('bold')
    if (design.titleStyle === 'italic') formats.push('italic')
    if (design.titleDecoration === 'underline') formats.push('underlined')
    return formats
  }
  
  const getCurrentMenuFormats = () => {
    const formats = []
    if (design.menuWeight === 'bold') formats.push('bold')
    if (design.menuStyle === 'italic') formats.push('italic')
    if (design.menuDecoration === 'underline') formats.push('underlined')
    return formats
  }
  
  const handleTitleFormatChange = (event, formats) => {
    if (formats) { // Prüfen, ob formats definiert ist (kann null sein)
      setDesign(prev => ({
        ...prev,
        titleWeight: formats.includes('bold') ? 'bold' : 'normal',
        titleStyle: formats.includes('italic') ? 'italic' : 'normal',
        titleDecoration: formats.includes('underlined') ? 'underline' : 'none',
      }))
    }
  }
  
  const handleMenuFormatChange = (event, formats) => {
    if (formats) { // Prüfen, ob formats definiert ist (kann null sein)
      setDesign(prev => ({
        ...prev,
        menuWeight: formats.includes('bold') ? 'bold' : 'normal',
        menuStyle: formats.includes('italic') ? 'italic' : 'normal',
        menuDecoration: formats.includes('underlined') ? 'underline' : 'none',
      }))
    }
  }
  
  const handleResetToDefaults = () => {
    setTitle(defaultDesignOptions.title)
    setDesign({ ...defaultDesignOptions, darkMode: isDarkMode })
  }
  
  const handleToggleDarkMode = () => {
    const newDarkMode = !design.darkMode
    setDesign(prev => ({ ...prev, darkMode: newDarkMode }))
    if (onToggleDarkMode) {
      onToggleDarkMode(newDarkMode)
    }
  }
  
  const handleSave = () => {
    if (onSave && title.trim() !== '') {
      onSave(title, design)
    }
  }
  
  // Beispiel-Menüeinträge für die Vorschau - Alle Menüpunkte anzeigen
  const previewMenuItems = menuVisibilityOptions
  
  return (
    <Card
      sx={{
        borderRadius: 2,
        transition: 'box-shadow 0.2s ease',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(255, 255, 255, 0.05)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.1)'
        }`,
        backgroundColor:
          theme.palette.mode === 'dark' ? '#1e1e1e' : theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Design-Optionen</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={design.darkMode}
                  onChange={handleToggleDarkMode}
                  color="primary"
                />
              }
              label={design.darkMode ? "Dunkelmodus" : "Hellmodus"}
            />
            <Tooltip title="Info zu Design-Optionen">
              <IconButton onClick={() => setInfoOpen(!infoOpen)}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Collapse in={infoOpen}>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              Hier kannst du das Erscheinungsbild der Anwendung anpassen. Ändere den Titel, die Schriftarten, 
              Farben und Formatierung. Du kannst auch die Farbe der Topbar ändern und einzelne Menüpunkte 
              ein- oder ausblenden.
            </Typography>
          </Paper>
        </Collapse>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        
        {/* Vorschau der Topbar mit ALLEN verfügbaren Menüpunkten */}
        <Paper 
            elevation={3}
            sx={{ 
                // Im Dark Mode die richtige dunkle Farbe verwenden (dunkelgrau/schwarz)
                bgcolor: design.darkMode 
                ? '#121212' // Dunkelgrau/Schwarz für den Dark Mode
                : theme.palette[design.topbarColor]?.main || '#4caf50',
                color: 'white',
                p: 2,
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 1,
                flexWrap: 'wrap',
                gap: 1,
                boxShadow: design.darkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            >
          <Typography 
            sx={{ 
              fontFamily: design.titleFont, 
              fontWeight: design.titleWeight, 
              fontStyle: design.titleStyle, 
              textDecoration: design.titleDecoration,
              color: design.titleColor,
            }}
          >
            {title || "cannaUNITY"}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {previewMenuItems.map((item, index) => (
              design.menuVisibility[item.id] !== false && (
                <React.Fragment key={item.id}>
                  {index > 0 && design.showDividers && (
                    <Divider 
                      orientation="vertical" 
                      flexItem 
                      sx={{ 
                        mx: 1, 
                        borderColor: design.menuColor,
                        opacity: 0.5,
                        height: '24px',
                      }} 
                    />
                  )}
                  <Typography 
                    sx={{ 
                      fontFamily: design.menuFont, 
                      fontWeight: design.menuWeight, 
                      fontStyle: design.menuStyle, 
                      textDecoration: design.menuDecoration,
                      color: design.menuColor,
                      px: design.menuSpacing / 2,
                    }}
                  >
                    {item.label}
                  </Typography>
                </React.Fragment>
              )
            ))}
          </Box>
        </Paper>
        
        {/* Tabs für die verschiedenen Bereiche */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="design options tabs"
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              style: {
                backgroundColor: design.darkMode ? '#90caf9' : theme.palette.primary.main, // Blaue Farbe im Dark Mode für den Indikator
              },
            }}
          >
            <Tab 
              label="Topbar-Titel" 
              icon={<TextFormatIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 0 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main) // Aktiver Tab - blau im Dark Mode
                  : 'inherit', // Inaktive Tabs normal
              }}
            />
            <Tab 
              label="Topbar & Menü" 
              icon={<ColorLensIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 1 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main) // Aktiver Tab - blau im Dark Mode
                  : 'inherit', // Inaktive Tabs normal
              }}
            />
            <Tab 
              label="Sichtbarkeit" 
              icon={<VisibilityIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 2 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main) // Aktiver Tab - blau im Dark Mode
                  : 'inherit', // Inaktive Tabs normal
              }}
            />
            <Tab 
              label="Footer" 
              icon={<FormatAlignLeftIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 3 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main) // Aktiver Tab - blau im Dark Mode
                  : 'inherit', // Inaktive Tabs normal
              }}
            />
            {/* NEUER TAB FÜR ANIMATIONEN */}
            <Tab 
              label="Animationen" 
              icon={<MotionPhotosAutoIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 4 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
          </Tabs>
        </Box>
        
        {/* Titel-Einstellungen */}
        {activeTab === 0 && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Topbar-Titel"
              variant="outlined"
              size="small"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setDesign(prev => ({ ...prev, title: e.target.value }))
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="title-font-label">Schriftart</InputLabel>
              <Select
                labelId="title-font-label"
                value={design.titleFont}
                label="Schriftart"
                onChange={(e) => handleDesignChange('titleFont', e.target.value)}
              >
                {googleFonts.map((font) => (
                  <MenuItem 
                    key={font.name} 
                    value={font.family}
                    sx={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Text-Formatierung und Farbe nebeneinander in einer Zeile */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Textformatierung
                  </Typography>
                  <ToggleButtonGroup
                    value={getCurrentTitleFormats()}
                    onChange={handleTitleFormatChange}
                    aria-label="text formatting"
                    size="small"
                  >
                    <ToggleButton value="bold" aria-label="bold">
                      <FormatBoldIcon />
                    </ToggleButton>
                    <ToggleButton value="italic" aria-label="italic">
                      <FormatItalicIcon />
                    </ToggleButton>
                    <ToggleButton value="underlined" aria-label="underlined">
                      <FormatUnderlinedIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Textfarbe
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {colorOptions.map((color) => (
                      <ToggleButton
                        key={color.value}
                        value={color.value}
                        selected={design.titleColor === color.value}
                        onChange={() => handleDesignChange('titleColor', color.value)}
                        aria-label={color.name}
                        sx={{
                          width: '36px',
                          height: '36px',
                          p: 0,
                          minWidth: '36px',
                          bgcolor: color.value,
                          borderColor: design.titleColor === color.value ? '#2196f3' : '#ccc',
                          borderWidth: design.titleColor === color.value ? 2 : 1,
                          '&:hover': {
                            bgcolor: color.value,
                            opacity: 0.9,
                          },
                          '&.Mui-selected': {
                            bgcolor: color.value,
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: color.value,
                            opacity: 0.9,
                          },
                        }}
                        title={color.name}
                      />
                    ))}
                    
                    {/* Benutzerdefinierte Farbe */}
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      title="Benutzerdefinierte Farbe"
                    >
                      <Input
                        type="color"
                        value={design.titleColor}
                        onChange={(e) => handleDesignChange('titleColor', e.target.value)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '150%',
                          height: '150%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '10px' }}>+</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Topbar & Menü-Einstellungen */}
        {activeTab === 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Topbar-Farbe
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {themeOptions.map((option) => (
                <Box
                  key={option.value}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette[option.value].main,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: design.topbarColor === option.value 
                      ? '3px solid #2196f3' 
                      : '1px solid #ccc',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={() => handleDesignChange('topbarColor', option.value)}
                  title={option.name}
                />
              ))}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={design.showDividers}
                    onChange={(e) => handleDesignChange('showDividers', e.target.checked)}
                  />
                }
                label="Trenner zwischen Menüpunkten anzeigen"
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Menü-Abstand
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption">Eng</Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.5"
                    value={design.menuSpacing}
                    onChange={(e) => handleDesignChange('menuSpacing', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Typography variant="caption">Weit</Typography>
              </Stack>
            </Box>
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Menüpunkte-Formatierung</Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="menu-font-label">Schriftart Menü</InputLabel>
              <Select
                labelId="menu-font-label"
                value={design.menuFont}
                label="Schriftart Menü"
                onChange={(e) => handleDesignChange('menuFont', e.target.value)}
              >
                {googleFonts.map((font) => (
                  <MenuItem 
                    key={font.name} 
                    value={font.family}
                    sx={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Menütext-Formatierung und Farbe nebeneinander in einer Zeile */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Menütext-Formatierung
                  </Typography>
                  <ToggleButtonGroup
                    value={getCurrentMenuFormats()}
                    onChange={handleMenuFormatChange}
                    aria-label="menu text formatting"
                    size="small"
                  >
                    <ToggleButton value="bold" aria-label="bold">
                      <FormatBoldIcon />
                    </ToggleButton>
                    <ToggleButton value="italic" aria-label="italic">
                      <FormatItalicIcon />
                    </ToggleButton>
                    <ToggleButton value="underlined" aria-label="underlined">
                      <FormatUnderlinedIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Menütext-Farbe
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {colorOptions.map((color) => (
                      <ToggleButton
                        key={color.value}
                        value={color.value}
                        selected={design.menuColor === color.value}
                        onChange={() => handleDesignChange('menuColor', color.value)}
                        aria-label={color.name}
                        sx={{
                          width: '36px',
                          height: '36px',
                          p: 0,
                          minWidth: '36px',
                          bgcolor: color.value,
                          borderColor: design.menuColor === color.value ? '#2196f3' : '#ccc',
                          borderWidth: design.menuColor === color.value ? 2 : 1,
                          '&:hover': {
                            bgcolor: color.value,
                            opacity: 0.9,
                          },
                          '&.Mui-selected': {
                            bgcolor: color.value,
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: color.value,
                            opacity: 0.9,
                          },
                        }}
                        title={color.name}
                      />
                    ))}
                    
                    {/* Benutzerdefinierte Farbe */}
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      title="Benutzerdefinierte Farbe"
                    >
                      <Input
                        type="color"
                        value={design.menuColor}
                        onChange={(e) => handleDesignChange('menuColor', e.target.value)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '150%',
                          height: '150%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '10px' }}>+</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Menü-Sichtbarkeit */}
        {activeTab === 2 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Hier kannst du einzelne Menüpunkte in der Topbar ein- oder ausblenden
            </Typography>
            
            <List disablePadding>
              {menuVisibilityOptions.map((menuOption) => (
                <ListItem key={menuOption.id} disableGutters>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={design.menuVisibility?.[menuOption.id] !== false}
                        onChange={(e) => handleMenuVisibilityChange(menuOption.id, e.target.checked)}
                      />
                    }
                    label={menuOption.label}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* Footer-Einstellungen */}
        {activeTab === 3 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Hier kannst du den Footer-Titel anpassen
            </Typography>
            
            {/* Footer-Vorschau */}
            <Paper 
              elevation={1}
              sx={{ 
                p: 1,
                px: 2,
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 1,
                borderTop: '1px solid',
                borderTopColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[800] 
                  : theme.palette.grey[300],
                bgcolor: design.darkMode
                  ? theme.palette.grey[900] 
                  : theme.palette.grey[100],
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {design.footerMode === 'full' && 'cannaUNITY v0.6.18'}
                {design.footerMode === 'title' && 'cannaUNITY'}
                {design.footerMode === 'none' && ''}
              </Typography>
              
              <Button color="success" size="small">
                Login
              </Button>
            </Paper>
            
            {/* Footer-Optionen */}
            <RadioGroup
              value={design.footerMode}
              onChange={(e) => handleDesignChange('footerMode', e.target.value)}
              name="footer-options"
            >
              {footerOptions.map((option) => (
                <FormControlLabel 
                  key={option.id}
                  value={option.value} 
                  control={<Radio />} 
                  label={option.label} 
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          </Box>
        )}
        
        {/* Animations-Einstellungen */}
        {activeTab === 4 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Hier kannst du Animationen im Interface ein- oder ausschalten und anpassen
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={design.animations?.enabled !== false}
                    onChange={(e) => handleDesignChange('animations', {
                      ...design.animations,
                      enabled: e.target.checked
                    })}
                    color="primary"
                  />
                }
                label="Animationen aktivieren"
              />
              
              <AnimationPreview 
                type={design.animations?.type || 'slide'}
                duration={design.animations?.duration || 500}
                enabled={design.animations?.enabled !== false}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Animationstyp</Typography>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'nowrap',
                pl: 1
              }}
            >
              {animationTypes.map((type, index) => (
                <Box 
                  key={type.id} 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    mr: index < animationTypes.length - 1 ? 3 : 0 // Abstand nur zwischen den Elementen
                  }}
                  onClick={() => !design.animations?.enabled === false && 
                    handleDesignChange('animations', {
                      ...design.animations,
                      type: type.id
                    })
                  }
                >
                  <Radio
                    disabled={design.animations?.enabled === false}
                    checked={design.animations?.type === type.id}
                    onChange={() => {}}
                    size="small"
                    sx={{ 
                      p: 0.5, 
                      mr: 0.5,
                      '& .MuiSvgIcon-root': { fontSize: 18 } // Kleinere Radio-Buttons
                    }}
                  />
                  <Box sx={{ 
                    cursor: design.animations?.enabled === false ? 'default' : 'pointer',
                    opacity: design.animations?.enabled === false ? 0.5 : 1
                  }}>
                    <Typography 
                      variant="body2" 
                      component="span" 
                      sx={{ fontSize: '0.9rem' }}
                    >
                      {type.label}
                    </Typography>
                    <Typography 
                      component="span" 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ ml: 0.5 }}
                    >
                      {type.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

            <Box sx={{ mb: 3 }} disabled={design.animations?.enabled === false}>
              <Typography variant="subtitle2" gutterBottom>Animationsdauer</Typography>
              <Box sx={{ px: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption">Schnell</Typography>
                  <Slider
                    value={design.animations?.duration || 500}
                    min={200}
                    max={1000}
                    step={50}
                    marks={[
                      { value: 200, label: '0.2s' },
                      { value: 500, label: '0.5s' },
                      { value: 1000, label: '1.0s' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value/1000}s`}
                    onChange={(e, value) => handleDesignChange('animations', {
                      ...design.animations,
                      duration: value
                    })}
                    disabled={design.animations?.enabled === false}
                  />
                  <Typography variant="caption">Langsam</Typography>
                </Stack>
              </Box>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 4 }}>
              Hinweis: Animationen können auf manchen Geräten die Leistung beeinträchtigen. 
              Wenn du Performance-Probleme bemerkst, kannst du die Animationen deaktivieren 
              oder die Dauer verkürzen.
            </Typography>
          </Box>
        )}
        
        {/* Aktionsbuttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<RestoreIcon />}
            onClick={handleResetToDefaults}
            sx={{ 
              flex: 1, 
              mr: 1,
              borderColor: design.darkMode ? '#90caf9' : undefined, // Blaue Umrandung im Dark Mode
              color: design.darkMode ? '#90caf9' : undefined, // Blaue Textfarbe im Dark Mode
            }}
          >
            Zurücksetzen
          </Button>
          
          <Button
            variant="contained"
            size="medium"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={title.trim() === ''}
            color={isChanged ? "primary" : "success"}
            sx={{ 
              flex: 1,
              backgroundColor: design.darkMode && isChanged 
                ? '#1976d2' // Dunkleres Blau im Dark Mode für Primary
                : (design.darkMode && !isChanged 
                  ? '#1b5e20' // Dunkleres Grün im Dark Mode für Success
                  : undefined), // Standard-Farben im Light Mode
            }}
          >
            {isChanged ? "Änderungen speichern" : "Gespeichert"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}