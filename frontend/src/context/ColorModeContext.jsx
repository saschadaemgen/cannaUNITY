import { createContext, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'

export const ColorModeContext = createContext({ toggleColorMode: () => {} })

// ⬇️ DESIGN-TOKENS für Light & Dark Mode
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#0b8f43' },
          background: {
            default: '#f4f6f8',
            paper: '#ffffff',
          },
          text: {
            primary: '#000000',
            secondary: '#555555',
          },
        }
      : {
          primary: { main: '#0b8f43' },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#ffffff',
            secondary: '#aaaaaa',
          },
        }),
  },
})

export const useColorMode = () => {
  const [mode, setMode] = useState('light')

  const colorMode = useMemo(() => ({
    toggleColorMode: () =>
      setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }), [])

  // 💡 HIER wird das Theme auf Basis der Tokens erstellt
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode])

  return { theme, colorMode }
}
