// frontend/src/apps/trackandtrace/pages/Drying/components/DryingTable.jsx
import { 
  Box, Typography, Button, IconButton, Badge, Tooltip,
  FormControl, Select, MenuItem, useTheme, alpha
} from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SpeedIcon from '@mui/icons-material/Speed'
import SeedIcon from '@mui/icons-material/Spa'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'

const DryingTable = ({
  tabValue,
  data,
  expandedDryingId,
  onExpandDrying,
  onOpenDestroyDialog,
  onOpenProcessingDialog,
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
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer', width: '14%', align: 'left' },
      { label: 'Frischgewicht', width: '10%', align: 'center' },
      { label: 'Trockengewicht', width: '10%', align: 'center' },
      { label: 'Gewichtsverlust', width: '10%', align: 'center' },
      { label: 'Verarbeitet von', width: '12%', align: 'left' },
      { label: 'Raum', width: '9%', align: 'left' },
      { label: 'Ernte-Charge', width: '11%', align: 'left' },
      { label: 'Erstellt am', width: '8%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (drying) => {
    const weightLoss = parseFloat(drying.initial_weight) - parseFloat(drying.final_weight);
    const weightLossPercentage = (weightLoss / parseFloat(drying.initial_weight) * 100).toFixed(1);
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandDrying(drying.id);
            }}
            size="small"
            sx={{ 
              color: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main'),
              width: '28px',
              height: '28px',
              transform: expandedDryingId === drying.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: drying.source_strain || "Unbekannt",
        width: '12%',
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: drying.batch_number || '',
        width: '14%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(drying.initial_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: ScaleIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: `${parseFloat(drying.final_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: AcUnitIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: `${weightLossPercentage}%`,
        width: '10%',
        align: 'center'
      },
      {
        content: drying.member ? 
          (drying.member.display_name || `${drying.member.first_name} ${drying.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '12%'
      },
      {
        content: drying.room ? drying.room.name : "Nicht zugewiesen",
        width: '9%'
      },
      {
        content: drying.harvest_batch_number || "Unbekannt",
        width: '11%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: new Date(drying.created_at).toLocaleDateString('de-DE'),
        width: '8%'
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
              <Tooltip title={`Bilder verwalten (${drying.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(drying, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge 
                    badgeContent={drying.image_count || 0} 
                    color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
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
  const getActivityMessage = (drying) => {
    const processor = drying.member 
      ? (drying.member.display_name || `${drying.member.first_name} ${drying.member.last_name}`) 
      : "Unbekannt";
    const roomName = drying.room ? drying.room.name : "unbekanntem Raum";
    const date = new Date(drying.created_at).toLocaleDateString('de-DE');
    const initialWeight = parseFloat(drying.initial_weight).toLocaleString('de-DE');
    const finalWeight = parseFloat(drying.final_weight).toLocaleString('de-DE');
    const harvestInfo = drying.harvest_batch_number || "Unbekannte Charge";
    const weightLoss = (parseFloat(drying.initial_weight) - parseFloat(drying.final_weight)).toLocaleString('de-DE');
    const weightLossPercentage = (((parseFloat(drying.initial_weight) - parseFloat(drying.final_weight)) / parseFloat(drying.initial_weight)) * 100).toFixed(1);
    
    if (tabValue === 0) {
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} erstellt. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%). Quelle: Ernte ${harvestInfo}.`;
    } else if (tabValue === 1) {
      const processedDate = drying.processed_at ? new Date(drying.processed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const processor = drying.processed_by ? 
        (drying.processed_by.display_name || `${drying.processed_by.first_name} ${drying.processed_by.last_name}`) 
        : "Unbekannt";
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${processedDate} von ${processor} zur Verarbeitung überführt. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%).`;
    } else {
      const destroyDate = drying.destroyed_at ? new Date(drying.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = drying.destroyed_by ? 
        (drying.destroyed_by.display_name || `${drying.destroyed_by.first_name} ${drying.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${drying.destroy_reason || "Kein Grund angegeben"}. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%).`;
    }
  };

  // Detailansicht für eine Trocknung rendern
  const renderDryingDetails = (drying) => {
    const weightLoss = parseFloat(drying.initial_weight) - parseFloat(drying.final_weight);
    const weightLossPercentage = (weightLoss / parseFloat(drying.initial_weight) * 100).toFixed(1);
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {drying.batch_number}
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
            {drying.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {new Date(drying.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 2 && drying.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {new Date(drying.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {drying.harvest_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const weightDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {drying.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Frischgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {parseFloat(drying.initial_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Trockengewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {parseFloat(drying.final_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Gewichtsverlust:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {weightLoss.toLocaleString('de-DE')}g ({weightLossPercentage}%)
          </Typography>
        </Box>
        {tabValue === 2 && drying.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {drying.destroyed_by.display_name || 
               `${drying.destroyed_by.first_name || ''} ${drying.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: drying.notes ? 'flex-start' : 'center',
          justifyContent: drying.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: drying.notes ? 'normal' : 'italic',
            color: drying.notes ? 'text.primary' : 'text.secondary',
            width: '100%'
          }}
        >
          {drying.notes || 'Keine Notizen für diese Trocknung vorhanden'}
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
            fontStyle: drying.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {drying.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Trocknungs-Details',
        content: weightDetails
      },
      {
        title: tabValue === 0 || tabValue === 1 ? 'Notizen' : 'Vernichtungsgrund',
        content: tabValue === 0 || tabValue === 1 ? notesContent : destroyReasonContent
      }
    ]

    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main'),
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(drying)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')} />

        {/* Aktionsbereich für aktive Trocknungen */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
                onClick={() => onOpenDestroyDialog(drying)}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Trocknung vernichten
              </Button>
            </Box>
            
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                  borderColor: alpha(theme.palette.secondary.main, 0.5)
                }
              }}
            >
              <Button 
                variant="text" 
                color="secondary"
                onClick={() => onOpenProcessingDialog(drying)}
                startIcon={<SpeedIcon />}
                sx={{ textTransform: 'none' }}
              >
                Zur Verarbeitung überführen
              </Button>
            </Box>
          </Box>
        )}
      </>
    )
  }

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
            data.map((drying) => (
              <AccordionRow
                key={drying.id}
                isExpanded={expandedDryingId === drying.id}
                onClick={() => onExpandDrying(drying.id)}
                columns={getRowColumns(drying)}
                borderColor={tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')}
                expandIconPosition="none"
                borderless={true}
              >
                {renderDryingDetails(drying)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              {tabValue === 0 ? 'Keine aktiven Trocknungen vorhanden' : 
               tabValue === 1 ? 'Keine zu Verarbeitung überführten Trocknungen vorhanden' : 
               'Keine vernichteten Trocknungen vorhanden'}
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
              color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
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

export default DryingTable