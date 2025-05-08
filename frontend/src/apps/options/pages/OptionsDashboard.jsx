// frontend/src/apps/options/pages/OptionsDashboard.jsx
import { useContext, useState, useEffect } from 'react'
import { Grid, Box, useTheme, Snackbar, Alert } from '@mui/material'
import { useLocation } from 'react-router-dom' // Hinzugefügt für die Überwachung von Pfadänderungen
import DesignOptionCard from '../components/DesignOptionCard'
import { ColorModeContext } from '../../../context/ColorModeContext'
import api from '@/utils/api'

export default function OptionsDashboard() {
  const colorMode = useContext(ColorModeContext)
  const theme = useTheme()
  const location = useLocation() // Location-Objekt für Pfadverfolgung
  const [topbarTitle, setTopbarTitle] = useState('')
  const [titleStyle, setTitleStyle] = useState(null)
  const [designOptions, setDesignOptions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // 🔍 Lebenszyklus-Logging
  useEffect(() => {
    console.log('🟢 OptionsDashboard MOUNTED')
    return () => {
      console.log('🔴 OptionsDashboard UNMOUNTED')
    }
  }, [])

  // Lade aktuellen Titel und Style/Design-Optionen bei Seitenaufruf
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

            // Speichere für den schnellen Zugriff in localStorage
            localStorage.setItem('designOptions', JSON.stringify(loadedDesign))

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
              const newDesignOptions = {
                titleFont: oldStyle.fontFamily || "'Roboto', sans-serif",
                titleWeight: oldStyle.fontWeight || 'bold',
                titleStyle: oldStyle.fontStyle || 'normal',
                titleDecoration: oldStyle.textDecoration || 'none',
                titleColor: oldStyle.color || '#ffffff',
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
                },
                animations: {
                  enabled: true,
                  type: 'slide',
                  duration: 500,
                }
              }

              setDesignOptions(newDesignOptions)
              localStorage.setItem('designOptions', JSON.stringify(newDesignOptions))
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

            const defaultDesignOptions = {
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
              },
              animations: {
                enabled: true,
                type: 'slide',
                duration: 500,
              }
            }

            setDesignOptions(defaultDesignOptions)
            localStorage.setItem('designOptions', JSON.stringify(defaultDesignOptions))
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

  // NEUE FUNKTION: Überwache Pfadänderungen und setze State zurück
  useEffect(() => {
    if (location.pathname !== '/options') {
      setSnackbarOpen(false)
    }
  }, [location.pathname])

  const handleSaveDesign = async (newTitle, newDesignOptions) => {
    try {
      console.log('Speichere folgende Design-Optionen:', newDesignOptions)

      await api.post('/options/update-title/', { title: newTitle })
      setTopbarTitle(newTitle)

      await api.post('/options/update-design-options/', {
        options: JSON.stringify(newDesignOptions)
      })
      setDesignOptions(newDesignOptions)
      localStorage.setItem('designOptions', JSON.stringify(newDesignOptions))

      const updatedStyle = {
        fontFamily: newDesignOptions.titleFont || titleStyle?.fontFamily,
        fontWeight: newDesignOptions.titleWeight || titleStyle?.fontWeight,
        fontStyle: newDesignOptions.titleStyle || titleStyle?.fontStyle,
        textDecoration: newDesignOptions.titleDecoration || titleStyle?.textDecoration,
        color: newDesignOptions.titleColor || titleStyle?.color
      }

      setTitleStyle(updatedStyle)

      await api.post('/options/update-title-style/', {
        style: JSON.stringify(updatedStyle)
      })

      setSnackbarMessage('Design-Optionen erfolgreich gespeichert!')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)

      const titleChangedEvent = new CustomEvent('topbarTitleChanged', {
        detail: {
          title: newTitle,
          style: updatedStyle
        }
      })
      window.dispatchEvent(titleChangedEvent)

      const designChangedEvent = new CustomEvent('designChanged', {
        detail: {
          title: newTitle,
          designOptions: newDesignOptions
        }
      })
      window.dispatchEvent(designChangedEvent)

      const animationChangedEvent = new CustomEvent('animationSettingsChanged', {
        detail: {
          animations: newDesignOptions.animations
        }
      })
      window.dispatchEvent(animationChangedEvent)

      console.log('Alle Events wurden ausgelöst, einschließlich animationSettingsChanged')
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Designs:', error)
      setSnackbarMessage('Fehler beim Speichern.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleToggleDarkMode = (newDarkMode) => {
    colorMode.toggleColorMode()
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
