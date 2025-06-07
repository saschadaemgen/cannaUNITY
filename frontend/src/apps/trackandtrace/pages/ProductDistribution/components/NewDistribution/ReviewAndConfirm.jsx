// frontend/src/apps/trackandtrace/pages/ProductDistribution/components/NewDistribution/ReviewAndConfirm.jsx
import { 
  Box, Typography, Paper, Grid, Divider, TextField,
  Card, CardContent, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Chip, Avatar,
  Alert
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import FilterDramaIcon from '@mui/icons-material/FilterDrama'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ScaleIcon from '@mui/icons-material/Scale'
import ScienceIcon from '@mui/icons-material/Science'
import NotesIcon from '@mui/icons-material/Notes'

export default function ReviewAndConfirm({ 
  recipient, 
  selectedUnits, 
  totalWeight, 
  productSummary,
  notes,
  setNotes 
}) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        Überprüfung und Bestätigung
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        Bitte überprüfen Sie alle Angaben sorgfältig. Nach der RFID-Autorisierung 
        wird die Ausgabe dokumentiert und kann nicht mehr geändert werden.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Empfänger-Zusammenfassung */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Empfänger
            </Typography>
            
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {recipient?.first_name} {recipient?.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mitgliedsnr.: {recipient?.member_number || 'k.A.'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    E-Mail:
                  </Typography>
                  <Typography variant="caption">
                    {recipient?.email || 'k.A.'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip label="Aktiv" size="small" color="success" />
                </Box>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
        
        {/* Produkt-Zusammenfassung */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Produktzusammenfassung
            </Typography>
            
            {/* Statistik-Karten */}
            <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ScaleIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {totalWeight.toFixed(2)}g
                    </Typography>
                    <Typography variant="caption">
                      Gesamtgewicht
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <LocalFloristIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {Object.values(productSummary).find(p => p.displayType.includes('Marihuana'))?.count || 0}
                    </Typography>
                    <Typography variant="caption">
                      Marihuana
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <FilterDramaIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {Object.values(productSummary).find(p => p.displayType.includes('Haschisch'))?.count || 0}
                    </Typography>
                    <Typography variant="caption">
                      Haschisch
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Produktliste */}
            <Typography variant="subtitle2" gutterBottom>
              Ausgewählte Einheiten ({selectedUnits.length})
            </Typography>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Einheitsnummer</TableCell>
                    <TableCell>Genetik</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell align="right">Gewicht</TableCell>
                    <TableCell align="center">THC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedUnits.map((unit) => {
                    const batch = unit.batch || {}
                    const isMarijuana = batch.product_type === 'marijuana'
                    const strain = batch.source_strain || 'Unbekannt'
                    const thc = batch.thc_content || 'k.A.'
                    
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {unit.batch_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScienceIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {strain}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={isMarijuana ? <LocalFloristIcon /> : <FilterDramaIcon />}
                            label={batch.product_type_display || 'Unbekannt'}
                            size="small"
                            color={isMarijuana ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {parseFloat(unit.weight).toFixed(2)}g
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {thc}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Notizen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <NotesIcon color="action" />
              Bemerkungen zur Ausgabe
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Optional: Fügen Sie hier spezielle Hinweise oder Bemerkungen zur Ausgabe hinzu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              sx={{ mt: 2 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}