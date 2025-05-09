// frontend/src/apps/wawi/pages/Strain/StrainPage.jsx
import { useState, useEffect } from 'react'
import { Container, Button, Box, Typography, Fade } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader'
import FilterSection from '@/components/common/FilterSection'
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'

// Dialog-Komponenten
import StrainForm from './StrainForm'
import DestroyDialog from '@/components/dialogs/DestroyDialog'

// Spezifische Komponenten
import StrainTable from './components/StrainTable'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function StrainPage() {
  const [strains, setStrains] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [openDestroyDialog, setOpenDestroyDialog] = useState(false)
  const [destroyReason, setDestroyReason] = useState('')
  const [selectedRows, setSelectedRows] = useState([]) 
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  // Optionen für Page Size Dropdown
  const pageSizeOptions = [5, 10, 15, 25, 50]
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Filter-Zustandsvariablen
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [strainTypeFilter, setStrainTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Zähler für Tabs
  const [activeStrainCount, setActiveStrainCount] = useState(0)
  const [inactiveStrainCount, setInactiveStrainCount] = useState(0)
  const [feminizedCount, setFeminizedCount] = useState(0)
  const [regularCount, setRegularCount] = useState(0)
  const [autoflowerCount, setAutoflowerCount] = useState(0)
  const [f1HybridCount, setF1HybridCount] = useState(0)
  const [cbdCount, setCbdCount] = useState(0)
  
  // Zustand für Mitglieder
  const [members, setMembers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // State für die Mitgliederauswahl bei Vernichtung
  const [destroyedByMemberId, setDestroyedByMemberId] = useState('')
  
  // Akkordeon-State
  const [expandedStrainId, setExpandedStrainId] = useState('')

  const loadStrains = async (page = 1) => {
    setLoading(true)
    try {
      // Basisfilter je nach Tab
      let url = `/wawi/strains/?page=${page}&page_size=${pageSize}`;
      
      // Bei Tab "Inaktiv" nach inaktiven Strains filtern
      if (tabValue === 1) {
        url += '&is_active=false';
      } else {
        url += '&is_active=true';
      }
      
      // Zeitfilter hinzufügen, wenn vorhanden
      if (yearFilter) url += `&year=${yearFilter}`;
      if (monthFilter) url += `&month=${monthFilter}`;
      if (dayFilter) url += `&day=${dayFilter}`;
      
      // Strain-Typ Filter hinzufügen, wenn vorhanden
      if (strainTypeFilter) url += `&strain_type=${strainTypeFilter}`;
      
      // Suchfilter hinzufügen, wenn vorhanden
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await api.get(url);
      console.log('Geladene Strains:', res.data);
      setStrains(res.data.results || []);
      
      // Gesamtzahl der Einträge setzen für korrekte Paginierung
      const total = res.data.count || 0;
      setTotalCount(total);
      
      // Gesamtzahl der Seiten berechnen
      const pages = Math.ceil(total / pageSize);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Fehler beim Laden der Strain-Daten:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Separat die Statistiken laden
  const loadStats = async () => {
    try {
      const res = await api.get('/wawi/strains/stats/');
      
      // Setzt alle Zähler für die Tab-Beschriftungen
      setActiveStrainCount(res.data.active_count || 0);
      setInactiveStrainCount(res.data.inactive_count || 0);
      
      // Strain-Typen Zähler
      setFeminizedCount(res.data.strain_types.feminized || 0);
      setRegularCount(res.data.strain_types.regular || 0);
      setAutoflowerCount(res.data.strain_types.autoflower || 0);
      setF1HybridCount(res.data.strain_types.f1_hybrid || 0);
      setCbdCount(res.data.strain_types.cbd || 0);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  };

  // Aktualisieren der Seite nach einer Aktion
  const refreshData = () => {
    loadStrains(currentPage);
    loadStats();
  };

  // Handler für Änderung der Anzahl der Einträge pro Seite
  const handlePageSizeChange = (newPageSize) => {
    console.log(`Ändere pageSize von ${pageSize} auf ${newPageSize}`);
    setPageSize(newPageSize);
    setCurrentPage(1);
    setTimeout(() => {
      loadStrains(1);
    }, 0);
  };

  useEffect(() => {
    // Zurücksetzen der Seite bei Tab-Wechsel
    setCurrentPage(1);
    loadStrains(1);
    loadStats();
    
    // Zurücksetzen des expandierten Strains beim Tab-Wechsel
    setExpandedStrainId('');
  }, [tabValue, pageSize, strainTypeFilter, searchQuery]);
  
  // Mitglieder beim ersten Laden abrufen
  useEffect(() => {
    const loadMembers = async () => {
      setLoadingOptions(true)
      try {
        const membersRes = await api.get('members/')
        const formattedMembers = membersRes.data.results.map(member => ({
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
    
    loadMembers();
  }, []);
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    loadStrains(page);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSelectedRows([]) // Zurücksetzen der ausgewählten Zeilen beim Tab-Wechsel
  }
  
  const handleAccordionChange = (strainId) => {
    if (expandedStrainId === strainId) {
      setExpandedStrainId('')
    } else {
      setExpandedStrainId(strainId)
    }
  }

  const handleOpenForm = (strain = null) => {
    setSelectedStrain(strain);
    setOpenForm(true);
  }

  const handleOpenDestroyDialog = (strain, event) => {
    // Stoppe das Event-Bubbling, damit sich das Akkordeon nicht öffnet
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedStrain(strain)
    setDestroyReason('')
    setDestroyedByMemberId('')
    setOpenDestroyDialog(true)
  }

  const handleDestroy = async () => {
    try {
      if (selectedStrain) {
        // Deaktiviere einen Strain (nicht löschen)
        await api.patch(`/wawi/strains/${selectedStrain.id}/`, {
          is_active: false
        });
      }

      setOpenDestroyDialog(false);
      setSelectedStrain(null);
      refreshData();
    } catch (error) {
      console.error('Fehler beim Deaktivieren des Strains:', error);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  }
  
  const handleFilterApply = () => {
    loadStrains(1);
    loadStats();
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setStrainTypeFilter('')
    setSearchQuery('')
    setShowFilters(false)
    loadStrains(1);
    loadStats();
  }

  // Die Daten, die in der aktuellen Tabelle angezeigt werden sollen
  const displayedData = strains;

  // Tabs definieren
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AKTIVE SORTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${activeStrainCount})`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>INAKTIVE SORTEN</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'error.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${inactiveStrainCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FEMINISIERT</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${feminizedCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AUTOFLOWER</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${autoflowerCount})`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CBD</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${cbdCount})`}</Typography>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Cannabis-Sorten Verwaltung - Genetik & Eigenschaften"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            actions={
              <Button 
                variant="contained" 
                color="success"
                onClick={() => handleOpenForm(null)}
              >
                NEUE SORTE
              </Button>
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
            
            // Zusätzliche Filter
            strainTypeFilter={strainTypeFilter}
            setStrainTypeFilter={setStrainTypeFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </Box>
      </Fade>

      <TabsHeader 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
        tabs={tabs}
        color="success"
        ariaLabel="Sorten-Tabs"
      />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <AnimatedTabPanel 
          value={tabValue} 
          index={tabValue} 
          animationType={animSettings.type} 
          direction={tabValue === 0 ? "right" : tabValue === 1 ? "left" : "up"} 
          duration={animSettings.duration}
        >
          <StrainTable 
            tabValue={tabValue}
            data={displayedData}
            expandedStrainId={expandedStrainId}
            onExpandStrain={handleAccordionChange}
            onOpenDestroyDialog={handleOpenDestroyDialog}
            onOpenEditForm={handleOpenForm}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
            totalCount={totalCount}
          />
        </AnimatedTabPanel>
      )}

      <Fade in={openForm} timeout={500}>
        <div style={{ display: openForm ? 'block' : 'none' }}>
          <StrainForm
            open={openForm}
            onClose={() => {
              setOpenForm(false)
              setSelectedStrain(null)
            }}
            onSuccess={() => {
              setOpenForm(false)
              setSelectedStrain(null)
              refreshData()
            }}
            initialData={selectedStrain || {}}
            members={members}
          />
        </div>
      </Fade>

      <Fade in={openDestroyDialog} timeout={500}>
        <div style={{ display: openDestroyDialog ? 'block' : 'none' }}>
          <DestroyDialog 
            open={openDestroyDialog}
            onClose={() => setOpenDestroyDialog(false)}
            onDestroy={handleDestroy}
            title="Sorte deaktivieren"
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