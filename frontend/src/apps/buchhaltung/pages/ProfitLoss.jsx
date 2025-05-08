import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import axios from '@/utils/api'

export default function ProfitLoss() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [expandedCategories, setExpandedCategories] = useState([])

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const loadData = () => {
    setLoading(true)
    setError(null)
    
    axios.get(`/buchhaltung/guv/?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fehler beim Laden der GuV:', err)
        setError('Die Daten konnten nicht geladen werden.')
        setLoading(false)
      })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE')
  }

  const handleToggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const renderCategoryGroup = (category, isExpense = false) => {
    const isExpanded = expandedCategories.includes(category.name)
    
    return (
      <Accordion 
        key={category.name}
        expanded={isExpanded}
        onChange={() => handleToggleCategory(category.name)}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 'medium' }}>
              {category.name}
            </Typography>
            <Typography sx={{ 
              fontWeight: 'bold',
              color: isExpense ? 'error.main' : 'success.main'
            }}>
              {parseFloat(category.total).toFixed(2)} €
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Konto</TableCell>
                <TableCell>Bezeichnung</TableCell>
                <TableCell align="right">Betrag (€)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {category.accounts.map(account => (
                <TableRow key={account.id}>
                  <TableCell>{account.number}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'medium',
                    color: isExpense ? 'error.main' : 'success.main'
                  }}>
                    {parseFloat(account.balance).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    )
  }

  if (loading) {
    return <Typography sx={{ p: 3 }}>Lade GuV-Daten...</Typography>
  }

  if (error) {
    return <Typography sx={{ p: 3, color: 'error.main' }}>{error}</Typography>
  }

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        💰 Gewinn- und Verlustrechnung
      </Typography>
      
      {/* Zeitraum-Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
      </Box>
      
      {data && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            {/* Überschrift mit Zeitraum */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              Gewinn- und Verlustrechnung
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', color: 'text.secondary' }}>
              für den Zeitraum vom {formatDate(data.period.start)} bis {formatDate(data.period.end)}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Erträge */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: 'success.main' }}>
              Erträge
            </Typography>
            
            {data.income.length === 0 ? (
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                Keine Erträge im gewählten Zeitraum
              </Typography>
            ) : (
              <Box sx={{ mb: 3 }}>
                {data.income.map(category => renderCategoryGroup(category))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Summe Erträge
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {parseFloat(data.summary.total_income).toFixed(2)} €
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Aufwendungen */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: 'error.main' }}>
              Aufwendungen
            </Typography>
            
            {data.expenses.length === 0 ? (
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                Keine Aufwendungen im gewählten Zeitraum
              </Typography>
            ) : (
              <Box sx={{ mb: 3 }}>
                {data.expenses.map(category => renderCategoryGroup(category, true))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Summe Aufwendungen
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {parseFloat(data.summary.total_expenses).toFixed(2)} €
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
      
            {/* Gesamtergebnis - KORRIGIERT */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 2,
              backgroundColor: data.summary.profit < 0 ? 'rgba(211, 47, 47, 0.1)' : 'rgba(46, 125, 50, 0.1)',
              borderRadius: 1,
              px: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {data.summary.profit < 0 ? 'Jahresfehlbetrag' : 'Jahresüberschuss'}
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                color: data.summary.profit < 0 ? 'error.main' : 'success.main'
              }}>
                {Math.abs(parseFloat(data.summary.profit)).toFixed(2)} €
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}