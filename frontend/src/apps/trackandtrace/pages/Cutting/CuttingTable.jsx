// frontend/src/apps/trackandtrace/pages/Cutting/components/CuttingTable.jsx
import { useState } from 'react'
import { 
  Box, Typography, Button, IconButton, Tooltip, Checkbox, 
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, FormControlLabel, Pagination
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist' // Neues Icon für Blühpflanzen
import { Link } from 'react-router-dom'

import TableHeader from '@/components/common/TableHeader'
import AccordionRow from '@/components/common/AccordionRow'
import DetailCards from '@/components/common/DetailCards'
import PaginationFooter from '@/components/common/PaginationFooter'
import LoadingIndicator from '@/components/common/LoadingIndicator'

/**
 * CuttingTable Komponente für die Darstellung der Stecklinge-Tabelle
 */
const CuttingTable = ({
  tabValue,
  data,
  expandedBatchId,
  onExpandBatch,
  onOpenDestroyDialog,
  onOpenConvertDialog, // Neue Prop für die Konvertierungsfunktion
  currentPage,
  totalPages,
  onPageChange,
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
  // Neue Props für überführte Stecklinge
  convertedBatchCuttings,
  convertedCuttingsCurrentPage,
  convertedCuttingsTotalPages,
  onConvertedCuttingsPageChange
}) => {
  // Spalten für den Tabellenkopf definieren
  const getHeaderColumns = () => {
    return [
      { label: '', width: '3%', align: 'center' },
      { label: 'Genetik', width: '12%', align: 'left' },
      { label: 'Charge-Nummer(n)', width: '22%', align: 'left' },
      { label: 'Aktiv/Gesamt', width: '8%', align: 'center' },
      { label: 'Vernichtet', width: '10%', align: 'left' },
      { label: 'Kultiviert von', width: '15%', align: 'left' },
      { label: 'Raum', width: '15%', align: 'left' },
      { label: 'Erstellt am', width: '15%', align: 'left' }
    ]
  }

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (batch) => {
    return [
      {
        content: '',
        width: '3%'
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
        width: '15%'
      },
      {
        content: new Date(batch.created_at).toLocaleDateString('de-DE'),
        width: '15%'
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
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Chargen-ID:
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Mutterpflanzen-Charge:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {batch.mother_batch_number || "Unbekannt"}
          </Typography>
        </Box>
        {/* Neue Zeile für spezifische Mutterpflanze */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
            Spezifische Mutterpflanze:
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            {batch.mother_plant_number || "Ganze Charge"}
          </Typography>
        </Box>
      </Box>
    )

    const cuttingsIdsContent = (
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
                  <Box display="flex" alignItems="center">
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => {
                        // Den dritten Parameter auf true setzen, um anzuzeigen, dass alle konvertiert werden sollen
                        onOpenConvertDialog(batch, [], true);
                      }}
                      startIcon={<LocalFloristIcon />}
                    >
                      Alle Stecklinge zu Blühpflanzen umwandeln
                    </Button>
                    
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
                      sx={{ ml: 2 }}
                    />
                    
                    {selectedCuttings[batch.id]?.length > 0 && (
                      <>
                        {/* Button für Konvertierung ausgewählter Stecklinge zu Blühpflanzen */}
                        <Button 
                          variant="contained" 
                          color="success"
                          onClick={() => onOpenConvertDialog(batch, selectedCuttings[batch.id], false)}
                          startIcon={<LocalFloristIcon />}
                          sx={{ ml: 2 }}
                        >
                          {selectedCuttings[batch.id].length} zu Blühpflanzen
                        </Button>
                        
                        {/* Bestehender Button für Vernichtung */}
                        <Button 
                          variant="contained" 
                          color="error"
                          onClick={() => onOpenDestroyDialog(batch)}
                          startIcon={<LocalFireDepartmentIcon />}
                          sx={{ ml: 2 }}
                        >
                          {selectedCuttings[batch.id].length} Stecklinge vernichten
                        </Button>
                      </>
                    )}
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
                              backgroundColor: 'white',
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
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
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                {/* Neuer Konvertieren-Button in der Zeile */}
                                <Tooltip title="Zu Blühpflanze umwandeln">
                                  <IconButton 
                                    size="small" 
                                    sx={{ 
                                      color: 'white',
                                      backgroundColor: 'success.main',
                                      '&:hover': {
                                        backgroundColor: 'success.dark'
                                      },
                                      width: '28px',
                                      height: '28px'
                                    }}
                                    onClick={() => {
                                      toggleCuttingSelection(batch.id, cutting.id, true);
                                      onOpenConvertDialog(batch, [cutting.id], false);
                                    }}
                                  >
                                    <LocalFloristIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                {/* Bestehender Vernichten-Button */}
                                <Tooltip title="Steckling vernichten">
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
                                      toggleCuttingSelection(batch.id, cutting.id);
                                      onOpenDestroyDialog(batch);
                                    }}
                                  >
                                    <LocalFireDepartmentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
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
      // Tab 1: Vernichtete Stecklinge
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
                              backgroundColor: 'white',
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
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
    } else if (tabValue === 2) {
      // Tab 2: Zu Blühpflanzen überführte Stecklinge
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
                              backgroundColor: 'white',
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
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
                                    // Optional: Speichern der Batch-ID, die in der Zielseite hervorgehoben werden soll
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
    }
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
          >
            {renderBatchDetails(batch)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Stecklinge vorhanden
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
    </Box>
  )
}

export default CuttingTable