// frontend/src/apps/trackandtrace/pages/Drying/components/DryingTable.jsx
import { Box, Typography, Button, IconButton, Badge, Tooltip } from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import SpeedIcon from '@mui/icons-material/Speed'
import SeedIcon from '@mui/icons-material/Spa'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import VideocamIcon from '@mui/icons-material/Videocam'

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'

/**
 * DryingTable Komponente für die Darstellung der Trocknungs-Tabelle
 */
const DryingTable = ({
  tabValue,
  data,
  expandedDryingId,
  onExpandDrying,
  onOpenDestroyDialog,
  onOpenProcessingDialog,
  currentPage,
  totalPages,
  onPageChange,
  onOpenImageModal // NEU
}) => {
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer', width: '14%', align: 'left' },
      { label: 'Frischgewicht', width: '10%', align: 'center' },
      { label: 'Trockengewicht', width: '10%', align: 'center' },
      { label: 'Gewichtsverlust', width: '10%', align: 'center' },
      { label: 'Verarbeitet von', width: '12%', align: 'left' },
      { label: 'Raum', width: '9%', align: 'left' },
      { label: 'Ernte-Charge', width: '11%', align: 'left' },
      { label: 'Erstellt am', width: '8%', align: 'left' },
      { label: 'Medien', width: '8%', align: 'center' },
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (drying) => {
    const weightLoss = parseFloat(drying.initial_weight) - parseFloat(drying.final_weight);
    const weightLossPercentage = (weightLoss / parseFloat(drying.initial_weight) * 100).toFixed(1);
    
    return [
      {
        content: drying.source_strain || "Unbekannt",
        width: '12%',
        bold: true,
        icon: SeedIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: drying.batch_number || '',
        width: '14%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${parseFloat(drying.initial_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: ScaleIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: `${parseFloat(drying.final_weight).toLocaleString('de-DE')}g`,
        width: '10%',
        align: 'center',
        bold: true,
        icon: AcUnitIcon,
        iconColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')
      },
      {
        content: `${weightLossPercentage}%`,
        width: '10%',
        align: 'center'
      },
      {
        content: drying.member ? 
          (drying.member.display_name || `${drying.member.first_name} ${drying.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '12%'
      },
      {
        content: drying.room ? drying.room.name : "Nicht zugewiesen",
        width: '9%'
      },
      {
        content: drying.harvest_batch_number || "Unbekannt",
        width: '11%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: new Date(drying.created_at).toLocaleDateString('de-DE'),
        width: '8%'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title={`Medien verwalten (${drying.image_count || 0})`}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenImageModal(drying, e)
                }}
                sx={{ 
                  color: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main'),
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Badge 
                  badgeContent={drying.image_count || 0} 
                  color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
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
  const getActivityMessage = (drying) => {
    const processor = drying.member 
      ? (drying.member.display_name || `${drying.member.first_name} ${drying.member.last_name}`) 
      : "Unbekannt";
    const roomName = drying.room ? drying.room.name : "unbekanntem Raum";
    const date = new Date(drying.created_at).toLocaleDateString('de-DE');
    const initialWeight = parseFloat(drying.initial_weight).toLocaleString('de-DE');
    const finalWeight = parseFloat(drying.final_weight).toLocaleString('de-DE');
    const harvestInfo = drying.harvest_batch_number || "Unbekannte Charge";
    const weightLoss = (parseFloat(drying.initial_weight) - parseFloat(drying.final_weight)).toLocaleString('de-DE');
    const weightLossPercentage = (((parseFloat(drying.initial_weight) - parseFloat(drying.final_weight)) / parseFloat(drying.initial_weight)) * 100).toFixed(1);
    
    if (tabValue === 0) {
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${date} von ${processor} im Raum ${roomName} erstellt. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%). Quelle: Ernte ${harvestInfo}.`;
    } else if (tabValue === 1) {
      const processedDate = drying.processed_at ? new Date(drying.processed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const processor = drying.processed_by ? 
        (drying.processed_by.display_name || `${drying.processed_by.first_name} ${drying.processed_by.last_name}`) 
        : "Unbekannt";
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${processedDate} von ${processor} zur Verarbeitung überführt. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%).`;
    } else {
      const destroyDate = drying.destroyed_at ? new Date(drying.destroyed_at).toLocaleDateString('de-DE') : "unbekanntem Datum";
      const destroyer = drying.destroyed_by ? 
        (drying.destroyed_by.display_name || `${drying.destroyed_by.first_name} ${drying.destroyed_by.last_name}`) 
        : "Unbekannt";
      return `Trocknung ${drying.batch_number} mit Genetik ${drying.source_strain} wurde am ${destroyDate} von ${destroyer} vernichtet. Grund: ${drying.destroy_reason || "Kein Grund angegeben"}. Frischgewicht: ${initialWeight}g, Trockengewicht: ${finalWeight}g, Gewichtsverlust: ${weightLoss}g (${weightLossPercentage}%).`;
    }
  };

  // Detailansicht für eine Trocknung rendern
  const renderDryingDetails = (drying) => {
    const weightLoss = parseFloat(drying.initial_weight) - parseFloat(drying.final_weight);
    const weightLossPercentage = (weightLoss / parseFloat(drying.initial_weight) * 100).toFixed(1);
    
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {drying.batch_number}
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
            {drying.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(drying.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        {tabValue === 2 && drying.destroyed_at && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet am:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {new Date(drying.destroyed_at).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Quell-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {drying.harvest_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const weightDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Genetik:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {drying.source_strain || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Frischgewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(drying.initial_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Trockengewicht:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {parseFloat(drying.final_weight).toLocaleString('de-DE')}g
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Gewichtsverlust:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 'bold' }}>
            {weightLoss.toLocaleString('de-DE')}g ({weightLossPercentage}%)
          </Typography>
        </Box>
        {tabValue === 2 && drying.destroyed_by && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Vernichtet durch:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {drying.destroyed_by.display_name || 
               `${drying.destroyed_by.first_name || ''} ${drying.destroyed_by.last_name || ''}`.trim() || 
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
          alignItems: drying.notes ? 'flex-start' : 'center',
          justifyContent: drying.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: drying.notes ? 'normal' : 'italic',
            color: drying.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {drying.notes || 'Keine Notizen für diese Trocknung vorhanden'}
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
            fontStyle: drying.destroy_reason ? 'normal' : 'italic',
            color: 'error.main',
            width: '100%'
          }}
        >
          {drying.destroy_reason || 'Kein Vernichtungsgrund angegeben'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Trocknungs-Details',
        content: weightDetails
      },
      {
        title: tabValue === 0 || tabValue === 1 ? 'Notizen' : 'Vernichtungsgrund',
        content: tabValue === 0 || tabValue === 1 ? notesContent : destroyReasonContent
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
            borderColor: tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main'),
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(drying)}
          </Typography>
        </Box>
        
        <DetailCards 
          cards={cards} 
          color={tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')} 
        />

        {/* Aktionsbereich für aktive Trocknungen */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => onOpenDestroyDialog(drying)}
              startIcon={<LocalFireDepartmentIcon />}
            >
              Trocknung vernichten
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => onOpenProcessingDialog(drying)}
              startIcon={<SpeedIcon />}
            >
              Zur Verarbeitung überführen
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
        data.map((drying) => (
          <AccordionRow
            key={drying.id}
            isExpanded={expandedDryingId === drying.id}
            onClick={() => onExpandDrying(drying.id)}
            columns={getRowColumns(drying)}
            borderColor={tabValue === 0 ? 'primary.main' : (tabValue === 1 ? 'success.main' : 'error.main')}
            expandIconPosition="end"
          >
            {renderDryingDetails(drying)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 0 ? 'Keine aktiven Trocknungen vorhanden' : 
           tabValue === 1 ? 'Keine zu Verarbeitung überführten Trocknungen vorhanden' : 
           'Keine vernichteten Trocknungen vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color={tabValue === 0 ? 'primary' : (tabValue === 1 ? 'success' : 'error')}
      />
    </Box>
  )
}

export default DryingTable