// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/DistributionHistory/TrackAndTraceHistory.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  Box, Typography, Paper, Tabs, Tab, 
  LinearProgress, useTheme, alpha,
  Dialog, DialogTitle, DialogContent,
  IconButton, Chip, Fade, Zoom,
  Table, TableBody, TableCell, TableRow,
  Divider, useMediaQuery
} from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'

// Icons
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GrassIcon from '@mui/icons-material/Grass'
import NatureIcon from '@mui/icons-material/Nature'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import BuildIcon from '@mui/icons-material/Build'
import ScienceIcon from '@mui/icons-material/Science'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'

import api from '@/utils/api'

// Animations
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`

// Styled Components
const Container = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '4px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
}))

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75, 2),
  backgroundColor: theme.palette.success.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '36px'
}))

const FlowContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  flex: 1,
  minHeight: '160px'
}))

const StepsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  position: 'relative',
  gap: 0
}))

const StepCard = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
  padding: theme.spacing(1.5, 0.5, 1, 0.5),
  minWidth: '70px',
  transition: 'all 0.2s ease',
  '&:hover': {
    '& .step-icon': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  }
}))

const StepNumber = styled(Box)(({ theme, isactive, iscomplete }) => ({
  position: 'absolute',
  top: '-5px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: isactive 
    ? theme.palette.success.main 
    : iscomplete 
      ? theme.palette.success.main
      : theme.palette.grey[400],
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.65rem',
  fontWeight: 'bold',
  zIndex: 2,
  border: `2px solid ${theme.palette.background.paper}`
}))

const StepIcon = styled(Box)(({ theme, isactive, iscomplete }) => ({
  width: '100%',
  maxWidth: '70px',
  minWidth: '50px',
  aspectRatio: '1',
  borderRadius: '4px',
  backgroundColor: isactive 
    ? alpha(theme.palette.success.main, 0.1)
    : iscomplete
      ? 'white'
      : theme.palette.grey[50],
  border: `2px solid ${
    isactive 
      ? theme.palette.success.main 
      : iscomplete
        ? theme.palette.success.main
        : theme.palette.grey[300]
  }`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'visible',
  boxShadow: isactive ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none',
  '& svg': {
    fontSize: '24px',
    color: isactive 
      ? theme.palette.success.main 
      : iscomplete
        ? theme.palette.success.main
        : theme.palette.grey[600]
  },
  animation: isactive ? `${pulse} 2s infinite` : 'none'
}))

const StepLabel = styled(Typography)(({ theme, isactive }) => ({
  fontSize: '0.7rem',
  fontWeight: isactive ? 600 : 400,
  color: isactive 
    ? theme.palette.text.primary 
    : theme.palette.text.secondary,
  textAlign: 'center',
  lineHeight: 1.2,
  marginBottom: theme.spacing(0.25)
}))

const StepDate = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.disabled,
  textAlign: 'center'
}))

const StepConnector = styled(Box)(({ theme, iscomplete }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .arrow-icon': {
    fontSize: '36px',
    color: iscomplete ? theme.palette.success.main : theme.palette.grey[500],
    opacity: iscomplete ? 1 : 0.4,
    transition: 'all 0.3s ease'
  }
}))

const CheckIcon = styled(CheckCircleIcon)(({ theme }) => ({
  position: 'absolute',
  bottom: '-8px',
  right: '-8px',
  fontSize: '20px',
  color: theme.palette.success.main,
  backgroundColor: 'white',
  borderRadius: '50%',
  border: `2px solid white`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
}))

const StepDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '4px',
    maxWidth: '500px',
    width: '100%'
  }
}))

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.success.main, 0.1),
  color: theme.palette.success.dark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`
}))

const DetailRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.success.main, 0.02)
  },
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    padding: theme.spacing(1.5)
  }
}))

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'k.A.'
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'k.A.'
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStepIcon = (type) => {
  const iconMap = {
    'seed': <GrassIcon />,
    'mother': <NatureIcon />,
    'cutting': <ContentCutIcon />,
    'flowering': <LocalFloristIcon />,
    'harvest': <AgricultureIcon />,
    'drying': <WbSunnyIcon />,
    'processing': <BuildIcon />,
    'labtesting': <ScienceIcon />,
    'packaging': <InventoryIcon />,
    'distribution': <LocalShippingIcon />
  }
  return iconMap[type]
}

export default function TrackAndTraceHistory({ distribution }) {
  const theme = useTheme()
  const [selectedUnit, setSelectedUnit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [trackingData, setTrackingData] = useState({})
  const [selectedStep, setSelectedStep] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('lg'))
  
  useEffect(() => {
    loadTrackingData()
  }, [distribution])
  
  const loadTrackingData = async () => {
    setLoading(true)
    
    try {
      const trackingPromises = distribution.packaging_units.map(async (unit) => {
        return buildTrackingHistory(unit)
      })
      
      const results = await Promise.all(trackingPromises)
      const dataMap = {}
      
      distribution.packaging_units.forEach((unit, index) => {
        dataMap[index] = results[index]
      })
      
      setTrackingData(dataMap)
    } catch (err) {
      console.error('Fehler beim Laden der Tracking-Daten:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const buildTrackingHistory = (unit) => {
    const steps = []
    
    steps.push({
      type: 'seed',
      title: 'Samenkauf',
      shortTitle: 'Samen',
      date: '2025-01-15T10:30:00',
      location: 'Lager A',
      batchNumber: 'SEED:0001',
      strain: unit.batch?.source_strain || 'White Widow',
      isComplete: true,
      details: [
        { label: 'Anzahl', value: '10 Stück' },
        { label: 'THC', value: '18-22%' },
        { label: 'CBD', value: '0.5-1%' },
        { label: 'Lieferant', value: 'Dutch Seeds' },
        { label: 'Typ', value: 'Feminisiert' }
      ],
      persons: [
        { role: 'Eingekauft', name: 'M. Mustermann' },
        { role: 'Geprüft', name: 'Dr. Weber' }
      ]
    })
    
    steps.push({
      type: 'mother',
      title: 'Mutterpflanze',
      shortTitle: 'Mutter',
      date: '2025-02-01T14:00:00',
      location: 'Mutterpflanzen-Raum',
      batchNumber: 'MOTHER:01:02:2025:0003',
      isComplete: true,
      details: [
        { label: 'Anzahl', value: '1 Pflanze' },
        { label: 'Wachstum', value: '6 Wochen' },
        { label: 'Temperatur', value: '24°C Tag / 18°C Nacht' },
        { label: 'Luftfeuchtigkeit', value: '65%' },
        { label: 'Lichtzyklus', value: '18/6' }
      ],
      persons: [
        { role: 'Gepflanzt', name: 'A. Schmidt' },
        { role: 'Betreut', name: 'P. Müller' }
      ]
    })
    
    steps.push({
      type: 'cutting',
      title: 'Stecklinge',
      shortTitle: 'Stecklinge',
      date: '2025-03-15T09:00:00',
      location: 'Stecklingsraum',
      batchNumber: 'CUT:15:03:2025:0042',
      isComplete: true,
      details: [
        { label: 'Anzahl', value: '20 Stück' },
        { label: 'Erfolgsrate', value: '95%' },
        { label: 'Bewurzelungsdauer', value: '14 Tage' },
        { label: 'Medium', value: 'Steinwolle' }
      ],
      persons: [
        { role: 'Geschnitten', name: 'A. Schmidt' }
      ]
    })
    
    steps.push({
      type: 'flowering',
      title: 'Blühphase',
      shortTitle: 'Blüte',
      date: '2025-04-01T12:00:00',
      location: 'Blühraum 2',
      batchNumber: 'BLOOM:01:04:2025:0015',
      isComplete: true,
      details: [
        { label: 'Pflanzen', value: '18 Stück' },
        { label: 'Lichtzyklus', value: '12/12' },
        { label: 'Blühdauer', value: '8 Wochen' },
        { label: 'EC-Wert', value: '1.8-2.2' },
        { label: 'pH-Wert', value: '6.0-6.5' }
      ],
      persons: [
        { role: 'Umgesetzt', name: 'P. Müller' }
      ]
    })
    
    steps.push({
      type: 'harvest',
      title: 'Ernte',
      shortTitle: 'Ernte',
      date: '2025-05-26T16:00:00',
      location: 'Ernteraum',
      batchNumber: 'HARV:26:05:2025:0008',
      isComplete: true,
      details: [
        { label: 'Nassgewicht', value: '450g' },
        { label: 'Qualität', value: 'A+' },
        { label: 'Feuchtigkeit', value: '65%' },
        { label: 'Trichome', value: '90% milchig' }
      ],
      persons: [
        { role: 'Geerntet', name: 'Team Alpha' }
      ]
    })
    
    steps.push({
      type: 'drying',
      title: 'Trocknung',
      shortTitle: 'Trocknung',
      date: '2025-06-05T10:00:00',
      location: 'Trocknungsraum',
      batchNumber: 'DRY:05:06:2025:0003',
      isComplete: true,
      details: [
        { label: 'Trockengewicht', value: '112g' },
        { label: 'Gewichtsverlust', value: '75%' },
        { label: 'Trocknungsdauer', value: '10 Tage' },
        { label: 'Temperatur', value: '20°C' },
        { label: 'Luftfeuchtigkeit', value: '55%' }
      ],
      persons: [
        { role: 'Überwacht', name: 'K. Weber' }
      ]
    })
    
    steps.push({
      type: 'processing',
      title: 'Verarbeitung',
      shortTitle: 'Verarbeitung',
      date: '2025-06-06T14:00:00',
      location: 'Verarbeitungsraum',
      batchNumber: 'PROC:06:06:2025:0002',
      isComplete: true,
      details: [
        { label: 'Produkt', value: unit.batch?.product_type === 'marijuana' ? 'Marihuana' : 'Haschisch' },
        { label: 'Gewicht', value: `${unit.weight}g` },
        { label: 'Ausbeute', value: '95%' },
        { label: 'Methode', value: 'Handtrimm' }
      ],
      persons: [
        { role: 'Verarbeitet', name: 'M. Garcia' }
      ]
    })
    
    steps.push({
      type: 'labtesting',
      title: 'Labortest',
      shortTitle: 'Labor',
      date: '2025-06-06T16:00:00',
      location: 'Labor',
      batchNumber: 'LAB:06:06:2025:0001',
      isComplete: true,
      details: [
        { label: 'THC-Gehalt', value: '19.5%' },
        { label: 'CBD-Gehalt', value: '0.8%' },
        { label: 'Status', value: 'Freigegeben' },
        { label: 'Probenmenge', value: '2g' },
        { label: 'Mikrobiologie', value: 'Bestanden' }
      ],
      persons: [
        { role: 'Getestet', name: 'Dr. Johnson' }
      ]
    })
    
    steps.push({
      type: 'packaging',
      title: 'Verpackung',
      shortTitle: 'Verpackt',
      date: '2025-06-07T09:00:00',
      location: 'Verpackungsstation',
      batchNumber: unit.batch_number,
      isComplete: true,
      details: [
        { label: 'Gewicht', value: `${unit.weight}g` },
        { label: 'Verpackungstyp', value: 'Medizinische Dose' },
        { label: 'Siegel', value: 'Manipulationssicher' },
        { label: 'Charge', value: unit.batch_number }
      ],
      persons: [
        { role: 'Verpackt', name: 'Team Bravo' }
      ]
    })
    
    steps.push({
      type: 'distribution',
      title: 'Ausgabe',
      shortTitle: 'Ausgabe',
      date: distribution.distribution_date,
      location: 'Ausgabestelle',
      batchNumber: distribution.batch_number,
      isActive: true,
      isComplete: false,
      details: [
        { label: 'Gesamtgewicht', value: `${distribution.total_weight?.toFixed(2)}g` },
        { label: 'Einheiten', value: distribution.packaging_units?.length },
        { label: 'Authentifizierung', value: 'RFID-Verifiziert' }
      ],
      persons: [
        { role: 'Empfänger', name: `${distribution.recipient?.first_name} ${distribution.recipient?.last_name}` },
        { role: 'Ausgeber', name: `${distribution.distributor?.first_name} ${distribution.distributor?.last_name}` }
      ]
    })
    
    return steps
  }
  
  const handleStepClick = (step) => {
    setSelectedStep(step)
    setDialogOpen(true)
  }
  
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setTimeout(() => setSelectedStep(null), 200)
  }
  
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress 
          color="success" 
          sx={{ 
            height: '4px'
          }}
        />
      </Box>
    )
  }
  
  const currentTrackingData = trackingData[selectedUnit] || []
  
  return (
    <Container elevation={1}>
      {/* Header */}
      <Header>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Track & Trace
        </Typography>
        {distribution.packaging_units?.length > 1 && (
          <Tabs 
            value={selectedUnit} 
            onChange={(e, v) => setSelectedUnit(v)}
            sx={{
              minHeight: 'auto',
              '& .MuiTab-root': {
                minHeight: '30px',
                color: 'rgba(255,255,255,0.8)',
                padding: '4px 8px',
                fontSize: '0.75rem',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'white'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: '2px'
              }
            }}
          >
            {distribution.packaging_units.map((unit, index) => (
              <Tab 
                key={index} 
                label={`${unit.batch_number} (${unit.weight}g)`} 
              />
            ))}
          </Tabs>
        )}
      </Header>
      
      {/* Flow Container */}
      <FlowContainer>
        <StepsWrapper>
          {currentTrackingData.map((step, index) => {
            const isLast = index === currentTrackingData.length - 1
            
            return (
              <React.Fragment key={index}>
                <StepCard>
                  <Box
                    onClick={() => handleStepClick(step)}
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    <StepNumber
                      isactive={step.isActive ? 'true' : undefined}
                      iscomplete={step.isComplete ? 'true' : undefined}
                    >
                      {index + 1}
                    </StepNumber>
                    
                    <StepIcon 
                      className="step-icon"
                      isactive={step.isActive ? 'true' : undefined}
                      iscomplete={step.isComplete ? 'true' : undefined}
                    >
                      {getStepIcon(step.type)}
                      {step.isComplete && !step.isActive && <CheckIcon />}
                    </StepIcon>
                    
                    <StepLabel isactive={step.isActive ? 'true' : undefined}>
                      {step.shortTitle}
                    </StepLabel>
                    
                    <StepDate>
                      {formatDate(step.date)}
                    </StepDate>
                  </Box>
                </StepCard>
                
                {!isLast && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    flexShrink: 0,
                    alignSelf: 'center',
                    marginBottom: '40px'
                  }}>
                    <StepConnector 
                      iscomplete={step.isComplete ? 'true' : undefined}
                    >
                      <KeyboardArrowRightIcon className="arrow-icon" />
                    </StepConnector>
                  </Box>
                )}
              </React.Fragment>
            )
          })}
        </StepsWrapper>
      </FlowContainer>
      
{/* Detail Dialog */}
      <StepDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 200 }}
      >
        {selectedStep && (
          <>
            <DialogHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: '4px',
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  display: 'flex',
                  color: theme.palette.success.main
                }}>
                  {getStepIcon(selectedStep.type)}
                </Box>
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  {selectedStep.title}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseDialog}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </DialogHeader>
            
            <DialogContent sx={{ p: 0 }}>
              <Table>
                <TableBody>
                  <DetailRow>
                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>Datum & Zeit</TableCell>
                    <TableCell>{formatDateTime(selectedStep.date)}</TableCell>
                  </DetailRow>
                  <DetailRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ort</TableCell>
                    <TableCell>{selectedStep.location}</TableCell>
                  </DetailRow>
                  <DetailRow>
                    <TableCell sx={{ fontWeight: 600 }}>Chargennummer</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedStep.batchNumber}
                    </TableCell>
                  </DetailRow>
                  {selectedStep.strain && (
                    <DetailRow>
                      <TableCell sx={{ fontWeight: 600 }}>Genetik</TableCell>
                      <TableCell>{selectedStep.strain}</TableCell>
                    </DetailRow>
                  )}
                  
                  {/* Nur für Distribution-Step: Genetik, THC, Produkttyp */}
                  {selectedStep.type === 'distribution' && distribution.packaging_units?.length > 0 && (
                    <>
                      <DetailRow>
                        <TableCell sx={{ fontWeight: 600 }}>Genetik</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScienceIcon fontSize="small" color="action" />
                            {distribution.packaging_units[0].batch?.source_strain || 'Unbekannt'}
                          </Box>
                        </TableCell>
                      </DetailRow>
                      <DetailRow>
                        <TableCell sx={{ fontWeight: 600 }}>THC-Gehalt</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {distribution.packaging_units[0].batch?.thc_content || 'k.A.'}%
                          </Typography>
                        </TableCell>
                      </DetailRow>
                      <DetailRow>
                        <TableCell sx={{ fontWeight: 600 }}>Produkttyp</TableCell>
                        <TableCell>
                          <Chip
                            icon={distribution.packaging_units[0].batch?.product_type === 'marijuana' ? 
                                  <LocalFloristIcon /> : <FilterDramaIcon />}
                            label={distribution.packaging_units[0].batch?.product_type_display || 'Unbekannt'}
                            size="small"
                            color={distribution.packaging_units[0].batch?.product_type === 'marijuana' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </DetailRow>
                    </>
                  )}
                </TableBody>
              </Table>
              
              {selectedStep.details && selectedStep.details.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                      Prozessdetails
                    </Typography>
                  </Box>
                  <Table>
                    <TableBody>
                      {selectedStep.details.map((detail, idx) => (
                        <DetailRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, width: '40%' }}>{detail.label}</TableCell>
                          <TableCell>{detail.value}</TableCell>
                        </DetailRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              
              {selectedStep.persons && selectedStep.persons.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                      Verantwortliche Personen
                    </Typography>
                  </Box>
                  <Table>
                    <TableBody>
                      {selectedStep.persons.map((person, idx) => (
                        <DetailRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, width: '40%' }}>{person.role}</TableCell>
                          <TableCell>{person.name}</TableCell>
                        </DetailRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </DialogContent>
          </>
        )}
      </StepDialog>
    </Container>
  )
}