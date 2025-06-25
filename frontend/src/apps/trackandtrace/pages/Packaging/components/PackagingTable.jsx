// frontend/src/apps/trackandtrace/pages/Packaging/components/PackagingTable.jsx
import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, IconButton, Tooltip, Badge } from '@mui/material'
import { 
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

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import api from '@/utils/api'

/**
 * PackagingTable Komponente für die Darstellung der Verpackungs-Tabelle
 * 🆕 ERWEITERT: Mit vollständiger Preisanzeige und Wertberechnung
 */
const PackagingTable = ({
  tabValue,
  data,
  expandedPackagingId,
  onExpandPackaging,
  onOpenDestroyDialog,
  onOpenImageModal, // NEU
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Neue State-Variablen für Einheiten hinzufügen
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
      
      // Speichern der Einheiten
      setPackagingUnits(prev => ({
        ...prev,
        [packagingId]: res.data.results || []
      }));
      
      // Seiteninformationen speichern
      setUnitsCurrentPage(prev => ({
        ...prev,
        [packagingId]: page
      }));
      
      const total = res.data.count || 0;
      const pages = Math.ceil(total / 10); // pageSize im Backend
      setUnitsTotalPages(prev => ({
        ...prev,
        [packagingId]: pages
      }));
      
    } catch (error) {
      console.error('Fehler beim Laden der Verpackungseinheiten:', error);
      // Bei Fehler leere Liste setzen
      setPackagingUnits(prev => ({
        ...prev,
        [packagingId]: []
      }));
    } finally {
      setLoadingUnits(prev => ({ ...prev, [packagingId]: false }));
    }
  };
  
  // Funktion zum Umblättern der Einheiten-Seiten
  const handleUnitsPageChange = (packagingId, event, page) => {
    loadUnitsForPackaging(packagingId, page);
  };
  
  // Funktion zur Vernichtung einer Einheit
  const handleDestroyUnit = (unit) => {
    // Implementierung später - zunächst Platzhalter
    console.log('Vernichte Einheit:', unit);
  };

  // UseEffect hinzufügen, um Einheiten beim Aufklappen eines Batches zu laden
  useEffect(() => {
    if (expandedPackagingId && tabValue !== 3) {
      loadUnitsForPackaging(expandedPackagingId, 1);
    }
  }, [expandedPackagingId, tabValue]);

  // Hilfsfunktion zum Ermitteln des Produkttyps für die Anzeige
  const getProductTypeDisplay = (item) => {
    if (item.product_type_display) {
      return item.product_type_display;
    }
    
    // Fallback zur manuellen Anzeige
    if (item.product_type === 'marijuana') {
      return 'Marihuana';
    } else if (item.product_type === 'hashish') {
      return 'Haschisch';
    }
    
    return item.product_type || 'Unbekannt';
  };

  // 🆕 ERWEITERTE SPALTEN FÜR DEN TABELLENKOPF (MIT PREISEN UND MEDIEN):
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '11%', align: 'left' }, // Reduziert
      { label: 'Produkttyp', width: '9%', align: 'left' }, // Reduziert
      { label: 'Charge-Nummer', width: '15%', align: 'left' }, // Reduziert
      { label: 'Gewicht', width: '8%', align: 'center' },
      { label: 'Einheiten', width: '7%', align: 'center' },
      { label: 'Einheitsgewicht', width: '7%', align: 'center' },
      { label: '€/g', width: '7%', align: 'center' },
      { label: 'Gesamtwert', width: '9%', align: 'center' },
      { label: 'Verpackt von', width: '10%', align: 'left' },
      { label: 'Erstellt am', width: '9%', align: 'left' }, // Reduziert
      { label: 'Medien', width: '7%', align: 'center' }, // NEU
      { label: '', width: '4%', align: 'center' }
    ]
  }

  // 🆕 ERWEITERTE FUNKTION ZUM ERSTELLEN DER SPALTEN FÜR EINE ZEILE (MIT PREISEN UND MEDIEN):
  const getRowColumns = (packaging) => {
    // Bestimme Icon und Farbe für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (packaging.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    // Prüfe, ob dies eine Multi-Packaging-Verpackung ist (erkennen an den Notizen)
    const isMultiPackaging = packaging.notes && packaging.notes.includes('Zeile');
    
    return [
      {
        content: packaging.source_strain || "Unbekannt",
        width: '11%', // Angepasst
        bold: true,
        icon: ScienceIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: getProductTypeDisplay(packaging),
        width: '9%', // Angepasst
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
                wordBreak: 'break-word' // Ermöglicht Umbrüche bei längeren Chargen-Nummern
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
                {/* Extraktion der Position und Gesamtzahl aus den Notizen */}
                {(() => {
                  // Extrahiere die Zeilennummer aus den Notizen (z.B. "Zeile 1:")
                  const lineMatch = packaging.notes.match(/Zeile (\d+):/);
                  const lineNumber = lineMatch ? lineMatch[1] : '?';
                  // Extrahiere die Gesamtzahl der Verpackungen aus dem Batch-Namen
                  // Annahme: die höchste Nummer im Muster :XXXX ist die letzte Verpackung
                  const batchNumberSuffix = packaging.batch_number.split(':').pop();
                  const highestBatchNumber = 3; // Fallback-Wert (aus dem Beispiel)
                  return `Teil einer Mehrfachverpackung ${lineNumber}/${highestBatchNumber}`;
                })()}
              </Typography>
            )}
          </Box>
        ),
        width: '15%' // Angepasst
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
      
      // 🆕 PREIS PRO GRAMM SPALTE:
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
      
      // 🆕 GESAMTWERT SPALTE:
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
        width: '9%' // Angepasst
      },
      // NEU: Medien-Spalte
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title={`Medien verwalten (${packaging.image_count || 0})`}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenImageModal(packaging, e)
                }}
                sx={{ 
                  color: tabValue === 3 ? 'error.main' : 
                        (packaging.product_type === 'marijuana' ? 'success.main' : 'warning.main'),
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Badge 
                  badgeContent={packaging.image_count || 0} 
                  color={tabValue === 3 ? 'error' : 
                        (packaging.product_type === 'marijuana' ? 'success' : 'warning')}
                >
                  <PhotoCameraIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        ),
        width: '7%',
        align: 'center',
        stopPropagation: true
      },
      {
        content: '',  // Platz für das Aufklapp-Symbol
        width: '4%'
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
    
    // 🆕 PREISINFO IN AKTIVITÄTSMELDUNG:
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

  // 🆕 ERWEITERTE FUNKTION ZUR ANZEIGE DER VERPACKUNGSEINHEITEN-TABELLE (MIT PREISEN):
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
            {/* 🆕 GESAMTWERT-ANZEIGE: */}
            {packaging.total_batch_price && (
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 2, 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  backgroundColor: 'primary.light',
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
                    {/* 🆕 PREIS-SPALTE: */}
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
                        backgroundColor: 'white',
                        '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
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
                      {/* 🆕 PREIS-ZELLE: */}
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

  // 🆕 ERWEITERTE DETAILANSICHT FÜR EINE VERPACKUNG MIT PREISEN:
  const renderPackagingDetails = (packaging) => {
    // Bestimme Icon, Farbe und Text für den Produkttyp
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.batch_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            UUID:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.87)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}
          >
            {packaging.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Produkttyp:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(productIcon, { style: { marginRight: '4px', color: productColor }, fontSize: 'small' })}
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {productType}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(packaging.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(packaging.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.lab_testing_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    // 🆕 ERWEITERTE VERPACKUNGSDETAILS MIT PREISEN:
    const packagingDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gesamtgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {parseFloat(packaging.total_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Anzahl Einheiten:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {packaging.unit_count}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gewicht pro Einheit:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(packaging.unit_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        
        {/* 🆕 PREISDETAILS HINZUFÜGEN: */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center' }}>
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center' }}>
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 1, bgcolor: 'primary.lighter', borderRadius: 1 }}>
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {packaging.thc_content ? `${packaging.thc_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.cbd_content ? `${packaging.cbd_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
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
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
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
            color: packaging.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
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
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
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
    let cardColor = 'secondary.main';
    
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
            backgroundColor: 'white', 
            borderLeft: '4px solid',
            borderColor: cardColor,
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(packaging)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />
        
        {/* Neue Verpackungseinheiten-Tabelle einfügen, wenn nicht im "Vernichtet"-Tab */}
        {tabValue !== 3 && renderUnitTable(packaging)}

        {/* Aktionsbereich für aktive Verpackungen */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => onOpenDestroyDialog(packaging)}
              startIcon={<LocalFireDepartmentIcon />}
            >
              Verpackung vernichten
            </Button>
          </Box>
        )}
      </>
    )
  }

  // Bestimme Tabellen-Farbe basierend auf Tab
  let tableColor = 'secondary';
  if (tabValue === 1) tableColor = 'success';
  else if (tabValue === 2) tableColor = 'warning';
  else if (tabValue === 3) tableColor = 'error';

  return (
    <Box sx={{ 
      width: '100%', 
      overflowX: 'auto',
      '& .MuiTable-root': {
        width: '100%',
        tableLayout: 'fixed' // Wichtig für gleichmäßige Spaltenbreiten
      },
      '& .MuiTableCell-root': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }}>
      <TableHeader columns={getHeaderColumns()} />

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
            expandIconPosition="end"
          >
            {renderPackagingDetails(packaging)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine Verpackungen vorhanden' : 
           tabValue === 1 ? 'Kein Marihuana vorhanden' : 
           tabValue === 2 ? 'Kein Haschisch vorhanden' : 
           'Keine vernichteten Verpackungen vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color={tableColor}
      />
    </Box>
  )
}

export default PackagingTable