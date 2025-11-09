// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantPage.jsx
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
import CreateCuttingDialog from '@/components/dialogs/CreateCuttingDialog'
import RatingDialog from '@/components/dialogs/RatingDialog'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import MotherPlantTable from './components/MotherPlantTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function MotherPlantPage() {
  const [motherBatches, setMotherBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [destroyedBatchPlants, setDestroyedBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
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
  
  // States für Rating Dialog
  const [openRatingDialog, setOpenRatingDialog] = useState(false)
  const [selectedBatchForRating, setSelectedBatchForRating] = useState(null)
  const [selectedPlantForRating, setSelectedPlantForRating] = useState(null)
  
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
  
  // Neu: State für Stecklings-Chargen hinzufügen
  const [cuttingBatches, setCuttingBatches] = useState([])
  const [cuttingBatchCount, setCuttingBatchCount] = useState(0)
  const [cuttingCount, setCuttingCount] = useState(0)
  
  // Mitglieder für Vernichtungen und Stecklinge
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Räume für Stecklinge
  const [rooms, setRooms] = useState([])
  
  // State für die Stecklinge-Erstellung
  const [openCreateCuttingDialog, setOpenCreateCuttingDialog] = useState(false)
  const [cuttingQuantity, setCuttingQuantity] = useState(1)
  const [cuttingNotes, setCuttingNotes] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedMotherPlant, setSelectedMotherPlant] = useState(null)
  
  // States für Image Upload Modal
  const [openImageModal, setOpenImageModal] = useState(false)
  const [selectedBatchForImages, setSelectedBatchForImages] = useState(null)
  
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

  // Handler für Rating Dialog
  const handleOpenRatingDialog = (batch, plant = null) => {
    setSelectedBatchForRating(batch)
    setSelectedPlantForRating(plant)
    setOpenRatingDialog(true)
  }

  const handleCloseRatingDialog = () => {
    setOpenRatingDialog(false)
    setSelectedBatchForRating(null)
    setSelectedPlantForRating(null)
    refreshData()
  }

  // Neue Funktion zum automatischen Laden der Plant-Daten für alle sichtbaren Batches
  const loadPlantsForVisibleBatches = async (batches) => {
    const loadPromises = batches.map(async (batch) => {
      if (!batchPlants[batch.id]) {
        try {
          const res = await api.get(`/trackandtrace/motherbatches/${batch.id}/plants/?page=1&destroyed=false`);
          
          const formattedPlants = (res.data.results || []).map(plant => ({
            ...plant,
            notes: plant.notes || '-',
            destroy_reason: plant.destroy_reason || '-',
            destroyed_by: plant.destroyed_by ? {
              ...plant.destroyed_by,
              display_name: plant.destroyed_by.display_name || 
                            `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
            } : null
          }));
          
          return { batchId: batch.id, plants: formattedPlants };
        } catch (error) {
          console.error(`Fehler beim Laden der Pflanzen für Batch ${batch.id}:`, error);
          return { batchId: batch.id, plants: [] };
        }
      }
      return null;
    });
    
    const results = await Promise.all(loadPromises);
    
    setBatchPlants(prev => {
      const newData = { ...prev };
      results.forEach(result => {
        if (result && result.plants) {
          newData[result.batchId] = result.plants;
        }
      });
      return newData;
    });
    
    return results.filter(r => r !== null);
  };

  // Neue Funktion zum Laden der Rating-Counts für alle sichtbaren Batches
  const loadRatingCountsForBatches = async (batches, plantData) => {
    const plantToBatchMap = {};
    
    if (plantData) {
      plantData.forEach(({ batchId, plants }) => {
        if (plants && plants.length > 0) {
          plantToBatchMap[plants[0].id] = batchId;
        }
      });
    } else {
      batches.forEach(batch => {
        const plants = batchPlants[batch.id];
        if (plants && plants.length > 0) {
          plantToBatchMap[plants[0].id] = batch.id;
        }
      });
    }
    
    const plantIds = Object.keys(plantToBatchMap);
    if (plantIds.length === 0) {
      console.log('Keine Plant-IDs gefunden, überspringe Rating-Count-Laden');
      return;
    }
    
    console.log(`Lade Rating-Counts für ${plantIds.length} Pflanzen...`);
    
    const countPromises = plantIds.map(async (plantId) => {
      try {
        const response = await api.get(`/trackandtrace/motherplant-ratings/?mother_plant_id=${plantId}`);
        const ratings = response.data.results || [];
        
        let avgRating = null;
        if (ratings.length > 0) {
          avgRating = (ratings.reduce((sum, r) => {
            const score = r.overall_score || (
              (r.overall_health + r.growth_structure + r.regeneration_ability + 
               r.regrowth_speed_rating + r.cutting_quality) / 5
            );
            return sum + score;
          }, 0) / ratings.length).toFixed(1);
        }
        
        return { 
          plantId, 
          batchId: plantToBatchMap[plantId], 
          count: ratings.length,
          avgRating: avgRating
        };
      } catch (error) {
        console.error(`Fehler beim Laden der Ratings für Plant ${plantId}:`, error);
        return { plantId, batchId: plantToBatchMap[plantId], count: 0, avgRating: null };
      }
    });
    
    const results = await Promise.all(countPromises);
    
    console.log('Rating-Counts geladen:', results);
    
    setMotherBatches(prevBatches => {
      return prevBatches.map(batch => {
        const result = results.find(r => r.batchId === batch.id);
        if (result) {
          return {
            ...batch,
            rating_count: result.count,
            average_batch_rating: batch.average_batch_rating || result.avgRating
          };
        }
        return batch;
      });
    });
  };

  const loadMotherBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/motherbatches/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 2) {
        url += '&has_destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Mutterpflanzen-Batches:', res.data);
      
      setMotherBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
      
      if (tabValue === 0 && res.data.results && res.data.results.length > 0) {
        const plantData = await loadPlantsForVisibleBatches(res.data.results);
        await loadRatingCountsForBatches(res.data.results, plantData);
      }
      
      if (res.data.counts) {
        setActivePlantsCount(res.data.counts.active_count || 0);
        setDestroyedPlantsCount(res.data.counts.destroyed_count || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mutterpflanzen-Chargen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Mutterpflanzen: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCuttingBatches = async (page = 1) => {
    if (tabValue !== 1) return;
    
    setLoading(true);
    try {
      let url = `/trackandtrace/cuttingbatches/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Stecklings-Batches:', res.data);
      
      setCuttingBatches(res.data.results || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Stecklings-Batches:', error);
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Stecklings-Batches: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoading(false);
    }
  };
  
  const loadAllCounts = async () => {
    try {
      const activeRes = await api.get('/trackandtrace/motherbatches/counts/?type=active');
      setActiveBatchesCount(activeRes.data.batches_count || 0);
      setActivePlantsCount(activeRes.data.plants_count || 0);
      
      const destroyedRes = await api.get('/trackandtrace/motherbatches/counts/?type=destroyed');
      setDestroyedBatchesCount(destroyedRes.data.batches_count || 0);
      setDestroyedPlantsCount(destroyedRes.data.plants_count || 0);
      
      const cuttingRes = await api.get('/trackandtrace/motherbatches/counts/?type=cutting');
      setCuttingBatchCount(cuttingRes.data.batch_count || 0);
      setCuttingCount(cuttingRes.data.cutting_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true);
    try {
      const membersRes = await api.get('members/')
      console.log('Mitglieder geladen:', membersRes.data)
      
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      const roomsRes = await api.get('rooms/')
      console.log('Räume geladen:', roomsRes.data)
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder und Räume:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Mitglieder und Räume: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoadingOptions(false)
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

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      if (tabValue === 0 || tabValue === 2) {
        let url = `/trackandtrace/motherbatches/?page=1&page_size=${newPageSize}`;
        
        if (tabValue === 0) {
          url += '&has_active=true';
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
            console.log('Geladene Mutterpflanzen mit neuer pageSize:', res.data);
            setMotherBatches(res.data.results || []);
            
            const total = res.data.count || 0;
            setTotalCount(total);
            const pages = Math.ceil(total / newPageSize);
            setTotalPages(pages);
          })
          .catch(error => {
            console.error('Fehler beim Laden der Mutterpflanzen:', error);
            setGlobalSnackbar({
              open: true, 
              message: 'Fehler beim Laden der Mutterpflanzen: ' + (error.response?.data?.error || error.message), 
              severity: 'error',
              duration: 6000
            })
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (tabValue === 1) {
        let url = `/trackandtrace/cuttingbatches/?page=1&page_size=${newPageSize}`;
        
        if (yearFilter) url += `&year=${yearFilter}`;
        if (monthFilter) url += `&month=${monthFilter}`;
        if (dayFilter) url += `&day=${dayFilter}`;
        
        console.log("Sende API-Anfrage:", url);
        setLoading(true);
        
        api.get(url)
          .then(res => {
            console.log('Geladene Stecklings-Batches mit neuer pageSize:', res.data);
            setCuttingBatches(res.data.results || []);
            setTotalCount(res.data.count || 0);
            const pages = Math.ceil((res.data.count || 0) / newPageSize);
            setTotalPages(pages);
          })
          .catch(error => {
            console.error('Fehler beim Laden der Stecklings-Batches:', error);
            setGlobalSnackbar({
              open: true, 
              message: 'Fehler beim Laden der Stecklings-Batches: ' + (error.response?.data?.error || error.message), 
              severity: 'error',
              duration: 6000
            })
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, 0);
  };

  useEffect(() => {
    loadMotherBatches()
    loadAllCounts()
    loadMembersAndRooms()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
    setExpandedBatchId('');
    setBatchPlants({});
    setDestroyedBatchPlants({});
    setSelectedPlants({});
    
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(1);
    } else if (tabValue === 1) {
      loadCuttingBatches(1);
    }
    
    loadAllCounts();
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedBatchId('')
    setBatchPlants({})
    setDestroyedBatchPlants({})
    setSelectedPlants({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      if (tabValue === 0) {
        loadPlantsForBatch(batchId, 1)
      } else if (tabValue === 2) {
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Pflanzen für Batch:', res.data);
      
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
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
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
      
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
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

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(page);
    } else if (tabValue === 1) {
      loadCuttingBatches(page);
    }
  };

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
  }

  const refreshData = () => {
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(currentPage);
    } else if (tabValue === 1) {
      loadCuttingBatches(currentPage);
    }
    
    if (expandedBatchId) {
      if (tabValue === 0) {
        loadPlantsForBatch(expandedBatchId, plantsCurrentPage[expandedBatchId] || 1);
      } else if (tabValue === 2) {
        loadDestroyedPlantsForBatch(expandedBatchId, destroyedPlantsCurrentPage[expandedBatchId] || 1);
      }
    }
    
    loadAllCounts();
  };

  const getDisplayedData = () => {
    if (tabValue === 0 || tabValue === 2) {
      return motherBatches;
    } else if (tabValue === 1) {
      return cuttingBatches;
    }
    return [];
  };

  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleOpenCreateCuttingDialog = (batch, plant = null) => {
    setSelectedBatch(batch);
    setSelectedMotherPlant(plant);
    setCuttingQuantity(1);
    setCuttingNotes('');
    setSelectedMemberId('');
    setSelectedRoomId('');
    setOpenCreateCuttingDialog(true);
  };

  const handleCreateCuttings = async (rfidMemberId = null) => {
    try {
      if (!selectedBatch) return;

      const plantId = selectedMotherPlant ? selectedMotherPlant.id : null;
      
      const endpoint = selectedMotherPlant 
        ? `/trackandtrace/motherplants/${plantId}/create_cuttings/` 
        : `/trackandtrace/motherbatches/${selectedBatch.id}/create_cuttings/`;

      console.log("Sende Anfrage an:", endpoint);

      await api.post(endpoint, {
        quantity: cuttingQuantity,
        notes: cuttingNotes,
        member_id: rfidMemberId || selectedMemberId || null,
        room_id: selectedRoomId || null
      });

      setOpenCreateCuttingDialog(false);
      refreshData();
      
      const memberName = members.find(m => m.id === selectedMemberId)?.display_name || "Unbekannt"
      
      setGlobalSnackbar({
        open: true,
        message: `Stecklinge erfolgreich erstellt - Autorisiert durch: ${memberName}`,
        severity: 'success',
        duration: 10000
      })
    } catch (error) {
      console.error('Fehler beim Erstellen der Stecklinge:', error);
      console.error('Details:', error.response?.data || error.message);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist beim Erstellen der Stecklinge aufgetreten',
        severity: 'error',
        duration: 6000
      })
    }
  };

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
        
        setSelectedPlants(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        refreshData();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Mutterpflanzen erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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
      const batchPlants = prev[batchId] || [];
      
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
      let plantsToSelect = [];
      
      if (tabValue === 0) {
        plantsToSelect = batchPlants[batchId]?.map(plant => plant.id) || [];
      } else if (tabValue === 2) {
        plantsToSelect = destroyedBatchPlants[batchId]?.map(plant => plant.id) || [];
      }
      
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: plantsToSelect
      }))
    } else {
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    }
  }
  
  const handleFilterApply = () => {
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(1);
    } else if (tabValue === 1) {
      loadCuttingBatches(1);
    }
    
    loadAllCounts();
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(1);
    } else if (tabValue === 1) {
      loadCuttingBatches(1);
    }
    
    loadAllCounts();
  }

  const displayedData = getDisplayedData();

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            AKTIVE MUTTERPFLANZEN
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>
            {`(${activePlantsCount})`}
          </Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            MUTTERPFLANZEN
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>
            {`(${cuttingBatchCount})`}
          </Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            ZU STECKLINGE
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>
            {`(${cuttingCount})`}
          </Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            MUTTERPFLANZEN VERNICHTET
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>
            {`(${destroyedPlantsCount})`}
          </Typography>
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
          Track & Trace Verwaltung: Step 2 - (Mutterpflanzen)
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
          ariaLabel="Mutterpflanzen-Tabs"
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
              <MotherPlantTable 
                tabValue={0}
                data={displayedData}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenCreateCuttingDialog={handleOpenCreateCuttingDialog}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchPlants={batchPlants}
                destroyedBatchPlants={destroyedBatchPlants}
                plantsCurrentPage={plantsCurrentPage}
                plantsTotalPages={plantsTotalPages}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                onPlantsPageChange={handlePlantsPageChange}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                selectedPlants={selectedPlants}
                togglePlantSelection={togglePlantSelection}
                selectAllPlantsInBatch={selectAllPlantsInBatch}
                onOpenImageModal={handleOpenImageModal}
                onOpenRatingDialog={handleOpenRatingDialog}
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
              <MotherPlantTable 
                tabValue={1}
                data={displayedData}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenCreateCuttingDialog={handleOpenCreateCuttingDialog}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchPlants={batchPlants}
                destroyedBatchPlants={destroyedBatchPlants}
                plantsCurrentPage={plantsCurrentPage}
                plantsTotalPages={plantsTotalPages}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                onPlantsPageChange={handlePlantsPageChange}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                selectedPlants={selectedPlants}
                togglePlantSelection={togglePlantSelection}
                selectAllPlantsInBatch={selectAllPlantsInBatch}
                onOpenImageModal={handleOpenImageModal}
                onOpenRatingDialog={handleOpenRatingDialog}
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
              <MotherPlantTable 
                tabValue={2}
                data={displayedData}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenCreateCuttingDialog={handleOpenCreateCuttingDialog}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchPlants={batchPlants}
                destroyedBatchPlants={destroyedBatchPlants}
                plantsCurrentPage={plantsCurrentPage}
                plantsTotalPages={plantsTotalPages}
                destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
                destroyedPlantsTotalPages={destroyedPlantsTotalPages}
                onPlantsPageChange={handlePlantsPageChange}
                onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
                selectedPlants={selectedPlants}
                togglePlantSelection={togglePlantSelection}
                selectAllPlantsInBatch={selectAllPlantsInBatch}
                onOpenImageModal={handleOpenImageModal}
                onOpenRatingDialog={handleOpenRatingDialog}
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
              ? `${selectedPlants[selectedBatch?.id].length} Mutterpflanzen vernichten` 
              : 'Mutterpflanze vernichten'}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>

      <Fade in={openCreateCuttingDialog} timeout={500}>
        <div style={{ display: openCreateCuttingDialog ? 'block' : 'none' }}>
          <CreateCuttingDialog 
            open={openCreateCuttingDialog}
            onClose={() => setOpenCreateCuttingDialog(false)}
            onCreateCuttings={handleCreateCuttings}
            quantity={cuttingQuantity}
            setQuantity={setCuttingQuantity}
            notes={cuttingNotes}
            setNotes={setCuttingNotes}
            members={members}
            selectedMemberId={selectedMemberId}
            setSelectedMemberId={setSelectedMemberId}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            motherBatch={selectedBatch}
            motherPlant={selectedMotherPlant}
          />
        </div>
      </Fade>

      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="mother-batch"
        productId={selectedBatchForImages?.id}
        productName={selectedBatchForImages?.batch_number}
        onImagesUpdated={refreshData}
        additionalFields={[
          {
            name: 'growth_stage',
            label: 'Wachstumsstadium',
            type: 'select',
            options: [
              { value: 'seedling', label: 'Sämling' },
              { value: 'vegetative', label: 'Vegetativ' },
              { value: 'pre_flowering', label: 'Vorblüte' },
              { value: 'mother', label: 'Mutterpflanze' }
            ]
          }
        ]}
      />

      <RatingDialog
        open={openRatingDialog}
        onClose={handleCloseRatingDialog}
        batch={selectedBatchForRating}
        plant={selectedPlantForRating}
        onRatingCreated={handleCloseRatingDialog}
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