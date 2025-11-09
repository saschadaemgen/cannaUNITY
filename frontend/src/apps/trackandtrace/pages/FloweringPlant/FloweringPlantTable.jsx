// frontend/src/apps/trackandtrace/pages/FloweringPlant/components/FloweringPlantTable.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, Typography, Button, IconButton, Tooltip, Checkbox, Badge,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, FormControlLabel, Pagination, FormControl, Select, MenuItem,
  useTheme, alpha
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import api from '@/utils/api'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import FilterSection from '@/components/common/FilterSection'
import ConvertToHarvestDialog from '@/components/dialogs/ConvertToHarvestDialog'

const FloweringPlantTable = ({
  tabValue,
  data,
  expandedBatchId,
  onExpandBatch,
  onOpenDestroyDialog,
  onOpenImageModal,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount,
  batchPlants,
  destroyedBatchPlants,
  harvestedBatchPlants,
  plantsCurrentPage,
  plantsTotalPages,
  destroyedPlantsCurrentPage,
  destroyedPlantsTotalPages,
  harvestedPlantsCurrentPage,
  harvestedPlantsTotalPages,
  onPlantsPageChange,
  onDestroyedPlantsPageChange,
  onHarvestedPlantsPageChange,
  selectedPlants,
  togglePlantSelection,
  selectAllPlantsInBatch,
  yearFilter,
  setYearFilter,
  monthFilter,
  setMonthFilter,
  dayFilter,
  setDayFilter,
  showFilters,
  setShowFilters,
  onFilterApply,
  onFilterReset
}) => {
  const theme = useTheme();
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
      const roomsResponse = await api.get('rooms/');
      setRooms(roomsResponse.data.results || []);
      
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

  const handleOpenHarvestDialog = (batch) => {
    setBatchForHarvest(batch);
    setOpenHarvestDialog(true);
    
    if (rooms.length === 0 || members.length === 0) {
      loadRoomsAndMembers();
    }
  };

  const handleConvertToHarvest = async (formData, rfidMemberId = null) => {
    try {
      const apiData = {
        ...formData,
        member_id: rfidMemberId || formData.member_id || null,
        weight: parseFloat(formData.weight),
        plant_ids: selectedPlants[batchForHarvest.id] || []
      };
      
      console.log("Sende Daten an API:", apiData);
  
      const apiEndpoint = `/trackandtrace/floweringbatches/${batchForHarvest.id}/convert_to_harvest/`;
      const response = await api.post(apiEndpoint, apiData);
      
      console.log("API-Antwort:", response.data);
      
      setOpenHarvestDialog(false);
      setBatchForHarvest(null);
      
      localStorage.setItem('showHarvestSuccess', 'true');
      navigate('/trace/ernte');
      
    } catch (error) {
      console.error('Fehler bei der Konvertierung zu Ernte:', error);
      console.error('Fehlerdetails:', error.response?.data);
      alert(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    }
  };

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer', width: '20%', align: 'left' },
      { label: 'Aktiv/Gesamt', width: '8%', align: 'center' },
      { label: 'Vernichtet', width: '10%', align: 'left' },
      { label: 'Kultiviert von', width: '15%', align: 'left' },
      { label: 'Raum', width: '12%', align: 'left' },
      { label: 'Erstellt am', width: '13%', align: 'left' },
      { label: 'Aktionen', width: '5%', align: 'center' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (batch) => {
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandBatch(batch.id);
            }}
            size="small"
            sx={{ 
              color: 'primary.main',
              width: '28px',
              height: '28px',
              transform: expandedBatchId === batch.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: batch.seed_strain,
        width: '12%',
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
        width: '8%',
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
        width: '12%'
      },
      {
        content: new Date(batch.created_at).toLocaleDateString('de-DE'),
        width: '13%'
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
              <Tooltip title={`Bilder verwalten (${batch.image_count || 0})`}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenImageModal(batch, e)
                  }}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <Badge badgeContent={batch.image_count || 0} color="primary">
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {batch.batch_number}
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
            {batch.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Erstellt am:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {new Date(batch.created_at).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Ursprungssamen:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {batch.seed_batch_number || "Unbekannt"}
          </Typography>
        </Box>
      </Box>
    )

    const plantIdsContent = (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          Aktive Pflanzen:
        </Typography>
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            p: 1.5,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            mb: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
          }}
        >
          {batch.active_plants_count > 0 
            ? (() => {
                if (!batchPlants[batch.id] || batchPlants[batch.id].length === 0) {
                  return "Pflanzen-IDs werden geladen...";
                }
    
                const firstLoadedPlant = batchPlants[batch.id][0];
                const firstPlantNumber = firstLoadedPlant.batch_number;
                
                const match = firstPlantNumber.match(/(\d+)$/);
                if (!match) return firstPlantNumber;
                
                const firstVisibleNumber = parseInt(match[1], 10);
                const prefix = firstPlantNumber.substring(0, firstPlantNumber.length - match[1].length);
                
                const pageSize = 5;
                const currentPage = plantsCurrentPage[batch.id] || 1;
                const positionOfFirstVisible = (currentPage - 1) * pageSize;
                
                const firstBatchNumber = firstVisibleNumber - positionOfFirstVisible;
                const lastBatchNumber = firstBatchNumber + batch.active_plants_count - 1;
                
                const formatNumber = (num) => String(num).padStart(4, '0');
                
                return `${prefix}${formatNumber(firstBatchNumber)} bis ${prefix}${formatNumber(lastBatchNumber)}`;
              })()
            : "Keine aktiven Pflanzen"}
        </Box>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          Vernichtete Pflanzen:
        </Typography>
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            p: 1.5,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            color: batch.destroyed_plants_count > 0 ? 'error.main' : 'text.secondary'
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
          backgroundColor: theme.palette.background.paper,
          p: 2,
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
            color: batch.notes ? 'text.primary' : 'text.secondary',
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

    // Activity Stream Message und Detailkarten immer anzeigen
    const commonDetails = (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(batch)}
          </Typography>
        </Box>
        
        <DetailCards cards={cards} color="primary.main" />
      </>
    );

    // Je nach Tab unterschiedliche Inhalte anzeigen
    if (tabValue === 0) {
      // Tab 0: Aktive Pflanzen
      return (
        <>
          {commonDetails}
          
          {batchPlants[batch.id] ? (
            <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" color="primary">
                  Aktive Pflanzen
                </Typography>
                
                {batchPlants[batch.id]?.length > 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
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
                      sx={{ ml: 0 }}
                    />
                    
                    {/* Aktionsbuttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedPlants[batch.id]?.length > 0 && (
                        <>
                          {/* Vernichten */}
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
                              onClick={() => onOpenDestroyDialog(batch)}
                              startIcon={<LocalFireDepartmentIcon />}
                              sx={{ textTransform: 'none' }}
                            >
                              {selectedPlants[batch.id].length} Pflanzen vernichten
                            </Button>
                          </Box>
                          
                          {/* Zu Ernte konvertieren */}
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
                              onClick={() => handleOpenHarvestDialog(batch)}
                              startIcon={<ScienceIcon />}
                              sx={{ textTransform: 'none' }}
                            >
                              Zu Ernte konvertieren
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
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
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
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
                              {/* Vernichten-Button */}
                              <Box
                                sx={{
                                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                  borderRadius: '4px',
                                  p: 0.5,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: theme.palette.background.paper,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                                    borderColor: alpha(theme.palette.error.main, 0.5)
                                  }
                                }}
                              >
                                <Tooltip title="Pflanze vernichten">
                                  <IconButton 
                                    size="small" 
                                    sx={{ 
                                      p: 0.5,
                                      color: theme.palette.text.secondary,
                                      '&:hover': {
                                        color: 'error.main'
                                      }
                                    }}
                                    onClick={() => {
                                      togglePlantSelection(batch.id, plant.id);
                                      onOpenDestroyDialog(batch);
                                    }}
                                  >
                                    <LocalFireDepartmentIcon sx={{ fontSize: '1rem' }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
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
      );
    } else if (tabValue === 1) {
      // Tab 1: Zu Ernte überführte Pflanzen
      return (
        <>
          {commonDetails}
          
          {harvestedBatchPlants[batch.id] ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Zu Ernte überführte Pflanzen
              </Typography>
              
              {harvestedBatchPlants[batch.id]?.length > 0 ? (
                <>
                  <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'success.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge-Nummer</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Überführt am</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Überführt durch</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ernte-Charge</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {harvestedBatchPlants[batch.id]?.map((plant, i) => (
                          <TableRow 
                            key={plant.id}
                            sx={{ 
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
                            }}
                          >
                            <TableCell>
                              {plant.batch_number || `Pflanze ${i+1} (Nummer nicht verfügbar)`}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {plant.id}
                            </TableCell>
                            <TableCell>
                              {plant.converted_at ? new Date(plant.converted_at).toLocaleString('de-DE') : '-'}
                            </TableCell>
                            <TableCell>
                              {plant.converted_by ? 
                                (plant.converted_by.display_name || `${plant.converted_by.first_name || ''} ${plant.converted_by.last_name || ''}`.trim()) 
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {plant.harvest_batch || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination für die geernteten Pflanzen */}
                  {harvestedPlantsTotalPages[batch.id] > 1 && (
                    <Box display="flex" justifyContent="center" mt={2} width="100%">
                      <Pagination 
                        count={harvestedPlantsTotalPages[batch.id]} 
                        page={harvestedPlantsCurrentPage[batch.id] || 1} 
                        onChange={(e, page) => onHarvestedPlantsPageChange(batch.id, e, page)}
                        color="success"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Keine zu Ernte überführten Pflanzen in dieser Charge.
                </Typography>
              )}
            </Box>
          ) : (
            <LoadingIndicator size={24} />
          )}
        </>
      );
    } else if (tabValue === 2) {
      // Tab 2: Vernichtete Pflanzen
      return (
        <>
          {commonDetails}
          
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
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
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
      );
    }
  }

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
            data.map((batch) => (
              <AccordionRow
                key={batch.id}
                isExpanded={expandedBatchId === batch.id}
                onClick={() => onExpandBatch(batch.id)}
                columns={getRowColumns(batch)}
                borderColor="primary.main"
                expandIconPosition="none"
                borderless={true}
              >
                {renderBatchDetails(batch)}
              </AccordionRow>
            ))
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              Keine Blühpflanzen vorhanden
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
              color="primary"
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