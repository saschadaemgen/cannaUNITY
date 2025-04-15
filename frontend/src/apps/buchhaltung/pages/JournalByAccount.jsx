import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Table,
  TableHead, TableRow, TableCell, TableBody
} from '@mui/material'
import axios from '../../../utils/api'

export default function JournalByAccount() {
  const [transactions, setTransactions] = useState({})

  useEffect(() => {
    axios.get('/buchhaltung/journal/').then(res => {
      const raw = res.data?.results ?? res.data
      const map = {}

      raw.forEach(entry => {
        entry.subtransactions.forEach(tx => {
          const soll = tx.soll_konto
          const haben = tx.haben_konto

          if (!map[soll]) map[soll] = { name: soll, soll: [], haben: [] }
          if (!map[haben]) map[haben] = { name: haben, soll: [], haben: [] }

          map[soll].soll.push({ ...tx, booking: entry })
          map[haben].haben.push({ ...tx, booking: entry })
        })
      })

      setTransactions(map)
    })
  }, [])

  const renderAccountTable = (account) => {
    const sollSumme = account.soll.reduce((sum, t) => sum + parseFloat(t.betrag), 0)
    const habenSumme = account.haben.reduce((sum, t) => sum + parseFloat(t.betrag), 0)

    return (
      <Box key={account.name} mb={4}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          💠 Konto {account.name}
        </Typography>
        <Card elevation={1}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>SOLL</strong></TableCell>
                  <TableCell><strong>HABEN</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: Math.max(account.soll.length, account.haben.length) }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {account.soll[idx]
                        ? `${account.soll[idx].betrag} € · ${account.soll[idx].booking.verwendungszweck}`
                        : ''}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {account.haben[idx]
                        ? `${account.haben[idx].betrag} € · ${account.haben[idx].booking.verwendungszweck}`
                        : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                    Summe: {sollSumme.toFixed(2)} €
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                    Summe: {habenSumme.toFixed(2)} €
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        🧾 Journal nach Konto (T-Konten Darstellung)
      </Typography>

      {Object.values(transactions)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(renderAccountTable)}
    </Box>
  )
}
