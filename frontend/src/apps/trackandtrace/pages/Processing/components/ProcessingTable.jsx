// frontend/src/apps/trackandtrace/pages/Processing/components/ProcessingTable.jsx
import React from 'react'
import { 
  Box, Typography, Button, IconButton, Badge, Tooltip,
  FormControl, Select, MenuItem, useTheme, alpha
} from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SeedIcon from '@mui/icons-material/Spa'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import ScienceIcon from '@mui/icons-material/Science'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'

const ProcessingTable = ({
  tabValue,
  data,
  expandedProcessingId,
  onExpandProcessing,
  onOpenDestroyDialog,
  onOpenConvertToLabTestingDialog,
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
  
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '13%', align: 'left' },
      { label: 'Produkttyp', width: '10%', align: 'left' },
      { label: 'Charge-Nummer', width: '15%', align: 'left' },
      { label: 'Input-Gewicht', width: '10%', align: 'center' },
      { label: 'Output-Gewicht', width: '10%', align: 'center' },
      { label: 'Ausbeute', width: '8%', align: 'center' },
      { label: 'Verarbeitet von', width: '11%', align: 'left' },
      { label: 'Erstellt am', width: '9%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (processing) => {
    const yieldPercentage = processing.yield_percentage.toFixed(1);
    
    // Bestimme Icon und Farbe für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (processing.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    // Bestimme Tab-Farbe
    let tabColor = 'primary.main';
    if (tabValue === 1) tabColor = 'success.main';
    else if (tabValue === 2) tabColor = 'warning.main';
    else if (tabValue === 3) tabColor = 'error.main';
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandProcessing(processing.id);
            }}
            size="small"
            sx={{ 
              color: tabColor,
              width: '28px',
              height: '28px',
              transform: expandedProcessingId === processing.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: processing.source_strain || "Unbekannt",
        width: '13%',
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: processing.product_type_display || processing.product_type,
        width: '10%',
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: processing.batch_number || '',
        width: '15%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(processing.input_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center'
      },
      {
        content: `${parseFloat(processing.output_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: SpeedIcon,
        iconColor: tabValue === 3 ? 'error.main' : (processing.product_type === 'marijuana' ? 'success.main' : 'warning.main')
      },
      {
        content: `${yieldPercentage}%`,
        width: '8%',
        align: 'center'
      },
      {
        content: processing.member ? 
          (processing.member.display_name || `${processing.member.first_name} ${processing.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '11%'
      },
      {
        content: new Date(processing.created_at).toLocaleDateString('de-DE'),
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
              <Tooltip title={`Medien verwalten (${processing.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(processing, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge 
                    badgeContent={processing.image_count || 0} 
                    color={tabValue === 3 ? 'error' : 
                          (processing.product_type === 'marijuana' ? 'success' : 'warning')}
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
  const getActivityMessage = (processing) => {
    const processor = processing.member 
      ? (processing.member.display_name || `${processing.member.first_name} ${processing.member.last_name}`) 
      : "Unbekannt";
    const roomName = processing.room ? processing.room.name : "unbekanntem Raum";
    const date = new Date(processing.created_at).toLocaleDateString('de-DE');
    const inputWeight = parseFloat(processing.input_weight).toLocaleString('de-DE');
    const outputWeight = parseFloat(processing.output_weight).toLocaleString('de-DE');
    const dryingInfo = processing.drying_batch_number || "Unbekannte Charge";
    const yieldPercentage = processing.yield_percentage.toFixed(1);
    const wasteWeight = processing.waste_weight.toLocaleString('de-DE');
    const productType = processing.product_type_display || processing.product_type;
    
    if (tabValue !== 3) {
      return `${productType} ${processing.batch_number} mit Genetik ${processing.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} erstellt. Input-Gewicht: ${inputWeight}g, Output-Gewicht: ${outputWeight}g, Ausbeute: ${yieldPercentage}%, Verarbeitungsverlust: ${wasteWeight}g. Quelle: Trocknung ${dryingInfo}.`;
    } else {
      const destroyDate = processing.destroyed_at ? new Date(processing.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = processing.destroyed_by ? 
        (processing.destroyed_by.display_name || `${processing.destroyed_by.first_name} ${processing.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `${productType} ${processing.batch_number} mit Genetik ${processing.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${processing.destroy_reason || "Kein Grund angegeben"}. Output-Gewicht: ${outputWeight}g.`;
    }
  };

  // Detailansicht für eine Verarbeitung rendern
  const renderProcessingDetails = (processing) => {
    // Bestimme Icon, Farbe und Text für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    let productType = 'Marihuana';
    
    if (processing.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
      productType = 'Haschisch';
    }
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {processing.batch_number}
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
            {processing.id}
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
            {new Date(processing.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && processing.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {new Date(processing.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {processing.drying_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const yieldDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {processing.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Input-Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {parseFloat(processing.input_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Output-Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {parseFloat(processing.output_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Ausbeute:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {processing.yield_percentage.toFixed(1)}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Verarbeitungsverlust:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {processing.waste_weight.toLocaleString('de-DE')}g
          </Typography>
        </Box>
        {tabValue === 3 && processing.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {processing.destroyed_by.display_name || 
               `${processing.destroyed_by.first_name || ''} ${processing.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: processing.notes ? 'flex-start' : 'center',
          justifyContent: processing.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: processing.notes ? 'normal' : 'italic',
            color: processing.notes ? 'text.primary' : 'text.secondary',
            width: '100%'
          }}
        >
          {processing.notes || 'Keine Notizen für diese Verarbeitung vorhanden'}
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
            fontStyle: processing.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {processing.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Verarbeitungs-Details',
        content: yieldDetails
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
      cardColor = processing.product_type === 'marijuana' ? 'success.main' : 'warning.main';
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
            {getActivityMessage(processing)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />

        {/* Aktionsbereich für aktive Verarbeitungen */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {/* Linke Seite: Button für Konvertierung zu Laborkontrolle */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.info.main, 0.08),
                  borderColor: alpha(theme.palette.info.main, 0.5)
                }
              }}
            >
              <Button 
                variant="text" 
                color="info"
                onClick={() => onOpenConvertToLabTestingDialog(processing)}
                startIcon={<ScienceIcon />}
                sx={{ textTransform: 'none' }}
              >
                Zu Laborkontrolle konvertieren
              </Button>
            </Box>
            
            {/* Rechte Seite: Button für Vernichtung */}
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
                onClick={() => onOpenDestroyDialog(processing)}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Verarbeitung vernichten
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
            data.map((processing) => (
              <AccordionRow
                key={processing.id}
                isExpanded={expandedProcessingId === processing.id}
                onClick={() => onExpandProcessing(processing.id)}
                columns={getRowColumns(processing)}
                borderColor={
                  tabValue === 3 ? 'error.main' : 
                  (processing.product_type === 'marijuana' ? 'success.main' : 'warning.main')
                }
                expandIconPosition="none"
                borderless={true}
              >
                {renderProcessingDetails(processing)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              {tabValue === 0 ? 'Keine Verarbeitungen vorhanden' : 
               tabValue === 1 ? 'Kein Marihuana vorhanden' : 
               tabValue === 2 ? 'Kein Haschisch vorhanden' : 
               'Keine vernichteten Verarbeitungen vorhanden'}
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

export default ProcessingTable