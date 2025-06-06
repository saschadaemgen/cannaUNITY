// frontend/src/apps/wawi/pages/Strain/components/table-sections/DetailInfoCards.jsx
import { Box, Typography } from '@mui/material'
import DetailCards from '@/components/common/DetailCards'
import PriceInfoSection from './PriceInfoSection'

const DetailInfoCards = ({ item }) => {
  const basicDetails = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Hersteller:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.breeder}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Typ:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.strain_type_display}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Genetik:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.genetic_origin || "Unbekannt"}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Indica/Sativa:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.indica_percentage}% / {item.sativa_percentage}%
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Status:
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: item.is_active ? 'success.main' : 'error.main',
            fontWeight: 'bold'
          }}
        >
          {item.is_active ? 'Aktiv' : 'Inaktiv'}
        </Typography>
      </Box>
    </Box>
  )

  const growthInfo = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Blütezeit:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.flowering_time_min} - {item.flowering_time_max} Tage
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Höhe (Indoor):
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.height_indoor_min} - {item.height_indoor_max} cm
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Ertrag (Indoor):
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.yield_indoor_min} - {item.yield_indoor_max} g/m²
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Schwierigkeitsgrad:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.difficulty_display}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Resistenz (Mold/Pest/Kälte):
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.resistance_mold}/{item.resistance_pests}/{item.resistance_cold}
        </Typography>
      </Box>
    </Box>
  )

  const cannabisContent = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          THC-Gehalt:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.thc_percentage_min} - {item.thc_percentage_max}%
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          CBD-Gehalt:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.cbd_percentage_min} - {item.cbd_percentage_max}%
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Dominante Terpene:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.dominant_terpenes || "Keine angegeben"}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Geschmacksrichtungen:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.flavors || "Keine angegeben"}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
          Effekte:
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          {item.effects || "Keine angegeben"}
        </Typography>
      </Box>
    </Box>
  )

  const cards = [
    {
      title: 'Basis-Informationen',
      content: basicDetails
    },
    {
      title: 'Wachstumsinformationen',
      content: growthInfo
    },
    {
      title: 'Cannabinoide & Terpene',
      content: cannabisContent
    },
    {
      title: 'Preisinformationen',
      content: <PriceInfoSection item={item} />
    }
  ]

  return <DetailCards cards={cards} color="success.main" />
}

export default DetailInfoCards