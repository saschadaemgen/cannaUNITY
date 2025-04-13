import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel
} from '@mui/material'
import { useState, useMemo } from 'react'
import { parseDate } from '../../../utils/date'

function filterAndSort(events, filters, orderBy, order) {
  let filtered = [...events]

  // 🔍 Suche
  if (filters.search) {
    const lower = filters.search.toLowerCase()
    filtered = filtered.filter(
      e => e.actor.toLowerCase().includes(lower) ||
           e.door.toLowerCase().includes(lower)
    )
  }

  // ⏳ Zeitraum
  const now = new Date()
  if (filters.timeframe !== 'all') {
    filtered = filtered.filter(e => {
      const [d, m, y] = e.timestamp.split(' ')[0].split('.')
      const t = e.timestamp.split(' ')[1]
      const date = new Date(`${y}-${m}-${d}T${t}`)
      if (filters.timeframe === 'today') {
        return date.toDateString() === now.toDateString()
      }
      if (filters.timeframe === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo
      }
      if (filters.timeframe === 'month') {
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  // 🧬 Authentifizierung
  if (filters.authMethod !== 'all') {
    filtered = filtered.filter(e => e.authentication === filters.authMethod)
  }

  // 📊 Sortierung
  filtered.sort((a, b) => {
    if (!a[orderBy] || !b[orderBy]) return 0
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1
    return 0
  })

  return filtered
}

export default function EventTable({ events, filters }) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState('timestamp')
  const [order, setOrder] = useState('desc')

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleChangePage = (_, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const sortedEvents = useMemo(() =>
    filterAndSort(events, filters, orderBy, order), [events, filters, orderBy, order]
  )

  const paginatedEvents = useMemo(() =>
    sortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedEvents, page, rowsPerPage]
  )

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'actor'}
                  direction={orderBy === 'actor' ? order : 'asc'}
                  onClick={() => handleSort('actor')}
                >
                  Benutzer
                </TableSortLabel>
              </TableCell>
              <TableCell>Tür</TableCell>
              <TableCell>Authentifizierung</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timestamp'}
                  direction={orderBy === 'timestamp' ? order : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Zeit
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.id}</TableCell>
                <TableCell>{e.actor}</TableCell>
                <TableCell>{e.door}</TableCell>
                <TableCell>{e.authentication}</TableCell>
                <TableCell>{parseDate(e.timestamp)}</TableCell>
              </TableRow>
            ))}
            {sortedEvents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Keine Einträge gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedEvents.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 50]}
        labelRowsPerPage="Einträge pro Seite"
      />
    </Paper>
  )
}
