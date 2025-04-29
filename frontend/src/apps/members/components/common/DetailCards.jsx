// frontend/src/apps/members/components/common/DetailCards.jsx
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

/**
 * DetailCards Komponente für die Detailkarten in aufgeklappten Zeilen
 * 
 * @param {Array} cards - Array mit Karten-Konfigurationen (title, content)
 * @param {string} color - Farbe der Kartentitel (default: 'primary.main')
 */
const DetailCards = ({ cards, color = 'primary.main' }) => {
  // Filtere leere Karten heraus
  const validCards = cards.filter(card => card);
  
  return (
    <Box display="flex" flexDirection="row" width="100%" sx={{ flexWrap: 'nowrap' }}>
      {validCards.map((card, index) => (
        <Box 
          key={index} 
          sx={{ 
            flex: `0 0 ${100 / validCards.length}%`, 
            pr: index < validCards.length - 1 ? 1.5 : 0,
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
  );
};

export default DetailCards;