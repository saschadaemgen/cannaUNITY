// frontend/src/apps/wawi/components/common/DetailCards.jsx
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material'

/**
 * DetailCards Komponente für die Detailkarten in aufgeklappten Zeilen
 * Mit voller Dark Mode Unterstützung
 * 
 * @param {Array} cards - Array mit Karten-Konfigurationen (title, content)
 * @param {string} color - Farbe der Kartentitel (default: 'success.main')
 */
const DetailCards = ({ cards, color = 'success.main' }) => {
  const theme = useTheme();
  
  return (
    <Box display="flex" flexDirection="row" width="100%" sx={{ flexWrap: 'nowrap' }}>
      {cards.map((card, index) => (
        <Box 
          key={index} 
          sx={{ 
            flex: `0 0 ${100 / cards.length}%`, 
            pr: index < cards.length - 1 ? 1.5 : 0,
            pl: index > 0 ? 1.5 : 0 
          }}
        >
          <Paper 
            elevation={theme.palette.mode === 'dark' ? 2 : 1}
            sx={{ 
              height: '100%', 
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.paper,
              // Subtiler Rahmen im Dark Mode für bessere Abgrenzung
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${alpha(theme.palette.divider, 0.2)}` 
                : 'none'
            }}
          >
            <Box sx={{ 
              p: 1.5, 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.primary.light 
                    : color 
                }}
              >
                {card.title}
              </Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              flexGrow: 1,
              backgroundColor: theme.palette.background.paper 
            }}>
              {card.content}
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  )
}

export default DetailCards