// src/options/components/DesignOptionCard.jsx
// Hauptkomponente - dient nun als Container für die Tabs und gemeinsames State-Management
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom' // Hinzugefügt
import {
  Card,
  CardContent,
  Typography,
  useTheme,
  Switch,
  Box,
  Tooltip,
  IconButton,
  Collapse,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  Button
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import TextFormatIcon from '@mui/icons-material/TextFormat'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import MotionPhotosAutoIcon from '@mui/icons-material/MotionPhotosAuto'
import LinearScaleIcon from '@mui/icons-material/LinearScale'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'

// Tab-Komponenten importieren
import TopbarTitleTab from './design-options/TopbarTitleTab'
import TopbarMenuTab from './design-options/TopbarMenuTab' 
import NavigationTab from './design-options/NavigationTab'
import VisibilityTab from './design-options/VisibilityTab'
import FooterTab from './design-options/FooterTab'
import AnimationsTab from './design-options/AnimationsTab'

// Vorschau-Komponente importieren
import DesignPreview from './design-options/DesignPreview'

// Standardoptionen importieren
import { defaultDesignOptions } from './design-options/DesignOptionsConfig'

export default function DesignOptionCard({ 
  value = '', 
  description,
  designOptions = {},
  onSave,
  onToggleDarkMode,
  isDarkMode,
}) {
  const theme = useTheme()
  const location = useLocation() // Neu: Location-Hook hinzufügen
  
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
  
  // NEU: Reagieren auf URL-Änderungen
  useEffect(() => {
    // Reset selectedTab oder andere interne States hier bei Pfadwechsel
    setActiveTab(0) // Zurück zum ersten Tab, wenn sich der Pfad ändert
  }, [location.pathname])
  
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
  
  const handleNestedChange = (parent, key, value) => {
    setDesign(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }))
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
        
        {/* Gemeinsame Vorschau-Komponente für alle Tabs */}
        <DesignPreview 
          title={title}
          design={design}
          theme={theme}
        />
        
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
                backgroundColor: design.darkMode ? '#90caf9' : theme.palette.primary.main,
              },
            }}
          >
            <Tab 
              label="Topbar-Titel" 
              icon={<TextFormatIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 0 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
            <Tab 
              label="Topbar & Menü" 
              icon={<ColorLensIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 1 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
            <Tab 
              label="Navigation" 
              icon={<LinearScaleIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 2 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
            <Tab 
              label="Sichtbarkeit" 
              icon={<VisibilityIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 3 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
            <Tab 
              label="Footer" 
              icon={<FormatAlignLeftIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 4 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
            <Tab 
              label="Animationen" 
              icon={<MotionPhotosAutoIcon />}
              iconPosition="start"
              sx={{
                color: activeTab === 5 
                  ? (design.darkMode ? '#90caf9' : theme.palette.primary.main)
                  : 'inherit',
              }}
            />
          </Tabs>
        </Box>
        
        {/* Inhalte der Tabs - jeder in einer eigenen Komponente */}
        {activeTab === 0 && (
          <TopbarTitleTab
            title={title}
            setTitle={setTitle}
            design={design} 
            handleDesignChange={handleDesignChange}
          />
        )}
        
        {activeTab === 1 && (
          <TopbarMenuTab
            design={design}
            theme={theme}
            handleDesignChange={handleDesignChange}
            handleNestedChange={handleNestedChange}
          />
        )}
        
        {activeTab === 2 && (
          <NavigationTab />  // Leerer Tab nach Entfernung der Navigation
        )}
        
        {activeTab === 3 && (
          <VisibilityTab
            design={design}
            handleMenuVisibilityChange={handleMenuVisibilityChange}
          />
        )}
        
        {activeTab === 4 && (
          <FooterTab
            design={design}
            handleDesignChange={handleDesignChange}
            theme={theme}
          />
        )}
        
        {activeTab === 5 && (
          <AnimationsTab
            design={design}
            handleNestedChange={handleNestedChange}
          />
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
              borderColor: design.darkMode ? '#90caf9' : undefined,
              color: design.darkMode ? '#90caf9' : undefined,
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
                ? '#1976d2'
                : (design.darkMode && !isChanged 
                  ? '#1b5e20'
                  : undefined),
            }}
          >
            {isChanged ? "Änderungen speichern" : "Gespeichert"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}