// frontend/src/apps/wawi/components/common/DetailCards.jsx
import { Box, Paper, Typography } from '@mui/material'

/**
 * DetailCards Komponente für die Detailkarten in aufgeklappten Zeilen
 * 
 * @param {Array} cards - Array mit Karten-Konfigurationen (title, content)
 * @param {string} color - Farbe der Kartentitel (default: 'success.main')
 */
const DetailCards = ({ cards, color = 'success.main' }) => {
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
            elevation={1}
            sx={{ 
              height: '100%', 
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'background.paper', 
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
            }}>
              <Typography variant="subtitle2" color={color}>
                {card.title}
              </Typography>
            </Box>
            <Box sx={{ p: 2, flexGrow: 1 }}>
              {card.content}
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  )
}

export default DetailCards