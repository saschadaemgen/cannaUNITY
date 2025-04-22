// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchasePage.jsx
import { useState, useEffect } from 'react'
import { 
  Container, Typography, Button, Box, IconButton, 
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Paper, Checkbox, CircularProgress, Grid, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ClearIcon from '@mui/icons-material/Clear'
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
  const [selectedRows, setSelectedRows] = useState([]) // Stellen sicher, dass dies ein Array ist
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
  // Neue State-Variablen für Gesamtzahlen
  const [totalActiveQuantity, setTotalActiveQuantity] = useState(0)
  const [totalDestroyedQuantity, setTotalDestroyedQuantity] = useState(0)
  
  // Zustand für Blühpflanzen-Seeds und Mutterpflanzen-Seeds
  const [floweringSeeds, setFloweringSeeds] = useState([])
  const [motherSeeds, setMotherSeeds] = useState([])

  // Neue Funktion zum Berechnen der Gesamtzahl der Samen für einen Tab
  const getTotalSeedCount = (tabIndex) => {
    if (tabIndex === 0) {
      // Für aktive Samen: Gesamtzahl der aktiven Samen
      return seeds.reduce((sum, seed) => {
        if (!seed.is_destroyed && seed.remaining_quantity > 0) {
          return sum + (seed.remaining_quantity || 0);
        }
        return sum;
      }, 0);
    } else if (tabIndex === 3) {
      // Für vernichtete Samen: Differenz zwischen Gesamtmenge und verbleibender Menge
      return seeds.reduce((sum, seed) => {
        if (seed.is_destroyed) {
          const destroyedQuantity = seed.quantity - (seed.remaining_quantity || 0);
          return sum + destroyedQuantity;
        }
        return sum;
      }, 0);
    }
    return 0;
  };

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
      
      console.log('API-Anfrage:', url);
      const res = await api.get(url);
      console.log('API-Antwort:', res.data);
      
      setSeeds(res.data.results || []);
      
      // Gesamtzahl der Einträge setzen für korrekte Paginierung
      const total = res.data.count || 0;
      setTotalCount(total);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil(total / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
      
      // Zähler aus der Antwort übernehmen
      if (res.data.counts) {
        setActiveSeedCount(res.data.counts.active_seed_count || 0);
        setMotherConvertedCount(res.data.counts.mother_converted_count || 0);
        setFloweringConvertedCount(res.data.counts.flowering_converted_count || 0);
        setDestroyedCount(res.data.counts.destroyed_count || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Samen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separate Funktion zum Laden der Mutterpflanzen-Seeds
  const loadMotherSeeds = async () => {
    if (tabValue !== 1) return;
    
    setLoading(true);
    try {
      // Wichtig: Hier 'destroyed=false' weglassen, um alle Seeds zu laden, 
      // unabhängig vom Vernichtungsstatus
      const url = `/trackandtrace/seeds/`;
      const res = await api.get(url);
      
      console.log('Mutterpflanzen API-Antwort:', res.data);
      
      // Filtern nach Seeds mit Mutterpflanzen (unabhängig vom Vernichtungsstatus)
      const seedsWithMothers = (res.data.results || []).filter(
        seed => seed.mother_plant_count > 0
      );
      
      setMotherSeeds(seedsWithMothers);
      setTotalCount(seedsWithMothers.length);
    } catch (error) {
      console.error('Fehler beim Laden der Mutterpflanzen-Seeds:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Separate Funktion zum Laden der Blühpflanzen-Seeds
  const loadFloweringSeeds = async () => {
    if (tabValue !== 2) return;
    
    setLoading(true);
    try {
      // Wichtig: Hier 'destroyed=false' weglassen, um alle Seeds zu laden, 
      // unabhängig vom Vernichtungsstatus
      const url = `/trackandtrace/seeds/`;
      const res = await api.get(url);
      
      console.log('Blühpflanzen API-Antwort:', res.data);
      
      // Filtern nach Seeds mit Blühpflanzen (unabhängig vom Vernichtungsstatus)
      const seedsWithFlowering = (res.data.results || []).filter(
        seed => seed.flowering_plant_count > 0
      );
      
      setFloweringSeeds(seedsWithFlowering);
      setTotalCount(seedsWithFlowering.length);
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Seeds:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Separat die Zähler laden (für Tabs, die nicht aktiv sind)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/seeds/counts/');
      console.log('Zähler-API-Antwort:', res.data);
      
      setActiveSeedCount(res.data.active_seed_count || 0);
      setTotalActiveQuantity(res.data.total_active_seeds_quantity || 0);
      
      setDestroyedCount(res.data.destroyed_count || 0);
      setTotalDestroyedQuantity(res.data.total_destroyed_seeds_quantity || 0);
      
      // Neue Zähler setzen
      setMotherBatchCount(res.data.mother_batch_count || 0);
      setMotherPlantCount(res.data.mother_plant_count || 0);
      setFloweringBatchCount(res.data.flowering_batch_count || 0);
      setFloweringPlantCount(res.data.flowering_plant_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };

  // Aktualisieren der Seite nach einer Aktion (löschen, vernichten, konvertieren)
  const refreshData = () => {
    // Aktualisiere den aktiven Tab
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(currentPage);
    } else if (tabValue === 1) {
      loadMotherSeeds();
    } else if (tabValue === 2) {
      loadFloweringSeeds();
    }
    
    // Immer die Zähler aktualisieren
    loadCounts();
  };

  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab unterschiedliche Ladestrategien
    if (tabValue === 0 || tabValue === 3) {
      // Normale Seeds laden (aktiv oder vernichtet)
      loadSeeds(1);
    } else if (tabValue === 1) {
      // Mutterpflanzen-Seeds separat laden
      loadMotherSeeds();
    } else if (tabValue === 2) {
      // Blühpflanzen-Seeds separat laden
      loadFloweringSeeds();
    }
    
    // Immer die Zähler laden
    loadCounts();
  }, [tabValue, pageSize]);
  
  const handlePageChange = (params) => {
    const newPage = params.page + 1; // MUI DataGrid ist 0-indexiert
    setCurrentPage(newPage);
    
    // Je nach Tab die richtige Lademethode aufrufen
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(newPage);
    }
    // Bei den Tab 1 und 2 machen wir keine Server-Paginierung, 
    // sondern filtern auf dem Client
  };
  
  const handlePageSizeChange = (params) => {
    setPageSize(params.pageSize);
    setCurrentPage(1);
    
    // Je nach Tab die richtige Lademethode aufrufen
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    }
    // Bei Tab 1 und 2 keine Server-Anfrage, da wir bereits alle Daten haben
  };

  const handleDelete = async (id) => {
    // Finden Sie zuerst den Samen, um zu prüfen, ob er vernichtet ist
    const seedToDelete = seeds.find(seed => seed.id === id) || 
                         motherSeeds.find(seed => seed.id === id) ||
                         floweringSeeds.find(seed => seed.id === id);
                         
    let confirmMessage = 'Möchtest du diesen Eintrag wirklich löschen?';
    
    // Spezielle Nachricht für vernichtete Samen
    if (seedToDelete && seedToDelete.is_destroyed) {
      const quantity = seedToDelete.quantity - (seedToDelete.remaining_quantity || 0);
      confirmMessage = `Dieser vernichtete Samen wird gelöscht und ${quantity} Samen werden zurück zu den aktiven Samen hinzugefügt. Fortfahren?`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/trackandtrace/seeds/${id}/`);
        refreshData(); // Verwende refreshData statt separaten Aufrufen
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert(error.response?.data?.error || 'Ein Fehler ist beim Löschen aufgetreten');
      }
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSelectedRows([]) // Zurücksetzen der ausgewählten Zeilen beim Tab-Wechsel
    // loadSeeds wird im useEffect bei Änderung von tabValue aufgerufen
  }

  const handleOpenConvertDialog = (seed, type) => {
    setSelectedSeed(seed)
    setConvertType(type)
    setConvertQuantity(1)
    setConvertNotes('')
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
        notes: convertNotes
      })

      setOpenConvertDialog(false)
      refreshData(); // Verwende refreshData
    } catch (error) {
      console.error('Fehler bei der Konvertierung:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    }
  }

  const handleOpenDestroyDialog = (seed) => {
    setSelectedSeed(seed)
    setDestroyReason('')
    setDestroyQuantity(1)
    setOpenDestroyDialog(true)
  }

  const handleDestroy = async () => {
    try {
      if (selectedRows.length > 0) {
        // Mehrere ausgewählte Samen vernichten
        await api.post('/trackandtrace/seeds/bulk_destroy/', {
          ids: selectedRows,
          reason: destroyReason
        })
      } else if (selectedSeed) {
        // Einzelnen Samen vernichten (teilweise oder komplett)
        await api.post(`/trackandtrace/seeds/${selectedSeed.id}/destroy_seed/`, {
          reason: destroyReason,
          quantity: destroyQuantity // Menge hinzufügen
        })
      }

      setOpenDestroyDialog(false)
      setSelectedSeed(null)
      setSelectedRows([])
      refreshData(); // Verwende refreshData
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    }
  }
  
  const handleFilterApply = () => {
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherSeeds();
    } else if (tabValue === 2) {
      loadFloweringSeeds();
    }
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherSeeds();
    } else if (tabValue === 2) {
      loadFloweringSeeds();
    }
  }

  // Funktion, die die anzuzeigenden Seeds basierend auf dem Tab zurückgibt
  const getDisplayedSeeds = () => {
    if (tabValue === 0) {
      // Tab 0: Aktive Samen - nur Samen mit verbleibender Menge > 0
      return seeds.filter(seed => seed.remaining_quantity > 0);
    } else if (tabValue === 1) {
      // Tab 1: Zu Mutterpflanzen - verwende die separat geladenen Mutterpflanzen-Seeds
      return motherSeeds;
    } else if (tabValue === 2) {
      // Tab 2: Zu Blühpflanzen - verwende die separat geladenen Blühpflanzen-Seeds
      return floweringSeeds;
    } else {
      // Tab 3: Vernichtet - keine weitere Filterung nötig
      return seeds;
    }
  };

  const columns = [
    // Erste Checkbox entfernt, wir verwenden DataGrid's integrierte checkboxSelection
    { field: 'id', headerName: 'UUID', flex: 1.5 },
    { field: 'strain_name', headerName: 'Sortenname', flex: 1 },
    { field: 'quantity', headerName: 'Gesamtanzahl', flex: 0.7 },
    
    // Spalten je nach Tab
    ...(tabValue === 0 ? [{ field: 'remaining_quantity', headerName: 'Verfügbar', flex: 0.7 }] : []),
    ...(tabValue === 1 ? [{ field: 'mother_plant_count', headerName: 'Zu Mutterpflanzen', flex: 0.7 }] : []),
    ...(tabValue === 2 ? [{ field: 'flowering_plant_count', headerName: 'Zu Blühpflanzen', flex: 0.7 }] : []),
    ...(tabValue === 3 ? [
      { field: 'destroy_reason', headerName: 'Vernichtungsgrund', flex: 1 },
      { field: 'destroyed_at', headerName: 'Vernichtet am', flex: 0.7 }
    ] : []),
    
    { field: 'created_at', headerName: 'Erstellt am', flex: 1 },
    {
      field: 'actions',
      headerName: 'Aktionen',
      flex: 1,
      renderCell: (params) => (
        <Box>
          {tabValue === 0 && params.row.remaining_quantity > 0 && !params.row.is_destroyed && (
            <>
              <IconButton 
                size="small" 
                onClick={() => handleOpenConvertDialog(params.row, 'mother')}
                title="Zu Mutterpflanze konvertieren"
              >
                M
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleOpenConvertDialog(params.row, 'flower')}
                title="Zu Blühpflanze konvertieren"
              >
                B
              </IconButton>
            </>
          )}
          {!params.row.is_destroyed && (
            <>
              <IconButton 
                size="small" 
                onClick={() => {
                  setSelectedSeed(params.row)
                  setOpenForm(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDelete(params.row.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleOpenDestroyDialog(params.row)}
                title="Vernichten"
              >
                <LocalFireDepartmentIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {/* Neuer Abschnitt für vernichtete Samen */}
          {params.row.is_destroyed && (
            <IconButton 
              size="small" 
              onClick={() => handleDelete(params.row.id)}
              title="Löschen und Menge zurückrechnen"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  // Die Daten, die in der aktuellen Tabelle angezeigt werden sollen
  const displayedSeeds = getDisplayedSeeds();

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
          
          {tabValue !== 3 && selectedRows.length > 0 && (
            <Button 
              variant="contained" 
              color="error"
              onClick={() => {
                setSelectedSeed(null)
                setOpenDestroyDialog(true)
              }}
              sx={{ mr: 2 }}
            >
              Ausgewählte vernichten
            </Button>
          )}
          {tabValue === 0 && (
            <Button 
              variant="contained" 
              onClick={() => {
                setSelectedSeed(null)
                setOpenForm(true)
              }}
            >
              Neuer Samen
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Filter-Bereich */}
      {showFilters && (
        <Paper sx={{ mb: 2, p: 2 }}>
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

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Samen-Tabs">
          <Tab label={`Aktive Samen (${activeSeedCount}/${totalActiveQuantity})`} />
          <Tab label={`Zu Mutterpflanzen (${motherBatchCount}/${motherPlantCount})`} />
          <Tab label={`Zu Blühpflanzen (${floweringBatchCount}/${floweringPlantCount})`} />
          <Tab label={`Vernichtet (${destroyedCount}/${totalDestroyedQuantity})`} />
        </Tabs>
      </Paper>

      <Box sx={{ width: '100%', height: 'calc(100vh - 250px)', minHeight: 400 }}>
        <DataGrid 
          rows={displayedSeeds} 
          columns={columns} 
          getRowId={(row) => row.id} 
          pagination
          paginationMode={tabValue === 1 || tabValue === 2 ? "client" : "server"}
          rowCount={tabValue === 1 || tabValue === 2 ? displayedSeeds.length : totalCount}
          page={currentPage - 1} // MUI DataGrid ist 0-indexiert
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 25]}
          loading={loading}
          checkboxSelection={tabValue !== 3}
          onRowSelectionModelChange={(newSelectionModel) => {
            // Stelle sicher, dass dies ein Array ist
            setSelectedRows(Array.isArray(newSelectionModel) ? newSelectionModel : []);
          }}
          // Verwende isRowSelectable, um die Auswahl auf nicht vernichtete Einträge zu beschränken
          isRowSelectable={(params) => !params.row.is_destroyed}
          sx={{ 
            width: '100%', 
            height: '100%',
            '& .MuiDataGrid-main': { width: '100%' },
            '& .MuiDataGrid-virtualScroller': { width: '100%' },
            '& .MuiDataGrid-footerContainer': { width: '100%' },
            '& .MuiDataGrid-columnHeaders': { width: '100%' }
          }}
          autoHeight={false}
        />
      </Box>

      <SeedPurchaseForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setSelectedSeed(null)
        }}
        onSuccess={() => {
          setOpenForm(false)
          setSelectedSeed(null)
          refreshData(); // Verwende refreshData
        }}
        initialData={selectedSeed || {}}
      />

      {/* Dialog zur Konvertierung */}
      <Dialog open={openConvertDialog} onClose={() => setOpenConvertDialog(false)}>
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
            margin="dense"
            value={convertQuantity}
            onChange={(e) => setConvertQuantity(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: selectedSeed?.remaining_quantity || 1 }}
          />
          <TextField
            label="Notizen"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={convertNotes}
            onChange={(e) => setConvertNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConvertDialog(false)}>Abbrechen</Button>
          <Button onClick={handleConvert} variant="contained">Konvertieren</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zur Vernichtung */}
      <Dialog open={openDestroyDialog} onClose={() => setOpenDestroyDialog(false)}>
        <DialogTitle>
          {selectedRows.length > 0 
            ? `${selectedRows.length} ausgewählte Samen vernichten` 
            : 'Samen vernichten'}
        </DialogTitle>
        <DialogContent>
          {selectedSeed && !selectedRows.length && tabValue === 0 && (
            <>
              <Typography variant="body2" gutterBottom>
                Verfügbare Samen: {selectedSeed?.remaining_quantity || 0}
              </Typography>
              <TextField
                label="Anzahl zu vernichtender Samen"
                type="number"
                fullWidth
                margin="dense"
                value={destroyQuantity}
                onChange={(e) => setDestroyQuantity(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: selectedSeed?.remaining_quantity || 1 }}
              />
            </>
          )}
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