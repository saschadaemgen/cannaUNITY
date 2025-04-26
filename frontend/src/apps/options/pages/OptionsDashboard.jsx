import { useContext, useState, useEffect } from 'react'
import { Grid, Box, useTheme, Snackbar, Alert } from '@mui/material'
import DesignOptionCard from '../components/DesignOptionCard'
import { ColorModeContext } from '../../../context/ColorModeContext'
import api from '../../../utils/api'

export default function OptionsDashboard() {
  const colorMode = useContext(ColorModeContext)
  const theme = useTheme()
  const [topbarTitle, setTopbarTitle] = useState('')  // Leerer String als Initialwert
  const [titleStyle, setTitleStyle] = useState(null)  // Altes Format für Style-Optionen
  const [designOptions, setDesignOptions] = useState(null)  // Neues Format für Design-Optionen
  const [isLoading, setIsLoading] = useState(true)  // Loading-Zustand hinzufügen

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // 🔥 Lade aktuellen Titel und Style/Design-Optionen bei Seitenaufruf
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Titel laden
        const titleRes = await api.get('/options/title/')
        if (titleRes.data && titleRes.data.title) {
          setTopbarTitle(titleRes.data.title)
        }
        
        // Versuche zuerst die neuen Design-Optionen zu laden
        try {
          const designRes = await api.get('/options/design-options/')
          if (designRes.data && designRes.data.options) {
            const loadedDesign = JSON.parse(designRes.data.options)
            setDesignOptions(loadedDesign)
            
            // Konvertiere für die Abwärtskompatibilität zu titleStyle
            setTitleStyle({
              fontFamily: loadedDesign.titleFont || "'Roboto', sans-serif",
              fontWeight: loadedDesign.titleWeight || 'bold',
              fontStyle: loadedDesign.titleStyle || 'normal',
              textDecoration: loadedDesign.titleDecoration || 'none',
              color: loadedDesign.titleColor || '#ffffff'
            })
          }
        } catch (designError) {
          console.error('Erweiterte Design-Optionen nicht gefunden, versuche altes Format:', designError)
          
          // Fallback: Versuche altes titleStyle-Format zu laden
          try {
            const styleRes = await api.get('/options/title-style/')
            if (styleRes.data && styleRes.data.style) {
              const oldStyle = JSON.parse(styleRes.data.style)
              setTitleStyle(oldStyle)
              
              // Konvertiere altes Format zu neuem Design-Format
              setDesignOptions({
                // Topbar-Titel Einstellungen
                titleFont: oldStyle.fontFamily || "'Roboto', sans-serif",
                titleWeight: oldStyle.fontWeight || 'bold',
                titleStyle: oldStyle.fontStyle || 'normal',
                titleDecoration: oldStyle.textDecoration || 'none',
                titleColor: oldStyle.color || '#ffffff',
                
                // Standard-Werte für andere Optionen
                topbarColor: 'success',
                menuFont: "'Roboto', sans-serif",
                menuWeight: 'normal',
                menuStyle: 'normal',
                menuDecoration: 'none',
                menuColor: '#ffffff',
                menuSpacing: 2,
                showDividers: true,
                darkMode: theme.palette.mode === 'dark',
                menuVisibility: {
                  showCommunity: true,
                  showTrackTrace: true,
                  showWawi: true,
                  showFinance: true,
                  showRooms: true,
                  showSecurity: true,
                }
              })
            }
          } catch (styleError) {
            console.error('Auch alte Style-Optionen nicht gefunden:', styleError)
            // Fallback: Setze Standard-Werte
            setTitleStyle({
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 'bold',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#ffffff'
            })
            
            setDesignOptions({
              titleFont: "'Roboto', sans-serif",
              titleWeight: 'bold',
              titleStyle: 'normal',
              titleDecoration: 'none',
              titleColor: '#ffffff',
              topbarColor: 'success',
              menuFont: "'Roboto', sans-serif",
              menuWeight: 'normal',
              menuStyle: 'normal',
              menuDecoration: 'none',
              menuColor: '#ffffff',
              menuSpacing: 2,
              showDividers: true,
              darkMode: theme.palette.mode === 'dark',
              menuVisibility: {
                showCommunity: true,
                showTrackTrace: true,
                showWawi: true,
                showFinance: true,
                showRooms: true,
                showSecurity: true,
              }
            })
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden des Titels:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [theme.palette.mode])
  
  // Speichern der Design-Optionen im neuen Format
  const handleSaveDesign = async (newTitle, newDesignOptions) => {
    try {
      // Speichere den Titel
      await api.post('/options/update-title/', { title: newTitle })
      setTopbarTitle(newTitle)
      
      // Speichere die Design-Optionen im neuen Format
      await api.post('/options/update-design-options/', { 
        options: JSON.stringify(newDesignOptions) 
      })
      setDesignOptions(newDesignOptions)
      
      // Konvertiere für Abwärtskompatibilität auch zu titleStyle
      const updatedStyle = {
        fontFamily: newDesignOptions.titleFont || titleStyle?.fontFamily,
        fontWeight: newDesignOptions.titleWeight || titleStyle?.fontWeight,
        fontStyle: newDesignOptions.titleStyle || titleStyle?.fontStyle,
        textDecoration: newDesignOptions.titleDecoration || titleStyle?.textDecoration,
        color: newDesignOptions.titleColor || titleStyle?.color
      }
      setTitleStyle(updatedStyle)
      
      // Speichere auch im alten Format
      await api.post('/options/update-title-style/', { 
        style: JSON.stringify(updatedStyle) 
      })
      
      setSnackbarMessage('Design-Optionen erfolgreich gespeichert!')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      
      // Löse die Events für beide Formate aus
      // Altes Format
      const titleChangedEvent = new CustomEvent('topbarTitleChanged', { 
        detail: {
          title: newTitle,
          style: updatedStyle
        }
      })
      window.dispatchEvent(titleChangedEvent)
      
      // Neues Format
      const designChangedEvent = new CustomEvent('designChanged', { 
        detail: {
          title: newTitle,
          designOptions: newDesignOptions
        }
      })
      window.dispatchEvent(designChangedEvent)
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Designs:', error)
      setSnackbarMessage('Fehler beim Speichern.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }
  
  // Umschalten des Dark Mode
  const handleToggleDarkMode = (newDarkMode) => {
    colorMode.toggleColorMode()
    
    // Aktualisiere auch die Design-Optionen
    setDesignOptions(prev => ({
      ...prev,
      darkMode: newDarkMode
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      {isLoading ? (
        <Box>Lade Design-Optionen...</Box>
      ) : (
        <DesignOptionCard
          value={topbarTitle}
          description="Passe das Erscheinungsbild der Masteransicht von cannaUNITY an. Ändere u.a. den Titel, die Schriftarten, Farben und Formatierung."
          designOptions={designOptions}
          onSave={handleSaveDesign}
          onToggleDarkMode={handleToggleDarkMode}
          isDarkMode={theme.palette.mode === 'dark'}
        />
      )}

      {/* Snackbar für Erfolg oder Fehler */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}