// frontend/src/apps/trackandtrace/components/common/TableHeader.jsx
import { Paper, Table, TableHead, TableRow, TableCell } from '@mui/material'

/**
 * TableHeader Komponente für den Tabellenkopf
 * 
 * @param {Array} columns - Array mit Spalten-Konfigurationen (label, width, align)
 */
const TableHeader = ({ columns }) => {
  return (
    <Paper elevation={1} sx={{ mb: 1.5, borderRadius: '4px', overflow: 'hidden' }}>
      <Table size="small"> {/* Änderung auf size="small" für kompaktere Darstellung */}
        <TableHead>
          <TableRow sx={{ 
            height: '48px', // Reduziert von 54px auf 48px (ca. 11% Reduzierung)
            bgcolor: 'rgba(0, 0, 0, 0.04)' 
          }}>
            {columns.map((column, index) => (
              <TableCell 
                key={index}
                sx={{ 
                  width: column.width || 'auto', 
                  fontWeight: 'bold', 
                  padding: '8px 12px', // Reduziert von 12px 16px auf 8px 12px
                  textAlign: column.align || 'left', 
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  fontSize: '0.8rem', // Weiter reduziert von 0.85rem auf 0.8rem
                  height: '48px' // Explizite Höhenangabe
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      </Table>
    </Paper>
  )
}

export default TableHeader