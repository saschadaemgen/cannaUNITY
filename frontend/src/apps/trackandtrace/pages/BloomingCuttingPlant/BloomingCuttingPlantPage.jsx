// frontend/src/apps/trackandtrace/pages/BloomingCuttingPlant/BloomingCuttingPlantPage.jsx
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
import BloomingCuttingPlantTable from './BloomingCuttingPlantTable'

export default function BloomingCuttingPlantPage() {
  const [bloomingBatches, setBloomingBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [destroyedBatchPlants, setDestroyedBatchPlants] = useState({})
  const [harvestedBatchPlants, setHarvestedBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [plantsCurrentPage, setPlantsCurrentPage] = useState({})
  const [plantsTotalPages, setPlantsTotalPages] = useState({})
  const [destroyedPlantsCurrentPage, setDestroyedPlantsCurrentPage] = useState({})
  const [destroyedPlantsTotalPages, setDestroyedPlantsTotalPages] = useState({})
  const [harvestedPlantsCurrentPage, setHarvestedPlantsCurrentPage] = useState({})
  const [harvestedPlantsTotalPages, setHarvestedPlantsTotalPages] = useState({})
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedPlants, setSelectedPlants] = useState({})
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeBatchesCount, setActiveBatchesCount] = useState(0)
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedBatchesCount, setDestroyedBatchesCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)
  const [harvestedBatchesCount, setHarvestedBatchesCount] = useState(0)
  const [harvestedPlantsCount, setHarvestedPlantsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

  // State für Erfolgsmeldung
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Separate Funktion nur für die Zähler, die unabhängig von allem anderen arbeitet
  const loadTabCounts = async () => {
    try {
      // Direkter API-Aufruf zur counts-Methode ohne Filter
      const res = await api.get('/trackandtrace/bloomingcuttingbatches/counts/');
      
      // Debug-Ausgabe
      console.log("ZÄHLER API-ANTWORT:", res.data);
      
      // Speichere die Zähler in lokalen Variablen
      const activeB = res.data.active_batches_count || 0;
      const activeP = res.data.active_plants_count || 0;
      const destroyedB = res.data.destroyed_batches_count || 0;
      const destroyedP = res.data.destroyed_plants_count || 0;
      const harvestedB = res.data.harvested_batches_count || 0;
      const harvestedP = res.data.harvested_plants_count || 0;
      
      // Setze die State-Variablen
      setActiveBatchesCount(activeB);
      setActivePlantsCount(activeP);
      setDestroyedBatchesCount(destroyedB);
      setDestroyedPlantsCount(destroyedP);
      setHarvestedBatchesCount(harvestedB);
      setHarvestedPlantsCount(harvestedP);
      
      // Debug-Ausgabe nach dem Setzen
      console.log("GESETZTE ZÄHLER:", {
        activeBatches: activeB,
        activePlants: activeP,
        destroyedBatches: destroyedB,
        destroyedPlants: destroyedP,
        harvestedBatches: harvestedB,
        harvestedPlants: harvestedP
      });
    } catch (error) {
      console.error('Fehler beim Laden der Tab-Zähler:', error);
    }
  };

  const loadBloomingBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/bloomingcuttingbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Je nach aktivem Tab nach Pflanzen-Status filtern
      if (tabValue === 0) {
        // Tab 0: Nur Batches mit aktiven Pflanzen anzeigen
        url += '&has_active=true';
      } else if (tabValue === 1) {
        // Tab 1: Nur Batches mit zu Ernte überführten Pflanzen anzeigen
        url += '&has_harvested=true';
      } else if (tabValue === 2) {
        // Tab 2: Nur Batches mit vernichteten Pflanzen anzeigen
        url += '&has_destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Blühpflanzen-Batches:', res.data);
      
      setBloomingBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Chargen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Funktion zum Laden von Mitgliedern
  const loadMembers = async () => {
    setLoadingOptions(true);
    try {
      // Korrekter API-Pfad ohne führenden Slash, da baseURL bereits auf '/api' gesetzt ist
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

  // Funktion zum Überprüfen und Anzeigen der Konvertierungserfolgs-Nachricht
  const checkForConversionSuccess = () => {
    const lastConvertedBatchId = localStorage.getItem('lastConvertedBatchId');
    const showSuccess = localStorage.getItem('showConversionSuccess');
    
    if (showSuccess === 'true') {
      // Setze die Erfolgsmeldung
      setSuccessMessage('Konvertierung der Stecklinge zu Blühpflanzen erfolgreich durchgeführt!');
      setShowSuccessAlert(true);
      
      // Reinige die localStorage Flags
      localStorage.removeItem('showConversionSuccess');
      
      // Wenn ein bestimmter Batch konvertiert wurde, ihn expandieren
      if (lastConvertedBatchId) {
        console.log('Expandiere Batch nach Konvertierung:', lastConvertedBatchId);
        setExpandedBatchId(lastConvertedBatchId);
        
        // Lade die Pflanzen für diesen Batch nach einer kurzen Verzögerung
        setTimeout(() => {
          loadPlantsForBatch(lastConvertedBatchId, 1);
        }, 300);
        
        localStorage.removeItem('lastConvertedBatchId');
      }
    }
  };

  useEffect(() => {
    loadBloomingBatches();
    loadTabCounts(); // Initiale Ladung der Zähler
    loadMembers(); // Mitglieder laden
    
    // Prüfen, ob wir gerade von einer Konvertierung kommen
    checkForConversionSuccess();
  }, []);
  
  // Separate useEffect nur für Zähler
  useEffect(() => {
    // Setze Intervall für regelmäßige Aktualisierung (alle 2 Sekunden)
    const counterInterval = setInterval(() => {
      loadTabCounts();
    }, 2000);
    
    // Aufräumen beim Unmount der Komponente
    return () => clearInterval(counterInterval);
  }, []); // Leeres Dependency-Array = wird nur einmal beim ersten Rendern ausgeführt

  // useEffect-Hook für Tab-Wechsel hinzufügen
  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab die richtigen Daten laden
    loadBloomingBatches(1);
    
    // Zurücksetzen des expandierten Batches beim Tab-Wechsel
    setExpandedBatchId('');
    setBatchPlants({});
    setDestroyedBatchPlants({});
    setHarvestedBatchPlants({});
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleAccordionChange = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId('')
    } else {
      setExpandedBatchId(batchId)
      
      // Je nach Tab die richtigen Daten laden
      if (tabValue === 0) {
        // Im Tab "Aktive Pflanzen" nur aktive Pflanzen laden
        loadPlantsForBatch(batchId, 1)
      } else if (tabValue === 1) {
        // Im Tab "Zu Ernte überführt" nur geerntete Pflanzen laden
        loadHarvestedPlantsForBatch(batchId, 1)
      } else if (tabValue === 2) {
        // Im Tab "Vernichtete Pflanzen" nur vernichtete Pflanzen laden
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading active plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Pflanzen für Batch:', res.data);
      
      // Speichern der Pflanzen für diesen Batch
      const formattedPlants = (res.data.results || []).map(plant => {
        return {
          ...plant,
          notes: plant.notes || '-',
          destroy_reason: plant.destroy_reason || '-',
          destroyed_by: plant.destroyed_by ? {
            ...plant.destroyed_by,
            display_name: plant.destroyed_by.display_name || 
                          `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      // Speichern der aktuellen Seite für diesen Batch
      setPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die Pflanzen dieses Batches
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))

      // Zurücksetzen der ausgewählten Pflanzen für diesen Batch
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    } catch (error) {
      console.error('Fehler beim Laden der Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen
      setBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const loadDestroyedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
      console.log('Geladene vernichtete Pflanzen für Batch:', res.data);
      
      // Speichern der vernichteten Pflanzen für diesen Batch
      const formattedPlants = (res.data.results || []).map(plant => {
        return {
          ...plant,
          notes: plant.notes || '-',
          destroy_reason: plant.destroy_reason || '-',
          destroyed_by: plant.destroyed_by ? {
            ...plant.destroyed_by,
            display_name: plant.destroyed_by.display_name || 
                          `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setDestroyedBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      // Speichern der aktuellen Seite für die vernichteten Pflanzen dieses Batches
      setDestroyedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die vernichteten Pflanzen
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setDestroyedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der vernichteten Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen
      setDestroyedBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setDestroyedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setDestroyedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const loadHarvestedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading harvested plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/bloomingcuttingbatches/${batchId}/plants/?page=${page}&converted_to_harvest=true`)
      
      console.log('Geladene geerntete Pflanzen für Batch:', res.data);
      
      // Speichern der geernteten Pflanzen für diesen Batch
      const formattedPlants = (res.data.results || []).map(plant => {
        return {
          ...plant,
          notes: plant.notes || '-',
          destroy_reason: plant.destroy_reason || '-',
          destroyed_by: plant.destroyed_by ? {
            ...plant.destroyed_by,
            display_name: plant.destroyed_by.display_name || 
                          `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim() || '-'
          } : null
        };
      });
      
      setHarvestedBatchPlants(prev => ({
        ...prev,
        [batchId]: formattedPlants
      }))
      
      // Speichern der aktuellen Seite für die geernteten Pflanzen dieses Batches
      setHarvestedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: page
      }))
      
      // Berechne die Gesamtanzahl der Seiten für die geernteten Pflanzen
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setHarvestedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: pages
      }))
    } catch (error) {
      console.error('Fehler beim Laden der geernteten Pflanzen:', error)
      console.error('Details:', error.response?.data || error.message)
      
      // Bei Fehler leere Daten setzen
      setHarvestedBatchPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
      setHarvestedPlantsCurrentPage(prev => ({
        ...prev,
        [batchId]: 1
      }))
      setHarvestedPlantsTotalPages(prev => ({
        ...prev,
        [batchId]: 1
      }))
    }
  }

  const handlePageChange = (event, page) => {
    loadBloomingBatches(page)
  }

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
  }

  const handleHarvestedPlantsPageChange = (batchId, event, page) => {
    loadHarvestedPlantsForBatch(batchId, page)
  }

  // Aktualisierte handleOpenDestroyDialog Funktion
  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  // Aktualisierte handleDestroy Funktion
  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedPlants[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/bloomingcuttingbatches/${selectedBatch.id}/destroy_plants/`, {
          plant_ids: selectedPlants[selectedBatch.id],
          reason: destroyReason,
          destroyed_by_id: destroyedByMemberId
        });

        setOpenDestroyDialog(false);
        setSelectedBatch(null);
        
        // Ausgewählte Pflanzen zurücksetzen
        setSelectedPlants(prev => ({
          ...prev,
          [selectedBatch.id]: []
        }));
        
        // Je nach Tab die richtigen Daten neu laden
        if (tabValue === 0) {
          loadPlantsForBatch(selectedBatch.id, plantsCurrentPage[selectedBatch.id] || 1);
        } else {
          loadDestroyedPlantsForBatch(selectedBatch.id, destroyedPlantsCurrentPage[selectedBatch.id] || 1);
        }
        
        // Zähler werden automatisch aktualisiert durch das Intervall
        loadBloomingBatches(currentPage); // Batches neu laden für aktualisierte Zahlen
      }
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  const togglePlantSelection = (batchId, plantId) => {
    setSelectedPlants(prev => {
      const batchPlants = prev[batchId] || []
      if (batchPlants.includes(plantId)) {
        return {
          ...prev,
          [batchId]: batchPlants.filter(id => id !== plantId)
        }
      } else {
        return {
          ...prev,
          [batchId]: [...batchPlants, plantId]
        }
      }
    })
  }

  const selectAllPlantsInBatch = (batchId, select) => {
    if (select) {
      const allPlantIds = batchPlants[batchId]?.map(plant => plant.id) || []
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: allPlantIds
      }))
    } else {
      setSelectedPlants(prev => ({
        ...prev,
        [batchId]: []
      }))
    }
  }
  
  const handleFilterApply = () => {
    loadBloomingBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadBloomingBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tab-Definition als separate Variable
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.3, fontSize: 10, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE PFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activePlantsCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ÜBERFÜHRT ZU ERNTE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${harvestedPlantsCount})`}</Typography>
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
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${destroyedPlantsCount})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      {/* Erfolgsbenachrichtigung als Snackbar */}
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
            title="Hauptverwaltung: Blühpflanzen aus Stecklingen"
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
        color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
        ariaLabel="Blühpflanzen aus Stecklingen Tabs"
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
            <BloomingCuttingPlantTable 
              tabValue={0}
              data={bloomingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              batchPlants={batchPlants}
              destroyedBatchPlants={destroyedBatchPlants}
              harvestedBatchPlants={harvestedBatchPlants}
              plantsCurrentPage={plantsCurrentPage}
              plantsTotalPages={plantsTotalPages}
              destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
              destroyedPlantsTotalPages={destroyedPlantsTotalPages}
              harvestedPlantsCurrentPage={harvestedPlantsCurrentPage}
              harvestedPlantsTotalPages={harvestedPlantsTotalPages}
              onPlantsPageChange={handlePlantsPageChange}
              onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
              onHarvestedPlantsPageChange={handleHarvestedPlantsPageChange}
              selectedPlants={selectedPlants}
              togglePlantSelection={togglePlantSelection}
              selectAllPlantsInBatch={selectAllPlantsInBatch}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={1} 
            direction="left"
          >
            <BloomingCuttingPlantTable 
              tabValue={1}
              data={bloomingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              batchPlants={batchPlants}
              destroyedBatchPlants={destroyedBatchPlants}
              harvestedBatchPlants={harvestedBatchPlants}
              plantsCurrentPage={plantsCurrentPage}
              plantsTotalPages={plantsTotalPages}
              destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
              destroyedPlantsTotalPages={destroyedPlantsTotalPages}
              harvestedPlantsCurrentPage={harvestedPlantsCurrentPage}
              harvestedPlantsTotalPages={harvestedPlantsTotalPages}
              onPlantsPageChange={handlePlantsPageChange}
              onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
              onHarvestedPlantsPageChange={handleHarvestedPlantsPageChange}
              selectedPlants={selectedPlants}
              togglePlantSelection={togglePlantSelection}
              selectAllPlantsInBatch={selectAllPlantsInBatch}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={2} 
            direction="left"
          >
            <BloomingCuttingPlantTable 
              tabValue={2}
              data={bloomingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              batchPlants={batchPlants}
              destroyedBatchPlants={destroyedBatchPlants}
              harvestedBatchPlants={harvestedBatchPlants}
              plantsCurrentPage={plantsCurrentPage}
              plantsTotalPages={plantsTotalPages}
              destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
              destroyedPlantsTotalPages={destroyedPlantsTotalPages}
              harvestedPlantsCurrentPage={harvestedPlantsCurrentPage}
              harvestedPlantsTotalPages={harvestedPlantsTotalPages}
              onPlantsPageChange={handlePlantsPageChange}
              onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
              onHarvestedPlantsPageChange={handleHarvestedPlantsPageChange}
              selectedPlants={selectedPlants}
              togglePlantSelection={togglePlantSelection}
              selectAllPlantsInBatch={selectAllPlantsInBatch}
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
            title={selectedPlants[selectedBatch?.id]?.length > 1 
              ? `${selectedPlants[selectedBatch?.id].length} Blühpflanzen vernichten` 
              : 'Blühpflanze vernichten'}
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