// frontend/src/apps/trackandtrace/pages/SeedPurchase/components/SeedTable.jsx
import { Box, Button, IconButton, Typography, Tooltip, Grid } from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import EditIcon from '@mui/icons-material/Edit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SpaIcon from '@mui/icons-material/Spa'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'

/**
 * SeedTable Komponente für die Darstellung der Samen-Tabelle
 * 
 * @param {number} tabValue - Aktueller Tab-Index
 * @param {Array} data - Anzuzeigende Daten
 * @param {string} expandedSeedId - ID des expandierten Samens
 * @param {function} onExpandSeed - Handler für Expand/Collapse
 * @param {function} onOpenConvertDialog - Handler für Öffnen des Konvertierungsdialogs
 * @param {function} onOpenDestroyDialog - Handler für Öffnen des Vernichtungsdialogs
 * @param {function} onOpenEditForm - Handler für Öffnen des Bearbeitungsformulars
 * @param {number} currentPage - Aktuelle Seite
 * @param {number} totalPages - Gesamtanzahl der Seiten
 * @param {function} onPageChange - Handler für Seitenwechsel
 * @param {number} pageSize - Anzahl der Einträge pro Seite
 * @param {function} onPageSizeChange - Handler für Änderung der Einträge pro Seite
 * @param {Array} pageSizeOptions - Verfügbare Optionen für Einträge pro Seite
 * @param {number} totalCount - Gesamtanzahl der Einträge
 */

const SeedTable = ({
  tabValue,
  data,
  expandedSeedId,
  onExpandSeed,
  onOpenConvertDialog,
  onOpenDestroyDialog,
  onOpenEditForm,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount
}) => {
  // Spalten für den Tabellenkopf definieren (basierend auf Tab)
  const getHeaderColumns = () => {
    const baseColumns = [
      { label: 'Sortenname', width: '15%', align: 'left', padding: '0 8px 0 28px' },
      { label: 'Charge-Nummer', width: '15%', align: 'left', padding: '0 10px' }
    ]

    const tabSpecificColumns = {
      0: [ // Aktive Samen
        { label: 'Gesamt/Verfügbar', width: '12%', align: 'center', padding: '0 10px' },
        { label: 'Zugeordnetes Mitglied', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Zugeordneter Raum', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Erstellt am', width: '16%', align: 'left', padding: '0 10px' }
      ],
      1: [ // Mutterpflanzen
        { label: 'Anzahl Pflanzen', width: '12%', align: 'center', padding: '0 10px' },
        { label: 'Zugeordnetes Mitglied', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Zugeordneter Raum', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Erstellt am', width: '16%', align: 'left', padding: '0 10px' }
      ],
      2: [ // Blühpflanzen
        { label: 'Anzahl Pflanzen', width: '12%', align: 'center', padding: '0 10px' },
        { label: 'Zugeordnetes Mitglied', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Zugeordneter Raum', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Erstellt am', width: '16%', align: 'left', padding: '0 10px' }
      ],
      3: [ // Vernichtet
        { label: 'Vernichtete Menge', width: '12%', align: 'center', padding: '0 10px' },
        { label: 'Vernichtet durch', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Vernichtungsgrund', width: '15%', align: 'left', padding: '0 10px' },
        { label: 'Vernichtet am', width: '16%', align: 'left', padding: '0 10px' }
      ]
    }

    // Basis-Spalten und tab-spezifische Spalten
    const columns = [
      ...baseColumns,
      ...tabSpecificColumns[tabValue],
      // Aktionen-Spalte für alle Tabs
      { label: 'Aktionen', width: '12%', align: 'center', padding: '0 8px' }
    ]
    
    return columns
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (item) => {
    const baseColumns = [
      {
        content: tabValue === 0 || tabValue === 3 ? item.strain_name : item.seed_strain,
        width: '15%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'success.main',
        padding: '0 8px 0 28px'
      },
      {
        content: item.batch_number || '',
        width: '15%',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        padding: '0 10px'
      }
    ]

    const tabSpecificColumns = {
      0: [ // Aktive Samen
        {
          content: `${item.quantity}/${item.remaining_quantity}`,
          width: '12%',
          align: 'center',
          padding: '0 10px'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '16%',
          padding: '0 10px'
        }
      ],
      1: [ // Mutterpflanzen
        {
          content: item.active_plants_count || 0,
          width: '12%',
          align: 'center',
          padding: '0 10px'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '16%',
          padding: '0 10px'
        }
      ],
      2: [ // Blühpflanzen
        {
          content: item.active_plants_count || 0,
          width: '12%',
          align: 'center',
          padding: '0 10px'
        },
        {
          content: item.member ? 
            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: item.room ? item.room.name : "Nicht zugewiesen",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: new Date(item.created_at).toLocaleDateString('de-DE'),
          width: '16%',
          padding: '0 10px'
        }
      ],
      3: [ // Vernichtet
        {
          content: item.destroyed_quantity,
          width: '12%',
          align: 'center',
          color: 'error.main',
          padding: '0 10px'
        },
        {
          content: item.destroyed_by ? 
            (item.destroyed_by.display_name || `${item.destroyed_by.first_name} ${item.destroyed_by.last_name}`) 
            : "-",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: item.destroy_reason || "-",
          width: '15%',
          padding: '0 10px'
        },
        {
          content: item.destroyed_at ? new Date(item.destroyed_at).toLocaleDateString('de-DE') : '-',
          width: '16%',
          padding: '0 10px'
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
        width: '12%',
        align: 'center',
        padding: '0 8px'
      }
    ]
    
    return columns
  }

  // Funktion zum Rendern der Aktionen-Spalte
  const renderActions = (item) => {
    // Stopt das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    const stopPropagation = (e) => {
      if (e) e.stopPropagation()
    }

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%', 
          padding: '12px 16px',
        }}
        onClick={stopPropagation}
      >
        {/* Aufklapp-Icon wird in allen Tabs angezeigt */}
        <IconButton 
          size="small" 
          onClick={() => onExpandSeed(item.id)}
          sx={{ mr: tabValue === 0 ? 0.5 : 0 }}
        >
          <ExpandMoreIcon 
            sx={{ 
              transform: expandedSeedId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out',
              fontSize: '1.2rem'
            }} 
          />
        </IconButton>

        {/* Aktionsbuttons nur im Tab 0 (Aktive Samen) anzeigen */}
        {tabValue === 0 && (
          <>
            <Tooltip title="Zu Mutterpflanze konvertieren">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  stopPropagation(e)
                  onOpenConvertDialog(item, 'mother', e)
                }}
                sx={{ mx: 0.5 }}
              >
                <SpaIcon fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zu Blühpflanze konvertieren">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  stopPropagation(e)
                  onOpenConvertDialog(item, 'flower', e)
                }}
                sx={{ mx: 0.5 }}
              >
                <LocalFloristIcon fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Bearbeiten">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  stopPropagation(e)
                  onOpenEditForm(item, e)
                }}
                sx={{ mx: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Vernichten">
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  stopPropagation(e)
                  onOpenDestroyDialog(item, e)
                }}
                sx={{ mx: 0.5 }}
              >
                <LocalFireDepartmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    )
  }

  // Detailansicht für einen Samen rendern
  const renderSeedDetails = (item) => {
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {item.batch_number}
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
            {item.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(item.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Sortenname:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {tabValue === 0 || tabValue === 3 ? item.strain_name : item.seed_strain || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const inventoryInfo = (() => {
      if (tabValue === 0 || tabValue === 3) {
        // Informationen für Samen
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Gesamtmenge:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.quantity || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Verfügbare Menge:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.87)'
                }}
              >
                {item.remaining_quantity || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Zu Mutterpflanzen:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.mother_plant_count || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Zu Blühpflanzen:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
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
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Anzahl Pflanzen:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.quantity || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Aktive Pflanzen:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.active_plants_count || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Vernichtete Pflanzen:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.destroyed_plants_count || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Samen-Charge:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {item.seed_batch_number || '-'}
              </Typography>
            </Box>
          </Box>
        )
      }
    })()

    const notesContent = (
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
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
            color: item.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {item.notes || 'Keine Notizen vorhanden'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: tabValue === 0 || tabValue === 3 ? 'Charge-Details' : 
               tabValue === 1 ? 'Mutterpflanzen-Details' : 'Blühpflanzen-Details',
        content: chargeDetails
      },
      {
        title: 'Bestandsinformationen',
        content: inventoryInfo
      },
      {
        title: 'Notizen',
        content: notesContent
      }
    ]

    return (
      <>
        <DetailCards cards={cards} color="success.main" />
        
        {/* Aktionsbereich - nur für aktive Samen anzeigen */}
        {tabValue === 0 && item.remaining_quantity > 0 && (
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: '4px', 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              backgroundColor: 'white'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Verfügbare Aktionen
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8} container spacing={1} justifyContent="flex-end">
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="success"
                    onClick={() => onOpenConvertDialog(item, 'mother')}
                    startIcon={<SpaIcon />}
                    sx={{ mr: 1 }}
                  >
                    Zu Mutterpflanze
                  </Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="success"
                    onClick={() => onOpenConvertDialog(item, 'flower')}
                    startIcon={<LocalFloristIcon />}
                    sx={{ mr: 1 }}
                  >
                    Zu Blühpflanze
                  </Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => onOpenEditForm(item)}
                    startIcon={<EditIcon />}
                    sx={{ mr: 1 }}
                  >
                    Bearbeiten
                  </Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={() => onOpenDestroyDialog(item)}
                    startIcon={<LocalFireDepartmentIcon />}
                  >
                    Vernichten
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((item) => (
          <Box
            key={item.id}
            sx={{ 
              mb: 1.2, 
              overflow: 'hidden', 
              borderRadius: '4px',
              border: expandedSeedId === item.id ? '1px solid rgba(76, 175, 80, 0.5)' : 'none'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: expandedSeedId === item.id ? 'rgba(0, 0, 0, 0.04)' : 'white',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                borderLeft: '4px solid',
                borderColor: 'success.main',
                cursor: 'pointer',
                height: '48px',
                width: '100%',
              }}
              onClick={() => onExpandSeed(item.id)}
            >
              {/* Spalten-Inhalte direkt aus getRowColumns() */}
              {getRowColumns(item).map((column, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: column.align === 'center'
                      ? 'center'
                      : column.align === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                    width: column.width || 'auto',
                    padding: column.padding || '0 16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    textAlign: column.align || 'left',
                    height: '100%'
                  }}
                >
                  {column.icon && (
                    <column.icon sx={{ color: column.iconColor || 'inherit', fontSize: '0.9rem', mr: 0.8 }} />
                  )}
                  {typeof column.content === 'string' || typeof column.content === 'number' ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: column.bold ? 'bold' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.8rem',
                        color: column.color || 'inherit',
                        lineHeight: 1.4,
                        fontFamily: column.fontFamily
                      }}
                    >
                      {column.content}
                    </Typography>
                  ) : (
                    column.content
                  )}
                </Box>
              ))}
            </Box>

            {/* Ausgeklappter Inhalt mit Animation */}
            {expandedSeedId === item.id && (
              <Box 
                sx={{ 
                  width: '100%',
                  padding: '14px 20px 20px 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                {renderSeedDetails(item)}
              </Box>
            )}
          </Box>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Samen vorhanden
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color="primary"
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </Box>
  )
}

export default SeedTable