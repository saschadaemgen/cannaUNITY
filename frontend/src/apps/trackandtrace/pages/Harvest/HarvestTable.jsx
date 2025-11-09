// frontend/src/apps/trackandtrace/pages/Harvest/components/HarvestTable.jsx
import { 
  Box, Typography, Button, IconButton, Badge, Tooltip,
  FormControl, Select, MenuItem, useTheme, alpha
} from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SeedIcon from '@mui/icons-material/Spa'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'

const HarvestTable = ({
  tabValue,
  data,
  expandedHarvestId,
  onExpandHarvest,
  onOpenDestroyDialog,
  onOpenDryingDialog,
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
      { label: 'Charge-Nummer', width: '18%', align: 'left' },
      { label: 'Gewicht', width: '10%', align: 'center' },
      { label: 'Quelle', width: '15%', align: 'left' },
      { label: 'Verarbeitet von', width: '15%', align: 'left' },
      { label: 'Raum', width: '10%', align: 'left' },
      { label: 'Erstellt am', width: '12%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (harvest) => {
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandHarvest(harvest.id);
            }}
            size="small"
            sx={{ 
              color: tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main'),
              width: '28px',
              height: '28px',
              transform: expandedHarvestId === harvest.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: harvest.source_strain || "Unbekannt",
        width: '12%',
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main')
      },
      {
        content: harvest.batch_number || '',
        width: '18%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(harvest.weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: ScaleIcon,
        iconColor: tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main')
      },
      {
        content: harvest.source_type || "Unbekannt",
        width: '15%'
      },
      {
        content: harvest.member ? 
          (harvest.member.display_name || `${harvest.member.first_name} ${harvest.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '15%'
      },
      {
        content: harvest.room ? harvest.room.name : "Nicht zugewiesen",
        width: '10%'
      },
      {
        content: new Date(harvest.created_at).toLocaleDateString('de-DE'),
        width: '12%'
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
              <Tooltip title={`Bilder verwalten (${harvest.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(harvest, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge 
                    badgeContent={harvest.image_count || 0} 
                    color={tabValue === 0 ? 'success' : (tabValue === 1 ? 'primary' : 'error')}
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
  const getActivityMessage = (harvest) => {
    const processor = harvest.member 
      ? (harvest.member.display_name || `${harvest.member.first_name} ${harvest.member.last_name}`) 
      : "Unbekannt";
    const roomName = harvest.room ? harvest.room.name : "unbekanntem Raum";
    const date = new Date(harvest.created_at).toLocaleDateString('de-DE');
    const weight = parseFloat(harvest.weight).toLocaleString('de-DE');
    const sourceInfo = `${harvest.source_type || "Unbekannte Quelle"} (${harvest.source_batch_number || "Unbekannte Charge"})`;
    
    if (tabValue === 0) {
      return `Ernte ${harvest.batch_number} mit Genetik ${harvest.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} mit ${weight}g aus ${sourceInfo} erstellt.`;
    } else if (tabValue === 1) {
      return `Ernte ${harvest.batch_number} mit Genetik ${harvest.source_strain} und Gewicht ${weight}g wurde zur Trocknung überführt.`;
    } else {
      const destroyDate = harvest.destroyed_at ? new Date(harvest.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = harvest.destroyed_by ? 
        (harvest.destroyed_by.display_name || `${harvest.destroyed_by.first_name} ${harvest.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Ernte ${harvest.batch_number} mit Genetik ${harvest.source_strain} und Gewicht ${weight}g wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${harvest.destroy_reason || "Kein Grund angegeben"}.`;
    }
  };

  // Detailansicht für eine Ernte rendern
  const renderHarvestDetails = (harvest) => {
    const harvestDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {harvest.batch_number}
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
            {harvest.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {new Date(harvest.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 2 && harvest.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {new Date(harvest.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {harvest.source_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const sourceDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {harvest.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quelltyp:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {harvest.source_type || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {parseFloat(harvest.weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        {tabValue === 2 && harvest.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {harvest.destroyed_by.display_name || 
               `${harvest.destroyed_by.first_name || ''} ${harvest.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: harvest.notes ? 'flex-start' : 'center',
          justifyContent: harvest.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: harvest.notes ? 'normal' : 'italic',
            color: harvest.notes ? 'text.primary' : 'text.secondary',
            width: '100%'
          }}
        >
          {harvest.notes || 'Keine Notizen für diese Ernte vorhanden'}
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
            fontStyle: harvest.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {harvest.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: harvestDetails
      },
      {
        title: 'Ernte-Details',
        content: sourceDetails
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
            borderColor: tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main'),
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(harvest)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main')} />

        {/* Aktionsbereich für aktive Ernten */}
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
                onClick={() => onOpenDestroyDialog(harvest)}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Ernte vernichten
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
                  backgroundColor: alpha(theme.palette.info.main, 0.08),
                  borderColor: alpha(theme.palette.info.main, 0.5)
                }
              }}
            >
              <Button 
                variant="text" 
                color="info"
                onClick={() => onOpenDryingDialog(harvest)}
                startIcon={<AcUnitIcon />}
                sx={{ textTransform: 'none' }}
              >
                Zu Trocknung konvertieren
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
            data.map((harvest) => (
              <AccordionRow
                key={harvest.id}
                isExpanded={expandedHarvestId === harvest.id}
                onClick={() => onExpandHarvest(harvest.id)}
                columns={getRowColumns(harvest)}
                borderColor={tabValue === 0 ? 'success.main' : (tabValue === 1 ? 'primary.main' : 'error.main')}
                expandIconPosition="none"
                borderless={true}
              >
                {renderHarvestDetails(harvest)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              {tabValue === 0 ? 'Keine aktiven Ernten vorhanden' : 
               tabValue === 1 ? 'Keine zu Trocknung konvertierten Ernten vorhanden' : 
               'Keine vernichteten Ernten vorhanden'}
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
              color={tabValue === 0 ? 'success' : (tabValue === 1 ? 'primary' : 'error')}
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

export default HarvestTable