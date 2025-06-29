// frontend/src/apps/trackandtrace/pages/FloweringPlant/components/FloweringPlantTable.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, Typography, Button, IconButton, Tooltip, Checkbox, 
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, FormControlLabel, Pagination, Badge
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import api from '@/utils/api'

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import ConvertToHarvestDialog from '@/components/dialogs/ConvertToHarvestDialog'

/**
 * FloweringPlantTable Komponente für die Darstellung der Blühpflanzen-Tabelle
 */
const FloweringPlantTable = ({
  tabValue,
  data,
  expandedBatchId,
  onExpandBatch,
  onOpenDestroyDialog,
  currentPage,
  totalPages,
  onPageChange,
  batchPlants,
  destroyedBatchPlants,
  plantsCurrentPage,
  plantsTotalPages,
  destroyedPlantsCurrentPage,
  destroyedPlantsTotalPages,
  onPlantsPageChange,
  onDestroyedPlantsPageChange,
  selectedPlants,
  togglePlantSelection,
  selectAllPlantsInBatch,
  onOpenImageModal
}) => {
  const navigate = useNavigate();
  const [openHarvestDialog, setOpenHarvestDialog] = useState(false);
  const [batchForHarvest, setBatchForHarvest] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Laden von Räumen und Mitgliedern für den Harvest-Dialog
  useEffect(() => {
    if (openHarvestDialog && (rooms.length === 0 || members.length === 0)) {
      loadRoomsAndMembers();
    }
  }, [openHarvestDialog]);

  const loadRoomsAndMembers = async () => {
    setLoadingOptions(true);
    try {
      // Räume laden
      const roomsResponse = await api.get('rooms/');
      setRooms(roomsResponse.data.results || []);
      
      // Mitglieder laden
      const membersResponse = await api.get('members/');
      const formattedMembers = (membersResponse.data.results || []).map(member => ({
        ...member,
        display_name: member.display_name || `${member.first_name} ${member.last_name}`
      }));
      setMembers(formattedMembers);
    } catch (error) {
      console.error('Fehler beim Laden der Optionen:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Funktion zum Öffnen des Ernte-Dialogs
  const handleOpenHarvestDialog = (batch) => {
    setBatchForHarvest(batch);
    setOpenHarvestDialog(true);
    
    // Räume und Mitglieder laden, falls noch nicht geschehen
    if (rooms.length === 0 || members.length === 0) {
      loadRoomsAndMembers();
    }
  };

  // Funktion zum Konvertieren zu Ernte
  const handleConvertToHarvest = async (formData, rfidMemberId = null) => {
    try {
      // Stelle sicher, dass das Gewicht als Zahl übergeben wird
      const apiData = {
        ...formData,
        member_id: rfidMemberId || formData.member_id || null,
        weight: parseFloat(formData.weight),
        plant_ids: selectedPlants[batchForHarvest.id] || []
      };
      
      console.log("Sende Daten an API:", apiData); // Zur Fehlerbehebung
  
      const apiEndpoint = `/trackandtrace/floweringbatches/${batchForHarvest.id}/convert_to_harvest/`;
      const response = await api.post(apiEndpoint, apiData);
      
      console.log("API-Antwort:", response.data); // Zur Fehlerbehebung
      
      // Dialog schließen
      setOpenHarvestDialog(false);
      setBatchForHarvest(null);
      
      // Erfolgsmeldung setzen für Weiterleitung zur Ernte-Seite
      localStorage.setItem('showHarvestSuccess', 'true');
      
      // Zur Ernte-Seite navigieren
      navigate('/trace/ernte');
      
    } catch (error) {
      console.error('Fehler bei der Konvertierung zu Ernte:', error);
      console.error('Fehlerdetails:', error.response?.data); // Detaillierte Fehlerausgabe
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: 'Genetik', width: '15%', align: 'left' },
      { label: 'Charge-Nummer', width: '20%', align: 'left' },
      { label: 'Aktiv/Gesamt', width: '10%', align: 'center' },
      { label: 'Vernichtet', width: '10%', align: 'left' },
      { label: 'Kultiviert von', width: '15%', align: 'left' },
      { label: 'Raum', width: '15%', align: 'left' },
      { label: 'Erstellt am', width: '10%', align: 'left' },
      { label: 'Bilder', width: '8%', align: 'center' },
      { label: '', width: '3%', align: 'center' }  // Platz für das Aufklapp-Symbol am Ende
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (batch) => {
    return [
      {
        content: batch.seed_strain,
        width: '15%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'primary.main'
      },
      {
        content: batch.batch_number ? `${batch.batch_number}` : '',
        width: '20%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${batch.active_plants_count}/${batch.quantity}`,
        width: '10%',
        align: 'center'
      },
      {
        content: `${batch.destroyed_plants_count} Pflanzen`,
        width: '10%',
        color: batch.destroyed_plants_count > 0 ? 'error.main' : 'text.primary'
      },
      {
        content: batch.member ? 
          (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
          : "Nicht zugewiesen",
        width: '15%'
      },
      {
        content: batch.room ? batch.room.name : "Nicht zugewiesen",
        width: '15%'
      },
      {
        content: new Date(batch.created_at).toLocaleDateString('de-DE'),
        width: '10%'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Tooltip title={`Bilder verwalten (${batch.image_count || 0})`}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenImageModal(batch, e)
                }}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Badge badgeContent={batch.image_count || 0} color="primary">
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
        content: '',  // Leere Zelle für das Aufklapp-Symbol, das von AccordionRow hinzugefügt wird
        width: '3%'
      }
    ]
  }

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (batch) => {
    const cultivator = batch.member 
      ? (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
      : "Unbekannt";
    const roomName = batch.room ? batch.room.name : "unbekanntem Raum";
    const date = new Date(batch.created_at).toLocaleDateString('de-DE');
    
    return `Charge ${batch.batch_number} mit Genetik ${batch.seed_strain} wurde von ${cultivator} am ${date} im Raum ${roomName} angelegt.`;
  };

  // Detailansicht für einen Batch rendern
  const renderBatchDetails = (batch) => {
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {batch.batch_number}
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
            {batch.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {new Date(batch.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Ursprungssamen:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {batch.seed_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const plantIdsContent = (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
          Aktive Pflanzen:
        </Typography>
        <Box
          sx={{
            backgroundColor: 'white',
            p: 1.5,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            mb: 2,
            border: '1px solid rgba(0, 0, 0, 0.12)'
          }}
        >
          {batch.active_plants_count > 0 
            ? (() => {
                // Wenn keine Pflanzen geladen sind, zeige einen Ladetext an
                if (!batchPlants[batch.id] || batchPlants[batch.id].length === 0) {
                  return "Pflanzen-IDs werden geladen...";
                }
    
                // Nehme die erste verfügbare Pflanze im Batch als Referenz
                const firstLoadedPlant = batchPlants[batch.id][0];
                const firstPlantNumber = firstLoadedPlant.batch_number;
                
                // Extrahiere die Nummer vom Ende des Batch-Numbers (z.B. "0061" aus "blooming-plant:25:04:2025:0061")
                const match = firstPlantNumber.match(/(\d+)$/);
                if (!match) return firstPlantNumber;
                
                const firstVisibleNumber = parseInt(match[1], 10);
                const prefix = firstPlantNumber.substring(0, firstPlantNumber.length - match[1].length);
                
                // Berechne die niedrigste und höchste ID im Batch basierend auf der Gesamtzahl der Pflanzen
                // Zuerst berechnen wir, an welcher Position im Batch die erste sichtbare Pflanze ist
                const pageSize = 5; // Wie im Backend definiert
                const currentPage = plantsCurrentPage[batch.id] || 1;
                const positionOfFirstVisible = (currentPage - 1) * pageSize; // 0-basierter Index
                
                // Berechne die niedrigste Nummer (wenn die erste Pflanze auf der ersten Seite ist, wäre das firstVisibleNumber)
                const firstBatchNumber = firstVisibleNumber - positionOfFirstVisible;
                
                // Die höchste Nummer ist: erste Nummer + Gesamtzahl - 1
                const lastBatchNumber = firstBatchNumber + batch.active_plants_count - 1;
                
                // Formatiere beide Nummern mit führenden Nullen (4-stellig)
                const formatNumber = (num) => String(num).padStart(4, '0');
                
                return `${prefix}${formatNumber(firstBatchNumber)} bis ${prefix}${formatNumber(lastBatchNumber)}`;
              })()
            : "Keine aktiven Pflanzen"}
        </Box>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
          Vernichtete Pflanzen:
        </Typography>
        <Box
          sx={{
            backgroundColor: 'white',
            p: 1.5,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            color: batch.destroyed_plants_count > 0 ? 'error.main' : 'rgba(0, 0, 0, 0.38)'
          }}
        >
          {batch.destroyed_plants_count > 0 
            ? `${batch.destroyed_plants_count} Pflanzen vernichtet` 
            : "Keine vernichteten Pflanzen"}
        </Box>
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
          alignItems: batch.notes ? 'flex-start' : 'center',
          justifyContent: batch.notes ? 'flex-start' : 'center',
          width: '100%'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: batch.notes ? 'normal' : 'italic',
            color: batch.notes ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
            width: '100%'
          }}
        >
          {batch.notes || 'Keine Notizen für diese Charge vorhanden'}
        </Typography>
      </Box>
    )

    const cards = [
      {
        title: 'Charge-Details',
        content: chargeDetails
      },
      {
        title: 'Pflanzen-IDs',
        content: plantIdsContent
      },
      {
        title: 'Notizen',
        content: notesContent
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
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(batch)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color="primary.main" />

        {/* Je nach Tab die entsprechende Pflanzen-Tabelle anzeigen */}
        {tabValue === 0 ? (
          // Tab 0: Aktive Pflanzen
          <>
            {batchPlants[batch.id] ? (
              <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="primary">
                    Aktive Pflanzen
                  </Typography>
                  
                  {batchPlants[batch.id]?.length > 0 && (
                    <Box display="flex" alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={(selectedPlants[batch.id]?.length || 0) === (batchPlants[batch.id]?.length || 0)}
                            indeterminate={(selectedPlants[batch.id]?.length || 0) > 0 && 
                                          (selectedPlants[batch.id]?.length || 0) < (batchPlants[batch.id]?.length || 0)}
                            onChange={(e) => selectAllPlantsInBatch(batch.id, e.target.checked)}
                          />
                        }
                        label="Alle auswählen"
                      />
                      
                      {selectedPlants[batch.id]?.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button 
                            variant="outlined" 
                            color="error"
                            onClick={() => onOpenDestroyDialog(batch)}
                            startIcon={<LocalFireDepartmentIcon />}
                          >
                            {selectedPlants[batch.id].length} Pflanzen vernichten
                          </Button>
                          
                          <Button 
                            variant="contained" 
                            color="success"
                            onClick={() => handleOpenHarvestDialog(batch)}
                            startIcon={<ScienceIcon />}
                          >
                            Zu Ernte konvertieren
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                
                {batchPlants[batch.id]?.length > 0 ? (
                  <>
                    <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell padding="checkbox" sx={{ color: 'white' }}>
                              <Checkbox
                                checked={(selectedPlants[batch.id]?.length || 0) === (batchPlants[batch.id]?.length || 0)}
                                indeterminate={(selectedPlants[batch.id]?.length || 0) > 0 && 
                                            (selectedPlants[batch.id]?.length || 0) < (batchPlants[batch.id]?.length || 0)}
                                onChange={(e) => selectAllPlantsInBatch(batch.id, e.target.checked)}
                                sx={{
                                  color: 'white',
                                  '&.Mui-checked': {
                                    color: 'white',
                                  },
                                  '&.MuiCheckbox-indeterminate': {
                                    color: 'white',
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Batch-Nummer</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Erstellt am</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Kultiviert von</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Aktionen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchPlants[batch.id]?.map((plant, i) => (
                            <TableRow 
                              key={plant.id}
                              sx={{ 
                                backgroundColor: 'white',
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedPlants[batch.id]?.includes(plant.id) || false}
                                  onChange={() => togglePlantSelection(batch.id, plant.id)}
                                />
                              </TableCell>
                              <TableCell>
                                {plant.batch_number || `Pflanze ${i+1} (Nummer nicht verfügbar)`}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {plant.id}
                              </TableCell>
                              <TableCell>
                                {new Date(plant.created_at).toLocaleString('de-DE')}
                              </TableCell>
                              <TableCell>
                                {batch.member ? 
                                  (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
                                  : "-"}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    color: 'white',
                                    backgroundColor: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'error.dark'
                                    },
                                    width: '28px',
                                    height: '28px'
                                  }}
                                  onClick={() => {
                                    togglePlantSelection(batch.id, plant.id);
                                    onOpenDestroyDialog(batch);
                                  }}
                                >
                                  <LocalFireDepartmentIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Pagination für die Pflanzen innerhalb eines Batches */}
                    {plantsTotalPages[batch.id] > 1 && (
                      <Box display="flex" justifyContent="center" mt={2} width="100%">
                        <Pagination 
                          count={plantsTotalPages[batch.id]} 
                          page={plantsCurrentPage[batch.id] || 1} 
                          onChange={(e, page) => onPlantsPageChange(batch.id, e, page)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Keine aktiven Pflanzen in dieser Charge.
                  </Typography>
                )}
              </Box>
            ) : (
              <LoadingIndicator size={24} />
            )}
          </>
        ) : (
          // Tab 1: Vernichtete Pflanzen
          <>
            {destroyedBatchPlants[batch.id] ? (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Vernichtete Pflanzen
                </Typography>
                
                {destroyedBatchPlants[batch.id]?.length > 0 ? (
                  <>
                    <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'error.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge-Nummer</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vernichtet am</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vernichtet durch</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grund</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {destroyedBatchPlants[batch.id]?.map((plant, i) => (
                            <TableRow 
                              key={plant.id}
                              sx={{ 
                                backgroundColor: 'white',
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                              }}
                            >
                              <TableCell>
                                {plant.batch_number || `Pflanze ${i+1} (Nummer nicht verfügbar)`}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {plant.id}
                              </TableCell>
                              <TableCell>
                                {plant.destroyed_at ? new Date(plant.destroyed_at).toLocaleString('de-DE') : '-'}
                              </TableCell>
                              <TableCell>
                                {plant.destroyed_by ? 
                                  (plant.destroyed_by.display_name || `${plant.destroyed_by.first_name || ''} ${plant.destroyed_by.last_name || ''}`.trim()) 
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {plant.destroy_reason || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Pagination für die vernichteten Pflanzen */}
                    {destroyedPlantsTotalPages[batch.id] > 1 && (
                      <Box display="flex" justifyContent="center" mt={2} width="100%">
                        <Pagination 
                          count={destroyedPlantsTotalPages[batch.id]} 
                          page={destroyedPlantsCurrentPage[batch.id] || 1} 
                          onChange={(e, page) => onDestroyedPlantsPageChange(batch.id, e, page)}
                          color="error"
                          size="small"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Keine vernichteten Pflanzen in dieser Charge.
                  </Typography>
                )}
              </Box>
            ) : (
              <LoadingIndicator size={24} />
            )}
          </>
        )}

        {/* Aktionsbuttons für den Batch (außerhalb der Tabellen) */}
        {tabValue === 0 && batchPlants[batch.id]?.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {selectedPlants[batch.id]?.length === 0 && (
              <>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => selectAllPlantsInBatch(batch.id, true)}
                  startIcon={<LocalFireDepartmentIcon />}
                >
                  Pflanzen zur Vernichtung auswählen
                </Button>
                
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => {
                    selectAllPlantsInBatch(batch.id, true);
                    handleOpenHarvestDialog(batch);
                  }}
                  startIcon={<ScienceIcon />}
                >
                  Alle zu Ernte konvertieren
                </Button>
              </>
            )}
          </Box>
        )}
      </>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableHeader columns={getHeaderColumns()} />

      {data && data.length > 0 ? (
        data.map((batch) => (
          <AccordionRow
            key={batch.id}
            isExpanded={expandedBatchId === batch.id}
            onClick={() => onExpandBatch(batch.id)}
            columns={getRowColumns(batch)}
            borderColor="primary.main"
            expandIconPosition="end"  // Diese Eigenschaft ist entscheidend, um das Icon am Ende zu platzieren
          >
            {renderBatchDetails(batch)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Blühpflanzen vorhanden
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage=""
        color="primary"
      />

      {/* Dialog für die Ernte-Konvertierung */}
      <ConvertToHarvestDialog
        open={openHarvestDialog}
        onClose={() => setOpenHarvestDialog(false)}
        onConvert={handleConvertToHarvest}
        title="Blühpflanzen zu Ernte konvertieren"
        sourceBatch={batchForHarvest}
        sourceType="flowering"
        members={members}
        rooms={rooms}
        selectedPlants={batchForHarvest ? (selectedPlants[batchForHarvest.id] || []) : []}
        loadingOptions={loadingOptions}
      />
    </Box>
  )
}

export default FloweringPlantTable