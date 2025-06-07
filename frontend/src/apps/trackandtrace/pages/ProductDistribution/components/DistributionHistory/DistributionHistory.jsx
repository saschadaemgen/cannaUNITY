// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionHistory/DistributionHistory.jsx
import { useState } from 'react'
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  Autocomplete, IconButton, Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import RefreshIcon from '@mui/icons-material/Refresh'
import TableHeader from '@/components/common/TableHeader'
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
  const [expandedDistribution, setExpandedDistribution] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
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
      { content: '', width: '3%' },
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
    <Box sx={{ width: '100%' }}>
      {/* Filter-Bereich */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Filter & Suche
          </Typography>
          <Tooltip title="Daten aktualisieren">
            <IconButton onClick={onRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
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
      </Paper>
      
      {/* Tabelle */}
      <TableHeader columns={headerColumns} />
      
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
            expandIconPosition="end"
          >
            <DistributionDetails distribution={distribution} />
          </AccordionRow>
        ))
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Keine Ausgaben gefunden
          </Typography>
        </Paper>
      )}
      
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(event, page) => setCurrentPage(page)}
        hasData={filteredDistributions.length > 0}
        emptyMessage=""
        color="primary"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </Box>
  )
}