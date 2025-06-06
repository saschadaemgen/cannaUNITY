// frontend/src/apps/wawi/pages/Strain/components/table-components/TableRow.jsx
import { Box, Typography, Rating } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import StrainTypeChip from './StrainTypeChip'
import PriceRangeCell from './PriceRangeCell'
import ActionButtons from './ActionButtons'

const TableRow = ({ 
  item, 
  availableStock,
  isExpanded, 
  onExpand, 
  onEdit, 
  onDestroy 
}) => {
  // Spalten-Definitionen für die Zeile
  const columns = [
    {
      content: item.name,
      width: '14%',
      bold: true,
      icon: ScienceIcon,
      iconColor: 'success.main',
      padding: '0 8px 0 28px'
    },
    {
      content: item.breeder,
      width: '12%',
      padding: '0 10px'
    },
    {
      content: <StrainTypeChip strainType={item.strain_type} />,
      width: '8%',
      padding: '0 10px'
    },
    {
      content: <PriceRangeCell item={item} />,
      width: '9%',
      align: 'center',
      padding: '0 10px'
    },
    {
      content: `${item.thc_percentage_max}/${item.cbd_percentage_max}`,
      width: '10%',
      align: 'center',
      padding: '0 10px'
    },
    {
      // Bestand statt Indica/Sativa
      content: (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: availableStock > 0 ? 'success.main' : 'error.main'
          }}
        >
          {availableStock !== undefined ? availableStock : '-'}
        </Typography>
      ),
      width: '10%',
      align: 'center',
      padding: '0 10px'
    },
    {
      content: `${item.flowering_time_min}-${item.flowering_time_max}`,
      width: '11%',
      align: 'center',
      padding: '0 10px'
    },
    {
      content: (
        <Rating 
          value={item.rating} 
          readOnly 
          precision={0.5} 
          size="small"
        />
      ),
      width: '8%',
      align: 'center',
      padding: '0 10px'
    },
    {
      content: (
        <ActionButtons
          item={item}
          isExpanded={isExpanded}
          onExpand={() => onExpand(item.id)}
          onEdit={onEdit}
          onDestroy={onDestroy}
        />
      ),
      width: '18%',
      align: 'center',
      padding: '0 8px'
    }
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isExpanded ? 'rgba(0, 0, 0, 0.04)' : 'white',
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
        borderLeft: '4px solid',
        borderColor: item.is_active ? 'success.main' : 'error.main',
        cursor: 'pointer',
        height: '48px',
        width: '100%',
      }}
      onClick={() => onExpand(item.id)}
    >
      {columns.map((column, index) => (
        <Box 
          key={index}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: column.align === 'center' ? 'center' : 
                         column.align === 'right' ? 'flex-end' : 'flex-start',
            width: column.width || 'auto',
            padding: column.padding || '0 16px',
            overflow: 'hidden',
            flexShrink: 0,
            textAlign: column.align || 'left',
            height: '100%'
          }}
        >
          {column.icon && (
            <column.icon 
              sx={{ 
                color: column.iconColor || 'inherit', 
                fontSize: '0.9rem', 
                mr: 0.8 
              }} 
            />
          )}
          {typeof column.content === 'string' || typeof column.content === 'number' ? (
            <Typography
              variant="body2"
              sx={{
                fontWeight: column.bold ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.8rem',
                color: column.color || 'inherit',
                lineHeight: 1.4,
              }}
            >
              {column.content}
            </Typography>
          ) : (
            column.content
          )}
        </Box>
      ))}
    </Box>
  )
}

export default TableRow