// frontend/src/apps/trackandtrace/pages/BloomingCuttingPlant/BloomingCuttingPlantPage.jsx
import { useState, useEffect } from 'react'
import { Box, Typography, Fade, Snackbar, Alert, alpha, Button } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import FilterListIcon from '@mui/icons-material/FilterList'
import api from '@/utils/api'

// Gemeinsame Komponenten
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'

// Dialog-Komponenten
import DestroyDialog from '@/components/dialogs/DestroyDialog'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import BloomingCuttingPlantTable from './BloomingCuttingPlantTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function BloomingCuttingPlantPage() {
  const [bloomingBatches, setBloomingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [destroyedBatchPlants, setDestroyedBatchPlants] = useState({})
  const [harvestedBatchPlants, setHarvestedBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [plantsCurrentPage, setPlantsCurrentPage] = useState({})
  const [plantsTotalPages, setPlantsTotalPages] = useState({})
  const [destroyedPlantsCurrentPage, setDestroyedPlantsCurrentPage] = useState({})
  const [destroyedPlantsTotalPages, setDestroyedPlantsTotalPages] = useState({})
  const [harvestedPlantsCurrentPage, setHarvestedPlantsCurrentPage] = useState({})
  const [harvestedPlantsTotalPages, setHarvestedPlantsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedPlants, setSelectedPlants] = useState({})
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // States für Bilderverwaltung
  const [openImageModal, setOpenImageModal] = useState(false)
  const [selectedBatchForImages, setSelectedBatchForImages] = useState(null)
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeBatchesCount, setActiveBatchesCount] = useState(0)
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedBatchesCount, setDestroyedBatchesCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)
  const [harvestedBatchesCount, setHarvestedBatchesCount] = useState(0)
  const [harvestedPlantsCount, setHarvestedPlantsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

  // State für globale Snackbar
  const [globalSnackbar, setGlobalSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    duration: 6000
  })
  
  // Optionen für Page Size Dropdown
  const pageSizeOptions = [5, 10, 15, 25, 50]

  // Snackbar schließen
  const handleCloseGlobalSnackbar = () => {
    setGlobalSnackbar(prev => ({ ...prev, open: false }));
  };

  // Separate Funktion nur für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/bloomingcuttingbatches/counts/');
      
      setActiveBatchesCount(res.data.active_batches_count || 0);
      setActivePlantsCount(res.data.active_plants_count || 0);
      setDestroyedBatchesCount(res.data.destroyed_batches_count || 0);
      setDestroyedPlantsCount(res.data.destroyed_plants_count || 0);
      setHarvestedBatchesCount(res.data.harvested_batches_count || 0);
      setHarvestedPlantsCount(res.data.harvested_plants_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Tab-Zähler:', error);
    }
  };

  const loadBloomingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/bloomingcuttingbatches/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 1) {
        url += '&has_harvested=true';
      } else if (tabValue === 2) {
        url += '&has_destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Blühpflanzen-Batches:', res.data);
      
      setBloomingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Chargen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Blühpflanzen: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadMembers = async () => {
    setLoadingOptions(true);
    try {
      const response = await api.get('members/')
      console.log('Mitglieder für Vernichtungsdialog geladen:', response.data)
      
      const formattedMembers = (response.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      console.log('Formatierte Mitglieder:', formattedMembers)
      setMembers(formattedMembers)
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
      console.error('Details:', error.response?.data || error.message)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Mitglieder: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoadingOptions(false)
    }
  };

  const checkForConversionSuccess = () => {
    const lastConvertedBatchId = localStorage.getItem('lastConvertedBatchId');
    const showSuccess = localStorage.getItem('showConversionSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Konvertierung der Stecklinge zu Blühpflanzen erfolgreich durchgeführt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showConversionSuccess');
      
      if (lastConvertedBatchId) {
        console.log('Expandiere Batch nach Konvertierung:', lastConvertedBatchId);
        setExpandedBatchId(lastConvertedBatchId);
        
        setTimeout(() => {
          loadPlantsForBatch(lastConvertedBatchId, 1);
        }, 300);
        
        localStorage.removeItem('lastConvertedBatchId');
      }
    }
  };

  const handleOpenImageModal = (batch, event) => {
    if (event) event.stopPropagation()
    setSelectedBatchForImages(batch)
    setOpenImageModal(true)
  }

  const handleCloseImageModal = () => {
    setOpenImageModal(false)
    setSelectedBatchForImages(null)
    refreshData()
  }

  const refreshData = () => {
    loadBloomingBatches(currentPage)
    loadTabCounts()
    
    if (expandedBatchId) {
      if (tabValue === 0) {
        loadPlantsForBatch(expandedBatchId, plantsCurrentPage[expandedBatchId] || 1)
      } else if (tabValue === 2) {
        loadDestroyedPlantsForBatch(expandedBatchId, destroyedPlantsCurrentPage[expandedBatchId] || 1)
      } else if (tabValue === 1) {
        loadHarvestedPlantsForBatch(expandedBatchId, harvestedPlantsCurrentPage[expandedBatchId] || 1)
      }
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/bloomingcuttingbatches/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 1) {
        url += '&has_harvested=true';
      } else if (tabValue === 2) {
        url += '&has_destroyed=true';
      }
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      console.log("Sende API-Anfrage:", url);
      setLoading(true);
      
      api.get(url)
        .then(res => {
          console.log('Geladene Blühpflanzen mit neuer pageSize:', res.data);
          setBloomingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Blühpflanzen:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Blühpflanzen: ' + (error.response?.data?.error || error.message), 
            severity: 'error',
            duration: 6000
          })
        })
        .finally(() => {
          setLoading(false);
        });
    }, 0);
  };

  useEffect(() => {
    loadBloomingBatches();
    loadTabCounts();
    loadMembers();
    checkForConversionSuccess();
  }, []);
  
  useEffect(() => {
    const counterInterval = setInterval(() => {
      loadTabCounts();
    }, 2000);
    
    return () => clearInterval(counterInterval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedBatchId('');
    setBatchPlants({});
    setDestroyedBatchPlants({});
    setHarvestedBatchPlants({});
    
    loadBloomingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedBatchId('')
    setBatchPlants({})
    setDestroyedBatchPlants({})
    setHarvestedBatchPlants({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      if (tabValue === 0) {
        loadPlantsForBatch(batchId, 1)
      } else if (tabValue === 1) {
        loadHarvestedPlantsForBatch(batchId, 1)
      } else if (tabValue === 2) {
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading active plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Pflanzen für Batch:', res.data);
      
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
      
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      setPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5)
      setPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))

      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
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

  const loadDestroyedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
      console.log('Geladene vernichtete Pflanzen für Batch:', res.data);
      
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
      
      setDestroyedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5)
      setDestroyedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der vernichteten Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
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

  const loadHarvestedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading harvested plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&converted_to_harvest=true`)
      
      console.log('Geladene geerntete Pflanzen für Batch:', res.data);
      
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
      
      setHarvestedBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      setHarvestedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5)
      setHarvestedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der geernteten Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
      setHarvestedBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setHarvestedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setHarvestedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const handlePageChange = (event, page) => {
    loadBloomingBatches(page)
  }

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
  }

  const handleHarvestedPlantsPageChange = (batchId, event, page) => {
    loadHarvestedPlantsForBatch(batchId, page)
  }

  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedPlants[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/bloomingcuttingbatches/${selectedBatch.id}/destroy_plants/`, {
          plant_ids: selectedPlants[selectedBatch.id],
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedBatch(null);
        
        setSelectedPlants(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        if (tabValue === 0) {
          loadPlantsForBatch(selectedBatch.id, plantsCurrentPage[selectedBatch.id] || 1);
        } else {
          loadDestroyedPlantsForBatch(selectedBatch.id, destroyedPlantsCurrentPage[selectedBatch.id] || 1);
        }
        
        loadTabCounts();
        loadBloomingBatches(currentPage);
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Pflanzen erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
          severity: 'success',
          duration: 10000
        })
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist bei der Vernichtung aufgetreten',
        severity: 'error',
        duration: 6000
      })
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
    loadBloomingBatches(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadBloomingBatches(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE PFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activePlantsCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU ERNTE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${harvestedPlantsCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTET</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedPlantsCount})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header mit Titel */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Track & Trace Verwaltung: Step 4 - (Blühpflanzen aus Stecklingen)
        </Typography>
        
        {/* Filter-Button oben rechts */}
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

      {/* Tabs - direkt anschließend ohne Lücke */}
      <Box sx={{ flexShrink: 0 }}>
        <TabsHeader 
          tabValue={tabValue} 
          onTabChange={handleTabChange} 
          tabs={tabs}
          color="primary"
          ariaLabel="Blühpflanzen aus Stecklingen Tabs"
        />
      </Box>

      {/* Hauptinhalt mit Scroll */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <LoadingIndicator />
          </Box>
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <AnimatedTabPanel 
              value={tabValue} 
              index={0} 
              animationType={animSettings.type} 
              direction="right" 
              duration={animSettings.duration}
              sx={{ 
                height: '100%', 
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <BloomingCuttingPlantTable 
                tabValue={0}
                data={bloomingBatches}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchPlants={batchPlants}
                destroyedBatchPlants={destroyedBatchPlants}
                harvestedBatchPlants={harvestedBatchPlants}
                plantsCurrentPage={plantsCurrentPage}
                plantsTotalPages={plantsTotalPages}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                harvestedPlantsCurrentPage={harvestedPlantsCurrentPage}
                harvestedPlantsTotalPages={harvestedPlantsTotalPages}
                onPlantsPageChange={handlePlantsPageChange}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                onHarvestedPlantsPageChange={handleHarvestedPlantsPageChange}
                selectedPlants={selectedPlants}
                togglePlantSelection={togglePlantSelection}
                selectAllPlantsInBatch={selectAllPlantsInBatch}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
            
            <AnimatedTabPanel 
              value={tabValue} 
              index={1} 
              animationType={animSettings.type} 
              direction="up" 
              duration={animSettings.duration}
              sx={{ 
                height: '100%', 
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <BloomingCuttingPlantTable 
                tabValue={1}
                data={bloomingBatches}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchPlants={batchPlants}
                destroyedBatchPlants={destroyedBatchPlants}
                harvestedBatchPlants={harvestedBatchPlants}
                plantsCurrentPage={plantsCurrentPage}
                plantsTotalPages={plantsTotalPages}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                harvestedPlantsCurrentPage={harvestedPlantsCurrentPage}
                harvestedPlantsTotalPages={harvestedPlantsTotalPages}
                onPlantsPageChange={handlePlantsPageChange}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                onHarvestedPlantsPageChange={handleHarvestedPlantsPageChange}
                selectedPlants={selectedPlants}
                togglePlantSelection={togglePlantSelection}
                selectAllPlantsInBatch={selectAllPlantsInBatch}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
            
            <AnimatedTabPanel 
              value={tabValue} 
              index={2} 
              animationType={animSettings.type} 
              direction="left" 
              duration={animSettings.duration}
              sx={{ 
                height: '100%', 
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <BloomingCuttingPlantTable 
                tabValue={2}
                data={bloomingBatches}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                destroyedBatchPlants={destroyedBatchPlants}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
          </Box>
        )}
      </Box>

      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={selectedPlants[selectedBatch?.id]?.length > 1 
              ? `${selectedPlants[selectedBatch?.id].length} Blühpflanzen vernichten` 
              : 'Blühpflanze vernichten'}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>

      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="blooming-cutting-batch"
        productId={selectedBatchForImages?.id}
        productName={selectedBatchForImages?.batch_number}
        onImagesUpdated={refreshData}
      />
      
      {/* Globale Snackbar-Komponente */}
      <Snackbar 
        open={globalSnackbar.open} 
        autoHideDuration={globalSnackbar.duration || 6000} 
        onClose={handleCloseGlobalSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseGlobalSnackbar} 
          severity={globalSnackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {globalSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}