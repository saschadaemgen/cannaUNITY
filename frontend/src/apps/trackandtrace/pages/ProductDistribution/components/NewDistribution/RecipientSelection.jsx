// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/RecipientSelection.jsx
import { useState, useEffect } from 'react'
import { 
  Box, Typography, TextField, Autocomplete, Grid, Paper,
  Avatar, Chip, Alert, InputAdornment, Card, CardContent,
  Divider, CircularProgress, LinearProgress, Stack
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import api from '@/utils/api'

// Cannabis-Limits Imports
import { 
  getMemberConsumptionStats,
  getCachedMemberLimits 
} from '../../../../utils/cannabisLimitsApi'
import { 
  formatWeight,
  getConsumptionColor
} from '../../../../utils/cannabisLimits'

// Komponente für Limit-Anzeige
const LimitDisplay = ({ label, consumed, limit, remaining, percentage }) => {
  const color = getConsumptionColor(percentage)
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
        <Typography variant="body2" color={`${color}.main`}>
          {formatWeight(consumed)} / {formatWeight(limit)}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={Math.min(100, percentage)} 
        color={color}
        sx={{ height: 8, borderRadius: 1, mb: 1 }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Verbraucht: {percentage.toFixed(1)}%
        </Typography>
        <Typography 
          variant="caption" 
          color={remaining < 0 ? 'error.main' : 'text.secondary'}
          fontWeight={remaining < 0 ? 'bold' : 'normal'}
        >
          Verfügbar: {formatWeight(Math.abs(remaining))}
        </Typography>
      </Box>
    </Box>
  )
}

export default function RecipientSelection({ members, recipientId, setRecipientId, onLimitsLoaded }) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberHistory, setMemberHistory] = useState(null)
  const [memberLimits, setMemberLimits] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingLimits, setLoadingLimits] = useState(false)

  // **NEU: Synchronisiere selectedMember mit recipientId**
  useEffect(() => {
    if (recipientId && (!selectedMember || selectedMember.id !== recipientId)) {
      const found = members.find(m => m.id === recipientId)
      if (found) setSelectedMember(found)
    }
    if (!recipientId && selectedMember) {
      setSelectedMember(null)
    }
  }, [recipientId, members])
  
  // Lade Mitglieder-Historie und Limits wenn ein Mitglied ausgewählt wird
  useEffect(() => {
    if (recipientId) {
      loadMemberData(recipientId)
    } else {
      setMemberHistory(null)
      setMemberLimits(null)
    }
  }, [recipientId])

  
  const loadMemberData = async (memberId) => {
    setLoadingHistory(true)
    setLoadingLimits(true)
    
    try {
      // Lade Historie
      const res = await api.get(`/trackandtrace/distributions/member_consumption_summary/?member_id=${memberId}`)
      setMemberHistory(res.data)
      
      // Lade Limits und Verbrauchsdaten
      const limitsData = await getCachedMemberLimits(memberId)
      setMemberLimits(limitsData)
      
      // Callback für Parent-Komponente
      if (onLimitsLoaded) {
        onLimitsLoaded(limitsData)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitgliederdaten:', error)
    } finally {
      setLoadingHistory(false)
      setLoadingLimits(false)
    }
  }
  
  const handleMemberSelect = (event, newValue) => {
    setSelectedMember(newValue)
    setRecipientId(newValue?.id || '')
  }
  
  // Formatiere Mitglieder für bessere Anzeige
  const formattedMembers = members.map(member => ({
    ...member,
    displayName: `${member.first_name} ${member.last_name}`,
    searchString: `${member.first_name} ${member.last_name} ${member.email || ''}`.toLowerCase()
  }))
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" />
        Empfänger auswählen
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Wählen Sie das Mitglied aus, das die Cannabis-Produkte erhält. 
        Die Ausgabe wird dokumentiert und dem Mitglied zugeordnet.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Mitgliedersuche
            </Typography>
            
            <Autocomplete
              id="recipient-select"
              options={formattedMembers}
              getOptionLabel={(option) =>
                option?.displayName
                  || [option?.first_name, option?.last_name].filter(Boolean).join(' ')
                  || option?.email
                  || ''
              }
              value={selectedMember}
              onChange={handleMemberSelect}
              filterOptions={(options, { inputValue }) => {
                const searchLower = inputValue.toLowerCase()
                return options.filter(option => 
                  option.searchString.includes(searchLower)
                )
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{option.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email || 'Keine E-Mail hinterlegt'}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Name oder E-Mail eingeben"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              sx={{ mb: 3 }}
            />
            
            {selectedMember && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{selectedMember.displayName}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          icon={<AssignmentIndIcon />}
                          label={selectedMember.email || 'Keine E-Mail'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {memberLimits && (
                          <Chip 
                            label={memberLimits.member.ageClass}
                            size="small"
                            color={memberLimits.member.isU21 ? 'warning' : 'success'}
                            variant="filled"
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Mitglied seit
                      </Typography>
                      <Typography variant="body2">
                        {selectedMember.created_at ? 
                          new Date(selectedMember.created_at).toLocaleDateString('de-DE') : 
                          'Unbekannt'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Aktiv
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Cannabis-Limits Anzeige */}
                  {memberLimits && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Cannabis-Limits
                      </Typography>
                      
                      {loadingLimits ? (
                        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <Box>
                          <LimitDisplay
                            label="Tageslimit"
                            consumed={memberLimits.daily.consumed}
                            limit={memberLimits.daily.limit}
                            remaining={memberLimits.daily.remaining}
                            percentage={memberLimits.daily.percentage}
                          />
                          
                          <LimitDisplay
                            label="Monatslimit"
                            consumed={memberLimits.monthly.consumed}
                            limit={memberLimits.monthly.limit}
                            remaining={memberLimits.monthly.remaining}
                            percentage={memberLimits.monthly.percentage}
                          />
                          
                          {memberLimits.member.isU21 && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                <strong>U21-Beschränkung:</strong> Max. 10% THC-Gehalt
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Ausgabenhistorie & Verbrauch
            </Typography>
            
            {!selectedMember ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 300,
                color: 'text.secondary'
              }}>
                <LocalHospitalIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography variant="body2" align="center">
                  Wählen Sie ein Mitglied aus, um die Ausgabenhistorie anzuzeigen
                </Typography>
              </Box>
            ) : loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : memberHistory && memberLimits ? (
              <Box>
                {/* Verbrauchs-Übersicht */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderColor: getConsumptionColor(memberLimits.daily.percentage) + '.main',
                        borderWidth: 2
                      }}
                    >
                      <Typography variant="h4" color={getConsumptionColor(memberLimits.daily.percentage) + '.main'}>
                        {formatWeight(memberLimits.daily.consumed)}
                      </Typography>
                      <Typography variant="caption">
                        Heute ausgegeben
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        von {formatWeight(memberLimits.daily.limit)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderColor: getConsumptionColor(memberLimits.monthly.percentage) + '.main',
                        borderWidth: 2
                      }}
                    >
                      <Typography variant="h4" color={getConsumptionColor(memberLimits.monthly.percentage) + '.main'}>
                        {formatWeight(memberLimits.monthly.consumed)}
                      </Typography>
                      <Typography variant="caption">
                        Diesen Monat
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        von {formatWeight(memberLimits.monthly.limit)}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Limit-Warnungen */}
                {(memberLimits.daily.percentage >= 80 || memberLimits.monthly.percentage >= 80) && (
                  <Alert 
                    severity={
                      memberLimits.daily.percentage >= 100 || memberLimits.monthly.percentage >= 100 
                        ? 'error' 
                        : 'warning'
                    }
                    sx={{ mb: 2 }}
                    icon={
                      memberLimits.daily.percentage >= 100 || memberLimits.monthly.percentage >= 100
                        ? <ErrorIcon />
                        : <WarningAmberIcon />
                    }
                  >
                    {memberLimits.daily.percentage >= 100 && (
                      <Typography variant="body2">
                        <strong>Tageslimit erreicht!</strong> Keine weiteren Ausgaben heute möglich.
                      </Typography>
                    )}
                    {memberLimits.monthly.percentage >= 100 && (
                      <Typography variant="body2">
                        <strong>Monatslimit erreicht!</strong> Keine weiteren Ausgaben diesen Monat möglich.
                      </Typography>
                    )}
                    {memberLimits.daily.percentage >= 80 && memberLimits.daily.percentage < 100 && (
                      <Typography variant="body2">
                        Tageslimit fast erreicht ({memberLimits.daily.percentage.toFixed(0)}%)
                      </Typography>
                    )}
                    {memberLimits.monthly.percentage >= 80 && memberLimits.monthly.percentage < 100 && (
                      <Typography variant="body2">
                        Monatslimit fast erreicht ({memberLimits.monthly.percentage.toFixed(0)}%)
                      </Typography>
                    )}
                  </Alert>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                {/* Gesamtstatistik */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gesamtausgaben
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {memberHistory.received?.total_count || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gesamtmenge
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {memberHistory.received?.total_weight?.toFixed(2) || '0.00'}g
                    </Typography>
                  </Grid>
                </Grid>
                
                {/* Letzte Ausgaben */}
                <Typography variant="subtitle2" gutterBottom>
                  Letzte Ausgaben (30 Tage)
                </Typography>
                
                {memberHistory.received?.recent_distributions?.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {memberHistory.received.recent_distributions.map((dist, idx) => (
                      <Box 
                        key={dist.id || idx}
                        sx={{ 
                          py: 1, 
                          px: 2, 
                          mb: 1, 
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(dist.distribution_date).toLocaleDateString('de-DE')}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${dist.total_weight?.toFixed(2)}g`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Keine kürzlichen Ausgaben
                  </Typography>
                )}
              </Box>
            ) : memberHistory && !memberLimits ? (
              // Fallback wenn nur Historie geladen wurde
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {memberHistory.received?.total_count || 0}
                      </Typography>
                      <Typography variant="caption">
                        Gesamtausgaben
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {memberHistory.received?.total_weight?.toFixed(2) || '0.00'}g
                      </Typography>
                      <Typography variant="caption">
                        Gesamtmenge
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" gutterBottom>
                  Letzte Ausgaben (30 Tage)
                </Typography>
                
                {memberHistory.received?.recent_distributions?.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {memberHistory.received.recent_distributions.map((dist, idx) => (
                      <Box 
                        key={dist.id || idx}
                        sx={{ 
                          py: 1, 
                          px: 2, 
                          mb: 1, 
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(dist.distribution_date).toLocaleDateString('de-DE')}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${dist.total_weight?.toFixed(2)}g`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Keine kürzlichen Ausgaben
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                Keine Historie verfügbar
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}