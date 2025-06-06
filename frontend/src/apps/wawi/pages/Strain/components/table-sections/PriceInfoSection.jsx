// frontend/src/apps/wawi/pages/Strain/components/table-sections/PriceInfoSection.jsx
import { Box, Typography, Chip } from '@mui/material'

const PriceInfoSection = ({ item }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Preisspanne pro Samen:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
          {item.price_range_display || "Keine Preise definiert"}
        </Typography>
      </Box>
      
      {item.price_tiers && item.price_tiers.length > 0 && (
        <>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', mb: 1 }}>
            Verfügbare Packungsgrößen:
          </Typography>
          {[...item.price_tiers]
            .sort((a, b) => a.quantity - b.quantity)
            .map((tier) => {
              const unitPrice = tier.quantity > 0 ? 
                (parseFloat(tier.total_price) / tier.quantity).toFixed(2) : '0.00'
              return (
                <Box 
                  key={tier.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 0.5, 
                    pl: 1 
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {tier.tier_name || `${tier.quantity}er Packung`}
                    {tier.is_default && (
                      <Chip 
                        label="Standard" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 1, height: 16, fontSize: '0.7rem' }}
                      />
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {parseFloat(tier.total_price).toFixed(2)}€ ({unitPrice}€/Samen)
                  </Typography>
                </Box>
              )
            })}
        </>
      )}
    </Box>
  )
}

export default PriceInfoSection