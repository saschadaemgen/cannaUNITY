// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionAnalytics/DistributionAnalytics.jsx
import { 
  Box, Typography, Paper, Grid, Card, CardContent,
  LinearProgress, Divider, Chip, Avatar
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import TimelineIcon from '@mui/icons-material/Timeline'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

export default function DistributionAnalytics({ distributions, statistics }) {
  // Berechnungen für Analysen
  const calculateAnalytics = () => {
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Filterungen
    const recent30 = distributions.filter(d => 
      new Date(d.distribution_date) >= last30Days
    )
    const recent7 = distributions.filter(d => 
      new Date(d.distribution_date) >= last7Days
    )
    
    // Top-Empfänger berechnen
    const recipientCounts = {}
    distributions.forEach(dist => {
      const recipientId = dist.recipient?.id
      if (recipientId) {
        if (!recipientCounts[recipientId]) {
          recipientCounts[recipientId] = {
            member: dist.recipient,
            count: 0,
            totalWeight: 0
          }
        }
        recipientCounts[recipientId].count++
        recipientCounts[recipientId].totalWeight += dist.total_weight || 0
      }
    })
    
    const topRecipients = Object.values(recipientCounts)
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 5)
    
    // Produkttyp-Verteilung
    let marijuanaTotal = 0
    let hashishTotal = 0
    
    distributions.forEach(dist => {
      dist.product_type_summary?.forEach(product => {
        if (product.type.includes('Marihuana')) {
          marijuanaTotal += product.weight
        } else if (product.type.includes('Haschisch')) {
          hashishTotal += product.weight
        }
      })
    })
    
    // Durchschnittswerte
    const avgWeightPerDistribution = distributions.length > 0 ? 
      distributions.reduce((sum, d) => sum + (d.total_weight || 0), 0) / distributions.length : 0
    
    const avgUnitsPerDistribution = distributions.length > 0 ?
      distributions.reduce((sum, d) => sum + (d.packaging_units?.length || 0), 0) / distributions.length : 0
    
    return {
      recent30,
      recent7,
      topRecipients,
      marijuanaTotal,
      hashishTotal,
      avgWeightPerDistribution,
      avgUnitsPerDistribution
    }
  }
  
  const analytics = calculateAnalytics()
  const totalDistributed = analytics.marijuanaTotal + analytics.hashishTotal
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Hauptstatistiken */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'primary.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" color="primary.contrastText" fontWeight="bold">
                    {distributions.length}
                  </Typography>
                  <Typography variant="body2" color="primary.contrastText">
                    Gesamtausgaben
                  </Typography>
                </Box>
                <TimelineIcon sx={{ fontSize: 48, color: 'primary.contrastText', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" color="success.contrastText" fontWeight="bold">
                    {totalDistributed.toFixed(0)}g
                  </Typography>
                  <Typography variant="body2" color="success.contrastText">
                    Gesamt ausgegeben
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 48, color: 'success.contrastText', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'info.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" color="info.contrastText" fontWeight="bold">
                    {analytics.recent30.length}
                  </Typography>
                  <Typography variant="body2" color="info.contrastText">
                    Letzte 30 Tage
                  </Typography>
                </Box>
                <CalendarTodayIcon sx={{ fontSize: 48, color: 'info.contrastText', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'warning.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" color="warning.contrastText" fontWeight="bold">
                    {analytics.recent7.length}
                  </Typography>
                  <Typography variant="body2" color="warning.contrastText">
                    Letzte 7 Tage
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'warning.contrastText', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Produktverteilung */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" />
              Produktverteilung
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFloristIcon color="success" />
                    <Typography variant="body1">Marihuana</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {analytics.marijuanaTotal.toFixed(2)}g
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalDistributed > 0 ? (analytics.marijuanaTotal / totalDistributed) * 100 : 0}
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'grey.200' }}
                  color="success"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterDramaIcon color="warning" />
                    <Typography variant="body1">Haschisch</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {analytics.hashishTotal.toFixed(2)}g
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalDistributed > 0 ? (analytics.hashishTotal / totalDistributed) * 100 : 0}
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'grey.200' }}
                  color="warning"
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="primary.main">
                        {analytics.avgWeightPerDistribution.toFixed(2)}g
                      </Typography>
                      <Typography variant="caption">
                        Ø Gewicht pro Ausgabe
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="primary.main">
                        {analytics.avgUnitsPerDistribution.toFixed(1)}
                      </Typography>
                      <Typography variant="caption">
                        Ø Einheiten pro Ausgabe
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        {/* Top-Empfänger */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              Top-Empfänger (Gesamtmenge)
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              {analytics.topRecipients.length > 0 ? (
                analytics.topRecipients.map((recipient, idx) => (
                  <Box 
                    key={recipient.member.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      py: 1.5,
                      px: 2,
                      mb: 1,
                      bgcolor: idx === 0 ? 'primary.light' : 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: idx === 0 ? 'primary.main' : 'grey.400',
                          width: 32,
                          height: 32
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {idx + 1}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={idx === 0 ? 'bold' : 'medium'}>
                          {recipient.member.first_name} {recipient.member.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {recipient.count} Ausgaben
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${recipient.totalWeight.toFixed(2)}g`}
                      color={idx === 0 ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Keine Daten verfügbar
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}