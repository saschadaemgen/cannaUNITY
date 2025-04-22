// frontend/src/apps/trackandtrace/pages/FloweringPlant/FloweringPlantPage.jsx
import { useState, useEffect } from 'react'
import { 
  Container, Typography, Box, IconButton, 
  Accordion, AccordionSummary, AccordionDetails, 
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Pagination, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tabs, Tab, Checkbox,
  FormControlLabel, Grid, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Chip
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ClearIcon from '@mui/icons-material/Clear'
import api from '../../../../utils/api'

export default function FloweringPlantPage() {
  const [floweringBatches, setFloweringBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [plantsCurrentPage, setPlantsCurrentPage] = useState({})
  const [plantsTotalPages, setPlantsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedPlants, setSelectedPlants] = useState({})
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)

  const loadFloweringBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/floweringbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      
      setFloweringBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
      
      // Zähler aus der Antwort übernehmen
      if (res.data.counts) {
        setActivePlantsCount(res.data.counts.active_count || 0);
        setDestroyedPlantsCount(res.data.counts.destroyed_count || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Batches:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separat die Zähler laden (für Tabs, die nicht aktiv sind)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/floweringbatches/counts/');
      setActivePlantsCount(res.data.active_count || 0);
      setDestroyedPlantsCount(res.data.destroyed_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };

  useEffect(() => {
    loadFloweringBatches()
    loadCounts() // Alle Zähler beim ersten Laden holen
  }, [])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    // Beim Tab-Wechsel alle geöffneten Akkordeons schließen
    setExpandedBatchId('')
    setBatchPlants({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      // Laden der einzelnen Pflanzen im Batch (Seite 1)
      loadPlantsForBatch(batchId, 1)
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      const destroyed = tabValue === 1; // Tab 1 ist für vernichtete Pflanzen
      const res = await api.get(`/trackandtrace/floweringbatches/${batchId}/plants/?page=${page}&destroyed=${destroyed}`)
      
      // Speichern der Pflanzen für diesen Batch
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: res.data.results || []
      }))
      
      // Speichern der aktuellen Seite für diesen Batch
      setPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die Pflanzen dieses Batches
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))

      // Zurücksetzen der ausgewählten Pflanzen für diesen Batch
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Pflanzen:', error)
    }
  }

  const handlePageChange = (event, page) => {
    loadFloweringBatches(page)
  }

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch)
    setDestroyReason('')
    setOpenDestroyDialog(true)
  }

  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedPlants[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/floweringbatches/${selectedBatch.id}/destroy_plants/`, {
          plant_ids: selectedPlants[selectedBatch.id],
          reason: destroyReason
        })

        setOpenDestroyDialog(false)
        setSelectedBatch(null)
        
        // Ausgewählte Pflanzen zurücksetzen
        setSelectedPlants(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }))
        
        // Pflanzen neu laden
        loadPlantsForBatch(selectedBatch.id, plantsCurrentPage[selectedBatch.id] || 1)
        loadCounts() // Zähler aktualisieren
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    }
  }

  const togglePlantSelection = (batchId, plantId) => {
    setSelectedPlants(prev => {
      const batchPlants = prev[batchId] || []
      if (batchPlants.includes(plantId)) {
        return {
          ...prev,
          [batchId]: batchPlants.filter(id => id !== plantId)
        }
      } else {
        return {
          ...prev,
          [batchId]: [...batchPlants, plantId]
        }
      }
    })
  }

  const selectAllPlantsInBatch = (batchId, select) => {
    if (select) {
      const allPlantIds = batchPlants[batchId]?.map(plant => plant.id) || []
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: allPlantIds
      }))
    } else {
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    }
  }
  
  const handleFilterApply = () => {
    loadFloweringBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadFloweringBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Blühpflanzen-Verwaltung</Typography>
        <Box>
          <IconButton 
            onClick={() => setShowFilters(!showFilters)} 
            color={showFilters ? "primary" : "default"}
          >
            <FilterAltIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Filter-Bereich */}
      {showFilters && (
        <Paper sx={{ mb: 2, p: 2, width: '100%' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Jahr"
                fullWidth
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                InputProps={{
                  endAdornment: yearFilter && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setYearFilter('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Monat</InputLabel>
                <Select
                  value={monthFilter}
                  label="Monat"
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('de-DE', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Tag"
                fullWidth
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                type="number"
                inputProps={{ min: 1, max: 31 }}
                InputProps={{
                  endAdornment: dayFilter && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setDayFilter('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} container spacing={1} justifyContent="flex-end">
              <Grid item>
                <Button variant="outlined" onClick={handleFilterReset}>
                  Zurücksetzen
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={handleFilterApply}>
                  Filter anwenden
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ mb: 2, width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Blühpflanzen-Tabs">
          <Tab label={`Aktive Pflanzen (${activePlantsCount})`} />
          <Tab label={`Vernichtete Pflanzen (${destroyedPlantsCount})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4} width="100%">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          {floweringBatches.map((batch) => (
            <Accordion 
              key={batch.id} 
              expanded={expandedBatchId === batch.id}
              onChange={() => handleAccordionChange(batch.id)}
              sx={{ 
                mb: 2, 
                width: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px 8px 0 0',
                  '&.Mui-expanded': {
                    minHeight: '48px',
                    borderBottom: '1px solid #e0e0e0'
                  }
                }}
              >
                <Box display="flex" width="100%" alignItems="center" justifyContent="space-between">
                  <Box display="flex" flexDirection="column">
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Typography variant="subtitle1" component="div" fontWeight="bold">
                        {batch.seed_strain}
                      </Typography>
                      <Chip 
                        label={batch.batch_number || "Keine Batch-Nr."} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Ursprungssamen-Batch: {batch.seed_batch_number || "Unbekannt"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                        {batch.quantity} Blühpflanzen
                        {tabValue === 0 && batch.destroyed_plants_count > 0 && (
                          <span> ({batch.active_plants_count} aktiv, {batch.destroyed_plants_count} vernichtet)</span>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Erstellt am: {new Date(batch.created_at).toLocaleDateString('de-DE')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, width: '100%' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Notizen:</strong> {batch.notes || 'Keine Notizen'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Batch-UUID:</strong> {batch.id}
                </Typography>
                
                {batchPlants[batch.id] ? (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} width="100%">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={(selectedPlants[batch.id]?.length || 0) === (batchPlants[batch.id]?.length || 0)}
                            indeterminate={(selectedPlants[batch.id]?.length || 0) > 0 && 
                                          (selectedPlants[batch.id]?.length || 0) < (batchPlants[batch.id]?.length || 0)}
                            onChange={(e) => selectAllPlantsInBatch(batch.id, e.target.checked)}
                          />
                        }
                        label="Alle auswählen"
                      />
                      
                      {tabValue === 0 && selectedPlants[batch.id]?.length > 0 && (
                        <Button 
                          variant="contained" 
                          color="error"
                          onClick={() => handleOpenDestroyDialog(batch)}
                          startIcon={<LocalFireDepartmentIcon />}
                        >
                          {selectedPlants[batch.id].length} Pflanzen vernichten
                        </Button>
                      )}
                    </Box>
                    
                    <Paper 
                      sx={{ 
                        mt: 2, 
                        width: '100%', 
                        overflowX: 'auto',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Table size="small" sx={{ minWidth: '100%' }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            {tabValue === 0 && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={(selectedPlants[batch.id]?.length || 0) === (batchPlants[batch.id]?.length || 0)}
                                  indeterminate={(selectedPlants[batch.id]?.length || 0) > 0 && 
                                                (selectedPlants[batch.id]?.length || 0) < (batchPlants[batch.id]?.length || 0)}
                                  onChange={(e) => selectAllPlantsInBatch(batch.id, e.target.checked)}
                                />
                              </TableCell>
                            )}
                            <TableCell><strong>Batch-Nummer</strong></TableCell>
                            <TableCell><strong>UUID</strong></TableCell>
                            <TableCell><strong>Erstellt am</strong></TableCell>
                            <TableCell><strong>Notizen</strong></TableCell>
                            {tabValue === 1 && (
                              <>
                                <TableCell><strong>Vernichtungsgrund</strong></TableCell>
                                <TableCell><strong>Vernichtet am</strong></TableCell>
                              </>
                            )}
                            {tabValue === 0 && (
                              <TableCell align="right"><strong>Aktionen</strong></TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchPlants[batch.id].map((plant) => (
                            <TableRow 
                              key={plant.id}
                              sx={{ 
                                '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:hover': { backgroundColor: '#f0f0f0' }
                              }}
                            >
                              {tabValue === 0 && (
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedPlants[batch.id]?.includes(plant.id) || false}
                                    onChange={() => togglePlantSelection(batch.id, plant.id)}
                                  />
                                </TableCell>
                              )}
                              <TableCell>{plant.batch_number || batch.batch_number}</TableCell>
                              <TableCell>{plant.id}</TableCell>
                              <TableCell>{new Date(plant.created_at).toLocaleString('de-DE')}</TableCell>
                              <TableCell>{plant.notes || '-'}</TableCell>
                              {tabValue === 1 && (
                                <>
                                  <TableCell>{plant.destroy_reason || '-'}</TableCell>
                                  <TableCell>
                                    {plant.destroyed_at ? new Date(plant.destroyed_at).toLocaleString('de-DE') : '-'}
                                  </TableCell>
                                </>
                              )}
                              {tabValue === 0 && (
                                <TableCell align="right">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => {
                                      setSelectedPlants({
                                        ...selectedPlants,
                                        [batch.id]: [plant.id]
                                      })
                                      handleOpenDestroyDialog(batch)
                                    }}
                                    title="Pflanze vernichten"
                                  >
                                    <LocalFireDepartmentIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                    
                    {/* Pagination für die Pflanzen innerhalb eines Batches */}
                    {plantsTotalPages[batch.id] > 1 && (
                      <Box display="flex" justifyContent="center" mt={2} width="100%">
                        <Pagination 
                          count={plantsTotalPages[batch.id]} 
                          page={plantsCurrentPage[batch.id] || 1} 
                          onChange={(e, page) => handlePlantsPageChange(batch.id, e, page)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box display="flex" justifyContent="center" my={2} width="100%">
                    <CircularProgress size={24} />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Pagination für die Batches */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4} width="100%">
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {floweringBatches.length === 0 && !loading && (
            <Typography align="center" sx={{ mt: 4, width: '100%' }}>
              Keine Blühpflanzen vorhanden
            </Typography>
          )}
        </Box>
      )}

      {/* Dialog zur Vernichtung */}
      <Dialog open={openDestroyDialog} onClose={() => setOpenDestroyDialog(false)}>
        <DialogTitle>
          {selectedPlants[selectedBatch?.id]?.length > 1 
            ? `${selectedPlants[selectedBatch?.id].length} Blühpflanzen vernichten` 
            : 'Blühpflanze vernichten'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Bitte gib einen Grund für die Vernichtung an:
          </Typography>
          <TextField
            label="Vernichtungsgrund"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={destroyReason}
            onChange={(e) => setDestroyReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDestroyDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleDestroy} 
            variant="contained" 
            color="error"
            disabled={!destroyReason}
          >
            Vernichten
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}