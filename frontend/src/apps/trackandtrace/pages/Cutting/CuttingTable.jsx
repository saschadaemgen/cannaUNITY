// frontend/src/apps/trackandtrace/pages/Cutting/components/CuttingTable.jsx
import { useState } from 'react'
import { 
  Box, Typography, Button, IconButton, Tooltip, Checkbox, Badge,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, FormControlLabel, Pagination, FormControl, Select, MenuItem,
  useTheme, alpha
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Link } from 'react-router-dom'

import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'
import FilterSection from '@/components/common/FilterSection'

const CuttingTable = ({
  tabValue,
  data,
  expandedBatchId,
  onExpandBatch,
  onOpenDestroyDialog,
  onOpenConvertDialog,
  onOpenImageModal,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 25, 50],
  totalCount,
  batchCuttings,
  destroyedBatchCuttings,
  cuttingsCurrentPage,
  cuttingsTotalPages,
  destroyedCuttingsCurrentPage,
  destroyedCuttingsTotalPages,
  onCuttingsPageChange,
  onDestroyedCuttingsPageChange,
  selectedCuttings,
  toggleCuttingSelection,
  selectAllCuttingsInBatch,
  convertedBatchCuttings,
  convertedCuttingsCurrentPage,
  convertedCuttingsTotalPages,
  onConvertedCuttingsPageChange,
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
  
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer(n)', width: '22%', align: 'left' },
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
        content: batch.mother_strain || batch.seed_strain || "Unbekannt",
        width: '12%',
        bold: true,
        icon: ScienceIcon,
        iconColor: 'primary.main'
      },
      {
        content: batch.batch_number || '',
        width: '22%',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      },
      {
        content: `${batch.active_cuttings_count}/${batch.quantity}`,
        width: '8%',
        align: 'center'
      },
      {
        content: `${batch.destroyed_cuttings_count} Stecklinge`,
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
    const motherBatch = batch.mother_batch_number || "Unbekannt";
    
    return `Charge ${batch.batch_number} mit ${batch.quantity} Stecklingen wurde von ${cultivator} am ${date} im Raum ${roomName} von Mutterpflanzen-Charge ${motherBatch} erstellt.`;
  };

  // Detailansicht für einen Batch rendern
  const renderBatchDetails = (batch) => {
    const chargeDetails = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Chargen-ID:
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Mutterpflanzen-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {batch.mother_batch_number || "Unbekannt"}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Spezifische Mutterpflanze:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {batch.mother_plant_number || "Ganze Charge"}
          </Typography>
        </Box>
      </Box>
    )

    const cuttingsIdsContent = (
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
        title: 'Stecklinge-Info',
        content: cuttingsIdsContent
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
      // Tab 0: Aktive Stecklinge
      return (
        <>
          {commonDetails}
          
          {batchCuttings[batch.id] ? (
            <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
              {/* Button zum Konvertieren aller Stecklinge */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" color="primary">
                  Aktive Stecklinge
                </Typography>
                
                {batchCuttings[batch.id]?.length > 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(selectedCuttings[batch.id]?.length || 0) === (batchCuttings[batch.id]?.length || 0)}
                          indeterminate={(selectedCuttings[batch.id]?.length || 0) > 0 && 
                                        (selectedCuttings[batch.id]?.length || 0) < (batchCuttings[batch.id]?.length || 0)}
                          onChange={(e) => selectAllCuttingsInBatch(batch.id, e.target.checked)}
                        />
                      }
                      label="Alle auswählen"
                      sx={{ ml: 0 }}
                    />
                    
                    {/* Aktionsbuttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {/* Alle zu Blühpflanzen */}
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
                          onClick={() => onOpenConvertDialog(batch, [], true)}
                          startIcon={<LocalFloristIcon />}
                          sx={{ textTransform: 'none', color: 'text.primary' }}
                        >
                          Alle zu Blühpflanzen
                        </Button>
                      </Box>
                      
                      {selectedCuttings[batch.id]?.length > 0 && (
                        <>
                          {/* Ausgewählte zu Blühpflanzen */}
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
                              onClick={() => onOpenConvertDialog(batch, selectedCuttings[batch.id], false)}
                              startIcon={<LocalFloristIcon />}
                              sx={{ textTransform: 'none' }}
                            >
                              {selectedCuttings[batch.id].length} zu Blühpflanzen
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
                              onClick={() => onOpenDestroyDialog(batch)}
                              startIcon={<LocalFireDepartmentIcon />}
                              sx={{ textTransform: 'none' }}
                            >
                              {selectedCuttings[batch.id].length} vernichten
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
              
              {batchCuttings[batch.id]?.length > 0 ? (
                <>
                  <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                          <TableCell padding="checkbox" sx={{ color: 'white' }}>
                            <Checkbox
                              checked={(selectedCuttings[batch.id]?.length || 0) === (batchCuttings[batch.id]?.length || 0)}
                              indeterminate={(selectedCuttings[batch.id]?.length || 0) > 0 && 
                                          (selectedCuttings[batch.id]?.length || 0) < (batchCuttings[batch.id]?.length || 0)}
                              onChange={(e) => selectAllCuttingsInBatch(batch.id, e.target.checked)}
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
                        {batchCuttings[batch.id]?.map((cutting, i) => (
                          <TableRow 
                            key={cutting.id}
                            sx={{ 
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedCuttings[batch.id]?.includes(cutting.id) || false}
                                onChange={() => toggleCuttingSelection(batch.id, cutting.id)}
                              />
                            </TableCell>
                            <TableCell>
                              {cutting.batch_number || `Steckling ${i+1} (Nummer nicht verfügbar)`}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {cutting.id}
                            </TableCell>
                            <TableCell>
                              {new Date(cutting.created_at).toLocaleString('de-DE')}
                            </TableCell>
                            <TableCell>
                              {batch.member ? 
                                (batch.member.display_name || `${batch.member.first_name} ${batch.member.last_name}`) 
                                : "-"}
                            </TableCell>
                            <TableCell align="right">
                              {/* Action Buttons in der Zeile */}
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {/* Konvertieren-Button */}
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
                                      backgroundColor: alpha(theme.palette.success.main, 0.08),
                                      borderColor: alpha(theme.palette.success.main, 0.5)
                                    }
                                  }}
                                >
                                  <Tooltip title="Zu Blühpflanze umwandeln">
                                    <IconButton 
                                      size="small" 
                                      sx={{ 
                                        p: 0.5,
                                        color: theme.palette.text.secondary,
                                        '&:hover': {
                                          color: 'success.main'
                                        }
                                      }}
                                      onClick={() => {
                                        toggleCuttingSelection(batch.id, cutting.id, true);
                                        onOpenConvertDialog(batch, [cutting.id], false);
                                      }}
                                    >
                                      <LocalFloristIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                
                                {/* Vernichten-Button */}
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
                                  <Tooltip title="Steckling vernichten">
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
                                        toggleCuttingSelection(batch.id, cutting.id);
                                        onOpenDestroyDialog(batch);
                                      }}
                                    >
                                      <LocalFireDepartmentIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination für die Stecklinge innerhalb eines Batches */}
                  {cuttingsTotalPages[batch.id] > 1 && (
                    <Box display="flex" justifyContent="center" mt={2} width="100%">
                      <Pagination 
                        count={cuttingsTotalPages[batch.id]} 
                        page={cuttingsCurrentPage[batch.id] || 1} 
                        onChange={(e, page) => onCuttingsPageChange(batch.id, e, page)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Keine aktiven Stecklinge in dieser Charge.
                </Typography>
              )}
            </Box>
          ) : (
            <LoadingIndicator size={24} />
          )}
        </>
      );
    } else if (tabValue === 1) {
      // Tab 1: Zu Blühpflanzen überführte Stecklinge
      return (
        <>
          {commonDetails}
          
          {/* Tabelle für überführte Stecklinge */}
          {convertedBatchCuttings && convertedBatchCuttings[batch.id] ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Zu Blühpflanzen überführte Stecklinge
              </Typography>
              
              {convertedBatchCuttings[batch.id]?.length > 0 ? (
                <>
                  <TableContainer component={Paper} elevation={1} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'success.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Steckling-Nummer</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>UUID</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Überführt am</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Überführt durch</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Blühpflanzen-Charge</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {convertedBatchCuttings[batch.id]?.map((cutting, i) => (
                          <TableRow 
                            key={cutting.id}
                            sx={{ 
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
                            }}
                          >
                            <TableCell>
                              {cutting.batch_number || `Steckling ${i+1} (Nummer nicht verfügbar)`}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {cutting.id}
                            </TableCell>
                            <TableCell>
                              {cutting.converted_at ? new Date(cutting.converted_at).toLocaleString('de-DE') : '-'}
                            </TableCell>
                            <TableCell>
                              {cutting.converted_by ? 
                                (cutting.converted_by.display_name || `${cutting.converted_by.first_name || ''} ${cutting.converted_by.last_name || ''}`.trim()) 
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {cutting.converted_to ? 
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  color="success"
                                  component={Link}
                                  to={`/trace/bluehpflanzen-aus-stecklingen`}
                                  onClick={() => {
                                    localStorage.setItem('highlightBatchId', cutting.converted_to);
                                  }}
                                >
                                  Zur Blühpflanze
                                </Button>
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination für die überführten Stecklinge */}
                  {convertedCuttingsTotalPages[batch.id] > 1 && (
                    <Box display="flex" justifyContent="center" mt={2} width="100%">
                      <Pagination 
                        count={convertedCuttingsTotalPages[batch.id]} 
                        page={convertedCuttingsCurrentPage[batch.id] || 1} 
                        onChange={(e, page) => onConvertedCuttingsPageChange(batch.id, e, page)}
                        color="success"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Keine zu Blühpflanzen überführten Stecklinge in dieser Charge.
                </Typography>
              )}
            </Box>
          ) : (
            <LoadingIndicator size={24} />
          )}
        </>
      );
    } else if (tabValue === 2) {
      // Tab 2: Vernichtete Stecklinge
      return (
        <>
          {commonDetails}
          
          {destroyedBatchCuttings[batch.id] ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Vernichtete Stecklinge
              </Typography>
              
              {destroyedBatchCuttings[batch.id]?.length > 0 ? (
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
                        {destroyedBatchCuttings[batch.id]?.map((cutting, i) => (
                          <TableRow 
                            key={cutting.id}
                            sx={{ 
                              backgroundColor: theme.palette.background.paper,
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.02) }
                            }}
                          >
                            <TableCell>
                              {cutting.batch_number || `Steckling ${i+1} (Nummer nicht verfügbar)`}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {cutting.id}
                            </TableCell>
                            <TableCell>
                              {cutting.destroyed_at ? new Date(cutting.destroyed_at).toLocaleString('de-DE') : '-'}
                            </TableCell>
                            <TableCell>
                              {cutting.destroyed_by ? 
                                (cutting.destroyed_by.display_name || `${cutting.destroyed_by.first_name || ''} ${cutting.destroyed_by.last_name || ''}`.trim()) 
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {cutting.destroy_reason || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination für die vernichteten Stecklinge */}
                  {destroyedCuttingsTotalPages[batch.id] > 1 && (
                    <Box display="flex" justifyContent="center" mt={2} width="100%">
                      <Pagination 
                        count={destroyedCuttingsTotalPages[batch.id]} 
                        page={destroyedCuttingsCurrentPage[batch.id] || 1} 
                        onChange={(e, page) => onDestroyedCuttingsPageChange(batch.id, e, page)}
                        color="error"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  Keine vernichteten Stecklinge in dieser Charge.
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
              Keine Stecklinge vorhanden
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
  )
}

export default CuttingTable