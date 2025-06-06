// frontend/src/apps/wawi/pages/Strain/components/table-components/ActionButtons.jsx
import { Box, IconButton, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import EditIcon from '@mui/icons-material/Edit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SeedIcon from '@mui/icons-material/Grass'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'

const ActionButtons = ({ 
  item, 
  isExpanded, 
  onExpand, 
  onEdit, 
  onDestroy 
}) => {
  const navigate = useNavigate()
  
  // Stoppt das Event-Bubbling, damit sich das Akkordeon nicht öffnet
  const stopPropagation = (e) => {
    if (e) e.stopPropagation()
  }

  const handleNavigateToSeedPurchase = (e) => {
    stopPropagation(e)
    navigate(`/trace/samen?strain=${item.id}&name=${encodeURIComponent(item.name)}`)
  }

  const handleBoardNotification = (e) => {
    stopPropagation(e)
    console.log('Vorstandsmeldung für Strain:', item.name)
    alert(`Vorstandsmeldung für ${item.name} - Funktion wird noch implementiert`)
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', 
        padding: '12px 8px',
      }}
      onClick={stopPropagation}
    >
      {/* Aufklapp-Icon */}
      <IconButton 
        size="small" 
        onClick={onExpand}
        sx={{ p: 0.5 }}
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
          sx={{ p: 0.5 }}
        >
          <EditIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Tooltip>
      
      {/* Sameneinkauf Button */}
      <Tooltip title="Sameneinkauf">
        <IconButton 
          size="small" 
          color="success"
          onClick={handleNavigateToSeedPurchase}
          sx={{ p: 0.5 }}
        >
          <SeedIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Tooltip>
      
      {/* Vorstandsmeldung Button */}
      <Tooltip title="Vorstandsmeldung">
        <IconButton 
          size="small" 
          color="warning"
          onClick={handleBoardNotification}
          sx={{ p: 0.5 }}
        >
          <ReportProblemIcon sx={{ fontSize: '1.1rem' }} />
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
            sx={{ p: 0.5 }}
          >
            <LocalFireDepartmentIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}

export default ActionButtons