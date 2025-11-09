// frontend/src/apps/trackandtrace/components/common/AccordionRow.jsx
import { Box, IconButton, Typography, Collapse, useTheme, alpha } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useState, useEffect } from 'react'
import useAnimationSettings from '@/hooks/useAnimationSettings'

/**
 * AccordionRow Komponente für ausklappbare Tabellenzeilen mit Animation
 * Jetzt mit voller Dark Mode Unterstützung!
 */
const AccordionRow = ({ 
  isExpanded, 
  onClick, 
  columns,
  borderColor = 'success.main',
  expandIconPosition = 'end',
  children,
  borderless = false
}) => {
  const theme = useTheme();
  const animSettings = useAnimationSettings('slide', 300, true);
  
  // Lokaler expandierter Zustand für Animation
  const [expanded, setExpanded] = useState(isExpanded);
  
  // Aktualisiere lokalen Zustand, wenn sich isExpanded ändert
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);
  
  // Berechne Animations-Dauer basierend auf den Einstellungen
  const animationDuration = animSettings.enabled ? 
    Math.min(animSettings.duration / 2, 300) : 
    0;

  return (
    <Box
      sx={{ 
        mb: borderless ? 0 : 1.2, 
        overflow: 'hidden', 
        borderRadius: borderless ? 0 : '4px',
        border: borderless ? 'none' : (expanded ? `1px solid ${alpha(theme.palette.success.main, 0.5)}` : 'none'),
        borderBottom: borderless ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : undefined,
        '&:last-child': borderless ? { borderBottom: 'none' } : undefined
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: expanded 
            ? alpha(theme.palette.action.hover, 0.04) 
            : theme.palette.background.paper,
          '&:hover': { 
            backgroundColor: alpha(theme.palette.action.hover, 0.08),
            transform: borderless ? 'translateX(2px)' : undefined,
            transition: 'all 150ms ease'
          },
          borderLeft: borderless ? 'none' : '4px solid',
          borderColor: borderless ? undefined : borderColor,
          cursor: 'pointer',
          height: '52px',
          width: '100%',
        }}
        onClick={onClick}
      >
        {/* Expand Icon am Anfang, wenn expandIconPosition='start' */}
        {expandIconPosition === 'start' && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              pl: 0.8,
              flexShrink: 0,
              height: '100%'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <ExpandMoreIcon 
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform ${animationDuration}ms ease-in-out`,
                  fontSize: '1.2rem'
                }} 
              />
            </IconButton>
          </Box>
        )}

        {/* Spalten-Inhalte */}
        {columns.map((column, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: column.align === 'center'
                ? 'center'
                : column.align === 'right'
                  ? 'flex-end'
                  : 'flex-start',
              width: column.width || 'auto',
              px: 1.5,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              height: '100%'
            }}
          >
            {column.icon && (
              <column.icon sx={{ 
                color: column.iconColor || theme.palette.text.secondary, 
                fontSize: '0.9rem', 
                mr: 0.8 
              }} />
            )}
            {typeof column.content === 'string' || typeof column.content === 'number' ? (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: column.bold ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.8rem',
                  color: column.color || theme.palette.text.primary,
                  lineHeight: 1.4,
                }}
              >
                {column.content}
              </Typography>
            ) : (
              column.content
            )}
          </Box>
        ))}

        {/* Expand Icon am Ende (Standard) */}
        {expandIconPosition === 'end' && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              pr: 0.8,
              flexShrink: 0,
              height: '100%'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <ExpandMoreIcon 
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform ${animationDuration}ms ease-in-out`,
                  fontSize: '1.2rem'
                }} 
              />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Ausgeklappter Inhalt mit Animation */}
      <Collapse 
        in={expanded} 
        timeout={animationDuration}
        unmountOnExit
      >
        <Box 
          sx={{ 
            width: '100%',
            padding: '14px 20px 20px 20px',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}

export default AccordionRow