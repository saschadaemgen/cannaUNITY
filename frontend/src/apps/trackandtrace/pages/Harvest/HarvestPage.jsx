// frontend/src/apps/trackandtrace/pages/Harvest/HarvestPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Fade, Alert, Snackbar } from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import AcUnitIcon from '@mui/icons-material/AcUnit' // Neues Icon für Trocknung
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Spezifische Komponenten
import HarvestTable from './components/HarvestTable'
import ConvertToDryingDialog from '../../components/dialogs/ConvertToDryingDialog'

export default function HarvestPage() {
  const navigate = useNavigate();
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedHarvestId, setExpandedHarvestId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedHarvest, setSelectedHarvest] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeCount, setActiveCount] = useState(0)
  const [activeWeight, setActiveWeight] = useState(0)
  const [driedCount, setDriedCount] = useState(0) // Neue Zustandsvariable für Trocknungszähler
  const [driedWeight, setDriedWeight] = useState(0) // Neue Zustandsvariable für Trocknungsgewicht
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyedWeight, setDestroyedWeight] = useState(0)
  
  // Mitglieder und Räume für Dialoge
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  const [rooms, setRooms] = useState([])
  
  // Zustände für Trocknungskonvertierung
  const [openDryingDialog, setOpenDryingDialog] = useState(false)
  const [harvestForDrying, setHarvestForDrying] = useState(null)

  // Erfolgsmeldungen
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Separate Funktion für die Zähler
  const loadTabCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/harvests/counts/');
      
      console.log("ZÄHLER API-ANTWORT (ERNTE):", res.data);
      
      setActiveCount(res.data.active_count || 0);
      setActiveWeight(res.data.total_active_weight || 0);
      setDriedCount(res.data.dried_count || 0); // Neue Daten aus API laden
      setDriedWeight(res.data.total_dried_weight || 0); // Neue Daten aus API laden
      setDestroyedCount(res.data.destroyed_count || 0);
      setDestroyedWeight(res.data.total_destroyed_weight || 0);
      
    } catch (error) {
      console.error('Fehler beim Laden der Ernte-Zähler:', error);
    }
  };

  const loadHarvests = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/harvests/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Je nach aktivem Tab nach Status filtern
      if (tabValue === 0) {
        // Tab 0: Nur aktive Ernten anzeigen
        url += '&status=active';
      } else if (tabValue === 1) {
        // Tab 1: Nur zu Trocknung konvertierte Ernten anzeigen
        url += '&status=dried';
      } else if (tabValue === 2) {
        // Tab 2: Nur vernichtete Ernten anzeigen
        url += '&status=destroyed';
      }
      
      const res = await api.get(url);
      console.log('Geladene Ernten:', res.data);
      
      setHarvests(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Ernten:', error)
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
    const showSuccess = localStorage.getItem('showHarvestSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Ernte wurde erfolgreich erstellt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showHarvestSuccess');
    }
  };

  useEffect(() => {
    loadHarvests();
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
    loadHarvests(1);
    setExpandedHarvestId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
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
        
        // Ernten neu laden
        loadHarvests(currentPage);
        
        // Erfolgsmeldung anzeigen
        setSuccessMessage('Ernte wurde erfolgreich vernichtet!');
        setShowSuccessAlert(true);
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };
  
  // Handler für Trocknungskonvertierung
  const handleOpenDryingDialog = (harvest) => {
    setHarvestForDrying(harvest);
    setOpenDryingDialog(true);
  };
  
  const handleConvertToDrying = async (formData) => {
    try {
      if (harvestForDrying) {
        const response = await api.post(`/trackandtrace/harvests/${harvestForDrying.id}/convert_to_drying/`, formData);
        console.log("API-Antwort:", response.data);
        
        // Dialog schließen
        setOpenDryingDialog(false);
        setHarvestForDrying(null);
        
        // Erfolgsmeldung setzen für Weiterleitung zur Trocknungsseite
        localStorage.setItem('showDryingSuccess', 'true');
        
        // Zur Trocknungsseite navigieren
        navigate('/trace/trocknung');
      }
    } catch (error) {
      console.error('Fehler bei der Konvertierung zu Trocknung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const handleFilterApply = () => {
    loadHarvests(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadHarvests(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE ERNTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCount})`}</Typography>
          <ScaleIcon sx={{ mx: 0.3, fontSize: 16, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU TROCKNUNG</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${driedCount})`}</Typography>
          <AcUnitIcon sx={{ mx: 0.3, fontSize: 16, color: 'info.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'info.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${driedWeight.toLocaleString('de-DE')}g)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTETE ERNTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCount})`}</Typography>
          <ScaleIcon sx={{ mx: 0.3, fontSize: 16, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GESAMTGEWICHT</Typography>
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
            title="Ernte-Verwaltung"
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
        color="success"
        ariaLabel="Ernte-Tabs"
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
            <HarvestTable 
              tabValue={0}
              data={harvests}
              expandedHarvestId={expandedHarvestId}
              onExpandHarvest={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenDryingDialog={handleOpenDryingDialog}
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
            <HarvestTable 
              tabValue={1}
              data={harvests}
              expandedHarvestId={expandedHarvestId}
              onExpandHarvest={handleAccordionChange}
              onOpenDestroyDialog={null} // Keine Vernichtungsoption für bereits getrocknete Ernten
              onOpenDryingDialog={null} // Keine erneute Trocknungsoption
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
            <HarvestTable 
              tabValue={2}
              data={harvests}
              expandedHarvestId={expandedHarvestId}
              onExpandHarvest={handleAccordionChange}
              onOpenDestroyDialog={null} // Keine erneute Vernichtungsoption für bereits vernichtete Ernten
              onOpenDryingDialog={null} // Keine Trocknungsoption für vernichtete Ernten
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
    </Container>
  )
}