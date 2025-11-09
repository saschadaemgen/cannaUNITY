// frontend/src/apps/trackandtrace/pages/Packaging/PackagingPage.jsx
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
import PackagingTable from './components/PackagingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function PackagingPage() {
  const [packagingBatches, setPackagingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedPackagingId, setExpandedPackagingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedPackaging, setSelectedPackaging] = useState(null)
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
  const [activeWeight, setActiveWeight] = useState(0)
  const [activeUnits, setActiveUnits] = useState(0)
  const [marijuanaCount, setMarijuanaCount] = useState(0)
  const [marijuanaWeight, setMarijuanaWeight] = useState(0)
  const [marijuanaUnits, setMarijuanaUnits] = useState(0)
  const [hashishCount, setHashishCount] = useState(0)
  const [hashishWeight, setHashishWeight] = useState(0)
  const [hashishUnits, setHashishUnits] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedWeight, setDestroyedWeight] = useState(0)
  const [destroyedUnits, setDestroyedUnits] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

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

  // Zusätzliche Felder für Packaging definieren
  const packagingAdditionalFields = [
    {
      name: 'packaging_stage',
      label: 'Verpackungs-Stadium',
      type: 'select',
      options: [
        { value: '', label: 'Kein Stadium' },
        { value: 'pre_packaging', label: '📦 Vor der Verpackung' },
        { value: 'packaging_process', label: '🔄 Während der Verpackung' },
        { value: 'final_product', label: '✅ Fertiges Produkt' },
        { value: 'labeling', label: '🏷️ Etikettierung' },
        { value: 'sealing', label: '🔒 Versiegelung' },
        { value: 'batch_photo', label: '📸 Chargen-Übersicht' }
      ]
    },
    {
      name: 'package_type',
      label: 'Verpackungs-Typ',
      type: 'select',
      options: [
        { value: '', label: 'Kein Typ' },
        { value: 'primary', label: 'Primärverpackung' },
        { value: 'secondary', label: 'Sekundärverpackung' },
        { value: 'label', label: 'Etikett/Label' },
        { value: 'seal', label: 'Siegel/Verschluss' },
        { value: 'batch_overview', label: 'Chargen-Übersicht' }
      ]
    }
  ]

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/packaging/counts/');
      
      console.log("ZÄHLER API-ANTWORT (VERPACKUNG):", res.data);
      
      setActiveCount(res.data.active_count || 0);
      setActiveWeight(res.data.total_active_weight || 0);
      setActiveUnits(res.data.total_active_units || 0);
      setMarijuanaCount(res.data.marijuana_count || 0);
      setMarijuanaWeight(res.data.marijuana_weight || 0);
      setMarijuanaUnits(res.data.marijuana_units || 0);
      setHashishCount(res.data.hashish_count || 0);
      setHashishWeight(res.data.hashish_weight || 0);
      setHashishUnits(res.data.hashish_units || 0);
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedWeight(res.data.total_destroyed_weight || 0);
      setDestroyedUnits(res.data.total_destroyed_units || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Verpackungs-Zähler:', error);
    }
  };

  const loadPackagingBatches = async (page = 1) => {
    setLoading(true)
    try {
      let url = `/trackandtrace/packaging/?page=${page}&page_size=${pageSize}`;
      
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
      console.log('Geladene Verpackungen:', res.data);
      
      setPackagingBatches(res.data.results || [])
      
      const total = res.data.count || 0
      setTotalCount(total)
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Verpackungen:', error)
      setGlobalSnackbar({
        open: true, 
        message: 'Fehler beim Laden der Verpackungen: ' + (error.response?.data?.error || error.message), 
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

  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showPackagingSuccess');
    
    if (showSuccess === 'true') {
      setGlobalSnackbar({
        open: true,
        message: 'Verpackung wurde erfolgreich erstellt!',
        severity: 'success',
        duration: 10000
      });
      
      localStorage.removeItem('showPackagingSuccess');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    setTimeout(() => {
      let url = `/trackandtrace/packaging/?page=1&page_size=${newPageSize}`;
      
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
          console.log('Geladene Verpackungen mit neuer pageSize:', res.data);
          setPackagingBatches(res.data.results || []);
          
          const total = res.data.count || 0;
          setTotalCount(total);
          const pages = Math.ceil(total / newPageSize);
          setTotalPages(pages);
        })
        .catch(error => {
          console.error('Fehler beim Laden der Verpackungen:', error);
          setGlobalSnackbar({
            open: true, 
            message: 'Fehler beim Laden der Verpackungen: ' + (error.response?.data?.error || error.message), 
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
    loadPackagingBatches();
    loadTabCounts();
    loadMembers();
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
    setExpandedPackagingId('');
    loadPackagingBatches(1);
  }, [tabValue, pageSize]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setExpandedPackagingId('')
  }

  const handleAccordionChange = (packagingId) => {
    if (expandedPackagingId === packagingId) {
      setExpandedPackagingId('')
    } else {
      setExpandedPackagingId(packagingId)
    }
  }

  const handlePageChange = (event, page) => {
    loadPackagingBatches(page)
  }

  const handleOpenDestroyDialog = (packaging) => {
    setSelectedPackaging(packaging);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
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
    loadPackagingBatches(currentPage)
    loadTabCounts()
  }

  const handleDestroy = async () => {
    try {
      if (selectedPackaging) {
        await api.post(`/trackandtrace/packaging/${selectedPackaging.id}/destroy_packaging/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedPackaging(null);
        
        loadPackagingBatches(currentPage);
        loadTabCounts();
        
        const memberName = members.find(m => m.id === destroyedByMemberId)?.display_name || "Unbekannt"
        
        setGlobalSnackbar({
          open: true,
          message: `Verpackung erfolgreich vernichtet - Autorisiert durch: ${memberName}`,
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
    loadPackagingBatches(1)
    loadTabCounts()
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadPackagingBatches(1)
    loadTabCounts()
  }

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeWeight.toLocaleString('de-DE')}g)`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeUnits})`}</Typography>
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
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaUnits})`}</Typography>
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
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'warning.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishUnits})`}</Typography>
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
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedWeight.toLocaleString('de-DE')}g)`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedUnits})`}</Typography>
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
          Track & Trace Verwaltung: Step 11 - (Verpackung)
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
          ariaLabel="Verpackungs-Tabs"
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
              <PackagingTable 
                tabValue={0}
                data={packagingBatches}
                expandedPackagingId={expandedPackagingId}
                onExpandPackaging={handleAccordionChange}
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
              <PackagingTable 
                tabValue={1}
                data={packagingBatches}
                expandedPackagingId={expandedPackagingId}
                onExpandPackaging={handleAccordionChange}
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
              <PackagingTable 
                tabValue={2}
                data={packagingBatches}
                expandedPackagingId={expandedPackagingId}
                onExpandPackaging={handleAccordionChange}
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
              <PackagingTable 
                tabValue={3}
                data={packagingBatches}
                expandedPackagingId={expandedPackagingId}
                onExpandPackaging={handleAccordionChange}
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

      {/* Dialog für Vernichtung */}
      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={`Verpackung ${selectedPackaging?.batch_number || ''} vernichten`}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>

      {/* ImageUploadModal */}
      <ImageUploadModal
        open={openImageModal}
        onClose={handleCloseImageModal}
        productType="packaging-batch"
        productId={selectedBatchForImages?.id}
        productName={`${selectedBatchForImages?.batch_number} - ${selectedBatchForImages?.source_strain || 'Verpackung'}`}
        onImagesUpdated={refreshData}
        additionalFields={packagingAdditionalFields}
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