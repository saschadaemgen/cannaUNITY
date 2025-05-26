// frontend/src/apps/controller/components/ControlUnitCard.jsx
import { useState } from 'react'
import { 
  Box, 
  Typography, 
  IconButton,
  styled,
  Collapse
} from '@mui/material'
import { 
  Settings, 
  Schedule, 
  Send,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'

// Haupt-Container für die SIMATIC-Karte - OHNE Schatten
const SimaticContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  background: '#6B7885',
  borderRadius: '4px',
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
  marginBottom: '20px',
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
  fontSize: '10px',
  color: '#E8E9EA',
  fontWeight: 500,
  letterSpacing: '0.5px',
}))

// Port-Status LEDs ohne Schatten
const PortLEDs = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '4px',
  padding: '8px',
  background: '#5A6570',
  borderRadius: '2px',
}))

const PortLED = styled(Box)(({ active, color }) => ({
  width: '6px',
  height: '16px',
  background: active ? color : '#3A4049',
  borderRadius: '1px',
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
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '2px',
    background: '#5A6570',
    borderRadius: '1px',
  }
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
  }
}))

export default function ControlUnitCard({ unit, onStatusChange }) {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [topFlapOpen, setTopFlapOpen] = useState(false)
  const [bottomFlapOpen, setBottomFlapOpen] = useState(false)

  // LED-Status basierend auf Unit-Status
  const getLEDStatus = () => {
    switch (unit.status) {
      case 'active':
        return { run: true, stop: false, error: false, maint: false }
      case 'error':
        return { run: false, stop: true, error: true, maint: false }
      case 'maintenance':
        return { run: false, stop: true, error: false, maint: true }
      default:
        return { run: false, stop: true, error: false, maint: false }
    }
  }

  const ledStatus = getLEDStatus()

  // Port-Status simulieren
  const getPortStatus = () => {
    const ports = []
    for (let i = 0; i < 8; i++) {
      ports.push({
        active: Math.random() > 0.5,
        color: '#00FF00'
      })
    }
    return ports
  }

  const handleSendToPlc = async () => {
    setSending(true)
    try {
      const response = await api.post(`/controller/units/${unit.id}/send_to_plc/`, {
        command_type: 'update_config',
        parameters: {}
      })
      onStatusChange?.()
    } catch (error) {
      console.error('Fehler beim Senden:', error)
    } finally {
      setSending(false)
    }
  }

  return (
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
              <LED color="#00FF00" active={ledStatus.run} />
              <LEDLabel>RUN / STOP</LEDLabel>
            </LEDRow>
            <LEDRow>
              <LED color="#FF0000" active={ledStatus.error} blink />
              <LEDLabel>ERROR</LEDLabel>
            </LEDRow>
            <LEDRow>
              <LED color="#FFA500" active={ledStatus.maint} />
              <LEDLabel>MAINT</LEDLabel>
            </LEDRow>
          </LEDGroup>

          <Box>
            <Typography sx={{ fontSize: '10px', color: '#C0C5CA', mb: 1 }}>
              I/O STATUS
            </Typography>
            <PortLEDs>
              {getPortStatus().map((port, i) => (
                <Box key={i}>
                  <Typography sx={{ fontSize: '7px', color: '#9099A0', textAlign: 'center' }}>
                    {i}
                  </Typography>
                  <PortLED active={port.active} color={port.color} />
                </Box>
              ))}
            </PortLEDs>
          </Box>
        </StatusPanel>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '11px', color: '#E8E9EA', mb: 1 }}>
            CPU 1212C DC/DC/DC
          </Typography>
          <Box sx={{ 
            background: '#4A5460', 
            p: 1, 
            borderRadius: '2px',
          }}>
            <Typography sx={{ fontSize: '10px', color: '#9FC5E8' }}>
              {unit.name}
            </Typography>
            <Typography sx={{ fontSize: '9px', color: '#7A99BA' }}>
              {unit.unit_type_display} • {unit.room_name}
            </Typography>
            {unit.current_status && (
              <Typography sx={{ fontSize: '12px', color: '#00FF00', fontFamily: 'monospace', mt: 1 }}>
                {unit.current_status.current_value || '---'} 
                {unit.parameters.find(p => p.key === 'unit')?.value || ''}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Obere Klappe */}
        <Box sx={{ perspective: '1000px', mb: 2 }}>
          <CoverFlap open={topFlapOpen} onClick={() => setTopFlapOpen(!topFlapOpen)} />
          <Collapse in={topFlapOpen}>
            <ConnectionPanel>
              <Typography sx={{ fontSize: '9px', color: '#9099A0', mb: 1 }}>
                COMMUNICATION PORTS
              </Typography>
              <ConnectionPort type="ethernet">PROFINET</ConnectionPort>
              <ConnectionPort type="serial">API-REST</ConnectionPort>
            </ConnectionPanel>
          </Collapse>
        </Box>

        {/* Untere Klappe */}
        <Box sx={{ perspective: '1000px', mb: 2 }}>
          <CoverFlap open={bottomFlapOpen} onClick={() => setBottomFlapOpen(!bottomFlapOpen)} />
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
          <SimaticButton onClick={() => navigate(`/controller/units/${unit.id}/edit`)}>
            <Settings sx={{ fontSize: 16, color: '#E8E9EA' }} />
            <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
              CONFIG
            </Typography>
          </SimaticButton>
          <SimaticButton onClick={() => navigate(`/controller/units/${unit.id}/schedule`)}>
            <Schedule sx={{ fontSize: 16, color: '#E8E9EA' }} />
            <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
              TIMER
            </Typography>
          </SimaticButton>
          <SimaticButton 
            onClick={handleSendToPlc}
            sx={{ 
              opacity: sending || unit.status !== 'active' ? 0.5 : 1,
              pointerEvents: sending || unit.status !== 'active' ? 'none' : 'auto'
            }}
          >
            <Send sx={{ fontSize: 16, color: sending ? '#00FF00' : '#E8E9EA' }} />
            <Typography sx={{ fontSize: '9px', color: '#E8E9EA', mt: 0.5 }}>
              SEND
            </Typography>
          </SimaticButton>
        </ControlPanel>
      </MainBody>
    </SimaticContainer>
  )
}