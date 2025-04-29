// frontend/src/apps/members/components/MemberEdit.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, CircularProgress, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Divider, MenuItem, Chip, FormControlLabel, Switch,
  InputAdornment
} from '@mui/material'
import EighteenUpRatingIcon from '@mui/icons-material/EighteenUpRating';
import TwentyOneUpIcon from '@mui/icons-material/NoAdultContent';
import WorkIcon from '@mui/icons-material/Work';
import api from '../../../utils/api'

export default function MemberEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mojoOpen, setMojoOpen] = useState(false)

  const today = new Date()
  const minBirthdate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const minBirthdateISO = minBirthdate.toISOString().split('T')[0]

  // Status-Optionen für Dropdown
  const statusOptions = [
    { value: 'active', label: 'Aktiv' },
    { value: 'locked', label: 'Gesperrt' },
    { value: 'reminder1', label: '1. Mahnung' },
    { value: 'reminder2', label: '2. Mahnung' },
  ]
  
  // Anrede-Optionen für Dropdown
  const genderOptions = [
    { value: 'male', label: 'Herr' },
    { value: 'female', label: 'Frau' },
    { value: 'diverse', label: 'Divers' },
  ]

  // Berechnet Alter basierend auf Geburtsdatum
  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Bestimmt die Altersklasse basierend auf dem Alter
  const getAgeClass = (birthdate) => {
    const age = calculateAge(birthdate);
    if (!age) return '21+';
    
    if (age < 21) return '18+';
    return '21+';
  };

  // Formatierung des Datums im deutschen Format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('.').join('.');
  };

  useEffect(() => {
    api.get(`/members/${id}/`).then(res => {
      setMember({
        ...res.data,
        // Setze Standardwerte für neue Felder falls sie nicht vorhanden sind
        working_hours_per_month: res.data.working_hours_per_month || 0,
        max_working_hours: res.data.max_working_hours || 40,
        hourly_wage: res.data.hourly_wage || 12.00
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setMember((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'birthdate') {
      setMember((prev) => ({ ...prev, birthdate: value }))
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const inputDate = new Date(value)
        if (!isNaN(inputDate.getTime()) && inputDate > minBirthdate) {
          setMember((prev) => ({ ...prev, birthdate: minBirthdateISO }))
          setMojoOpen(true)
        }
      }
    } else {
      setMember((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    api.put(`/members/${id}/`, member)
      .then(() => navigate('/mitglieder'))
      .catch(err => {
        console.error(err)
        alert('Fehler beim Speichern. Bitte überprüfen Sie die Eingaben.')
      })
  }

  if (loading || !member) return <CircularProgress />
  
  const ageClass = getAgeClass(member.birthdate);
  const age = calculateAge(member.birthdate);

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: 'auto', mt: 4, backgroundColor: '#fafafa', boxShadow: 3 }}>
      {/* Header mit Titel und Altersklassen-Information */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="h4">Mitglied bearbeiten</Typography>
        
        {/* Altersklassen-Information rechts ausgerichtet */}
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Altersklasse (basierend auf Geburtsdatum):
          </Typography>
          <Chip
            icon={ageClass === '18+' ? <EighteenUpRatingIcon /> : <TwentyOneUpIcon />}
            label={`${ageClass} ${ageClass === '18+' ? '(max. 10% THC)' : '(keine THC-Beschränkung)'}`}
            color={ageClass === '18+' ? 'warning' : 'success'}
            sx={{ fontWeight: 'medium' }}
          />
          {age && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Alter: {age} Jahre
          </Typography>}
        </Box>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>🧍 Persönliche Daten</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              select
              fullWidth
              label="Anrede"
              name="gender"
              value={member.gender || 'male'}
              onChange={handleChange}
            >
              {genderOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4}><TextField fullWidth label="Vorname" name="first_name" value={member.first_name || ''} onChange={handleChange} /></Grid>
          <Grid item xs={5}><TextField fullWidth label="Nachname" name="last_name" value={member.last_name || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={member.status || 'active'}
              onChange={handleChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Geburtsdatum"
              type="date"
              name="birthdate"
              value={member.birthdate || minBirthdateISO}
              onChange={handleChange}
              inputProps={{ max: minBirthdateISO }}
              InputLabelProps={{ shrink: true }}
              helperText="Mindestalter: 18 Jahre (§ 3 Abs. 1 KCanG) - Bestimmt automatisch die Altersklasse"
            />
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>💼 Beschäftigungsinformationen</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={member.is_marginally_employed || false}
                  onChange={handleChange}
                  name="is_marginally_employed"
                  color="primary"
                />
              }
              label="Geringfügig beschäftigt"
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Arbeitsstunden pro Monat"
              type="number"
              name="working_hours_per_month"
              value={member.working_hours_per_month || 0}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 0, max: 80 },
                endAdornment: <InputAdornment position="end">Std</InputAdornment>
              }}
              disabled={!member.is_marginally_employed}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Maximale Stunden"
              type="number"
              name="max_working_hours"
              value={member.max_working_hours || 40}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 0, max: 80 },
                endAdornment: <InputAdornment position="end">Std</InputAdornment>
              }}
              disabled={!member.is_marginally_employed}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Stundenlohn"
              type="number"
              name="hourly_wage"
              value={member.hourly_wage || 12.00}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 0, step: 0.01 },
                endAdornment: <InputAdornment position="end">€</InputAdornment>
              }}
              disabled={!member.is_marginally_employed}
            />
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Geleistete Pflichtstunden: <span style={{ 
                  fontWeight: 'bold',
                  color: parseInt(member.duty_hours) >= 12 ? '#4caf50' : '#ff9800'
                }}>
                  {member.duty_hours || 0} / 12 Stunden
                </span>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Die Pflichtstunden werden automatisch durch die Aufgabenverwaltung im Backend aktualisiert.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>🏠 Kontaktdaten</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="E-Mail" name="email" value={member.email || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Telefonnummer" name="phone" value={member.phone || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}>
            <Grid container spacing={2}>
              <Grid item xs={9}><TextField fullWidth label="Straße" name="street" value={member.street || ''} onChange={handleChange} /></Grid>
              <Grid item xs={3}><TextField fullWidth label="Nr." name="house_number" value={member.house_number || ''} onChange={handleChange} /></Grid>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField fullWidth label="PLZ" name="zip_code" value={member.zip_code || ''} onChange={handleChange} /></Grid>
              <Grid item xs={8}><TextField fullWidth label="Stadt" name="city" value={member.city || ''} onChange={handleChange} /></Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>💳 Finanzielle Information</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Kontostand: <span style={{ 
                  fontWeight: 'bold', 
                  color: parseFloat(member.kontostand) < 0 ? '#f44336' : '#4caf50' 
                }}>
                  {parseFloat(member.kontostand || 0).toFixed(2)} €
                </span>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Der Kontostand wird ausschließlich über die Buchhaltung verwaltet.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Monatsbeitrag: <span style={{ 
                  fontWeight: 'bold',
                  color: '#1976d2'
                }}>
                  {parseFloat(member.beitrag || 0).toFixed(2)} €
                </span>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Der Beitrag wird ausschließlich über die Buchhaltung verwaltet.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>🧑‍⚕️ Gesundheit</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Körperliche Einschränkungen" name="physical_limitations" value={member.physical_limitations || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Geistige Einschränkungen" name="mental_limitations" value={member.mental_limitations || ''} onChange={handleChange} /></Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>📝 Intern</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Bemerkungen" name="notes" value={member.notes || ''} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth multiline minRows={2} label="Verwarnungen" name="warnings" value={member.warnings || ''} onChange={handleChange} /></Grid>
        </Grid>
      </Box>

      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave}>Speichern</Button>
        <Button onClick={() => navigate('/mitglieder')} sx={{ ml: 2 }}>Abbrechen</Button>
      </Box>

      <Dialog open={mojoOpen} onClose={() => setMojoOpen(false)} PaperProps={{ sx: { p: 2, backdropFilter: 'blur(4px)', borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Altersprüfung nicht bestanden</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Laut § 3 Absatz 1 des Konsumcannabisgesetzes (KCanG) ist eine Mitgliedschaft ausschließlich volljährigen Personen ab 18 Jahren gestattet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Das eingegebene Geburtsdatum wurde automatisch auf das Mindestalter korrigiert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMojoOpen(false)} variant="contained">Verstanden</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}