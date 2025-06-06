// frontend/src/apps/wawi/pages/Strain/components/table-components/PriceRangeCell.jsx
import { Box, Typography, Tooltip } from '@mui/material'

const PriceRangeCell = ({ item }) => {
  if (!item.price_range_display || item.price_range_display === 'Kein Preis') {
    return (
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.8rem',
          color: 'text.disabled',
          fontStyle: 'italic'
        }}
      >
        -
      </Typography>
    )
  }
  
  // Prüfen ob es eine Spanne oder einzelner Preis ist
  const isRange = item.price_range_display.includes('-')
  
  // Tooltip-Inhalt vorbereiten
  const getTooltipContent = () => {
    if (!item.price_tiers || item.price_tiers.length === 0) return null
    
    // Sortiere Preisstaffeln nach Menge
    const sortedTiers = [...item.price_tiers].sort((a, b) => a.quantity - b.quantity)
    
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Preisstaffeln:
        </Typography>
        {sortedTiers.map((tier) => {
          const unitPrice = tier.quantity > 0 ? 
            (parseFloat(tier.total_price) / tier.quantity).toFixed(2) : '0.00'
          return (
            <Box key={tier.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption">
                {tier.tier_name || `${tier.quantity}er Pack`}:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {unitPrice}€/Samen
              </Typography>
            </Box>
          )
        })}
      </Box>
    )
  }
  
  const tooltipContent = getTooltipContent()
  
  const priceDisplay = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.8rem',
          fontWeight: isRange ? 'bold' : 'normal',
          color: isRange ? 'success.main' : 'text.primary',
          cursor: tooltipContent ? 'help' : 'default'
        }}
      >
        {item.price_range_display}
      </Typography>
    </Box>
  )
  
  // Wenn Tooltip-Inhalt vorhanden, mit Tooltip umschließen
  if (tooltipContent) {
    return (
      <Tooltip 
        title={tooltipContent}
        placement="top"
        arrow
        enterDelay={200}
      >
        {priceDisplay}
      </Tooltip>
    )
  }
  
  return priceDisplay
}

export default PriceRangeCell