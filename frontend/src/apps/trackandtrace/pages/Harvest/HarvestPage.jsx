// frontend/src/apps/trackandtrace/pages/Harvest/HarvestPage.jsx
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
import ConvertToDryingDialog from '@/components/dialogs/ConvertToDryingDialog'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import HarvestTable from './HarvestTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function HarvestPage() {
  const navigate = useNavigate();
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedHarvestId, setExpandedHarvestId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedHarvest, setSelectedHarvest] = useState(null)
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
  const [activeWeight, setActiveWeight] = useState(0)
  const [driedCount, setDriedCount] = useState(0)
  const [driedWeight, setDriedWeight] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedWeight, setDestroyedWeight] = useState(0)
  
  // Mitglieder und Räume für Dialoge
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  const [rooms, setRooms] = useState([])
  
  // Zustände für Trocknungskonvertierung
  const [openDryingDialog, setOpenDryingDialog] = useState(false)
  const [harvestForDrying, setHarvestForDrying] = useState(null)

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

  // Zusätzliches Feld für harvest_stage definieren
  const harvestStageField = {
    name: 'harvest_stage',
    label: 'Ernte-Stadium',
    type: 'select',
    options: [
      { value: '', label: 'Kein Stadium' },
      { value: 'fresh', label: 'Frisch geerntet' },
      { value: 'trimmed', label: 'Getrimmt' },
      { value: 'packed', label: 'Verpackt für Trocknung' }
    ]
  }

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/harvests/counts/');
      
      console.log("ZÄHLER API-ANTWORT (ERNTE):", res.data);
      
      setActiveCount(res.data.active_count || 0);
      setActiveWeight(res.data.total_active_weight || 0);
      setDriedCount(res.data.dried_count || 0);
      setDriedWeight(res.data.total_dried_weight || 0);
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedWeight(res.data.total_destroyed_weight || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Ernte-Zähler:', error);
    }
  };

  const loadHarvests = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/harvests/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (tabValue === 0) {
        url += '&status=active';
      } else if (tabValue === 1) {
        url += '&status=dried';
      } else if (tabValue === 2) {
        url += '&status=destroyed';
      }
      
      const res = await api.get(url);
      console.log('Geladene Ernten:', res.data);
      
      setHarvests(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Ernten:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Ernten: ' + (error.response?.data?.error || error.message), 
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
    const showSuccess = localStorage.getItem('showHarvestSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Ernte wurde erfolgreich erstellt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showHarvestSuccess');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/harvests/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&status=active';
      } else if (tabValue === 1) {
        url += '&status=dried';
      } else if (tabValue === 2) {
        url += '&status=destroyed';
      }
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      console.log("Sende API-Anfrage:", url);
      setLoading(true);
      
      api.get(url)
        .then(res => {
          console.log('Geladene Ernten mit neuer pageSize:', res.data);
          setHarvests(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Ernten:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Ernten: ' + (error.response?.data?.error || error.message), 
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
    loadHarvests();
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
    setExpandedHarvestId('');
    loadHarvests(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedHarvestId('')
  }

  const handleAccordionChange = (harvestId) => {
    if (expandedHarvestId === harvestId) {
      setExpandedHarvestId('')
    } else {
      setExpandedHarvestId(harvestId)
    }
  }

  const handlePageChange = (event, page) => {
    loadHarvests(page)
  }

  const handleOpenDestroyDialog = (harvest) => {
    setSelectedHarvest(harvest);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleDestroy = async () => {
    try {
      if (selectedHarvest) {
        await api.post(`/trackandtrace/harvests/${selectedHarvest.id}/destroy_harvest/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedHarvest(null);
        
        loadHarvests(currentPage);
        loadTabCounts();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Ernte erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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
  
  const handleOpenDryingDialog = (harvest) => {
    setHarvestForDrying(harvest);
    setOpenDryingDialog(true);
  };
  
  const handleConvertToDrying = async (formData, rfidMemberId = null) => {
    try {
      const dataWithMemberId = {
        ...formData,
        member_id: rfidMemberId || formData.member_id || null
      };
      if (harvestForDrying) {
        const response = await api.post(`/trackandtrace/harvests/${harvestForDrying.id}/convert_to_drying/`, dataWithMemberId);
        console.log("API-Antwort:", response.data);
        
        setOpenDryingDialog(false);
        setHarvestForDrying(null);
        
        localStorage.setItem('showDryingSuccess', 'true');
        navigate('/trace/trocknung');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zu Trocknung:', error);
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
    loadHarvests(currentPage)
    loadTabCounts()
  }

  const handleFilterApply = () => {
    loadHarvests(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadHarvests(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE ERNTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU TROCKNUNG</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${driedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${driedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTETE ERNTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
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
          Track & Trace Verwaltung: Step 6 - (Ernte)
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
          color={tabValue === 0 ? 'success' : (tabValue === 1 ? 'primary' : 'error')}
          ariaLabel="Ernte-Tabs"
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
              <HarvestTable 
                tabValue={0}
                data={harvests}
                expandedHarvestId={expandedHarvestId}
                onExpandHarvest={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenDryingDialog={handleOpenDryingDialog}
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
              <HarvestTable 
                tabValue={1}
                data={harvests}
                expandedHarvestId={expandedHarvestId}
                onExpandHarvest={handleAccordionChange}
                onOpenDestroyDialog={null}
                onOpenDryingDialog={null}
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
              <HarvestTable 
                tabValue={2}
                data={harvests}
                expandedHarvestId={expandedHarvestId}
                onExpandHarvest={handleAccordionChange}
                onOpenDestroyDialog={null}
                onOpenDryingDialog={null}
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
            title={`Ernte ${selectedHarvest?.batch_number || ''} vernichten`}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      {/* Dialog für Trocknungskonvertierung */}
      <ConvertToDryingDialog
        open={openDryingDialog}
        onClose={() => setOpenDryingDialog(false)}
        onConvert={handleConvertToDrying}
        title="Ernte zu Trocknung konvertieren"
        sourceBatch={harvestForDrying}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
      />

      {/* ImageUploadModal */}
      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="harvest-batch"
        productId={selectedBatchForImages?.id}
        productName={selectedBatchForImages?.batch_number}
        onImagesUpdated={refreshData}
        additionalFields={[harvestStageField]}
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