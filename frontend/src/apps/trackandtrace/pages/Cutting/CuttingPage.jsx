// frontend/src/apps/trackandtrace/pages/Cutting/CuttingPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import DestroyDialog from '../../components/dialogs/DestroyDialog'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Spezifische Komponenten
import CuttingTable from './components/CuttingTable'

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
  
  // Animationstypen für die verschiedenen Tab-Inhalte
  const [tabAnimation, setTabAnimation] = useState('slide') // 'fade', 'slide', 'grow'
  const [animationDuration, setAnimationDuration] = useState(500)
  
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
  
  // Mitglieder für Vernichtungen
  const [members, setMembers] = useState([])
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')

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

  useEffect(() => {
    loadCuttingBatches()
    loadMembers() // Mitglieder laden
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
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    // Beim Tab-Wechsel alle geöffneten Akkordeons schließen
    setExpandedBatchId('')
    setBatchCuttings({})
    setDestroyedBatchCuttings({})
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
      } else {
        // Im Tab "Vernichtete Stecklinge" nur vernichtete Stecklinge laden
        loadDestroyedCuttingsForBatch(batchId, 1)
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

  const handlePageChange = (event, page) => {
    loadCuttingBatches(page)
  }

  const handleCuttingsPageChange = (batchId, event, page) => {
    loadCuttingsForBatch(batchId, page)
  }

  const handleDestroyedCuttingsPageChange = (batchId, event, page) => {
    loadDestroyedCuttingsForBatch(batchId, page)
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
        } else {
          loadDestroyedCuttingsForBatch(selectedBatch.id, destroyedCuttingsCurrentPage[selectedBatch.id] || 1);
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
  
  // Funktion zum Ändern des Animationstyps
  const changeAnimationType = (type) => {
    setTabAnimation(type);
  }

  // Tabs definieren
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'primary.main', fontWeight: 500 }}>{`(${activeBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'primary.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>AKTIVE STECKLINGE</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'primary.main', fontWeight: 500 }}>{`(${activeCuttingsCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'error.main', fontWeight: 500 }}>{`(${destroyedBatchesCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>VERNICHTETE STECKLINGE</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'error.main', fontWeight: 500 }}>{`(${destroyedCuttingsCount})`}</Typography>
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
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <>
          <AnimatedTabPanel 
            value={tabValue} 
            index={0} 
            animationType={tabAnimation} 
            direction="right" 
            duration={animationDuration}
          >
            <CuttingTable 
              tabValue={0}
              data={cuttingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
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
            animationType={tabAnimation} 
            direction="left" 
            duration={animationDuration}
          >
            <CuttingTable 
              tabValue={1}
              data={cuttingBatches}
              expandedBatchId={expandedBatchId}
              onExpandBatch={handleAccordionChange}
              onOpenDestroyDialog={handleOpenDestroyDialog}
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
    </Container>
  )
}