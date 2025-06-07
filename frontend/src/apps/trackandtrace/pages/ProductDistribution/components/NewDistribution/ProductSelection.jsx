// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/ProductSelection.jsx
import { useState } from 'react'
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, IconButton, Alert, Tooltip, Badge,
  Card, CardContent, Divider
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import ScienceIcon from '@mui/icons-material/Science'
import ScaleIcon from '@mui/icons-material/Scale'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export default function ProductSelection({ availableUnits, selectedUnits, setSelectedUnits }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [thcFilter, setThcFilter] = useState('')
  
  // Filtere verfügbare Einheiten
  const filteredUnits = availableUnits.filter(unit => {
    const batch = unit.batch || {}
    const labBatch = batch.lab_testing_batch || {}
    const processingBatch = labBatch.processing_batch || {}
    
    // Produkttyp-Filter
    if (productTypeFilter && processingBatch.product_type !== productTypeFilter) {
      return false
    }
    
    // THC-Filter
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
  
  // Einheit hinzufügen
  const handleAddUnit = (unit) => {
    if (!selectedUnits.find(u => u.id === unit.id)) {
      setSelectedUnits([...selectedUnits, unit])
    }
  }
  
  // Einheit entfernen
  const handleRemoveUnit = (unitId) => {
    setSelectedUnits(selectedUnits.filter(u => u.id !== unitId))
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
        Alle Produkte sind laborgeprüft und freigegeben.
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
            <FormControl fullWidth>
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
            <FormControl fullWidth>
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
                      
                      return (
                        <TableRow 
                          key={unit.id}
                          sx={{ 
                            opacity: isSelected ? 0.5 : 1,
                            bgcolor: isSelected ? 'action.selected' : 'inherit'
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
                            <Tooltip title={isSelected ? "Bereits ausgewählt" : "Hinzufügen"}>
                              <IconButton 
                                size="small"
                                color="primary"
                                onClick={() => handleAddUnit(unit)}
                                disabled={isSelected}
                              >
                                {isSelected ? <CheckCircleIcon /> : <AddCircleIcon />}
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
                          Keine verfügbaren Produkte gefunden
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
    </Box>
  )
}