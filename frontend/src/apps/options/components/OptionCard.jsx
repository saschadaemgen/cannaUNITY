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
} from '@mui/material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import SaveIcon from '@mui/icons-material/Save'
import ColorizeIcon from '@mui/icons-material/Colorize'

// Google Fonts Auswahl
const googleFonts = [
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'Oswald', family: "'Oswald', sans-serif" },
  { name: 'Raleway', family: "'Raleway', sans-serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
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
]

export default function OptionCard({ 
  title, 
  value, 
  description, 
  onToggle, 
  toggleValue, 
  editable, 
  onSave,
  titleStyle = null,
}) {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState(value || '')
  const [fontFamily, setFontFamily] = useState(titleStyle?.fontFamily || "'Roboto', sans-serif")
  const [fontWeight, setFontWeight] = useState(titleStyle?.fontWeight || 'normal')
  const [fontStyle, setFontStyle] = useState(titleStyle?.fontStyle || 'normal')
  const [textDecoration, setTextDecoration] = useState(titleStyle?.textDecoration || 'none')
  const [color, setColor] = useState(titleStyle?.color || '#ffffff')
  const [isChanged, setIsChanged] = useState(false)

  // Aktualisiere den Eingabewert, wenn sich der Wert von außen ändert
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Aktualisiere Style-Optionen, wenn sich titleStyle ändert
  useEffect(() => {
    if (titleStyle) {
      setFontFamily(titleStyle.fontFamily || "'Roboto', sans-serif")
      setFontWeight(titleStyle.fontWeight || 'normal')
      setFontStyle(titleStyle.fontStyle || 'normal')
      setTextDecoration(titleStyle.textDecoration || 'none')
      setColor(titleStyle.color || '#ffffff')
    }
  }, [titleStyle])

  // Überprüfe auf Änderungen
  useEffect(() => {
    if (!titleStyle) return

    const hasChanged = 
      fontFamily !== titleStyle.fontFamily ||
      fontWeight !== titleStyle.fontWeight ||
      fontStyle !== titleStyle.fontStyle ||
      textDecoration !== titleStyle.textDecoration ||
      color !== titleStyle.color ||
      inputValue !== value

    setIsChanged(hasChanged)
  }, [fontFamily, fontWeight, fontStyle, textDecoration, color, inputValue, value, titleStyle])

  const handleFormatChange = (event, formats) => {
    if (formats.includes('bold')) {
      setFontWeight('bold')
    } else {
      setFontWeight('normal')
    }

    if (formats.includes('italic')) {
      setFontStyle('italic')
    } else {
      setFontStyle('normal')
    }

    if (formats.includes('underlined')) {
      setTextDecoration('underline')
    } else {
      setTextDecoration('none')
    }
  }

  const getCurrentFormats = () => {
    const formats = []
    if (fontWeight === 'bold') formats.push('bold')
    if (fontStyle === 'italic') formats.push('italic')
    if (textDecoration === 'underline') formats.push('underlined')
    return formats
  }

  const handleSave = () => {
    if (onSave && inputValue.trim() !== '') {
      const styleOptions = editable ? {
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        color,
      } : null

      onSave(inputValue, styleOptions)
      setIsChanged(false)
    }
  }

  return (
    <Card
      sx={{
        minWidth: 220,
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
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>

        {editable ? (
          <>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />

            {/* Vorschau des Titels mit aktuellen Stilen */}
            <Box sx={{ 
              mb: 2, 
              p: 1, 
              bgcolor: 'rgba(0,0,0,0.1)', 
              borderRadius: 1, 
              textAlign: 'center',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontFamily, 
                fontWeight, 
                fontStyle, 
                textDecoration,
                color,
              }}>
                {inputValue || "cannaUNITY"}
              </Typography>
            </Box>

            {/* Google Fonts Dropdown */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="font-family-label">Schriftart</InputLabel>
              <Select
                labelId="font-family-label"
                value={fontFamily}
                label="Schriftart"
                onChange={(e) => setFontFamily(e.target.value)}
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

            {/* Formatierungsoptionen */}
            <Box sx={{ mb: 2 }}>
              <ToggleButtonGroup
                value={getCurrentFormats()}
                onChange={handleFormatChange}
                aria-label="text formatting"
                size="small"
                sx={{ mb: 1 }}
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

            {/* Farbauswahl */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="color-label">Textfarbe</InputLabel>
              <Select
                labelId="color-label"
                value={color}
                label="Textfarbe"
                onChange={(e) => setColor(e.target.value)}
                startAdornment={<ColorizeIcon sx={{ ml: 1, color }} />}
              >
                {colorOptions.map((colorOption) => (
                  <MenuItem 
                    key={colorOption.name} 
                    value={colorOption.value}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: colorOption.value,
                        borderRadius: '50%',
                        border: '1px solid #ccc'
                      }} />
                      {colorOption.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={inputValue.trim() === ''}
              color={isChanged ? "primary" : "success"}
              fullWidth
            >
              {isChanged ? "Änderungen speichern" : "Gespeichert"}
            </Button>
          </>
        ) : (
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            {value}
          </Typography>
        )}

        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {description}
        </Typography>

        {typeof toggleValue !== 'undefined' && onToggle && (
          <Switch
            checked={toggleValue}
            onChange={(e) => onToggle(e.target.checked)}
            color="success"
            sx={{ mt: 2 }}
          />
        )}
      </CardContent>
    </Card>
  )
}