// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/ProductSelection.jsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, IconButton, Alert, Tooltip, Badge,
  Card, CardContent, Divider, LinearProgress, Snackbar,
  Autocomplete, Pagination, CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import ScienceIcon from '@mui/icons-material/Science'
import ScaleIcon from '@mui/icons-material/Scale'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import WarningIcon from '@mui/icons-material/Warning'

// Cannabis-Limits Imports
import { 
  formatWeight,
  validateDistribution,
  createWarningMessages,
  getConsumptionColor
} from '../../../../utils/cannabisLimits'

// Debounce Hook für Suchfeld
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// Limit-Status-Komponente (bleibt unverändert)
const LimitStatus = ({ currentWeight, dailyLimit, monthlyLimit, dailyUsed, monthlyUsed }) => {
  const dailyTotal = dailyUsed + currentWeight
  const monthlyTotal = monthlyUsed + currentWeight
  const dailyPercentage = (dailyTotal / dailyLimit) * 100
  const monthlyPercentage = (monthlyTotal / monthlyLimit) * 100
  
  return (
    <Card sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        Aktuelle Limits
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">Tageslimit</Typography>
          <Typography 
            variant="body2" 
            color={getConsumptionColor(dailyPercentage) + '.main'}
            fontWeight="bold"
          >
            {formatWeight(dailyTotal)} / {formatWeight(dailyLimit)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(100, dailyPercentage)} 
          color={getConsumptionColor(dailyPercentage)}
          sx={{ height: 6, borderRadius: 1 }}
        />
      </Box>
      
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">Monatslimit</Typography>
          <Typography 
            variant="body2" 
            color={getConsumptionColor(monthlyPercentage) + '.main'}
            fontWeight="bold"
          >
            {formatWeight(monthlyTotal)} / {formatWeight(monthlyLimit)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(100, monthlyPercentage)} 
          color={getConsumptionColor(monthlyPercentage)}
          sx={{ height: 6, borderRadius: 1 }}
        />
      </Box>
      
      {dailyPercentage > 100 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Tageslimit überschritten um {formatWeight(dailyTotal - dailyLimit)}
          </Typography>
        </Alert>
      )}
      
      {monthlyPercentage > 100 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Monatslimit überschritten um {formatWeight(monthlyTotal - monthlyLimit)}
          </Typography>
        </Alert>
      )}
    </Card>
  )
}

export default function ProductSelection({ 
  availableUnits: initialUnits, // Nur für Fallback, wenn API nicht funktioniert
  selectedUnits, 
  setSelectedUnits,
  recipientId,
  memberLimits 
}) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [thcFilter, setThcFilter] = useState('')
  const [strainFilter, setStrainFilter] = useState('')
  const [weightFilter, setWeightFilter] = useState('')
  
  // Pagination States
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20) // Fixe Page Size
  const [totalCount, setTotalCount] = useState(0)
  
  // Data States
  const [availableUnits, setAvailableUnits] = useState([])
  const [weightOptions, setWeightOptions] = useState([])
  const [strainOptions, setStrainOptions] = useState([])
  const [loading, setLoading] = useState(false)
  
  // UI States
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [limitWarningMessage, setLimitWarningMessage] = useState('')
  const [blockedUnits, setBlockedUnits] = useState(new Set())
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Prüfe ob Empfänger U21 ist
  const isU21 = memberLimits?.member?.isU21 || false
  
  // Lade verfügbare Gewichte beim Start
  useEffect(() => {
    fetch('/api/trackandtrace/packaging-units/distinct_weights/')
      .then(res => res.json())
      .then(data => {
        // Formatiere Gewichte für Anzeige (z.B. "1.00g", "2.50g")
        const formattedWeights = data.map(w => ({
          value: w,
          label: `${parseFloat(w).toFixed(2)}g`
        }))
        setWeightOptions(formattedWeights)
      })
      .catch(err => console.error('Sir, ich konnte die Gewichtsoptionen nicht laden:', err))
  }, [])
  
  // Lade verfügbare Sorten beim Start
  useEffect(() => {
    fetch('/api/trackandtrace/packaging-units/distinct_strains/')
      .then(res => res.json())
      .then(data => setStrainOptions(data))
      .catch(err => console.error('Sir, ich konnte die Sortenoptionen nicht laden:', err))
  }, [])
  
  // Hauptdaten-Ladevorgang mit allen Filtern
  const loadPackagingUnits = useCallback(() => {
    setLoading(true)
    
    // Baue Query-Parameter auf
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    // Füge Filter hinzu
    if (weightFilter) params.append('weight', weightFilter.value || weightFilter)
    if (productTypeFilter) params.append('product_type', productTypeFilter)
    if (strainFilter) params.append('strain', strainFilter)
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
    
    // THC-Filter
    if (isU21) {
      params.append('max_thc', '10')
    } else if (thcFilter) {
      switch(thcFilter) {
        case 'low':
          params.append('max_thc', '15')
          break
        case 'medium':
          params.append('min_thc', '15')
          params.append('max_thc', '20')
          break
        case 'high':
          params.append('min_thc', '20')
          break
      }
    }
    
    fetch(`/api/trackandtrace/packaging-units/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAvailableUnits(data.results || [])
        setTotalCount(data.count || 0)
      })
      .catch(err => {
        console.error('Sir, es gab einen Fehler beim Laden der Daten:', err)
        // Fallback auf initial units
        if (initialUnits) {
          setAvailableUnits(initialUnits)
          setTotalCount(initialUnits.length)
        }
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, weightFilter, productTypeFilter, strainFilter, thcFilter, debouncedSearchTerm, isU21, initialUnits])
  
  // Lade Daten bei Filter-Änderungen
  useEffect(() => {
    loadPackagingUnits()
  }, [loadPackagingUnits])
  
  // Reset auf Seite 1 bei Filter-Änderungen
  useEffect(() => {
    setPage(1)
  }, [productTypeFilter, thcFilter, strainFilter, weightFilter, debouncedSearchTerm])
  
  // Validiere beim Hinzufügen einer Einheit
  const handleAddUnit = (unit) => {
    if (!selectedUnits.find(u => u.id === unit.id)) {
      const newUnits = [...selectedUnits, unit]
      const totalWeight = newUnits.reduce((sum, u) => sum + parseFloat(u.weight || 0), 0)
      
      if (memberLimits) {
        const validation = validateDistribution(
          {
            daily: memberLimits.daily.consumed,
            monthly: memberLimits.monthly.consumed
          },
          {
            daily: memberLimits.daily.limit,
            monthly: memberLimits.monthly.limit,
            maxThc: memberLimits.thcLimit
          },
          totalWeight,
          newUnits
        )
        
        if (!validation.isValid) {
          const messages = createWarningMessages(validation.violations, validation.remaining)
          setLimitWarningMessage(messages.join('\n'))
          setShowLimitWarning(true)
          setBlockedUnits(new Set([...blockedUnits, unit.id]))
          return
        }
      }
      
      setSelectedUnits(newUnits)
    }
  }
  
  // Einheit entfernen
  const handleRemoveUnit = (unitId) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== unitId))
    const newBlocked = new Set(blockedUnits)
    newBlocked.delete(unitId)
    setBlockedUnits(newBlocked)
  }
  
  // Statistiken berechnen
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalFloristIcon color="primary" />
        Produkte auswählen
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Wählen Sie die Cannabis-Produkte aus, die ausgegeben werden sollen. 
        {isU21 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>U21-Beschränkung:</strong> Es werden nur Produkte mit max. 10% THC angezeigt.
          </Typography>
        )}
      </Alert>
      
      {/* Filter-Bereich */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3} sx={{ minWidth: 240, maxWidth: 340 }}>
            <TextField
              fullWidth
              placeholder="Suche nach Einheitsnummer oder Genetik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 240, maxWidth: 340, width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ minWidth: 240, maxWidth: 340 }}>
            <FormControl fullWidth sx={{ minWidth: 240, maxWidth: 340, width: '100%' }}>
              <InputLabel>Produkttyp</InputLabel>
              <Select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                label="Produkttyp"
              >
                <MenuItem value="">Alle Typen</MenuItem>
                <MenuItem value="marijuana">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFloristIcon fontSize="small" color="success" />
                    Marihuana
                  </Box>
                </MenuItem>
                <MenuItem value="hashish">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterDramaIcon fontSize="small" color="warning" />
                    Haschisch
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ minWidth: 240, maxWidth: 340 }}>
            <FormControl fullWidth disabled={isU21} sx={{ minWidth: 240, maxWidth: 340, width: '100%' }}>
              <InputLabel>THC-Gehalt</InputLabel>
              <Select
                value={thcFilter}
                onChange={(e) => setThcFilter(e.target.value)}
                label="THC-Gehalt"
              >
                <MenuItem value="">Alle Stärken</MenuItem>
                <MenuItem value="low">Niedrig (&lt; 15%)</MenuItem>
                <MenuItem value="medium">Mittel (15-20%)</MenuItem>
                <MenuItem value="high">Hoch (&gt; 20%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ minWidth: 240, maxWidth: 340 }}>
            <Autocomplete
              fullWidth
              options={strainOptions}
              value={strainFilter}
              onChange={(_, value) => setStrainFilter(value || '')}
              sx={{ minWidth: 240, maxWidth: 340, width: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sorte/Genetik"
                  placeholder="Sorte wählen"
                />
              )}
              isOptionEqualToValue={(option, value) => option === value}
              clearOnEscape
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ minWidth: 240, maxWidth: 340 }}>
            <Autocomplete
              fullWidth
              options={weightOptions}
              value={weightFilter}
              onChange={(_, value) => setWeightFilter(value || '')}
              getOptionLabel={(option) => option.label || option}
              sx={{ minWidth: 240, maxWidth: 340, width: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Verpackungsgröße"
                  placeholder="Gewicht wählen"
                />
              )}
              isOptionEqualToValue={(option, value) => 
                option.value === value.value || option === value
              }
              clearOnEscape
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Verwende Flexbox für perfekte 50/50 Aufteilung */}
      <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
        {/* Verfügbare Produkte */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Verfügbare Produkte
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading && <CircularProgress size={20} />}
                <Chip 
                  label={`${totalCount} Einheiten`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>
            
            <TableContainer sx={{ flexGrow: 1, px: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Einheit</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell align="center">Gewicht</TableCell>
                    <TableCell align="center">THC</TableCell>
                    <TableCell align="center">Aktion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Lade Daten...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : availableUnits.length > 0 ? (
                    availableUnits.map((unit) => {
                      const batch = unit.batch || {}
                      const productType = batch.product_type_display || 'Unbekannt'
                      const isMarijuana = batch.product_type === 'marijuana'
                      const strain = batch.source_strain || 'Unbekannt'
                      const thcContent = batch.thc_content || 'k.A.'
                      const isSelected = selectedUnits.find(u => u.id === unit.id)
                      const isBlocked = blockedUnits.has(unit.id)
                      
                      return (
                        <TableRow 
                          key={unit.id}
                          sx={{ 
                            opacity: isSelected ? 0.5 : 1,
                            bgcolor: isSelected ? 'action.selected' : isBlocked ? 'error.light' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {unit.batch_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {strain}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={isMarijuana ? <LocalFloristIcon /> : <FilterDramaIcon />}
                              label={productType}
                              size="small"
                              color={isMarijuana ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {parseFloat(unit.weight).toFixed(2)}g
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {thcContent}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip 
                              title={
                                isSelected ? "Bereits ausgewählt" : 
                                isBlocked ? "Würde Limit überschreiten" : 
                                "Hinzufügen"
                              }
                            >
                              <IconButton 
                                size="small"
                                color={isBlocked ? "error" : "primary"}
                                onClick={() => handleAddUnit(unit)}
                                disabled={isSelected}
                              >
                                {isSelected ? <CheckCircleIcon /> : 
                                 isBlocked ? <BlockIcon /> : 
                                 <AddCircleIcon />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {isU21 ? 
                            "Keine Produkte mit max. 10% THC verfügbar" : 
                            "Keine verfügbaren Produkte gefunden"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Paper>
        </Box>
        
        {/* Ausgewählte Produkte */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Ausgewählte Produkte
              </Typography>
              <Badge badgeContent={selectedUnits.length} color="primary">
                <ScaleIcon />
              </Badge>
            </Box>
            
            <Box sx={{ px: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {memberLimits && (
                <LimitStatus
                  currentWeight={totalWeight}
                  dailyLimit={memberLimits.daily.limit}
                  monthlyLimit={memberLimits.monthly.limit}
                  dailyUsed={memberLimits.daily.consumed}
                  monthlyUsed={memberLimits.monthly.consumed}
                />
              )}
              
              {selectedUnits.length > 0 && (
                <Card sx={{ mb: 2, bgcolor: 'primary.light' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h5" color="primary.contrastText">
                          {totalWeight.toFixed(2)}g
                        </Typography>
                        <Typography variant="caption" color="primary.contrastText">
                          Gesamtgewicht
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <LocalFloristIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
                          <Typography variant="h6" color="primary.contrastText">
                            {marijuanaCount}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="primary.contrastText">
                          Marihuana
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <FilterDramaIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
                          <Typography variant="h6" color="primary.contrastText">
                            {hashishCount}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="primary.contrastText">
                          Haschisch
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Einheit</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell align="center">Gewicht</TableCell>
                      <TableCell align="center">Entfernen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedUnits.length > 0 ? (
                      selectedUnits.map((unit) => {
                        const batch = unit.batch || {}
                        const productType = batch.product_type_display || 'Unbekannt'
                        const isMarijuana = batch.product_type === 'marijuana'
                        
                        return (
                          <TableRow key={unit.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {unit.batch_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={isMarijuana ? <LocalFloristIcon /> : <FilterDramaIcon />}
                                label={productType}
                                size="small"
                                color={isMarijuana ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="medium">
                                {parseFloat(unit.weight).toFixed(2)}g
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton 
                                size="small"
                                color="error"
                                onClick={() => handleRemoveUnit(unit.id)}
                              >
                                <RemoveCircleIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Box sx={{ py: 8, opacity: 0.5 }}>
                            <ScienceIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              Keine Produkte ausgewählt
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Wählen Sie Produkte aus der linken Liste aus
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Limit-Warnung Snackbar */}
      <Snackbar
        open={showLimitWarning}
        autoHideDuration={6000}
        onClose={() => setShowLimitWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowLimitWarning(false)} 
          severity="error" 
          sx={{ width: '100%' }}
          icon={<WarningIcon />}
        >
          {limitWarningMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}