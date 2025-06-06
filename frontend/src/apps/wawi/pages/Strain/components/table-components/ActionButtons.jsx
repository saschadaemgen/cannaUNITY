// frontend/src/apps/wawi/pages/Strain/components/table-components/ActionButtons.jsx
import { Box, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const ActionButtons = ({ 
  item, 
  isExpanded, 
  onExpand, 
  onEdit, 
  onDestroy 
}) => {
  // Stoppt das Event-Bubbling, damit sich das Akkordeon nicht öffnet
  const stopPropagation = (e) => {
    if (e) e.stopPropagation()
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', 
        padding: '12px 16px',
      }}
      onClick={stopPropagation}
    >
      {/* Aufklapp-Icon */}
      <IconButton 
        size="small" 
        onClick={onExpand}
        sx={{ mr: 0.5 }}
      >
        <ExpandMoreIcon 
          sx={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 300ms ease-in-out',
            fontSize: '1.2rem'
          }} 
        />
      </IconButton>

      {/* Bearbeiten Button */}
      <Tooltip title="Bearbeiten">
        <IconButton 
          size="small" 
          onClick={(e) => {
            stopPropagation(e)
            onEdit(item, e)
          }}
          sx={{ mx: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      {/* Deaktivieren-Button nur für aktive Sorten zeigen */}
      {item.is_active && (
        <Tooltip title="Deaktivieren">
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => {
              stopPropagation(e)
              onDestroy(item, e)
            }}
            sx={{ mx: 0.5 }}
          >
            <LocalFireDepartmentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}

export default ActionButtons