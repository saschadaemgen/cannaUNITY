// frontend/src/apps/trackandtrace/pages/Processing/components/ProcessingTable.jsx
import React from 'react'
import { Box, Typography, Button, IconButton, Badge, Tooltip } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SeedIcon from '@mui/icons-material/Spa'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import ScienceIcon from '@mui/icons-material/Science' // Neuer Import für das Labor-Icon
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'

/**
 * ProcessingTable Komponente für die Darstellung der Verarbeitungs-Tabelle
 */
const ProcessingTable = ({
  tabValue,
  data,
  expandedProcessingId,
  onExpandProcessing,
  onOpenDestroyDialog,
  onOpenConvertToLabTestingDialog, // Neue Prop für den Konvertieren-Dialog
  onOpenImageModal, // NEU
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '14%', align: 'left' }, // Reduziert
      { label: 'Produkttyp', width: '11%', align: 'left' }, // Reduziert
      { label: 'Charge-Nummer', width: '16%', align: 'left' }, // Reduziert
      { label: 'Input-Gewicht', width: '10%', align: 'center' },
      { label: 'Output-Gewicht', width: '10%', align: 'center' },
      { label: 'Ausbeute', width: '8%', align: 'center' },
      { label: 'Verarbeitet von', width: '11%', align: 'left' }, // Reduziert
      { label: 'Erstellt am', width: '9%', align: 'left' }, // Reduziert
      { label: 'Medien', width: '8%', align: 'center' }, // NEU
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (processing) => {
    const yieldPercentage = processing.yield_percentage.toFixed(1);
    
    // Bestimme Icon und Farbe für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (processing.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    return [
      {
        content: processing.source_strain || "Unbekannt",
        width: '14%', // Angepasst
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: processing.product_type_display || processing.product_type,
        width: '11%', // Angepasst
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: processing.batch_number || '',
        width: '16%', // Angepasst
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(processing.input_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center'
      },
      {
        content: `${parseFloat(processing.output_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: SpeedIcon,
        iconColor: tabValue === 3 ? 'error.main' : (processing.product_type === 'marijuana' ? 'success.main' : 'warning.main')
      },
      {
        content: `${yieldPercentage}%`,
        width: '8%',
        align: 'center'
      },
      {
        content: processing.member ? 
          (processing.member.display_name || `${processing.member.first_name} ${processing.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '11%' // Angepasst
      },
      {
        content: new Date(processing.created_at).toLocaleDateString('de-DE'),
        width: '9%' // Angepasst
      },
      // NEU: Medien-Spalte
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title={`Medien verwalten (${processing.image_count || 0})`}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenImageModal(processing, e)
                }}
                sx={{ 
                  color: tabValue === 3 ? 'error.main' : 
                        (processing.product_type === 'marijuana' ? 'success.main' : 'warning.main'),
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Badge 
                  badgeContent={processing.image_count || 0} 
                  color={tabValue === 3 ? 'error' : 
                        (processing.product_type === 'marijuana' ? 'success' : 'warning')}
                >
                  <PhotoCameraIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        ),
        width: '8%',
        align: 'center',
        stopPropagation: true
      },
      {
        content: '',  // Platz für das Aufklapp-Symbol
        width: '3%'
      }
    ]
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (processing) => {
    const processor = processing.member 
      ? (processing.member.display_name || `${processing.member.first_name} ${processing.member.last_name}`) 
      : "Unbekannt";
    const roomName = processing.room ? processing.room.name : "unbekanntem Raum";
    const date = new Date(processing.created_at).toLocaleDateString('de-DE');
    const inputWeight = parseFloat(processing.input_weight).toLocaleString('de-DE');
    const outputWeight = parseFloat(processing.output_weight).toLocaleString('de-DE');
    const dryingInfo = processing.drying_batch_number || "Unbekannte Charge";
    const yieldPercentage = processing.yield_percentage.toFixed(1);
    const wasteWeight = processing.waste_weight.toLocaleString('de-DE');
    const productType = processing.product_type_display || processing.product_type;
    
    if (tabValue !== 3) {
      return `${productType} ${processing.batch_number} mit Genetik ${processing.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} erstellt. Input-Gewicht: ${inputWeight}g, Output-Gewicht: ${outputWeight}g, Ausbeute: ${yieldPercentage}%, Verarbeitungsverlust: ${wasteWeight}g. Quelle: Trocknung ${dryingInfo}.`;
    } else {
      const destroyDate = processing.destroyed_at ? new Date(processing.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = processing.destroyed_by ? 
        (processing.destroyed_by.display_name || `${processing.destroyed_by.first_name} ${processing.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `${productType} ${processing.batch_number} mit Genetik ${processing.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${processing.destroy_reason || "Kein Grund angegeben"}. Output-Gewicht: ${outputWeight}g.`;
    }
  };

  // Detailansicht für eine Verarbeitung rendern
  const renderProcessingDetails = (processing) => {
    // Bestimme Icon, Farbe und Text für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    let productType = 'Marihuana';
    
    if (processing.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
      productType = 'Haschisch';
    }
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {processing.batch_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            UUID:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(0, 0, 0, 0.87)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}
          >
            {processing.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Produkttyp:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(productIcon, { style: { marginRight: '4px', color: productColor }, fontSize: 'small' })}
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {productType}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(processing.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && processing.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(processing.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {processing.drying_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const yieldDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {processing.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Input-Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {parseFloat(processing.input_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Output-Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(processing.output_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Ausbeute:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {processing.yield_percentage.toFixed(1)}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Verarbeitungsverlust:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {processing.waste_weight.toLocaleString('de-DE')}g
          </Typography>
        </Box>
        {tabValue === 3 && processing.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {processing.destroyed_by.display_name || 
               `${processing.destroyed_by.first_name || ''} ${processing.destroyed_by.last_name || ''}`.trim() || 
               "Unbekannt"}
            </Typography>
          </Box>
        )}
      </Box>
    )

    const notesContent = (
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          flexGrow: 1,
          display: 'flex',
          alignItems: processing.notes ? 'flex-start' : 'center',
          justifyContent: processing.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: processing.notes ? 'normal' : 'italic',
            color: processing.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {processing.notes || 'Keine Notizen für diese Verarbeitung vorhanden'}
        </Typography>
      </Box>
    )

    const destroyReasonContent = (
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: processing.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {processing.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Verarbeitungs-Details',
        content: yieldDetails
      },
      {
        title: tabValue === 3 ? 'Vernichtungsgrund' : 'Notizen',
        content: tabValue === 3 ? destroyReasonContent : notesContent
      }
    ]

    // Bestimme Farbe basierend auf Tab und Produkttyp
    let cardColor = 'secondary.main';
    
    if (tabValue === 3) {
      cardColor = 'error.main';
    } else if (tabValue === 0) {
      cardColor = processing.product_type === 'marijuana' ? 'success.main' : 'warning.main';
    } else if (tabValue === 1) {
      cardColor = 'success.main';
    } else if (tabValue === 2) {
      cardColor = 'warning.main';
    }

    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'white', 
            borderLeft: '4px solid',
            borderColor: cardColor,
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(processing)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />

        {/* Aktionsbereich für aktive Verarbeitungen */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {/* Linke Seite: Button für Konvertierung zu Laborkontrolle */}
            <Button 
              variant="contained" 
              color="info"
              onClick={() => onOpenConvertToLabTestingDialog(processing)}
              startIcon={<ScienceIcon />}
            >
              Zu Laborkontrolle konvertieren
            </Button>
            
            {/* Rechte Seite: Button für Vernichtung */}
            <Button 
              variant="contained" 
              color="error"
              onClick={() => onOpenDestroyDialog(processing)}
              startIcon={<LocalFireDepartmentIcon />}
            >
              Verarbeitung vernichten
            </Button>
          </Box>
        )}
      </>
    )
  }

  // Bestimme Tabellen-Farbe basierend auf Tab
  let tableColor = 'secondary';
  if (tabValue === 1) tableColor = 'success';
  else if (tabValue === 2) tableColor = 'warning';
  else if (tabValue === 3) tableColor = 'error';

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((processing) => (
          <AccordionRow
            key={processing.id}
            isExpanded={expandedProcessingId === processing.id}
            onClick={() => onExpandProcessing(processing.id)}
            columns={getRowColumns(processing)}
            borderColor={
              tabValue === 3 ? 'error.main' : 
              (processing.product_type === 'marijuana' ? 'success.main' : 'warning.main')
            }
            expandIconPosition="end"
          >
            {renderProcessingDetails(processing)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine Verarbeitungen vorhanden' : 
           tabValue === 1 ? 'Kein Marihuana vorhanden' : 
           tabValue === 2 ? 'Kein Haschisch vorhanden' : 
           'Keine vernichteten Verarbeitungen vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color={tableColor}
      />
    </Box>
  )
}

export default ProcessingTable