// frontend/src/apps/trackandtrace/pages/SeedPurchase/SeedPurchasePage.jsx
import { useState, useEffect } from 'react'
import { Container, Button, Box, Typography, Fade } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '../../../../utils/api'

// Gemeinsame Komponenten
import PageHeader from '../../components/common/PageHeader'
import FilterSection from '../../components/common/FilterSection'
import TabsHeader from '../../components/common/TabsHeader'
import LoadingIndicator from '../../components/common/LoadingIndicator'
import AnimatedTabPanel from '../../components/common/AnimatedTabPanel'

// Dialog-Komponenten
import SeedPurchaseForm from './SeedPurchaseForm'
import ConvertDialog from '../../components/dialogs/ConvertDialog'
import DestroyDialog from '../../components/dialogs/DestroyDialog'

// Spezifische Komponenten
import SeedTable from './components/SeedTable'

export default function SeedPurchasePage() {
  const [seeds, setSeeds] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [openConvertDialog, setOpenConvertDialog] = useState(false)
  const [convertType, setConvertType] = useState('')
  const [convertQuantity, setConvertQuantity] = useState(1)
  const [convertNotes, setConvertNotes] = useState('')
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedRows, setSelectedRows] = useState([]) 
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10) // Standard auf 15 gesetzt
  const [totalCount, setTotalCount] = useState(0)
  
  // Optionen für Page Size Dropdown
  const pageSizeOptions = [5, 10, 15, 25, 50]
  
  // Animationstypen für die verschiedenen Tab-Inhalte
  const [tabAnimation, setTabAnimation] = useState('slide') // 'fade', 'slide', 'grow'
  const [animationDuration, setAnimationDuration] = useState(500)
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeSeedCount, setActiveSeedCount] = useState(0)
  const [motherConvertedCount, setMotherConvertedCount] = useState(0)
  const [floweringConvertedCount, setFloweringConvertedCount] = useState(0)
  const [destroyedCount, setDestroyedCount] = useState(0)
  const [destroyQuantity, setDestroyQuantity] = useState(1)
  const [motherBatchCount, setMotherBatchCount] = useState(0)
  const [motherPlantCount, setMotherPlantCount] = useState(0)
  const [floweringBatchCount, setFloweringBatchCount] = useState(0)
  const [floweringPlantCount, setFloweringPlantCount] = useState(0)
  const [totalActiveQuantity, setTotalActiveQuantity] = useState(0)
  const [totalDestroyedQuantity, setTotalDestroyedQuantity] = useState(0)
  
  // Zustand für Blühpflanzen-Batches und Mutterpflanzen-Batches
  const [floweringBatches, setFloweringBatches] = useState([])
  const [motherBatches, setMotherBatches] = useState([])

  // Zustand für Mitglieder und Räume
  const [members, setMembers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // State für die Mitglieder- und Raumauswahl bei Konvertierung
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  // State für die Mitgliederauswahl bei Vernichtung
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Akkordeon-State
  const [expandedSeedId, setExpandedSeedId] = useState('')

  const loadSeeds = async (page = 1) => {
    setLoading(true)
    try {
      // Basisfilter je nach Tab
      let url = `/trackandtrace/seeds/?page=${page}&page_size=${pageSize}`;
      
      // Bei Tab "Vernichtet" nach zerstörten Samen filtern
      if (tabValue === 3) {
        url += '&destroyed=true';
      } else {
        url += '&destroyed=false';
      }
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Samen:', res.data);
      setSeeds(res.data.results || []);
      
      // Gesamtzahl der Einträge setzen für korrekte Paginierung
      const total = res.data.count || 0;
      setTotalCount(total);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil(total / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Samen:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separate Funktion zum Laden der Mutterpflanzen-Batches
  const loadMotherBatches = async (page = 1) => {
    if (tabValue !== 1) return;
    
    setLoading(true);
    try {
      // API-Aufruf für Mutterpflanzen-Batches statt Seeds
      let url = `/trackandtrace/motherbatches/?page=${page}&page_size=${pageSize}`;

      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Mutterpflanzen-Batches:', res.data);
      
      setMotherBatches(res.data.results || []);
      setTotalCount(res.data.count || 0);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil((res.data.count || 0) / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Mutterpflanzen-Batches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Separate Funktion zum Laden der Blühpflanzen-Batches
  const loadFloweringBatches = async (page = 1) => {
    if (tabValue !== 2) return;
    
    setLoading(true);
    try {
      // API-Aufruf für Blühpflanzen-Batches statt Seeds
      let url = `/trackandtrace/floweringbatches/?page=${page}&page_size=${pageSize}`;

      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      const res = await api.get(url);
      console.log('Geladene Blühpflanzen-Batches:', res.data);
      
      setFloweringBatches(res.data.results || []);
      setTotalCount(res.data.count || 0);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil((res.data.count || 0) / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Blühpflanzen-Batches:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Laden von Mitgliedern und Räumen
  const loadMembersAndRooms = async () => {
    setLoadingOptions(true)
    try {
      // Mitglieder laden - mit korrigiertem API-Pfad
      const membersRes = await api.get('members/')
      console.log('Mitglieder für Konvertierungsdialog geladen:', membersRes.data)
      
      // Formatierte Mitglieder mit display_name
      const formattedMembers = membersRes.data.results.map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }))
      setMembers(formattedMembers)
      
      // Räume laden - mit korrigiertem API-Pfad
      const roomsRes = await api.get('rooms/')
      console.log('Räume für Konvertierungsdialog geladen:', roomsRes.data)
      setRooms(roomsRes.data.results || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder und Räume:', error)
    } finally {
      setLoadingOptions(false)
    }
  }
  
  // Separat die Zähler laden (für ALLE Tabs)
  const loadCounts = async () => {
    try {
      const res = await api.get('/trackandtrace/seeds/counts/');
      
      // NUR diese Funktion setzt alle Zähler für die Tab-Beschriftungen
      setActiveSeedCount(res.data.active_seed_count || 0);
      setTotalActiveQuantity(res.data.total_active_seeds_quantity || 0);
      
      setDestroyedCount(res.data.destroyed_count || 0);
      setTotalDestroyedQuantity(res.data.total_destroyed_seeds_quantity || 0);
      
      setMotherBatchCount(res.data.mother_batch_count || 0);
      setMotherPlantCount(res.data.mother_plant_count || 0);
      setFloweringBatchCount(res.data.flowering_batch_count || 0);
      setFloweringPlantCount(res.data.flowering_plant_count || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Zähler:', error);
    }
  };

  // Aktualisieren der Seite nach einer Aktion
  const refreshData = () => {
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(currentPage);
    } else if (tabValue === 1) {
      loadMotherBatches(currentPage);
    } else if (tabValue === 2) {
      loadFloweringBatches(currentPage);
    }
    
    loadCounts();
  };

  // Handler für Änderung der Anzahl der Einträge pro Seite
  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    
    // pageSize-State aktualisieren und zurück zur ersten Seite
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    // Verzögerung hinzufügen, um sicherzustellen, dass der State aktualisiert ist
    // bevor die Daten geladen werden
    setTimeout(() => {
      // Daten mit neuer Seitengröße laden
      if (tabValue === 0 || tabValue === 3) {
        // Direktes Erstellen der URL mit dem neuen pageSize
        let url = `/trackandtrace/seeds/?page=1&page_size=${newPageSize}`;
        
        // Bei Tab "Vernichtet" nach zerstörten Samen filtern
        if (tabValue === 3) {
          url += '&destroyed=true';
        } else {
          url += '&destroyed=false';
        }
        
        // Zeitfilter hinzufügen, wenn vorhanden
        if (yearFilter) url += `&year=${yearFilter}`;
        if (monthFilter) url += `&month=${monthFilter}`;
        if (dayFilter) url += `&day=${dayFilter}`;
        
        console.log("Sende API-Anfrage:", url);
        setLoading(true);
        
        api.get(url)
          .then(res => {
            console.log('Geladene Samen mit neuer pageSize:', res.data);
            setSeeds(res.data.results || []);
            
            // Gesamtzahl der Einträge setzen für korrekte Paginierung
            const total = res.data.count || 0;
            setTotalCount(total);
            
            // Gesamtzahl der Seiten berechnen
            const pages = Math.ceil(total / newPageSize);
            setTotalPages(pages);
          })
          .catch(error => {
            console.error('Fehler beim Laden der Samen:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (tabValue === 1) {
        // Ähnliche Anpassung für Mutterpflanzen-Batches
        let url = `/trackandtrace/motherbatches/?page=1&page_size=${newPageSize}`;
        
        // Zeitfilter hinzufügen, wenn vorhanden
        if (yearFilter) url += `&year=${yearFilter}`;
        if (monthFilter) url += `&month=${monthFilter}`;
        if (dayFilter) url += `&day=${dayFilter}`;
        
        console.log("Sende API-Anfrage:", url);
        setLoading(true);
        
        api.get(url)
          .then(res => {
            console.log('Geladene Mutterpflanzen-Batches mit neuer pageSize:', res.data);
            setMotherBatches(res.data.results || []);
            setTotalCount(res.data.count || 0);
            
            // Gesamtzahl der Seiten berechnen
            const pages = Math.ceil((res.data.count || 0) / newPageSize);
            setTotalPages(pages);
          })
          .catch(error => {
            console.error('Fehler beim Laden der Mutterpflanzen-Batches:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (tabValue === 2) {
        // Und für Blühpflanzen-Batches
        let url = `/trackandtrace/floweringbatches/?page=1&page_size=${newPageSize}`;
        
        // Zeitfilter hinzufügen, wenn vorhanden
        if (yearFilter) url += `&year=${yearFilter}`;
        if (monthFilter) url += `&month=${monthFilter}`;
        if (dayFilter) url += `&day=${dayFilter}`;
        
        console.log("Sende API-Anfrage:", url);
        setLoading(true);
        
        api.get(url)
          .then(res => {
            console.log('Geladene Blühpflanzen-Batches mit neuer pageSize:', res.data);
            setFloweringBatches(res.data.results || []);
            setTotalCount(res.data.count || 0);
            
            // Gesamtzahl der Seiten berechnen
            const pages = Math.ceil((res.data.count || 0) / newPageSize);
            setTotalPages(pages);
          })
          .catch(error => {
            console.error('Fehler beim Laden der Blühpflanzen-Batches:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, 0);
  };

  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    
    // Je nach Tab unterschiedliche Ladestrategien für Tabellendaten
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
    
    // Zurücksetzen des expandierten Seeds beim Tab-Wechsel
    setExpandedSeedId('');
  }, [tabValue, pageSize]);
  
  // Mitglieder und Räume beim ersten Laden abrufen
  useEffect(() => {
    loadMembersAndRooms();
  }, []);
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    
    // Je nach Tab die richtige Lademethode aufrufen
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(page);
    } else if (tabValue === 1) {
      loadMotherBatches(page);
    } else if (tabValue === 2) {
      loadFloweringBatches(page);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSelectedRows([]) // Zurücksetzen der ausgewählten Zeilen beim Tab-Wechsel
  }
  
  const handleAccordionChange = (seedId) => {
    if (expandedSeedId === seedId) {
      setExpandedSeedId('')
    } else {
      setExpandedSeedId(seedId)
    }
  }

  const handleOpenConvertDialog = (seed, type, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setConvertType(type)
    setConvertQuantity(1)
    setConvertNotes('')
    setSelectedMemberId('')
    setSelectedRoomId('')
    setOpenConvertDialog(true)
  }

  const handleConvert = async () => {
    if (!selectedSeed || !convertType) return

    try {
      const endpoint = convertType === 'mother' 
        ? `/trackandtrace/seeds/${selectedSeed.id}/convert_to_mother/`
        : `/trackandtrace/seeds/${selectedSeed.id}/convert_to_flower/`

      await api.post(endpoint, {
        quantity: convertQuantity,
        notes: convertNotes,
        member_id: selectedMemberId || null,
        room_id: selectedRoomId || null
      })

      setOpenConvertDialog(false)
      refreshData()
    } catch (error) {
      console.error('Fehler bei der Konvertierung:', error)
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten')
    }
  }

  const handleOpenDestroyDialog = (seed, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setDestroyReason('')
    setDestroyQuantity(1)
    setDestroyedByMemberId('')
    setOpenDestroyDialog(true)
  }
  
  const handleOpenEditForm = (seed, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedSeed(seed)
    setOpenForm(true)
  }

  const handleDestroy = async () => {
    try {
      if (selectedSeed) {
        // Einzelnen Samen vernichten (teilweise oder komplett)
        await api.post(`/trackandtrace/seeds/${selectedSeed.id}/destroy_seed/`, {
          reason: destroyReason,
          quantity: destroyQuantity,
          destroyed_by_id: destroyedByMemberId || null
        });
      }

      setOpenDestroyDialog(false);
      setSelectedSeed(null);
      refreshData();
    } catch (error) {
      console.error('Fehler bei der Vernichtung:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  }
  
  const handleFilterApply = () => {
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setShowFilters(false)
    
    if (tabValue === 0 || tabValue === 3) {
      loadSeeds(1);
    } else if (tabValue === 1) {
      loadMotherBatches(1);
    } else if (tabValue === 2) {
      loadFloweringBatches(1);
    }
    
    loadCounts();
  }
  
  // Funktion zum Ändern des Animationstyps
  const changeAnimationType = (type) => {
    setTabAnimation(type);
  }

  // Funktion, die die anzuzeigenden Daten basierend auf dem Tab zurückgibt
  const getDisplayedData = () => {
    if (tabValue === 0) {
      // Tab 0: Aktive Samen - nur Samen mit verbleibender Menge > 0
      return seeds.filter(seed => seed.remaining_quantity > 0);
    } else if (tabValue === 1) {
      // Tab 1: Zu Mutterpflanzen - verwende die separat geladenen Mutterpflanzen-Batches
      return motherBatches;
    } else if (tabValue === 2) {
      // Tab 2: Zu Blühpflanzen - verwende die separat geladenen Blühpflanzen-Batches
      return floweringBatches;
    } else {
      // Tab 3: Vernichtet - keine weitere Filterung nötig
      return seeds;
    }
  };
  
  // Die Daten, die in der aktuellen Tabelle angezeigt werden sollen
  const displayedData = getDisplayedData();

  // Tabs definieren
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${activeSeedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>AKTIVE SAMEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${totalActiveQuantity})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${motherBatchCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>ZU MUTTERPFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${motherPlantCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${floweringBatchCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'success.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>ZU BLÜHPFLANZEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'success.main', fontWeight: 500 }}>{`(${floweringPlantCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>CHARGEN</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'error.main', fontWeight: 500 }}>{`(${destroyedCount})`}</Typography>
          <ArrowForwardIcon sx={{ mx: 0.5, fontSize: 14, color: 'error.main' }} />
          <Typography component="span" sx={{ fontWeight: 'bold' }}>VERNICHTET</Typography>
          <Typography component="span" sx={{ mx: 0.5, color: 'error.main', fontWeight: 500 }}>{`(${totalDestroyedQuantity})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Samen-Verwaltung"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            actions={
              tabValue === 0 && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => {
                    setSelectedSeed(null)
                    setOpenForm(true)
                  }}
                >
                  NEUER SAMEN
                </Button>
              )
            }
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
        ariaLabel="Samen-Tabs"
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
            <SeedTable 
              tabValue={0}
              data={displayedData}
              expandedSeedId={expandedSeedId}
              onExpandSeed={handleAccordionChange}
              onOpenConvertDialog={handleOpenConvertDialog}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenEditForm={handleOpenEditForm}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={pageSizeOptions}
              totalCount={totalCount}
            />
          </AnimatedTabPanel>

          <AnimatedTabPanel 
            value={tabValue} 
            index={1} 
            animationType={tabAnimation} 
            direction="up" 
            duration={animationDuration}
          >
            <SeedTable 
              tabValue={1}
              data={displayedData}
              expandedSeedId={expandedSeedId}
              onExpandSeed={handleAccordionChange}
              onOpenConvertDialog={handleOpenConvertDialog}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenEditForm={handleOpenEditForm}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={pageSizeOptions}
              totalCount={totalCount}
            />
          </AnimatedTabPanel>

          <AnimatedTabPanel 
            value={tabValue} 
            index={2} 
            animationType={tabAnimation} 
            direction="up" 
            duration={animationDuration}
          >
            <SeedTable 
              tabValue={2}
              data={displayedData}
              expandedSeedId={expandedSeedId}
              onExpandSeed={handleAccordionChange}
              onOpenConvertDialog={handleOpenConvertDialog}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenEditForm={handleOpenEditForm}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={pageSizeOptions}
              totalCount={totalCount}
            />
          </AnimatedTabPanel>

          <AnimatedTabPanel 
            value={tabValue} 
            index={3} 
            animationType={tabAnimation} 
            direction="left" 
            duration={animationDuration}
          >
            <SeedTable 
              tabValue={3}
              data={displayedData}
              expandedSeedId={expandedSeedId}
              onExpandSeed={handleAccordionChange}
              onOpenConvertDialog={handleOpenConvertDialog}
              onOpenDestroyDialog={handleOpenDestroyDialog}
              onOpenEditForm={handleOpenEditForm}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={pageSizeOptions}
              totalCount={totalCount}
            />
          </AnimatedTabPanel>
        </>
      )}

      <Fade in={openForm} timeout={500}>
        <div style={{ display: openForm ? 'block' : 'none' }}>
          <SeedPurchaseForm
            open={openForm}
            onClose={() => {
              setOpenForm(false)
              setSelectedSeed(null)
            }}
            onSuccess={() => {
              setOpenForm(false)
              setSelectedSeed(null)
              refreshData()
            }}
            initialData={selectedSeed || {}}
          />
        </div>
      </Fade>

      <Fade in={openConvertDialog} timeout={500}>
        <div style={{ display: openConvertDialog ? 'block' : 'none' }}>
          <ConvertDialog 
            open={openConvertDialog}
            onClose={() => setOpenConvertDialog(false)}
            onConvert={handleConvert}
            type={convertType}
            quantity={convertQuantity}
            setQuantity={setConvertQuantity}
            notes={convertNotes}
            setNotes={setConvertNotes}
            members={members}
            selectedMemberId={selectedMemberId}
            setSelectedMemberId={setSelectedMemberId}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            maxQuantity={selectedSeed?.remaining_quantity || 1}
          />
        </div>
      </Fade>

      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title="Samen vernichten"
            members={members}
            destroyedByMemberId={destroyedByMemberId}
            setDestroyedByMemberId={setDestroyedByMemberId}
            destroyReason={destroyReason}
            setDestroyReason={setDestroyReason}
            quantity={destroyQuantity}
            setQuantity={setDestroyQuantity}
            showQuantity={tabValue === 0}
            maxQuantity={selectedSeed?.remaining_quantity || 1}
          />
        </div>
      </Fade>
    </Container>
  )
}