// frontend/src/apps/wawi/pages/Strain/components/table-components/StrainTypeChip.jsx
import { Chip } from '@mui/material'

const StrainTypeChip = ({ strainType }) => {
  // Konvertiere Typen zu lesbaren Namen
  const strainTypeMap = {
    'feminized': 'Feminisiert',
    'regular': 'Regulär',
    'autoflower': 'Autoflower',
    'f1_hybrid': 'F1 Hybrid',
    'cbd': 'CBD'
  }
  
  const getChipColor = (type) => {
    switch(type) {
      case 'feminized': return 'success'
      case 'autoflower': return 'primary'
      case 'cbd': return 'info'
      default: return 'default'
    }
  }
  
  return (
    <Chip 
      label={strainTypeMap[strainType] || strainType} 
      size="small" 
      color={getChipColor(strainType)}
      variant="outlined"
    />
  )
}

export default StrainTypeChip