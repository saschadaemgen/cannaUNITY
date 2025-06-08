// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/ProductSelection.jsx
import { useState, useEffect, useMemo } from 'react'
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, IconButton, Alert, Tooltip, Badge,
  Card, CardContent, Divider, LinearProgress, Snackbar
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

// Limit-Status-Komponente
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
  availableUnits, 
  selectedUnits, 
  setSelectedUnits,
  recipientId,
  memberLimits 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [thcFilter, setThcFilter] = useState('')
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [limitWarningMessage, setLimitWarningMessage] = useState('')
  const [blockedUnits, setBlockedUnits] = useState(new Set())
  
  // Prüfe ob Empfänger U21 ist
  const isU21 = memberLimits?.member?.isU21 || false
  
  // Filtere verfügbare Einheiten mit THC-Check für U21
  const filteredUnits = useMemo(() => {
    let units = availableUnits
    
    // THC-Filter für U21-Mitglieder
    if (isU21) {
      units = units.filter(unit => {
        const thcContent = unit.batch?.lab_testing_batch?.thc_content
        return !thcContent || parseFloat(thcContent) <= 10
      })
    }
    
    // Weitere Filter anwenden
    return units.filter(unit => {
      const batch = unit.batch || {}
      const labBatch = batch.lab_testing_batch || {}
      const processingBatch = labBatch.processing_batch || {}
      
      // Produkttyp-Filter
      if (productTypeFilter && processingBatch.product_type !== productTypeFilter) {
        return false
      }
      
      // THC-Filter (zusätzlich zum U21-Filter)
      if (thcFilter && labBatch.thc_content) {
        const thcValue = parseFloat(labBatch.thc_content)
        if (thcFilter === 'low' && thcValue >= 15) return false
        if (thcFilter === 'medium' && (thcValue < 15 || thcValue >= 20)) return false
        if (thcFilter === 'high' && thcValue < 20) return false
      }
      
      // Suchbegriff
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const unitNumber = unit.batch_number?.toLowerCase() || ''
        const strain = batch.source_strain?.toLowerCase() || ''
        
        if (!unitNumber.includes(search) && !strain.includes(search)) {
          return false
        }
      }
      
      return true
    })
  }, [availableUnits, isU21, productTypeFilter, thcFilter, searchTerm])
  
  // Validiere beim Hinzufügen einer Einheit
  const handleAddUnit = (unit) => {
    if (!selectedUnits.find(u => u.id === unit.id)) {
      // Prüfe Limits
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
          // Zeige Warnung
          const messages = createWarningMessages(validation.violations, validation.remaining)
          setLimitWarningMessage(messages.join('\n'))
          setShowLimitWarning(true)
          
          // Blockiere die Einheit visuell
          setBlockedUnits(new Set([...blockedUnits, unit.id]))
          
          // Verhindere das Hinzufügen bei Limit-Überschreitung
          return
        }
      }
      
      setSelectedUnits(newUnits)
    }
  }
  
  // Einheit entfernen
  const handleRemoveUnit = (unitId) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== unitId))
    // Entferne aus blockierten Einheiten
    const newBlocked = new Set(blockedUnits)
    newBlocked.delete(unitId)
    setBlockedUnits(newBlocked)
  }
  
  // Statistiken berechnen
  const totalWeight = selectedUnits.reduce((sum, unit) => sum + parseFloat(unit.weight || 0), 0)
  const marijuanaCount = selectedUnits.filter(u => u.batch?.product_type === 'marijuana').length
  const hashishCount = selectedUnits.filter(u => u.batch?.product_type === 'hashish').length
  
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Suche nach Einheitsnummer oder Genetik..."
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
  <FormControl fullWidth sx={{ minWidth: 220, maxWidth: 340 }}>
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
<Grid item xs={12} md={4}>
  <FormControl fullWidth sx={{ minWidth: 220, maxWidth: 340 }} disabled={isU21}>
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

        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Verfügbare Produkte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 600, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Verfügbare Produkte
              </Typography>
              <Chip 
                label={`${filteredUnits.length} Einheiten`}
                color="primary"
                size="small"
              />
            </Box>
            
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
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
                  {filteredUnits.length > 0 ? (
                    filteredUnits.map((unit) => {
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
          </Paper>
        </Grid>
        
        {/* Ausgewählte Produkte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 600, display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Ausgewählte Produkte
              </Typography>
              <Badge badgeContent={selectedUnits.length} color="primary">
                <ScaleIcon />
              </Badge>
            </Box>
            
            {/* Limit-Status anzeigen wenn Mitglied ausgewählt */}
            {memberLimits && (
              <LimitStatus
                currentWeight={totalWeight}
                dailyLimit={memberLimits.daily.limit}
                monthlyLimit={memberLimits.monthly.limit}
                dailyUsed={memberLimits.daily.consumed}
                monthlyUsed={memberLimits.monthly.consumed}
              />
            )}
            
            {/* Zusammenfassung */}
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
          </Paper>
        </Grid>
      </Grid>
      
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