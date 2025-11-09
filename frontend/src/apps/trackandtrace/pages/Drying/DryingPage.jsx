// frontend/src/apps/trackandtrace/pages/Drying/DryingPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import ConvertToProcessingDialog from '@/components/dialogs/ConvertToProcessingDialog'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import DryingTable from './DryingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function DryingPage() {
  const navigate = useNavigate();
  const [dryingBatches, setDryingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedDryingId, setExpandedDryingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedDrying, setSelectedDrying] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeCount, setActiveCount] = useState(0)
  const [activeInitialWeight, setActiveInitialWeight] = useState(0)
  const [activeFinalWeight, setActiveFinalWeight] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedWeight, setProcessedWeight] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedInitialWeight, setDestroyedInitialWeight] = useState(0)
  const [destroyedFinalWeight, setDestroyedFinalWeight] = useState(0)
  
  // Mitglieder und Räume für Dialoge
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  const [rooms, setRooms] = useState([])
  
  // Zustände für Verarbeitungskonvertierung
  const [openProcessingDialog, setOpenProcessingDialog] = useState(false)
  const [dryingForProcessing, setDryingForProcessing] = useState(null)
  
  // States für ImageUploadModal
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

  // Zusätzliches Feld für drying_stage definieren
  const dryingStageField = {
    name: 'drying_stage',
    label: 'Trocknungs-Stadium',
    type: 'select',
    options: [
      { value: '', label: 'Kein Stadium' },
      { value: 'wet', label: 'Feucht (Tag 1-3)' },
      { value: 'drying', label: 'Trocknend (Tag 4-7)' },
      { value: 'dry', label: 'Trocken (Tag 8+)' },
      { value: 'curing', label: 'Reifend' }
    ]
  }

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/drying/counts/');
      
      console.log("ZÄHLER API-ANTWORT (TROCKNUNG):", res.data);
      
      setActiveCount(res.data.active_count || 0);
      setActiveInitialWeight(res.data.total_active_initial_weight || 0);
      setActiveFinalWeight(res.data.total_active_final_weight || 0);
      setProcessedCount(res.data.processed_count || 0);
      setProcessedWeight(res.data.processed_weight || 0);
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedInitialWeight(res.data.total_destroyed_initial_weight || 0);
      setDestroyedFinalWeight(res.data.total_destroyed_final_weight || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Trocknungs-Zähler:', error);
    }
  };

  const loadDryingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/drying/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (tabValue === 0) {
        url += '&active=true';
      } else if (tabValue === 1) {
        url += '&processed=true';
      } else if (tabValue === 2) {
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Trocknungen:', res.data);
      
      setDryingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Trocknungen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Trocknungen: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true);
    try {
      const membersResponse = await api.get('members/')
      const formattedMembers = (membersResponse.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      const roomsResponse = await api.get('rooms/');
      setRooms(roomsResponse.data.results || []);
    } catch (error) {
      console.error('Fehler beim Laden der Optionen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Optionen: ' + (error.response?.data?.error || error.message), 
        severity: 'error',
        duration: 6000
      })
    } finally {
      setLoadingOptions(false)
    }
  };

  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showDryingSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Trocknung wurde erfolgreich erstellt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showDryingSuccess');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/drying/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&active=true';
      } else if (tabValue === 1) {
        url += '&processed=true';
      } else if (tabValue === 2) {
        url += '&destroyed=true';
      }
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      console.log("Sende API-Anfrage:", url);
      setLoading(true);
      
      api.get(url)
        .then(res => {
          console.log('Geladene Trocknungen mit neuer pageSize:', res.data);
          setDryingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Trocknungen:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Trocknungen: ' + (error.response?.data?.error || error.message), 
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
    loadDryingBatches();
    loadTabCounts();
    loadMembersAndRooms();
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
    setExpandedDryingId('');
    loadDryingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedDryingId('')
  }

  const handleAccordionChange = (dryingId) => {
    if (expandedDryingId === dryingId) {
      setExpandedDryingId('')
    } else {
      setExpandedDryingId(dryingId)
    }
  }

  const handlePageChange = (event, page) => {
    loadDryingBatches(page)
  }

  const handleOpenDestroyDialog = (drying) => {
    setSelectedDrying(drying);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleDestroy = async () => {
    try {
      if (selectedDrying) {
        await api.post(`/trackandtrace/drying/${selectedDrying.id}/destroy_drying/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedDrying(null);
        
        loadDryingBatches(currentPage);
        loadTabCounts();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Trocknung erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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
  
  const handleOpenProcessingDialog = (drying) => {
    setDryingForProcessing(drying);
    setOpenProcessingDialog(true);
  };
  
  const handleConvertToProcessing = async (formData, rfidMemberId = null) => {
    try {
      const dataWithMemberId = {
        ...formData,
        member_id: rfidMemberId || formData.member_id || null
      };
      if (dryingForProcessing) {
        const response = await api.post(`/trackandtrace/drying/${dryingForProcessing.id}/convert_to_processing/`, dataWithMemberId);
        console.log("API-Antwort:", response.data);
        
        setOpenProcessingDialog(false);
        setDryingForProcessing(null);
        
        localStorage.setItem('showProcessingSuccess', 'true');
        navigate('/trace/verarbeitung');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Verarbeitung:', error);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist bei der Konvertierung aufgetreten',
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
    loadDryingBatches(currentPage)
    loadTabCounts()
  }

  const handleFilterApply = () => {
    loadDryingBatches(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadDryingBatches(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE TROCKNUNGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRISCHGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeInitialWeight.toLocaleString('de-DE')}g)`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeFinalWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU VERARBEITUNG</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${processedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${processedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTETE TROCKNUNGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedFinalWeight.toLocaleString('de-DE')}g)`}</Typography>
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
          Track & Trace Verwaltung: Step 7 - (Trocknung)
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
          color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
          ariaLabel="Trocknungs-Tabs"
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
              <DryingTable 
                tabValue={0}
                data={dryingBatches}
                expandedDryingId={expandedDryingId}
                onExpandDrying={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenProcessingDialog={handleOpenProcessingDialog}
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
              <DryingTable 
                tabValue={1}
                data={dryingBatches}
                expandedDryingId={expandedDryingId}
                onExpandDrying={handleAccordionChange}
                onOpenDestroyDialog={null}
                onOpenProcessingDialog={null}
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
              <DryingTable 
                tabValue={2}
                data={dryingBatches}
                expandedDryingId={expandedDryingId}
                onExpandDrying={handleAccordionChange}
                onOpenDestroyDialog={null}
                onOpenProcessingDialog={null}
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
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onFilterApply={handleFilterApply}
                onFilterReset={handleFilterReset}
              />
            </AnimatedTabPanel>
          </Box>
        )}
      </Box>

      {/* Dialog für Vernichtung */}
      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={`Trocknung ${selectedDrying?.batch_number || ''} vernichten`}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      {/* Dialog für Verarbeitungskonvertierung */}
      <ConvertToProcessingDialog
        open={openProcessingDialog}
        onClose={() => setOpenProcessingDialog(false)}
        onConvert={handleConvertToProcessing}
        title="Trocknung zu Verarbeitung konvertieren"
        sourceBatch={dryingForProcessing}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
      />

      {/* ImageUploadModal */}
      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="drying-batch"
        productId={selectedBatchForImages?.id}
        productName={selectedBatchForImages?.batch_number}
        onImagesUpdated={refreshData}
        additionalFields={[dryingStageField]}
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