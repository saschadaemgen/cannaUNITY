// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionAnalytics/DistributionAnalytics.jsx
import { 
  Box, Typography, Paper, Grid, Card, CardContent,
  LinearProgress, Divider, Chip, Avatar, alpha, useTheme
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import TimelineIcon from '@mui/icons-material/Timeline'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BarChartIcon from '@mui/icons-material/BarChart'
import ScaleIcon from '@mui/icons-material/Scale'
import InventoryIcon from '@mui/icons-material/Inventory'

export default function DistributionAnalytics({ distributions, statistics }) {
  const theme = useTheme()
  
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
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Hauptstatistiken - alle in einer Zeile, kompakter */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(6, 1fr)'
        },
        gap: 2
      }}>
        {/* Gesamtausgaben */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative'
          }}>
            <BarChartIcon sx={{ 
              position: 'absolute',
              right: 12,
              top: 12,
              fontSize: 24,
              color: 'success.main',
              opacity: 0.3
            }} />
            
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {distributions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gesamtausgaben
            </Typography>
          </Box>
        </Box>
        
        {/* Gesamt ausgegeben */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative',
            textAlign: 'center'
          }}>
            <ScaleIcon sx={{ 
              fontSize: 20,
              color: 'success.main',
              opacity: 0.3,
              mb: 0.5
            }} />
            
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {totalDistributed.toFixed(0)}g
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Gesamt ausgegeben
            </Typography>
          </Box>
        </Box>

        {/* Letzte 30 Tage */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative',
            textAlign: 'center'
          }}>
            <CalendarTodayIcon sx={{ 
              fontSize: 20,
              color: 'success.main',
              opacity: 0.3,
              mb: 0.5
            }} />
            
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {analytics.recent30.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Letzte 30 Tage
            </Typography>
          </Box>
        </Box>

        {/* Letzte 7 Tage */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative',
            textAlign: 'center'
          }}>
            <TrendingUpIcon sx={{ 
              fontSize: 20,
              color: 'success.main',
              opacity: 0.3,
              mb: 0.5
            }} />
            
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {analytics.recent7.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Letzte 7 Tage
            </Typography>
          </Box>
        </Box>

        {/* Ø Gewicht pro Ausgabe */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative',
            textAlign: 'center'
          }}>
            <AssessmentIcon sx={{ 
              fontSize: 20,
              color: 'success.main',
              opacity: 0.3,
              mb: 0.5
            }} />
            
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {analytics.avgWeightPerDistribution.toFixed(1)}g
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Ø Gewicht pro Ausgabe
            </Typography>
          </Box>
        </Box>

        {/* Ø Einheiten pro Ausgabe */}
        <Box sx={{ 
          bgcolor: theme => alpha(theme.palette.success.main, 0.04),
          borderRadius: 1,
          overflow: 'hidden',
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: theme => alpha(theme.palette.success.main, 0.3)
          }
        }}>
          <Box sx={{ 
            p: 1.5,
            position: 'relative',
            textAlign: 'center'
          }}>
            <InventoryIcon sx={{ 
              fontSize: 20,
              color: 'success.main',
              opacity: 0.3,
              mb: 0.5
            }} />
            
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {analytics.avgUnitsPerDistribution.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Ø Einheiten pro Ausgabe
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Produktverteilung */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: 'none'
          }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="success" />
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
                  sx={{ 
                    height: 10, 
                    borderRadius: 5, 
                    bgcolor: theme => alpha(theme.palette.grey[300], 0.3)
                  }}
                  color="success"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {totalDistributed > 0 ? ((analytics.marijuanaTotal / totalDistributed) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterDramaIcon sx={{ color: '#ff9800' }} />
                    <Typography variant="body1">Haschisch</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {analytics.hashishTotal.toFixed(2)}g
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalDistributed > 0 ? (analytics.hashishTotal / totalDistributed) * 100 : 0}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5, 
                    bgcolor: theme => alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#ff9800'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {totalDistributed > 0 ? ((analytics.hashishTotal / totalDistributed) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Zusammenfassung */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ 
                    textAlign: 'center',
                    bgcolor: theme => alpha(theme.palette.success.main, 0.04),
                    border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
                  }}>
                    <CardContent sx={{ py: 2 }}>
                      <ScaleIcon sx={{ color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" color="success.main">
                        {analytics.avgWeightPerDistribution.toFixed(2)}g
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ø Gewicht pro Ausgabe
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ 
                    textAlign: 'center',
                    bgcolor: theme => alpha(theme.palette.success.main, 0.04),
                    border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
                  }}>
                    <CardContent sx={{ py: 2 }}>
                      <InventoryIcon sx={{ color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" color="success.main">
                        {analytics.avgUnitsPerDistribution.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: 'none'
          }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="success" />
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
                      bgcolor: idx === 0 
                        ? theme => alpha(theme.palette.success.main, 0.08)
                        : theme => alpha(theme.palette.grey[500], 0.04),
                      borderRadius: 1,
                      border: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: idx === 0 ? 'success.main' : 'grey.400',
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
                      color={idx === 0 ? 'success' : 'default'}
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