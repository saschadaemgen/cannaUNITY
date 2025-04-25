// frontend/src/apps/trackandtrace/components/common/TableHeader.jsx
import { Paper, Table, TableHead, TableRow, TableCell } from '@mui/material'

/**
 * TableHeader Komponente für den Tabellenkopf
 * 
 * @param {Array} columns - Array mit Spalten-Konfigurationen (label, width, align)
 */
const TableHeader = ({ columns }) => {
  return (
    <Paper elevation={1} sx={{ mb: 2, borderRadius: '4px', overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ height: '56px', bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
            {columns.map((column, index) => (
              <TableCell 
                key={index}
                sx={{ 
                  width: column.width || 'auto', 
                  fontWeight: 'bold', 
                  padding: '12px 16px', 
                  textAlign: column.align || 'left', 
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle'
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
