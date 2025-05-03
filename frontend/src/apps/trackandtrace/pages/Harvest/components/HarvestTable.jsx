// frontend/src/apps/trackandtrace/pages/Harvest/components/HarvestTable.jsx
import { Box, Typography, Button, IconButton } from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SeedIcon from '@mui/icons-material/Spa'
import AcUnitIcon from '@mui/icons-material/AcUnit'

import TableHeader from '../../../components/common/TableHeader'
import AccordionRow from '../../../components/common/AccordionRow'
import DetailCards from '../../../components/common/DetailCards'
import PaginationFooter from '../../../components/common/PaginationFooter'

/**
 * HarvestTable Komponente für die Darstellung der Ernte-Tabelle
 */
const HarvestTable = ({
  tabValue,
  data,
  expandedHarvestId,
  onExpandHarvest,
  onOpenDestroyDialog,
  onOpenDryingDialog,
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '15%', align: 'left' },
      { label: 'Charge-Nummer', width: '20%', align: 'left' },
      { label: 'Gewicht', width: '10%', align: 'center' },
      { label: 'Quelle', width: '20%', align: 'left' },
      { label: 'Verarbeitet von', width: '15%', align: 'left' },
      { label: 'Raum', width: '10%', align: 'left' },
      { label: 'Erstellt am', width: '10%', align: 'left' },
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (harvest) => {
    return [
      {
        content: harvest.source_strain || "Unbekannt",
        width: '15%',
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 0 ? 'success.main' : 'error.main'
      },
      {
        content: harvest.batch_number || '',
        width: '20%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(harvest.weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: ScaleIcon,
        iconColor: tabValue === 0 ? 'success.main' : 'error.main'
      },
      {
        content: harvest.source_type || "Unbekannt",
        width: '20%'
      },
      {
        content: harvest.member ? 
          (harvest.member.display_name || `${harvest.member.first_name} ${harvest.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '15%'
      },
      {
        content: harvest.room ? harvest.room.name : "Nicht zugewiesen",
        width: '10%'
      },
      {
        content: new Date(harvest.created_at).toLocaleDateString('de-DE'),
        width: '10%'
      },
      {
        content: '',  // Platz für das Aufklapp-Symbol
        width: '3%'
      }
    ]
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (harvest) => {
    const processor = harvest.member 
      ? (harvest.member.display_name || `${harvest.member.first_name} ${harvest.member.last_name}`) 
      : "Unbekannt";
    const roomName = harvest.room ? harvest.room.name : "unbekanntem Raum";
    const date = new Date(harvest.created_at).toLocaleDateString('de-DE');
    const weight = parseFloat(harvest.weight).toLocaleString('de-DE');
    const sourceInfo = `${harvest.source_type || "Unbekannte Quelle"} (${harvest.source_batch_number || "Unbekannte Charge"})`;
    
    if (tabValue === 0) {
      return `Ernte ${harvest.batch_number} mit Genetik ${harvest.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} mit ${weight}g aus ${sourceInfo} erstellt.`;
    } else {
      const destroyDate = harvest.destroyed_at ? new Date(harvest.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = harvest.destroyed_by ? 
        (harvest.destroyed_by.display_name || `${harvest.destroyed_by.first_name} ${harvest.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Ernte ${harvest.batch_number} mit Genetik ${harvest.source_strain} und Gewicht ${weight}g wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${harvest.destroy_reason || "Kein Grund angegeben"}.`;
    }
  };

  // Detailansicht für eine Ernte rendern
  const renderHarvestDetails = (harvest) => {
    const harvestDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {harvest.batch_number}
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
            {harvest.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(harvest.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 1 && harvest.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(harvest.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {harvest.source_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const sourceDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {harvest.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quelltyp:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {harvest.source_type || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(harvest.weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        {tabValue === 1 && harvest.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {harvest.destroyed_by.display_name || 
               `${harvest.destroyed_by.first_name || ''} ${harvest.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: harvest.notes ? 'flex-start' : 'center',
          justifyContent: harvest.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: harvest.notes ? 'normal' : 'italic',
            color: harvest.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {harvest.notes || 'Keine Notizen für diese Ernte vorhanden'}
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
            fontStyle: harvest.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {harvest.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: harvestDetails
      },
      {
        title: 'Ernte-Details',
        content: sourceDetails
      },
      {
        title: tabValue === 0 ? 'Notizen' : 'Vernichtungsgrund',
        content: tabValue === 0 ? notesContent : destroyReasonContent
      }
    ]

    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'white', 
            borderLeft: '4px solid',
            borderColor: tabValue === 0 ? 'success.main' : 'error.main',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(harvest)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color={tabValue === 0 ? 'success.main' : 'error.main'} />

        {/* Aktionsbereich für aktive Ernten */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => onOpenDestroyDialog(harvest)}
              startIcon={<LocalFireDepartmentIcon />}
            >
              Ernte vernichten
            </Button>
            
            <Button 
              variant="contained" 
              color="info"
              onClick={() => onOpenDryingDialog(harvest)}
              startIcon={<AcUnitIcon />}
            >
              Zu Trocknung konvertieren
            </Button>
          </Box>
        )}
      </>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((harvest) => (
          <AccordionRow
            key={harvest.id}
            isExpanded={expandedHarvestId === harvest.id}
            onClick={() => onExpandHarvest(harvest.id)}
            columns={getRowColumns(harvest)}
            borderColor={tabValue === 0 ? 'success.main' : 'error.main'}
            expandIconPosition="end"
          >
            {renderHarvestDetails(harvest)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine aktiven Ernten vorhanden' : 'Keine vernichteten Ernten vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage={tabValue === 0 ? 'Keine aktiven Ernten vorhanden' : 'Keine vernichteten Ernten vorhanden'}
        color={tabValue === 0 ? 'success' : 'error'}
      />
    </Box>
  )
}

export default HarvestTable