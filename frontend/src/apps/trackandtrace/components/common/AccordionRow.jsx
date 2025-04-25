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
        onClick={onClick}
        sx={{
          display: 'flex',
          cursor: 'pointer',
          backgroundColor: isExpanded ? 'rgba(0, 0, 0, 0.04)' : 'white',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          borderLeft: '4px solid',
          borderColor: borderColor,
        }}
      >
        {/* Expand Icon */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '40px',
            padding: '12px 0'
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
        
        {/* Columns */}
        {columns.map((column, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              width: column.width || 'auto', 
              padding: '12px 16px',
              overflow: 'hidden',
              justifyContent: column.align === 'center' ? 'center' : 'flex-start'
            }}
          >
            {column.icon && (
              <column.icon sx={{ color: column.iconColor || 'inherit', fontSize: '1rem', mr: 1 }} />
            )}
            
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ 
                fontWeight: column.bold ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                ...(column.fontFamily && { fontFamily: column.fontFamily }),
                ...(column.fontSize && { fontSize: column.fontSize }),
                ...(column.color && { color: column.color })
              }}
            >
              {column.content}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {/* Expanded content */}
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