// frontend/src/apps/trackandtrace/pages/MotherPlant/components/MotherPlantTable.jsx
import { useState, useEffect } from 'react'
import { 
  Box, Typography, Button, IconButton, Tooltip, Badge, 
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, Pagination, FormControl, Select, MenuItem, useTheme, alpha
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import StarIcon from '@mui/icons-material/Star'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// API-Client importieren
import api from '@/utils/api'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import FilterSection from '@/components/common/FilterSection'

const MotherPlantTable = ({
  tabValue,
  data,
  expandedBatchId,
  onExpandBatch,
  onOpenDestroyDialog,
  onOpenCreateCuttingDialog,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount,
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
  batchCuttings,
  loadingCuttings,
  cuttingsCurrentPage,
  cuttingsTotalPages,
  onCuttingsPageChange,
  loadCuttingsForBatch,
  onOpenImageModal,
  onOpenRatingDialog,
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
  
  const [destroyedPlantsDetails, setDestroyedPlantsDetails] = useState({});
  const [loadingDestroyedDetails, setLoadingDestroyedDetails] = useState({});
  
  const loadDestroyedPlantsDetails = async (batchId) => {
    if (destroyedPlantsDetails[batchId]) return;
    
    setLoadingDestroyedDetails(prev => ({ ...prev, [batchId]: true }));
    
    try {
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/`);
      const destroyedPlants = (res.data.results || []).filter(plant => plant.is_destroyed);
      
      setDestroyedPlantsDetails(prev => ({
        ...prev,
        [batchId]: destroyedPlants
      }));
    } catch (error) {
      console.error("Fehler beim Laden der vernichteten Pflanzen-Details:", error);
      setDestroyedPlantsDetails(prev => ({
        ...prev,
        [batchId]: []
      }));
    } finally {
      setLoadingDestroyedDetails(prev => ({ ...prev, [batchId]: false }));
    }
  };
  
  useEffect(() => {
    const currentBatch = data.find(batch => batch.id === expandedBatchId);
    
    if (!currentBatch) return;
    
    if (tabValue === 1 && expandedBatchId) {
      loadCuttingsForBatch && loadCuttingsForBatch(expandedBatchId, 1);
    }
    
    if (currentBatch.destroyed_plants_count > 0 && !destroyedPlantsDetails[expandedBatchId]) {
      loadDestroyedPlantsDetails(expandedBatchId);
    }
  }, [tabValue, expandedBatchId, data]);

  const getHeaderColumns = () => {
    const baseColumns = [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '15%', align: 'left' },
      { label: 'Pflanzen-Nummer', width: '20%', align: 'left' },
    ];

    if (tabValue === 0 || tabValue === 2) {
      return [
        ...baseColumns,
        { label: 'Status', width: '6%', align: 'center' },
        { label: 'Bewertung', width: '10%', align: 'center' },
        { label: 'Vernichtet', width: '8%', align: 'left' },
        { label: 'Kultiviert von', width: '13%', align: 'left' },
        { label: 'Raum', width: '13%', align: 'left' },
        { label: 'Erstellt am', width: '10%', align: 'left' },
        { label: 'Aktionen', width: '12%', align: 'center' }
      ];
    } else {
      return [
        ...baseColumns,
        { label: 'Stecklinge', width: '8%', align: 'center' },
        { label: 'Vernichtet', width: '10%', align: 'left' },
        { label: 'Erstellt von', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '10%', align: 'left' },
        { label: 'Aktionen', width: '9%', align: 'center' }
      ];
    }
  };

  const getFirstPlant = (batch) => {
    if (batchPlants && batchPlants[batch.id] && batchPlants[batch.id].length > 0) {
      return batchPlants[batch.id][0];
    }
    return null;
  };

  const getCombinedData = (batch) => {
    const plant = getFirstPlant(batch);
    
    const averageRating = batch.average_batch_rating || 
                         batch.mother_average_rating || 
                         batch.average_rating || 
                         batch.plant_average_rating ||
                         batch.avg_rating ||
                         batch.rating ||
                         plant?.average_rating || 
                         null;
    
    let ratingCount = batch.rating_count || 0;
    
    if (ratingCount === 0) {
      if (batch.average_batch_rating_count !== undefined) {
        ratingCount = batch.average_batch_rating_count;
      } else if (batch.ratings_count !== undefined) {
        ratingCount = batch.ratings_count;
      } else if (batch.total_ratings !== undefined) {
        ratingCount = batch.total_ratings;
      } else if (plant?.rating_count !== undefined) {
        ratingCount = plant.rating_count;
      }
    }
    
    const isPremium = batch.premium_plants_count > 0 || 
                     batch.is_premium_mother || 
                     batch.is_premium || 
                     batch.has_premium_mother ||
                     batch.premium_mother ||
                     plant?.is_premium_mother || 
                     false;
    
    const plantId = batch.plant_id || 
                   batch.mother_plant_id || 
                   batch.single_plant_id ||
                   batch.first_plant_id ||
                   batch.plants?.[0]?.id || 
                   plant?.id || 
                   null;
    
    return {
      ...batch,
      rating_count: ratingCount,
      average_rating: averageRating,
      is_premium: isPremium,
      image_count: batch.image_count || 0,
      plant_id: plantId
    };
  };

  const getRowColumns = (batch) => {
    const combinedData = getCombinedData(batch);
    const plant = getFirstPlant(batch);
    
    const baseColumns = [
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
        content: batch.seed_strain || batch.mother_strain,
        width: '15%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'primary.main'
      },
      {
        content: batch.batch_number || '',
        width: '20%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      }
    ];

    if (tabValue === 0 || tabValue === 2) {
      return [
        ...baseColumns,
        {
          content: batch.active_plants_count > 0 
            ? <CheckCircleIcon sx={{ color: 'success.main' }} />
            : <CancelIcon sx={{ color: 'error.main' }} />,
          width: '6%',
          align: 'center'
        },
        {
          content: (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              {combinedData.average_rating ? (
                <>
                  <Typography variant="body2" sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                    ⭐ {Number(combinedData.average_rating).toFixed(1)}
                  </Typography>
                  
                  {combinedData.rating_count > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ({combinedData.rating_count})
                    </Typography>
                  )}
                </>
              ) : null}
              
              {combinedData.is_premium && (
                <Tooltip title="Premium Mutterpflanze">
                  <Typography variant="caption" sx={{ 
                    backgroundColor: 'warning.light',
                    color: 'warning.dark',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 'bold',
                    fontSize: '0.65rem',
                    ml: combinedData.average_rating ? 0.5 : 0
                  }}>
                    PREMIUM
                  </Typography>
                </Tooltip>
              )}
              
              {!combinedData.average_rating && !combinedData.is_premium && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
              )}
            </Box>
          ),
          width: '10%',
          align: 'center'
        },
        {
          content: `${batch.destroyed_plants_count}`,
          width: '8%',
          color: batch.destroyed_plants_count > 0 ? 'error.main' : 'text.primary'
        },
        {
          content: batch.member ? 
            (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
            : "Nicht zugewiesen",
          width: '13%'
        },
        {
          content: batch.room ? batch.room.name : "Nicht zugewiesen",
          width: '13%'
        },
        {
          content: new Date(batch.created_at).toLocaleDateString('de-DE'),
          width: '10%'
        },
        {
          content: renderActions(batch, combinedData, plant),
          width: '12%',
          align: 'center',
          stopPropagation: true
        }
      ];
    } else {
      return [
        ...baseColumns,
        {
          content: `${batch.active_cuttings_count}/${batch.quantity}`,
          width: '8%',
          align: 'center'
        },
        {
          content: `${batch.destroyed_cuttings_count}`,
          width: '10%',
          color: batch.destroyed_cuttings_count > 0 ? 'error.main' : 'text.primary'
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
          content: renderActions(batch, combinedData, plant),
          width: '9%',
          align: 'center',
          stopPropagation: true
        }
      ];
    }
  };

  const renderActions = (batch, combinedData, plant) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
        {tabValue === 0 && (
          <>
            {/* Bewertungs-Button */}
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
              <Tooltip title={`Pflanze bewerten ${combinedData.rating_count > 0 ? `(${combinedData.rating_count} Bewertungen)` : ''}`}>
                <IconButton 
                  size="small" 
                  sx={{ 
                    p: 0.5,
                    color: combinedData.is_premium ? 'warning.main' : theme.palette.text.secondary
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    const plantId = combinedData.plant_id || `${batch.id}_plant`;
                    
                    const plantData = plant || {
                      id: plantId,
                      batch_id: batch.id,
                      batch_number: batch.batch_number,
                      rating_count: combinedData.rating_count,
                      average_rating: combinedData.average_rating,
                      is_premium_mother: combinedData.is_premium,
                      is_destroyed: false,
                      created_at: batch.created_at,
                      notes: batch.notes
                    };
                    
                    onOpenRatingDialog(batch, plantData);
                  }}
                >
                  <StarIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Stecklinge erstellen Button */}
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
              <Tooltip title="Stecklinge erstellen">
                <IconButton 
                  size="small" 
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    const plantData = plant || {
                      id: batch.id + '_plant',
                      batch_id: batch.id,
                      batch_number: batch.batch_number,
                      is_destroyed: false
                    };
                    
                    onOpenCreateCuttingDialog(batch, plantData);
                  }}
                >
                  <ContentCutIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Vernichten Button */}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    if (plant) {
                      togglePlantSelection(batch.id, plant.id);
                    }
                    
                    onOpenDestroyDialog(batch);
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
        
        {/* Bilder verwalten */}
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
    );
  };

  const getActivityMessage = (batch) => {
    const cultivator = batch.member 
      ? (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
      : "Unbekannt";
    const roomName = batch.room ? batch.room.name : "unbekanntem Raum";
    const date = new Date(batch.created_at).toLocaleDateString('de-DE');
    
    if (tabValue === 0 || tabValue === 2) {
      return `Mutterpflanze ${batch.batch_number} mit Genetik ${batch.seed_strain} wurde von ${cultivator} am ${date} im Raum ${roomName} angelegt.`;
    } else {
      return `${batch.quantity} Stecklinge wurden von ${cultivator} am ${date} im Raum ${roomName} von Mutterpflanze ${batch.mother_batch_number || "Unbekannt"} erstellt.`;
    }
  };

  const renderBatchDetails = (batch) => {
    const plant = getFirstPlant(batch);
    
    return (
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

        {/* Details mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: tabValue === 1 ? 'Stecklinge-Details' : 'Pflanzen-Details',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Pflanzen-Nummer:
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
                  {plant && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Pflanzen-UUID:
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
                        {plant.id}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Erstellt am:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {new Date(batch.created_at).toLocaleDateString('de-DE')}
                    </Typography>
                  </Box>
                  {tabValue === 0 || tabValue === 2 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Ursprungssamen:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {batch.seed_batch_number || "Unbekannt"}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Ursprungs-Mutterpflanzen-Charge:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {batch.mother_batch_number || "Unbekannt"}
                        </Typography>
                      </Box>
                      {batch.mother_plant_number && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                            Spezifische Mutterpflanze:
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {batch.mother_plant_number}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )
            },
            {
              title: tabValue === 1 ? 'Stecklinge-Info' : 'Status',
              content: tabValue === 0 || tabValue === 2 ? (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Pflanzenstatus
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      p: 1.5,
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      mb: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
                    }}
                  >
                    {batch.active_plants_count > 0 ? (
                      <Typography variant="body2" sx={{ color: 'primary.main' }}>
                        ✓ Aktive Mutterpflanze
                      </Typography>
                    ) : batch.destroyed_plants_count > 0 ? (
                      <Typography variant="body2" sx={{ color: 'error.main' }}>
                        ✗ Mutterpflanze wurde vernichtet
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        Status unbekannt
                      </Typography>
                    )}
                  </Box>
                  
                  {batch.converted_to_cuttings_count > 0 && (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                        Stecklinge
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          p: 1.5,
                          borderRadius: '4px',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem',
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>
                          {batch.converted_to_cuttings_count} Stecklinge wurden von dieser Mutterpflanze erstellt
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Aktive Stecklinge:
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
                    {batch.active_cuttings_count > 0 
                      ? `${batch.active_cuttings_count} aktive Stecklinge` 
                      : "Keine aktiven Stecklinge"}
                  </Box>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Vernichtete Stecklinge:
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
                      color: batch.destroyed_cuttings_count > 0 ? 'error.main' : 'text.secondary'
                    }}
                  >
                    {batch.destroyed_cuttings_count > 0 
                      ? `${batch.destroyed_cuttings_count} Stecklinge vernichtet` 
                      : "Keine vernichteten Stecklinge"}
                  </Box>
                </Box>
              )
            },
            {
              title: 'Notizen',
              content: (
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
            }
          ]}
          color="primary.main"
        />

        {/* Aktionsbereich für aktive Pflanzen */}
        {tabValue === 0 && batch.active_plants_count > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 4, mb: 1, flexWrap: 'wrap' }}>
            {/* Bewerten */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => {
                  const combinedData = getCombinedData(batch);
                  const plantData = plant || {
                    id: combinedData.plant_id || `${batch.id}_plant`,
                    batch_id: batch.id,
                    batch_number: batch.batch_number,
                    rating_count: combinedData.rating_count,
                    average_rating: combinedData.average_rating,
                    is_premium_mother: combinedData.is_premium,
                    is_destroyed: false,
                    created_at: batch.created_at,
                    notes: batch.notes
                  };
                  
                  onOpenRatingDialog(batch, plantData);
                }}
                startIcon={<StarIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Pflanze bewerten
              </Button>
            </Box>
            
            {/* Stecklinge erstellen */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => {
                  const plantData = plant || {
                    id: batch.id + '_plant',
                    batch_id: batch.id,
                    batch_number: batch.batch_number,
                    is_destroyed: false
                  };
                  
                  onOpenCreateCuttingDialog(batch, plantData);
                }}
                startIcon={<ContentCutIcon />}
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Stecklinge erstellen
              </Button>
            </Box>
            
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
                onClick={() => {
                  if (plant) {
                    togglePlantSelection(batch.id, plant.id);
                  }
                  onOpenDestroyDialog(batch);
                }}
                startIcon={<LocalFireDepartmentIcon />}
                sx={{ textTransform: 'none' }}
              >
                Vernichten
              </Button>
            </Box>
            
            {/* Bilder verwalten */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.75,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.08),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => onOpenImageModal(batch)}
                startIcon={
                  <Badge badgeContent={batch.image_count || 0} color="primary">
                    <PhotoCameraIcon />
                  </Badge>
                }
                sx={{ textTransform: 'none', color: 'text.primary' }}
              >
                Bilder verwalten
              </Button>
            </Box>
          </Box>
        )}

        {/* Stecklinge-Details für Tab 1 */}
        {tabValue === 1 && batchCuttings && batchCuttings[batch.id] && (
          <Box sx={{ width: '100%', mt: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Stecklinge in dieser Charge
            </Typography>
            
            {loadingCuttings?.[batch.id] ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <LoadingIndicator size={24} />
              </Box>
            ) : (
              <>
                {batchCuttings[batch.id].length > 0 ? (
                  <>
                    <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Steckling-ID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Erstellt am</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Notizen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchCuttings[batch.id].map((cutting, i) => (
                            <TableRow 
                              key={cutting.id || i}
                              sx={{ 
                                backgroundColor: theme.palette.background.paper,
                                '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
                              }}
                            >
                              <TableCell>{cutting.batch_number}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {cutting.id || '-'}
                              </TableCell>
                              <TableCell>
                                {cutting.is_destroyed 
                                  ? <Typography color="error">Vernichtet</Typography> 
                                  : <Typography color="success.main">Aktiv</Typography>}
                              </TableCell>
                              <TableCell>
                                {cutting.created_at ? new Date(cutting.created_at).toLocaleString('de-DE') : '-'}
                              </TableCell>
                              <TableCell>{cutting.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {cuttingsTotalPages?.[batch.id] > 1 && (
                      <Box display="flex" justifyContent="center" mt={2} width="100%">
                        <Pagination 
                          count={cuttingsTotalPages[batch.id]}
                          page={cuttingsCurrentPage?.[batch.id] || 1}
                          onChange={(e, page) => onCuttingsPageChange(batch.id, e, page)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Keine Stecklinge in dieser Charge vorhanden.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}

        {/* Vernichtete Pflanzen für Tab 2 */}
        {tabValue === 2 && destroyedBatchPlants[batch.id] && (
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
        )}
      </>
    );
  };

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
              {tabValue === 1 ? 'Keine Stecklinge vorhanden' : 'Keine Mutterpflanzen vorhanden'}
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
    </Box>
  );
};

export default MotherPlantTable;