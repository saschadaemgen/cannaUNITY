// frontend/src/apps/trackandtrace/pages/MotherPlant/MotherPlantPage.jsx
import { useState, useEffect } from 'react'
import { Container } from '@mui/material'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import CreateCuttingDialog from '../../components/dialogs/CreateCuttingDialog'

// Spezifische Komponenten
import MotherPlantTable from './components/MotherPlantTable'

export default function MotherPlantPage() {
  const [motherBatches, setMotherBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [batchPlants, setBatchPlants] = useState({})
  const [destroyedBatchPlants, setDestroyedBatchPlants] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [plantsCurrentPage, setPlantsCurrentPage] = useState({})
  const [plantsTotalPages, setPlantsTotalPages] = useState({})
  const [destroyedPlantsCurrentPage, setDestroyedPlantsCurrentPage] = useState({})
  const [destroyedPlantsTotalPages, setDestroyedPlantsTotalPages] = useState({})
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
  
  // Zähler für Tabs - Aktualisiert für separate Batch- und Pflanzenzähler
  const [activeBatchesCount, setActiveBatchesCount] = useState(0)
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedBatchesCount, setDestroyedBatchesCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)
  
  // Neu: State für Stecklings-Chargen hinzufügen
  const [cuttingBatches, setCuttingBatches] = useState([])
  // Zähler für Stecklinge
  const [cuttingBatchCount, setCuttingBatchCount] = useState(0)
  const [cuttingCount, setCuttingCount] = useState(0)
  
  // Mitglieder für Vernichtungen und Stecklinge
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Räume für Stecklinge
  const [rooms, setRooms] = useState([])
  
  // State für die Stecklinge-Erstellung
  const [openCreateCuttingDialog, setOpenCreateCuttingDialog] = useState(false)
  const [cuttingQuantity, setCuttingQuantity] = useState(1)
  const [cuttingNotes, setCuttingNotes] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  // Neu: State für ausgewählte Mutterpflanze
  const [selectedMotherPlant, setSelectedMotherPlant] = useState(null)

  const loadMotherBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/motherbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Je nach aktivem Tab nach Pflanzen-Status filtern
      if (tabValue === 0) {
        // Tab 0: Nur Batches mit aktiven Pflanzen anzeigen
        url += '&has_active=true';
      } else if (tabValue === 2) {
        // Tab 2: Nur Batches mit vernichteten Pflanzen anzeigen
        url += '&has_destroyed=true';
      }
      
      const res = await api.get(url);
      console.log('Geladene Mutterpflanzen-Batches:', res.data);
      
      setMotherBatches(res.data.results || [])
      
      // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
      const total = res.data.count || 0
      const pages = Math.ceil(total / 5) // pageSize ist 5, wie im Backend definiert
      setTotalPages(pages)
      setCurrentPage(page)
      
      // Zähler aus der Antwort übernehmen
      if (res.data.counts) {
        setActivePlantsCount(res.data.counts.active_count || 0);
        setDestroyedPlantsCount(res.data.counts.destroyed_count || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mutterpflanzen-Chargen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Funktion zum Laden der Stecklings-Chargen
  const loadCuttingBatches = async (page = 1) => {
    if (tabValue !== 1) return; // Nur für den Stecklinge-Tab laden (jetzt Tab 1)
    
    setLoading(true);
    try {
      // API-Aufruf für Stecklings-Batches
      let url = `/trackandtrace/cuttingbatches/?page=${page}`;
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Stecklings-Batches:', res.data);
      
      setCuttingBatches(res.data.results || []);
      setTotalPages(Math.ceil((res.data.count || 0) / 5));
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Stecklings-Batches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Verbesserte Funktion zum Laden aller Zähler mit separaten API-Aufrufen
  const loadAllCounts = async () => {
    try {
      // Lade Zähler für aktive Pflanzen
      const activeRes = await api.get('/trackandtrace/motherbatches/counts/?type=active');
      setActiveBatchesCount(activeRes.data.batches_count || 0);
      setActivePlantsCount(activeRes.data.plants_count || 0);
      
      // Lade Zähler für vernichtete Pflanzen
      const destroyedRes = await api.get('/trackandtrace/motherbatches/counts/?type=destroyed');
      setDestroyedBatchesCount(destroyedRes.data.batches_count || 0);
      setDestroyedPlantsCount(destroyedRes.data.plants_count || 0);
      
      // Lade Zähler für Stecklinge
      const cuttingRes = await api.get('/trackandtrace/motherbatches/counts/?type=cutting');
      setCuttingBatchCount(cuttingRes.data.batch_count || 0);
      setCuttingCount(cuttingRes.data.cutting_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
  // Funktion zum Laden von Mitgliedern und Räumen
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true);
    try {
      // Mitglieder laden
      const membersRes = await api.get('members/')
      console.log('Mitglieder geladen:', membersRes.data)
      
      // Formatierte Mitglieder mit display_name
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden
      const roomsRes = await api.get('rooms/')
      console.log('Räume geladen:', roomsRes.data)
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder und Räume:', error)
    } finally {
      setLoadingOptions(false)
    }
  };

  useEffect(() => {
    loadMotherBatches()
    loadAllCounts() // Verbessert: Alle Zähler beim ersten Laden holen
    loadMembersAndRooms() // Mitglieder und Räume laden
  }, [])

  // Aktualisierter useEffect für Tab-Wechsel mit verbesserter Zähler-Logik
  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab unterschiedliche Ladestrategien
    if (tabValue === 0) {
      // Tab 0: Aktive Pflanzen
      loadMotherBatches(1);
    } else if (tabValue === 1) {
      // Tab 1: Stecklinge (jetzt an Position 1)
      loadCuttingBatches(1);
    } else if (tabValue === 2) {
      // Tab 2: Vernichtete Pflanzen (jetzt an Position 2)
      loadMotherBatches(1);
    }
    
    // Verbessert: Lade alle Zähler unabhängig vom Tab
    loadAllCounts();
    
    // Zurücksetzen des expandierten Batches beim Tab-Wechsel
    setExpandedBatchId('');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    // Beim Tab-Wechsel alle geöffneten Akkordeons schließen
    setExpandedBatchId('')
    setBatchPlants({})
    setDestroyedBatchPlants({})
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
      } else if (tabValue === 2) {
        // Im Tab "Vernichtete Pflanzen" (jetzt Tab 2) nur vernichtete Pflanzen laden
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading plants for batch ID:", batchId);
      // Immer aktive Pflanzen laden, unabhängig vom Tab
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
      console.log('Geladene aktive Pflanzen für Batch:', res.data);
      
      // Speichern der Pflanzen für diesen Batch
      // Stelle sicher, dass alle Felder korrekt formatiert sind
      const formattedPlants = (res.data.results || []).map(plant => {
        console.log("Plant batch number:", plant.batch_number);
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
      
      // Bei Fehler leere Daten setzen, um Ladespinner zu beenden
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

  // Separate Funktion zum Laden vernichteter Pflanzen
  const loadDestroyedPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading destroyed plants for batch ID:", batchId);
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
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

  // Angepasste handlePageChange Funktion mit aktualisierter Tab-Logik
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    
    // Je nach Tab die richtige Lademethode aufrufen
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(page); // Für Tab 0 (Aktive) und Tab 2 (Vernichtete)
    } else if (tabValue === 1) {
      loadCuttingBatches(page); // Für Tab 1 (Stecklinge)
    }
  };

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
  }

  // Aktualisierte refreshData Funktion mit verbesserter Zähler-Logik
  const refreshData = () => {
    // Daten je nach aktivem Tab neu laden
    if (expandedBatchId) {
      if (tabValue === 0) {
        loadPlantsForBatch(expandedBatchId, plantsCurrentPage[expandedBatchId] || 1);
      } else if (tabValue === 2) {
        loadDestroyedPlantsForBatch(expandedBatchId, destroyedPlantsCurrentPage[expandedBatchId] || 1);
      }
    }
    
    // Hauptdaten aktualisieren
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(currentPage); // Für Tab 0 (Aktive) und Tab 2 (Vernichtete)
    } else if (tabValue === 1) {
      loadCuttingBatches(currentPage); // Für Tab 1 (Stecklinge)
    }
    
    // Verbessert: Lade alle Zähler unabhängig vom Tab
    loadAllCounts();
  };

  // Aktualisierte getDisplayedData Funktion mit neuer Tab-Logik
  const getDisplayedData = () => {
    if (tabValue === 0 || tabValue === 2) {
      // Tab 0 und 2: Aktive/Vernichtete Pflanzen
      return motherBatches;
    } else if (tabValue === 1) {
      // Tab 1: Konvertiert zu Stecklingen
      return cuttingBatches;
    }
    return [];
  };

  // Aktualisierte handleOpenDestroyDialog Funktion
  const handleOpenDestroyDialog = (batch) => {
    setSelectedBatch(batch);
    setDestroyReason('');
    setDestroyedByMemberId('');
    setOpenDestroyDialog(true);
  };

  // Funktion zum Öffnen des Stecklinge erstellen Dialogs für eine spezifische Mutterpflanze
  const handleOpenCreateCuttingDialog = (batch, plant = null) => {
    setSelectedBatch(batch);
    setSelectedMotherPlant(plant); // Setze die ausgewählte Mutterpflanze
    setCuttingQuantity(1);
    setCuttingNotes('');
    setSelectedMemberId('');
    setSelectedRoomId('');
    setOpenCreateCuttingDialog(true);
  };

  // Funktion zum Erstellen von Stecklingen
  const handleCreateCuttings = async () => {
    try {
      if (!selectedBatch) return;

      // Wenn eine spezifische Mutterpflanze ausgewählt wurde, verwende ihre ID
      const plantId = selectedMotherPlant ? selectedMotherPlant.id : null;
      
      // API-Pfad anpassen, um die plant_id zu verwenden
      const endpoint = selectedMotherPlant 
        ? `/trackandtrace/motherplants/${plantId}/create_cuttings/` 
        : `/trackandtrace/motherbatches/${selectedBatch.id}/create_cuttings/`;

      console.log("Sende Anfrage an:", endpoint);

      await api.post(endpoint, {
        quantity: cuttingQuantity,
        notes: cuttingNotes,
        member_id: selectedMemberId || null,
        room_id: selectedRoomId || null
      });

      setOpenCreateCuttingDialog(false);
      refreshData();
    } catch (error) {
      console.error('Fehler beim Erstellen der Stecklinge:', error);
      console.error('Details:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  // Aktualisierte handleDestroy Funktion
  const handleDestroy = async () => {
    try {
      if (selectedBatch && selectedPlants[selectedBatch.id]?.length > 0) {
        await api.post(`/trackandtrace/motherbatches/${selectedBatch.id}/destroy_plants/`, {
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
        
        // Daten aktualisieren
        refreshData();
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
    loadMotherBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
    if (tabValue === 1) {
      loadCuttingBatches(1) // Auch Stecklings-Batches neu laden, wenn im entsprechenden Tab (jetzt Tab 1)
    }
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    
    // Entsprechend dem aktiven Tab neu laden
    if (tabValue === 0 || tabValue === 2) {
      loadMotherBatches(1) // Für Tab 0 (Aktive) und Tab 2 (Vernichtete)
    } else if (tabValue === 1) {
      loadCuttingBatches(1) // Für Tab 1 (Stecklinge)
    }
  }

  // Die Daten, die in der aktuellen Tabelle angezeigt werden sollen
  const displayedData = getDisplayedData();

  // Aktualisierte Tabs-Definition mit separaten Zählern für Batches und Pflanzen
  const tabs = [
    { label: `CHARGEN / AKTIVE PFLANZEN (${activeBatchesCount}/${activePlantsCount})` },
    { label: `CHARGEN / ZU STECKLINGE (${cuttingBatchCount}/${cuttingCount})` },
    { label: `CHARGEN / VERNICHTETE PFLANZEN (${destroyedBatchesCount}/${destroyedPlantsCount})` }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <PageHeader 
        title="Mutterpflanzen-Verwaltung"
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      
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

      <TabsHeader 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
        tabs={tabs}
        color="primary"
        ariaLabel="Mutterpflanzen-Tabs"
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <MotherPlantTable 
          tabValue={tabValue}
          data={displayedData}
          expandedBatchId={expandedBatchId}
          onExpandBatch={handleAccordionChange}
          onOpenDestroyDialog={handleOpenDestroyDialog}
          onOpenCreateCuttingDialog={handleOpenCreateCuttingDialog}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          batchPlants={batchPlants}
          destroyedBatchPlants={destroyedBatchPlants}
          plantsCurrentPage={plantsCurrentPage}
          plantsTotalPages={plantsTotalPages}
          destroyedPlantsCurrentPage={destroyedPlantsCurrentPage}
          destroyedPlantsTotalPages={destroyedPlantsTotalPages}
          onPlantsPageChange={handlePlantsPageChange}
          onDestroyedPlantsPageChange={handleDestroyedPlantsPageChange}
          selectedPlants={selectedPlants}
          togglePlantSelection={togglePlantSelection}
          selectAllPlantsInBatch={selectAllPlantsInBatch}
        />
      )}

      <DestroyDialog 
        open={openDestroyDialog}
        onClose={() => setOpenDestroyDialog(false)}
        onDestroy={handleDestroy}
        title={selectedPlants[selectedBatch?.id]?.length > 1 
          ? `${selectedPlants[selectedBatch?.id].length} Mutterpflanzen vernichten` 
          : 'Mutterpflanze vernichten'}
        members={members}
        destroyedByMemberId={destroyedByMemberId}
        setDestroyedByMemberId={setDestroyedByMemberId}
        destroyReason={destroyReason}
        setDestroyReason={setDestroyReason}
        showQuantity={false}
      />

      <CreateCuttingDialog 
        open={openCreateCuttingDialog}
        onClose={() => setOpenCreateCuttingDialog(false)}
        onCreateCuttings={handleCreateCuttings}
        quantity={cuttingQuantity}
        setQuantity={setCuttingQuantity}
        notes={cuttingNotes}
        setNotes={setCuttingNotes}
        members={members}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        motherBatch={selectedBatch}
        motherPlant={selectedMotherPlant} // Zusätzliches Prop für die Mutterpflanze
      />
    </Container>
  )
}