// frontend/src/apps/wawi/pages/Strain/components/table-sections/ActionsSection.jsx
import { Box, Typography, Grid, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import EditIcon from '@mui/icons-material/Edit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import SeedIcon from '@mui/icons-material/Grass'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'

const ActionsSection = ({ 
  item, 
  onOpenEditForm, 
  onOpenDestroyDialog 
}) => {
  const navigate = useNavigate()

  const handleNavigateToSeedPurchase = () => {
    // Navigation zur Track & Trace Sameneinkauf Seite mit Strain-ID
    navigate(`/trace/samen?strain=${item.id}&name=${encodeURIComponent(item.name)}`)
  }

  const handleBoardNotification = () => {
    // TODO: Implementierung der Vorstandsmeldung
    console.log('Vorstandsmeldung für Strain:', item.name)
    alert(`Vorstandsmeldung für ${item.name} - Funktion wird noch implementiert`)
  }

  return (
    <Box 
      sx={{ 
        mt: 3, 
        p: 2, 
        borderRadius: '4px', 
        border: '1px solid rgba(0, 0, 0, 0.12)', 
        backgroundColor: 'white'
      }}
    >
      <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            Verfügbare Aktionen
          </Typography>
        </Grid>
        <Grid 
          size={{ xs: 12, sm: 9 }} 
          container 
          spacing={1} 
          justifyContent="flex-end" 
          sx={{ width: '100%' }}
        >
          {/* Bearbeiten Button */}
          <Grid>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => onOpenEditForm(item)}
              startIcon={<EditIcon />}
              size="small"
            >
              Bearbeiten
            </Button>
          </Grid>
          
          {/* Track & Trace Button */}
          <Grid>
            <Button 
              variant="outlined" 
              color="success"
              onClick={handleNavigateToSeedPurchase}
              startIcon={<SeedIcon />}
              size="small"
            >
              Sameneinkauf
            </Button>
          </Grid>
          
          {/* Vorstandsmeldung Button */}
          <Grid>
            <Button 
              variant="outlined" 
              color="warning"
              onClick={handleBoardNotification}
              startIcon={<ReportProblemIcon />}
              size="small"
            >
              Vorstandsmeldung
            </Button>
          </Grid>
          
          {/* Deaktivieren Button - nur für aktive Sorten */}
          {item.is_active && (
            <Grid>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => onOpenDestroyDialog(item)}
                startIcon={<LocalFireDepartmentIcon />}
                size="small"
              >
                Deaktivieren
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default ActionsSection