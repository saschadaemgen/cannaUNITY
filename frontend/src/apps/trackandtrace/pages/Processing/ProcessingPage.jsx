// frontend/src/apps/trackandtrace/pages/Processing/ProcessingPage.jsx
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
import ConvertToLabTestingDialog from '@/components/dialogs/ConvertToLabTestingDialog'
import ImageUploadModal from '../../components/ImageUploadModal'

// Spezifische Komponenten
import ProcessingTable from './components/ProcessingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function ProcessingPage() {
  const [processingBatches, setProcessingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedProcessingId, setExpandedProcessingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [openConvertToLabTestingDialog, setOpenConvertToLabTestingDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedProcessing, setSelectedProcessing] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeCount, setActiveCount] = useState(0)
  const [activeInputWeight, setActiveInputWeight] = useState(0)
  const [activeOutputWeight, setActiveOutputWeight] = useState(0)
  const [marijuanaCount, setMarijuanaCount] = useState(0)
  const [marijuanaWeight, setMarijuanaWeight] = useState(0)
  const [hashishCount, setHashishCount] = useState(0)
  const [hashishWeight, setHashishWeight] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedOutputWeight, setDestroyedOutputWeight] = useState(0)
  
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

  // Zusätzliche Felder für Processing definieren
  const processingAdditionalFields = [
    {
      name: 'processing_stage',
      label: 'Verarbeitungs-Stadium',
      type: 'select',
      options: [
        { value: '', label: 'Kein Stadium' },
        { value: 'input', label: 'Input Material' },
        { value: 'processing', label: 'Während der Verarbeitung' },
        { value: 'output', label: 'Fertiges Produkt' },
        { value: 'quality', label: 'Qualitätskontrolle' }
      ]
    },
    {
      name: 'product_quality',
      label: 'Produkt-Qualität',
      type: 'select',
      options: [
        { value: '', label: 'Keine Angabe' },
        { value: 'premium', label: 'Premium Qualität' },
        { value: 'standard', label: 'Standard Qualität' },
        { value: 'budget', label: 'Budget Qualität' }
      ]
    }
  ]

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/processing/counts/');
      
      console.log("ZÄHLER API-ANTWORT (VERARBEITUNG):", res.data);
      
      setActiveCount(res.data.active_count || 0);
      setActiveInputWeight(res.data.total_active_input_weight || 0);
      setActiveOutputWeight(res.data.total_active_output_weight || 0);
      setMarijuanaCount(res.data.marijuana_count || 0);
      setMarijuanaWeight(res.data.marijuana_weight || 0);
      setHashishCount(res.data.hashish_count || 0);
      setHashishWeight(res.data.hashish_weight || 0);
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedOutputWeight(res.data.total_destroyed_output_weight || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Verarbeitungs-Zähler:', error);
    }
  };

  const loadProcessingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/processing/?page=${page}&page_size=${pageSize}`;
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      if (productTypeFilter && tabValue !== 1 && tabValue !== 2) {
        url += `&product_type=${productTypeFilter}`;
      }
      
      if (tabValue === 0) {
        url += '&destroyed=false';
      } else if (tabValue === 1) {
        url += '&destroyed=false&product_type=marijuana';
      } else if (tabValue === 2) {
        url += '&destroyed=false&product_type=hashish';
      } else if (tabValue === 3) {
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Verarbeitungen:', res.data);
      
      setProcessingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Verarbeitungen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Verarbeitungen: ' + (error.response?.data?.error || error.message), 
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
    const showSuccess = localStorage.getItem('showProcessingSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Verarbeitung wurde erfolgreich erstellt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showProcessingSuccess');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/processing/?page=1&page_size=${newPageSize}`;
      
      if (tabValue === 0) {
        url += '&destroyed=false';
      } else if (tabValue === 1) {
        url += '&destroyed=false&product_type=marijuana';
      } else if (tabValue === 2) {
        url += '&destroyed=false&product_type=hashish';
      } else if (tabValue === 3) {
        url += '&destroyed=true';
      }
      
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      if (productTypeFilter && tabValue !== 1 && tabValue !== 2) {
        url += `&product_type=${productTypeFilter}`;
      }
      
      console.log("Sende API-Anfrage:", url);
      setLoading(true);
      
      api.get(url)
        .then(res => {
          console.log('Geladene Verarbeitungen mit neuer pageSize:', res.data);
          setProcessingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Verarbeitungen:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Verarbeitungen: ' + (error.response?.data?.error || error.message), 
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
    loadProcessingBatches();
    loadTabCounts();
    loadMembers();
    loadRooms();
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
    setExpandedProcessingId('');
    loadProcessingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedProcessingId('')
  }

  const handleAccordionChange = (processingId) => {
    if (expandedProcessingId === processingId) {
      setExpandedProcessingId('')
    } else {
      setExpandedProcessingId(processingId)
    }
  }

  const handlePageChange = (event, page) => {
    loadProcessingBatches(page)
  }

  const handleOpenDestroyDialog = (processing) => {
    setSelectedProcessing(processing);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  const handleOpenConvertToLabTestingDialog = (processing) => {
    setSelectedProcessing(processing);
    setOpenConvertToLabTestingDialog(true);
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
    loadProcessingBatches(currentPage)
    loadTabCounts()
  }

  const handleDestroy = async () => {
    try {
      if (selectedProcessing) {
        await api.post(`/trackandtrace/processing/${selectedProcessing.id}/destroy_processing/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedProcessing(null);
        
        loadProcessingBatches(currentPage);
        loadTabCounts();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Verarbeitung erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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

  const handleConvertToLabTesting = async (formData, rfidMemberId = null) => {
    try {
      if (selectedProcessing) {
        if (rfidMemberId) {
          formData.member_id = rfidMemberId;
        }
        
        await api.post(`/trackandtrace/processing/${selectedProcessing.id}/convert_to_labtesting/`, formData);
        
        setOpenConvertToLabTestingDialog(false);
        setSelectedProcessing(null);
        
        loadProcessingBatches(currentPage);
        loadTabCounts();
        
        setGlobalSnackbar({
          open: true,
          message: 'Laborkontrolle wurde erfolgreich erstellt!',
          severity: 'success',
          duration: 10000
        });
        
        localStorage.setItem('showLabTestingSuccess', 'true');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Laborkontrolle:', error);
      setGlobalSnackbar({
        open: true,
        message: error.response?.data?.error || 'Ein Fehler ist bei der Konvertierung aufgetreten',
        severity: 'error',
        duration: 6000
      })
    }
  };

  const handleFilterApply = () => {
    loadProcessingBatches(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadProcessingBatches(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ALLE PRODUKTE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeOutputWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>MARIHUANA</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>HASCHISCH</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'warning.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTET</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedOutputWeight.toLocaleString('de-DE')}g)`}</Typography>
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
          Track & Trace Verwaltung: Step 8 - (Verarbeitung)
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
          color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : (tabValue === 2 ? 'warning' : 'error'))}
          ariaLabel="Verarbeitungs-Tabs"
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
              <ProcessingTable 
                tabValue={0}
                data={processingBatches}
                expandedProcessingId={expandedProcessingId}
                onExpandProcessing={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
              <ProcessingTable 
                tabValue={1}
                data={processingBatches}
                expandedProcessingId={expandedProcessingId}
                onExpandProcessing={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
              <ProcessingTable 
                tabValue={2}
                data={processingBatches}
                expandedProcessingId={expandedProcessingId}
                onExpandProcessing={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
              <ProcessingTable 
                tabValue={3}
                data={processingBatches}
                expandedProcessingId={expandedProcessingId}
                onExpandProcessing={handleAccordionChange}
                onOpenDestroyDialog={handleOpenDestroyDialog}
                onOpenConvertToLabTestingDialog={null}
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

      {/* Dialog für Vernichtung */}
      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={`Verarbeitung ${selectedProcessing?.batch_number || ''} vernichten`}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      {/* Dialog für Laborkontroll-Konvertierung */}
      <ConvertToLabTestingDialog
        open={openConvertToLabTestingDialog}
        onClose={() => setOpenConvertToLabTestingDialog(false)}
        onConvert={handleConvertToLabTesting}
        processing={selectedProcessing}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
      />

      {/* ImageUploadModal */}
      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="processing-batch"
        productId={selectedBatchForImages?.id}
        productName={`${selectedBatchForImages?.batch_number} - ${selectedBatchForImages?.product_type_display || selectedBatchForImages?.product_type}`}
        onImagesUpdated={refreshData}
        additionalFields={processingAdditionalFields}
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