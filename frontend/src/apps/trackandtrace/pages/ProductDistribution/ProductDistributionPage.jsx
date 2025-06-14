// frontend/src/apps/trackandtrace/pages/ProductDistribution/ProductDistributionPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Container, Box, Typography, Fade, Paper, Tabs, Tab } from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import HistoryIcon from '@mui/icons-material/History'
import AssignmentIcon from '@mui/icons-material/Assignment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import api from '@/utils/api'

// Gemeinsame Komponenten
import PageHeader from '@/components/common/PageHeader'
import FilterSection from '@/components/common/FilterSection'
import LoadingIndicator from '@/components/common/LoadingIndicator'

// Spezifische Komponenten
import NewDistribution from './components/NewDistribution/NewDistribution'
import DistributionHistory from './components/DistributionHistory/DistributionHistory'
import DistributionAnalytics from './components/DistributionAnalytics/DistributionAnalytics'

// Custom TabPanel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`distribution-tabpanel-${index}`}
      aria-labelledby={`distribution-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

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
  
  return (
    <Container maxWidth="xl" sx={{ 
      width: '100%',
      py: 1,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 200px)'
    }}>
      <PageHeader 
        title="Cannabis Produktausgabe an Mitglieder der Anbauvereinigung"
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        sx={{ flexShrink: 0 }}
      />
      
      {/* Wrapper für Statistik-Karten und Tabs */}
      <Box sx={{ 
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0
      }}>
        {/* Statistik-Karten */}
        <Paper sx={{ 
          p: 3, 
          mb: 0,
          flexShrink: 0,
          borderRadius: '8px 8px 0 0',
          borderBottom: '3px solid',
          borderBottomColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
          border: '2px solid',
          borderColor: (theme) => theme.palette.divider,
          borderBottomWidth: '3px'
        }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3
        }}>
          {/* Ausgaben */}
          <Box sx={{ 
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #c8e6c9',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)',
              borderColor: '#66bb6a'
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
                color: '#66bb6a',
                opacity: 0.6
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                {statistics.todayCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ausgaben heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: '#f1f8e9',
              borderTop: '1px solid #dcedc8'
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: '1px solid #dcedc8'
              }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
                  {statistics.monthCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
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
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #c8e6c9',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)',
              borderColor: '#66bb6a'
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
                color: '#66bb6a',
                opacity: 0.6
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                {statistics.todayWeight}g
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gesamtmenge heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: '#f1f8e9',
              borderTop: '1px solid #dcedc8'
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: '1px solid #dcedc8'
              }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
                  {statistics.monthWeight}g
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
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
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #c8e6c9',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)'
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
                color: '#66bb6a',
                opacity: 0.6
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                {statistics.todayActiveMembers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aktive Mitglieder heute
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: '#f1f8e9',
              borderTop: '1px solid #dcedc8'
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: '1px solid #dcedc8'
              }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
                  {statistics.monthActiveMembers}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Monat
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
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
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #c8e6c9',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)'
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
                color: '#66bb6a',
                opacity: 0.6
              }} />
              
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                {statistics.availableUnits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Verfügbare Einheiten
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              bgcolor: '#f1f8e9',
              borderTop: '1px solid #dcedc8'
            }}>
              <Box sx={{ 
                p: 0.75, 
                textAlign: 'center',
                borderRight: '1px solid #dcedc8'
              }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
                  {statistics.marijuanaDistributed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Marihuana heute
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="#558b2f">
                  {statistics.hashishDistributed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Haschisch heute
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Filter Section */}
      {showFilters && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
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
            additionalFilters={
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                {/* Zusätzliche Filter können hier eingefügt werden */}
              </Box>
            }
          />
        </Box>
      )}
      
      {/* Tabs und Content */}
      <Paper sx={{ 
        width: '100%'
      }}>
<Box
  sx={{
    borderBottom: '2px solid',
    borderColor: 'divider',
    flexShrink: 0,
    backgroundColor: 'background.paper'
  }}
>
  <Tabs
    value={tabValue}
    onChange={handleTabChange}
    variant="fullWidth"
    TabIndicatorProps={{
      sx: {
        height: '4px',
        backgroundColor: 'primary.main',
        borderRadius: 0,
      }
    }}
    sx={{
      '& .MuiTabs-flexContainer': {
        borderBottom: '2px solid',
        borderColor: 'divider',
      },
      '& .MuiTab-root': {
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.95rem',
        minHeight: 44,
        px: 3,
        py: 1.5,
        borderRadius: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': {
          borderRight: 'none'
        },
        '&.Mui-selected': {
          color: 'primary.main',
        },
        '&:not(.Mui-selected)': {
          color: 'text.secondary',
        },
      },
      '& .MuiTabScrollButton-root': {
        borderRadius: 0,
      }
    }}
  >
    <Tab
      disableRipple
      icon={<LocalShippingIcon sx={{ fontSize: 22 }} />}
      iconPosition="start"
      label={`NEUE AUSGABE (${availableUnits.length} verfügbar)`}
    />
    <Tab
      disableRipple
      icon={<HistoryIcon sx={{ fontSize: 22 }} />}
      iconPosition="start"
      label={`AUSGABENHISTORIE (${statistics.todayCount} heute)`}
    />
    <Tab
      disableRipple
      icon={<AssignmentIcon sx={{ fontSize: 22 }} />}
      iconPosition="start"
      label="ANALYSEN"
    />
  </Tabs>
</Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <LoadingIndicator />
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            // Elegante Scrollbar-Styles
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f5f5f5',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c0c0c0',
              borderRadius: '4px',
              transition: 'background 0.2s',
              '&:hover': {
                background: '#999',
              },
            },
          }}>
            <TabPanel value={tabValue} index={0}>
              <NewDistribution 
                members={members}
                rooms={rooms}
                availableUnits={availableUnits}
                onSuccess={refreshData}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <DistributionHistory 
                distributions={distributions}
                members={members}
                onRefresh={loadDistributions}
                recipientFilter={recipientFilter}
                setRecipientFilter={setRecipientFilter}
                distributorFilter={distributorFilter}
                setDistributorFilter={setDistributorFilter}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <DistributionAnalytics 
                distributions={distributions}
                statistics={statistics}
              />
            </TabPanel>
          </Box>
        )}
        </Paper>
      </Box>
    </Container>
  )
}