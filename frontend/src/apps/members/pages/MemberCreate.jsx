// frontend/src/apps/members/components/MemberCreate.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  InputAdornment
} from '@mui/material'
import EighteenUpRatingIcon from '@mui/icons-material/EighteenUpRating';
import TwentyOneUpIcon from '@mui/icons-material/NoAdultContent';
import api from '@/utils/api'

export default function MemberCreate() {
  const navigate = useNavigate()

  // Heute - 18 Jahre
  const today = new Date()
  const minBirthdate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
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

  const [member, setMember] = useState({
    gender: 'male',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthdate: minBirthdateISO,
    zip_code: '',
    city: '',
    street: '',
    house_number: '',
    status: 'active',
    is_marginally_employed: false,
    working_hours_per_month: 0,
    max_working_hours: 40,
    hourly_wage: 12.00,
    duty_hours: 0,
    physical_limitations: '',
    mental_limitations: '',
    notes: '',
    warnings: ''
  })
  const [loading, setLoading] = useState(false)

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setMember({ ...member, [name]: checked });
    } else {
      setMember({ ...member, [name]: value });
    }
  }

  const handleSave = () => {
    setLoading(true)
    api.post('/members/', member)
      .then(() => navigate('/mitglieder'))
      .catch((err) => {
        console.error('Fehler beim Speichern:', err)
        alert('Fehler beim Speichern. Bitte prüfen Sie die Eingaben.')
      })
      .finally(() => setLoading(false))
  }

  if (loading) return <CircularProgress />
  
  const ageClass = getAgeClass(member.birthdate);
  const age = calculateAge(member.birthdate);

  return (
    <Box>
      {/* Header mit Titel und Altersklassen-Information */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="h4">Neues Mitglied anlegen</Typography>
        
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
              value={member.gender}
              onChange={handleChange}
            >
              {genderOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Vorname" name="first_name" value={member.first_name} onChange={handleChange} />
          </Grid>
          <Grid item xs={5}>
            <TextField fullWidth label="Nachname" name="last_name" value={member.last_name} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={member.status}
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
              value={member.birthdate}
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
                  checked={member.is_marginally_employed}
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
              value={member.working_hours_per_month}
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
              value={member.max_working_hours}
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
              value={member.hourly_wage}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 0, step: 0.01 },
                endAdornment: <InputAdornment position="end">€</InputAdornment>
              }}
              disabled={!member.is_marginally_employed}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>🏠 Kontaktdaten</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField fullWidth label="E-Mail" name="email" value={member.email} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Telefonnummer" name="phone" value={member.phone} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <Grid container spacing={2}>
              <Grid item xs={9}>
                <TextField fullWidth label="Straße" name="street" value={member.street} onChange={handleChange} />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth label="Nr." name="house_number" value={member.house_number} onChange={handleChange} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField fullWidth label="PLZ" name="zip_code" value={member.zip_code} onChange={handleChange} />
              </Grid>
              <Grid item xs={8}>
                <TextField fullWidth label="Stadt" name="city" value={member.city} onChange={handleChange} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>🧑‍⚕️ Gesundheit</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              multiline 
              minRows={2} 
              label="Körperliche Einschränkungen" 
              name="physical_limitations" 
              value={member.physical_limitations} 
              onChange={handleChange} 
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              multiline 
              minRows={2} 
              label="Geistige Einschränkungen" 
              name="mental_limitations" 
              value={member.mental_limitations} 
              onChange={handleChange} 
            />
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>📝 Intern</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              multiline 
              minRows={2} 
              label="Bemerkungen" 
              name="notes" 
              value={member.notes} 
              onChange={handleChange} 
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              multiline 
              minRows={2} 
              label="Verwarnungen" 
              name="warnings" 
              value={member.warnings} 
              onChange={handleChange} 
            />
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Speichern
        </Button>
        <Button onClick={() => navigate('/mitglieder')} sx={{ ml: 2 }}>
          Abbrechen
        </Button>
      </Box>
    </Box>
  )
}