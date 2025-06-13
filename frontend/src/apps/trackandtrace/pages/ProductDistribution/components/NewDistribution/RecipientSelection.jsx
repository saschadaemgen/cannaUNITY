// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/RecipientSelection.jsx

import { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Button, CircularProgress,
  Avatar, Chip, Alert, Card, CardContent,
  Divider, LinearProgress, Fade, Zoom
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PaymentIcon from '@mui/icons-material/Payment'
import CakeIcon from '@mui/icons-material/Cake'
import EventIcon from '@mui/icons-material/Event'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import api from '@/utils/api'
import {
  getMemberConsumptionStats,
  getCachedMemberLimits
} from '../../../../utils/cannabisLimitsApi'
import {
  formatWeight,
  getConsumptionColor
} from '../../../../utils/cannabisLimits'

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
  } catch {
    return null
  }
}

// Komponente für Limit-Anzeige
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

export default function RecipientSelection({
  members,
  recipientId,
  setRecipientId,
  onLimitsLoaded,
  onContinue,
  onReset
}) {
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberHistory, setMemberHistory] = useState(null)
  const [memberLimits, setMemberLimits] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingLimits, setLoadingLimits] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isAborting, setIsAborting] = useState(false)

  useEffect(() => {
    if (recipientId && (!selectedMember || selectedMember.id !== recipientId)) {
      const found = members.find(m => m.id === recipientId)
      if (found) setSelectedMember(found)
    }
    if (!recipientId && selectedMember) {
      setSelectedMember(null)
    }
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
      const res = await api.get(
        `/trackandtrace/distributions/member_consumption_summary/?member_id=${memberId}`
      )
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

  const handleRfidScan = async () => {
    if (isAborting) return
    const controller = new AbortController()
    setAbortController(controller)
    setSubmitting(true)
    try {
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      })
      const { token, unifi_user_id, unifi_name } = bindRes.data
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.')
      }

      const verifyRes = await api.post(
        '/unifi_api_debug/secure-member-binding/',
        { token, unifi_name },
        { signal: controller.signal }
      )
      const { member_id } = verifyRes.data
      const found = members.find(m => m.id === member_id)
      if (!found) {
        throw new Error('Mitglied nicht in der Liste gefunden')
      }

      setScanSuccess(true)
      setSelectedMember(found)
      setRecipientId(member_id)

      setTimeout(() => {
        setScanMode(false)
        setScanSuccess(false)
      }, 2000)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('RFID-Fehler:', error)
        alert(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen')
      }
      if (!isAborting) {
        setScanMode(false)
      }
    } finally {
      if (!isAborting) {
        setSubmitting(false)
      }
    }
  }

  const startRfidScan = async () => {
    setScanMode(true)
    setScanSuccess(false)
    await handleRfidScan()
  }

  const handleCancelScan = async () => {
    setIsAborting(true)
    if (abortController) abortController.abort()
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/')
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error)
    } finally {
      setScanMode(false)
      setSubmitting(false)
      setScanSuccess(false)
      setTimeout(() => setIsAborting(false), 500)
    }
  }

  const isU21 = memberLimits?.member?.isU21
  const isBlocked = memberLimits
    ? memberLimits.daily.percentage >= 100 || memberLimits.monthly.percentage >= 100
    : false

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', position: 'relative' }}>
      {/* RFID-Scan Overlay */}
      {scanMode && (
        <Paper
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'primary.dark',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            p: 4, zIndex: 1000, borderRadius: 2
          }}
        >
          {!scanSuccess && !isAborting && (
            <Button
              onClick={handleCancelScan}
              variant="contained"
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 16, right: 16,
                minWidth: 100
              }}
            >
              Abbrechen
            </Button>
          )}
          {scanSuccess ? (
            <Fade in={scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <Zoom in={scanSuccess}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                </Zoom>
                <Typography variant="h4" color="white" fontWeight="bold">
                  Mitglied identifiziert!
                </Typography>
                <Typography variant="h5" color="white" mt={2}>
                  {selectedMember?.first_name} {selectedMember?.last_name}
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Fade in={!scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
                <Typography variant="h4" color="white" fontWeight="bold">
                  Mitgliedsausweis scannen
                </Typography>
                <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
                  Bitte halten Sie den Mitgliedsausweis an das Lesegerät
                </Typography>
                {submitting && (
                  <CircularProgress size={60} thickness={5} sx={{ color: 'white', mt: 4 }} />
                )}
              </Box>
            </Fade>
          )}
        </Paper>
      )}

      {!selectedMember ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 440,
            bgcolor: 'grey.50',
            borderRadius: 2,
            p: 3
          }}
        >
          <Box textAlign="center" maxWidth={500}>
            <CreditCardIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Mitglied identifizieren
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Scannen Sie den Mitgliedsausweis, um den Empfänger auszuwählen
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={startRfidScan}
              startIcon={<CreditCardIcon />}
              fullWidth
              sx={{
                height: 50,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                maxWidth: 400
              }}
            >
              RFID-Scan starten
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          {/* Tageslimit-Warnung */}
          {memberLimits?.daily.percentage >= 100 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Tageslimit erreicht!</strong>
              </Typography>
              <Typography variant="body2">
                Gemäß § 9 Abs. 2 KCanG darf die Weitergabe von Cannabis an Vereinsmitglieder
                25 Gramm pro Tag nicht überschreiten. Das Tageslimit für dieses Mitglied wurde bereits ausgeschöpft.
              </Typography>
            </Alert>
          )}

          {/* Main Two Column Layout */}
          <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
            {/* Mitgliedsdaten & Limits */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper elevation={2} sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'grey.50',
                boxShadow: '0 2px 12px 0 rgb(0 0 0 / 5%)',
                minHeight: 420
              }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Mitgliedsdaten & Limits
                </Typography>
                <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: 2 }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography variant="h6">{selectedMember.first_name} {selectedMember.last_name}</Typography>
                          {memberLimits && (
                            <Chip
                              icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                              label={isU21 ? '18+ (max. 10% THC)' : '21+ (keine THC-Beschränkung)'}
                              size="small"
                              sx={{
                                bgcolor: isU21 ? 'warning.main' : 'success.main',
                                color: 'white',
                                fontWeight: 'medium',
                                '& .MuiChip-icon': { color: 'white' }
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
                      mb: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      {[{
                        icon: <EventIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />,
                        label: 'Mitglied seit',
                        value: selectedMember.created_at
                          ? new Date(selectedMember.created_at).toLocaleDateString('de-DE')
                          : 'Unbekannt'
                      },{
                        icon: <VerifiedUserIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />,
                        label: 'Status',
                        value: selectedMember.status === 'active'
                          ? 'Aktiv'
                          : selectedMember.status === 'locked'
                            ? 'Gesperrt'
                            : 'Unbekannt',
                        color: selectedMember.status === 'active' ? 'success.main' : 'warning.main'
                      },{
                        icon: <CakeIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />,
                        label: 'Alter',
                        value: selectedMember.birthdate
                          ? (calculateAge(selectedMember.birthdate) || 'k.A.') + ' Jahre'
                          : 'k.A.'
                      },{
                        icon: <AccountBalanceWalletIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />,
                        label: 'Kontostand',
                        value: parseFloat(selectedMember.kontostand || 0).toFixed(2) + ' €',
                        color: parseFloat(selectedMember.kontostand || 0) >= 0 ? 'success.main' : 'error.main'
                      },{
                        icon: <PaymentIcon sx={{ fontSize: 24, mb: 0.5 }} color="action" />,
                        label: 'Monatsbeitrag',
                        value: parseFloat(selectedMember.beitrag || 0).toFixed(2) + ' €'
                      }].map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            flex: '1 1 20%',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderRight: idx < 4 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            minWidth: 100
                          }}
                        >
                          {item.icon}
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color={item.color || 'text.primary'}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
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
                            {isU21 && (
                              <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                  <strong>U21-Beschränkung:</strong> Max. 10% THC
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Paper>
            </Box>

            {/* Ausgabenhistorie & Verbrauch */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper elevation={2} sx={{
                p: 3,
                minHeight: 380,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'grey.50',
                boxShadow: '0 2px 12px 0 rgb(0 0 0 / 5%)'
              }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Ausgabenhistorie & Verbrauch
                </Typography>
                <Card variant="outlined" sx={{
                  width: '100%',
                  mt: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {loadingHistory ? (
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                      </Box>
                    ) : memberHistory && memberLimits ? (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 2,
                            alignItems: 'stretch',  // sorgt für gleiche Höhe
                            mt: 2
                          }}
                        >
                          {[
                            {
                              icon: <CalendarTodayIcon fontSize="large" />,
                              value: formatWeight(memberLimits.daily.consumed),
                              label: 'Heute'
                            },
                            {
                              icon: <EventIcon fontSize="large" />,
                              value: formatWeight(memberLimits.monthly.consumed),
                              label: 'Monat'
                            },
                            {
                              icon: <VerifiedUserIcon fontSize="large" />,
                              value: isU21 ? '18+' : '21+',
                              label: isU21 ? 'max. 10 % THC' : 'THC frei'
                            },
                            {
                              icon: isBlocked
                                ? <ThumbDownIcon fontSize="large" />
                                : <ThumbUpIcon fontSize="large" />,
                              value: isBlocked ? 'Gesperrt' : 'Freigegeben',
                              label: isBlocked ? 'Limits gesperrt' : 'Limits OK'
                            }
                          ].map((card, idx) => (
                            <Card
                              key={idx}
                              variant="outlined"
                              sx={{
                                bgcolor: 'background.paper',
                                borderColor: 'success.main',
                                borderWidth: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                height: '100%'          // füllt die Grid-Zelle komplett aus
                              }}
                            >
                              <Box sx={{ color: 'success.main', mb: 1 }}>{card.icon}</Box>
                              <Typography variant="h6" fontWeight="bold" color="success.main">
                                {card.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {card.label}
                              </Typography>
                            </Card>
                          ))}
                        </Box>

                        {(memberLimits.daily.percentage >= 80 || memberLimits.monthly.percentage >= 80) &&
                          memberLimits.daily.percentage < 100 && (
                            <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningAmberIcon />}>
                              {memberLimits.daily.percentage >= 80 && (
                                <Typography variant="body2">
                                  Tageslimit fast erreicht ({memberLimits.daily.percentage.toFixed(0)}%)
                                </Typography>
                              )}
                              {memberLimits.monthly.percentage >= 80 && (
                                <Typography variant="body2">
                                  Monatslimit fast erreicht ({memberLimits.monthly.percentage.toFixed(0)}%)
                                </Typography>
                              )}
                            </Alert>
                          )}

                        <Divider sx={{ my: 2 }} />

                        <Box display="flex" gap={4}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Gesamtausgaben
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {memberHistory.received?.total_count || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Gesamtmenge
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {memberHistory.received?.total_weight?.toFixed(2) || '0.00'}g
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Letzte Ausgaben (30 Tage)
                          </Typography>
                          {memberHistory.received?.recent_distributions?.length > 0 ? (
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                              {memberHistory.received.recent_distributions.map((dist, idx) => (
                                <Box
                                  key={dist.id || idx}
                                  sx={{
                                    py: 1, px: 2, mb: 1,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <CalendarTodayIcon fontSize="20" color="action" />
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
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary" align="center">
                                Keine kürzlichen Ausgaben
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Keine Historie verfügbar
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Paper>
            </Box>
          </Box>

          {/* 🆕 Button-Zeile unter den beiden Karten */}
          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<RestartAltIcon />}
              sx={{ height: 64, fontSize: '1.1rem', fontWeight: 'bold' }}
              onClick={onReset}
            >
              Zurücksetzen
            </Button>

            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ height: 64, fontSize: '1.1rem', fontWeight: 'bold' }}
              onClick={onContinue}
              disabled={!selectedMember}
            >
              Weiter zur Produktauswahl
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}
