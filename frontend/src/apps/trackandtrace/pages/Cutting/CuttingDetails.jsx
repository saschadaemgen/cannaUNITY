import React, { useState } from 'react';
import { 
  Grid, 
  Typography, 
  Divider, 
  Button, 
  Paper,
  Box,
  Chip,
  Link,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const CuttingDetails = ({ 
  data, 
  onMarkAsDestroyed, 
  onUpdatePhase, 
  onMarkAsPartiallyTransferred, 
  onMarkAsFullyTransferred, 
  onMarkIndividualAsDestroyed, 
  onDestroyIndividual, 
  onDestroyAllIndividuals, // <-- Neuer Prop hinzugefügt
  status 
}) => {
  // State für Paginierung
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Handlers für Paginierung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helfer-Funktion für Datumsformatierung
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht angegeben';
    
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;  // DD.MM.YYYY
      }
      return dateString;
    } catch (e) {
      console.error('Fehler bei der Datumsformatierung:', e);
      return dateString;
    }
  };

  // Helfer-Funktion für Wachstumsphasen-Farben
  const getGrowthPhaseColor = (phase) => {
    switch(phase) {
      case 'cutting': return 'info';
      case 'rooting': return 'warning';
      case 'vegetative': return 'success';
      default: return 'default';
    }
  };

  // Überführungsstatus als Chip anzeigen
  const getTransferStatusChip = () => {
    let color = 'default';
    let label = 'Unbekannt';
    let percentage = null;
    
    // Prozentberechnung basierend auf dem jeweiligen Typ
    if (data.cutting_count !== undefined && data.remaining_cuttings !== undefined) {
      // Stecklinge
      const used = data.cutting_count - data.remaining_cuttings;
      percentage = Math.round((used / data.cutting_count) * 100);
      label = `${used}/${data.cutting_count} (${percentage}%)`;
    }
    
    const status = data.transfer_status || 'not_transferred';
    
    if (percentage === 100 || status === 'fully_transferred') {
      color = 'success';
      if (!percentage) label = 'Vollständig übergeführt';
      else label = `Vollständig übergeführt: ${label}`;
    } else if (percentage > 0 || status === 'partially_transferred') {
      color = 'info';
      if (!percentage) label = 'Teilweise übergeführt';
      else label = `Teilweise übergeführt: ${label}`;
    } else {
      color = 'default';
      label = 'Nicht übergeführt';
    }
    
    return <Chip color={color} label={label} size="small" />;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Stammdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Genetik:</Typography>
              <Typography variant="body1">{data.genetic_name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Wachstumsphase:</Typography>
              <Box display="flex" alignItems="center">
                <Chip 
                  label={data.growth_phase_display || 'Unbekannt'} 
                  color={getGrowthPhaseColor(data.growth_phase)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {status === 'active' && (
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => onUpdatePhase(data)}
                  >
                    Ändern
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Überführungsstatus:</Typography>
              <Box display="flex" alignItems="center">
                {getTransferStatusChip()}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Herkunft aus Mutterpflanze:</Typography>
              <Typography variant="body1">
                {data.mother_plant_source_details ? (
                  <Link 
                    component={RouterLink} 
                    to={`/trace/mutterpflanzen`} 
                    state={{ highlightUuid: data.mother_plant_source }}
                  >
                    {data.mother_plant_source_details.genetic_name} ({data.mother_plant_source_details.batch_number})
                  </Link>
                ) : (
                  'Keine Daten verfügbar'
                )}
              </Typography>
            </Grid>
            
            {/* UUID anzeigen */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">UUID:</Typography>
              <Typography variant="body1" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {data.uuid}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Stecklings-Daten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Schneidedatum:</Typography>
              <Typography variant="body1">{formatDate(data.cutting_date)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Wachstumsmedium:</Typography>
              <Typography variant="body1">{data.growth_medium || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Bewurzelungsmittel:</Typography>
              <Typography variant="body1">{data.rooting_agent || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Lichtzyklus:</Typography>
              <Typography variant="body1">{data.light_cycle || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Stecklinge gesamt:</Typography>
              <Typography variant="body1">{data.cutting_count}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Stecklinge übrig:</Typography>
              <Typography variant="body1">{data.remaining_cuttings}</Typography>
              {status === 'active' && data.remaining_cuttings > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    size="small"
                    onClick={() => onMarkIndividualAsDestroyed && onMarkIndividualAsDestroyed(data)}
                  >
                    Einzelnen Steckling vernichten
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    size="small"
                    onClick={() => onDestroyAllIndividuals && onDestroyAllIndividuals(data)}
                  >
                    Alle Stecklinge vernichten
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Grid>
        
        {/* Individuelle Stecklinge anzeigen */}
        {data.individuals && data.individuals.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2">Individuelle Stecklinge</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Chargennummer</TableCell>
                    <TableCell>UUID</TableCell>
                    <TableCell>Verantwortlicher</TableCell>
                    <TableCell>Raum</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.individuals
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((individual) => (
                      <TableRow key={individual.uuid}>
                        <TableCell>{individual.batch_number}</TableCell>
                        <TableCell>{individual.uuid}</TableCell>
                        <TableCell>
                          {individual.responsible_member_details ? 
                            `${individual.responsible_member_details.first_name} ${individual.responsible_member_details.last_name}` : 
                            'Unbekannt'}
                        </TableCell>
                        <TableCell>
                          {individual.room_details ? individual.room_details.name : 'Kein Raum'}
                        </TableCell>
                        <TableCell>
                          {individual.is_destroyed ? (
                            <Chip label="Vernichtet" color="error" size="small" />
                          ) : (
                            <Chip label="Aktiv" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {!individual.is_destroyed && status === 'active' && (
                            <Button 
                              variant="outlined" 
                              color="error"
                              size="small"
                              onClick={() => onDestroyIndividual && onDestroyIndividual(individual)}
                            >
                              Vernichten
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.individuals.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Einträge pro Seite:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
              />
            </TableContainer>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Prozessdaten</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Verantwortlicher:</Typography>
              <Typography variant="body1">
                {data.responsible_member_details ? 
                  `${data.responsible_member_details.first_name} ${data.responsible_member_details.last_name}` : 
                  'Unbekannt'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Raum:</Typography>
              <Typography variant="body1">
                {data.room_details ? data.room_details.name : 'Nicht zugewiesen'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Erstelldatum:</Typography>
              <Typography variant="body1">{formatDate(data.created_at)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Temperatur/Luftfeuchte:</Typography>
              <Typography variant="body1">
                {data.temperature ? `${data.temperature}°C` : 'k.A.'} / 
                {data.humidity ? `${data.humidity}%` : 'k.A.'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="textSecondary">Batch-Nummer:</Typography>
              <Typography variant="body1">{data.batch_number}</Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {data.is_destroyed && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="error">Vernichtungsdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtungsgrund:</Typography>
                <Typography variant="body1">{data.destruction_reason}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtungsdatum:</Typography>
                <Typography variant="body1">
                  {formatDate(data.destruction_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Vernichtet durch:</Typography>
                <Typography variant="body1">
                  {data.destroying_member_details ? 
                    `${data.destroying_member_details.first_name} ${data.destroying_member_details.last_name}` : 
                    'Nicht angegeben'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        {data.is_transferred && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="success">Überführungsdaten</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Überführungsdatum:</Typography>
                <Typography variant="body1">
                  {formatDate(data.transfer_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Übergeführt durch:</Typography>
                <Typography variant="body1">
                  {data.transferring_member_details ? 
                    `${data.transferring_member_details.first_name} ${data.transferring_member_details.last_name}` : 
                    'Nicht angegeben'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Bemerkungen</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {data.notes || 'Keine Bemerkungen vorhanden'}
          </Typography>
        </Grid>
        
        {/* Aktionsbuttons basierend auf Status anzeigen */}
        {status === 'active' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              {/* Überführungsbutton sollte nur erscheinen, wenn besondere Umstände */}
              {false && (
                <>
                  <Button 
                    variant="outlined" 
                    color="info"
                    onClick={() => onMarkAsPartiallyTransferred && onMarkAsPartiallyTransferred(data)}
                  >
                    Als teilweise übergeführt markieren
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="success"
                    onClick={() => onMarkAsFullyTransferred && onMarkAsFullyTransferred(data)}
                  >
                    Als vollständig übergeführt markieren
                  </Button>
                </>
              )}
              
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => onMarkAsDestroyed && onMarkAsDestroyed(data)}
              >
                Als vernichtet markieren
              </Button>
            </Box>
          </Grid>
        )}

        {/* Bei teilweise übergeführtem Status nur den Vernichtungsbutton anbieten */}
        {status === 'partially_transferred' && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => onMarkAsDestroyed && onMarkAsDestroyed(data)}
              >
                Als vernichtet markieren
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CuttingDetails;