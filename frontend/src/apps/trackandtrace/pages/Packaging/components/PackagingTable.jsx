// frontend/src/apps/trackandtrace/pages/Packaging/components/PackagingTable.jsx
import React from 'react'
import { Box, Typography, Button, IconButton } from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import InventoryIcon from '@mui/icons-material/Inventory'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'

import TableHeader from '../../../components/common/TableHeader'
import AccordionRow from '../../../components/common/AccordionRow'
import DetailCards from '../../../components/common/DetailCards'
import PaginationFooter from '../../../components/common/PaginationFooter'

/**
 * PackagingTable Komponente für die Darstellung der Verpackungs-Tabelle
 */
const PackagingTable = ({
  tabValue,
  data,
  expandedPackagingId,
  onExpandPackaging,
  onOpenDestroyDialog,
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Hilfsfunktion zum Ermitteln des Produkttyps für die Anzeige
  const getProductTypeDisplay = (item) => {
    if (item.product_type_display) {
      return item.product_type_display;
    }
    
    // Fallback zur manuellen Anzeige
    if (item.product_type === 'marijuana') {
      return 'Marihuana';
    } else if (item.product_type === 'hashish') {
      return 'Haschisch';
    }
    
    return item.product_type || 'Unbekannt';
  };

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '15%', align: 'left' },
      { label: 'Produkttyp', width: '12%', align: 'left' },
      { label: 'Charge-Nummer', width: '18%', align: 'left' },
      { label: 'Gesamtgewicht', width: '10%', align: 'center' },
      { label: 'Einheitenzahl', width: '10%', align: 'center' },
      { label: 'Einheitsgewicht', width: '8%', align: 'center' },
      { label: 'Verpackt von', width: '12%', align: 'left' },
      { label: 'Erstellt am', width: '10%', align: 'left' },
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (packaging) => {
    // Bestimme Icon und Farbe für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    
    if (packaging.product_type === 'hashish') {
      productIcon = FilterDramaIcon;
      productColor = 'warning.main';
    }
    
    return [
      {
        content: packaging.source_strain || "Unbekannt",
        width: '15%',
        bold: true,
        icon: ScienceIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: getProductTypeDisplay(packaging),
        width: '12%',
        bold: true,
        icon: productIcon,
        iconColor: tabValue === 3 ? 'error.main' : productColor
      },
      {
        content: packaging.batch_number || '',
        width: '18%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(packaging.total_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center'
      },
      {
        content: packaging.unit_count,
        width: '10%',
        align: 'center',
        bold: true,
        icon: InventoryIcon,
        iconColor: tabValue === 3 ? 'error.main' : 'secondary.main'
      },
      {
        content: `${parseFloat(packaging.unit_weight).toLocaleString('de-DE')}g`,
        width: '8%',
        align: 'center'
      },
      {
        content: packaging.member ? 
          (packaging.member.display_name || `${packaging.member.first_name} ${packaging.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '12%'
      },
      {
        content: new Date(packaging.created_at).toLocaleDateString('de-DE'),
        width: '10%'
      },
      {
        content: '',  // Platz für das Aufklapp-Symbol
        width: '3%'
      }
    ]
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (packaging) => {
    const processor = packaging.member 
      ? (packaging.member.display_name || `${packaging.member.first_name} ${packaging.member.last_name}`) 
      : "Unbekannt";
    const roomName = packaging.room ? packaging.room.name : "unbekanntem Raum";
    const date = new Date(packaging.created_at).toLocaleDateString('de-DE');
    const totalWeight = parseFloat(packaging.total_weight).toLocaleString('de-DE');
    const unitCount = packaging.unit_count;
    const unitWeight = parseFloat(packaging.unit_weight).toLocaleString('de-DE');
    const productType = getProductTypeDisplay(packaging);
    const labTestingInfo = packaging.lab_testing_batch_number || "Unbekannte Charge";
    
    if (tabValue !== 3) {
      return `${productType} ${packaging.batch_number} mit Genetik ${packaging.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} verpackt. Gesamtgewicht: ${totalWeight}g, Anzahl Einheiten: ${unitCount}, Gewicht pro Einheit: ${unitWeight}g. Quelle: Laborkontrolle ${labTestingInfo}.`;
    } else {
      const destroyDate = packaging.destroyed_at ? new Date(packaging.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = packaging.destroyed_by ? 
        (packaging.destroyed_by.display_name || `${packaging.destroyed_by.first_name} ${packaging.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Verpackung ${productType} ${packaging.batch_number} mit Genetik ${packaging.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${packaging.destroy_reason || "Kein Grund angegeben"}. Gesamtgewicht: ${totalWeight}g, Anzahl Einheiten: ${unitCount}.`;
    }
  };

  // Detailansicht für eine Verpackung rendern
  const renderPackagingDetails = (packaging) => {
    // Bestimme Icon, Farbe und Text für den Produkttyp
    let productIcon = LocalFloristIcon;
    let productColor = 'success.main';
    let productType = getProductTypeDisplay(packaging);
    
    if (packaging.product_type === 'hashish') {
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
            {packaging.batch_number}
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
            {packaging.id}
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
            {new Date(packaging.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(packaging.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.lab_testing_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const packagingDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gesamtgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {parseFloat(packaging.total_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Anzahl Einheiten:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {packaging.unit_count}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gewicht pro Einheit:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(packaging.unit_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            THC-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {packaging.thc_content ? `${packaging.thc_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            CBD-Gehalt:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {packaging.cbd_content ? `${packaging.cbd_content}%` : "Nicht getestet"}
          </Typography>
        </Box>
        {tabValue === 3 && packaging.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {packaging.destroyed_by.display_name || 
               `${packaging.destroyed_by.first_name || ''} ${packaging.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: packaging.notes ? 'flex-start' : 'center',
          justifyContent: packaging.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: packaging.notes ? 'normal' : 'italic',
            color: packaging.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {packaging.notes || 'Keine Notizen für diese Verpackung vorhanden'}
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
            fontStyle: packaging.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {packaging.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Verpackungs-Details',
        content: packagingDetails
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
      cardColor = packaging.product_type === 'marijuana' ? 'success.main' : 'warning.main';
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
            {getActivityMessage(packaging)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={cardColor} />

        {/* Aktionsbereich für aktive Verpackungen */}
        {tabValue !== 3 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => onOpenDestroyDialog(packaging)}
              startIcon={<LocalFireDepartmentIcon />}
            >
              Verpackung vernichten
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
        data.map((packaging) => (
          <AccordionRow
            key={packaging.id}
            isExpanded={expandedPackagingId === packaging.id}
            onClick={() => onExpandPackaging(packaging.id)}
            columns={getRowColumns(packaging)}
            borderColor={
              tabValue === 3 ? 'error.main' : 
              (packaging.product_type === 'marijuana' ? 'success.main' : 'warning.main')
            }
            expandIconPosition="end"
          >
            {renderPackagingDetails(packaging)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine Verpackungen vorhanden' : 
           tabValue === 1 ? 'Kein Marihuana vorhanden' : 
           tabValue === 2 ? 'Kein Haschisch vorhanden' : 
           'Keine vernichteten Verpackungen vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage={
          tabValue === 0 ? 'Keine Verpackungen vorhanden' : 
          tabValue === 1 ? 'Kein Marihuana vorhanden' : 
          tabValue === 2 ? 'Kein Haschisch vorhanden' : 
          'Keine vernichteten Verpackungen vorhanden'
        }
        color={tableColor}
      />
    </Box>
  )
}

export default PackagingTable