// frontend/src/apps/trackandtrace/pages/LabTesting/components/LabTestingTable.jsx
import React from 'react'
import { Box, Typography, Button, IconButton, Badge, Tooltip } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import ScienceIcon from '@mui/icons-material/Science'
import BiotechIcon from '@mui/icons-material/Biotech'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import InventoryIcon from '@mui/icons-material/Inventory'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'

/**
 * LabTestingTable Komponente für die Darstellung der Laborkontroll-Tabelle
 */
const LabTestingTable = ({
  tabValue,
  data,
  expandedLabTestingId,
  onExpandLabTesting,
  onOpenDestroyDialog,
  onOpenUpdateLabResultsDialog,
  onOpenConvertToPackagingDialog,
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
      { label: 'Probengewicht', width: '10%', align: 'center' },
      { label: 'Verbleibendes Gewicht', width: '10%', align: 'center' },
      { label: 'Status', width: '10%', align: 'center' },
      { label: 'Verarbeitet von', width: '11%', align: 'left' }, // Reduziert
      { label: 'Erstellt am', width: '9%', align: 'left' }, // Reduziert
      { label: 'Medien', width: '8%', align: 'center' }, // NEU
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Hilfsfunktion zum Ermitteln des Produkttyps für die Anzeige
  const getProductTypeDisplay = (labTesting) => {
    // Wenn product_type_display verfügbar ist, verwende es
    if (labTesting.product_type_display) {
      return labTesting.product_type_display;
    }
    
    // Ansonsten manuell konvertieren
    if (labTesting.product_type === 'marijuana') {
      return 'Marihuana';
    } else if (labTesting.product_type === 'hashish') {
      return 'Haschisch';
    }
    
    // Fallback
    return labTesting.product_type || 'Unbekannt';
  };

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (labTesting) => {
    // Bestimme Icon und Farbe für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (labTesting.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    // Status-Anzeige
    const getStatusDisplay = (status) => {
      if (status === 'pending') {
        return {
          content: 'In Bearbeitung',
          icon: BiotechIcon,
          iconColor: 'info.main'
        };
      } else if (status === 'passed') {
        return {
          content: 'Freigegeben',
          icon: CheckCircleIcon,
          iconColor: 'success.main'
        };
      } else if (status === 'failed') {
        return {
          content: 'Nicht bestanden',
          icon: CancelIcon,
          iconColor: 'warning.main'
        };
      }
      return {
        content: status,
        icon: BiotechIcon,
        iconColor: 'text.secondary'
      };
    };
    
    const statusDisplay = getStatusDisplay(labTesting.status);
    
    // Für vernichtete Proben einen speziellen Hinweis anzeigen
    if (labTesting.is_destroyed && labTesting.destroy_reason && labTesting.destroy_reason.includes("Verbrauch durch Laboranalyse")) {
      return [
        {
          content: (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                Verbrauchte Laborprobe
              </Typography>
              <Typography>{labTesting.source_strain || "Unbekannt"}</Typography>
            </Box>
          ),
          width: '14%', // Angepasst
          bold: true,
          icon: ScienceIcon,
          iconColor: 'error.main'
        },
        {
          content: getProductTypeDisplay(labTesting),
          width: '11%', // Angepasst
          bold: true,
          icon: productIcon,
          iconColor: tabValue === 3 ? 'error.main' : productColor
        },
        {
          content: labTesting.batch_number || '',
          width: '16%', // Angepasst
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        },
        {
          content: `${parseFloat(labTesting.sample_weight).toLocaleString('de-DE')}g`,
          width: '10%',
          align: 'center'
        },
        {
          content: `${(parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE')}g`,
          width: '10%',
          align: 'center',
          bold: true,
          icon: SpeedIcon,
          iconColor: 'error.main'
        },
        {
          content: statusDisplay.content,
          width: '10%',
          align: 'center',
          bold: true,
          icon: statusDisplay.icon,
          iconColor: statusDisplay.iconColor
        },
        {
          content: labTesting.member ? 
            (labTesting.member.display_name || `${labTesting.member.first_name} ${labTesting.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '11%' // Angepasst
        },
        {
          content: new Date(labTesting.created_at).toLocaleDateString('de-DE'),
          width: '9%' // Angepasst
        },
        // NEU: Medien-Spalte für verbrauchte Proben
        {
          content: (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Tooltip title={`Medien verwalten (${labTesting.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(labTesting, e)
                  }}
                  sx={{ 
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Badge 
                    badgeContent={labTesting.image_count || 0} 
                    color="error"
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
      ];
    }
    
    return [
      {
        content: labTesting.source_strain || "Unbekannt",
        width: '14%', // Angepasst
        bold: true,
        icon: ScienceIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'info.main'
      },
      {
        content: getProductTypeDisplay(labTesting),
        width: '11%', // Angepasst
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: labTesting.batch_number || '',
        width: '16%', // Angepasst
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(labTesting.sample_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center'
      },
      {
        content: `${(parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: SpeedIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'info.main'
      },
      {
        content: statusDisplay.content,
        width: '10%',
        align: 'center',
        bold: true,
        icon: statusDisplay.icon,
        iconColor: statusDisplay.iconColor
      },
      {
        content: labTesting.member ? 
          (labTesting.member.display_name || `${labTesting.member.first_name} ${labTesting.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '11%' // Angepasst
      },
      {
        content: new Date(labTesting.created_at).toLocaleDateString('de-DE'),
        width: '9%' // Angepasst
      },
      // NEU: Medien-Spalte
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title={`Medien verwalten (${labTesting.image_count || 0})`}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenImageModal(labTesting, e)
                }}
                sx={{ 
                  color: tabValue === 3 ? 'error.main' : 
                        labTesting.status === 'passed' ? 'success.main' : 
                        labTesting.status === 'failed' ? 'warning.main' : 'info.main',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Badge 
                  badgeContent={labTesting.image_count || 0} 
                  color={tabValue === 3 ? 'error' : 
                        labTesting.status === 'passed' ? 'success' : 
                        labTesting.status === 'failed' ? 'warning' : 'info'}
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
  const getActivityMessage = (labTesting) => {
    const processor = labTesting.member 
      ? (labTesting.member.display_name || `${labTesting.member.first_name} ${labTesting.member.last_name}`) 
      : "Unbekannt";
    const roomName = labTesting.room ? labTesting.room.name : "unbekanntem Raum";
    const date = new Date(labTesting.created_at).toLocaleDateString('de-DE');
    const inputWeight = parseFloat(labTesting.input_weight).toLocaleString('de-DE');
    const sampleWeight = parseFloat(labTesting.sample_weight).toLocaleString('de-DE');
    const remainingWeight = (parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE');
    const productType = getProductTypeDisplay(labTesting);
    const processingInfo = labTesting.processing_batch_number || "Unbekannte Charge";
    
    // Status als Text
    let statusText = "in Bearbeitung";
    if (labTesting.status === 'passed') statusText = "freigegeben";
    else if (labTesting.status === 'failed') statusText = "nicht bestanden";
    
    if (tabValue !== 3) {
      return `Laborkontrolle für ${productType} ${labTesting.batch_number} mit Genetik ${labTesting.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} erstellt. Eingangsgewicht: ${inputWeight}g, Probengewicht: ${sampleWeight}g, Restgewicht: ${remainingWeight}g. Status: ${statusText}. Quelle: Verarbeitung ${processingInfo}.`;
    } else {
      const destroyDate = labTesting.destroyed_at ? new Date(labTesting.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = labTesting.destroyed_by ? 
        (labTesting.destroyed_by.display_name || `${labTesting.destroyed_by.first_name} ${labTesting.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Laborkontrolle für ${productType} ${labTesting.batch_number} mit Genetik ${labTesting.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${labTesting.destroy_reason || "Kein Grund angegeben"}. Eingangsgewicht: ${inputWeight}g.`;
    }
  };

  // Detailansicht für eine Laborkontrolle rendern
  const renderLabTestingDetails = (labTesting) => {
    // Bestimme Icon, Farbe und Text für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    let productType = getProductTypeDisplay(labTesting);
    
    if (labTesting.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {labTesting.batch_number}
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
            {labTesting.id}
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
            {new Date(labTesting.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && labTesting.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(labTesting.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {labTesting.processing_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const testingDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {labTesting.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Eingangsgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {parseFloat(labTesting.input_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Probengewicht (zur Analyse):
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {parseFloat(labTesting.sample_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Verfügbares Gewicht (nach Probennahme):
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {(parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {labTesting.thc_content ? `${labTesting.thc_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {labTesting.cbd_content ? `${labTesting.cbd_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        
        {/* Nur für freigegebene oder nicht bestandene Tests anzeigen */}
        {(labTesting.status === 'passed' || labTesting.status === 'failed') && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mt: 1, 
            p: 1, 
            bgcolor: 'error.lighter', 
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'error.main'
          }}>
            <LocalFireDepartmentIcon sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              Die Laborprobe von {parseFloat(labTesting.sample_weight).toLocaleString('de-DE')}g wurde nach Abschluss der Tests automatisch als vernichtet dokumentiert.
            </Typography>
          </Box>
        )}
        
        {tabValue === 3 && labTesting.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {labTesting.destroyed_by.display_name || 
               `${labTesting.destroyed_by.first_name || ''} ${labTesting.destroyed_by.last_name || ''}`.trim() || 
               "Unbekannt"}
            </Typography>
          </Box>
        )}
      </Box>
    )

    const labNotesContent = (
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          flexGrow: 1,
          display: 'flex',
          alignItems: labTesting.lab_notes ? 'flex-start' : 'center',
          justifyContent: labTesting.lab_notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: labTesting.lab_notes ? 'normal' : 'italic',
            color: labTesting.lab_notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {labTesting.lab_notes || 'Keine Laborergebnisse für diese Laborkontrolle vorhanden'}
        </Typography>
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
          alignItems: labTesting.notes ? 'flex-start' : 'center',
          justifyContent: labTesting.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: labTesting.notes ? 'normal' : 'italic',
            color: labTesting.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {labTesting.notes || 'Keine Notizen für diese Laborkontrolle vorhanden'}
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
            fontStyle: labTesting.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {labTesting.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Labortestung-Details',
        content: testingDetails
      },
      {
        title: labTesting.status === 'pending' ? 'Laborergebnisse' : 
              tabValue === 3 ? 'Vernichtungsgrund' : 'Laborergebnisse',
        content: tabValue === 3 ? destroyReasonContent : labNotesContent
      },
      {
        title: 'Notizen',
        content: notesContent
      }
    ]

    // Bestimme Farbe basierend auf Tab und Status
    let cardColor = 'info.main';
    
    if (tabValue === 3) {
      cardColor = 'error.main';
    } else if (tabValue === 1 || labTesting.status === 'passed') {
      cardColor = 'success.main';
    } else if (tabValue === 2 || labTesting.status === 'failed') {
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
            {getActivityMessage(labTesting)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />

        {/* Aktionsbereich */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {/* Linke Seite: Buttons für Laborergebnisse aktualisieren */}
            <Box>
              {(tabValue === 0 || tabValue === 2) && (
                <Button 
                  variant="contained" 
                  color="info"
                  onClick={() => onOpenUpdateLabResultsDialog(labTesting)}
                  startIcon={<BiotechIcon />}
                  sx={{ mr: 1 }}
                >
                  Laborergebnisse aktualisieren
                </Button>
              )}
            </Box>
            
            {/* Rechte Seite: Buttons für Vernichtung und Konvertierung */}
            <Box>
              {tabValue === 1 && labTesting.status === 'passed' && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => onOpenConvertToPackagingDialog(labTesting)}
                  startIcon={<InventoryIcon />}
                  sx={{ mr: 1 }}
                >
                  Zu Verpackung konvertieren
                </Button>
              )}
              
              <Button 
                variant="contained" 
                color="error"
                onClick={() => onOpenDestroyDialog(labTesting)}
                startIcon={<LocalFireDepartmentIcon />}
              >
                Laborkontrolle vernichten
              </Button>
            </Box>
          </Box>
        )}
      </>
    )
  }

  // Bestimme Tabellen-Farbe basierend auf Tab
  let tableColor = 'info';
  if (tabValue === 1) tableColor = 'success';
  else if (tabValue === 2) tableColor = 'warning';
  else if (tabValue === 3) tableColor = 'error';

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((labTesting) => (
          <AccordionRow
            key={labTesting.id}
            isExpanded={expandedLabTestingId === labTesting.id}
            onClick={() => onExpandLabTesting(labTesting.id)}
            columns={getRowColumns(labTesting)}
            borderColor={
              tabValue === 3 ? 'error.main' : 
              labTesting.status === 'passed' ? 'success.main' : 
              labTesting.status === 'failed' ? 'warning.main' : 'info.main'
            }
            expandIconPosition="end"
          >
            {renderLabTestingDetails(labTesting)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine Laborkontrollen in Bearbeitung vorhanden' : 
           tabValue === 1 ? 'Keine freigegebenen Laborkontrollen vorhanden' : 
           tabValue === 2 ? 'Keine nicht bestandenen Laborkontrollen vorhanden' : 
           'Keine vernichteten Laborkontrollen vorhanden'}
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

export default LabTestingTable