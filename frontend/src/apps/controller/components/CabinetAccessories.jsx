// frontend/src/apps/controller/components/CabinetAccessories.jsx
import { Box, styled } from '@mui/material'

// Hauptschalter
export const MainSwitch = styled(Box)(({ on = false }) => ({
  width: '100px',
  height: '120px',
  background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
  borderRadius: '4px',
  position: 'relative',
  boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.5)',
  cursor: 'pointer',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '80px',
    background: on 
      ? 'linear-gradient(180deg, #FF0000 0%, #CC0000 100%)' 
      : 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
    borderRadius: '4px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
    transition: 'all 0.3s',
  },
  
  '&::after': {
    content: on ? '"I"' : '"O"',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  }
}))

// FI-Schutzschalter
export const RCDSwitch = styled(Box)(({ theme }) => ({
  width: '70px',
  height: '100px',
  background: 'linear-gradient(180deg, #F0F0F0 0%, #E0E0E0 100%)',
  border: '1px solid #C0C0C0',
  borderRadius: '2px',
  position: 'relative',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  
  '&::before': {
    content: '"FI\\A30mA"',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    lineHeight: 1.2,
  },
  
  // Test-Button
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '30px',
    height: '20px',
    background: 'linear-gradient(180deg, #FFD700 0%, #FFA000 100%)',
    borderRadius: '2px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  }
}))

// Kabelkanal
export const CableChannel = styled(Box)(({ vertical = false }) => ({
  width: vertical ? '40px' : '100%',
  height: vertical ? '100%' : '40px',
  background: 'linear-gradient(180deg, #E0E0E0 0%, #D0D0D0 100%)',
  border: '1px solid #B0B0B0',
  position: 'relative',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    [vertical ? 'left' : 'top']: '50%',
    [vertical ? 'top' : 'left']: '10px',
    [vertical ? 'bottom' : 'right']: '10px',
    [vertical ? 'width' : 'height']: '20px',
    transform: vertical ? 'translateX(-50%)' : 'translateY(-50%)',
    background: `repeating-linear-gradient(${vertical ? '0deg' : '90deg'}, #C0C0C0 0px, #C0C0C0 30px, transparent 30px, transparent 35px)`,
  }
}))

// Klemmleiste
export const TerminalBlock = styled(Box)(({ connections = 12 }) => ({
  display: 'flex',
  gap: '2px',
  padding: '8px',
  background: '#3A3A3A',
  borderRadius: '2px',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
  
  '& > div': {
    width: '20px',
    height: '30px',
    background: 'linear-gradient(180deg, #FFD700 0%, #FFA000 100%)',
    borderRadius: '2px',
    position: 'relative',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '8px',
      height: '8px',
      background: '#666',
      borderRadius: '50%',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
    }
  }
}))

// Kabel mit Animation
export const AnimatedCable = styled(Box)(({ from, to, color = '#FF0000' }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  
  '& svg': {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  
  '& path': {
    fill: 'none',
    stroke: color,
    strokeWidth: 3,
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
  },
  
  '& .pulse': {
    stroke: '#FFF',
    strokeWidth: 2,
    opacity: 0,
    animation: 'cablePulse 2s infinite',
  },
  
  '@keyframes cablePulse': {
    '0%': { 
      opacity: 0,
      strokeDasharray: '0 100',
    },
    '50%': { 
      opacity: 1,
      strokeDasharray: '20 80',
    },
    '100%': { 
      opacity: 0,
      strokeDasharray: '100 0',
    }
  }
}))

// Sicherungsautomat
export const CircuitBreaker = styled(Box)(({ tripped = false }) => ({
  width: '18px',
  height: '80px',
  background: 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
  borderRadius: '2px',
  position: 'relative',
  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  
  // Schalthebel
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '20px',
    left: '50%',
    width: '10px',
    height: '30px',
    background: tripped 
      ? 'linear-gradient(180deg, #FF0000 0%, #CC0000 100%)' 
      : 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
    borderRadius: '2px',
    transform: `translateX(-50%) ${tripped ? 'translateY(10px)' : 'translateY(0)'}`,
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  
  // Beschriftung
  '&::after': {
    content: '"B16"',
    position: 'absolute',
    bottom: '5px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '7px',
    color: '#CCC',
    fontWeight: 'bold',
  }
}))

// Statusanzeige
export const StatusIndicator = styled(Box)(({ status = 'normal' }) => ({
  width: '200px',
  padding: '10px',
  background: '#1A1A1A',
  borderRadius: '4px',
  border: '2px solid #333',
  
  '& .display': {
    background: '#000',
    padding: '8px',
    borderRadius: '2px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: status === 'error' ? '#FF0000' : status === 'warning' ? '#FFA500' : '#00FF00',
    textShadow: `0 0 5px ${status === 'error' ? '#FF0000' : status === 'warning' ? '#FFA500' : '#00FF00'}`,
    
    '&::before': {
      content: status === 'error' ? '"STÖRUNG"' : status === 'warning' ? '"WARNUNG"' : '"BETRIEB OK"',
    }
  }
}))

// Beispiel für eine komplette Verkabelung
export const WiringExample = () => {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '400px' }}>
      <AnimatedCable color="#FF0000">
        <svg>
          <path d="M 50 50 Q 100 100 150 50" />
          <path className="pulse" d="M 50 50 Q 100 100 150 50" />
        </svg>
      </AnimatedCable>
    </Box>
  )
}