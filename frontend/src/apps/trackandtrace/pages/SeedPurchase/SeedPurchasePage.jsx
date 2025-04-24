// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchasePage.jsx
import { useState, useEffect } from 'react'
import { 
  Container, Typography, Button, Box, IconButton, 
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Paper, CircularProgress, Grid, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Pagination, Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ClearIcon from '@mui/icons-material/Clear'
import ScienceIcon from '@mui/icons-material/Science'
import SpaIcon from '@mui/icons-material/Spa' // Icon für Mutterpflanze
import LocalFloristIcon from '@mui/icons-material/LocalFlorist' // Icon für Blühpflanze
import api from '../../../../utils/api'
import SeedPurchaseForm from './SeedPurchaseForm'

export default function SeedPurchasePage() {
  const [seeds, setSeeds] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [openConvertDialog, setOpenConvertDialog] = useState(false)
  const [convertType, setConvertType] = useState('')
  const [convertQuantity, setConvertQuantity] = useState(1)
  const [convertNotes, setConvertNotes] = useState('')
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedRows, setSelectedRows] = useState([]) 
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeSeedCount, setActiveSeedCount] = useState(0)
  const [motherConvertedCount, setMotherConvertedCount] = useState(0)
  const [floweringConvertedCount, setFloweringConvertedCount] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyQuantity, setDestroyQuantity] = useState(1)
  const [motherBatchCount, setMotherBatchCount] = useState(0)
  const [motherPlantCount, setMotherPlantCount] = useState(0)
  const [floweringBatchCount, setFloweringBatchCount] = useState(0)
  const [floweringPlantCount, setFloweringPlantCount] = useState(0)
  const [totalActiveQuantity, setTotalActiveQuantity] = useState(0)
  const [totalDestroyedQuantity, setTotalDestroyedQuantity] = useState(0)
  
  // Zustand für Blühpflanzen-Batches und Mutterpflanzen-Batches
  const [floweringBatches, setFloweringBatches] = useState([])
  const [motherBatches, setMotherBatches] = useState([])

  // Zustand für Mitglieder und Räume
  const [members, setMembers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // State für die Mitglieder- und Raumauswahl bei Konvertierung
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  // State für die Mitgliederauswahl bei Vernichtung
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Akkordeon-State
  const [expandedSeedId, setExpandedSeedId] = useState('')

  const loadSeeds = async (page = 1) => {
    setLoading(true)
    try {
      // Basisfilter je nach Tab
      let url = `/trackandtrace/seeds/?page=${page}&page_size=${pageSize}`;
      
      // Bei Tab "Vernichtet" nach zerstörten Samen filtern
      if (tabValue === 3) {
        url += '&destroyed=true';
      } else {
        url += '&destroyed=false';
      }
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Samen:', res.data);
      setSeeds(res.data.results || []);
      
      // Gesamtzahl der Einträge setzen für korrekte Paginierung
      const total = res.data.count || 0;
      setTotalCount(total);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil(total / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Samen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separate Funktion zum Laden der Mutterpflanzen-Batches
  const loadMotherBatches = async (page = 1) => {
    if (tabValue !== 1) return;
    
    setLoading(true);
    try {
      // API-Aufruf für Mutterpflanzen-Batches statt Seeds
      let url = `/trackandtrace/motherbatches/?page=${page}&page_size=${pageSize}`;

      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Mutterpflanzen-Batches:', res.data);
      
      setMotherBatches(res.data.results || []);
      setTotalCount(res.data.count || 0);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil((res.data.count || 0) / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Mutterpflanzen-Batches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Separate Funktion zum Laden der Blühpflanzen-Batches
  const loadFloweringBatches = async (page = 1) => {
    if (tabValue !== 2) return;
    
    setLoading(true);
    try {
      // API-Aufruf für Blühpflanzen-Batches statt Seeds
      let url = `/trackandtrace/floweringbatches/?page=${page}&page_size=${pageSize}`;

      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Blühpflanzen-Batches:', res.data);
      
      setFloweringBatches(res.data.results || []);
      setTotalCount(res.data.count || 0);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil((res.data.count || 0) / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Batches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Laden von Mitgliedern und Räumen
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true)
    try {
      // Mitglieder laden - mit korrigiertem API-Pfad
      const membersRes = await api.get('members/')
      console.log('Mitglieder für Konvertierungsdialog geladen:', membersRes.data)
      
      // Formatierte Mitglieder mit display_name
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden - mit korrigiertem API-Pfad
      const roomsRes = await api.get('rooms/')
      console.log('Räume für Konvertierungsdialog geladen:', roomsRes.data)
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder und Räume:', error)
    } finally {
      setLoadingOptions(false)
    }
  }
  
  // Separat die Zähler laden (für ALLE Tabs)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/seeds/counts/');
      
      // NUR diese Funktion setzt alle Zähler für die Tab-Beschriftungen
      setActiveSeedCount(res.data.active_seed_count || 0);
      setTotalActiveQuantity(res.data.total_active_seeds_quantity || 0);
      
      setDestroyedCount(res.data.destroyed_count || 0);
      setTotalDestroyedQuantity(res.data.total_destroyed_seeds_quantity || 0);
      
      setMotherBatchCount(res.data.mother_batch_count || 0);
      setMotherPlantCount(res.data.mother_plant_count || 0);
      setFloweringBatchCount(res.data.flowering_batch_count || 0);
      setFloweringPlantCount(res.data.flowering_plant_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };

  // Aktualisieren der Seite nach einer Aktion
  const refreshData = () => {
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(currentPage);
    } else if (tabValue === 1) {
      loadMotherBatches(currentPage);
    } else if (tabValue === 2) {
      loadFloweringBatches(currentPage);
    }
    
    loadCounts();
  };

  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab unterschiedliche Ladestrategien für Tabellendaten
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
    
    // Zurücksetzen des expandierten Seeds beim Tab-Wechsel
    setExpandedSeedId('');
  }, [tabValue, pageSize]);
  
  // Mitglieder und Räume beim ersten Laden abrufen
  useEffect(() => {
    loadMembersAndRooms();
  }, []);
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    
    // Je nach Tab die richtige Lademethode aufrufen
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(page);
    } else if (tabValue === 1) {
      loadMotherBatches(page);
    } else if (tabValue === 2) {
      loadFloweringBatches(page);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSelectedRows([]) // Zurücksetzen der ausgewählten Zeilen beim Tab-Wechsel
  }
  
  const handleAccordionChange = (seedId) => {
    if (expandedSeedId === seedId) {
      setExpandedSeedId('')
    } else {
      setExpandedSeedId(seedId)
    }
  }

  const handleOpenConvertDialog = (seed, type, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setConvertType(type)
    setConvertQuantity(1)
    setConvertNotes('')
    setSelectedMemberId('')
    setSelectedRoomId('')
    setOpenConvertDialog(true)
  }

  const handleConvert = async () => {
    if (!selectedSeed || !convertType) return

    try {
      const endpoint = convertType === 'mother' 
        ? `/trackandtrace/seeds/${selectedSeed.id}/convert_to_mother/`
        : `/trackandtrace/seeds/${selectedSeed.id}/convert_to_flower/`

      await api.post(endpoint, {
        quantity: convertQuantity,
        notes: convertNotes,
        member_id: selectedMemberId || null,
        room_id: selectedRoomId || null
      })

      setOpenConvertDialog(false)
      refreshData()
    } catch (error) {
      console.error('Fehler bei der Konvertierung:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    }
  }

  const handleOpenDestroyDialog = (seed, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setDestroyReason('')
    setDestroyQuantity(1)
    setDestroyedByMemberId('')
    setOpenDestroyDialog(true)
  }
  
  const handleOpenEditForm = (seed, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setOpenForm(true)
  }

  const handleDestroy = async () => {
    try {
      if (selectedSeed) {
        // Einzelnen Samen vernichten (teilweise oder komplett)
        await api.post(`/trackandtrace/seeds/${selectedSeed.id}/destroy_seed/`, {
          reason: destroyReason,
          quantity: destroyQuantity,
          destroyed_by_id: destroyedByMemberId || null
        });
      }

      setOpenDestroyDialog(false);
      setSelectedSeed(null);
      refreshData();
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  }
  
  const handleFilterApply = () => {
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
  }

  // Funktion, die die anzuzeigenden Daten basierend auf dem Tab zurückgibt
  const getDisplayedData = () => {
    if (tabValue === 0) {
      // Tab 0: Aktive Samen - nur Samen mit verbleibender Menge > 0
      return seeds.filter(seed => seed.remaining_quantity > 0);
    } else if (tabValue === 1) {
      // Tab 1: Zu Mutterpflanzen - verwende die separat geladenen Mutterpflanzen-Batches
      return motherBatches;
    } else if (tabValue === 2) {
      // Tab 2: Zu Blühpflanzen - verwende die separat geladenen Blühpflanzen-Batches
      return floweringBatches;
    } else {
      // Tab 3: Vernichtet - keine weitere Filterung nötig
      return seeds;
    }
  };
  
  // Die Daten, die in der aktuellen Tabelle angezeigt werden sollen
  const displayedData = getDisplayedData();

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Samen-Verwaltung</Typography>
        <Box>
          <IconButton 
            onClick={() => setShowFilters(!showFilters)} 
            color={showFilters ? "primary" : "default"}
            sx={{ mr: 1 }}
          >
            <FilterAltIcon />
          </IconButton>
          
          {tabValue === 0 && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => {
                setSelectedSeed(null)
                setOpenForm(true)
              }}
            >
              NEUER SAMEN
            </Button>
          )}
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

      <Paper sx={{ mb: 2, width: '100%', overflow: 'hidden', borderRadius: 0 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="Samen-Tabs"
          sx={{
            '& .MuiTabs-indicator': { height: '3px' }
          }}
        >
          <Tab 
            label={`AKTIVE SAMEN (${activeSeedCount}/${totalActiveQuantity})`} 
            sx={{ 
              color: tabValue === 0 ? 'success.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'success.main',
                fontWeight: 700
              },
              whiteSpace: 'nowrap'
            }}
          />
          <Tab 
            label={`KONVERTIERT ZU MUTTERPFLANZEN (${motherBatchCount}/${motherPlantCount})`}
            sx={{ 
              color: tabValue === 1 ? 'success.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'success.main',
                fontWeight: 700
              },
              whiteSpace: 'nowrap'
            }}
          />
          <Tab 
            label={`KONVERTIERT ZU BLÜHPFLANZEN (${floweringBatchCount}/${floweringPlantCount})`}
            sx={{ 
              color: tabValue === 2 ? 'success.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'success.main',
                fontWeight: 700
              },
              whiteSpace: 'nowrap'
            }}
          />
          <Tab 
            label={`VERNICHTET (${destroyedCount}/${totalDestroyedQuantity})`}
            sx={{ 
              color: tabValue === 3 ? 'success.main' : 'text.primary',
              '&.Mui-selected': {
                color: 'success.main',
                fontWeight: 700
              },
              whiteSpace: 'nowrap'
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
          {/* Tabellenkopf mit symmetrischer Ausrichtung und Aktionen-Spalte */}
          <Paper elevation={1} sx={{ mb: 2, borderRadius: '4px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                  {/* Ausklapp-Icon-Spalte */}
                  <TableCell 
                    sx={{ 
                      width: '40px', 
                      padding: '12px 0', 
                      textAlign: 'center',
                      verticalAlign: 'middle'
                    }}
                  ></TableCell>
                  
                  {/* Sortenname-Spalte */}
                  <TableCell 
                    sx={{ 
                      width: '15%', 
                      fontWeight: 'bold', 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle'
                    }}
                  >
                    Sortenname
                  </TableCell>
                  
                  {/* Charge-Nummer-Spalte */}
                  <TableCell 
                    sx={{ 
                      width: '15%', 
                      fontWeight: 'bold', 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle'
                    }}
                  >
                    Charge-Nummer
                  </TableCell>
                  
                  {tabValue === 0 && (
                    <>
                      <TableCell 
                        sx={{ 
                          width: '12%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'center', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Gesamt/Verfügbar
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordnetes Mitglied
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordneter Raum
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '13%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Erstellt am
                      </TableCell>
                    </>
                  )}
                  
                  {tabValue === 1 && (
                    <>
                      <TableCell 
                        sx={{ 
                          width: '12%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'center', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Anzahl Pflanzen
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordnetes Mitglied
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordneter Raum
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '13%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Erstellt am
                      </TableCell>
                    </>
                  )}
                  
                  {tabValue === 2 && (
                    <>
                      <TableCell 
                        sx={{ 
                          width: '12%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'center', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Anzahl Pflanzen
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordnetes Mitglied
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Zugeordneter Raum
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '13%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Erstellt am
                      </TableCell>
                    </>
                  )}
                  
                  {tabValue === 3 && (
                    <>
                      <TableCell 
                        sx={{ 
                          width: '12%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'center', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Vernichtete Menge
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Vernichtet durch
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Vernichtungsgrund
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '13%', 
                          fontWeight: 'bold', 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }}
                      >
                        Vernichtet am
                      </TableCell>
                    </>
                  )}
                  
                  {/* Aktionen-Spalte im Header */}
                  <TableCell 
                    sx={{ 
                      width: '15%', 
                      fontWeight: 'bold', 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle'
                    }}
                  >
                    Aktionen
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </Paper>

          {/* Tabellendaten mit Akkordeons */}
          {displayedData && displayedData.length > 0 ? (
            displayedData.map((item) => (
              <Paper 
                key={item.id} 
                elevation={1} 
                sx={{ 
                  mb: 1.5, 
                  overflow: 'hidden', 
                  borderRadius: '4px',
                  border: expandedSeedId === item.id ? '1px solid rgba(76, 175, 80, 0.5)' : 'none'
                }}
              >
                {/* Akkordeon-Header als Tabellenzeile gestylt mit verbesserten Abständen */}
                <Box
                  sx={{
                    display: 'flex',
                    cursor: 'pointer',
                    backgroundColor: expandedSeedId === item.id ? 'rgba(0, 0, 0, 0.04)' : 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    borderLeft: '4px solid',
                    borderColor: 'success.main',
                  }}
                >
                  {/* Ausklapp-Icon-Spalte */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '40px',
                      padding: '12px 0'
                    }}
                    onClick={() => handleAccordionChange(item.id)}
                  >
                    <IconButton size="small">
                      <ExpandMoreIcon 
                        sx={{ 
                          transform: expandedSeedId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }} 
                      />
                    </IconButton>
                  </Box>
                  
                  {/* Sortenname-Spalte */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      width: '15%', 
                      padding: '12px 16px',
                      overflow: 'hidden',
                      justifyContent: 'flex-start'
                    }}
                    onClick={() => handleAccordionChange(item.id)}
                  >
                    <ScienceIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 1 }} />
                    <Typography 
                      variant="body2" 
                      component="span" 
                      sx={{ 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {tabValue === 0 || tabValue === 3 ? item.strain_name : item.seed_strain}
                    </Typography>
                  </Box>
                  
                  {/* Charge-Nummer-Spalte */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      width: '15%', 
                      padding: '12px 16px',
                      overflow: 'hidden',
                      justifyContent: 'flex-start'
                    }}
                    onClick={() => handleAccordionChange(item.id)}
                  >
                    <Typography 
                      variant="body2" 
                      component="span" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.batch_number || ''}
                    </Typography>
                  </Box>
                  
                  {tabValue === 0 && (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '12%', 
                          padding: '12px 16px',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          align="center"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.quantity}/{item.remaining_quantity}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.member ? 
                            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
                            : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.room ? item.room.name : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          width: '13%',
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {new Date(item.created_at).toLocaleDateString('de-DE')}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {tabValue === 1 && (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '12%', 
                          padding: '12px 16px',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          align="center"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {/* Bei Mutterpflanzen-Batches die Anzahl der aktiven Pflanzen anzeigen */}
                          {item.active_plants_count || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.member ? 
                            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
                            : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.room ? item.room.name : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          width: '13%',
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {new Date(item.created_at).toLocaleDateString('de-DE')}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {tabValue === 2 && (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '12%', 
                          padding: '12px 16px',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          align="center"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {/* Bei Blühpflanzen-Batches die Anzahl der aktiven Pflanzen anzeigen */}
                          {item.active_plants_count || 0}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.member ? 
                            (item.member.display_name || `${item.member.first_name} ${item.member.last_name}`) 
                            : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.room ? item.room.name : "Nicht zugewiesen"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          width: '13%',
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {new Date(item.created_at).toLocaleDateString('de-DE')}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {tabValue === 3 && (
                    <>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '12%', 
                          padding: '12px 16px',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          align="center"
                          sx={{ 
                            color: 'error.main',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.destroyed_quantity}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.destroyed_by ? 
                            (item.destroyed_by.display_name || `${item.destroyed_by.first_name} ${item.destroyed_by.last_name}`) 
                            : "-"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          width: '15%', 
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.destroy_reason || "-"}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          width: '13%',
                          padding: '12px 16px',
                          justifyContent: 'flex-start'
                        }}
                        onClick={() => handleAccordionChange(item.id)}
                      >
                        <Typography 
                          variant="body2"
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.destroyed_at ? new Date(item.destroyed_at).toLocaleDateString('de-DE') : '-'}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {/* Aktionen-Spalte */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '15%', 
                      padding: '12px 16px',
                    }}
                    onClick={(e) => e.stopPropagation()} /* Verhindert, dass das Akkordeon sich öffnet, wenn man auf die Aktionen klickt */
                  >
                    {tabValue === 0 && (
                      <>
                        <Tooltip title="Zu Mutterpflanze konvertieren">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleOpenConvertDialog(item, 'mother', e)}
                            sx={{ mx: 0.5 }}
                          >
                            <SpaIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Zu Blühpflanze konvertieren">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleOpenConvertDialog(item, 'flower', e)}
                            sx={{ mx: 0.5 }}
                          >
                            <LocalFloristIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {/* Bearbeiten-Button für alle Tabs außer "Vernichtet" */}
                    {tabValue !== 3 && (
                      <Tooltip title="Bearbeiten">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleOpenEditForm(item, e)}
                          sx={{ mx: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Vernichten-Button für alle Tabs außer "Vernichtet" */}
                    {tabValue !== 3 && (
                      <Tooltip title="Vernichten">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => handleOpenDestroyDialog(item, e)}
                          sx={{ mx: 0.5 }}
                        >
                          <LocalFireDepartmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Ausgeklappter Bereich */}
                {expandedSeedId === item.id && (
                  <Box 
                    sx={{ 
                      width: '100%',
                      padding: '16px 24px 24px 24px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                    }}
                  >
                    {/* Karten mit gleicher Höhe - Flex-Layout statt Grid für stabile Anordnung */}
                    <Box display="flex" flexDirection="row" width="100%" sx={{ flexWrap: 'nowrap' }}>
                      {/* Charge-Details */}
                      <Box sx={{ flex: '0 0 33.333%', pr: 1.5 }}>
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
                            <Typography variant="subtitle2" color="success.main">
                              {tabValue === 0 || tabValue === 3 ? 'Samen-Details' : 
                               tabValue === 1 ? 'Mutterpflanzen-Details' : 'Blühpflanzen-Details'}
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                                Chargen-ID:
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
                        </Paper>
                      </Box>
                      
                      {/* Bestandsinformationen */}
                      <Box sx={{ flex: '0 0 33.333%', px: 1.5 }}>
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
                            <Typography variant="subtitle2" color="success.main">
                              Bestandsinformationen
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, flexGrow: 1 }}>
                            {tabValue === 0 || tabValue === 3 ? (
                              // Informationen für Samen
                              <>
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
                              </>
                            ) : (
                              // Informationen für Batches (Mutterpflanzen oder Blühpflanzen)
                              <>
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
                              </>
                            )}
                          </Box>
                        </Paper>
                      </Box>
                      
                      {/* Notizen */}
                      <Box sx={{ flex: '0 0 33.333%', pl: 1.5 }}>
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
                            <Typography variant="subtitle2" color="success.main">
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
                          </Box>
                        </Paper>
                      </Box>
                    </Box>
                    
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
                                onClick={() => handleOpenConvertDialog(item, 'mother')}
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
                                onClick={() => handleOpenConvertDialog(item, 'flower')}
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
                                onClick={() => handleOpenEditForm(item)}
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
                                onClick={() => handleOpenDestroyDialog(item)}
                                startIcon={<LocalFireDepartmentIcon />}
                              >
                                Vernichten
                              </Button>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%' }}>
              Keine Samen vorhanden
            </Typography>
          )}

          {/* Pagination für die Seeds */}
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
        </Box>
      )}

      <SeedPurchaseForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setSelectedSeed(null)
        }}
        onSuccess={() => {
          setOpenForm(false)
          setSelectedSeed(null)
          refreshData()
        }}
        initialData={selectedSeed || {}}
      />

      {/* Dialog zur Konvertierung mit verbesserten Stilen */}
      <Dialog open={openConvertDialog} onClose={() => setOpenConvertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {convertType === 'mother' ? 'Zu Mutterpflanze konvertieren' : 'Zu Blühpflanze konvertieren'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Verfügbare Samen: {selectedSeed?.remaining_quantity || 0}
          </Typography>
          <TextField
            label="Anzahl"
            type="number"
            fullWidth
            margin="normal"
            value={convertQuantity}
            onChange={(e) => setConvertQuantity(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: selectedSeed?.remaining_quantity || 1 }}
          />
          
          {/* Mitgliederauswahl mit verbesserten Stilen */}
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Mitglied</InputLabel>
            <Select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              label="Mitglied"
            >
              <MenuItem value="">
                <em>Kein Mitglied zugeordnet</em>
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
          
          {/* Raumauswahl mit verbesserten Stilen */}
          <FormControl 
            fullWidth 
            margin="normal"
          >
            <InputLabel>Raum</InputLabel>
            <Select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              label="Raum"
            >
              <MenuItem value="">
                <em>Kein Raum zugeordnet</em>
              </MenuItem>
              {rooms.map(room => (
                <MenuItem 
                  key={room.id} 
                  value={room.id}
                >
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Notizen"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={convertNotes}
            onChange={(e) => setConvertNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConvertDialog(false)}>Abbrechen</Button>
          <Button onClick={handleConvert} variant="contained" color="success">Konvertieren</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zur Vernichtung mit verbesserten Stilen */}
      <Dialog open={openDestroyDialog} onClose={() => setOpenDestroyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Samen vernichten
        </DialogTitle>
        <DialogContent>
          {selectedSeed && tabValue === 0 && (
            <>
              <Typography variant="body2" gutterBottom>
                Verfügbare Samen: {selectedSeed?.remaining_quantity || 0}
              </Typography>
              <TextField
                label="Anzahl zu vernichtender Samen"
                type="number"
                fullWidth
                margin="normal"
                value={destroyQuantity}
                onChange={(e) => setDestroyQuantity(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: selectedSeed?.remaining_quantity || 1 }}
              />
            </>
          )}
          
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
          
          <Typography variant="body2" gutterBottom>
            Bitte gib einen Grund für die Vernichtung an:
          </Typography>
          <TextField
            label="Vernichtungsgrund"
            fullWidth
            margin="normal"
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