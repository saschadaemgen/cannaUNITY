// frontend/src/apps/trackandtrace/pages/MotherPlant/components/MotherPlantTable.jsx
import { useState, useEffect } from 'react'
import { 
  Box, Typography, Button, IconButton, Tooltip, Checkbox, 
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, FormControlLabel, Pagination, CircularProgress
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ContentCutIcon from '@mui/icons-material/ContentCut'

// API-Client importieren
import api from '../../../../../utils/api'

import TableHeader from '../../../components/common/TableHeader'
import AccordionRow from '../../../components/common/AccordionRow'
import DetailCards from '../../../components/common/DetailCards'
import PaginationFooter from '../../../components/common/PaginationFooter'
import LoadingIndicator from '../../../components/common/LoadingIndicator'

/**
 * MotherPlantTable Komponente für die Darstellung der Mutterpflanzen-Tabelle
 */
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
  // Neue Props für Stecklinge-Paginierung und -Daten
  batchCuttings,
  loadingCuttings,
  cuttingsCurrentPage,
  cuttingsTotalPages,
  onCuttingsPageChange,
  loadCuttingsForBatch
}) => {
  // Zustände für die vernichteten Pflanzen-Details
  const [destroyedPlantsDetails, setDestroyedPlantsDetails] = useState({});
  const [loadingDestroyedDetails, setLoadingDestroyedDetails] = useState({});
  
  // Funktion zum Laden der vernichteten Pflanzen-Details
  const loadDestroyedPlantsDetails = async (batchId) => {
    // Nur laden, wenn noch nicht vorhanden
    if (destroyedPlantsDetails[batchId]) return;
    
    setLoadingDestroyedDetails(prev => ({ ...prev, [batchId]: true }));
    
    try {
      // API-Aufruf für alle Pflanzen (auch vernichtete)
      const res = await api.get(`/trackandtrace/motherbatches/${batchId}/plants/`);
      
      // Vernichtete Pflanzen filtern
      const destroyedPlants = (res.data.results || []).filter(plant => plant.is_destroyed);
      
      // Speichern der vernichteten Pflanzen-Details
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
  
  // Kombinierter useEffect für Stecklinge und vernichtete Pflanzen - außerhalb von renderBatchDetails!
  useEffect(() => {
    // Batch-ID aus dem expandierten Batch ermitteln
    const currentBatch = data.find(batch => batch.id === expandedBatchId);
    
    if (!currentBatch) return;
    
    // Wenn wir im Stecklinge-Tab sind und ein Batch expandiert ist
    if (tabValue === 1 && expandedBatchId) {
      loadCuttingsForBatch && loadCuttingsForBatch(expandedBatchId, 1);
    }
    
    // Vernichtete Pflanzen-Details laden, wenn vorhanden
    if (currentBatch.destroyed_plants_count > 0 && !destroyedPlantsDetails[expandedBatchId]) {
      loadDestroyedPlantsDetails(expandedBatchId);
    }
  }, [tabValue, expandedBatchId, data]);

  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    const baseColumns = [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer', width: '22%', align: 'left' },
    ];

    // Tab-spezifische Spalten je nach aktivem Tab
    if (tabValue === 0 || tabValue === 2) {
      // Tab 0: Aktive Pflanzen oder Tab 2: Vernichtete Pflanzen
      return [
        ...baseColumns,
        { label: 'Aktiv/Gesamt', width: '8%', align: 'center' },
        { label: 'Vernichtet', width: '10%', align: 'left' },
        { label: 'Kultiviert von', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '15%', align: 'left' }
      ];
    } else {
      // Tab 1: Stecklinge-Tab
      return [
        ...baseColumns,
        { label: 'Aktiv/Gesamt', width: '8%', align: 'center' },
        { label: 'Vernichtet', width: '10%', align: 'left' },
        { label: 'Erstellt von', width: '15%', align: 'left' },
        { label: 'Raum', width: '15%', align: 'left' },
        { label: 'Erstellt am', width: '15%', align: 'left' }
      ];
    }
  };

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (batch) => {
    // Basis-Spalten für alle Tabs
    const baseColumns = [
      {
        content: '',
        width: '3%'
      },
      {
        content: batch.seed_strain || batch.mother_strain,
        width: '12%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'primary.main'
      },
      {
        content: batch.batch_number ? 
          // Hier die Änderung: füge "charge:" hinzu, falls nicht vorhanden
          `${batch.batch_number.startsWith('charge:') ? '' : 'charge:'}${batch.batch_number}`
          : '',
        width: '22%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      }
    ];

    if (tabValue === 0 || tabValue === 2) {
      // Für Tabs 0: Aktive und 2: Vernichtete Pflanzen
      return [
        ...baseColumns,
        {
          content: `${batch.active_plants_count}/${batch.quantity}`,
          width: '8%',
          align: 'center'
        },
        {
          // Nur die Zahl anzeigen, ohne "Pflanzen"
          content: `${batch.destroyed_plants_count}`,
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
          width: '15%'
        }
      ];
    } else {
      // Für Tab 1: Stecklinge
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
          width: '15%'
        }
      ];
    }
  };

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (batch) => {
    const cultivator = batch.member 
      ? (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
      : "Unbekannt";
    const roomName = batch.room ? batch.room.name : "unbekanntem Raum";
    const date = new Date(batch.created_at).toLocaleDateString('de-DE');
    
    if (tabValue === 0 || tabValue === 2) {
      // Mutterpflanzen Nachricht (Tab 0 und 2)
      return `Charge ${batch.batch_number} mit Genetik ${batch.seed_strain} wurde von ${cultivator} am ${date} im Raum ${roomName} angelegt.`;
    } else {
      // Stecklinge Nachricht (Tab 1)
      return `Charge ${batch.batch_number} mit ${batch.quantity} Stecklingen wurde von ${cultivator} am ${date} im Raum ${roomName} von Mutterpflanzen-Charge ${batch.mother_batch_number || "Unbekannt"} erstellt.`;
    }
  };

  // Detailansicht für einen Batch rendern
  const renderBatchDetails = (batch) => {
    // Details-Card-Inhalte anpassen
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Charge-Nummer:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {batch.batch_number?.startsWith('charge:') 
              ? batch.batch_number 
              : `charge:${batch.batch_number}`}
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
        {tabValue === 0 || tabValue === 2 ? (
          // Für Mutterpflanzen-Tab (0 und 2)
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
              Ursprungssamen:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
              {batch.seed_batch_number || "Unbekannt"}
            </Typography>
          </Box>
        ) : (
          // Für Stecklinge-Tab (1)
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                Ursprungs-Mutterpflanzen-Charge:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                {batch.mother_batch_number || "Unbekannt"}
              </Typography>
            </Box>
            {batch.mother_plant_number && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                  Spezifische Mutterpflanze:
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                  {batch.mother_plant_number}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    );

    // Infos für Pflanzen-IDs oder Stecklinge-Infos
    const idsContent = tabValue === 0 || tabValue === 2
      ? (
        // Stark vereinfachte plantIdsContent für Mutterpflanzen-Tabs (0 und 2)
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
            Aktive Pflanzen
          </Typography>
          <Box
            sx={{
              backgroundColor: 'white',
              p: 1.5,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              mb: 2,
              border: '1px solid rgba(0, 0, 0, 0.12)'
            }}
          >
            {batch.active_plants_count > 0 ? (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                {batch.active_plants_count} aktive Mutterpflanzen vorhanden
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Keine aktiven Pflanzen in dieser Charge vorhanden.
              </Typography>
            )}
          </Box>
          
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
            Vernichtete Pflanzen
          </Typography>
          <Box
            sx={{
              backgroundColor: 'white',
              p: 1.5,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              mb: 2,
              border: '1px solid rgba(0, 0, 0, 0.12)'
            }}
          >
            {batch.destroyed_plants_count > 0 ? (
              loadingDestroyedDetails[batch.id] ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={20} color="error" />
                </Box>
              ) : (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'error.main' }}>
                  {batch.destroyed_plants_count} Mutterpflanzen wurden vernichtet.
                </Typography>
              )
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Keine vernichteten Pflanzen in dieser Charge.
              </Typography>
            )}
          </Box>
          
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
            Konvertiert zu Stecklingen
          </Typography>
          <Box
            sx={{
              backgroundColor: 'white',
              p: 1.5,
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              border: '1px solid rgba(0, 0, 0, 0.12)'
            }}
          >
            {batch.converted_to_cuttings_count > 0 || (tabValue === 1 && batch.quantity > 0) ? (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                {tabValue === 1 ? batch.quantity : (batch.converted_to_cuttings_count || 0)} Stecklinge wurden aus Pflanzen dieser Charge erstellt.
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Aus dieser Charge wurden noch keine Stecklinge erstellt.
              </Typography>
            )}
          </Box>
        </Box>
      )
      : (
        // Stecklinge-Info für Stecklinge-Tab (1)
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
            Aktive Stecklinge:
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
            {batch.active_cuttings_count > 0 
              ? `${batch.active_cuttings_count} aktive Stecklinge` 
              : "Keine aktiven Stecklinge"}
          </Box>
          
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
            Vernichtete Stecklinge:
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
              color: batch.destroyed_cuttings_count > 0 ? 'error.main' : 'rgba(0, 0, 0, 0.38)'
            }}
          >
            {batch.destroyed_cuttings_count > 0 
              ? `${batch.destroyed_cuttings_count} Stecklinge vernichtet` 
              : "Keine vernichteten Stecklinge"}
          </Box>
        </Box>
      );

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
    );

    const cards = [
      {
        title: tabValue === 1 ? 'Stecklinge-Details' : 'Charge-Details',
        content: chargeDetails
      },
      {
        title: tabValue === 1 ? 'Stecklinge-Info' : 'Pflanzen-IDs',
        content: idsContent
      },
      {
        title: 'Notizen',
        content: notesContent
      }
    ];
    
    // Funktion zum Rendern der Stecklinge-Liste
    const renderCuttingsDetails = () => {
      // Nur für Tab 1 (Konvertiert zu Stecklingen)
      if (tabValue !== 1) return null;

      // Entferne den useEffect von hier und verwende stattdessen den useEffect auf Hauptkomponentenebene
      const isLoading = loadingCuttings?.[batch.id] || false;
      const cuttings = batchCuttings?.[batch.id] || [];
      const currentPage = cuttingsCurrentPage?.[batch.id] || 1;
      const totalPages = cuttingsTotalPages?.[batch.id] || 1;

      return (
        <Box sx={{ width: '100%', mt: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Stecklinge in dieser Charge
          </Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <LoadingIndicator size={24} />
            </Box>
          ) : (
            <>
              {cuttings.length > 0 ? (
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
                        {cuttings.map((cutting, i) => (
                          <TableRow 
                            key={cutting.id || i}
                            sx={{ 
                              backgroundColor: 'white',
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
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
                  
                  {/* Paginierung für Stecklinge innerhalb eines Batches */}
                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={2} width="100%">
                      <Pagination 
                        count={totalPages}
                        page={currentPage}
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
      );
    };

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
        
        {/* Stecklinge-Details nur im Stecklinge-Tab anzeigen */}
        {tabValue === 1 && renderCuttingsDetails()}

        {/* PROBLEM-BEREICH: Je nach Tab die entsprechende Pflanzen-Tabelle anzeigen */}
        {/* Tab 0: Aktive Pflanzen */}
        {tabValue === 0 && (
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
                      
                      {/* Stecklinge erstellen Button für die ganze Charge */}
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => onOpenCreateCuttingDialog(batch, null)}
                        startIcon={<ContentCutIcon />}
                        sx={{ ml: 2 }}
                      >
                        Stecklinge erstellen
                      </Button>
                      
                      {selectedPlants[batch.id]?.length > 0 && (
                        <Button 
                          variant="contained" 
                          color="error"
                          onClick={() => onOpenDestroyDialog(batch)}
                          startIcon={<LocalFireDepartmentIcon />}
                          sx={{ ml: 2 }}
                        >
                          {selectedPlants[batch.id].length} Pflanzen vernichten
                        </Button>
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
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge-Nummer</TableCell>
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
                              {/* Button zum Erstellen von Stecklingen für eine spezifische Mutterpflanze */}
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: 'white',
                                  backgroundColor: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'primary.dark'
                                  },
                                  width: '28px',
                                  height: '28px',
                                  mr: 1
                                }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Verhindert Akkordeon-Öffnen
                                  onOpenCreateCuttingDialog(batch, plant); // Übergebe die spezifische Pflanze
                                }}
                              >
                                <ContentCutIcon fontSize="small" />
                              </IconButton>
                              
                              {/* Button zum Vernichten */}
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
                                onClick={(e) => {
                                  e.stopPropagation(); // Verhindert Akkordeon-Öffnen
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
        )}

        {/* Tab 2: Vernichtete Pflanzen */}
        {tabValue === 2 && (
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
      </>
    );
  };

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
          >
            {renderBatchDetails(batch)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          {tabValue === 1 ? 'Keine Stecklinge vorhanden' : 'Keine Mutterpflanzen vorhanden'}
        </Typography>
      )}

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage={tabValue === 1 ? 'Keine Stecklinge vorhanden' : 'Keine Mutterpflanzen vorhanden'}
        color="primary"
      />
    </Box>
  );
};

export default MotherPlantTable;