// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionHistory/DistributionDetails.jsx
import { 
  Box, Typography, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, Chip,
  Grid, Divider
} from '@mui/material'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import PersonIcon from '@mui/icons-material/Person'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ScienceIcon from '@mui/icons-material/Science'
import DetailCards from '@/components/common/DetailCards'
import TrackAndTraceHistory from './TrackAndTraceHistory'

export default function DistributionDetails({ distribution }) {
  // Formatiere Datum
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  // Details-Cards erstellen
  const ausgabeDetails = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Ausgabe-Nr:
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {distribution.batch_number}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Datum & Zeit:
        </Typography>
        <Typography variant="body2">
          {formatDate(distribution.distribution_date)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Gesamtgewicht:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {distribution.total_weight?.toFixed(2)}g
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Einheiten:
        </Typography>
        <Typography variant="body2">
          {distribution.packaging_units?.length || 0} Stück
        </Typography>
      </Box>
    </Box>
  )
  
  const beteiligtePersonen = (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PersonIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Empfänger
          </Typography>
        </Box>
        <Typography variant="body2">
          {distribution.recipient?.first_name} {distribution.recipient?.last_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Mitgliedsnr.: {distribution.recipient?.member_number || 'k.A.'}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CreditCardIcon fontSize="small" color="info" />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Ausgegeben von
          </Typography>
        </Box>
        <Typography variant="body2">
          {distribution.distributor?.first_name} {distribution.distributor?.last_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Autorisiert per RFID
        </Typography>
      </Box>
    </Box>
  )
  
  const produktZusammenfassung = (
    <Box>
      {distribution.product_type_summary?.map((product, idx) => (
        <Box key={idx} sx={{ mb: 2 }}>
          <Chip
            icon={product.type.includes('Marihuana') ? 
                  <LocalFloristIcon /> : <FilterDramaIcon />}
            label={`${product.type}: ${product.weight.toFixed(2)}g`}
            color={product.type.includes('Marihuana') ? 'success' : 'warning'}
            sx={{ mb: 1 }}
          />
        </Box>
      ))}
      
      {distribution.notes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Bemerkungen:
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {distribution.notes}
          </Typography>
        </>
      )}
    </Box>
  )
  
  const cards = [
    {
      title: 'Ausgabe-Details',
      content: ausgabeDetails
    },
    {
      title: 'Beteiligte Personen',
      content: beteiligtePersonen
    },
    {
      title: 'Produkt-Zusammenfassung',
      content: produktZusammenfassung
    }
  ]
  
  // Activity Stream Message
  const activityMessage = `${distribution.packaging_units?.length || 0} Einheiten mit insgesamt ${distribution.total_weight?.toFixed(2)}g wurden am ${formatDate(distribution.distribution_date)} von ${distribution.distributor?.first_name} ${distribution.distributor?.last_name} an ${distribution.recipient?.first_name} ${distribution.recipient?.last_name} ausgegeben.`
  
  return (
    <>
      {/* Activity Stream */}
      <Box 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'white', 
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
          {activityMessage}
        </Typography>
      </Box>
      
      {/* Detail Cards */}
      <DetailCards cards={cards} color="primary.main" />
      
      {/* Track & Trace History */}
      <Box sx={{ mt: 3 }}>
        <TrackAndTraceHistory distribution={distribution} />
      </Box>
      
      {/* Einheiten-Tabelle */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Ausgegebene Einheiten
        </Typography>
        
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Einheitsnummer
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Genetik
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Produkttyp
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                  Gewicht
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                  THC
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                  CBD
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {distribution.packaging_units?.map((unit, idx) => {
                const batch = unit.batch || {}
                const strain = batch.source_strain || 'Unbekannt'
                const productType = batch.product_type_display || 'Unbekannt'
                const isMarijuana = batch.product_type === 'marijuana'
                const thc = batch.thc_content || 'k.A.'
                const cbd = batch.cbd_content || 'k.A.'
                
                return (
                  <TableRow 
                    key={unit.id || idx}
                    sx={{ 
                      backgroundColor: 'white',
                      '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {unit.batch_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScienceIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {strain}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={isMarijuana ? <LocalFloristIcon /> : <FilterDramaIcon />}
                        label={productType}
                        size="small"
                        color={isMarijuana ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {parseFloat(unit.weight).toFixed(2)}g
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {thc}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {cbd}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}