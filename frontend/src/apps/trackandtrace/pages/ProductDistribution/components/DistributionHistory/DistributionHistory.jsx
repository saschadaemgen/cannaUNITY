// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionHistory/DistributionHistory.jsx
import { useState } from 'react'
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  Autocomplete, IconButton, Tooltip, FormControl, Select, MenuItem,
  useTheme, alpha, Button
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import RefreshIcon from '@mui/icons-material/Refresh'
import FilterListIcon from '@mui/icons-material/FilterList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import DistributionDetails from './DistributionDetails'

export default function DistributionHistory({ 
  distributions, 
  members, 
  onRefresh,
  recipientFilter,
  setRecipientFilter,
  distributorFilter,
  setDistributorFilter 
}) {
  const theme = useTheme()
  const [expandedDistribution, setExpandedDistribution] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  
  // Paginierung-Optionen
  const pageSizeOptions = [5, 10, 15, 25, 50]
  
  // Filtere Distributionen
  const filteredDistributions = distributions.filter(dist => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const recipientName = `${dist.recipient?.first_name} ${dist.recipient?.last_name}`.toLowerCase()
      const distributorName = `${dist.distributor?.first_name} ${dist.distributor?.last_name}`.toLowerCase()
      const batchNumber = dist.batch_number?.toLowerCase() || ''
      
      if (!recipientName.includes(search) && 
          !distributorName.includes(search) && 
          !batchNumber.includes(search)) {
        return false
      }
    }
    return true
  })
  
  // Paginierung
  const totalPages = Math.ceil(filteredDistributions.length / pageSize)
  const paginatedDistributions = filteredDistributions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  
  // Formatiere Datum
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Spalten für den Tabellenkopf
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Ausgabe-Nr.', width: '15%', align: 'left' },
    { label: 'Empfänger', width: '20%', align: 'left' },
    { label: 'Produkte', width: '15%', align: 'center' },
    { label: 'Gesamtgewicht', width: '10%', align: 'center' },
    { label: 'Ausgegeben von', width: '20%', align: 'left' },
    { label: 'Datum & Zeit', width: '17%', align: 'left' }
  ]
  
  // Zeilen-Inhalte für AccordionRow
  const getRowColumns = (distribution) => {
    const productTypes = distribution.product_type_summary || []
    const marijuanaWeight = productTypes.find(p => p.type.includes('Marihuana'))?.weight || 0
    const hashishWeight = productTypes.find(p => p.type.includes('Haschisch'))?.weight || 0
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              setExpandedDistribution(
                expandedDistribution === distribution.id ? '' : distribution.id
              );
            }}
            size="small"
            sx={{ 
              color: 'primary.main',
              width: '28px',
              height: '28px',
              transform: expandedDistribution === distribution.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: distribution.batch_number || 'k.A.',
        width: '15%',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        bold: true
      },
      {
        content: distribution.recipient ? 
          `${distribution.recipient.first_name} ${distribution.recipient.last_name}` : 
          'Unbekannt',
        width: '20%',
        icon: PersonIcon,
        iconColor: 'primary.main'
      },
      {
        content: `${distribution.packaging_units?.length || 0} Einheiten`,
        width: '15%',
        align: 'center'
      },
      {
        content: `${distribution.total_weight?.toFixed(2) || '0.00'}g`,
        width: '10%',
        align: 'center',
        bold: true,
        color: 'primary.main'
      },
      {
        content: distribution.distributor ? 
          `${distribution.distributor.first_name} ${distribution.distributor.last_name}` : 
          'Unbekannt',
        width: '20%',
        icon: CreditCardIcon,
        iconColor: 'info.main'
      },
      {
        content: formatDate(distribution.distribution_date),
        width: '17%'
      }
    ]
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
      {/* Header mit Filter-Button */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Ausgabenhistorie
        </Typography>
        
        {/* Filter-Button oben rechts */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Refresh Button */}
          <Box
            sx={{
              border: theme => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.action.hover, 0.08),
                borderColor: theme => theme.palette.divider
              }
            }}
          >
            <Tooltip title="Daten aktualisieren">
              <IconButton onClick={onRefresh} color="primary" size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Filter Toggle */}
          <Box
            sx={{
              border: theme => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.action.hover, 0.08),
                borderColor: theme => theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon />}
              sx={{ 
                textTransform: 'none', 
                color: 'text.primary',
                fontSize: '0.875rem'
              }}
            >
              {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filter Section - angepasst an Ernte-Design */}
      {showFilters && (
        <Box sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          flexShrink: 0
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Suche nach Name oder Chargennummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={members}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                value={members.find(m => m.id === recipientFilter) || null}
                onChange={(_, newValue) => setRecipientFilter(newValue?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nach Empfänger filtern"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={members}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                value={members.find(m => m.id === distributorFilter) || null}
                onChange={(_, newValue) => setDistributorFilter(newValue?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nach Ausgeber filtern"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <CreditCardIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                fullWidth
              />
            </Grid>
          </Grid>
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
            {headerColumns.map((column, index) => (
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
          {paginatedDistributions.length > 0 ? (
            paginatedDistributions.map((distribution) => (
              <AccordionRow
                key={distribution.id}
                isExpanded={expandedDistribution === distribution.id}
                onClick={() => setExpandedDistribution(
                  expandedDistribution === distribution.id ? '' : distribution.id
                )}
                columns={getRowColumns(distribution)}
                borderColor="primary.main"
                borderless={true}
                expandIconPosition="none"
              >
                <DistributionDetails distribution={distribution} />
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              Keine Ausgaben gefunden
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
          {paginatedDistributions.length > 0 && totalPages > 1 && (
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(event, page) => setCurrentPage(page)}
              hasData={true}
              color="primary"
            />
          )}
          
          {/* Einträge pro Seite */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            ml: paginatedDistributions.length > 0 && totalPages > 1 ? 3 : 0 
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Einträge pro Seite
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
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