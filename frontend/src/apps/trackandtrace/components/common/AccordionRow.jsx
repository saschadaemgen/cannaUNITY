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
        mb: 1.5, 
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
          height: '56px',
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
              px: 2,
              overflow: 'hidden',
              flexShrink: 0,
              textAlign: column.align || 'left',
              height: '100%'
            }}
          >
            {column.icon && (
              <column.icon sx={{ color: column.iconColor || 'inherit', fontSize: '1rem', mr: 1 }} />
            )}
            {typeof column.content === 'string' || typeof column.content === 'number' ? (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: column.bold ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.875rem',
                  color: column.color || 'inherit',
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
            width: '40px',
            pr: 1,
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
                transition: 'transform 0.3s'
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
            padding: '16px 24px 24px 24px',
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