// frontend/src/apps/trackandtrace/pages/Cutting/CuttingPage.jsx
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
import ConvertToBlooming from '@/components/dialogs/ConvertToBlooming'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import CuttingTable from './CuttingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function CuttingPage() {
  const [cuttingBatches, setCuttingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchCuttings, setBatchCuttings] = useState({})
  const [destroyedBatchCuttings, setDestroyedBatchCuttings] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [cuttingsCurrentPage, setCuttingsCurrentPage] = useState({})
  const [cuttingsTotalPages, setCuttingsTotalPages] = useState({})
  const [destroyedCuttingsCurrentPage, setDestroyedCuttingsCurrentPage] = useState({})
  const [destroyedCuttingsTotalPages, setDestroyedCuttingsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedCuttings, setSelectedCuttings] = useState({})
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
  const [activeCuttingsCount, setActiveCuttingsCount] = useState(0)
  const [destroyedBatchesCount, setDestroyedBatchesCount] = useState(0)
  const [destroyedCuttingsCount, setDestroyedCuttingsCount] = useState(0)
  const [convertedBatchesCount, setConvertedBatchesCount] = useState(0)
  const [convertedCuttingsCount, setConvertedCuttingsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // States für den Konvertierungsdialog
  const [openConvertDialog, setOpenConvertDialog] = useState(false)
  const [selectedForConversion, setSelectedForConversion] = useState([])
  const [convertAllMode, setConvertAllMode] = useState(false)
  
  // Räume
  const [rooms, setRooms] = useState([])

  // Status für überführte Stecklinge
  const [convertedBatchCuttings, setConvertedBatchCuttings] = useState({})
  const [convertedCuttingsCurrentPage, setConvertedCuttingsCurrentPage] = useState({})
  const [convertedCuttingsTotalPages, setConvertedCuttingsTotalPages] = useState({})
  
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

  const loadCuttingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/cuttingbatches/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 1) {
        url += '&has_converted=true';
      } else if (tabValue === 2) {
        url += '&has_destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Stecklinge-Batches:', res.data);
      
      setCuttingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Stecklinge-Chargen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Stecklinge: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadAllCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/cuttingbatches/counts/?type=all');
      
      setActiveBatchesCount(res.data.active_batches_count || 0);
      setActiveCuttingsCount(res.data.active_count || 0);
      setDestroyedBatchesCount(res.data.destroyed_batches_count || 0);
      setDestroyedCuttingsCount(res.data.destroyed_count || 0);
      setConvertedBatchesCount(res.data.converted_batches_count || 0);
      setConvertedCuttingsCount(res.data.converted_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
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
  
  const loadRooms = async () => {
    try {
      const response = await api.get('rooms/');
      console.log('Räume geladen:', response.data);
      setRooms(response.data.results || []);
    } catch (error) {
      console.error('Fehler beim Laden der Räume:', error);
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Räume: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
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
    loadCuttingBatches(currentPage)
    loadAllCounts()
    
    if (expandedBatchId) {
      if (tabValue === 0) {
        loadCuttingsForBatch(expandedBatchId, cuttingsCurrentPage[expandedBatchId] || 1)
      } else if (tabValue === 2) {
        loadDestroyedCuttingsForBatch(expandedBatchId, destroyedCuttingsCurrentPage[expandedBatchId] || 1)
      } else if (tabValue === 1) {
        loadConvertedCuttingsForBatch(expandedBatchId, convertedCuttingsCurrentPage[expandedBatchId] || 1)
      }
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/cuttingbatches/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 1) {
        url += '&has_converted=true';
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
          console.log('Geladene Stecklinge mit neuer pageSize:', res.data);
          setCuttingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Stecklinge:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Stecklinge: ' + (error.response?.data?.error || error.message), 
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
    loadCuttingBatches()
    loadMembers()
    loadRooms()
    loadAllCounts()
  }, [])
  
  useEffect(() => {
    const counterInterval = setInterval(() => {
      loadAllCounts();
    }, 2000);
    
    return () => clearInterval(counterInterval);
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
    setExpandedBatchId('');
    setBatchCuttings({});
    setDestroyedBatchCuttings({});
    setConvertedBatchCuttings({});
    
    loadCuttingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedBatchId('')
    setBatchCuttings({})
    setDestroyedBatchCuttings({})
    setConvertedBatchCuttings({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      if (tabValue === 0) {
        loadCuttingsForBatch(batchId, 1)
      } else if (tabValue === 2) {
        loadDestroyedCuttingsForBatch(batchId, 1)
      } else if (tabValue === 1) {
        loadConvertedCuttingsForBatch(batchId, 1)
      }
    }
  }

  const loadCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading cuttings for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Stecklinge für Batch:', res.data);
      
      const formattedCuttings = (res.data.results || []).map(cutting => {
        console.log("Cutting batch number:", cutting.batch_number);
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }))
      
      setCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5)
      setCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))

      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Stecklinge:', error)
      console.error('Details:', error.response?.data || error.message)
      
      setBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
      setCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const loadDestroyedCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed cuttings for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&destroyed=true`)
      
      console.log('Geladene vernichtete Stecklinge für Batch:', res.data);
      
      const formattedCuttings = (res.data.results || []).map(cutting => {
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setDestroyedBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }))
      
      setDestroyedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5)
      setDestroyedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der vernichteten Stecklinge:', error)
      console.error('Details:', error.response?.data || error.message)
      
      setDestroyedBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
      setDestroyedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setDestroyedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const loadConvertedCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading converted cuttings for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&converted=true`);
      
      console.log('Geladene überführte Stecklinge für Batch:', res.data);
      
      const formattedCuttings = (res.data.results || []).map(cutting => {
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          converted_to: cutting.converted_to || null,
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setConvertedBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }));
      
      setConvertedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }));
      
      const total = res.data.count || 0;
      const pages = Math.ceil(total / 5);
      setConvertedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }));
    } catch (error) {
      console.error('Fehler beim Laden der überführten Stecklinge:', error);
      console.error('Details:', error.response?.data || error.message);
      
      setConvertedBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }));
      setConvertedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }));
      setConvertedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }));
    }
  };

  const handlePageChange = (event, page) => {
    loadCuttingBatches(page)
  }

  const handleCuttingsPageChange = (batchId, event, page) => {
    loadCuttingsForBatch(batchId, page)
  }

  const handleDestroyedCuttingsPageChange = (batchId, event, page) => {
    loadDestroyedCuttingsForBatch(batchId, page)
  }

  const handleConvertedCuttingsPageChange = (batchId, event, page) => {
    loadConvertedCuttingsForBatch(batchId, page);
  };

  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleOpenConvertDialog = (batch, selectedCuttings, convertAll = false) => {
    console.log("Opening convert dialog for batch:", batch);
    console.log("Selected cuttings:", selectedCuttings);
    console.log("Convert all mode:", convertAll);
    
    const validCuttings = Array.isArray(selectedCuttings) 
      ? selectedCuttings.filter(cutting => cutting && cutting.id)
      : [];
      
    setSelectedBatch(batch);
    setSelectedForConversion(validCuttings);
    setConvertAllMode(convertAll);
    setOpenConvertDialog(true);
  };
  
  const handleConvert = async (convertData, rfidMemberId = null) => {
    try {
      console.log("Converting cuttings with data:", convertData);
      
      const cleanedData = {
        ...convertData,
        member_id: rfidMemberId || convertData.member_id || null,
        cutting_ids: Array.isArray(convertData.cutting_ids)
          ? convertData.cutting_ids.filter(id => id !== null && id !== undefined)
          : []
      };
      
      console.log("Cleaned conversion data:", cleanedData);
      
      const response = await api.post(
        `/trackandtrace/cuttingbatches/${selectedBatch.id}/convert_to_blooming/`, 
        cleanedData
      );
      
      console.log("Conversion response:", response.data);
      
      setOpenConvertDialog(false);
      
      loadCuttingsForBatch(selectedBatch.id, cuttingsCurrentPage[selectedBatch.id] || 1);
      loadCuttingBatches(currentPage);
      
      setSelectedCuttings(prev => ({
        ...prev,
        [selectedBatch.id]: []
      }));
      
      const memberName = members.find(m => m.id === cleanedData.member_id)?.display_name || "Unbekannt"
      
      setGlobalSnackbar({
        open: true,
        message: `${convertData.quantity} Blühpflanzen wurden erfolgreich erstellt - Autorisiert durch: ${memberName}`,
        severity: 'success',
        duration: 10000
      })
      
      localStorage.setItem('lastConvertedBatchId', response.data.batch?.id || '');
      localStorage.setItem('showConversionSuccess', 'true');
      
      window.location.href = '/trace/bluehpflanzen-aus-stecklingen';
    } catch (error) {
      console.error('Fehler bei der Konvertierung:', error);
      console.error('Error details:', error.response?.data);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist bei der Konvertierung aufgetreten',
        severity: 'error',
        duration: 6000
      })
    }
  };

  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedCuttings[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/cuttingbatches/${selectedBatch.id}/destroy_cuttings/`, {
          cutting_ids: selectedCuttings[selectedBatch.id],
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedBatch(null);
        
        setSelectedCuttings(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        if (tabValue === 0) {
          loadCuttingsForBatch(selectedBatch.id, cuttingsCurrentPage[selectedBatch.id] || 1);
        } else if (tabValue === 2) {
          loadDestroyedCuttingsForBatch(selectedBatch.id, destroyedCuttingsCurrentPage[selectedBatch.id] || 1);
        } else if (tabValue === 1) {
          loadConvertedCuttingsForBatch(selectedBatch.id, convertedCuttingsCurrentPage[selectedBatch.id] || 1);
        }
        
        loadAllCounts();
        loadCuttingBatches(currentPage);
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Stecklinge erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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

  const toggleCuttingSelection = (batchId, cuttingId) => {
    setSelectedCuttings(prev => {
      const batchCuttings = prev[batchId] || []
      if (batchCuttings.includes(cuttingId)) {
        return {
          ...prev,
          [batchId]: batchCuttings.filter(id => id !== cuttingId)
        }
      } else {
        return {
          ...prev,
          [batchId]: [...batchCuttings, cuttingId]
        }
      }
    })
  }

  const selectAllCuttingsInBatch = (batchId, select) => {
    if (select) {
      const allCuttingIds = batchCuttings[batchId]?.map(cutting => cutting.id) || []
      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: allCuttingIds
      }))
    } else {
      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
    }
  }
  
  const handleFilterApply = () => {
    loadCuttingBatches(1)
    loadAllCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadCuttingBatches(1)
    loadAllCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE STECKLINGE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCuttingsCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${convertedBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>BLÜHPFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${convertedCuttingsCount})`}</Typography>
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
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCuttingsCount})`}</Typography>
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
          Track & Trace Verwaltung: Step 3 - (Stecklinge)
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
          ariaLabel="Stecklinge-Tabs"
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
              <CuttingTable 
                tabValue={0}
                data={cuttingBatches}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertDialog={handleOpenConvertDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchCuttings={batchCuttings}
                destroyedBatchCuttings={destroyedBatchCuttings}
                cuttingsCurrentPage={cuttingsCurrentPage}
                cuttingsTotalPages={cuttingsTotalPages}
                destroyedCuttingsCurrentPage={destroyedCuttingsCurrentPage}
                destroyedCuttingsTotalPages={destroyedCuttingsTotalPages}
                onCuttingsPageChange={handleCuttingsPageChange}
                onDestroyedCuttingsPageChange={handleDestroyedCuttingsPageChange}
                selectedCuttings={selectedCuttings}
                toggleCuttingSelection={toggleCuttingSelection}
                selectAllCuttingsInBatch={selectAllCuttingsInBatch}
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
              <CuttingTable 
                tabValue={1}
                data={cuttingBatches}
                expandedBatchId={expandedBatchId}
                onExpandBatch={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertDialog={handleOpenConvertDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                batchCuttings={batchCuttings}
                destroyedBatchCuttings={destroyedBatchCuttings}
                convertedBatchCuttings={convertedBatchCuttings}
                convertedCuttingsCurrentPage={convertedCuttingsCurrentPage}
                convertedCuttingsTotalPages={convertedCuttingsTotalPages}
                onConvertedCuttingsPageChange={handleConvertedCuttingsPageChange}
                cuttingsCurrentPage={cuttingsCurrentPage}
                cuttingsTotalPages={cuttingsTotalPages}
                destroyedCuttingsCurrentPage={destroyedCuttingsCurrentPage}
                destroyedCuttingsTotalPages={destroyedCuttingsTotalPages}
                onCuttingsPageChange={handleCuttingsPageChange}
                onDestroyedCuttingsPageChange={handleDestroyedCuttingsPageChange}
                selectedCuttings={selectedCuttings}
                toggleCuttingSelection={toggleCuttingSelection}
                selectAllCuttingsInBatch={selectAllCuttingsInBatch}
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
              <CuttingTable 
                tabValue={2}
                data={cuttingBatches}
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
                destroyedBatchCuttings={destroyedBatchCuttings}
                destroyedCuttingsCurrentPage={destroyedCuttingsCurrentPage}
                destroyedCuttingsTotalPages={destroyedCuttingsTotalPages}
                onDestroyedCuttingsPageChange={handleDestroyedCuttingsPageChange}
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
            title={selectedCuttings[selectedBatch?.id]?.length > 1 
              ? `${selectedCuttings[selectedBatch?.id].length} Stecklinge vernichten` 
              : 'Steckling vernichten'}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      <ConvertToBlooming
        open={openConvertDialog}
        onClose={() => setOpenConvertDialog(false)}
        onConvert={handleConvert}
        title={convertAllMode 
          ? `Alle Stecklinge zu Blühpflanzen umwandeln` 
          : `${selectedForConversion.length || 0} Stecklinge zu Blühpflanzen umwandeln`}
        cuttings={selectedForConversion}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
        convertAll={convertAllMode}
        batchActiveCount={selectedBatch?.active_cuttings_count || 0}
      />
      
      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="cutting-batch"
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