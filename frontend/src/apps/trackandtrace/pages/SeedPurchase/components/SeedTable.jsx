// frontend/src/apps/trackandtrace/pages/SeedPurchase/components/SeedTable.jsx
import { Box, Button, IconButton, Typography, Tooltip, Badge, useTheme, alpha, FormControl, Select, MenuItem } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SpaIcon from '@mui/icons-material/Spa'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import FilterListIcon from '@mui/icons-material/FilterList'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'

/**
 * SeedTable Komponente für die Darstellung der Samen-Tabelle
 * Vollständig mit Dark Mode Unterstützung
 */
const SeedTable = ({
  tabValue,
  data,
  expandedSeedId,
  onExpandSeed,
  onOpenConvertDialog,
  onOpenDestroyDialog,
  onOpenEditForm,
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
  
  // Spalten für den Tabellenkopf definieren (basierend auf Tab)
  const getHeaderColumns = () => {
    const baseColumns = [
      { label: '', width: '3%', align: 'center' },
      { label: 'Sortenname', width: '15%', align: 'left' },
      { label: 'Charge-Nummer', width: '15%', align: 'left' }
    ]

    const tabSpecificColumns = {
      0: [ // Aktive Samen
        { label: 'Gesamt/Verfügbar', width: '12%', align: 'center' },
        { label: 'Verantwortlich', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '14%', align: 'left' }
      ],
      1: [ // Mutterpflanzen
        { label: 'Anzahl Pflanzen', width: '12%', align: 'center' },
        { label: 'Verantwortlich', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '14%', align: 'left' }
      ],
      2: [ // Blühpflanzen
        { label: 'Anzahl Pflanzen', width: '12%', align: 'center' },
        { label: 'Verantwortlich', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '14%', align: 'left' }
      ],
      3: [ // Vernichtet
        { label: 'Vernichtete Menge', width: '12%', align: 'center' },
        { label: 'Vernichtet durch', width: '15%', align: 'left' },
        { label: 'Vernichtungsgrund', width: '15%', align: 'left' },
        { label: 'Vernichtet am', width: '14%', align: 'left' }
      ]
    }

    // Basis-Spalten und tab-spezifische Spalten
    const columns = [
      ...baseColumns,
      ...tabSpecificColumns[tabValue],
      // Aktionen-Spalte für alle Tabs
      { label: 'Aktionen', width: '13%', align: 'center' }
    ]
    
    return columns
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (item) => {
    const baseColumns = [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandSeed(item.id);
            }}
            size="small"
            sx={{ 
              color: 'success.main',
              width: '28px',
              height: '28px',
              transform: expandedSeedId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: tabValue === 0 || tabValue === 3 ? item.strain_name : item.seed_strain,
        width: '15%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'success.main'
      },
      {
        content: item.batch_number || '',
        width: '15%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      }
    ]

    const tabSpecificColumns = {
      0: [ // Aktive Samen
        {
          content: `${item.quantity}/${item.remaining_quantity}`,
          width: '12%',
          align: 'center'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '14%'
        }
      ],
      1: [ // Mutterpflanzen
        {
          content: item.active_plants_count || 0,
          width: '12%',
          align: 'center'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '14%'
        }
      ],
      2: [ // Blühpflanzen
        {
          content: item.active_plants_count || 0,
          width: '12%',
          align: 'center'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '14%'
        }
      ],
      3: [ // Vernichtet
        {
          content: item.destroyed_quantity,
          width: '12%',
          align: 'center',
          color: 'error.main'
        },
        {
          content: item.destroyed_by ? 
            (item.destroyed_by.display_name || `${item.destroyed_by.first_name} ${item.destroyed_by.last_name}`) 
            : "-",
          width: '15%'
        },
        {
          content: item.destroy_reason || "-",
          width: '15%'
        },
        {
          content: item.destroyed_at ? new Date(item.destroyed_at).toLocaleDateString('de-DE') : '-',
          width: '14%'
        }
      ]
    }

    // Basis-Spalten, tab-spezifische Spalten und Aktionen-Spalte
    const columns = [
      ...baseColumns,
      ...tabSpecificColumns[tabValue],
      {
        // Die Aktionsspalte enthält je nach Tab verschiedene Inhalte
        content: renderActions(item),
        width: '13%',
        align: 'center'
      }
    ]
    
    return columns
  }

  // Funktion zum Rendern der Aktionen-Spalte
  const renderActions = (item) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
        {/* Aktionsbuttons nur im Tab 0 (Aktive Samen) anzeigen */}
        {tabValue === 0 && (
          <>
            {/* Zu Mutterpflanze konvertieren */}
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
              <Tooltip title="Zu Mutterpflanze konvertieren">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenConvertDialog(item, 'mother', e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <SpaIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Zu Blühpflanze konvertieren */}
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
              <Tooltip title="Zu Blühpflanze konvertieren">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenConvertDialog(item, 'flower', e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <LocalFloristIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Vernichten */}
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
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  borderColor: alpha(theme.palette.error.main, 0.5)
                }
              }}
            >
              <Tooltip title="Vernichten">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDestroyDialog(item, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Bilder verwalten */}
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
              <Tooltip title={`Bilder verwalten (${item.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(item, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge badgeContent={item.image_count || 0} color="primary">
                    <PhotoCameraIcon sx={{ fontSize: '1rem' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Box>
    )
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (item) => {
    if (tabValue === 0 || tabValue === 3) {
      return `Samen-Charge ${item.batch_number} wurde am ${new Date(item.created_at).toLocaleDateString('de-DE')} erstellt.`;
    } else if (tabValue === 1) {
      return `Mutterpflanzen-Batch ${item.batch_number} wurde am ${new Date(item.created_at).toLocaleDateString('de-DE')} erstellt.`;
    } else {
      return `Blühpflanzen-Batch ${item.batch_number} wurde am ${new Date(item.created_at).toLocaleDateString('de-DE')} erstellt.`;
    }
  };

  // Detailansicht für einen Samen rendern
  const renderSeedDetails = (item) => {
    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: 'success.main',
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(item)}
          </Typography>
        </Box>

        {/* Details mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: tabValue === 0 || tabValue === 3 ? 'Charge-Details' : 
                     tabValue === 1 ? 'Mutterpflanzen-Details' : 'Blühpflanzen-Details',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Charge-Nummer:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {item.batch_number}
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
                      {item.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Erstellt am:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {new Date(item.created_at).toLocaleDateString('de-DE')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Sortenname:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {tabValue === 0 || tabValue === 3 ? item.strain_name : item.seed_strain || "Unbekannt"}
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Bestandsinformationen',
              content: (() => {
                if (tabValue === 0 || tabValue === 3) {
                  // Informationen für Samen
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Gesamtmenge:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.quantity || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Verfügbare Menge:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.primary'
                          }}
                        >
                          {item.remaining_quantity || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Zu Mutterpflanzen:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.mother_plant_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Zu Blühpflanzen:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.flowering_plant_count || 0}
                        </Typography>
                      </Box>
                    </Box>
                  )
                } else {
                  // Informationen für Batches (Mutterpflanzen oder Blühpflanzen)
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Anzahl Pflanzen:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.quantity || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Aktive Pflanzen:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.active_plants_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Vernichtete Pflanzen:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.destroyed_plants_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Samen-Charge:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {item.seed_batch_number || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  )
                }
              })()
            },
            {
              title: 'Notizen',
              content: (
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    p: 2,
                    borderRadius: '4px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: item.notes ? 'flex-start' : 'center',
                    justifyContent: item.notes ? 'flex-start' : 'center',
                    width: '100%'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontStyle: item.notes ? 'normal' : 'italic',
                      color: item.notes ? 'text.primary' : 'text.secondary',
                      width: '100%'
                    }}
                  >
                    {item.notes || 'Keine Notizen vorhanden'}
                  </Typography>
                </Box>
              )
            }
          ]}
          color="success.main"
        />

        {/* Aktionsbereich mit ausreichend Abstand zu den Karten darüber */}
        {tabValue === 0 && item.remaining_quantity > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 4, mb: 1, flexWrap: 'wrap' }}>
            {/* Zu Mutterpflanze */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => onOpenConvertDialog(item, 'mother')}
                startIcon={<SpaIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Zu Mutterpflanze konvertieren
              </Button>
            </Box>
            
            {/* Zu Blühpflanze */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => onOpenConvertDialog(item, 'flower')}
                startIcon={<LocalFloristIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Zu Blühpflanze konvertieren
              </Button>
            </Box>
            
            {/* Vernichten */}
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
                onClick={() => onOpenDestroyDialog(item)}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Vernichten
              </Button>
            </Box>
            
            {/* Bilder verwalten */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => onOpenImageModal(item)}
                startIcon={
                  <Badge badgeContent={item.image_count || 0} color="primary">
                    <PhotoCameraIcon />
                  </Badge>
                }
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Bilder verwalten
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
          mt: 0, // Kein margin-top
          pt: 0, // Kein padding-top
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
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`, // NEU: Trennlinie oben
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            mt: 0, // Explizit kein margin-top
            // Subtiler Schatten beim Scrollen
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
            data.map((item) => (
              <AccordionRow
                key={item.id}
                isExpanded={expandedSeedId === item.id}
                onClick={() => onExpandSeed(item.id)}
                columns={getRowColumns(item)}
                borderColor="success.main"
                expandIconPosition="none"
                borderless={true}
              >
                {renderSeedDetails(item)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              Keine Daten vorhanden
            </Typography>
          )}
        </Box>
        
        {/* Pagination - außerhalb des scrollbaren Bereichs - IMMER anzeigen */}
        <Box 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backgroundColor: theme.palette.background.paper,
            p: 1,
            display: 'flex',
            justifyContent: 'flex-end', // Rechtsbündig
            alignItems: 'center',
            flexShrink: 0,
            minHeight: '56px' // Einheitliche Höhe
          }}
        >
          {/* PaginationFooter zeigt nur die Pagination-Controls an */}
          {data && data.length > 0 && totalPages > 1 && (
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasData={true}
              color="success"
            />
          )}
          
          {/* Einträge pro Seite separat rechts positioniert */}
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
  );
}

export default SeedTable