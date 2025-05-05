// frontend/src/apps/trackandtrace/pages/Drying/DryingPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Fade, Alert, Snackbar } from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import SpeedIcon from '@mui/icons-material/Speed'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Spezifische Komponenten
import DryingTable from './components/DryingTable'
import ConvertToProcessingDialog from '../../components/dialogs/ConvertToProcessingDialog'

export default function DryingPage() {
  const navigate = useNavigate();
  const [dryingBatches, setDryingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedDryingId, setExpandedDryingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedDrying, setSelectedDrying] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
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

  // Erfolgsmeldungen
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/drying/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Je nach aktivem Tab nach Status filtern
      if (tabValue === 0) {
        // Tab 0: Nur aktive Trocknungen anzeigen (weder vernichtet noch zu Verarbeitung überführt)
        url += '&active=true';
      } else if (tabValue === 1) {
        // Tab 1: Nur zu Verarbeitung überführte Trocknungen anzeigen
        url += '&processed=true';
      } else if (tabValue === 2) {
        // Tab 2: Nur vernichtete Trocknungen anzeigen
        url += '&destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Trocknungen:', res.data);
      
      setDryingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Trocknungen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true);
    try {
      // Mitglieder laden
      const membersResponse = await api.get('members/')
      const formattedMembers = (membersResponse.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden
      const roomsResponse = await api.get('rooms/');
      setRooms(roomsResponse.data.results || []);
    } catch (error) {
      console.error('Fehler beim Laden der Optionen:', error)
    } finally {
      setLoadingOptions(false)
    }
  };

  // Funktion zum Überprüfen und Anzeigen der Konvertierungserfolgs-Nachricht
  const checkForConversionSuccess = () => {
    const showSuccess = localStorage.getItem('showDryingSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Trocknung wurde erfolgreich erstellt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showDryingSuccess');
    }
  };

  useEffect(() => {
    loadDryingBatches();
    loadTabCounts();
    loadMembersAndRooms();
    
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
    loadDryingBatches(1);
    setExpandedDryingId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
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
        
        // Trocknungen neu laden
        loadDryingBatches(currentPage);
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Trocknung wurde erfolgreich vernichtet!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };
  
  // Handler für Verarbeitungskonvertierung
  const handleOpenProcessingDialog = (drying) => {
    setDryingForProcessing(drying);
    setOpenProcessingDialog(true);
  };
  
  const handleConvertToProcessing = async (formData) => {
    try {
      if (dryingForProcessing) {
        const response = await api.post(`/trackandtrace/drying/${dryingForProcessing.id}/convert_to_processing/`, formData);
        console.log("API-Antwort:", response.data);
        
        // Dialog schließen
        setOpenProcessingDialog(false);
        setDryingForProcessing(null);
        
        // Erfolgsmeldung setzen für Weiterleitung zur Verarbeitungsseite
        localStorage.setItem('showProcessingSuccess', 'true');
        
        // Zur Verarbeitungsseite navigieren
        navigate('/trace/verarbeitung');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zur Verarbeitung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleFilterApply = () => {
    loadDryingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadDryingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ScaleIcon sx={{ mx: 0.3, fontSize: 16, color: 'info.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRISCHGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeInitialWeight.toLocaleString('de-DE')}g)`}</Typography>
          <AcUnitIcon sx={{ mx: 0.3, fontSize: 16, color: 'info.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeFinalWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU VERARBEITUNG</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'secondary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${processedCount})`}</Typography>
          <SpeedIcon sx={{ mx: 0.3, fontSize: 16, color: 'secondary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'secondary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${processedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTETE TROCKNUNGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <ScaleIcon sx={{ mx: 0.3, fontSize: 16, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TROCKENGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedFinalWeight.toLocaleString('de-DE')}g)`}</Typography>
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
            title="Trocknungs-Verwaltung"
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
        color={tabValue === 0 ? 'info' : (tabValue === 1 ? 'secondary' : 'error')}
        ariaLabel="Trocknungs-Tabs"
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
            <DryingTable 
              tabValue={0}
              data={dryingBatches}
              expandedDryingId={expandedDryingId}
              onExpandDrying={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenProcessingDialog={handleOpenProcessingDialog}
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
            <DryingTable 
              tabValue={1}
              data={dryingBatches}
              expandedDryingId={expandedDryingId}
              onExpandDrying={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenProcessingDialog={handleOpenProcessingDialog}
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
            <DryingTable 
              tabValue={2}
              data={dryingBatches}
              expandedDryingId={expandedDryingId}
              onExpandDrying={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenProcessingDialog={handleOpenProcessingDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </AnimatedTabPanel>
        </>
      )}

      {/* Dialog für Vernichtung */}
      <Fade in={openDestroyDialog} timeout={400}>
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
    </Container>
  )
}