// frontend/src/apps/trackandtrace/pages/LabTesting/LabTestingPage.jsx
import { useState, useEffect } from 'react'
import { Box, Typography, Fade, Snackbar, Alert, alpha, Button } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import ScienceIcon from '@mui/icons-material/Science'
import FilterListIcon from '@mui/icons-material/FilterList'
import api from '@/utils/api'

// Gemeinsame Komponenten
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'

// Dialog-Komponenten
import DestroyDialog from '@/components/dialogs/DestroyDialog'
import ImageUploadModal from '../../components/ImageUploadModal'
import UpdateLabResultsDialog from '@/components/dialogs/UpdateLabResultsDialog'
import EnhancedConvertToPackagingDialog from '@/components/dialogs/ConvertToPackagingDialog'

// Spezifische Komponenten
import LabTestingTable from './LabTestingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function LabTestingPage() {
  const [labTestingBatches, setLabTestingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedLabTestingId, setExpandedLabTestingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedLabTesting, setSelectedLabTesting] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Dialoge für Laborergebnisse und Konvertierung
  const [openUpdateLabResultsDialog, setOpenUpdateLabResultsDialog] = useState(false)
  const [openConvertToPackagingDialog, setOpenConvertToPackagingDialog] = useState(false)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingWeight, setPendingWeight] = useState(0)
  const [passedCount, setPassedCount] = useState(0)
  const [passedWeight, setPassedWeight] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [failedWeight, setFailedWeight] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedWeight, setDestroyedWeight] = useState(0)
  
  // Mitglieder und Räume
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  const [rooms, setRooms] = useState([])

  // States für Image Modal
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

  // Zusätzliche Felder für LabTesting definieren
  const labTestingAdditionalFields = [
    {
      name: 'test_stage',
      label: 'Test-Stadium',
      type: 'select',
      options: [
        { value: '', label: 'Kein Stadium' },
        { value: 'sample_prep', label: 'Probenvorbereitung' },
        { value: 'testing', label: 'Während des Tests' },
        { value: 'results', label: 'Testergebnisse' },
        { value: 'microscopy', label: 'Mikroskopie' },
        { value: 'chromatography', label: 'Chromatographie' }
      ]
    },
    {
      name: 'test_type',
      label: 'Test-Typ',
      type: 'select',
      options: [
        { value: '', label: 'Kein Test-Typ' },
        { value: 'cannabinoid', label: 'Cannabinoid-Profil' },
        { value: 'terpene', label: 'Terpen-Analyse' },
        { value: 'microbial', label: 'Mikrobiologie' },
        { value: 'pesticide', label: 'Pestizid-Screening' },
        { value: 'heavy_metal', label: 'Schwermetalle' },
        { value: 'visual', label: 'Visuelle Inspektion' }
      ]
    }
  ]

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/labtesting/counts/');
      
      console.log("ZÄHLER API-ANTWORT (LABORKONTROLLE):", res.data);
      
      setPendingCount(res.data.pending_count || 0);
      setPendingWeight(res.data.total_pending_weight || 0);
      setPassedCount(res.data.passed_count || 0);
      setPassedWeight(res.data.total_passed_weight || 0);
      setFailedCount(res.data.failed_count || 0);
      setFailedWeight(res.data.total_failed_weight || 0);
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedWeight(res.data.total_destroyed_weight || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Laborkontroll-Zähler:', error);
    }
  };

  const loadLabTestingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/labtesting/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (productTypeFilter) url += `&product_type=${productTypeFilter}`;
      
      if (tabValue === 0) {
        url += '&status=pending&destroyed=false';
      } else if (tabValue === 1) {
        url += '&status=passed&destroyed=false';
      } else if (tabValue === 2) {
        url += '&status=failed&destroyed=false';
      } else if (tabValue === 3) {
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Laborkontrollen:', res.data);
      
      setLabTestingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Laborkontrollen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Laborkontrollen: ' + (error.response?.data?.error || error.message), 
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
      
      const formattedMembers = (response.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
    } finally {
      setLoadingOptions(false)
    }
  };
  
  const loadRooms = async () => {
    setLoadingOptions(true);
    try {
      const response = await api.get('rooms/')
      setRooms(response.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Räume:', error)
    } finally {
      setLoadingOptions(false)
    }
  };

  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showLabTestingSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Laborkontrolle wurde erfolgreich erstellt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showLabTestingSuccess');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/labtesting/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&status=pending&destroyed=false';
      } else if (tabValue === 1) {
        url += '&status=passed&destroyed=false';
      } else if (tabValue === 2) {
        url += '&status=failed&destroyed=false';
      } else if (tabValue === 3) {
        url += '&destroyed=true';
      }
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      if (productTypeFilter) url += `&product_type=${productTypeFilter}`;
      
      console.log("Sende API-Anfrage:", url);
      setLoading(true);
      
      api.get(url)
        .then(res => {
          console.log('Geladene Laborkontrollen mit neuer pageSize:', res.data);
          setLabTestingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Laborkontrollen:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Laborkontrollen: ' + (error.response?.data?.error || error.message), 
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
    loadLabTestingBatches();
    loadTabCounts();
    loadMembers();
    loadRooms();
    checkForConversionSuccess();
  }, []);
  
  useEffect(() => {
    const counterInterval = setInterval(() => {
      loadTabCounts();
    }, 3000);
    
    return () => clearInterval(counterInterval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedLabTestingId('');
    loadLabTestingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedLabTestingId('')
  }

  const handleAccordionChange = (labTestingId) => {
    if (expandedLabTestingId === labTestingId) {
      setExpandedLabTestingId('')
    } else {
      setExpandedLabTestingId(labTestingId)
    }
  }

  const handlePageChange = (event, page) => {
    loadLabTestingBatches(page)
  }

  const handleOpenDestroyDialog = (labTesting) => {
    setSelectedLabTesting(labTesting);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };
  
  const handleOpenUpdateLabResultsDialog = (labTesting) => {
    setSelectedLabTesting(labTesting);
    setOpenUpdateLabResultsDialog(true);
  };
  
  const handleOpenConvertToPackagingDialog = (labTesting) => {
    setSelectedLabTesting(labTesting);
    setOpenConvertToPackagingDialog(true);
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
    loadLabTestingBatches(currentPage)
    loadTabCounts()
  }
  
  const handleUpdateLabResults = async (formData) => {
    try {
      if (selectedLabTesting) {
        await api.post(`/trackandtrace/labtesting/${selectedLabTesting.id}/update_lab_results/`, formData);
        
        setOpenUpdateLabResultsDialog(false);
        setSelectedLabTesting(null);
        
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        setGlobalSnackbar({
          open: true,
          message: 'Laborergebnisse wurden erfolgreich aktualisiert!',
          severity: 'success',
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Fehler bei der Aktualisierung der Laborergebnisse:', error);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist bei der Aktualisierung aufgetreten',
        severity: 'error',
        duration: 6000
      })
    }
  };
  
  const handleConvertToPackaging = async (formData, rfidMemberId = null) => {
    try {
      if (selectedLabTesting) {
        if (rfidMemberId) {
          formData.member_id = rfidMemberId;
        }
        
        const response = await api.post(`/trackandtrace/labtesting/${selectedLabTesting.id}/convert_to_packaging/`, formData);
        
        setOpenConvertToPackagingDialog(false);
        setSelectedLabTesting(null);
        
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        const createdCount = response.data.created_count || 1;
        setGlobalSnackbar({
          open: true,
          message: `${createdCount} Verpackung${createdCount > 1 ? 'en wurden' : ' wurde'} erfolgreich erstellt!`,
          severity: 'success',
          duration: 10000
        });
        
        localStorage.setItem('showPackagingSuccess', 'true');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Verpackung:', error);
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
      if (selectedLabTesting) {
        await api.post(`/trackandtrace/labtesting/${selectedLabTesting.id}/destroy_labtesting/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedLabTesting(null);
        
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Laborkontrolle erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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

  const handleFilterApply = () => {
    loadLabTestingBatches(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadLabTestingBatches(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mx: 0.3, fontSize: 16, color: 'info.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>IN BEARBEITUNG</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${pendingCount})`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${pendingWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mx: 0.3, fontSize: 16, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FREIGEGEBEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${passedCount})`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${passedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mx: 0.3, fontSize: 16, color: 'warning.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NICHT BESTANDEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${failedCount})`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${failedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTET</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <SpeedIcon sx={{ mx: 0.3, fontSize: 16, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedWeight.toLocaleString('de-DE')}g)`}</Typography>
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
          Track & Trace Verwaltung: Step 10 - (Laborkontrolle)
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
          color={tabValue === 0 ? 'info' : (tabValue === 1 ? 'success' : (tabValue === 2 ? 'warning' : 'error'))}
          ariaLabel="Laborkontroll-Tabs"
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
              <LabTestingTable 
                tabValue={0}
                data={labTestingBatches}
                expandedLabTestingId={expandedLabTestingId}
                onExpandLabTesting={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenUpdateLabResultsDialog={handleOpenUpdateLabResultsDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                productTypeFilter={productTypeFilter}
                setProductTypeFilter={setProductTypeFilter}
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
              <LabTestingTable 
                tabValue={1}
                data={labTestingBatches}
                expandedLabTestingId={expandedLabTestingId}
                onExpandLabTesting={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertToPackagingDialog={handleOpenConvertToPackagingDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                productTypeFilter={productTypeFilter}
                setProductTypeFilter={setProductTypeFilter}
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
              <LabTestingTable 
                tabValue={2}
                data={labTestingBatches}
                expandedLabTestingId={expandedLabTestingId}
                onExpandLabTesting={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenUpdateLabResultsDialog={handleOpenUpdateLabResultsDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                productTypeFilter={productTypeFilter}
                setProductTypeFilter={setProductTypeFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
            
            <AnimatedTabPanel 
              value={tabValue} 
              index={3} 
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
              <LabTestingTable 
                tabValue={3}
                data={labTestingBatches}
                expandedLabTestingId={expandedLabTestingId}
                onExpandLabTesting={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenImageModal={handleOpenImageModal}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={pageSizeOptions}
                totalCount={totalCount}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                monthFilter={monthFilter}
                setMonthFilter={setMonthFilter}
                dayFilter={dayFilter}
                setDayFilter={setDayFilter}
                productTypeFilter={productTypeFilter}
                setProductTypeFilter={setProductTypeFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
          </Box>
        )}
      </Box>

      {/* Vernichtungsdialog */}
      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={`Laborkontrolle ${selectedLabTesting?.batch_number || ''} vernichten`}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      {/* Laborergebnisse-Dialog */}
      <UpdateLabResultsDialog
        open={openUpdateLabResultsDialog}
        onClose={() => setOpenUpdateLabResultsDialog(false)}
        onUpdateLabResults={handleUpdateLabResults}
        labTesting={selectedLabTesting}
        rooms={rooms}
      />
      
      {/* Konvertierung zu Verpackung - Erweiterte Version */}
      <EnhancedConvertToPackagingDialog
        open={openConvertToPackagingDialog}
        onClose={() => setOpenConvertToPackagingDialog(false)}
        onConvert={handleConvertToPackaging}
        labTesting={selectedLabTesting}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
      />

      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="lab-testing-batch"
        productId={selectedBatchForImages?.id}
        productName={`${selectedBatchForImages?.batch_number} - ${selectedBatchForImages?.source_strain || 'Laborkontrolle'}`}
        onImagesUpdated={refreshData}
        additionalFields={labTestingAdditionalFields}
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