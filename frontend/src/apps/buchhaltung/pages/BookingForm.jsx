import { useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, MenuItem, Button, IconButton, Grid, Paper, Autocomplete
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import axios from '../../../utils/api'

export default function BookingForm() {
  const navigate = useNavigate()
  const [bookingType, setBookingType] = useState('EINZEL')
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [verwendungszweck, setVerwendungszweck] = useState('')
  const [mitglied, setMitglied] = useState(null)
  const [mitgliedSearch, setMitgliedSearch] = useState('')
  const [mitgliedOptions, setMitgliedOptions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [sub, setSub] = useState([
    { betrag: '', soll_konto: '', haben_konto: '', verwendungszweck: '' }
  ])
  const [loading, setLoading] = useState(false)

  const formStyles = {
    inputField: {
      width: '100%',
      '& .MuiInputBase-root': {
        width: '100%'
      }
    },
    selectField: {
      width: '200px', // Feste Breite für Select-Felder
      '& .MuiSelect-select': {
        width: '200px', // Feste Breite für den Select-Inhalt
        paddingRight: '32px'
      }
    },
    subTransactionBox: {
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
      border: '1px solid #e0e0e0'
    },
    buttonAdd: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      '&:hover': {
        backgroundColor: '#c8e6c9'
      }
    },
    buttonSave: {
      padding: '10px 24px',
      fontWeight: 'bold',
      fontSize: '1rem'
    }
  }

  useEffect(() => {
    axios.get('buchhaltung/accounts/').then(res => {
      const data = res.data?.results ?? res.data
      setAccounts(Array.isArray(data) ? data : [])
    })
  }, [])

  useEffect(() => {
    if (bookingType !== 'MITGLIEDSBEITRAG' || mitgliedSearch.length < 2) {
      setMitgliedOptions([])
      return
    }

    setLoading(true)
    const delayDebounce = setTimeout(() => {
      axios.get(`members/?search=${encodeURIComponent(mitgliedSearch)}&limit=10`)
        .then(res => {
          const data = res.data?.results ?? res.data
          setMitgliedOptions(Array.isArray(data) ? data : [])
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [mitgliedSearch, bookingType])

  const handleSubChange = (index, field, value) => {
    const updated = [...sub]
    updated[index][field] = value
    setSub(updated)
  }

  const addSub = () => {
    setSub([...sub, { betrag: '', soll_konto: '', haben_konto: '', verwendungszweck: '' }])
  }

  const removeSub = (index) => {
    const updated = [...sub]
    updated.splice(index, 1)
    setSub(updated)
  }

  const handleSubmit = () => {
    if (bookingType === 'EINZEL' && !verwendungszweck.trim()) {
      alert('Bitte gib einen Verwendungszweck an.')
      return
    }

    const payload = {
      typ: bookingType,
      datum: datum + "T00:00:00",
      verwendungszweck,
      mitglied: bookingType === 'MITGLIEDSBEITRAG' ? mitglied : null,
      subtransactions: bookingType === 'MEHRFACH' ? sub.map((tx, idx) => ({
        betrag: tx.betrag,
        soll_konto_id: tx.soll_konto,
        haben_konto_id: tx.haben_konto,
        verwendungszweck: tx.verwendungszweck || `${verwendungszweck} (M${idx + 1})`
      })) : [{
        betrag: sub[0].betrag,
        soll_konto_id: sub[0].soll_konto,
        haben_konto_id: sub[0].haben_konto,
        verwendungszweck
      }]
    }

    axios.post('buchhaltung/bookings/', payload).then(() => {
      navigate('/buchhaltung/journal')
    }).catch(err => {
      console.error(err)
      alert('Fehler beim Speichern.')
    })
  }

  return (
    <Paper elevation={0} sx={{ p: 3, maxWidth: 1200, margin: '0 auto', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
        + Neue Buchung erfassen
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Buchungstyp"
            select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            fullWidth
            variant="outlined"
            sx={formStyles.selectField}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  style: { width: '300px' } // Feste Breite für das Dropdown-Menü
                }
              }
            }}
          >
            <MenuItem value="EINZEL">Einzelbuchung</MenuItem>
            <MenuItem value="MEHRFACH">Mehrfachbuchung</MenuItem>
            <MenuItem value="MITGLIEDSBEITRAG">Mitgliedsbeitrag</MenuItem>
          </TextField>
        </Grid>

        {bookingType === 'MITGLIEDSBEITRAG' && (
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={mitgliedOptions}
              getOptionLabel={(m) => `${m.first_name} ${m.last_name}`}
              onInputChange={(e, val) => setMitgliedSearch(val)}
              onChange={(e, val) => setMitglied(val ? val.id : null)}
              filterOptions={(x) => x}
              loading={loading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={mitgliedSearch.length < 2 ? "Min. 2 Zeichen eingeben" : "Keine Treffer"}
              renderInput={(params) => (
                <TextField {...params} label="Mitglied suchen" fullWidth variant="outlined" sx={formStyles.inputField} />
              )}
              popupIcon={null}
              sx={{ width: '100%' }}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            fullWidth
            variant="outlined"
            sx={formStyles.inputField}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={bookingType === 'MITGLIEDSBEITRAG' ? 3 : 6}>
          <TextField
            label="Verwendungszweck"
            value={verwendungszweck}
            onChange={(e) => setVerwendungszweck(e.target.value)}
            fullWidth
            variant="outlined"
            sx={formStyles.inputField}
            required={bookingType === 'EINZEL'}
          />
        </Grid>
      </Grid>

      {(bookingType === 'EINZEL' || bookingType === 'MITGLIEDSBEITRAG') && (
        <Paper elevation={0} sx={formStyles.subTransactionBox}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Betrag"
                value={sub[0].betrag}
                onChange={(e) => handleSubChange(0, 'betrag', e.target.value)}
                fullWidth
                variant="outlined"
                sx={formStyles.inputField}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Soll-Konto"
                select
                value={sub[0].soll_konto || ''}
                onChange={(e) => handleSubChange(0, 'soll_konto', e.target.value)}
                fullWidth
                variant="outlined"
                sx={formStyles.selectField}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { minWidth: '200px' }
                    }
                  }
                }}
              >
                <MenuItem value="" disabled>– Sollkonto wählen –</MenuItem>
                {accounts.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.kontonummer} · {a.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Haben-Konto"
                select
                value={sub[0].haben_konto || ''}
                onChange={(e) => handleSubChange(0, 'haben_konto', e.target.value)}
                fullWidth
                variant="outlined"
                sx={formStyles.selectField}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { minWidth: '200px' }
                    }
                  }
                }}
              >
                <MenuItem value="" disabled>– Habenkonto wählen –</MenuItem>
                {accounts.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.kontonummer} · {a.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}
      {bookingType === 'MEHRFACH' && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
            Buchungszeilen
          </Typography>

          {sub.map((s, i) => (
            <Paper elevation={0} key={i} sx={formStyles.subTransactionBox}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Betrag"
                    value={s.betrag}
                    onChange={(e) => handleSubChange(i, 'betrag', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={formStyles.inputField}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Soll-Konto"
                    select
                    value={s.soll_konto}
                    onChange={(e) => handleSubChange(i, 'soll_konto', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={formStyles.selectField}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          style: { minWidth: '200px' } // Mindestbreite für das Dropdown-Menü
                        }
                      }
                    }}
                  >
                    <MenuItem disabled value="">– Sollkonto wählen –</MenuItem>
                    {accounts.map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.kontonummer} · {a.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Haben-Konto"
                    select
                    value={s.haben_konto}
                    onChange={(e) => handleSubChange(i, 'haben_konto', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={formStyles.selectField}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          style: { minWidth: '200px' } // Mindestbreite für das Dropdown-Menü
                        }
                      }
                    }}
                  >
                    <MenuItem disabled value="">– Habenkonto wählen –</MenuItem>
                    {accounts.map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.kontonummer} · {a.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex' }}>
                    <TextField
                      label="Zweck (optional)"
                      value={s.verwendungszweck}
                      onChange={(e) => handleSubChange(i, 'verwendungszweck', e.target.value)}
                      fullWidth
                      variant="outlined"
                      sx={formStyles.inputField}
                    />
                    <IconButton
                      onClick={() => removeSub(i)}
                      color="error"
                      sx={{ ml: 1, alignSelf: 'center' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Box sx={{ mt: 2, mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addSub}
              sx={formStyles.buttonAdd}
            >
              Weitere Zeile
            </Button>
          </Box>
        </>
      )}

      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        sx={formStyles.buttonSave}
      >
        ✅ Buchung speichern
      </Button>
    </Paper>
  )
}