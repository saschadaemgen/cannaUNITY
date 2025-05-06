// frontend/src/apps/trackandtrace/pages/LabTesting/LabTestingPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade, Alert, Snackbar } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import ScienceIcon from '@mui/icons-material/Science'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Spezifische Komponenten
import LabTestingTable from './components/LabTestingTable'
import UpdateLabResultsDialog from './components/UpdateLabResultsDialog'
import EnhancedConvertToPackagingDialog from './components/EnhancedConvertToPackagingDialog'

export default function LabTestingPage() {
  const [labTestingBatches, setLabTestingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedLabTestingId, setExpandedLabTestingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedLabTesting, setSelectedLabTesting] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
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
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Räume
  const [rooms, setRooms] = useState([])
  
  // Erfolgsmeldungen
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/labtesting/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Produkttyp-Filter hinzufügen, wenn vorhanden
      if (productTypeFilter) url += `&product_type=${productTypeFilter}`;
      
      // Je nach aktivem Tab nach Status filtern
      if (tabValue === 0) {
        // Tab 0: Alle in Bearbeitung
        url += '&status=pending&destroyed=false';
      } else if (tabValue === 1) {
        // Tab 1: Alle freigegeben
        url += '&status=passed&destroyed=false';
      } else if (tabValue === 2) {
        // Tab 2: Alle nicht bestanden
        url += '&status=failed&destroyed=false';
      } else if (tabValue === 3) {
        // Tab 3: Alle vernichtet
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Laborkontrollen:', res.data);
      
      setLabTestingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten
      const total = res.data.count || 0
      const pages = Math.ceil(total / 10) // pageSize ist 10, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Laborkontrollen:', error)
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
    const showSuccess = localStorage.getItem('showLabTestingSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Laborkontrolle wurde erfolgreich erstellt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showLabTestingSuccess');
    }
  };

  useEffect(() => {
    loadLabTestingBatches();
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
    }, 3000);
    
    return () => clearInterval(counterInterval);
  }, []);

  // Hook für Tab-Wechsel
  useEffect(() => {
    setCurrentPage(1);
    loadLabTestingBatches(1);
    setExpandedLabTestingId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
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
  
  const handleUpdateLabResults = async (formData) => {
    try {
      if (selectedLabTesting) {
        await api.post(`/trackandtrace/labtesting/${selectedLabTesting.id}/update_lab_results/`, formData);
        
        setOpenUpdateLabResultsDialog(false);
        setSelectedLabTesting(null);
        
        // Laborkontrollen neu laden
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Laborergebnisse wurden erfolgreich aktualisiert!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Aktualisierung der Laborergebnisse:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };
  
  const handleConvertToPackaging = async (formData) => {
    try {
      if (selectedLabTesting) {
        const response = await api.post(`/trackandtrace/labtesting/${selectedLabTesting.id}/convert_to_packaging/`, formData);
        
        setOpenConvertToPackagingDialog(false);
        setSelectedLabTesting(null);
        
        // Laborkontrollen neu laden
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        // Erfolgsmeldung anzeigen
        const createdCount = response.data.created_count || 1;
        setSuccessMessage(`${createdCount} Verpackung${createdCount > 1 ? 'en wurden' : ' wurde'} erfolgreich erstellt!`);
        setShowSuccessAlert(true);
        
        // Erfolg im localStorage speichern für die Verpackungs-Seite
        localStorage.setItem('showPackagingSuccess', 'true');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Verpackung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
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
        
        // Laborkontrollen neu laden
        loadLabTestingBatches(currentPage);
        loadTabCounts();
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Laborkontrolle wurde erfolgreich vernichtet!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleFilterApply = () => {
    loadLabTestingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setProductTypeFilter('')
    setShowFilters(false)
    loadLabTestingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
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
            title="Laborkontroll-Verwaltung"
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
        color={tabValue === 0 ? 'info' : (tabValue === 1 ? 'success' : (tabValue === 2 ? 'warning' : 'error'))}
        ariaLabel="Laborkontroll-Tabs"
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
            <LabTestingTable 
              tabValue={0}
              data={labTestingBatches}
              expandedLabTestingId={expandedLabTestingId}
              onExpandLabTesting={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenUpdateLabResultsDialog={handleOpenUpdateLabResultsDialog}
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
            <LabTestingTable 
              tabValue={1}
              data={labTestingBatches}
              expandedLabTestingId={expandedLabTestingId}
              onExpandLabTesting={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertToPackagingDialog={handleOpenConvertToPackagingDialog}
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
            <LabTestingTable 
              tabValue={2}
              data={labTestingBatches}
              expandedLabTestingId={expandedLabTestingId}
              onExpandLabTesting={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenUpdateLabResultsDialog={handleOpenUpdateLabResultsDialog}
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
            <LabTestingTable 
              tabValue={3}
              data={labTestingBatches}
              expandedLabTestingId={expandedLabTestingId}
              onExpandLabTesting={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
        </>
      )}

      {/* Vernichtungsdialog */}
      <Fade in={openDestroyDialog} timeout={400}>
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
    </Container>
  )
}