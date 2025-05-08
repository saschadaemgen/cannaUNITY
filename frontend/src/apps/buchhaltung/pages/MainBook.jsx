import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import axios from '@/utils/api'

export default function MainBook() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryList, setCategoryList] = useState([])
  const [expandedAccounts, setExpandedAccounts] = useState([])

  // Beim ersten Laden und bei Filter-Änderungen
  useEffect(() => {
    loadMainBook()
  }, [startDate, endDate])

  const loadMainBook = () => {
    setLoading(true)
    
    axios.get(`/buchhaltung/mainbook/?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        const data = res.data
        setAccounts(data)
        
        // Kategorien für den Filter extrahieren
        const categories = Array.from(new Set(data.map(acc => acc.account.category).filter(Boolean)))
        setCategoryList(categories)
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden des Hauptbuchs:', err)
        setLoading(false)
      })
  }

  // Filtern der angezeigten Konten
  const filteredAccounts = accounts.filter(acc => {
    if (categoryFilter !== 'ALL' && acc.account.category !== categoryFilter) {
      return false
    }
    
    if (typeFilter !== 'ALL' && acc.account.type !== typeFilter) {
      return false
    }
    
    return true
  })

  // Summierung der Gesamtsalden nach Kontotyp
  const getTotalByType = (type) => {
    return filteredAccounts
      .filter(acc => acc.account.type === type)
      .reduce((sum, acc) => sum + parseFloat(acc.closing_balance), 0)
  }

  // Toggle für die Accordion-Komponenten
  const handleToggleAccount = (accountId) => {
    setExpandedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }
  
  // Formatierung der Beträge mit Vorzeichen und Farbe
  const formatAmount = (amount, isDebit = true) => {
    const value = parseFloat(amount)
    if (value === 0) return '-'
    
    return (
      <Typography 
        variant="body2" 
        sx={{ 
          color: value < 0 ? 'error.main' : 'inherit',
          fontWeight: value !== 0 ? 'medium' : 'normal'
        }}
      >
        {value.toFixed(2)} €
      </Typography>
    )
  }

  // Formatierung des Datums als deutsches Format
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE')
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade Hauptbuch...</Typography>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        📚 Hauptbuch
      </Typography>
      
      {/* Filter-Zeile */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Von"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          label="Bis"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        
        <TextField
          label="Kategorie"
          select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <MenuItem value="ALL">Alle Kategorien</MenuItem>
          {categoryList.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>
        
        <TextField
          label="Kontotyp"
          select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <MenuItem value="ALL">Alle Typen</MenuItem>
          <MenuItem value="AKTIV">Aktivkonto</MenuItem>
          <MenuItem value="PASSIV">Passivkonto</MenuItem>
          <MenuItem value="ERTRAG">Ertragskonto</MenuItem>
          <MenuItem value="AUFWAND">Aufwandskonto</MenuItem>
        </TextField>
      </Box>
      
      {/* Zusammenfassung der Salden */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Zusammenfassung der Salden 
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              ({formatDate(startDate)} - {formatDate(endDate)})
            </Typography>
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Aktiva gesamt</Typography>
              <Typography variant="h6">{getTotalByType('AKTIV').toFixed(2)} €</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Passiva gesamt</Typography>
              <Typography variant="h6">{getTotalByType('PASSIV').toFixed(2)} €</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Erträge gesamt</Typography>
              <Typography variant="h6">{getTotalByType('ERTRAG').toFixed(2)} €</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Aufwendungen gesamt</Typography>
              <Typography variant="h6">{getTotalByType('AUFWAND').toFixed(2)} €</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Gewinn/Verlust</Typography>
              <Typography variant="h6" sx={{ 
                color: getTotalByType('ERTRAG') - getTotalByType('AUFWAND') >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'bold'
              }}>
                {(getTotalByType('ERTRAG') - getTotalByType('AUFWAND')).toFixed(2)} €
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Liste der Konten mit Accordion */}
      {filteredAccounts.map(account => (
        <Accordion 
          key={account.account.id}
          expanded={expandedAccounts.includes(account.account.id)}
          onChange={() => handleToggleAccount(account.account.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <Typography sx={{ width: '15%', flexShrink: 0, fontWeight: 'medium' }}>
                {account.account.number}
              </Typography>
              
              <Typography sx={{ width: '35%' }}>
                {account.account.name}
              </Typography>
              
              <Typography sx={{ width: '20%', color: 'text.secondary' }}>
                {account.account.category || '—'}
              </Typography>
              
              <Typography 
                sx={{ 
                  width: '15%', 
                  fontWeight: 'bold',
                  color: parseFloat(account.closing_balance) < 0 ? 'error.main' : 'inherit'
                }}
              >
                {parseFloat(account.closing_balance).toFixed(2)} €
              </Typography>
              
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                {account.transactions.length} Buchungen
              </Typography>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Datum</TableCell>
                    <TableCell>Buchung</TableCell>
                    <TableCell>Beschreibung</TableCell>
                    <TableCell>Gegenkonto</TableCell>
                    <TableCell align="right">Soll</TableCell>
                    <TableCell align="right">Haben</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {/* Anfangsbestand */}
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Anfangsbestand am {formatDate(startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right">
                      {formatAmount(account.opening_balance)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Buchungen */}
                  {account.transactions.map((tx, idx) => {
                    // Laufendes Saldo berechnen
                    const prevTransactions = account.transactions.slice(0, idx)
                    const prevDebits = prevTransactions.reduce((sum, t) => sum + parseFloat(t.debit), 0)
                    const prevCredits = prevTransactions.reduce((sum, t) => sum + parseFloat(t.credit), 0)
                    
                    let runningBalance
                    if (account.account.type === 'AKTIV' || account.account.type === 'AUFWAND') {
                      runningBalance = parseFloat(account.opening_balance) + prevDebits - prevCredits + 
                                     parseFloat(tx.debit) - parseFloat(tx.credit)
                    } else {
                      runningBalance = parseFloat(account.opening_balance) + prevCredits - prevDebits + 
                                     parseFloat(tx.credit) - parseFloat(tx.debit)
                    }
                    
                    return (
                      <TableRow 
                        key={`${tx.booking_no}-${idx}`}
                        sx={{
                          // Formatierung für stornierte oder Storno-Buchungen
                          ...(tx.is_storniert && {
                            textDecoration: 'line-through', 
                            color: 'error.main',
                            backgroundColor: 'rgba(231, 76, 60, 0.05)'
                          }),
                          ...(tx.is_storno && {
                            fontStyle: 'italic',
                            backgroundColor: 'rgba(46, 125, 50, 0.05)'
                          })
                        }}
                      >
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>{tx.booking_no}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{tx.counter_account}</TableCell>
                        <TableCell align="right">{formatAmount(tx.debit)}</TableCell>
                        <TableCell align="right">{formatAmount(tx.credit)}</TableCell>
                        <TableCell align="right">{formatAmount(runningBalance)}</TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {/* Summenzeile */}
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Summen im Zeitraum
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {parseFloat(account.period_debits).toFixed(2)} €
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {parseFloat(account.period_credits).toFixed(2)} €
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  
                  {/* Endbestand */}
                  <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Endbestand am {formatDate(endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatAmount(account.closing_balance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
      
      {filteredAccounts.length === 0 && (
        <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          Keine Konten gefunden, die den Filterkriterien entsprechen.
        </Typography>
      )}
    </Box>
  )
}