// frontend/src/apps/trackandtrace/pages/LabTesting/components/LabTestingTable.jsx
import React from 'react'
import { 
  Box, Typography, Button, IconButton, Badge, Tooltip,
  FormControl, Select, MenuItem, useTheme, alpha
} from '@mui/material'
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import FilterSection from '@/components/common/FilterSection'

const LabTestingTable = ({
  tabValue,
  data,
  expandedLabTestingId,
  onExpandLabTesting,
  onOpenDestroyDialog,
  onOpenUpdateLabResultsDialog,
  onOpenConvertToPackagingDialog,
  onOpenImageModal,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount,
  yearFilter,
  setYearFilter,
  monthFilter,
  setMonthFilter,
  dayFilter,
  setDayFilter,
  productTypeFilter,
  setProductTypeFilter,
  showFilters,
  setShowFilters,
  onFilterApply,
  onFilterReset
}) => {
  const theme = useTheme();
  
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '13%', align: 'left' },
      { label: 'Produkttyp', width: '10%', align: 'left' },
      { label: 'Charge-Nummer', width: '15%', align: 'left' },
      { label: 'Probengewicht', width: '10%', align: 'center' },
      { label: 'Verbleibendes Gewicht', width: '10%', align: 'center' },
      { label: 'Status', width: '10%', align: 'center' },
      { label: 'Verarbeitet von', width: '11%', align: 'left' },
      { label: 'Erstellt am', width: '9%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Hilfsfunktion zum Ermitteln des Produkttyps für die Anzeige
  const getProductTypeDisplay = (labTesting) => {
    if (labTesting.product_type_display) {
      return labTesting.product_type_display;
    }
    
    if (labTesting.product_type === 'marijuana') {
      return 'Marihuana';
    } else if (labTesting.product_type === 'hashish') {
      return 'Haschisch';
    }
    
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
    
    // Bestimme Tab-Farbe
    let tabColor = 'info.main';
    if (tabValue === 1) tabColor = 'success.main';
    else if (tabValue === 2) tabColor = 'warning.main';
    else if (tabValue === 3) tabColor = 'error.main';
    
    // Für vernichtete Proben einen speziellen Hinweis anzeigen
    if (labTesting.is_destroyed && labTesting.destroy_reason && labTesting.destroy_reason.includes("Verbrauch durch Laboranalyse")) {
      return [
        {
          content: (
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                onExpandLabTesting(labTesting.id);
              }}
              size="small"
              sx={{ 
                color: 'error.main',
                width: '28px',
                height: '28px',
                transform: expandedLabTestingId === labTesting.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 300ms ease-in-out'
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          ),
          width: '3%',
          align: 'center'
        },
        {
          content: (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                Verbrauchte Laborprobe
              </Typography>
              <Typography>{labTesting.source_strain || "Unbekannt"}</Typography>
            </Box>
          ),
          width: '13%',
          bold: true,
          icon: ScienceIcon,
          iconColor: 'error.main'
        },
        {
          content: getProductTypeDisplay(labTesting),
          width: '10%',
          bold: true,
          icon: productIcon,
          iconColor: tabValue === 3 ? 'error.main' : productColor
        },
        {
          content: labTesting.batch_number || '',
          width: '15%',
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
          width: '11%'
        },
        {
          content: new Date(labTesting.created_at).toLocaleDateString('de-DE'),
          width: '9%'
        },
        {
          content: (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    borderColor: theme.palette.divider
                  }
                }}
              >
                <Tooltip title={`Medien verwalten (${labTesting.image_count || 0})`}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenImageModal(labTesting, e)
                    }}
                    sx={{ 
                      p: 0.5,
                      color: theme.palette.text.secondary
                    }}
                  >
                    <Badge 
                      badgeContent={labTesting.image_count || 0} 
                      color="error"
                    >
                      <PhotoCameraIcon sx={{ fontSize: '1rem' }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ),
          width: '5%',
          align: 'center',
          stopPropagation: true
        }
      ];
    }
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandLabTesting(labTesting.id);
            }}
            size="small"
            sx={{ 
              color: tabColor,
              width: '28px',
              height: '28px',
              transform: expandedLabTestingId === labTesting.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        ),
        width: '3%',
        align: 'center'
      },
      {
        content: labTesting.source_strain || "Unbekannt",
        width: '13%',
        bold: true,
        icon: ScienceIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'info.main'
      },
      {
        content: getProductTypeDisplay(labTesting),
        width: '10%',
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: labTesting.batch_number || '',
        width: '15%',
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
        width: '11%'
      },
      {
        content: new Date(labTesting.created_at).toLocaleDateString('de-DE'),
        width: '9%'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title={`Medien verwalten (${labTesting.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(labTesting, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge 
                    badgeContent={labTesting.image_count || 0} 
                    color={tabValue === 3 ? 'error' : 
                          labTesting.status === 'passed' ? 'success' : 
                          labTesting.status === 'failed' ? 'warning' : 'info'}
                  >
                    <PhotoCameraIcon sx={{ fontSize: '1rem' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),
        width: '5%',
        align: 'center',
        stopPropagation: true
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {labTesting.batch_number}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            UUID:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.primary',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}
          >
            {labTesting.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Produkttyp:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(productIcon, { style: { marginRight: '4px', color: productColor }, fontSize: 'small' })}
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {productType}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {new Date(labTesting.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && labTesting.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {new Date(labTesting.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {labTesting.processing_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const testingDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {labTesting.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Eingangsgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {parseFloat(labTesting.input_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Probengewicht (zur Analyse):
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {parseFloat(labTesting.sample_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Verfügbares Gewicht (nach Probennahme):
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {(parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            {labTesting.thc_content ? `${labTesting.thc_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
            color: labTesting.lab_notes ? 'text.primary' : 'text.secondary',
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
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
            color: labTesting.notes ? 'text.primary' : 'text.secondary',
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
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: cardColor,
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
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
                <Box
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    borderRadius: '4px',
                    p: 0.75,
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.info.main, 0.08),
                      borderColor: alpha(theme.palette.info.main, 0.5)
                    }
                  }}
                >
                  <Button 
                    variant="text" 
                    color="info"
                    onClick={() => onOpenUpdateLabResultsDialog(labTesting)}
                    startIcon={<BiotechIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Laborergebnisse aktualisieren
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* Rechte Seite: Buttons für Vernichtung und Konvertierung */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {tabValue === 1 && labTesting.status === 'passed' && (
                <Box
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    borderRadius: '4px',
                    p: 0.75,
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.main, 0.08),
                      borderColor: alpha(theme.palette.success.main, 0.5)
                    }
                  }}
                >
                  <Button 
                    variant="text" 
                    color="success"
                    onClick={() => onOpenConvertToPackagingDialog(labTesting)}
                    startIcon={<InventoryIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Zu Verpackung konvertieren
                  </Button>
                </Box>
              )}
              
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.75,
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    borderColor: alpha(theme.palette.error.main, 0.5)
                  }
                }}
              >
                <Button 
                  variant="text" 
                  color="error"
                  onClick={() => onOpenDestroyDialog(labTesting)}
                  startIcon={<LocalFireDepartmentIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Laborkontrolle vernichten
                </Button>
              </Box>
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
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default,
      overflow: 'hidden'
    }}>
      {/* Filter Section - jetzt oben */}
      {showFilters && (
        <Box sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          flexShrink: 0
        }}>
          <FilterSection
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            onApply={onFilterApply}
            onReset={onFilterReset}
            showFilters={showFilters}
            productTypeFilter={productTypeFilter}
            setProductTypeFilter={setProductTypeFilter}
            showProductTypeFilter={true}
          />
        </Box>
      )}
      
      {/* Scrollbare Container für Header + Content */}
      <Box sx={{ 
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Scrollbarer Bereich */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          mt: 0,
          pt: 0,
          // Schöne Scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme => alpha(theme.palette.primary.main, 0.3),
            },
          },
        }}>
          {/* Tabellenkopf - sticky innerhalb des scrollbaren Containers */}
          <Box sx={{ 
            width: '100%', 
            display: 'flex',
            bgcolor: theme.palette.background.paper,
            height: '40px',
            alignItems: 'center',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            mt: 0,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              right: 0,
              height: '2px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
              pointerEvents: 'none'
            }
          }}>
            {getHeaderColumns().map((column, index) => (
              <Box
                key={index}
                sx={{ 
                  width: column.width || 'auto', 
                  px: 1.5,
                  textAlign: column.align || 'left', 
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {column.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Tabellenzeilen */}
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
                expandIconPosition="none"
                borderless={true}
              >
                {renderLabTestingDetails(labTesting)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              {tabValue === 0 ? 'Keine Laborkontrollen in Bearbeitung vorhanden' : 
               tabValue === 1 ? 'Keine freigegebenen Laborkontrollen vorhanden' : 
               tabValue === 2 ? 'Keine nicht bestandenen Laborkontrollen vorhanden' : 
               'Keine vernichteten Laborkontrollen vorhanden'}
            </Typography>
          )}
        </Box>
        
        {/* Pagination - außerhalb des scrollbaren Bereichs */}
        <Box 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backgroundColor: theme.palette.background.paper,
            p: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            minHeight: '56px'
          }}
        >
          {/* PaginationFooter */}
          {data && data.length > 0 && totalPages > 1 && (
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasData={true}
              color={tableColor}
            />
          )}
          
          {/* Einträge pro Seite */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            ml: data && data.length > 0 && totalPages > 1 ? 3 : 0 
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Einträge pro Seite
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                sx={{ fontSize: '0.875rem' }}
              >
                {pageSizeOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default LabTestingTable