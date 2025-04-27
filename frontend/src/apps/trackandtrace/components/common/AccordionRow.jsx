// frontend/src/apps/trackandtrace/components/common/AccordionRow.jsx
import { Box, IconButton, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

/**
 * AccordionRow Komponente für ausklappbare Tabellenzeilen
 *
 * @param {boolean} isExpanded - Ist die Zeile ausgeklappt
 * @param {function} onClick - Handler für Klick auf die Zeile
 * @param {Array} columns - Array mit Spalten-Konfigurationen
 * @param {string} borderColor - Farbe des linken Rands (default: 'success.main')
 * @param {React.ReactNode} children - Inhalt, der beim Ausklappen angezeigt wird
 */
const AccordionRow = ({ 
  isExpanded, 
  onClick, 
  columns,
  borderColor = 'success.main',
  children
}) => {
  return (
    <Box
      sx={{ 
        mb: 1.2, // Reduziert von 1.5 auf 1.2 für weniger vertikalen Abstand
        overflow: 'hidden', 
        borderRadius: '4px',
        border: isExpanded ? '1px solid rgba(76, 175, 80, 0.5)' : 'none'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isExpanded ? 'rgba(0, 0, 0, 0.04)' : 'white',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          borderLeft: '4px solid',
          borderColor: borderColor,
          cursor: 'pointer',
          height: '48px', // Reduziert von 54px auf 48px (ca. 11% Reduzierung)
          width: '100%',
        }}
        onClick={onClick}
      >
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
              px: 1.5, // Reduziert von 2 auf 1.5 für weniger horizontalen Abstand
              overflow: 'hidden',
              flexShrink: 0,
              textAlign: column.align || 'left',
              height: '100%'
            }}
          >
            {column.icon && (
              <column.icon sx={{ color: column.iconColor || 'inherit', fontSize: '0.9rem', mr: 0.8 }} />
            )}
            {typeof column.content === 'string' || typeof column.content === 'number' ? (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: column.bold ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.8rem', // Weiter reduziert von 0.85rem auf 0.8rem
                  color: column.color || 'inherit',
                  lineHeight: 1.4, // Reduziert von Standard (etwa 1.5) auf 1.4
                }}
              >
                {column.content}
              </Typography>
            ) : (
              column.content
            )}
          </Box>
        ))}

        {/* Expand Icon */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '36px', // Reduziert von 40px auf 36px
            pr: 0.8, // Reduziert von 1 auf 0.8
            flexShrink: 0,
            height: '100%'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <IconButton size="small">
            <ExpandMoreIcon 
              sx={{ 
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                fontSize: '1.2rem' // Reduziert die Größe des Icons
              }} 
            />
          </IconButton>
        </Box>
      </Box>

      {/* Ausgeklappter Inhalt */}
      {isExpanded && (
        <Box 
          sx={{ 
            width: '100%',
            padding: '14px 20px 20px 20px', // Reduziert von 16px 24px 24px 24px
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderTop: '1px solid rgba(0, 0, 0, 0.12)'
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}

export default AccordionRow