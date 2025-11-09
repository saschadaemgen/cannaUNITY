// frontend/src/apps/controller/components/ControlUnitCard.jsx
import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  IconButton,
  styled,
  Collapse,
  Switch,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import { 
  Settings, 
  Schedule, 
  Send,
  ExpandLess,
  ExpandMore,
  Save,
  PowerSettingsNew,
  Sync
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'

// Haupt-Container für die SIMATIC-Karte - Mit anthrazitem Border
const SimaticContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  background: '#6B7885',
  borderRadius: '4px',
  border: '1px solid #4a4a4a',
  position: 'relative',
  fontFamily: 'Arial, sans-serif',
  userSelect: 'none',
}))

// Siemens Header
const HeaderSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #009999 0%, #00CCCC 100%)',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: '4px 4px 0 0',
}))

const SiemensLogo = styled(Box)(({ theme }) => ({
  background: 'white',
  color: '#009999',
  padding: '4px 12px',
  fontSize: '14px',
  fontWeight: 'bold',
  borderRadius: '2px',
  letterSpacing: '1px',
}))

// Haupt-Gehäuse
const MainBody = styled(Box)(({ theme }) => ({
  padding: '16px',
  position: 'relative',
}))

// LED-Status Panel
const StatusPanel = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '12px',
  marginBottom: '15px',
}))

const LEDGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}))

const LEDRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}))

// LED ohne Schatten
const LED = styled(Box)(({ color, active, blink }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: active ? color : '#3A4049',
  border: '1px solid #2A3039',
  animation: blink && active ? 'ledBlink 1s infinite' : 'none',
  '@keyframes ledBlink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.3 }
  }
}))

const LEDLabel = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: '#E8E9EA',
  fontWeight: 500,
  letterSpacing: '0.5px',
}))

// Port-Status LEDs ohne Schatten
const PortLEDs = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  gap: '4px',
  padding: '4px',
  background: '#5A6570',
  borderRadius: '2px',
}))

const PortLED = styled(Box)(({ active, color }) => ({
  width: '100%',
  height: '18px',
  background: active ? color : '#3A4049',
  borderRadius: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #2A3039',
}))

const PortLabel = styled(Typography)(({ theme }) => ({
  fontSize: '7px',
  color: '#E8E9EA',
  fontWeight: 'bold',
  textAlign: 'center',
  lineHeight: 1,
  textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
}))

// Minimales Bernstein Display
const AmberDisplay = styled(Box)(({ theme }) => ({
  background: '#2a2a2a',
  border: '1px solid #3a3a3a',
  borderRadius: '3px',
  padding: '2px',
  marginBottom: '16px',
  position: 'relative',
}))

const AmberScreen = styled(Box)(({ theme }) => ({
  background: '#1a0f00',
  border: '1px solid #444',
  borderRadius: '2px',
  padding: '0px 7px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
}))

const AmberText = styled(Typography)(({ theme }) => ({
  color: '#ffaa00',
  fontFamily: 'Courier New, monospace',
  fontSize: '9px',
  textShadow: '0 0 1px #ff8800',
  lineHeight: 1.3,
}))

const AmberTextContent = styled(Box)(({ theme }) => ({
  flex: 1,
}))

const AmberIcon = styled(Box)(({ theme, active }) => ({
  color: '#ffaa00',
  fontSize: '28px',
  textShadow: '0 0 2px #ff8800',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '24px',
  height: '40px',
  fontWeight: 'bold',
  opacity: active ? 1 : 0.4,
  '&.fan': {
    animation: active ? 'spin 2s linear infinite' : 'none',
  },
  '&.light': {
    animation: active ? 'pulse 2s ease-in-out infinite' : 'none',
  },
  '&.water': {
    animation: active ? 'drop 1.5s ease-in-out infinite' : 'none',
  },
  '&.gas': {
    animation: active ? 'float 3s ease-in-out infinite' : 'none',
  },
  '&.humidity': {
    animation: active ? 'wave 2s ease-in-out infinite' : 'none',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
    '50%': { opacity: 1, transform: 'scale(1.1)' }
  },
  '@keyframes drop': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-3px)' }
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
    '33%': { transform: 'translateY(-2px) translateX(2px)' },
    '66%': { transform: 'translateY(2px) translateX(-1px)' }
  },
  '@keyframes wave': {
    '0%, 100%': { transform: 'scaleY(1)' },
    '50%': { transform: 'scaleY(1.3)' }
  }
}))

// LED Control Panel
const LEDControlPanel = styled(Box)(({ theme }) => ({
  background: '#5A6570',
  padding: '12px',
  borderRadius: '2px',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}))

// Klappen-Komponente ohne Schatten
const CoverFlap = styled(Box)(({ open }) => ({
  background: '#6B7885',
  height: '40px',
  border: '1px solid #5A6570',
  borderRadius: '2px',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  transform: open ? 'rotateX(-70deg)' : 'rotateX(0deg)',
  transformOrigin: 'top center',
  transformStyle: 'preserve-3d',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
}))

const FlapLabel = styled(Typography)(({ theme }) => ({
  fontSize: '9px',
  color: '#E8E9EA',
  fontWeight: 500,
  letterSpacing: '0.5px',
}))

const FlapIcon = styled(Box)(({ open }) => ({
  color: '#ffaa00',
  fontSize: '12px',
  transition: 'transform 0.3s ease',
  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
}))

// Anschluss-Panel ohne Schatten
const ConnectionPanel = styled(Box)(({ theme }) => ({
  background: '#4A5460',
  padding: '12px',
  borderRadius: '2px',
  marginTop: '-1px',
}))

const ConnectionPort = styled(Box)(({ type }) => ({
  background: type === 'ethernet' ? '#1A1A1A' : '#2A2A2A',
  height: '20px',
  margin: '4px 0',
  borderRadius: '2px',
  border: '1px solid #1A1A1A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  color: '#666',
  fontFamily: 'monospace',
}))

// Control Buttons ohne Schatten
const ControlPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
  padding: '12px',
  background: '#5A6570',
  borderRadius: '2px',
}))

const SimaticButton = styled(Box)(({ theme }) => ({
  flex: 1,
  background: '#7A8590',
  padding: '8px',
  borderRadius: '2px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.1s',
  '&:hover': {
    background: '#8A95A0',
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
  '&.disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      background: '#7A8590',
    }
  }
}))

export default function ControlUnitCard({ unit, onStatusChange }) {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [ledStatus, setLedStatus] = useState(unit.current_status?.led_status || false)
  const [currentUnit, setCurrentUnit] = useState(unit) // NEU: Lokaler Unit-State
  const [topFlapOpen, setTopFlapOpen] = useState(false)
  const [bottomFlapOpen, setBottomFlapOpen] = useState(false)
  const [ledControlOpen, setLedControlOpen] = useState(false)
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    // Unit-Daten aktualisieren wenn sich Props ändern
    setCurrentUnit(unit)
    if (unit.current_status?.led_status !== undefined) {
      setLedStatus(unit.current_status.led_status)
    }
  }, [unit])

  // Unit-Type Icon und Animation ermitteln
  const getUnitTypeIcon = () => {
    const type = currentUnit.unit_type?.toLowerCase() || 'lighting'
    if (type.includes('klima') || type.includes('climate')) return { icon: '+', class: 'fan' }
    if (type.includes('bewässer') || type.includes('irrigation')) return { icon: '•', class: 'water' }
    if (type.includes('co2')) return { icon: '~', class: 'gas' }
    if (type.includes('feuchte') || type.includes('humidity')) return { icon: '≈', class: 'humidity' }
    return { icon: '○', class: 'light' } // Default: Beleuchtung
  }

  const unitIcon = getUnitTypeIcon()
  const isActive = currentUnit.status === 'active'

  // LED-Status basierend auf currentUnit statt unit
  const getLEDStatus = () => {
    const base = {
      run: false,
      sync: false,
      stop: true,
      error: false,
      maint: false
    }
    
    switch (currentUnit.status) {
      case 'active':
        return { 
          ...base, 
          run: ledStatus,  // Verwendet aktuellen LED-Status
          sync: currentUnit.is_authenticated || false, 
          stop: !ledStatus 
        }
      case 'error':
        return { ...base, error: true, stop: true }
      case 'maintenance':
        return { ...base, maint: true, stop: true }
      default:
        return base
    }
  }

  const ledStatusDisplay = getLEDStatus()

  // Port-Status mit aktuellem LED-Status
  const getPortStatus = () => {
    const ports = []
    for (let i = 0; i < 16; i++) {
      // Q0 (Port 0) zeigt den tatsächlichen LED-Status
      if (i === 0) {
        ports.push({
          active: ledStatus,
          color: '#00AA00'
        })
      } else {
        ports.push({
          active: Math.random() > 0.5,
          color: '#00AA00'
        })
      }
    }
    return ports
  }

  const handleLEDToggle = async () => {
    setSending(true)
    try {
      const response = await api.post(`/controller/units/${currentUnit.id}/toggle_led/`, {
        status: !ledStatus
      })
      
      if (response.data.success) {
        // LED-Status aus Response setzen
        setLedStatus(response.data.led_status)
        
        // Unit-Daten aktualisieren wenn vorhanden
        if (response.data.unit) {
          setCurrentUnit(response.data.unit)
          // Auch den LED-Status aus den aktualisierten Unit-Daten setzen
          if (response.data.unit.current_status?.led_status !== undefined) {
            setLedStatus(response.data.unit.current_status.led_status)
          }
        }
        
        setNotification({
          open: true,
          message: `LED ${response.data.led_status ? 'eingeschaltet' : 'ausgeschaltet'}`,
          severity: 'success'
        })
        
        // Parent-Komponente informieren
        onStatusChange?.()
      } else {
        throw new Error(response.data.error || 'Unbekannter Fehler')
      }
    } catch (error) {
      console.error('Fehler beim LED-Toggle:', error)
      setNotification({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setSending(false)
    }
  }

  const handleSaveToPlc = async () => {
    if (!currentUnit.has_plc_config) {
      setNotification({
        open: true,
        message: 'Keine SPS-Konfiguration vorhanden',
        severity: 'warning'
      })
      return
    }

    setSaving(true)
    try {
      const response = await api.post(`/controller/units/${currentUnit.id}/save_to_plc/`)
      
      if (response.data.success) {
        setNotification({
          open: true,
          message: 'Konfiguration erfolgreich gespeichert',
          severity: 'success'
        })
        onStatusChange?.()
      } else {
        throw new Error(response.data.error || 'Speichern fehlgeschlagen')
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      setNotification({
        open: true,
        message: `Fehler: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSyncStatus = async () => {
    setSyncing(true)
    try {
      const response = await api.get(`/controller/units/${currentUnit.id}/sync_status/`)
      
      if (response.data) {
        setLedStatus(response.data.led_status || false)
        setNotification({
          open: true,
          message: 'Status synchronisiert',
          severity: 'success'
        })
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Fehler beim Sync:', error)
      setNotification({
        open: true,
        message: `Sync fehlgeschlagen: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleSendToPlc = async () => {
    setSending(true)
    try {
      const response = await api.post(`/controller/units/${currentUnit.id}/send_to_plc/`, {
        command_type: 'update_config',
        parameters: {}
      })
      
      setNotification({
        open: true,
        message: 'Befehl an SPS gesendet',
        severity: 'success'
      })
      onStatusChange?.()
    } catch (error) {
      console.error('Fehler beim Senden:', error)
      setNotification({
        open: true,
        message: `Sendefehler: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <SimaticContainer>
        <HeaderSection>
          <SiemensLogo>SIEMENS</SiemensLogo>
          <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>
            SIMATIC<br />S7-1200 G2
          </Typography>
        </HeaderSection>

        <MainBody>
          <StatusPanel>
            <LEDGroup>
              <LEDRow>
                <LED color="#00AA00" active={ledStatusDisplay.run} />
                <LEDLabel>RUN / STOP</LEDLabel>
              </LEDRow>
              <LEDRow>
                <LED color="#0099FF" active={ledStatusDisplay.sync} blink />
                <LEDLabel>SYNC</LEDLabel>
              </LEDRow>
              <LEDRow>
                <LED color="#FF0000" active={ledStatusDisplay.error} blink />
                <LEDLabel>ERROR</LEDLabel>
              </LEDRow>
              <LEDRow>
                <LED color="#FFA500" active={ledStatusDisplay.maint} />
                <LEDLabel>MAINT</LEDLabel>
              </LEDRow>
            </LEDGroup>

            <Box>
              <Typography sx={{ fontSize: '10px', color: '#C0C5CA', mb: 1 }}>
                I/O STATUS
              </Typography>
              <PortLEDs>
                {getPortStatus().map((port, i) => (
                  <PortLED key={i} active={port.active} color={port.color}>
                    <PortLabel>{i === 0 ? 'Q0' : i}</PortLabel>
                  </PortLED>
                ))}
              </PortLEDs>
            </Box>
          </StatusPanel>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '11px', color: '#E8E9EA', mb: 1 }}>
              CPU 1212C DC/DC/DC
            </Typography>
            
            {/* Minimales Bernstein Display */}
            <AmberDisplay>
              <AmberScreen>
                <AmberTextContent>
                  <AmberText sx={{ fontSize: '10px', mb: 0.5 }}>
                    {currentUnit.name}
                  </AmberText>
                  <AmberText sx={{ fontSize: '8px' }}>
                    {currentUnit.unit_type_display} • {currentUnit.room_name}
                  </AmberText>
                  {currentUnit.current_status && (
                    <AmberText sx={{ fontSize: '11px', fontWeight: 'bold', mt: 0.5 }}>
                      {currentUnit.current_status.current_value || '---'} 
                      {currentUnit.parameters.find(p => p.key === 'unit')?.value || ''}
                    </AmberText>
                  )}
                </AmberTextContent>
                <AmberIcon active={ledStatus} className={unitIcon.class}>
                  {unitIcon.icon}
                </AmberIcon>
              </AmberScreen>
            </AmberDisplay>
          </Box>

          {/* LED Control Klappe */}
          <Box sx={{ perspective: '1000px', mb: 2 }}>
            <CoverFlap open={ledControlOpen} onClick={() => setLedControlOpen(!ledControlOpen)}>
              <FlapLabel>LED CONTROL</FlapLabel>
              <FlapIcon open={ledControlOpen}>▼</FlapIcon>
            </CoverFlap>
            <Collapse in={ledControlOpen}>
              <LEDControlPanel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PowerSettingsNew sx={{ fontSize: 20, color: ledStatus ? '#00FF00' : '#666' }} />
                  <Typography sx={{ fontSize: '11px', color: '#E8E9EA' }}>
                    LED {ledStatus ? 'ON' : 'OFF'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleLEDToggle}
                    disabled={sending || !currentUnit.has_plc_config}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px 12px',
                      fontSize: '11px',
                      background: ledStatus ? '#d32f2f' : '#4CAF50',
                      '&:hover': {
                        background: ledStatus ? '#b71c1c' : '#388E3C'
                      }
                    }}
                  >
                    {sending ? <CircularProgress size={12} /> : (ledStatus ? 'AUS' : 'EIN')}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={handleSyncStatus}
                    disabled={syncing || !currentUnit.has_plc_config}
                    title="Status synchronisieren"
                  >
                    <Sync sx={{ fontSize: 16 }} className={syncing ? 'spinning' : ''} />
                  </IconButton>
                </Box>
              </LEDControlPanel>
            </Collapse>
          </Box>

          {/* Obere Klappe - Communication */}
          <Box sx={{ perspective: '1000px', mb: 2 }}>
            <CoverFlap open={topFlapOpen} onClick={() => setTopFlapOpen(!topFlapOpen)}>
              <FlapLabel>COMMUNICATION PORTS</FlapLabel>
              <FlapIcon open={topFlapOpen}>▼</FlapIcon>
            </CoverFlap>
            <Collapse in={topFlapOpen}>
              <ConnectionPanel>
                <Typography sx={{ fontSize: '9px', color: '#9099A0', mb: 1 }}>
                  COMMUNICATION PORTS
                </Typography>
                <ConnectionPort type="ethernet">PROFINET</ConnectionPort>
                <ConnectionPort type="serial">API-REST</ConnectionPort>
                {currentUnit.plc_address && (
                  <Typography sx={{ fontSize: '8px', color: '#ffaa00', mt: 1 }}>
                    IP: {currentUnit.plc_address}
                  </Typography>
                )}
              </ConnectionPanel>
            </Collapse>
          </Box>

          {/* Untere Klappe - Power & I/O */}
          <Box sx={{ perspective: '1000px', mb: 2 }}>
            <CoverFlap open={bottomFlapOpen} onClick={() => setBottomFlapOpen(!bottomFlapOpen)}>
              <FlapLabel>POWER & I/O</FlapLabel>
              <FlapIcon open={bottomFlapOpen}>▼</FlapIcon>
            </CoverFlap>
            <Collapse in={bottomFlapOpen}>
              <ConnectionPanel>
                <Typography sx={{ fontSize: '9px', color: '#9099A0', mb: 1 }}>
                  POWER & I/O
                </Typography>
                <ConnectionPort type="power">24V DC</ConnectionPort>
                <ConnectionPort type="io">DI/DO TERMINALS</ConnectionPort>
              </ConnectionPanel>
            </Collapse>
          </Box>

          <ControlPanel>
            <SimaticButton onClick={() => navigate(`/controller/units/${currentUnit.id}/edit`)}>
              <Settings sx={{ fontSize: 16, color: '#E8E9EA' }} />
              <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
                CONFIG
              </Typography>
            </SimaticButton>
            <SimaticButton onClick={() => navigate(`/controller/units/${currentUnit.id}/schedule`)}>
              <Schedule sx={{ fontSize: 16, color: '#E8E9EA' }} />
              <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
                TIMER
              </Typography>
            </SimaticButton>
            <SimaticButton 
              onClick={handleSaveToPlc}
              className={saving || !currentUnit.has_plc_config ? 'disabled' : ''}
              sx={{ 
                opacity: saving || !currentUnit.has_plc_config ? 0.5 : 1,
                pointerEvents: saving || !currentUnit.has_plc_config ? 'none' : 'auto'
              }}
            >
              <Save sx={{ fontSize: 16, color: saving ? '#00FF00' : '#E8E9EA' }} />
              <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
                {saving ? 'SAVING...' : 'SAVE'}
              </Typography>
            </SimaticButton>
          </ControlPanel>
        </MainBody>
      </SimaticContainer>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <style jsx global>{`
        @keyframes spinning {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .spinning {
          animation: spinning 1s linear infinite;
        }
      `}</style>
    </>
  )
}