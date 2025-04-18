// frontend/src/apps/trackandtrace/components/TableComponent.jsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Collapse,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Edit, Delete } from '@mui/icons-material';

const TableComponent = ({ 
  columns, 
  data, 
  detailsComponent: DetailsComponent,
  onEdit,
  onDelete,
  onMarkAsDestroyed
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowExpand = (uuid) => {
    setExpandedRow(expandedRow === uuid ? null : uuid);
  };

  // Sicherstellen, dass data ein Array ist
  const safeData = Array.isArray(data) ? data : [];
  
  // Pagination berechnen
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleRows = safeData.slice(startIndex, endIndex);

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              {columns.map((column) => (
                <TableCell 
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => {
                const isExpanded = expandedRow === row.uuid;
                return (
                  <React.Fragment key={row.uuid}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(row.uuid)}
                        >
                          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.format ? column.format(value, row) : value}
                          </TableCell>
                        );
                      })}
                      
                      <TableCell align="right">
                        {row.is_destroyed ? (
                          <Chip label="Vernichtet" color="error" size="small" />
                        ) : (
                          <Chip label="Aktiv" color="success" size="small" />
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(row)}
                          disabled={row.is_destroyed}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => onDelete(row)}
                          disabled={row.is_destroyed}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expandable Details Row */}
                    <TableRow>
                      <TableCell colSpan={columns.length + 3} style={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Details
                            </Typography>
                            {DetailsComponent && <DetailsComponent data={row} onMarkAsDestroyed={onMarkAsDestroyed} />}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 3} align="center">
                  Keine Daten verfügbar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={safeData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TableComponent;