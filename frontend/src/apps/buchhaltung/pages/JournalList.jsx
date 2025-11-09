import React, { useEffect, useState } from 'react'
import {
  Box, Typography, TextField, MenuItem, Button, Chip,
  IconButton, Collapse, Tooltip, Divider, FormControl, Select,
  useTheme, alpha
} from '@mui/material'
import {
  ExpandMore,
  Delete as DeleteIcon
} from '@mui/icons-material'
import axios from '@/utils/api'

export default function JournalList() {
  const theme = useTheme()
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
  
  const pageSizeOptions = [25, 50, 100]

  // Akzentfarbe für Storno-Buchungen (grün)
  const accentColor = '#2e7d32';
  const stornoColor = '#e74c3c';

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
      
      if (list && list.length > 0) {
        const years = [...new Set(list.map(entry => new Date(entry.datum).getFullYear()))];
        years.sort((a, b) => b - a);
        setAvailableYears(years);
      }
    })
  }

  useEffect(() => {
    let result = [...entries]

    if (typeFilter === 'STORNIERT') {
      result = result.filter(e => e.storniert || e.is_storno)
    } else if (typeFilter !== 'ALL') {
      result = result.filter(e => e.typ === typeFilter && !e.storniert)
    }

    if (yearFilter !== 'ALL') {
      const year = parseInt(yearFilter);
      result = result.filter(entry => new Date(entry.datum).getFullYear() === year);
    }

    if (monthFilter !== 'ALL') {
      const month = parseInt(monthFilter);
      result = result.filter(entry => new Date(entry.datum).getMonth() + 1 === month);
    }

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
  
  const handleToggle = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(row => row !== id) : [...prev, id]
    )
  }

  const handlePageChange = (e, newPage) => setPage(newPage)
  const handlePageSizeChange = (newPageSize) => {
    setRowsPerPage(newPageSize)
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
          fetchBookings()
        })
        .catch((err) => {
          console.error(err)
          alert(`Fehler beim Stornieren der Buchung: ${err.response?.data?.error || 'Unbekannter Fehler'}`)
        })
    }
  }

  const getStyledText = (text, isStorniert, isStornoBuchung) => {
    if (isStorniert && !isStornoBuchung) {
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
      return (
        <span style={{
          color: accentColor,
          fontStyle: 'italic'
        }}>
          {text}
        </span>
      )
    }
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
    
    return <div>{parts}</div>
  }

  // T-Konten-Darstellung
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
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          borderRadius: '8px',
          overflow: 'hidden',
          background: theme.palette.background.paper
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            bottom: 0, 
            left: '50%', 
            width: '1px', 
            backgroundColor: alpha(theme.palette.divider, 0.12),
            zIndex: 1
          }}/>
          
          <Box sx={{ flex: 1, padding: 2, position: 'relative', borderRight: 'none' }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
            }}>
              SOLL
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`soll-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? `1px dashed ${alpha(theme.palette.divider, 0.08)}` : 'none'
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
          
          <Box sx={{ flex: 1, padding: 2, position: 'relative', borderLeft: 'none' }}>
            <Typography variant="subtitle2" sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              mb: 1,
              pb: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
            }}>
              HABEN
            </Typography>
            
            {transactions.map((tx, i) => (
              <Box key={`haben-${i}`} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                py: 0.5,
                borderBottom: i < transactions.length - 1 ? `1px dashed ${alpha(theme.palette.divider, 0.08)}` : 'none'
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

  const StornoInfoBox = ({ entry }) => {
    const navigateToDetail = (id) => {
      window.location.href = `/buchhaltung/bookings/${id}/`;
    };

    if (entry.storniert && !entry.is_storno) {
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: alpha(stornoColor, 0.08), 
          borderRadius: 1,
          mb: 2,
          border: `1px solid ${alpha(stornoColor, 0.2)}`
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
    
    if (entry.is_storno && entry.original_buchung_id) {
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: alpha(accentColor, 0.08), 
          borderRadius: 1,
          mb: 2,
          border: `1px solid ${alpha(accentColor, 0.2)}`
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

  // Header-Spalten definieren
  const getHeaderColumns = () => [
    { label: '', width: '3%', align: 'center' },
    { label: '#', width: '5%' },
    { label: 'Betrag (€)', width: '10%' },
    { label: 'Typ', width: '12%' },
    { label: 'Buchungsnummer', width: '15%' },
    { label: 'Verwendungszweck', width: '25%' },
    { label: 'Mitglied', width: '15%' },
    { label: 'Datum', width: '10%' },
    { label: 'Aktionen', width: '5%', align: 'center' }
  ]
  
  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header mit Titel */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          📘 Buchungsjournal
        </Typography>
      </Box>

      {/* Filterzeile */}
      <Box sx={{ 
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
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
        
        <TextField
          label="Jahr"
          size="small"
          select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
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
        
        <TextField
          label="Monat"
          size="small"
          select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={{ minWidth: '120px' }}
          disabled={yearFilter === 'ALL'}
        >
          <MenuItem value="ALL">Alle Monate</MenuItem>
          {months.map(month => (
            <MenuItem key={month.value} value={month.value}>{month.name}</MenuItem>
          ))}
        </TextField>
        
        {(yearFilter !== 'ALL' || monthFilter !== 'ALL' || typeFilter !== 'ALL' || search) && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 1 }}>
            {yearFilter !== 'ALL' && (
              <Chip 
                label={`Jahr: ${yearFilter}`} 
                size="small" 
                onDelete={() => {
                  setYearFilter('ALL');
                  setMonthFilter('ALL');
                }}
              />
            )}
            {monthFilter !== 'ALL' && (
              <Chip 
                label={`Monat: ${months.find(m => m.value === parseInt(monthFilter))?.name}`} 
                size="small" 
                onDelete={() => setMonthFilter('ALL')}
              />
            )}
            {typeFilter !== 'ALL' && (
              <Chip 
                label={`Typ: ${typeFilter}`} 
                size="small" 
                onDelete={() => setTypeFilter('ALL')}
              />
            )}
            {search && (
              <Chip 
                label={`Suche: ${search}`} 
                size="small" 
                onDelete={() => setSearch('')}
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
              sx={{ height: '24px' }}
            >
              Alle zurücksetzen
            </Button>
          </Box>
        )}
      </Box>

      {/* Hauptinhalt mit Scroll */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme.palette.background.default
      }}>
        {/* Scrollbarer Bereich */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
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
          {/* Tabellenkopf - sticky */}
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
            mt: 0
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
          {paginated.map((entry, index) => {
            const isStorniert = entry.storniert
            const isStornoBuchung = entry.is_storno
            const totalAmount = entry.subtransactions.reduce((sum, tx) => sum + parseFloat(tx.betrag), 0)
            
            return (
              <React.Fragment key={entry.id}>
                {/* Hauptzeile */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '48px',
                    px: 1.5,
                    py: 1,
                    backgroundColor: theme.palette.background.default,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    // GoB-konforme Darstellung
                    ...(isStorniert && !isStornoBuchung && {
                      opacity: 0.75,
                      backgroundColor: alpha(stornoColor, 0.03),
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
                    ...(isStornoBuchung && {
                      backgroundColor: alpha(accentColor, 0.03)
                    }),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.03)
                    }
                  }}
                  onClick={() => handleToggle(entry.id)}
                >
                  <Box sx={{ width: '3%', px: 0.5, display: 'flex', justifyContent: 'center' }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(entry.id);
                      }}
                      sx={{ 
                        p: 0.5,
                        transform: expandedRows.includes(entry.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 300ms ease-in-out'
                      }}
                    >
                      <ExpandMore fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: '5%', px: 1 }}>
                    <Typography variant="body2">
                      {page * rowsPerPage + index + 1}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '10%', px: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {getStyledText(totalAmount.toFixed(2), isStorniert, isStornoBuchung)}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '12%', px: 1 }}>
                    <Typography variant="body2">
                      {getStyledText(entry.typ, isStorniert, isStornoBuchung)}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '15%', px: 1 }}>
                    {getBookingLabel(entry)}
                  </Box>
                  <Box sx={{ width: '25%', px: 1 }}>
                    <Tooltip title={entry.verwendungszweck}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}
                      >
                        {getStyledText(entry.verwendungszweck, isStorniert, isStornoBuchung)}
                      </Typography>
                    </Tooltip>
                  </Box>
                  <Box sx={{ width: '15%', px: 1 }}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}
                      title={entry.mitgliedsname}
                    >
                      {entry.mitgliedsname ? getStyledText(entry.mitgliedsname, isStorniert, isStornoBuchung) : '–'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '10%', px: 1 }}>
                    <Typography variant="body2">
                      {getStyledText(new Date(entry.datum).toLocaleDateString('de-DE'), isStorniert, isStornoBuchung)}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '5%', px: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    {!isStorniert && !isStornoBuchung && (
                      <>
                        <Tooltip title="Löschen & Rückrechnen">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Buchung stornieren">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStorno(entry.id);
                            }}
                            sx={{ p: 0.5 }}
                          >
                            ❌
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {isStorniert && !isStornoBuchung && (
                      <Chip 
                        label="Storniert"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: '20px', fontSize: '0.7rem' }}
                      />
                    )}
                    {isStornoBuchung && (
                      <Chip
                        label="Storno"
                        size="small"
                        style={{ color: accentColor, borderColor: accentColor }}
                        variant="outlined"
                        sx={{ height: '20px', fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Erweiterte Details */}
                <Collapse in={expandedRows.includes(entry.id)} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                  }}>
                    <StornoInfoBox entry={entry} />
                    
                    {/* Sub-Transaktionen Tabelle */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        📝 Sub-Transaktionen
                      </Typography>
                      <Box sx={{ 
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        {/* Header */}
                        <Box sx={{ 
                          display: 'flex',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                          p: 1
                        }}>
                          <Box sx={{ width: '10%', px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>#</Typography>
                          </Box>
                          {entry.typ === 'MEHRFACH' && (
                            <Box sx={{ width: '20%', px: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Sub-Buchungsnummer</Typography>
                            </Box>
                          )}
                          <Box sx={{ width: entry.typ === 'MEHRFACH' ? '15%' : '20%', px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Betrag</Typography>
                          </Box>
                          <Box sx={{ width: '25%', px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Soll-Konto</Typography>
                          </Box>
                          <Box sx={{ width: '25%', px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Haben-Konto</Typography>
                          </Box>
                          <Box sx={{ flex: 1, px: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Zweck</Typography>
                          </Box>
                        </Box>
                        
                        {/* Rows */}
                        {entry.subtransactions.map((tx, i) => (
                          <Box 
                            key={tx.id} 
                            sx={{ 
                              display: 'flex',
                              borderBottom: i < entry.subtransactions.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
                              p: 1,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.action.hover, 0.03)
                              }
                            }}
                          >
                            <Box sx={{ width: '10%', px: 1 }}>
                              <Typography variant="body2">{tx.laufende_nummer || ''}</Typography>
                            </Box>
                            {entry.typ === 'MEHRFACH' && (
                              <Box sx={{ width: '20%', px: 1 }}>
                                <Typography variant="body2">
                                  {getStyledText(tx.buchungsnummer_sub || '', isStorniert, isStornoBuchung)}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ width: entry.typ === 'MEHRFACH' ? '15%' : '20%', px: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {getStyledText(parseFloat(tx.betrag).toFixed(2), isStorniert, isStornoBuchung)}
                              </Typography>
                            </Box>
                            <Box sx={{ width: '25%', px: 1 }}>
                              <Typography variant="body2">
                                {getStyledText(`${tx.soll_konto?.kontonummer} · ${tx.soll_konto?.name}`, isStorniert, isStornoBuchung)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                ({tx.soll_konto?.konto_typ})
                              </Typography>
                            </Box>
                            <Box sx={{ width: '25%', px: 1 }}>
                              <Typography variant="body2">
                                {getStyledText(`${tx.haben_konto?.kontonummer} · ${tx.haben_konto?.name}`, isStorniert, isStornoBuchung)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                ({tx.haben_konto?.konto_typ})
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, px: 1 }}>
                              <Typography variant="body2">
                                {getStyledText(tx.verwendungszweck || '–', isStorniert, isStornoBuchung)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    
                    <TKontenDarstellung 
                      transactions={entry.subtransactions} 
                      isStorniert={isStorniert} 
                      isStornoBuchung={isStornoBuchung}
                    />
                  </Box>
                </Collapse>
              </React.Fragment>
            )
          })}
          
          {paginated.length === 0 && (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              Keine Buchungen gefunden
            </Typography>
          )}
        </Box>
        
        {/* Footer mit Pagination und Zusammenfassung */}
        <Box 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            backgroundColor: theme.palette.background.paper,
            p: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            minHeight: '56px'
          }}
        >
          {/* Zusammenfassung links */}
          {filtered.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} Buchungen gefunden
                {yearFilter !== 'ALL' && ` (Jahr ${yearFilter})`}
                {monthFilter !== 'ALL' && ` (${months.find(m => m.value === parseInt(monthFilter))?.name})`}
              </Typography>
              
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Summe: {filtered.reduce((sum, entry) => 
                  sum + entry.subtransactions.reduce((txSum, tx) => txSum + parseFloat(tx.betrag), 0), 0
                ).toFixed(2)} €
              </Typography>
            </Box>
          )}
          
          {/* Pagination rechts */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Einträge pro Seite
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                sx={{ fontSize: '0.875rem' }}
              >
                {pageSizeOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filtered.length)} von {filtered.length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}