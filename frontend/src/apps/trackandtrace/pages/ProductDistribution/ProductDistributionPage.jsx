// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionPage.jsx
import { useState, useEffect } from 'react'
import { Container, Box, Typography, Fade } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import HistoryIcon from '@mui/icons-material/History'
import AssignmentIcon from '@mui/icons-material/Assignment'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader'
import FilterSection from '@/components/common/FilterSection'
import TabsHeader from '@/components/common/TabsHeader'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import AnimatedTabPanel from '@/components/common/AnimatedTabPanel'

// Spezifische Komponenten
import NewDistribution from './components/NewDistribution/NewDistribution'
import DistributionHistory from './components/DistributionHistory/DistributionHistory'
import DistributionAnalytics from './components/DistributionAnalytics/DistributionAnalytics'

// Animations-Hook importieren
import useAnimationSettings from '@/hooks/useAnimationSettings'

export default function ProductDistributionPage() {
  // States
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  
  // Animationseinstellungen
  const animSettings = useAnimationSettings('slide', 500, true)
  
  // Filter-States
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [distributorFilter, setDistributorFilter] = useState('')
  
  // Daten-States
  const [members, setMembers] = useState([])
  const [rooms, setRooms] = useState([])
  const [availableUnits, setAvailableUnits] = useState([])
  const [distributions, setDistributions] = useState([])
  
  // Statistiken
  const [statistics, setStatistics] = useState({
    todayCount: 0,
    todayWeight: 0,
    activeMembers: 0,
    pendingDistributions: 0,
    marijuanaDistributed: 0,
    hashishDistributed: 0
  })
  
  // Basis-Daten laden
  const loadBaseData = async () => {
    setLoading(true)
    try {
      // Mitglieder laden
      const membersRes = await api.get('/members/?limit=1000')
      setMembers(membersRes.data.results || membersRes.data || [])
      
      // Räume laden
      const roomsRes = await api.get('/rooms/')
      setRooms(roomsRes.data.results || roomsRes.data || [])
      
      // Verfügbare Einheiten laden
      const unitsRes = await api.get('/trackandtrace/distributions/available_units/')
      setAvailableUnits(unitsRes.data || [])
      
      // Statistiken berechnen
      await loadStatistics()
      
    } catch (error) {
      console.error('Fehler beim Laden der Basisdaten:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Statistiken laden
  const loadStatistics = async () => {
    try {
      // Heute's Distributionen
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      const todayRes = await api.get(`/trackandtrace/distributions/?distribution_date__gte=${todayStr}`)
      const todayDistributions = todayRes.data.results || todayRes.data || []
      
      // Berechnungen
      const todayWeight = todayDistributions.reduce((sum, dist) => sum + (dist.total_weight || 0), 0)
      const activeMembers = new Set(todayDistributions.map(d => d.recipient?.id)).size
      
      setStatistics({
        todayCount: todayDistributions.length,
        todayWeight: todayWeight.toFixed(2),
        activeMembers: activeMembers,
        pendingDistributions: 0, // TODO: Implementieren wenn benötigt
        marijuanaDistributed: todayDistributions.filter(d => 
          d.product_type_summary?.some(p => p.type.includes('Marihuana'))
        ).length,
        hashishDistributed: todayDistributions.filter(d => 
          d.product_type_summary?.some(p => p.type.includes('Haschisch'))
        ).length
      })
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }
  
  // Historie laden
  const loadDistributions = async () => {
    try {
      let url = '/trackandtrace/distributions/?'
      
      // Filter anwenden
      if (yearFilter) url += `year=${yearFilter}&`
      if (monthFilter) url += `month=${monthFilter}&`
      if (dayFilter) url += `day=${dayFilter}&`
      if (recipientFilter) url += `recipient_id=${recipientFilter}&`
      if (distributorFilter) url += `distributor_id=${distributorFilter}&`
      
      const res = await api.get(url)
      setDistributions(res.data.results || res.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Distributionen:', error)
    }
  }
  
  useEffect(() => {
    loadBaseData()
  }, [])
  
  useEffect(() => {
    if (tabValue === 1) {
      loadDistributions()
    }
  }, [tabValue, yearFilter, monthFilter, dayFilter, recipientFilter, distributorFilter])
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }
  
  const handleFilterApply = () => {
    if (tabValue === 1) {
      loadDistributions()
    }
  }
  
  const handleFilterReset = () => {
    setYearFilter('')
    setMonthFilter('')
    setDayFilter('')
    setRecipientFilter('')
    setDistributorFilter('')
    if (tabValue === 1) {
      loadDistributions()
    }
  }
  
  const refreshData = () => {
    loadBaseData()
    if (tabValue === 1) {
      loadDistributions()
    }
  }
  
  // Tab-Definitionen mit erweiterten Statistiken
  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon sx={{ fontSize: 18 }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            NEUE AUSGABE
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>
            ({availableUnits.length} verfügbar)
          </Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ fontSize: 18 }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            AUSGABENHISTORIE
          </Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>
            ({statistics.todayCount} heute)
          </Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon sx={{ fontSize: 18 }} />
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            ANALYSEN
          </Typography>
        </Box>
      )
    }
  ]
  
  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box>
          <PageHeader 
            title="Cannabis Produktausgabe an Mitglieder der Anbauvereinigung"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
          
          {/* Erweiterte Statistik-Box */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mb: 3
          }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h4" fontWeight="bold">{statistics.todayCount}</Typography>
              <Typography variant="body2">Ausgaben heute</Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'success.light', 
              color: 'success.contrastText',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h4" fontWeight="bold">{statistics.todayWeight}g</Typography>
              <Typography variant="body2">Gesamtmenge heute</Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'info.light', 
              color: 'info.contrastText',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h4" fontWeight="bold">{statistics.activeMembers}</Typography>
              <Typography variant="body2">Aktive Mitglieder</Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'warning.light', 
              color: 'warning.contrastText',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h4" fontWeight="bold">{availableUnits.length}</Typography>
              <Typography variant="body2">Verfügbare Einheiten</Typography>
            </Box>
          </Box>
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
            // Erweiterte Filter für Distributionen
            additionalFilters={
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                {/* Hier können zusätzliche Filter eingefügt werden */}
              </Box>
            }
          />
        </Box>
      </Fade>
      
      <TabsHeader 
        tabValue={tabValue} 
        onTabChange={handleTabChange} 
        tabs={tabs}
        color="primary"
        ariaLabel="Produktausgabe-Tabs"
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
            <NewDistribution 
              members={members}
              rooms={rooms}
              availableUnits={availableUnits}
              onSuccess={refreshData}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={1} 
            animationType={animSettings.type} 
            direction="up" 
            duration={animSettings.duration}
          >
            <DistributionHistory 
              distributions={distributions}
              members={members}
              onRefresh={loadDistributions}
              recipientFilter={recipientFilter}
              setRecipientFilter={setRecipientFilter}
              distributorFilter={distributorFilter}
              setDistributorFilter={setDistributorFilter}
            />
          </AnimatedTabPanel>
          
          <AnimatedTabPanel 
            value={tabValue} 
            index={2} 
            animationType={animSettings.type} 
            direction="left" 
            duration={animSettings.duration}
          >
            <DistributionAnalytics 
              distributions={distributions}
              statistics={statistics}
            />
          </AnimatedTabPanel>
        </>
      )}
    </Container>
  )
}