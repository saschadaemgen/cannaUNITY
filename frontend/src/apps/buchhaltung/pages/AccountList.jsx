import React, { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, TablePagination, Card, CardContent
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import axios from '../../../utils/api'

export default function AccountList() {
  const navigate = useNavigate()
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
  const handleChangePage = (e, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (e) => {
    const val = parseInt(e.target.value, 10)
    setRowsPerPage(val)
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
      <Table
        size="small"
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          '& th:nth-of-type(1)': { width: '12%' },  // Kontonummer
          '& th:nth-of-type(2)': { width: '28%' },  // Name
          '& th:nth-of-type(3)': { width: '12%' },  // Typ
          '& th:nth-of-type(4)': { width: '28%' },  // Kategorie
          '& th:nth-of-type(5)': { width: '10%' },  // Saldo
          '& th:nth-of-type(6)': { width: '10%' },  // Aktionen
          '& td, & th': {
            px: 1.5,
            py: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }}
      >

        <TableHead>
          <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
            <TableCell>Kontonummer</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Typ</TableCell>
            <TableCell>Kategorie</TableCell>
            <TableCell align="right">Saldo (€)</TableCell>
            <TableCell align="center">Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map(acc => (
            <TableRow key={acc.id}>
              <TableCell>{acc.kontonummer}</TableCell>
              <TableCell
                title={acc.name}
                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}
              >
                {acc.name}
              </TableCell>
              <TableCell>{acc.konto_typ}</TableCell>
              <TableCell
                title={acc.category}
                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 250 }}
              >
                {acc.category}
              </TableCell>
              <TableCell align="right">{parseFloat(acc.saldo).toFixed(2)}</TableCell>
              <TableCell align="center">
                <IconButton size="small" onClick={() => navigate(`/buchhaltung/konten/${acc.id}/edit`)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => alert('Löschen kommt gleich')}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }  

  return (
    <Box p={3}>
      {/* Titel & Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#000' }}>
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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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

      {/* Tabelle */}
      <Card elevation={1}>
        <CardContent>
          <TableContainer component={Paper}>
            {grouping === 'CATEGORY'
              ? Object.entries(groupedByCategory).map(([cat, group]) => (
                <Box key={cat} sx={{ mb: 3 }}>
                  <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'bold',
                    mb: 1,
                    pl: 1.5,
                    pt: 1,
                    pb: 0.5,
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  {cat}
                </Typography>

                  {renderTable(group)}
                </Box>
              ))
              : renderTable(filteredAccounts)}
          </TableContainer>
          {grouping === 'ALL' && (
            <TablePagination
                component="div"
                count={filteredAccounts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[15, 20, 25, 50]}
                labelRowsPerPage="Einträge pro Seite"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
            />
            )}
        </CardContent>
      </Card>
    </Box>
  )
}
