import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Divider, Chip, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Accordion, AccordionSummary, 
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import InventoryIcon from '@mui/icons-material/Inventory';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ScaleIcon from '@mui/icons-material/Scale';
import api from '@/utils/api';

const MemberDistributionHistory = ({ memberId }) => {
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!memberId) return;
    
    const fetchDistributionData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/trackandtrace/distributions/member_summary/?member_id=${memberId}`);
        setDistributionData(response.data);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Ausgabehistorie:', err);
        setError('Distributionsdaten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistributionData();
  }, [memberId]);
  
  if (loading) {
    return <Typography>Lade Ausgabehistorie...</Typography>;
  }
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  
  if (!distributionData) {
    return <Typography>Keine Daten verfügbar</Typography>;
  }
  
  // Hilfsfunktion zur Formatierung des Datums
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Produktausgaben
      </Typography>
      
      {/* Zusammenfassung */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Zusammenfassung
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Chip
            icon={<InventoryIcon />}
            label={`Insgesamt ${distributionData.received.total_count} Ausgaben erhalten`}
            color="primary"
          />
          <Chip
            icon={<ScaleIcon />}
            label={`Gesamtgewicht: ${distributionData.received.total_weight.toFixed(2)}g`}
            color="secondary"
          />
          <Chip
            icon={<DateRangeIcon />}
            label={`${distributionData.received.recent_count} Ausgaben in den letzten 30 Tagen`}
            color="info"
          />
        </Box>
      </Paper>
      
      {/* Details der letzten Ausgaben */}
      <Typography variant="subtitle1" gutterBottom>
        Letzte Ausgaben (30 Tage)
      </Typography>
      
      {distributionData.received.recent_count > 0 ? (
        <Box>
          {distributionData.received.recent_distributions.map((distribution) => (
            <Accordion key={distribution.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      Ausgabe vom {formatDate(distribution.distribution_date)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {distribution.total_weight.toFixed(2)}g
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    {distribution.product_type_summary.map((product, idx) => {
                      const isMarijuana = product.type === 'Marihuana';
                      const ProductIcon = isMarijuana ? LocalFloristIcon : FilterDramaIcon;
                      
                      return (
                        <Chip
                          key={idx}
                          size="small"
                          icon={<ProductIcon />}
                          label={`${product.type}: ${product.weight.toFixed(2)}g`}
                          color={isMarijuana ? 'success' : 'warning'}
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: '24px',
                            '& .MuiChip-label': { px: 1 },
                            '& .MuiChip-icon': { ml: 0.5 }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Chargennummer:</strong> {distribution.batch_number}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Ausgegeben von:</strong> {distribution.distributor.first_name} {distribution.distributor.last_name}
                  </Typography>
                  {distribution.notes && (
                    <Typography variant="body2">
                      <strong>Bemerkungen:</strong> {distribution.notes}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Erhaltene Verpackungseinheiten:
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Einheits-Nr.</TableCell>
                        <TableCell>Produkttyp</TableCell>
                        <TableCell align="right">Gewicht</TableCell>
                        <TableCell>THC-Gehalt</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {distribution.packaging_units.map((unit) => {
                        const batch = unit.batch || {};
                        const productType = batch.product_type_display || 'Unbekannt';
                        const isMarijuana = productType.toLowerCase().includes('marihuana');
                        
                        return (
                          <TableRow key={unit.id}>
                            <TableCell>{unit.batch_number}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {isMarijuana ? (
                                  <LocalFloristIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                ) : (
                                  <FilterDramaIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                                )}
                                {productType}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{parseFloat(unit.weight).toFixed(2)}g</TableCell>
                            <TableCell>
                              {batch.thc_content ? `${batch.thc_content}%` : 'k.A.'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Keine Produktausgaben in den letzten 30 Tagen
        </Typography>
      )}
    </Box>
  );
};

export default MemberDistributionHistory;