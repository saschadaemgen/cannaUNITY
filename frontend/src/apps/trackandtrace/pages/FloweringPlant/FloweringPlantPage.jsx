// frontend/src/apps/trackandtrace/pages/FloweringPlant/FloweringPlantPage.jsx
import { useState, useEffect } from 'react'
import { Container } from '@mui/material'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'

// Spezifische Komponenten
import FloweringPlantTable from './components/FloweringPlantTable'

export default function FloweringPlantPage() {
  const [floweringBatches, setFloweringBatches] = useState([])
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
  
  // Zähler für Tabs
  const [activePlantsCount, setActivePlantsCount] = useState(0)
  const [destroyedPlantsCount, setDestroyedPlantsCount] = useState(0)
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

  const loadFloweringBatches = async (page = 1) => {
    setLoading(true)
    try {
      // URL mit Filtern aufbauen
      let url = `/trackandtrace/floweringbatches/?page=${page}`;
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Blühpflanzen-Batches:', res.data);
      
      setFloweringBatches(res.data.results || [])
      
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
      console.error('Fehler beim Laden der Blühpflanzen-Chargen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separat die Zähler laden (für Tabs, die nicht aktiv sind)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/floweringbatches/counts/');
      setActivePlantsCount(res.data.active_count || 0);
      setDestroyedPlantsCount(res.data.destroyed_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };
  
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

  useEffect(() => {
    loadFloweringBatches()
    loadCounts() // Alle Zähler beim ersten Laden holen
    loadMembers() // Mitglieder laden
  }, [])

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
      } else {
        // Im Tab "Vernichtete Pflanzen" nur vernichtete Pflanzen laden
        loadDestroyedPlantsForBatch(batchId, 1)
      }
    }
  }

  const loadPlantsForBatch = async (batchId, page = 1) => {
    try {
      console.log("Loading plants for batch ID:", batchId);
      // Immer aktive Pflanzen laden, unabhängig vom Tab
      const res = await api.get(`/trackandtrace/floweringbatches/${batchId}/plants/?page=${page}&destroyed=false`)
      
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
      const res = await api.get(`/trackandtrace/floweringbatches/${batchId}/plants/?page=${page}&destroyed=true`)
      
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

  const handlePageChange = (event, page) => {
    loadFloweringBatches(page)
  }

  const handlePlantsPageChange = (batchId, event, page) => {
    loadPlantsForBatch(batchId, page)
  }

  const handleDestroyedPlantsPageChange = (batchId, event, page) => {
    loadDestroyedPlantsForBatch(batchId, page)
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
        await api.post(`/trackandtrace/floweringbatches/${selectedBatch.id}/destroy_plants/`, {
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
        
        loadCounts(); // Zähler aktualisieren
        loadFloweringBatches(currentPage); // Batches neu laden für aktualisierte Zahlen
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
    loadFloweringBatches(1) // Zurück zur ersten Seite bei Filter-Änderung
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    loadFloweringBatches(1) // Zurück zur ersten Seite nach Filter-Reset
  }

  // Tabs definieren
  const tabs = [
    { label: `AKTIVE PFLANZEN (${activePlantsCount})` },
    { label: `VERNICHTETE PFLANZEN (${destroyedPlantsCount})` }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <PageHeader 
        title="Blühpflanzen-Verwaltung"
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
        ariaLabel="Blühpflanzen-Tabs"
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <FloweringPlantTable 
          tabValue={tabValue}
          data={floweringBatches}
          expandedBatchId={expandedBatchId}
          onExpandBatch={handleAccordionChange}
          onOpenDestroyDialog={handleOpenDestroyDialog}
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
          ? `${selectedPlants[selectedBatch?.id].length} Blühpflanzen vernichten` 
          : 'Blühpflanze vernichten'}
        members={members}
        destroyedByMemberId={destroyedByMemberId}
        setDestroyedByMemberId={setDestroyedByMemberId}
        destroyReason={destroyReason}
        setDestroyReason={setDestroyReason}
        showQuantity={false}
      />
    </Container>
  )
}