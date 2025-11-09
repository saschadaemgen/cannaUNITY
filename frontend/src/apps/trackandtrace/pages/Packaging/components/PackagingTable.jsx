// frontend/src/apps/trackandtrace/pages/Packaging/components/PackagingTable.jsx
import React, { useState, useEffect } from 'react'
import { 
  Box, Typography, Button, IconButton, Badge, Tooltip,
  FormControl, Select, MenuItem, useTheme, alpha,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, Pagination
} from '@mui/material'
import InventoryIcon from '@mui/icons-material/Inventory'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import EuroIcon from '@mui/icons-material/Euro'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import api from '@/utils/api'

const PackagingTable = ({
  tabValue,
  data,
  expandedPackagingId,
  onExpandPackaging,
  onOpenDestroyDialog,
  onOpenImageModal,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount,
  yearFilter,
  setYearFilter,
  monthFilter,
  setMonthFilter,
  dayFilter,
  setDayFilter,
  productTypeFilter,
  setProductTypeFilter,
  showFilters,
  setShowFilters,
  onFilterApply,
  onFilterReset
}) => {
  const theme = useTheme();
  
  // State-Variablen für Einheiten
  const [packagingUnits, setPackagingUnits] = useState({});
  const [unitsCurrentPage, setUnitsCurrentPage] = useState({});
  const [unitsTotalPages, setUnitsTotalPages] = useState({});
  const [loadingUnits, setLoadingUnits] = useState({});
  
  // Funktion zum Laden der Verpackungseinheiten
  const loadUnitsForPackaging = async (packagingId, page = 1) => {
    try {
      setLoadingUnits(prev => ({ ...prev, [packagingId]: true }));
      
      console.log(`Lade Verpackungseinheiten für Batch ${packagingId}, Seite ${page}`);
      const res = await api.get(`/trackandtrace/packaging/${packagingId}/units/?page=${page}&destroyed=false`);
      
      console.log('Geladene Verpackungseinheiten:', res.data);
      
      setPackagingUnits(prev => ({
        ...prev,
        [packagingId]: res.data.results || []
      }));
      
      setUnitsCurrentPage(prev => ({
        ...prev,
        [packagingId]: page
      }));
      
      const total = res.data.count || 0;
      const pages = Math.ceil(total / 10);
      setUnitsTotalPages(prev => ({
        ...prev,
        [packagingId]: pages
      }));
      
    } catch (error) {
      console.error('Fehler beim Laden der Verpackungseinheiten:', error);
      setPackagingUnits(prev => ({
        ...prev,
        [packagingId]: []
      }));
    } finally {
      setLoadingUnits(prev => ({ ...prev, [packagingId]: false }));
    }
  };
  
  const handleUnitsPageChange = (packagingId, event, page) => {
    loadUnitsForPackaging(packagingId, page);
  };
  
  const handleDestroyUnit = (unit) => {
    console.log('Vernichte Einheit:', unit);
  };

  useEffect(() => {
    if (expandedPackagingId && tabValue !== 3) {
      loadUnitsForPackaging(expandedPackagingId, 1);
    }
  }, [expandedPackagingId, tabValue]);

  const getProductTypeDisplay = (item) => {
    if (item.product_type_display) {
      return item.product_type_display;
    }
    
    if (item.product_type === 'marijuana') {
      return 'Marihuana';
    } else if (item.product_type === 'hashish') {
      return 'Haschisch';
    }
    
    return item.product_type || 'Unbekannt';
  };

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '10%', align: 'left' },
      { label: 'Produkttyp', width: '8%', align: 'left' },
      { label: 'Charge-Nummer', width: '14%', align: 'left' },
      { label: 'Gewicht', width: '8%', align: 'center' },
      { label: 'Einheiten', width: '7%', align: 'center' },
      { label: 'Einheitsgewicht', width: '7%', align: 'center' },
      { label: '€/g', width: '7%', align: 'center' },
      { label: 'Gesamtwert', width: '9%', align: 'center' },
      { label: 'Verpackt von', width: '10%', align: 'left' },
      { label: 'Erstellt am', width: '9%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (packaging) => {
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (packaging.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    // Bestimme Tab-Farbe
    let tabColor = 'primary.main';
    if (tabValue === 1) tabColor = 'success.main';
    else if (tabValue === 2) tabColor = 'warning.main';
    else if (tabValue === 3) tabColor = 'error.main';
    
    const isMultiPackaging = packaging.notes && packaging.notes.includes('Zeile');
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandPackaging(packaging.id);
            }}
            size="small"
            sx={{ 
              color: tabColor,
              width: '28px',
              height: '28px',
              transform: expandedPackagingId === packaging.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        ),
        width: '3%',
        align: 'center'
      },
      {
        content: packaging.source_strain || "Unbekannt",
        width: '10%',
        bold: true,
        icon: ScienceIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: getProductTypeDisplay(packaging),
        width: '8%',
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: (
          <Box sx={{ 
            maxWidth: '100%', 
            paddingRight: '8px',
          }}>
            <Typography 
              variant="body2" 
              fontFamily="monospace" 
              fontSize="0.7rem" 
              sx={{ 
                display: 'block', 
                pt: '3px',
                lineHeight: 1.2,
                wordBreak: 'break-word'
              }}
            >
              {packaging.batch_number || ''}
            </Typography>
            {packaging.notes && packaging.notes.includes('Zeile') && (
              <Typography 
                variant="caption" 
                color="primary.main" 
                fontSize="0.65rem"
                sx={{ display: 'block' }}
              >
                {(() => {
                  const lineMatch = packaging.notes.match(/Zeile (\d+):/);
                  const lineNumber = lineMatch ? lineMatch[1] : '?';
                  const batchNumberSuffix = packaging.batch_number.split(':').pop();
                  const highestBatchNumber = 3;
                  return `Teil einer Mehrfachverpackung ${lineNumber}/${highestBatchNumber}`;
                })()}
              </Typography>
            )}
          </Box>
        ),
        width: '14%'
      },
      {
        content: `${parseFloat(packaging.total_weight).toLocaleString('de-DE')}g`,
        width: '8%',
        align: 'center'
      },
      {
        content: packaging.unit_count,
        width: '7%',
        align: 'center',
        bold: true,
        icon: InventoryIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: `${parseFloat(packaging.unit_weight).toLocaleString('de-DE')}g`,
        width: '7%',
        align: 'center'
      },
      {
        content: packaging.price_per_gram ? 
          `${parseFloat(packaging.price_per_gram).toFixed(2)}€` : 
          "—",
        width: '7%',
        align: 'center',
        bold: true,
        icon: packaging.price_per_gram ? EuroIcon : null,
        iconColor: tabValue === 3 ? 'error.main' : 'success.main',
        color: packaging.price_per_gram ? (tabValue === 3 ? 'error.main' : 'success.main') : 'text.secondary'
      },
      {
        content: packaging.total_batch_price ? 
          `${parseFloat(packaging.total_batch_price).toFixed(2)}€` : 
          "—",
        width: '9%',
        align: 'center',
        bold: true,
        icon: packaging.total_batch_price ? AttachMoneyIcon : null,
        iconColor: tabValue === 3 ? 'error.main' : 'primary.main',
        color: packaging.total_batch_price ? (tabValue === 3 ? 'error.main' : 'primary.main') : 'text.secondary'
      },
      {
        content: packaging.member ? 
          (packaging.member.display_name || `${packaging.member.first_name} ${packaging.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '10%'
      },
      {
        content: new Date(packaging.created_at).toLocaleDateString('de-DE'),
        width: '9%'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title={`Medien verwalten (${packaging.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(packaging, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge 
                    badgeContent={packaging.image_count || 0} 
                    color={tabValue === 3 ? 'error' : 
                          (packaging.product_type === 'marijuana' ? 'success' : 'warning')}
                  >
                    <PhotoCameraIcon sx={{ fontSize: '1rem' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),
        width: '5%',
        align: 'center',
        stopPropagation: true
      }
    ]
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (packaging) => {
    const processor = packaging.member 
      ? (packaging.member.display_name || `${packaging.member.first_name} ${packaging.member.last_name}`) 
      : "Unbekannt";
    const roomName = packaging.room ? packaging.room.name : "unbekanntem Raum";
    const date = new Date(packaging.created_at).toLocaleDateString('de-DE');
    const totalWeight = parseFloat(packaging.total_weight).toLocaleString('de-DE');
    const unitCount = packaging.unit_count;
    const unitWeight = parseFloat(packaging.unit_weight).toLocaleString('de-DE');
    const productType = getProductTypeDisplay(packaging);
    const labTestingInfo = packaging.lab_testing_batch_number || "Unbekannte Charge";
    
    const priceInfo = packaging.total_batch_price ? 
      ` Gesamtwert: ${parseFloat(packaging.total_batch_price).toFixed(2)}€` : 
      "";
    
    if (tabValue !== 3) {
      return `${productType} ${packaging.batch_number} mit Genetik ${packaging.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} verpackt. Gesamtgewicht: ${totalWeight}g, Anzahl Einheiten: ${unitCount}, Gewicht pro Einheit: ${unitWeight}g.${priceInfo} Quelle: Laborkontrolle ${labTestingInfo}.`;
    } else {
      const destroyDate = packaging.destroyed_at ? new Date(packaging.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = packaging.destroyed_by ? 
        (packaging.destroyed_by.display_name || `${packaging.destroyed_by.first_name} ${packaging.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Verpackung ${productType} ${packaging.batch_number} mit Genetik ${packaging.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${packaging.destroy_reason || "Kein Grund angegeben"}. Gesamtgewicht: ${totalWeight}g, Anzahl Einheiten: ${unitCount}.${priceInfo}`;
    }
  };

  // Funktion zur Anzeige der Verpackungseinheiten-Tabelle
  const renderUnitTable = (packaging) => {
    const packagingId = packaging.id;
    const isLoading = loadingUnits[packagingId];
    const units = packagingUnits[packagingId] || [];
    
    return (
      <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <InventoryIcon sx={{ mr: 1 }} />
            Verpackungseinheiten
            {packaging.total_batch_price && (
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 2, 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                💰 Gesamtwert: {parseFloat(packaging.total_batch_price).toFixed(2)}€
              </Typography>
            )}
          </Typography>
        </Box>
        
        {isLoading ? (
          <LoadingIndicator size={24} />
        ) : units.length > 0 ? (
          <>
            <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'secondary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Einheits-Nummer</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Gewicht</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <EuroIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      Stückpreis
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Erstellt am</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units.map((unit, i) => (
                    <TableRow 
                      key={unit.id}
                      sx={{ 
                        backgroundColor: theme.palette.background.paper,
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.05) }
                      }}
                    >
                      <TableCell>
                        {unit.batch_number || `Einheit ${i+1}`}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {unit.id}
                      </TableCell>
                      <TableCell>
                        {parseFloat(unit.weight).toLocaleString('de-DE')}g
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {unit.unit_price ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EuroIcon sx={{ mr: 0.5, fontSize: 14, color: 'success.main' }} />
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {parseFloat(unit.unit_price).toFixed(2)}€
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            k.A.
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(unit.created_at).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: 'white',
                            backgroundColor: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.dark'
                            },
                            width: '28px',
                            height: '28px'
                          }}
                          onClick={() => handleDestroyUnit(unit)}
                        >
                          <LocalFireDepartmentIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination für Einheiten */}
            {unitsTotalPages[packagingId] > 1 && (
              <Box display="flex" justifyContent="center" mt={2} width="100%">
                <Pagination 
                  count={unitsTotalPages[packagingId]} 
                  page={unitsCurrentPage[packagingId] || 1} 
                  onChange={(e, page) => handleUnitsPageChange(packagingId, e, page)}
                  color="secondary"
                  size="small"
                />
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            Keine Verpackungseinheiten verfügbar.
          </Typography>
        )}
      </Box>
    );
  };

  // Detailansicht für eine Verpackung rendern
  const renderPackagingDetails = (packaging) => {
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    let productType = getProductTypeDisplay(packaging);
    
    if (packaging.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {packaging.batch_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            UUID:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.primary',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}
          >
            {packaging.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Produkttyp:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(productIcon, { style: { marginRight: '4px', color: productColor }, fontSize: 'small' })}
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {productType}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {new Date(packaging.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {new Date(packaging.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {packaging.lab_testing_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const packagingDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {packaging.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Gesamtgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {parseFloat(packaging.total_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Anzahl Einheiten:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {packaging.unit_count}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Gewicht pro Einheit:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {parseFloat(packaging.unit_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            <EuroIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Preis pro Gramm:
          </Typography>
          <Typography variant="body2" sx={{ 
            color: packaging.price_per_gram ? 'success.main' : 'text.secondary', 
            fontWeight: 'bold' 
          }}>
            {packaging.price_per_gram ? 
              `${parseFloat(packaging.price_per_gram).toFixed(2)} €` : 
              "Nicht festgelegt"
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Preis pro Einheit:
          </Typography>
          <Typography variant="body2" sx={{ 
            color: packaging.unit_price ? 'primary.main' : 'text.secondary', 
            fontWeight: 'bold' 
          }}>
            {packaging.unit_price ? 
              `${parseFloat(packaging.unit_price).toFixed(2)} €` : 
              "Nicht berechnet"
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Gesamtwert:
          </Typography>
          <Typography variant="h6" sx={{ 
            color: packaging.total_batch_price ? 'primary.main' : 'text.secondary', 
            fontWeight: 'bold'
          }}>
            {packaging.total_batch_price ? 
              `${parseFloat(packaging.total_batch_price).toFixed(2)} €` : 
              "Nicht berechnet"
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {packaging.thc_content ? `${packaging.thc_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {packaging.cbd_content ? `${packaging.cbd_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {packaging.destroyed_by.display_name || 
               `${packaging.destroyed_by.first_name || ''} ${packaging.destroyed_by.last_name || ''}`.trim() || 
               "Unbekannt"}
            </Typography>
          </Box>
        )}
      </Box>
    )

    const notesContent = (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          flexGrow: 1,
          display: 'flex',
          alignItems: packaging.notes ? 'flex-start' : 'center',
          justifyContent: packaging.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: packaging.notes ? 'normal' : 'italic',
            color: packaging.notes ? 'text.primary' : 'text.secondary',
            width: '100%'
          }}
        >
          {packaging.notes || 'Keine Notizen für diese Verpackung vorhanden'}
        </Typography>
      </Box>
    )

    const destroyReasonContent = (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          flexGrow: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: packaging.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {packaging.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Verpackungs-Details',
        content: packagingDetails
      },
      {
        title: tabValue === 3 ? 'Vernichtungsgrund' : 'Notizen',
        content: tabValue === 3 ? destroyReasonContent : notesContent
      }
    ]

    // Bestimme Farbe basierend auf Tab und Produkttyp
    let cardColor = 'primary.main';
    
    if (tabValue === 3) {
      cardColor = 'error.main';
    } else if (tabValue === 0) {
      cardColor = packaging.product_type === 'marijuana' ? 'success.main' : 'warning.main';
    } else if (tabValue === 1) {
      cardColor = 'success.main';
    } else if (tabValue === 2) {
      cardColor = 'warning.main';
    }

    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: cardColor,
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(packaging)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />
        
        {/* Verpackungseinheiten-Tabelle */}
        {tabValue !== 3 && renderUnitTable(packaging)}

        {/* Aktionsbereich für aktive Verpackungen */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  borderColor: alpha(theme.palette.error.main, 0.5)
                }
              }}
            >
              <Button 
                variant="text" 
                color="error"
                onClick={() => onOpenDestroyDialog(packaging)}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Verpackung vernichten
              </Button>
            </Box>
          </Box>
        )}
      </>
    )
  }

  // Bestimme Tabellen-Farbe basierend auf Tab
  let tableColor = 'primary';
  if (tabValue === 1) tableColor = 'success';
  else if (tabValue === 2) tableColor = 'warning';
  else if (tabValue === 3) tableColor = 'error';

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default,
      overflow: 'hidden'
    }}>
      {/* Filter Section - jetzt oben */}
      {showFilters && (
        <Box sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          flexShrink: 0
        }}>
          <FilterSection
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            onApply={onFilterApply}
            onReset={onFilterReset}
            showFilters={showFilters}
            productTypeFilter={productTypeFilter}
            setProductTypeFilter={setProductTypeFilter}
            showProductTypeFilter={tabValue === 0 || tabValue === 3}
          />
        </Box>
      )}
      
      {/* Scrollbare Container für Header + Content */}
      <Box sx={{ 
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Scrollbarer Bereich */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          mt: 0,
          pt: 0,
          // Schöne Scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme => alpha(theme.palette.primary.main, 0.3),
            },
          },
        }}>
          {/* Tabellenkopf - sticky innerhalb des scrollbaren Containers */}
          <Box sx={{ 
            width: '100%', 
            display: 'flex',
            bgcolor: theme.palette.background.paper,
            height: '40px',
            alignItems: 'center',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            mt: 0,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              right: 0,
              height: '2px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
              pointerEvents: 'none'
            }
          }}>
            {getHeaderColumns().map((column, index) => (
              <Box
                key={index}
                sx={{ 
                  width: column.width || 'auto', 
                  px: 1.5,
                  textAlign: column.align || 'left', 
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {column.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Tabellenzeilen */}
          {data && data.length > 0 ? (
            data.map((packaging) => (
              <AccordionRow
                key={packaging.id}
                isExpanded={expandedPackagingId === packaging.id}
                onClick={() => onExpandPackaging(packaging.id)}
                columns={getRowColumns(packaging)}
                borderColor={
                  tabValue === 3 ? 'error.main' : 
                  (packaging.product_type === 'marijuana' ? 'success.main' : 'warning.main')
                }
                expandIconPosition="none"
                borderless={true}
              >
                {renderPackagingDetails(packaging)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              {tabValue === 0 ? 'Keine Verpackungen vorhanden' : 
               tabValue === 1 ? 'Kein Marihuana vorhanden' : 
               tabValue === 2 ? 'Kein Haschisch vorhanden' : 
               'Keine vernichteten Verpackungen vorhanden'}
            </Typography>
          )}
        </Box>
        
        {/* Pagination - außerhalb des scrollbaren Bereichs */}
        <Box 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backgroundColor: theme.palette.background.paper,
            p: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            minHeight: '56px'
          }}
        >
          {/* PaginationFooter */}
          {data && data.length > 0 && totalPages > 1 && (
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasData={true}
              color={tableColor}
            />
          )}
          
          {/* Einträge pro Seite */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            ml: data && data.length > 0 && totalPages > 1 ? 3 : 0 
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Einträge pro Seite
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                sx={{ fontSize: '0.875rem' }}
              >
                {pageSizeOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default PackagingTable