// frontend/src/apps/trackandtrace/pages/Processing/ProcessingPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade, Alert, Snackbar } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader'
import FilterSection from '@/components/common/FilterSection'
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import DestroyDialog from '@/components/dialogs/DestroyDialog'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'

// Spezifische Komponenten
import ProcessingTable from './components/ProcessingTable'
import ConvertToLabTestingDialog from './components/ConvertToLabTestingDialog'

export default function ProcessingPage() {
  const [processingBatches, setProcessingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedProcessingId, setExpandedProcessingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [openConvertToLabTestingDialog, setOpenConvertToLabTestingDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedProcessing, setSelectedProcessing] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
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
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Räume für Lab-Testing
  const [rooms, setRooms] = useState([])

  // Erfolgsmeldungen
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/processing/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Produkttyp-Filter hinzufügen, wenn vorhanden
      if (productTypeFilter) url += `&product_type=${productTypeFilter}`;
      
      // Je nach aktivem Tab nach Status filtern
      if (tabValue === 0) {
        // Tab 0: Alle aktiven Verarbeitungen anzeigen
        url += '&destroyed=false';
      } else if (tabValue === 1) {
        // Tab 1: Nur Marihuana anzeigen
        url += '&destroyed=false&product_type=marijuana';
      } else if (tabValue === 2) {
        // Tab 2: Nur Haschisch anzeigen
        url += '&destroyed=false&product_type=hashish';
      } else if (tabValue === 3) {
        // Tab 3: Nur vernichtete Verarbeitungen anzeigen
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Verarbeitungen:', res.data);
      
      setProcessingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Verarbeitungen:', error)
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

  // Funktion zum Überprüfen und Anzeigen der Konvertierungserfolgs-Nachricht
  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showProcessingSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Verarbeitung wurde erfolgreich erstellt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showProcessingSuccess');
    }
  };

  useEffect(() => {
    loadProcessingBatches();
    loadTabCounts();
    loadMembers();
    loadRooms();
    
    // Prüfen, ob wir gerade von einer Konvertierung kommen
    checkForConversionSuccess();
  }, []);
  
  // Regelmäßige Aktualisierung der Zähler
  useEffect(() => {
    const counterInterval = setInterval(() => {
      loadTabCounts();
    }, 2000);
    
    return () => clearInterval(counterInterval);
  }, []);

  // Hook für Tab-Wechsel
  useEffect(() => {
    setCurrentPage(1);
    loadProcessingBatches(1);
    setExpandedProcessingId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
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

  const handleDestroy = async () => {
    try {
      if (selectedProcessing) {
        await api.post(`/trackandtrace/processing/${selectedProcessing.id}/destroy_processing/`, {
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedProcessing(null);
        
        // Verarbeitungen neu laden
        loadProcessingBatches(currentPage);
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Verarbeitung wurde erfolgreich vernichtet!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleConvertToLabTesting = async (formData) => {
    try {
      if (selectedProcessing) {
        await api.post(`/trackandtrace/processing/${selectedProcessing.id}/convert_to_labtesting/`, formData);
        
        setOpenConvertToLabTestingDialog(false);
        setSelectedProcessing(null);
        
        // Verarbeitungen neu laden
        loadProcessingBatches(currentPage);
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Laborkontrolle wurde erfolgreich erstellt!');
        setShowSuccessAlert(true);
        
        // Erfolg im localStorage speichern für die Laborkontroll-Seite
        localStorage.setItem('showLabTestingSuccess', 'true');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Laborkontrolle:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleFilterApply = () => {
    loadProcessingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadProcessingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
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
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${hashishWeight.toLocaleString('de-DE')}g)`}</Typography>
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
            title="Verarbeitungs-Verwaltung"
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
          />
        </Box>
      </Fade>

      <TabsHeader 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
        tabs={tabs}
        color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : (tabValue === 2 ? 'success' : 'error'))}
        ariaLabel="Verarbeitungs-Tabs"
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
            <ProcessingTable 
              tabValue={0}
              data={processingBatches}
              expandedProcessingId={expandedProcessingId}
              onExpandProcessing={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
            <ProcessingTable 
              tabValue={1}
              data={processingBatches}
              expandedProcessingId={expandedProcessingId}
              onExpandProcessing={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
            <ProcessingTable 
              tabValue={2}
              data={processingBatches}
              expandedProcessingId={expandedProcessingId}
              onExpandProcessing={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
            <ProcessingTable 
              tabValue={3}
              data={processingBatches}
              expandedProcessingId={expandedProcessingId}
              onExpandProcessing={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertToLabTestingDialog={handleOpenConvertToLabTestingDialog}
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
      
      <ConvertToLabTestingDialog
        open={openConvertToLabTestingDialog}
        onClose={() => setOpenConvertToLabTestingDialog(false)}
        onConvert={handleConvertToLabTesting}
        processing={selectedProcessing}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
      />
    </Container>
  )
}