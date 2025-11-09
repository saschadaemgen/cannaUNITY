import React, { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, FormControl, Select, useTheme, alpha
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import axios from '@/utils/api'

export default function AccountList() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [search, setSearch] = useState('')
  const [saldoFilter, setSaldoFilter] = useState('HAS_SALDO')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [grouping, setGrouping] = useState('CATEGORY')
  const [categoryList, setCategoryList] = useState([])

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const pageSizeOptions = [15, 20, 25, 50]

  useEffect(() => {
    axios.get('/buchhaltung/accounts/').then(res => {
      const data = res.data?.results ?? res.data
      const list = Array.isArray(data) ? data : []
      setAccounts(list)

      // Kategorie-Liste vorbereiten
      const cats = Array.from(new Set(list.map(acc => acc.category).filter(Boolean)))
      setCategoryList(cats)
    })
  }, [])

  // Filterlogik
  useEffect(() => {
    let result = [...accounts]

    if (saldoFilter === 'HAS_SALDO') {
      result = result.filter(acc => parseFloat(acc.saldo) !== 0)
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(acc => acc.konto_typ === typeFilter)
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(acc => acc.category === categoryFilter)
    }

    if (search) {
      result = result.filter(acc =>
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.kontonummer.includes(search)
      )
    }

    setFilteredAccounts(result)
    setPage(0)
  }, [search, saldoFilter, typeFilter, categoryFilter, accounts])

  // Pagination-Helfer
  const handlePageChange = (e, newPage) => setPage(newPage)
  const handlePageSizeChange = (newPageSize) => {
    setRowsPerPage(newPageSize)
    setPage(0)
  }

  // Gruppierung nach Kategorie
  const groupedByCategory = filteredAccounts.reduce((groups, acc) => {
    const cat = acc.category || 'Sonstige'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(acc)
    return groups
  }, {})

  const renderTable = (data) => {
    const paginatedData = grouping === 'ALL'
      ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : data

    return (
      <>
        {paginatedData.map((acc, index) => (
          <Box
            key={acc.id}
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
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.03)
              },
              '&:last-child': {
                borderBottom: 'none'
              }
            }}
          >
            <Box sx={{ width: '12%', px: 1 }}>
              <Typography variant="body2">{acc.kontonummer}</Typography>
            </Box>
            <Box sx={{ width: '28%', px: 1 }}>
              <Typography 
                variant="body2"
                title={acc.name}
                sx={{ 
                  fontWeight: 500,
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}
              >
                {acc.name}
              </Typography>
            </Box>
            <Box sx={{ width: '12%', px: 1 }}>
              <Typography variant="body2">{acc.konto_typ}</Typography>
            </Box>
            <Box sx={{ width: '28%', px: 1 }}>
              <Typography 
                variant="body2"
                title={acc.category}
                sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}
              >
                {acc.category}
              </Typography>
            </Box>
            <Box sx={{ width: '10%', px: 1, textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: parseFloat(acc.saldo) < 0 ? 'error.main' : 'text.primary'
                }}
              >
                {parseFloat(acc.saldo).toFixed(2)}€
              </Typography>
            </Box>
            <Box sx={{ width: '10%', px: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/buchhaltung/konten/${acc.id}/edit`)
                }}
                sx={{ 
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  alert('Löschen kommt gleich')
                }}
                sx={{ 
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08)
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </>
    )
  }

  // Header-Spalten definieren
  const getHeaderColumns = () => [
    { label: 'Kontonummer', width: '12%' },
    { label: 'Name', width: '28%' },
    { label: 'Typ', width: '12%' },
    { label: 'Kategorie', width: '28%' },
    { label: 'Saldo (€)', width: '10%', align: 'right' },
    { label: 'Aktionen', width: '10%', align: 'center' }
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Kontenübersicht
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/buchhaltung/konten/import')}>
            📥 Konten importieren
          </Button>
          <Button variant="contained" color="success" onClick={() => navigate('/buchhaltung/konten/neu')}>
            ➕ Neues Konto
          </Button>
        </Box>
      </Box>

      {/* Filterzeile */}
      <Box sx={{ 
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <TextField label="Suche" size="small" value={search} onChange={e => setSearch(e.target.value)} />
        <TextField label="Saldo" size="small" select value={saldoFilter} onChange={e => setSaldoFilter(e.target.value)}>
          <MenuItem value="ALL">Alle Konten</MenuItem>
          <MenuItem value="HAS_SALDO">Nur mit Saldo</MenuItem>
        </TextField>
        <TextField label="Typ" size="small" select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="ALL">Alle Typen</MenuItem>
          <MenuItem value="AKTIV">Aktiv</MenuItem>
          <MenuItem value="PASSIV">Passiv</MenuItem>
          <MenuItem value="ERTRAG">Ertrag</MenuItem>
          <MenuItem value="AUFWAND">Aufwand</MenuItem>
        </TextField>
        <TextField label="Kategorie" size="small" select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <MenuItem value="ALL">Alle Kategorien</MenuItem>
          {categoryList.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>
        <TextField label="Gruppierung" size="small" select value={grouping} onChange={e => setGrouping(e.target.value)}>
          <MenuItem value="CATEGORY">Nach Kategorie</MenuItem>
          <MenuItem value="ALL">Alle zusammen</MenuItem>
        </TextField>
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
                  px: 2.5,
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
          {filteredAccounts && filteredAccounts.length > 0 ? (
            grouping === 'CATEGORY'
              ? Object.entries(groupedByCategory).map(([cat, group]) => (
                <Box key={cat} sx={{ mb: 0 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      position: 'sticky',
                      top: '40px',
                      zIndex: 5
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }}
                    >
                      {cat}
                    </Typography>
                  </Box>
                  {renderTable(group)}
                </Box>
              ))
              : renderTable(filteredAccounts)
          ) : (
            <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
              Keine Konten gefunden
            </Typography>
          )}
        </Box>
        
        {/* Pagination Footer */}
        {grouping === 'ALL' && filteredAccounts.length > 0 && (
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
            {/* Einträge pro Seite */}
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
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredAccounts.length)} von {filteredAccounts.length}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}