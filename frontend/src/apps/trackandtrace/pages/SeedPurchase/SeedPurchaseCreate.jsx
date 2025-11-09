// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchaseCreate.jsx
import { Container, Box, Fade } from '@mui/material'
import PageHeader from '../../../../components/common/PageHeader'
import SeedPurchaseFormStandalone from './SeedPurchaseFormStandalone'

export default function SeedPurchaseCreate() {
  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Track & Trace Verwaltung: Step 1 - Neuer Sameneinkauf"
            showFilters={false}
          />
        </Box>
      </Fade>

      {/* Formular */}
      <Box sx={{ mt: 3 }}>
        <SeedPurchaseFormStandalone />
      </Box>
    </Container>
  )
}