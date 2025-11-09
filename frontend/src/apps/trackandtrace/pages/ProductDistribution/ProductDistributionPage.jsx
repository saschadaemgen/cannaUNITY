// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Typography, Fade, Paper, Tabs, Tab, alpha, Button } from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import HistoryIcon from '@mui/icons-material/History'
import AssignmentIcon from '@mui/icons-material/Assignment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import FilterListIcon from '@mui/icons-material/FilterList'
import api from '@/utils/api'

// Gemeinsame Komponenten
import TabsHeader from '@/components/common/TabsHeader'
import FilterSection from '@/components/common/FilterSection'
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
  
  // Animationseinstellungen mit neuem Hook abrufen
  const animSettings = useAnimationSettings('slide', 500, true);
  
  // Statistiken
  const [statistics, setStatistics] = useState({
    // Heute
    todayCount: 0,
    todayWeight: 0,
    todayActiveMembers: 0,
    // Monat
    monthCount: 0,
    monthWeight: 0,
    monthActiveMembers: 0,
    // Jahr  
    yearCount: 0,
    yearWeight: 0,
    yearActiveMembers: 0,
    // Sonstige
    availableUnits: 0,
    marijuanaDistributed: 0,
    hashishDistributed: 0
  })

  // KORRIGIERT: Refs um mehrfache Aufrufe zu verhindern
  const loadingRef = useRef(false)
  const baseDataLoadedRef = useRef(false)
  
  // KORRIGIERT: Basis-Daten laden mit Guards und parallelen Aufrufen
  const loadBaseData = useCallback(async () => {
    // Verhindere mehrfache gleichzeitige Aufrufe
    if (loadingRef.current || baseDataLoadedRef.current) {
      console.log('🔒 Sir, Basis-Daten werden bereits geladen oder sind geladen')
      return
    }
    
    loadingRef.current = true
    setLoading(true)
    console.log('🚀 Sir, lade Basis-Daten...')
    
    try {
      // KORRIGIERT: Parallele API-Aufrufe für bessere Performance
      const [membersRes, roomsRes, unitsRes] = await Promise.all([
        api.get('/members/?limit=1000'),
        api.get('/rooms/'),
        api.get('/trackandtrace/distributions/available_units/')
      ])
      
      console.log('✅ Sir, Basis-Daten geladen')
      
      // State updates batchen
      const membersData = membersRes.data.results || membersRes.data || []
      const roomsData = roomsRes.data.results || roomsRes.data || []
      const unitsData = unitsRes.data || []
      
      setMembers(membersData)
      setRooms(roomsData)
      setAvailableUnits(unitsData)
      
      // Setze die Anzahl der verfügbaren Einheiten in den Statistiken
      setStatistics(prev => ({
        ...prev,
        availableUnits: unitsData.length
      }))
      
      baseDataLoadedRef.current = true
      
      // Statistiken nur einmal laden, wenn noch nicht geladen
      if (statistics.todayCount === 0) {
        console.log('📊 Sir, lade Statistiken...')
        await loadStatisticsOnce()
      }
      
    } catch (error) {
      console.error('❌ Sir, Fehler beim Laden der Basisdaten:', error)
      baseDataLoadedRef.current = false
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, []) // KORRIGIERT: Leere Dependencies, da alle nötigen Daten intern verwaltet werden
  
  // KORRIGIERT: Statistiken laden - nur einmalig
  const loadStatisticsOnce = useCallback(async () => {
    try {
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1
      const day = today.getDate()
      
      console.log('📈 Sir, lade Statistiken für:', { year, month, day })
      
      // Lade Daten für verschiedene Zeiträume parallel
      const [todayRes, monthRes, yearRes] = await Promise.all([
        // Heute
        api.get(`/trackandtrace/distributions/?year=${year}&month=${month}&day=${day}`),
        // Dieser Monat
        api.get(`/trackandtrace/distributions/?year=${year}&month=${month}`),
        // Dieses Jahr
        api.get(`/trackandtrace/distributions/?year=${year}`)
      ])
      
      const todayDistributions = todayRes.data.results || todayRes.data || []
      const monthDistributions = monthRes.data.results || monthRes.data || []
      const yearDistributions = yearRes.data.results || yearRes.data || []
      
      // Berechnungen für heute
      const todayWeight = todayDistributions.reduce((sum, dist) => sum + (dist.total_weight || 0), 0)
      const todayActiveMembers = new Set(todayDistributions.map(d => d.recipient?.id)).size
      
      // Berechnungen für diesen Monat
      const monthWeight = monthDistributions.reduce((sum, dist) => sum + (dist.total_weight || 0), 0)
      const monthActiveMembers = new Set(monthDistributions.map(d => d.recipient?.id)).size
      
      // Berechnungen für dieses Jahr
      const yearWeight = yearDistributions.reduce((sum, dist) => sum + (dist.total_weight || 0), 0)
      const yearActiveMembers = new Set(yearDistributions.map(d => d.recipient?.id)).size
      
      setStatistics(prev => ({
        // Heute
        todayCount: todayDistributions.length,
        todayWeight: todayWeight.toFixed(2),
        todayActiveMembers: todayActiveMembers,
        // Monat
        monthCount: monthDistributions.length,
        monthWeight: monthWeight.toFixed(2),
        monthActiveMembers: monthActiveMembers,
        // Jahr
        yearCount: yearDistributions.length,
        yearWeight: yearWeight.toFixed(2),
        yearActiveMembers: yearActiveMembers,
        // Sonstige - behalte vorherigen Wert für availableUnits
        availableUnits: prev.availableUnits || 0,
        marijuanaDistributed: todayDistributions.filter(d => 
          d.product_type_summary?.some(p => p.type.includes('Marihuana'))
        ).length,
        hashishDistributed: todayDistributions.filter(d => 
          d.product_type_summary?.some(p => p.type.includes('Haschisch'))
        ).length
      }))
      
      console.log('✅ Sir, Statistiken geladen')
      
    } catch (error) {
      console.error('❌ Sir, Fehler beim Laden der Statistiken:', error)
    }
  }, [])
  
  // KORRIGIERT: Historie laden nur bei Bedarf
  const loadDistributions = useCallback(async () => {
    try {
      let url = '/trackandtrace/distributions/?'
      
      // Filter anwenden
      if (yearFilter) url += `year=${yearFilter}&`
      if (monthFilter) url += `month=${monthFilter}&`
      if (dayFilter) url += `day=${dayFilter}&`
      if (recipientFilter) url += `recipient_id=${recipientFilter}&`
      if (distributorFilter) url += `distributor_id=${distributorFilter}&`
      
      console.log('📜 Sir, lade Distributionen:', url)
      
      const res = await api.get(url)
      setDistributions(res.data.results || res.data || [])
    } catch (error) {
      console.error('❌ Sir, Fehler beim Laden der Distributionen:', error)
    }
  }, [yearFilter, monthFilter, dayFilter, recipientFilter, distributorFilter])
  
  // KORRIGIERT: Initialer Load nur einmal
  useEffect(() => {
    if (!baseDataLoadedRef.current && !loadingRef.current) {
      console.log('🎯 Sir, starte initialen Daten-Load...')
      loadBaseData()
    }
  }, [loadBaseData])
  
  // KORRIGIERT: Distributionen nur laden wenn Tab 1 aktiv ist
  useEffect(() => {
    if (tabValue === 1 && baseDataLoadedRef.current) {
      console.log('📋 Sir, lade Distributionen für Historie-Tab...')
      loadDistributions()
    }
  }, [tabValue, loadDistributions])
  
  const handleTabChange = (event, newValue) => {
    console.log('🏷️ Sir, Tab gewechselt zu:', newValue)
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
  
  // KORRIGIERT: Refresh-Funktion optimiert
  const refreshData = useCallback(async () => {
    console.log('🔄 Sir, aktualisiere Daten...')
    
    // Nur Statistiken und Units neu laden, nicht alles
    try {
      const unitsRes = await api.get('/trackandtrace/distributions/available_units/')
      const unitsData = unitsRes.data || []
      setAvailableUnits(unitsData)
      
      setStatistics(prev => ({
        ...prev,
        availableUnits: unitsData.length
      }))
      
      // Statistiken neu laden
      await loadStatisticsOnce()
      
      // Distributionen nur neu laden wenn History-Tab aktiv
      if (tabValue === 1) {
        await loadDistributions()
      }
      
      console.log('✅ Sir, Daten aktualisiert')
      
    } catch (error) {
      console.error('❌ Sir, Fehler beim Aktualisieren:', error)
    }
  }, [tabValue, loadDistributions, loadStatisticsOnce])

  const tabs = [
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NEUE AUSGABE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${availableUnits.length} verfügbar)`}</Typography>
        </Box>
      ) 
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AUSGABENHISTORIE</Typography>
          <Typography component="span" sx={{ mx: 0.3, color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{`(${statistics.todayCount} heute)`}</Typography>
        </Box>
      )
    },
    { 
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ANALYSEN</Typography>
        </Box>
      )
    }
  ];
  
  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header mit Titel */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Cannabis Produktausgabe an Mitglieder
        </Typography>
        
        {/* Filter-Button oben rechts - nur für Tab 1 sichtbar */}
        {tabValue === 1 && (
          <Box
            sx={{
              border: theme => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.action.hover, 0.08),
                borderColor: theme => theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon />}
              sx={{ 
                textTransform: 'none', 
                color: 'text.primary',
                fontSize: '0.875rem'
              }}
            >
              {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Statistik-Karten im neuen Design */}
      <Box sx={{ 
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        flexShrink: 0
      }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 2
        }}>
          {/* Ausgaben */}
          <Box sx={{ 
            bgcolor: theme => alpha(theme.palette.success.main, 0.04),
            borderRadius: 1,
            overflow: 'hidden',
            border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: theme => alpha(theme.palette.success.main, 0.3)
            }
          }}>
            <Box sx={{ 
              p: 1.5,
              position: 'relative'
            }}>
              <LocalShippingIcon sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                fontSize: 24,
                color: 'success.main',
                opacity: 0.3
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {statistics.todayCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ausgaben heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: theme => alpha(theme.palette.success.main, 0.04),
              borderTop: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
              }}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {statistics.monthCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {statistics.yearCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Jahr
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Gesamtmenge */}
          <Box sx={{ 
            bgcolor: theme => alpha(theme.palette.success.main, 0.04),
            borderRadius: 1,
            overflow: 'hidden',
            border: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: theme => alpha(theme.palette.success.main, 0.3)
            }
          }}>
            <Box sx={{ 
              p: 1.5,
              position: 'relative'
            }}>
              <LocalFloristIcon sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                fontSize: 24,
                color: 'success.main',
                opacity: 0.3
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {statistics.todayWeight}g
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gesamtmenge heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: theme => alpha(theme.palette.success.main, 0.04),
              borderTop: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: theme => `1px solid ${alpha(theme.palette.success.main, 0.12)}`
              }}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {statistics.monthWeight}g
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {statistics.yearWeight}g
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Jahr
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Aktive Mitglieder */}
          <Box sx={{ 
            bgcolor: theme => alpha(theme.palette.info.main, 0.04),
            borderRadius: 1,
            overflow: 'hidden',
            border: theme => `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: theme => alpha(theme.palette.info.main, 0.3)
            }
          }}>
            <Box sx={{ 
              p: 1.5,
              position: 'relative'
            }}>
              <PeopleIcon sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                fontSize: 24,
                color: 'info.main',
                opacity: 0.3
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {statistics.todayActiveMembers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aktive Mitglieder heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: theme => alpha(theme.palette.info.main, 0.04),
              borderTop: theme => `1px solid ${alpha(theme.palette.info.main, 0.12)}`
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: theme => `1px solid ${alpha(theme.palette.info.main, 0.12)}`
              }}>
                <Typography variant="body2" fontWeight="bold" color="info.main">
                  {statistics.monthActiveMembers}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="info.main">
                  {statistics.yearActiveMembers}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Jahr
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Verfügbare Einheiten */}
          <Box sx={{ 
            bgcolor: theme => alpha(theme.palette.warning.main, 0.04),
            borderRadius: 1,
            overflow: 'hidden',
            border: theme => `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: theme => alpha(theme.palette.warning.main, 0.3)
            }
          }}>
            <Box sx={{ 
              p: 1.5,
              position: 'relative'
            }}>
              <InventoryIcon sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                fontSize: 24,
                color: 'warning.main',
                opacity: 0.3
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {statistics.availableUnits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Verfügbare Einheiten
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: theme => alpha(theme.palette.warning.main, 0.04),
              borderTop: theme => `1px solid ${alpha(theme.palette.warning.main, 0.12)}`
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: theme => `1px solid ${alpha(theme.palette.warning.main, 0.12)}`
              }}>
                <Typography variant="body2" fontWeight="bold" color="warning.main">
                  {statistics.marijuanaDistributed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Marihuana heute
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="warning.main">
                  {statistics.hashishDistributed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Haschisch heute
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs - direkt anschließend ohne Lücke */}
      <Box sx={{ flexShrink: 0 }}>
        <TabsHeader 
          tabValue={tabValue} 
          onTabChange={handleTabChange} 
          tabs={tabs}
          color="primary"
          ariaLabel="Produktausgabe-Tabs"
        />
      </Box>

      {/* Hauptinhalt mit Scroll */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <LoadingIndicator />
          </Box>
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <AnimatedTabPanel 
              value={tabValue} 
              index={0} 
              animationType={animSettings.type} 
              direction="right" 
              duration={animSettings.duration}
              sx={{ 
                height: '100%', 
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
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
              sx={{ 
                height: '100%', 
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Filter Section für Historie */}
              {showFilters && tabValue === 1 && (
                <Box sx={{ 
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  flexShrink: 0
                }}>
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
              )}
              
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
              sx={{ 
                height: '100%', 
                p: 3,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
              }}
            >
              <DistributionAnalytics 
                distributions={distributions}
                statistics={statistics}
              />
            </AnimatedTabPanel>
          </Box>
        )}
      </Box>
    </Box>
  )
}