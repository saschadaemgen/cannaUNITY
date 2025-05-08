import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Grid
} from '@mui/material'
import axios from '@/utils/api'

export default function BalanceSheet() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    loadData()
  }, [balanceDate])

  const loadData = () => {
    setLoading(true)
    setError(null)
    
    axios.get(`/buchhaltung/bilanz/?balance_date=${balanceDate}`)
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden der Bilanz:', err)
        setError('Die Bilanzdaten konnten nicht geladen werden.')
        setLoading(false)
      })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE')
  }

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2).replace('.', ',') + ' €'
  }

  const renderAccountCategory = (category, accounts) => {
    if (!accounts || accounts.length === 0) return null
    
    // Konten nach Kategorie gruppieren
    const categories = {}
    accounts.forEach(account => {
      if (!categories[account.category]) {
        categories[account.category] = []
      }
      categories[account.category].push(account)
    })
    
    return (
      <>
        {Object.entries(categories).map(([cat, accList]) => {
          const categoryTotal = accList.reduce((sum, acc) => sum + acc.balance, 0)
          
          return (
            <Box key={cat} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {cat}
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Konto</TableCell>
                      <TableCell>Bezeichnung</TableCell>
                      <TableCell align="right">Betrag</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accList.map(account => (
                      <TableRow key={account.number}>
                        <TableCell>{account.number}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell align="right">{formatAmount(account.balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                        Summe {cat}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatAmount(categoryTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )
        })}
      </>
    )
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Bilanzdaten...</Typography>
  }

  if (error) {
    return <Typography sx={{ p: 3, color: 'error.main' }}>{error}</Typography>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        📊 Bilanz
      </Typography>
      
      {/* Datum-Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Bilanzstichtag"
          type="date"
          value={balanceDate}
          onChange={(e) => setBalanceDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      
      {data && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            {/* Überschrift mit Stichtag */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              Bilanz zum {formatDate(data.balance_date)}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              {/* AKTIVA */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  AKTIVA
                </Typography>
                
                {data.assets.length === 0 ? (
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    Keine Aktivkonten mit Bestand
                  </Typography>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    {renderAccountCategory('Aktiva', data.assets)}
                  </Box>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  py: 1, 
                  mt: 2,
                  borderTop: '1px solid #2e7d32', 
                  borderBottom: '1px solid #2e7d32'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Summe Aktiva
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {formatAmount(data.summary.total_assets)}
                  </Typography>
                </Box>
              </Grid>
              
              {/* PASSIVA */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  PASSIVA
                </Typography>
                
                {data.liabilities.length === 0 ? (
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    Keine Passivkonten mit Bestand
                  </Typography>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    {renderAccountCategory('Passiva', data.liabilities)}
                  </Box>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  py: 1, 
                  mt: 2,
                  borderTop: '1px solid #2e7d32', 
                  borderBottom: '1px solid #2e7d32'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Summe Passiva
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {formatAmount(data.summary.total_liabilities)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Bilanzgleichheit prüfen */}
            {!data.summary.is_balanced && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1 }}>
                <Typography variant="body2" color="error">
                  Achtung: Die Bilanz ist nicht ausgeglichen! 
                  Differenz: {formatAmount(data.summary.total_assets - data.summary.total_liabilities)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}