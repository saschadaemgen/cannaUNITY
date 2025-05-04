// frontend/src/apps/trackandtrace/pages/Packaging/PackagingPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade, Alert, Snackbar } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Spezifische Komponenten
import PackagingTable from './components/PackagingTable'

export default function PackagingPage() {
  const [packagingBatches, setPackagingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedPackagingId, setExpandedPackagingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedPackaging, setSelectedPackaging] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
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

  // Erfolgsmeldungen
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/packaging/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Produkttyp-Filter hinzufügen, wenn vorhanden
      if (productTypeFilter) url += `&product_type=${productTypeFilter}`;
      
      // Je nach aktivem Tab nach Status filtern
      if (tabValue === 0) {
        // Tab 0: Alle aktiven Verpackungen
        url += '&destroyed=false';
      } else if (tabValue === 1) {
        // Tab 1: Nur Marihuana anzeigen
        url += '&destroyed=false&product_type=marijuana';
      } else if (tabValue === 2) {
        // Tab 2: Nur Haschisch anzeigen
        url += '&destroyed=false&product_type=hashish';
      } else if (tabValue === 3) {
        // Tab 3: Nur vernichtete Verpackungen anzeigen
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Verpackungen:', res.data);
      
      setPackagingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten
      const total = res.data.count || 0
      const pages = Math.ceil(total / 10) // pageSize ist 10, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Verpackungen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadMembers = async () => {
    setLoadingOptions(true);
    try {
      const response = await api.get('members/')
      
      // Sicherstellen, dass die Mitglieder ein display_name Feld haben
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

  // Funktion zum Überprüfen und Anzeigen der Konvertierungserfolgs-Nachricht
  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showPackagingSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Verpackung wurde erfolgreich erstellt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showPackagingSuccess');
    }
  };

  useEffect(() => {
    loadPackagingBatches();
    loadTabCounts();
    loadMembers();
    
// frontend/src/apps/trackandtrace/pages/Packaging/PackagingPage.jsx (Fortsetzung)
    // Prüfen, ob wir gerade von einer Konvertierung kommen
    checkForConversionSuccess();
  }, []);
  
  // Regelmäßige Aktualisierung der Zähler
  useEffect(() => {
    const counterInterval = setInterval(() => {
      loadTabCounts();
    }, 3000);
    
    return () => clearInterval(counterInterval);
  }, []);

  // Hook für Tab-Wechsel
  useEffect(() => {
    setCurrentPage(1);
    loadPackagingBatches(1);
    setExpandedPackagingId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
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

  const handleDestroy = async () => {
    try {
      if (selectedPackaging) {
        await api.post(`/trackandtrace/packaging/${selectedPackaging.id}/destroy_packaging/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedPackaging(null);
        
        // Verpackungen neu laden
        loadPackagingBatches(currentPage);
        loadTabCounts();
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Verpackung wurde erfolgreich vernichtet!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleFilterApply = () => {
    loadPackagingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadPackagingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ALLE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'secondary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <InventoryIcon sx={{ mx: 0.3, fontSize: 16, color: 'secondary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'secondary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeWeight.toLocaleString('de-DE')}g)`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'secondary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeUnits})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocalFloristIcon sx={{ mx: 0.3, fontSize: 16, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>MARIHUANA</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaCount})`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaWeight.toLocaleString('de-DE')}g)`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${marijuanaUnits})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterDramaIcon sx={{ mx: 0.3, fontSize: 16, color: 'warning.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>HASCHISCH</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishCount})`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'warning.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishWeight.toLocaleString('de-DE')}g)`}</Typography>
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
          <SpeedIcon sx={{ mx: 0.3, fontSize: 16, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedWeight.toLocaleString('de-DE')}g)`}</Typography>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>EINHEITEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedUnits})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      {/* Erfolgsbenachrichtigung */}
      <Snackbar 
        open={showSuccessAlert} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessAlert(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Verpackungs-Verwaltung"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        </Box>
      </Fade>
      
      <Fade in={showFilters} timeout={400}>
        <Box sx={{ display: showFilters ? 'block' : 'none' }}>
          <FilterSection
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
            showFilters={showFilters}
            productTypeFilter={productTypeFilter}
            setProductTypeFilter={setProductTypeFilter}
            showProductTypeFilter={true}
          />
        </Box>
      </Fade>

      <TabsHeader 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
        tabs={tabs}
        color={tabValue === 0 ? 'secondary' : (tabValue === 1 ? 'success' : (tabValue === 2 ? 'warning' : 'error'))}
        ariaLabel="Verpackungs-Tabs"
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <>
          <AnimatedTabPanel 
            value={tabValue} 
            index={0} 
            direction="right"
          >
            <PackagingTable 
              tabValue={0}
              data={packagingBatches}
              expandedPackagingId={expandedPackagingId}
              onExpandPackaging={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={1} 
            direction="left"
          >
            <PackagingTable 
              tabValue={1}
              data={packagingBatches}
              expandedPackagingId={expandedPackagingId}
              onExpandPackaging={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={2} 
            direction="left"
          >
            <PackagingTable 
              tabValue={2}
              data={packagingBatches}
              expandedPackagingId={expandedPackagingId}
              onExpandPackaging={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={3} 
            direction="left"
          >
            <PackagingTable 
              tabValue={3}
              data={packagingBatches}
              expandedPackagingId={expandedPackagingId}
              onExpandPackaging={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
        </>
      )}

      <Fade in={openDestroyDialog} timeout={400}>
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
    </Container>
  )
}