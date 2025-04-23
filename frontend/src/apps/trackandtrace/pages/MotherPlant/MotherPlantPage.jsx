// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantPage.jsx
import { useState, useEffect } from 'react'
import { 
  Container, Typography, Box, IconButton, 
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Pagination, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tabs, Tab, Checkbox,
  FormControlLabel, Grid, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Chip, Divider
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ClearIcon from '@mui/icons-material/Clear'
import ScienceIcon from '@mui/icons-material/Science'
import api from '../../../../utils/api'

export default function MotherPlantPage() {
  const [motherBatches, setMotherBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [destroyedBatchPlants, setDestroyedBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [plantsCurrentPage, setPlantsCurrentPage] = useState({})
  const [plantsTotalPages, setPlantsTotalPages] = useState({})
  const [destroyedPlantsCurrentPage, setDestroyedPlantsCurrentPage] = useState({})
  const [destroyedPlantsTotalPages, setDestroyedPlantsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedPlants, setSelectedPlants] = useState({})
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

  // Neue Funktion für die Activity-Stream-Nachrichten
  const getActivityMessage = (batch) => {
    const cultivator = batch.member 
      ? (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
      : "Unbekannt";
    const roomName = batch.room ? batch.room.name : "unbekanntem Raum";
    const date = new Date(batch.created_at).toLocaleDateString('de-DE');
    
    return `Charge ${batch.batch_number} mit Genetik ${batch.seed_strain} wurde von ${cultivator} am ${date} im Raum ${roomName} angelegt.`;
  };

  // Funktion um Pflanzen-ID-Range zu generieren
  const getPlantRangeDisplay = (batch) => {
    if (!batch.batch_number || !batch.quantity) return '';
    const prefix = batch.batch_number.replace('charge:', '');
    return `${prefix}:0001-${prefix}:${String(batch.quantity).padStart(4, '0')}`;
  };

  const loadMotherBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/motherbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Mutterpflanzen-Batches:', res.data);
      
      setMotherBatches(res.data.results || [])
      
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
      console.error('Fehler beim Laden der Mutterpflanzen-Chargen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separat die Zähler laden (für Tabs, die nicht aktiv sind)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/motherbatches/counts/');
      setActivePlantsCount(res.data.active_count || 0);
      setDestroyedPlantsCount(res.data.destroyed_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
  // Funktion zum Laden von Mitgliedern
  const loadMembers = async () => {
    setLoadingOptions(true);
    try {
      // Korrekter API-Pfad ohne führenden Slash, da baseURL bereits auf '/api' gesetzt ist
      const response = await api.get('members/')
      console.log('Mitglieder für Vernichtungsdialog geladen:', response.data)
      
      // Sicherstellen, dass die Mitglieder ein display_name Feld haben
      const formattedMembers = (response.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      console.log('Formatierte Mitglieder:', formattedMembers)
      setMembers(formattedMembers)
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
      console.error('Details:', error.response?.data || error.message)
    } finally {
      setLoadingOptions(false)
    }
  };

  useEffect(() => {
    loadMotherBatches()
    loadCounts() // Alle Zähler beim ersten Laden holen
    loadMembers() // Mitglieder laden
  }, [])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    // Beim Tab-Wechsel alle geöffneten Akkordeons schließen
    setExpandedBatchId('')
    setBatchPlants({})
    setDestroyedBatchPlants({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      // Je nach Tab die richtigen Daten laden
      if (tabValue === 0) {
        // Im Tab "Aktive Pflanzen" nur aktive Pflanzen laden
        loadPlantsForBatch(batchId, 1)
      } else {
        // Im Tab "Vernichtete Pflanzen" nur vernichtete Pflanzen laden
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading plants for batch ID:", batchId);
      // Immer aktive Pflanzen laden, unabhängig vom Tab
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Pflanzen für Batch:', res.data);
      
      // Speichern der Pflanzen für diesen Batch
      // Stelle sicher, dass alle Felder korrekt formatiert sind
      const formattedPlants = (res.data.results || []).map(plant => {
        console.log("Plant batch number:", plant.batch_number);
        return {
          ...plant,
          notes: plant.notes || '-',
          destroy_reason: plant.destroy_reason || '-',
          destroyed_by: plant.destroyed_by ? {
            ...plant.destroyed_by,
            display_name: plant.destroyed_by.display_name || 
                          `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
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
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen, um Ladespinner zu beenden
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  // Separate Funktion zum Laden vernichteter Pflanzen
  const loadDestroyedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
      console.log('Geladene vernichtete Pflanzen für Batch:', res.data);
      
      // Speichern der vernichteten Pflanzen für diesen Batch
      const formattedPlants = (res.data.results || []).map(plant => {
        return {
          ...plant,
          notes: plant.notes || '-',
          destroy_reason: plant.destroy_reason || '-',
          destroyed_by: plant.destroyed_by ? {
            ...plant.destroyed_by,
            display_name: plant.destroyed_by.display_name || 
                          `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setDestroyedBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      // Speichern der aktuellen Seite für die vernichteten Pflanzen dieses Batches
      setDestroyedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die vernichteten Pflanzen
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setDestroyedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der vernichteten Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen
      setDestroyedBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setDestroyedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setDestroyedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const handlePageChange = (event, page) => {
    loadMotherBatches(page)
  }

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
  }

  // Aktualisierte handleOpenDestroyDialog Funktion
  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  // Aktualisierte handleDestroy Funktion
  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedPlants[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/motherbatches/${selectedBatch.id}/destroy_plants/`, {
          plant_ids: selectedPlants[selectedBatch.id],
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedBatch(null);
        
        // Ausgewählte Pflanzen zurücksetzen
        setSelectedPlants(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        // Je nach Tab die richtigen Daten neu laden
        if (tabValue === 0) {
          loadPlantsForBatch(selectedBatch.id, plantsCurrentPage[selectedBatch.id] || 1);
        } else {
          loadDestroyedPlantsForBatch(selectedBatch.id, destroyedPlantsCurrentPage[selectedBatch.id] || 1);
        }
        
        loadCounts(); // Zähler aktualisieren
        loadMotherBatches(currentPage); // Batches neu laden für aktualisierte Zahlen
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

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
    loadMotherBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadMotherBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Mutterpflanzen-Verwaltung</Typography>
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

      <Paper sx={{ mb: 2, width: '100%', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="Mutterpflanzen-Tabs"
          sx={{
            '& .MuiTabs-indicator': { height: '3px' }
          }}
        >
          <Tab 
            label={`AKTIVE PFLANZEN (${activePlantsCount})`} 
            sx={{ 
              color: tabValue === 0 ? 'primary.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          />
          <Tab 
            label={`VERNICHTETE PFLANZEN (${destroyedPlantsCount})`}
            sx={{ 
              color: tabValue === 1 ? 'primary.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4} width="100%">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          {/* Tabellenkopf */}
          <Paper elevation={1} sx={{ mb: 2, borderRadius: '4px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell sx={{ width: '3%', padding: '8px' }}></TableCell>
                  <TableCell sx={{ width: '12%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Genetik</TableCell>
                  <TableCell sx={{ width: '22%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Charge-Nummer(n)</TableCell>
                  <TableCell sx={{ width: '8%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'center' }}>Aktiv/Gesamt</TableCell>
                  <TableCell sx={{ width: '10%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Vernichtet</TableCell>
                  <TableCell sx={{ width: '15%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Kultiviert von</TableCell>
                  <TableCell sx={{ width: '15%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Raum</TableCell>
                  <TableCell sx={{ width: '15%', fontWeight: 'bold', padding: '8px 16px', textAlign: 'left' }}>Erstellt am</TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </Paper>

          {/* Tabellendaten mit Akkordeons */}
          {motherBatches.map((batch) => (
            <Paper 
              key={batch.id} 
              elevation={1} 
              sx={{ 
                mb: 1.5, 
                overflow: 'hidden', 
                borderRadius: '4px',
                border: expandedBatchId === batch.id ? '1px solid primary.main' : 'none'
              }}
            >
              {/* Akkordeon-Header als Tabellenzeile gestylt */}
              <Box
                onClick={() => handleAccordionChange(batch.id)}
                sx={{
                  display: 'flex',
                  cursor: 'pointer',
                  backgroundColor: expandedBatchId === batch.id ? 'rgba(0, 0, 0, 0.04)' : 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  },
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '3%',
                    padding: '8px 0'
                  }}
                >
                  <IconButton size="small">
                    <ExpandMoreIcon 
                      sx={{ 
                        transform: expandedBatchId === batch.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }} 
                    />
                  </IconButton>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    width: '12%', 
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    justifyContent: 'flex-start'
                  }}
                >
                  <ScienceIcon sx={{ color: 'primary.main', fontSize: '1rem', mr: 1 }} />
                  <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                    {batch.seed_strain}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    width: '22%', 
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {batch.batch_number ? 
                      `mother-plant:${batch.batch_number.replace(/^(charge:|mother-plant:)/g, '')}:0001-${String(batch.quantity).padStart(4, '0')}`.replace(':0001:0001', ':0001')
                      : ''}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '8%', 
                    padding: '8px 16px',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="body2" align="center">
                    {batch.active_plants_count}/{batch.quantity}
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '10%', 
                    padding: '8px 16px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: batch.destroyed_plants_count > 0 ? 'error.main' : 'text.primary'
                    }}
                  >
                    {batch.destroyed_plants_count} Pflanzen
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '15%', 
                    padding: '8px 16px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {batch.member ? 
                      (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
                      : "Nicht zugewiesen"}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '15%', 
                    padding: '8px 16px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {batch.room ? batch.room.name : "Nicht zugewiesen"}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    width: '15%',
                    padding: '8px 16px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <Typography variant="body2">
                    {new Date(batch.created_at).toLocaleDateString('de-DE')}
                  </Typography>
                </Box>
              </Box>

              {/* Ausgeklappter Bereich */}
              {expandedBatchId === batch.id && (
                <Box 
                  sx={{ 
                    width: '100%',
                    padding: '16px 24px 24px 24px',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                  }}
                >

                  
                  {/* Activity Stream und Karten unter dem Stream */}
                  <Box sx={{ width: '100%', mb: 3 }}>
                    {/* Activity Stream Message */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        mb: 3, 
                        backgroundColor: 'white', 
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
                        {getActivityMessage(batch)}
                      </Typography>
                    </Box>
                    
                    {/* Karten mit gleicher Höhe im Grid */}
                    <Grid container spacing={3}>
                      {/* Charge-Details */}
                      <Grid item xs={12} md={4}>
                        <Paper 
                          elevation={1}
                          sx={{ 
                            height: '100%', 
                            borderRadius: '4px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'background.paper', 
                            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                          }}>
                            <Typography variant="subtitle2" color="primary">
                              Charge-Details
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                                Chargen-ID:
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                                {batch.batch_number?.startsWith('charge:') 
                                  ? batch.batch_number 
                                  : `charge:${batch.batch_number}`}
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
                                {batch.id}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                                Erstellt am:
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                                {new Date(batch.created_at).toLocaleDateString('de-DE')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                                Ursprungssamen:
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                                {batch.seed_batch_number || "Unbekannt"}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Pflanzen-IDs */}
                      <Grid item xs={12} md={4}>
                        <Paper 
                          elevation={1}
                          sx={{ 
                            height: '100%', 
                            borderRadius: '4px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                          }}>
                            <Typography variant="subtitle2" color="primary">
                              Pflanzen-IDs
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
                              Aktive Pflanzen:
                            </Typography>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                p: 1.5,
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                                mb: 2,
                                border: '1px solid rgba(0, 0, 0, 0.12)'
                              }}
                            >
                              {batch.active_plants_count > 0 
                                ? `mother-plant:${batch.batch_number.replace(/^(charge:|mother-plant:)/g, '')}:0001 bis mother-plant:${batch.batch_number.replace(/^(charge:|mother-plant:)/g, '')}:${String(batch.active_plants_count).padStart(4, '0')}`.replace(':0001:0001', ':0001')
                                : "Keine aktiven Pflanzen"}
                            </Box>
                            
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
                              Vernichtete Pflanzen:
                            </Typography>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                p: 1.5,
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                                border: '1px solid rgba(0, 0, 0, 0.12)',
                                color: batch.destroyed_plants_count > 0 ? 'error.main' : 'rgba(0, 0, 0, 0.38)'
                              }}
                            >
                              {batch.destroyed_plants_count > 0 
                                ? `${batch.destroyed_plants_count} Pflanzen vernichtet` 
                                : "Keine vernichteten Pflanzen"}
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Notizen - jetzt mit flexibler Höhe, die sich an die anderen Karten anpasst */}
                      <Grid item xs={12} md={4}>
                        <Paper 
                          elevation={1}
                          sx={{ 
                            height: '100%',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                          }}>
                            <Typography variant="subtitle2" color="primary">
                              Notizen
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box
                              sx={{
                                backgroundColor: 'white',
                                p: 2,
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 0, 0, 0.12)',
                                flexGrow: 1,
                                display: 'flex',
                                alignItems: batch.notes ? 'flex-start' : 'center',
                                justifyContent: batch.notes ? 'flex-start' : 'center',
                                width: '100%'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontStyle: batch.notes ? 'normal' : 'italic',
                                  color: batch.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
                                  width: '100%'
                                }}
                              >
                                {batch.notes || 'Keine Notizen für diese Charge vorhanden'}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Je nach Tab die entsprechende Pflanzen-Tabelle anzeigen */}
                  {tabValue === 0 ? (
                    // Tab 0: Aktive Pflanzen
                    <>
                      {batchPlants[batch.id] ? (
                        <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" color="primary">
                              Aktive Pflanzen
                            </Typography>
                            
                            {batchPlants[batch.id]?.length > 0 && (
                              <Box display="flex" alignItems="center">
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
                                
                                {selectedPlants[batch.id]?.length > 0 && (
                                  <Button 
                                    variant="contained" 
                                    color="error"
                                    onClick={() => handleOpenDestroyDialog(batch)}
                                    startIcon={<LocalFireDepartmentIcon />}
                                    sx={{ ml: 2 }}
                                  >
                                    {selectedPlants[batch.id].length} Pflanzen vernichten
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                          
                          {batchPlants[batch.id]?.length > 0 ? (
                            <>
                              <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                      <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                        <Checkbox
                                          checked={(selectedPlants[batch.id]?.length || 0) === (batchPlants[batch.id]?.length || 0)}
                                          indeterminate={(selectedPlants[batch.id]?.length || 0) > 0 && 
                                                      (selectedPlants[batch.id]?.length || 0) < (batchPlants[batch.id]?.length || 0)}
                                          onChange={(e) => selectAllPlantsInBatch(batch.id, e.target.checked)}
                                          sx={{
                                            color: 'white',
                                            '&.Mui-checked': {
                                              color: 'white',
                                            },
                                            '&.MuiCheckbox-indeterminate': {
                                              color: 'white',
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge-Nummer</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Erstellt am</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Kultiviert von</TableCell>
                                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Aktionen</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {batchPlants[batch.id]?.map((plant, i) => (
                                      <TableRow 
                                        key={plant.id}
                                        sx={{ 
                                          backgroundColor: 'white',
                                          '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                                        }}
                                      >
                                        <TableCell padding="checkbox">
                                          <Checkbox
                                            checked={selectedPlants[batch.id]?.includes(plant.id) || false}
                                            onChange={() => togglePlantSelection(batch.id, plant.id)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {plant.batch_number || `Pflanze ${i+1} (Nummer nicht verfügbar)`}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                          {plant.id}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(plant.created_at).toLocaleString('de-DE')}
                                        </TableCell>
                                        <TableCell>
                                          {batch.member ? 
                                            (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
                                            : "-"}
                                        </TableCell>
                                        <TableCell align="right">
                                          <IconButton 
                                            size="small" 
                                            sx={{ 
                                              color: 'white',
                                              backgroundColor: 'error.main',
                                              '&:hover': {
                                                backgroundColor: 'error.dark'
                                              },
                                              width: '28px',
                                              height: '28px'
                                            }}
                                            onClick={() => {
                                              setSelectedPlants({
                                                ...selectedPlants,
                                                [batch.id]: [plant.id]
                                              });
                                              handleOpenDestroyDialog(batch);
                                            }}
                                          >
                                            <LocalFireDepartmentIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              
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
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                              Keine aktiven Pflanzen in dieser Charge.
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="center" my={2} width="100%">
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </>
                  ) : (
                    // Tab 1: Vernichtete Pflanzen
                    <>
                      {destroyedBatchPlants[batch.id] ? (
                        <Box sx={{ width: '100%', mt: 2 }}>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            Vernichtete Pflanzen
                          </Typography>
                          
                          {destroyedBatchPlants[batch.id]?.length > 0 ? (
                            <>
                              <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ backgroundColor: 'error.main' }}>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge-Nummer</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vernichtet am</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vernichtet durch</TableCell>
                                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grund</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {destroyedBatchPlants[batch.id]?.map((plant, i) => (
                                      <TableRow 
                                        key={plant.id}
                                        sx={{ 
                                          backgroundColor: 'white',
                                          '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                                        }}
                                      >
                                        <TableCell>
                                          {plant.batch_number || `Pflanze ${i+1} (Nummer nicht verfügbar)`}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                          {plant.id}
                                        </TableCell>
                                        <TableCell>
                                          {plant.destroyed_at ? new Date(plant.destroyed_at).toLocaleString('de-DE') : '-'}
                                        </TableCell>
                                        <TableCell>
                                          {plant.destroyed_by ? 
                                            (plant.destroyed_by.display_name || `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim()) 
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          {plant.destroy_reason || '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              
                              {/* Pagination für die vernichteten Pflanzen */}
                              {destroyedPlantsTotalPages[batch.id] > 1 && (
                                <Box display="flex" justifyContent="center" mt={2} width="100%">
                                  <Pagination 
                                    count={destroyedPlantsTotalPages[batch.id]} 
                                    page={destroyedPlantsCurrentPage[batch.id] || 1} 
                                    onChange={(e, page) => handleDestroyedPlantsPageChange(batch.id, e, page)}
                                    color="error"
                                    size="small"
                                  />
                                </Box>
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                              Keine vernichteten Pflanzen in dieser Charge.
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="center" my={2} width="100%">
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Paper>
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

          {motherBatches.length === 0 && !loading && (
            <Typography align="center" sx={{ mt: 4, width: '100%' }}>
              Keine Mutterpflanzen vorhanden
            </Typography>
          )}
        </Box>
      )}

      {/* Dialog zur Vernichtung mit Mitgliederauswahl und verbesserten Stilen */}
      <Dialog open={openDestroyDialog} onClose={() => setOpenDestroyDialog(false)}>
        <DialogTitle>
          {selectedPlants[selectedBatch?.id]?.length > 1 
            ? `${selectedPlants[selectedBatch?.id].length} Mutterpflanzen vernichten` 
            : 'Mutterpflanze vernichten'}
        </DialogTitle>
        <DialogContent>
          {/* Mitgliederauswahl für die Vernichtung mit verbesserten Stilen */}
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Vernichtet durch</InputLabel>
            <Select
              value={destroyedByMemberId}
              onChange={(e) => setDestroyedByMemberId(e.target.value)}
              label="Vernichtet durch"
              required
            >
              <MenuItem value="">
                <em>Bitte Mitglied auswählen</em>
              </MenuItem>
              {members.map(member => (
                <MenuItem 
                  key={member.id} 
                  value={member.id}
                >
                  {member.display_name || `${member.first_name} ${member.last_name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
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
            disabled={!destroyReason || !destroyedByMemberId}
          >
            Vernichten
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}