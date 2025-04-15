import React, { useEffect, useState } from 'react'
import {
  Box, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, Card, CardContent, IconButton, Collapse, Tooltip, Divider, Button, Chip
} from '@mui/material'
import {
  ExpandMore, ExpandLess,
  Delete as DeleteIcon
} from '@mui/icons-material'
import axios from '../../../utils/api'

export default function JournalList() {
  const [entries, setEntries] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [expandedRows, setExpandedRows] = useState([])
  const [availableYears, setAvailableYears] = useState([])

  // Akzentfarbe für Storno-Buchungen (grün)
  const accentColor = '#2e7d32'; // Die grüne Farbe aus den Bildern
  const stornoColor = '#e74c3c'; // Rot für stornierte Buchungen

  // Liste der Monate für den Filter
  const months = [
    { value: 1, name: 'Januar' },
    { value: 2, name: 'Februar' },
    { value: 3, name: 'März' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Dezember' }
  ];

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = () => {
    axios.get('/buchhaltung/journal/').then(res => {
      const list = res.data?.results ?? res.data
      setEntries(list)
      setFiltered(list)
      
      // Verfügbare Jahre aus den Buchungen extrahieren
      if (list && list.length > 0) {
        const years = [...new Set(list.map(entry => new Date(entry.datum).getFullYear()))];
        years.sort((a, b) => b - a); // Absteigend sortieren (neueste zuerst)
        setAvailableYears(years);
      }
    })
  }

  useEffect(() => {
    let result = [...entries]

    // Typ-Filter anwenden
    if (typeFilter === 'STORNIERT') {
      result = result.filter(e => e.storniert || e.is_storno)
    } else if (typeFilter !== 'ALL') {
      result = result.filter(e => e.typ === typeFilter && !e.storniert)
    }

    // Jahr-Filter anwenden
    if (yearFilter !== 'ALL') {
      const year = parseInt(yearFilter);
      result = result.filter(entry => new Date(entry.datum).getFullYear() === year);
    }

    // Monats-Filter anwenden
    if (monthFilter !== 'ALL') {
      const month = parseInt(monthFilter);
      result = result.filter(entry => new Date(entry.datum).getMonth() + 1 === month);
    }

    // Suchtext-Filter anwenden
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(entry =>
        entry.verwendungszweck.toLowerCase().includes(lower) ||
        entry.buchungsnummer.toLowerCase().includes(lower) ||
        (entry.mitgliedsname && entry.mitgliedsname.toLowerCase().includes(lower))
      )
    }

    setFiltered(result)
    setPage(0)
  }, [search, entries, typeFilter, yearFilter, monthFilter])
  
  // Restlicher Code bleibt unverändert...
  const handleToggle = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(row => row !== id) : [...prev, id]
    )
  }

  const handleChangePage = (e, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const handleDelete = (id) => {
    if (confirm("Diese Buchung wirklich löschen und rückgängig machen?")) {
      axios.post(`/buchhaltung/bookings/${id}/delete-with-rollback/`)
        .then(() => {
          alert("Buchung erfolgreich gelöscht.")
          setEntries(prev => prev.filter(b => b.id !== id))
        })
        .catch(() => alert("Fehler beim Löschen der Buchung."))
    }
  }

  const handleStorno = (id) => {
    if (confirm("Diese Buchung wirklich stornieren?")) {
      axios.post(`/buchhaltung/bookings/${id}/storno/`)
        .then(() => {
          alert("Buchung erfolgreich storniert.")
          fetchBookings() // Alle Buchungen neu laden
        })
        .catch((err) => {
          console.error(err)
          alert(`Fehler beim Stornieren der Buchung: ${err.response?.data?.error || 'Unbekannter Fehler'}`)
        })
    }
  }

  // GoB-konforme Formatierung für stornierte Einträge
  const getStyledText = (text, isStorniert, isStornoBuchung) => {
    if (isStorniert && !isStornoBuchung) {
      // Original-Buchung wurde storniert (durchgestrichen)
      return (
        <span style={{
          textDecoration: 'line-through',
          color: stornoColor,
          position: 'relative'
        }}>
          {text}
        </span>
      )
    } else if (isStornoBuchung) {
      // Dies ist eine Storno-Buchung (grün markiert)
      return (
        <span style={{
          color: accentColor,
          fontStyle: 'italic'
        }}>
          {text}
        </span>
      )
    }
    // Normale Buchung
    return <span>{text}</span>
  }

  const getBookingLabel = (entry) => {
    const parts = []
    
    if (entry.storniert) {
      parts.push(<span key="storno-icon" style={{marginRight: '4px', color: stornoColor}}>❌</span>)
    }
    
    if (entry.is_storno) {
      parts.push(<span key="storno-buchung-icon" style={{marginRight: '4px', color: accentColor}}>↩️</span>)
    }
    
    // Für Mehrfachbuchungen M hinzufügen
    let buchungsnummer = entry.buchungsnummer;
    if (entry.typ === 'MEHRFACH' && !buchungsnummer.endsWith('-M') && !buchungsnummer.endsWith('M')) {
      buchungsnummer += '-M';
    }
    
    parts.push(<span key="buchungsnummer">{buchungsnummer}</span>)

    if (entry.is_storno && entry.original_buchung_nr) {
      parts.push(
        <span key="original-ref" style={{ fontSize: '0.8em', color: 'gray', display: 'block' }}>
          Storno zu: {entry.original_buchung_nr}
        </span>
      )
    }
    
    return (
      <div>
        {parts}
      </div>
    )
  }

  // Verbesserte T-Konten-Darstellung
  const TKontenDarstellung = ({ transactions, isStorniert, isStornoBuchung }) => {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          🧾 T-Konten-Darstellung
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f8f8f8'
        }}>
          {/* Vertikale Linie in der Mitte */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            bottom: 0, 
            left: '50%', 
            width: '1px', 
            backgroundColor: '#ddd',
            zIndex: 1
          }}/>
          
          {/* Soll-Seite */}
          <Box sx={{ 
            flex: 1, 
            padding: 2,
            position: 'relative',
            borderRight: 'none'
          }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: '1px solid #ddd'
            }}>
              SOLL
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`soll-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? '1px dashed #eee' : 'none'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getStyledText(tx.soll_konto?.kontonummer, isStorniert, isStornoBuchung)}
                </Typography>
                <Typography variant="body2">
                  {getStyledText(`${parseFloat(tx.betrag).toFixed(2)} €`, isStorniert, isStornoBuchung)}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Haben-Seite */}
          <Box sx={{ 
            flex: 1, 
            padding: 2,
            position: 'relative',
            borderLeft: 'none'
          }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: '1px solid #ddd'
            }}>
              HABEN
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`haben-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? '1px dashed #eee' : 'none'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {getStyledText(tx.haben_konto?.kontonummer, isStorniert, isStornoBuchung)}
                </Typography>
                <Typography variant="body2">
                  {getStyledText(`${parseFloat(tx.betrag).toFixed(2)} €`, isStorniert, isStornoBuchung)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  // Zusätzliche Komponente für Stornoinformationen
  const StornoInfoBox = ({ entry }) => {
    const navigateToDetail = (id) => {
      window.location.href = `/buchhaltung/bookings/${id}/`;
    };

    // Wenn es eine stornierte Original-Buchung ist
    if (entry.storniert && !entry.is_storno) {
      // Hier würden wir idealerweise die Storno-Buchung suchen, die auf diese Originalbuchung verweist
      // Da wir diese Information nicht direkt haben, zeigen wir einen generischen Hinweis
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'rgba(231, 76, 60, 0.1)', 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>❌</span> 
            Buchung wurde storniert
          </Typography>
          <Typography variant="body2">
            Diese Buchung wurde storniert. Die Gegenbuchung hat alle Kontenänderungen rückgängig gemacht.
          </Typography>
        </Box>
      );
    }
    
    // Wenn es eine Storno-Buchung ist
    if (entry.is_storno && entry.original_buchung_id) {
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'rgba(46, 125, 50, 0.1)', 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>↩️</span> 
            Storno-Buchung
          </Typography>
          <Typography variant="body2">
            Dies ist eine Storno-Buchung zur Buchung{' '}
            <Button 
              variant="text" 
              size="small" 
              onClick={() => navigateToDetail(entry.original_buchung_id)}
              sx={{ 
                color: accentColor, 
                fontWeight: 'bold',
                minWidth: 'auto',
                p: '0 4px'
              }}
            >
              {entry.original_buchung_nr}
            </Button>
            
            {' '}. Diese Buchung macht alle Kontenänderungen der Originalbuchung rückgängig.
          </Typography>
        </Box>
      );
    }
    
    return null;
  };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  
  return (
    <Box p={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        📘 Buchungsjournal
      </Typography>

      {/* Erweiterte Filteroptionen mit Jahr und Monat */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Suche"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <TextField
          label="Buchungstyp"
          size="small"
          select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <MenuItem value="ALL">Alle Typen</MenuItem>
          <MenuItem value="EINZEL">Einzelbuchung</MenuItem>
          <MenuItem value="MEHRFACH">Mehrfachbuchung</MenuItem>
          <MenuItem value="MITGLIEDSBEITRAG">Mitgliedsbeitrag</MenuItem>
          <MenuItem value="STORNIERT">Stornierte & Stornos</MenuItem>
        </TextField>
        
        {/* Neuer Filter für Jahr */}
        <TextField
          label="Jahr"
          size="small"
          select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            // Wenn ein Jahr ausgewählt wird, aber der Monat auf ALL steht, behalten wir das so
            // Wenn wir zurück zu "Alle Jahre" gehen, setzen wir auch den Monat zurück
            if (e.target.value === 'ALL') {
              setMonthFilter('ALL');
            }
          }}
          sx={{ minWidth: '120px' }}
        >
          <MenuItem value="ALL">Alle Jahre</MenuItem>
          {availableYears.map(year => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </TextField>
        
        {/* Neuer Filter für Monat */}
        <TextField
          label="Monat"
          size="small"
          select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={{ minWidth: '120px' }}
          disabled={yearFilter === 'ALL'} // Nur aktivieren, wenn ein Jahr ausgewählt ist
        >
          <MenuItem value="ALL">Alle Monate</MenuItem>
          {months.map(month => (
            <MenuItem key={month.value} value={month.value}>{month.name}</MenuItem>
          ))}
        </TextField>
        
        {/* Filterbadges für schnelles Zurücksetzen der Filter */}
        {(yearFilter !== 'ALL' || monthFilter !== 'ALL' || typeFilter !== 'ALL' || search) && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            {yearFilter !== 'ALL' && (
              <Chip 
                label={`Jahr: ${yearFilter}`} 
                size="small" 
                onDelete={() => {
                  setYearFilter('ALL');
                  setMonthFilter('ALL');
                }}
                sx={{ mr: 1 }}
              />
            )}
            {monthFilter !== 'ALL' && (
              <Chip 
                label={`Monat: ${months.find(m => m.value === parseInt(monthFilter))?.name}`} 
                size="small" 
                onDelete={() => setMonthFilter('ALL')}
                sx={{ mr: 1 }}
              />
            )}
            {typeFilter !== 'ALL' && (
              <Chip 
                label={`Typ: ${typeFilter}`} 
                size="small" 
                onDelete={() => setTypeFilter('ALL')}
                sx={{ mr: 1 }}
              />
            )}
            {search && (
              <Chip 
                label={`Suche: ${search}`} 
                size="small" 
                onDelete={() => setSearch('')}
                sx={{ mr: 1 }}
              />
            )}
            <Button 
              size="small" 
              onClick={() => {
                setYearFilter('ALL');
                setMonthFilter('ALL');
                setTypeFilter('ALL');
                setSearch('');
              }}
              variant="outlined"
            >
              Alle Filter zurücksetzen
            </Button>
          </Box>
        )}
      </Box>

      <Card elevation={1}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                  <TableCell padding="checkbox">🔽</TableCell>
                  <TableCell>#</TableCell>
                  <TableCell>Betrag (€)</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Buchungsnummer</TableCell>
                  <TableCell>Verwendungszweck</TableCell>
                  <TableCell>Mitglied</TableCell>
                  <TableCell>Datum</TableCell>
                  <TableCell align="center">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((entry, index) => {
                  const isStorniert = entry.storniert
                  const isStornoBuchung = entry.is_storno
                  const totalAmount = entry.subtransactions.reduce((sum, tx) => sum + parseFloat(tx.betrag), 0)
                  
                  return (
                    <React.Fragment key={entry.id}>
                      <TableRow 
                        hover
                        sx={{
                          // GoB-konforme Darstellung mit neueren MUI Styles:
                          position: 'relative',
                          // Stornierte Buchungen leicht rötlich
                          ...(isStorniert && !isStornoBuchung && {
                            opacity: 0.75,
                            backgroundColor: 'rgba(231, 76, 60, 0.05)',
                            textDecoration: 'line-through',
                            textDecorationColor: stornoColor,
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              top: '50%',
                              height: '1px',
                              backgroundColor: stornoColor,
                              zIndex: 1
                            }
                          }),
                          // Storno-Buchungen leicht grünlich
                          ...(isStornoBuchung && {
                            backgroundColor: 'rgba(46, 125, 50, 0.05)'
                          })
                        }}
                      >
                        <TableCell padding="checkbox">
                          <IconButton size="small" onClick={() => handleToggle(entry.id)}>
                            {expandedRows.includes(entry.id) ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          {getStyledText(
                            totalAmount.toFixed(2),
                            isStorniert,
                            isStornoBuchung
                          )}
                        </TableCell>
                        <TableCell>
                          {getStyledText(entry.typ, isStorniert, isStornoBuchung)}
                        </TableCell>
                        <TableCell>
                          {getBookingLabel(entry)}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={entry.verwendungszweck}>
                            {getStyledText(
                              entry.verwendungszweck,
                              isStorniert,
                              isStornoBuchung
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {entry.mitgliedsname ? (
                            <Tooltip title={entry.mitgliedsname}>
                              {getStyledText(
                                entry.mitgliedsname,
                                isStorniert,
                                isStornoBuchung
                              )}
                            </Tooltip>
                          ) : '–'}
                        </TableCell>
                        <TableCell>
                          {getStyledText(
                            new Date(entry.datum).toLocaleDateString('de-DE'),
                            isStorniert,
                            isStornoBuchung
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {!isStorniert && !isStornoBuchung && (
                            <>
                              <Tooltip title="Löschen & Rückrechnen">
                                <IconButton size="small" color="error" onClick={() => handleDelete(entry.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Buchung stornieren">
                                <IconButton size="small" onClick={() => handleStorno(entry.id)}>
                                  ❌
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {isStorniert && !isStornoBuchung && (
                            <Tooltip title="Storniert">
                              <Chip 
                                label="Storniert"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                          {isStornoBuchung && (
                            <Tooltip title={`Storno zu ${entry.original_buchung_nr}`}>
                              <Chip
                                label="Storno-Buchung"
                                size="small"
                                style={{ color: accentColor, borderColor: accentColor }}
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expandedRows.includes(entry.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                              {/* Neue Komponente für Storno-Informationen */}
                              <StornoInfoBox entry={entry} />
                            
                              <Table size="small" sx={{ width: '100%' }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>#</TableCell>
                                    {/* Spalte "Sub-Buchungsnummer" nur bei Mehrfachbuchungen anzeigen */}
                                    {entry.typ === 'MEHRFACH' && (
                                      <TableCell>Sub-Buchungsnummer</TableCell>
                                    )}
                                    <TableCell>Betrag</TableCell>
                                    <TableCell>Soll-Konto</TableCell>
                                    <TableCell>Haben-Konto</TableCell>
                                    <TableCell>Zweck</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {entry.subtransactions.map((tx, i) => (
                                    <TableRow key={tx.id}>
                                      <TableCell>{tx.laufende_nummer || ''}</TableCell>
                                      {/* Spalte "Sub-Buchungsnummer" nur bei Mehrfachbuchungen anzeigen */}
                                      {entry.typ === 'MEHRFACH' && (
                                        <TableCell>
                                          {getStyledText(
                                            tx.buchungsnummer_sub || '',
                                            isStorniert,
                                            isStornoBuchung
                                          )}
                                        </TableCell>
                                      )}
                                      <TableCell>
                                        {getStyledText(
                                          parseFloat(tx.betrag).toFixed(2),
                                          isStorniert,
                                          isStornoBuchung
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {getStyledText(
                                          `${tx.soll_konto?.kontonummer} · ${tx.soll_konto?.name}`,
                                          isStorniert,
                                          isStornoBuchung
                                        )}
                                        <Typography variant="caption" sx={{ display: 'block', color: 'gray' }}>
                                          ({tx.soll_konto?.konto_typ})
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        {getStyledText(
                                          `${tx.haben_konto?.kontonummer} · ${tx.haben_konto?.name}`,
                                          isStorniert,
                                          isStornoBuchung
                                        )}
                                        <Typography variant="caption" sx={{ display: 'block', color: 'gray' }}>
                                          ({tx.haben_konto?.konto_typ})
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        {getStyledText(
                                          tx.verwendungszweck || '–',
                                          isStorniert,
                                          isStornoBuchung
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>

                              <Divider sx={{ my: 2 }} />
                              
                              {/* Verbesserte T-Konten-Darstellung */}
                              <TKontenDarstellung 
                                transactions={entry.subtransactions} 
                                isStorniert={isStorniert} 
                                isStornoBuchung={isStornoBuchung}
                              />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginationsanzeige */}
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Einträge pro Seite"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
          />
          
          {/* Zusammenfassung der angezeigten Daten */}
          {filtered.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} Buchungen gefunden
                {yearFilter !== 'ALL' && ` (Jahr ${yearFilter})`}
                {monthFilter !== 'ALL' && ` (${months.find(m => m.value === parseInt(monthFilter))?.name})`}
              </Typography>
              
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Summe: {filtered.reduce((sum, entry) => 
                    sum + entry.subtransactions.reduce((txSum, tx) => txSum + parseFloat(tx.betrag), 0), 0
                  ).toFixed(2)} €
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}