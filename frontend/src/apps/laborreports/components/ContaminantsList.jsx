// frontend/src/apps/laborreports/components/ContaminantsList.jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper
} from '@mui/material';

// Status-Chip mit entsprechender Farbe
const StatusChip = ({ status }) => {
  const statusConfig = {
    passed: { label: 'Bestanden', color: 'success' },
    failed: { label: 'Nicht bestanden', color: 'error' },
    pending: { label: 'Ausstehend', color: 'warning' }
  };
  
  const config = statusConfig[status] || { label: status, color: 'default' };
  
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default function ContaminantsList({ tests }) {
  if (!tests || tests.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" align="center">
            Keine Verunreinigungstests verfügbar
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  // Gruppierung nach Kategorien
  const categorizedTests = tests.reduce((acc, test) => {
    const categoryName = test.category_name || 'Unbekannte Kategorie';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(test);
    return acc;
  }, {});
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Verunreinigungstests
        </Typography>
        
        {Object.entries(categorizedTests).map(([category, categoryTests]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {category}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Verunreinigung</TableCell>
                    <TableCell align="right">Grenzwert</TableCell>
                    <TableCell align="right">Gemessener Wert</TableCell>
                    <TableCell align="right">Einheit</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryTests.map((test) => (
                    <TableRow 
                      key={test.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: test.status === 'failed' ? 'rgba(244, 67, 54, 0.05)' : 'inherit'
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {test.name}
                      </TableCell>
                      <TableCell align="right">{test.threshold_value}</TableCell>
                      <TableCell align="right">{test.detected_value}</TableCell>
                      <TableCell align="right">{test.unit}</TableCell>
                      <TableCell align="center">
                        <StatusChip status={test.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}