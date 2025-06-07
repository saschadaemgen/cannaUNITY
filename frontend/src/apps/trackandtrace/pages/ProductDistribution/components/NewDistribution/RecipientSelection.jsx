// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/RecipientSelection.jsx
import { useState, useEffect } from 'react'
import { 
  Box, Typography, TextField, Autocomplete, Grid, Paper,
  Avatar, Chip, Alert, InputAdornment, Card, CardContent,
  Divider, CircularProgress
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import api from '@/utils/api'

export default function RecipientSelection({ members, recipientId, setRecipientId }) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberHistory, setMemberHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Lade Mitglieder-Historie wenn ein Mitglied ausgewählt wird
  useEffect(() => {
    if (recipientId) {
      loadMemberHistory(recipientId)
    } else {
      setMemberHistory(null)
    }
  }, [recipientId])
  
  const loadMemberHistory = async (memberId) => {
    setLoadingHistory(true)
    try {
      const res = await api.get(`/trackandtrace/distributions/member_summary/?member_id=${memberId}`)
      setMemberHistory(res.data)
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder-Historie:', error)
    } finally {
      setLoadingHistory(false)
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
    searchString: `${member.first_name} ${member.last_name} ${member.member_number || ''} ${member.email || ''}`.toLowerCase()
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
              getOptionLabel={(option) => option.displayName}
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
                      {option.member_number && `Mitgliedsnr.: ${option.member_number}`}
                      {option.email && ` • ${option.email}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Name, Mitgliedsnummer oder E-Mail eingeben"
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
                    <Box>
                      <Typography variant="h6">{selectedMember.displayName}</Typography>
                      <Chip 
                        icon={<AssignmentIndIcon />}
                        label={selectedMember.member_number || 'Keine Mitgliedsnr.'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
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
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Ausgabenhistorie
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
            ) : memberHistory ? (
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