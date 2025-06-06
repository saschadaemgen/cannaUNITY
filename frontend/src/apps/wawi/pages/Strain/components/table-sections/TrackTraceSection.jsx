// frontend/src/apps/wawi/pages/Strain/components/table-sections/TrackTraceSection.jsx
import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Divider
} from '@mui/material'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import SpaIcon from '@mui/icons-material/Spa'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import api from '@/utils/api'

const TrackTraceSection = ({ strainId }) => {
  const [trackTraceData, setTrackTraceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (strainId) {
      loadTrackTraceData()
    }
  }, [strainId])

  const loadTrackTraceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/wawi/strains/${strainId}/track_and_trace_stats/`)
      setTrackTraceData(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Track and Trace Daten:', error)
      setError('Daten konnten nicht geladen werden')
      // Setze Standardwerte bei Fehler
      setTrackTraceData({
        total_purchased: 0,
        total_available: 0,
        mother_plants_count: 0,
        flowering_plants_count: 0,
        purchase_count: 0,
        purchase_details: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (!trackTraceData && !loading) return null

  return (
    <Paper 
      sx={{ 
        mt: 3,
        p: 2, 
        borderRadius: '4px', 
        border: '1px solid rgba(0, 0, 0, 0.12)', 
        backgroundColor: 'white',
        width: '100%'
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 'bold', 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'success.main'
        }}
      >
        <InventoryIcon fontSize="small" />
        Detaillierte Bestandsübersicht (Track & Trace Integration)
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} color="success" />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2">{error}</Typography>
      ) : (
        <>
          {/* Hauptstatistiken */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 2 }}>
            {/* Gesamt eingekauft */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ShoppingCartIcon fontSize="small" sx={{ color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                Gesamt eingekauft:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {trackTraceData.total_purchased} Samen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({trackTraceData.purchase_count} Einkäufe)
              </Typography>
            </Box>

            {/* Daraus entstanden */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Daraus entstanden:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalFloristIcon fontSize="small" sx={{ color: 'warning.main' }} />
                <Typography variant="body2">
                  <strong>{trackTraceData.flowering_plants_count}</strong> Blütepflanzen
                </Typography>
              </Box>
              <Typography variant="body2">,</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpaIcon fontSize="small" sx={{ color: 'success.main' }} />
                <Typography variant="body2">
                  <strong>{trackTraceData.mother_plants_count}</strong> Mutterpflanzen
                </Typography>
              </Box>
            </Box>

            {/* Noch verfügbar */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5,
              ml: 'auto'
            }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                Noch verfügbar:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: trackTraceData.total_available > 0 ? 'success.main' : 'text.primary' 
                }}
              >
                {trackTraceData.total_available} Samen
              </Typography>
            </Box>
          </Box>

          {/* Einkaufshistorie */}
          {trackTraceData.purchase_details && trackTraceData.purchase_details.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold', 
                  display: 'block', 
                  mb: 1,
                  color: 'text.secondary'
                }}
              >
                Einkaufshistorie:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {trackTraceData.purchase_details.map((purchase, index) => (
                  <Box 
                    key={purchase.id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65 }}>
                      {new Date(purchase.created_at).toLocaleDateString('de-DE')}:
                    </Typography>
                    <Typography variant="caption">
                      <strong>{purchase.quantity}</strong> Samen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Charge: {purchase.batch_number})
                    </Typography>
                    {purchase.member && (
                      <>
                        <Typography variant="caption" color="text.secondary">-</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {purchase.member}
                        </Typography>
                      </>
                    )}
                    {/* Status-Informationen */}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      {purchase.mother_plants_created > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <SpaIcon sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                          <Typography variant="caption" color="success.main">
                            {purchase.mother_plants_created}
                          </Typography>
                        </Box>
                      )}
                      {purchase.flowering_plants_created > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <LocalFloristIcon sx={{ fontSize: '0.8rem', color: 'warning.main' }} />
                          <Typography variant="caption" color="warning.main">
                            {purchase.flowering_plants_created}
                          </Typography>
                        </Box>
                      )}
                      {purchase.remaining_quantity > 0 && (
                        <Typography variant="caption" color="primary.main">
                          Rest: {purchase.remaining_quantity}
                        </Typography>
                      )}
                      {purchase.is_destroyed && (
                        <Typography variant="caption" color="error.main">
                          Vernichtet
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </>
      )}
    </Paper>
  )
}

export default TrackTraceSection