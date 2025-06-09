// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/RecipientSelection.jsx

import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, Autocomplete, Paper,
  Avatar, Chip, Alert, InputAdornment, Card, CardContent,
  Divider, CircularProgress, LinearProgress
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AddBoxIcon from '@mui/icons-material/AddBox'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PaymentIcon from '@mui/icons-material/Payment'
import CakeIcon from '@mui/icons-material/Cake'
import EventIcon from '@mui/icons-material/Event'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import api from '@/utils/api'
import {
  getMemberConsumptionStats,
  getCachedMemberLimits
} from '../../../../utils/cannabisLimitsApi'
import {
  formatWeight,
  getConsumptionColor
} from '../../../../utils/cannabisLimits'

const LimitDisplay = ({ label, consumed, limit, remaining, percentage }) => {
  const color = getConsumptionColor(percentage)
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">{label}</Typography>
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

// Hilfsfunktion für Altersberechnung
const calculateAge = (birthdate) => {
  if (!birthdate) return null
  try {
    const today = new Date()
    const birth = new Date(birthdate)
    if (isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    if (age < 0 || age > 150) return null
    return age
  } catch (error) {
    return null
  }
}

export default function RecipientSelection({ members, recipientId, setRecipientId, onLimitsLoaded }) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberHistory, setMemberHistory] = useState(null)
  const [memberLimits, setMemberLimits] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingLimits, setLoadingLimits] = useState(false)

  useEffect(() => {
    if (recipientId && (!selectedMember || selectedMember.id !== recipientId)) {
      const found = members.find(m => m.id === recipientId)
      if (found) setSelectedMember(found)
    }
    if (!recipientId && selectedMember) setSelectedMember(null)
  }, [recipientId, members])

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
      const res = await api.get(`/trackandtrace/distributions/member_consumption_summary/?member_id=${memberId}`)
      setMemberHistory(res.data)
      const limitsData = await getCachedMemberLimits(memberId)
      setMemberLimits(limitsData)
      if (onLimitsLoaded) onLimitsLoaded(limitsData)
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

  const formattedMembers = members.map(member => ({
    ...member,
    searchString: `${member.first_name} ${member.last_name} ${member.email || ''}`.toLowerCase()
  }))

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
        pt: 0,
        px: 0,
        mt: 2,
      }}
    >
      {/* Titel + Suche in einer Zeile */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1,
        gap: 2,
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            Empfänger auswählen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mt: 0.5 }}>
            Wählen Sie das Mitglied aus, das die Cannabis-Produkte erhält
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Autocomplete
            id="recipient-select"
            options={formattedMembers}
            sx={{ minWidth: 400, maxWidth: 500 }}
            getOptionLabel={(option) =>
              option ? `${option.first_name || ''} ${option.last_name || ''}`.trim() || option.email || '' : ''
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
                  <Typography variant="body1">{option.first_name} {option.last_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email || 'Keine E-Mail hinterlegt'}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Mitglied für Produktausgabe auswählen"
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
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Schnellsuche nach Name oder E-Mail
          </Typography>
        </Box>
      </Box>

      {/* Tageslimit-Warnung mit erweitertem Text */}
      {memberLimits && memberLimits.daily.percentage >= 100 && (
        <Alert severity="error" sx={{ mb: 3, mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Tageslimit erreicht!</strong>
          </Typography>
          <Typography variant="body2">
            Gemäß § 9 Abs. 2 KCanG (Konsumcannabisgesetz) darf die Weitergabe von Cannabis an Vereinsmitglieder 
            25 Gramm Cannabis pro Tag nicht überschreiten. Das Tageslimit für dieses Mitglied wurde bereits 
            ausgeschöpft. Eine weitere Ausgabe ist heute nicht mehr möglich.
          </Typography>
        </Alert>
      )}

      {/* Flexbox für perfekte 50/50 Aufteilung */}
      <Box sx={{ display: 'flex', gap: 3, width: '100%', mt: 3 }}>
        {/* Mitglied-Karte: exakt 50% */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={2} sx={{
            height: '100%',
            minHeight: 420,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.50',
            boxShadow: '0 2px 12px 0 rgb(0 0 0 / 5%)'
          }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Mitgliedsdaten & Limits
            </Typography>
            {!selectedMember ? (
              <Box sx={{ 
                textAlign: 'center', 
                color: 'text.secondary', 
                flex: 1, 
                justifyContent: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}>
                <AddBoxIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
                <Typography variant="body2">Mitglied auswählen…</Typography>
              </Box>
            ) : (
              <Card variant="outlined" sx={{ width: '100%', mt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="h6">{selectedMember.first_name} {selectedMember.last_name}</Typography>
                        {memberLimits && (
                          <Chip
                            icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                            label={memberLimits.member.isU21 ? '18+ (max. 10% THC)' : '21+ (keine THC-Beschränkung)'}
                            size="small"
                            sx={{
                              bgcolor: memberLimits.member.isU21 ? 'warning.main' : 'success.main',
                              color: 'white',
                              fontWeight: 'medium',
                              '& .MuiChip-icon': {
                                color: 'white'
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'stretch',
                    gap: 0,
                    mb: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      flex: '1 1 20%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      minWidth: '100px'
                    }}>
                      <EventIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />
                      <Typography variant="caption" color="text.secondary">Mitglied seit</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedMember.created_at ?
                          new Date(selectedMember.created_at).toLocaleDateString('de-DE') :
                          'Unbekannt'}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 20%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      minWidth: '100px'
                    }}>
                      <VerifiedUserIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Typography variant="body2" fontWeight="medium" color={selectedMember.status === 'active' ? 'success.main' : 'warning.main'}>
                        {selectedMember.status === 'active' ? 'Aktiv' : 
                         selectedMember.status === 'locked' ? 'Gesperrt' :
                         selectedMember.status === 'reminder1' ? '1. Mahnung' :
                         selectedMember.status === 'reminder2' ? '2. Mahnung' : 
                         selectedMember.status || 'Unbekannt'}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 20%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      minWidth: '100px'
                    }}>
                      <CakeIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />
                      <Typography variant="caption" color="text.secondary">Alter</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedMember.birthdate ? (calculateAge(selectedMember.birthdate) || 'k.A.') : 'k.A.'} Jahre
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 20%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      minWidth: '100px'
                    }}>
                      <AccountBalanceWalletIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />
                      <Typography variant="caption" color="text.secondary">Kontostand</Typography>
                      <Typography variant="body2" fontWeight="medium" color={parseFloat(selectedMember.kontostand || 0) >= 0 ? 'success.main' : 'error.main'}>
                        {parseFloat(selectedMember.kontostand || 0).toFixed(2)} €
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 20%',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '100px'
                    }}>
                      <PaymentIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />
                      <Typography variant="caption" color="text.secondary">Monatsbeitrag</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {parseFloat(selectedMember.beitrag || 0).toFixed(2)} €
                      </Typography>
                    </Box>
                  </Box>

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
        </Box>

        {/* Historie & Verbrauch – exakt 50% */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={2} sx={{
            p: 4,
            minHeight: 420,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.50',
            boxShadow: '0 2px 12px 0 rgb(0 0 0 / 5%)'
          }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Ausgabenhistorie & Verbrauch
            </Typography>
            {!selectedMember ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'text.secondary'
              }}>
                <AddBoxIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
                <Typography variant="body2" align="center">
                  Wählen Sie ein Mitglied aus, um die Ausgabenhistorie anzuzeigen
                </Typography>
              </Box>
            ) : (
              <Card variant="outlined" sx={{ width: '100%', mt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {loadingHistory ? (
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : memberHistory && memberLimits ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Vier kompakte Info-Karten, ohne Hintergrundfarbe! */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mb: 3,
                          width: '100%',
                          '& > *': { flex: 1, minWidth: 0 }
                        }}
                      >
                        {/* Heute */}
                        <Card
                          variant="outlined"
                          sx={{
                            height: 110,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            textAlign: 'center',
                            borderColor: getConsumptionColor(memberLimits.daily.percentage) + '.main',
                            borderWidth: 2,
                            bgcolor: 'transparent'
                          }}
                        >
                          <CalendarTodayIcon sx={{ fontSize: 21, color: getConsumptionColor(memberLimits.daily.percentage) + '.main', mb: 0.3 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.09rem', mb: 0.1 }} color={getConsumptionColor(memberLimits.daily.percentage) + '.main'}>
                            {formatWeight(memberLimits.daily.consumed)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Heute</Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.77rem' }}>
                            von {formatWeight(memberLimits.daily.limit).replace('.00', '')}g
                          </Typography>
                        </Card>
                        {/* Monat */}
                        <Card
                          variant="outlined"
                          sx={{
                            height: 110,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            textAlign: 'center',
                            borderColor: getConsumptionColor(memberLimits.monthly.percentage) + '.main',
                            borderWidth: 2,
                            bgcolor: 'transparent'
                          }}
                        >
                          <EventIcon sx={{ fontSize: 21, color: getConsumptionColor(memberLimits.monthly.percentage) + '.main', mb: 0.3 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.09rem', mb: 0.1 }} color={getConsumptionColor(memberLimits.monthly.percentage) + '.main'}>
                            {formatWeight(memberLimits.monthly.consumed)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Monat</Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.77rem' }}>
                            von {formatWeight(memberLimits.monthly.limit).replace('.00', '')}g
                          </Typography>
                        </Card>
                        {/* 21+ */}
                        <Card
                          variant="outlined"
                          sx={{
                            height: 110,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            textAlign: 'center',
                            borderColor: memberLimits.member.isU21 ? 'warning.main' : 'success.main',
                            borderWidth: 2,
                            bgcolor: 'transparent'
                          }}
                        >
                          <VerifiedUserIcon sx={{ fontSize: 21, color: memberLimits.member.isU21 ? 'warning.dark' : 'success.dark', mb: 0.3 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.09rem', mb: 0.1 }} color={memberLimits.member.isU21 ? 'warning.dark' : 'success.dark'}>
                            21+
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Vollzugriff
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.77rem' }}>
                            THC frei
                          </Typography>
                        </Card>
                        {/* Gesperrt */}
                        <Card
                          variant="outlined"
                          sx={{
                            height: 110,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            textAlign: 'center',
                            borderColor: memberLimits.daily.percentage >= 100 || memberLimits.monthly.percentage >= 100 ? 'error.main' : 'success.main',
                            borderWidth: 2,
                            bgcolor: 'transparent'
                          }}
                        >
                          <ThumbDownIcon sx={{ fontSize: 21, color: 'error.dark', mb: 0.3 }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, fontSize: '1.09rem', mb: 0.1 }}
                            color="error.dark"
                          >
                            Gesperrt
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Ausgabe aus</Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.77rem' }}>
                            {memberLimits.daily.percentage >= 100 ? 'Tageslimit' : memberLimits.monthly.percentage >= 100 ? 'Monatslimit' : ''}
                          </Typography>
                        </Card>
                      </Box>

                      {(memberLimits.daily.percentage >= 80 || memberLimits.monthly.percentage >= 80) && 
                        memberLimits.daily.percentage < 100 && (
                        <Alert
                          severity="warning"
                          sx={{ mb: 2 }}
                          icon={<WarningAmberIcon />}
                        >
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
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Gesamtausgaben</Typography>
                          <Typography variant="h6" color="primary.main">
                            {memberHistory.received?.total_count || 0}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Gesamtmenge</Typography>
                          <Typography variant="h6" color="success.main">
                            {memberHistory.received?.total_weight?.toFixed(2) || '0.00'}g
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Letzte Ausgaben (30 Tage)</Typography>
                        {memberHistory.received?.recent_distributions?.length > 0 ? (
                          <Box sx={{ flex: 1, overflowY: 'auto' }}>
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
                                  <CalendarTodayIcon sx={{ fontSize: 20 }} color="action" />
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
                          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" color="text.secondary" align="center">
                              Keine kürzlichen Ausgaben
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : memberHistory && !memberLimits ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* (Fallback-UI für fehlende Limits bleibt unverändert oder nach Bedarf) */}
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Keine Historie verfügbar
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
