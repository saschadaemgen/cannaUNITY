// frontend/src/apps/trackandtrace/pages/Cutting/CuttingPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader'
import FilterSection from '@/components/common/FilterSection'
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import DestroyDialog from '@/components/dialogs/DestroyDialog'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'
import ConvertToBlooming from '@/components/dialogs/ConvertToBlooming'

// Spezifische Komponenten
import CuttingTable from './CuttingTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function CuttingPage() {
  const [cuttingBatches, setCuttingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchCuttings, setBatchCuttings] = useState({})
  const [destroyedBatchCuttings, setDestroyedBatchCuttings] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cuttingsCurrentPage, setCuttingsCurrentPage] = useState({})
  const [cuttingsTotalPages, setCuttingsTotalPages] = useState({})
  const [destroyedCuttingsCurrentPage, setDestroyedCuttingsCurrentPage] = useState({})
  const [destroyedCuttingsTotalPages, setDestroyedCuttingsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedCuttings, setSelectedCuttings] = useState({})
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeBatchesCount, setActiveBatchesCount] = useState(0)
  const [activeCuttingsCount, setActiveCuttingsCount] = useState(0)
  const [destroyedBatchesCount, setDestroyedBatchesCount] = useState(0)
  const [destroyedCuttingsCount, setDestroyedCuttingsCount] = useState(0)
  const [convertedBatchesCount, setConvertedBatchesCount] = useState(0)
  const [convertedCuttingsCount, setConvertedCuttingsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Füge neue States für den Konvertierungsdialog hinzu
  const [openConvertDialog, setOpenConvertDialog] = useState(false)
  const [selectedForConversion, setSelectedForConversion] = useState([])
  
  // State-Variable für "Alle konvertieren"-Modus
  const [convertAllMode, setConvertAllMode] = useState(false)
  
  // Lade auch Räume
  const [rooms, setRooms] = useState([])

  // Zusätzlichen Status für überführte Stecklinge
  const [convertedBatchCuttings, setConvertedBatchCuttings] = useState({})
  const [convertedCuttingsCurrentPage, setConvertedCuttingsCurrentPage] = useState({})
  const [convertedCuttingsTotalPages, setConvertedCuttingsTotalPages] = useState({})

  const loadCuttingBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/cuttingbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Je nach Tab filtern
      if (tabValue === 0) {
        url += '&has_active=true';
      } else if (tabValue === 1) {
        url += '&has_destroyed=true';
      } else if (tabValue === 2) {
        url += '&has_converted=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Stecklinge-Batches:', res.data);
      
      setCuttingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Stecklinge-Chargen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separate Funktion zum Laden aller Zähler (unabhängig vom Tab)
  const loadAllCounts = async () => {
    try {
      // Direkte API-Anfrage für alle Zähler
      const res = await api.get('/trackandtrace/cuttingbatches/counts/?type=all');
      
      // Setze die State-Variablen
      setActiveBatchesCount(res.data.active_batches_count || 0);
      setActiveCuttingsCount(res.data.active_count || 0);
      setDestroyedBatchesCount(res.data.destroyed_batches_count || 0);
      setDestroyedCuttingsCount(res.data.destroyed_count || 0);
      setConvertedBatchesCount(res.data.converted_batches_count || 0);
      setConvertedCuttingsCount(res.data.converted_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
  // Funktion zum Laden von Mitgliedern
  const loadMembers = async () => {
    setLoadingOptions(true);
    try {
      const response = await api.get('members/')
      console.log('Mitglieder für Vernichtungsdialog geladen:', response.data)
      
      // Sicherstellen, dass die Mitglieder ein display_name Feld haben
      const formattedMembers = (response.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      console.log('Formatierte Mitglieder:', formattedMembers)
      setMembers(formattedMembers)
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
      console.error('Details:', error.response?.data || error.message)
    } finally {
      setLoadingOptions(false)
    }
  };
  
  // Funktion zum Laden von Räumen
  const loadRooms = async () => {
    try {
      const response = await api.get('rooms/');
      console.log('Räume geladen:', response.data);
      setRooms(response.data.results || []);
    } catch (error) {
      console.error('Fehler beim Laden der Räume:', error);
    }
  };

  useEffect(() => {
    loadCuttingBatches()
    loadMembers() // Mitglieder laden
    loadRooms() // Räume laden
  }, [])
  
  // Separate useEffect für Zähler-Aktualisierung
  useEffect(() => {
    // Initiale Ladung der Zähler
    loadAllCounts();
    
    // Setze Intervall für regelmäßige Aktualisierung
    const counterInterval = setInterval(() => {
      loadAllCounts();
    }, 2000);
    
    // Aufräumen beim Unmount der Komponente
    return () => clearInterval(counterInterval);
  }, []);
  
  // useEffect für Tab-Wechsel
  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab die richtigen Daten laden
    loadCuttingBatches(1);
    
    // Zurücksetzen des expandierten Batches beim Tab-Wechsel
    setExpandedBatchId('');
    setBatchCuttings({});
    setDestroyedBatchCuttings({});
    setConvertedBatchCuttings({});
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    // Beim Tab-Wechsel alle geöffneten Akkordeons schließen
    setExpandedBatchId('')
    setBatchCuttings({})
    setDestroyedBatchCuttings({})
    setConvertedBatchCuttings({})
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      // Je nach Tab die richtigen Daten laden
      if (tabValue === 0) {
        // Im Tab "Aktive Stecklinge" nur aktive Stecklinge laden
        loadCuttingsForBatch(batchId, 1)
      } else if (tabValue === 1) {
        // Im Tab "Vernichtete Stecklinge" nur vernichtete Stecklinge laden
        loadDestroyedCuttingsForBatch(batchId, 1)
      } else if (tabValue === 2) {
        // Im Tab "Zu Blühpflanzen konvertierte Stecklinge" laden
        loadConvertedCuttingsForBatch(batchId, 1)
      }
    }
  }

  const loadCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading cuttings for batch ID:", batchId);
      // Immer aktive Stecklinge laden, unabhängig vom Tab
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Stecklinge für Batch:', res.data);
      
      // Speichern der Stecklinge für diesen Batch
      // Stelle sicher, dass alle Felder korrekt formatiert sind
      const formattedCuttings = (res.data.results || []).map(cutting => {
        console.log("Cutting batch number:", cutting.batch_number);
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }))
      
      // Speichern der aktuellen Seite für diesen Batch
      setCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die Stecklinge dieses Batches
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))

      // Zurücksetzen der ausgewählten Stecklinge für diesen Batch
      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Stecklinge:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen, um Ladespinner zu beenden
      setBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
      setCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  // Separate Funktion zum Laden vernichteter Stecklinge
  const loadDestroyedCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed cuttings for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&destroyed=true`)
      
      console.log('Geladene vernichtete Stecklinge für Batch:', res.data);
      
      // Speichern der vernichteten Stecklinge für diesen Batch
      const formattedCuttings = (res.data.results || []).map(cutting => {
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setDestroyedBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }))
      
      // Speichern der aktuellen Seite für die vernichteten Stecklinge dieses Batches
      setDestroyedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die vernichteten Stecklinge
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setDestroyedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der vernichteten Stecklinge:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen
      setDestroyedBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
      setDestroyedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setDestroyedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  // Funktion zum Laden von überführten Stecklingen
  const loadConvertedCuttingsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading converted cuttings for batch ID:", batchId);
      // Lade Stecklinge, die zu Blühpflanzen konvertiert wurden
      const res = await api.get(`/trackandtrace/cuttingbatches/${batchId}/cuttings/?page=${page}&converted=true`);
      
      console.log('Geladene überführte Stecklinge für Batch:', res.data);
      
      // Speichern der überführten Stecklinge für diesen Batch
      const formattedCuttings = (res.data.results || []).map(cutting => {
        return {
          ...cutting,
          notes: cutting.notes || '-',
          destroy_reason: cutting.destroy_reason || '-',
          converted_to: cutting.converted_to || null,
          destroyed_by: cutting.destroyed_by ? {
            ...cutting.destroyed_by,
            display_name: cutting.destroyed_by.display_name || 
                          `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setConvertedBatchCuttings(prev => ({
        ...prev,
        [batchId]: formattedCuttings
      }));
      
      // Speichern der aktuellen Seite für überführte Stecklinge
      setConvertedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }));
      
      // Berechne die Gesamtanzahl der Seiten für die überführten Stecklinge
      const total = res.data.count || 0;
      const pages = Math.ceil(total / 5); // pageSize ist 5, wie im Backend definiert
      setConvertedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }));
    } catch (error) {
      console.error('Fehler beim Laden der überführten Stecklinge:', error);
      console.error('Details:', error.response?.data || error.message);
      
      // Bei Fehler leere Daten setzen
      setConvertedBatchCuttings(prev => ({
        ...prev,
        [batchId]: []
      }));
      setConvertedCuttingsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }));
      setConvertedCuttingsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }));
    }
  };

  const handlePageChange = (event, page) => {
    loadCuttingBatches(page)
  }

  const handleCuttingsPageChange = (batchId, event, page) => {
    loadCuttingsForBatch(batchId, page)
  }

  const handleDestroyedCuttingsPageChange = (batchId, event, page) => {
    loadDestroyedCuttingsForBatch(batchId, page)
  }

  const handleConvertedCuttingsPageChange = (batchId, event, page) => {
    loadConvertedCuttingsForBatch(batchId, page);
  };

  // Aktualisierte handleOpenDestroyDialog Funktion
  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  // Aktualisierte Funktion zum Öffnen des Konvertierungsdialogs
  const handleOpenConvertDialog = (batch, selectedCuttings, convertAll = false) => {
    console.log("Opening convert dialog for batch:", batch);
    console.log("Selected cuttings:", selectedCuttings);
    console.log("Convert all mode:", convertAll);
    
    // Stelle sicher, dass nur gültige Stecklinge übergeben werden
    const validCuttings = Array.isArray(selectedCuttings) 
      ? selectedCuttings.filter(cutting => cutting && cutting.id)
      : [];
      
    setSelectedBatch(batch);
    setSelectedForConversion(validCuttings);
    setConvertAllMode(convertAll);
    setOpenConvertDialog(true);
  };
  
  // Aktualisierte Funktion zum Konvertieren von Stecklingen zu Blühpflanzen
  const handleConvert = async (convertData, rfidMemberId = null) => {
    try {
      console.log("Converting cuttings with data:", convertData);
      
      // Stelle sicher, dass cutting_ids ein Array ist und keine null-Werte enthält
      const cleanedData = {
        ...convertData,
        member_id: rfidMemberId || convertData.member_id || null,
        cutting_ids: Array.isArray(convertData.cutting_ids)
          ? convertData.cutting_ids.filter(id => id !== null && id !== undefined)
          : []
      };
      
      console.log("Cleaned conversion data:", cleanedData);
      
      const response = await api.post(
        `/trackandtrace/cuttingbatches/${selectedBatch.id}/convert_to_blooming/`, 
        cleanedData
      );
      
      console.log("Conversion response:", response.data);
      
      // Dialog schließen
      setOpenConvertDialog(false);
      
      // Daten neu laden (falls der Benutzer auf dieser Seite bleibt)
      loadCuttingsForBatch(selectedBatch.id, cuttingsCurrentPage[selectedBatch.id] || 1);
      loadCuttingBatches(currentPage);
      
      // Ausgewählte Stecklinge zurücksetzen
      setSelectedCuttings(prev => ({
        ...prev,
        [selectedBatch.id]: []
      }));
      
      // Erfolgsbenachrichtigung
      alert(`${convertData.quantity} Blühpflanzen wurden erfolgreich erstellt.`);
      
      // Batch-ID und Erfolgsstatus im localStorage speichern für eine bessere Benutzererfahrung
      // auf der Zielseite
      localStorage.setItem('lastConvertedBatchId', response.data.batch?.id || '');
      localStorage.setItem('showConversionSuccess', 'true');
      
      // Zu Blühpflanzen aus Stecklingen navigieren (mit History API)
      window.location.href = '/trace/bluehpflanzen-aus-stecklingen';
    } catch (error) {
      console.error('Fehler bei der Konvertierung:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  // Aktualisierte handleDestroy Funktion
  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedCuttings[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/cuttingbatches/${selectedBatch.id}/destroy_cuttings/`, {
          cutting_ids: selectedCuttings[selectedBatch.id],
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedBatch(null);
        
        // Ausgewählte Stecklinge zurücksetzen
        setSelectedCuttings(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        // Je nach Tab die richtigen Daten neu laden
        if (tabValue === 0) {
          loadCuttingsForBatch(selectedBatch.id, cuttingsCurrentPage[selectedBatch.id] || 1);
        } else if (tabValue === 1) {
          loadDestroyedCuttingsForBatch(selectedBatch.id, destroyedCuttingsCurrentPage[selectedBatch.id] || 1);
        } else if (tabValue === 2) {
          loadConvertedCuttingsForBatch(selectedBatch.id, convertedCuttingsCurrentPage[selectedBatch.id] || 1);
        }
        
        loadAllCounts(); // Zähler aktualisieren
        loadCuttingBatches(currentPage); // Batches neu laden für aktualisierte Zahlen
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const toggleCuttingSelection = (batchId, cuttingId) => {
    setSelectedCuttings(prev => {
      const batchCuttings = prev[batchId] || []
      if (batchCuttings.includes(cuttingId)) {
        return {
          ...prev,
          [batchId]: batchCuttings.filter(id => id !== cuttingId)
        }
      } else {
        return {
          ...prev,
          [batchId]: [...batchCuttings, cuttingId]
        }
      }
    })
  }

  const selectAllCuttingsInBatch = (batchId, select) => {
    if (select) {
      const allCuttingIds = batchCuttings[batchId]?.map(cutting => cutting.id) || []
      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: allCuttingIds
      }))
    } else {
      setSelectedCuttings(prev => ({
        ...prev,
        [batchId]: []
      }))
    }
  }
  
  const handleFilterApply = () => {
    loadCuttingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadCuttingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tabs definieren mit kleinerer Schriftgröße
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE STECKLINGE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeCuttingsCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${convertedBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>BLÜHPFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${convertedCuttingsCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VERNICHTET</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedCuttingsCount})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Stecklinge-Verwaltung"
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
        color="primary"
        ariaLabel="Stecklinge-Tabs"
        sx={{ 
          '& .MuiTab-root': { 
            minHeight: '36px', 
            py: 0.5 // Reduzierte vertikale Polsterung
          }
        }}
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <>
          <AnimatedTabPanel 
            value={tabValue} 
            index={0} 
            animationType={animSettings.type} 
            direction="right" 
            duration={animSettings.duration}
          >
            <CuttingTable 
              tabValue={0}
              data={cuttingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertDialog={handleOpenConvertDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              batchCuttings={batchCuttings}
              destroyedBatchCuttings={destroyedBatchCuttings}
              cuttingsCurrentPage={cuttingsCurrentPage}
              cuttingsTotalPages={cuttingsTotalPages}
              destroyedCuttingsCurrentPage={destroyedCuttingsCurrentPage}
              destroyedCuttingsTotalPages={destroyedCuttingsTotalPages}
              onCuttingsPageChange={handleCuttingsPageChange}
              onDestroyedCuttingsPageChange={handleDestroyedCuttingsPageChange}
              selectedCuttings={selectedCuttings}
              toggleCuttingSelection={toggleCuttingSelection}
              selectAllCuttingsInBatch={selectAllCuttingsInBatch}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={1} 
            animationType={animSettings.type} 
            direction="left" 
            duration={animSettings.duration}
          >
            <CuttingTable 
              tabValue={1}
              data={cuttingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenConvertDialog={handleOpenConvertDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              batchCuttings={batchCuttings}
              destroyedBatchCuttings={destroyedBatchCuttings}
              cuttingsCurrentPage={cuttingsCurrentPage}
              cuttingsTotalPages={cuttingsTotalPages}
              destroyedCuttingsCurrentPage={destroyedCuttingsCurrentPage}
              destroyedCuttingsTotalPages={destroyedCuttingsTotalPages}
              onCuttingsPageChange={handleCuttingsPageChange}
              onDestroyedCuttingsPageChange={handleDestroyedCuttingsPageChange}
              selectedCuttings={selectedCuttings}
              toggleCuttingSelection={toggleCuttingSelection}
              selectAllCuttingsInBatch={selectAllCuttingsInBatch}
            />
          </AnimatedTabPanel>
          
          {/* Neuer Tab für überführte Stecklinge */}
          <AnimatedTabPanel 
            value={tabValue} 
            index={2} 
            animationType={animSettings.type} 
            direction="left" 
            duration={animSettings.duration}
          >
            <CuttingTable 
              tabValue={2}
              data={cuttingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              convertedBatchCuttings={convertedBatchCuttings}
              convertedCuttingsCurrentPage={convertedCuttingsCurrentPage}
              convertedCuttingsTotalPages={convertedCuttingsTotalPages}
              onConvertedCuttingsPageChange={handleConvertedCuttingsPageChange}
            />
          </AnimatedTabPanel>
        </>
      )}

      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title={selectedCuttings[selectedBatch?.id]?.length > 1 
              ? `${selectedCuttings[selectedBatch?.id].length} Stecklinge vernichten` 
              : 'Steckling vernichten'}
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            showQuantity={false}
          />
        </div>
      </Fade>
      
      {/* Konvertierungsdialog mit aktualisierten Props */}
      <ConvertToBlooming
        open={openConvertDialog}
        onClose={() => setOpenConvertDialog(false)}
        onConvert={handleConvert}
        title={convertAllMode 
          ? `Alle Stecklinge zu Blühpflanzen umwandeln` 
          : `${selectedForConversion.length || 0} Stecklinge zu Blühpflanzen umwandeln`}
        cuttings={selectedForConversion}
        members={members}
        rooms={rooms}
        loadingOptions={loadingOptions}
        convertAll={convertAllMode}
        batchActiveCount={selectedBatch?.active_cuttings_count || 0}
      />
    </Container>
  )
}