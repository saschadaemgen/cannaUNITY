import React, { useEffect, useState } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import axios from '@/utils/api'
import { useNavigate, useParams } from 'react-router-dom'

const kontoTypen = [
  { value: 'AKTIV', label: 'Aktivkonto' },
  { value: 'PASSIV', label: 'Passivkonto' },
  { value: 'ERTRAG', label: 'Ertragskonto' },
  { value: 'AUFWAND', label: 'Aufwandskonto' },
]

// Kategorien strikt nach Kontotyp
const getCategoriesForType = (kontoTyp) => {
  switch (kontoTyp) {
    case 'AKTIV':
      return [
        { value: '2. Finanzkonten (Kasse, Bank, Online-Zahlung)', label: '2. Finanzkonten (Kasse, Bank, Online-Zahlung)' },
        { value: '17. Steuerkonten (Vorsteuer & Umsatzsteuer)', label: '17. Steuerkonten (Vorsteuer & Umsatzsteuer)' }
      ]
    case 'PASSIV':
      return [
        { value: '3. Verbindlichkeiten & Rückzahlungen', label: '3. Verbindlichkeiten & Rückzahlungen' },
        { value: '17. Steuerkonten (Vorsteuer & Umsatzsteuer)', label: '17. Steuerkonten (Vorsteuer & Umsatzsteuer)' }
      ]
    case 'ERTRAG':
      return [
        { value: '1. Erträge (Einnahmen)', label: '1. Erträge (Einnahmen)' }
      ]
    case 'AUFWAND':
      return [
        { value: '4. Material- & Warenaufwand', label: '4. Material- & Warenaufwand' },
        { value: '5. Betriebskosten (Fixkosten & Nebenkosten)', label: '5. Betriebskosten (Fixkosten & Nebenkosten)' },
        { value: '6. Technische Anlagen & Maschinen', label: '6. Technische Anlagen & Maschinen' },
        { value: '7. Sicherheit & Überwachung', label: '7. Sicherheit & Überwachung' },
        { value: '8.1. Löhne & Gehälter', label: '8.1. Löhne & Gehälter' },
        { value: '8.2. Verwaltung & Sonstiges', label: '8.2. Verwaltung & Sonstiges' },
        { value: '9. Finanzierungskosten & Rücklagen', label: '9. Finanzierungskosten & Rücklagen' },
        { value: '10. Forschung & Entwicklung', label: '10. Forschung & Entwicklung' },
        { value: '11. Bewirtung, Schulungen & Veranstaltungen', label: '11. Bewirtung, Schulungen & Veranstaltungen' },
        { value: '12. Hausmeister- & Betriebsmittelkosten', label: '12. Hausmeister- & Betriebsmittelkosten' },
        { value: '13. Externe Dienstleistungen & Mieten', label: '13. Externe Dienstleistungen & Mieten' },
        { value: '14. IT & Informationsmaterial', label: '14. IT & Informationsmaterial' },
        { value: '15. Fahrzeugkosten & Leasing', label: '15. Fahrzeugkosten & Leasing' },
        { value: '16. Gebäude & Infrastruktur', label: '16. Gebäude & Infrastruktur' }
      ]
    default:
      return []
  }
}

const AccountForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    kontonummer: '',
    name: '',
    konto_typ: 'AKTIV',
    saldo: 0,
    category: ''
  })

  const [loading, setLoading] = useState(false)
  const [availableCategories, setAvailableCategories] = useState([])

  // Laden bei Bearbeitung
  useEffect(() => {
    if (isEdit) {
      axios.get(`/buchhaltung/accounts/${id}/`)
        .then(res => setFormData(res.data))
        .catch(err => console.error('Fehler beim Laden des Kontos:', err))
    }
  }, [id, isEdit])

  // Aktualisiere verfügbare Kategorien wenn sich der Kontotyp ändert
  useEffect(() => {
    const categories = getCategoriesForType(formData.konto_typ)
    setAvailableCategories(categories)
    
    // Wenn die aktuelle Kategorie nicht mehr verfügbar ist, zurücksetzen
    const currentCategoryStillValid = categories.some(cat => cat.value === formData.category)
    if (!currentCategoryStillValid) {
      // Automatisch erste Kategorie wählen
      setFormData(prev => ({ 
        ...prev, 
        category: categories.length > 0 ? categories[0].value : '' 
      }))
    }
  }, [formData.konto_typ])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    const method = isEdit ? 'put' : 'post'
    const url = isEdit ? `/buchhaltung/accounts/${id}/` : '/buchhaltung/accounts/'

    axios[method](url, formData)
      .then(() => navigate('/buchhaltung/konten'))
      .catch(err => {
        console.error('Fehler beim Speichern:', err)
        setLoading(false)
      })
  }

  return (
    <Box p={3}>
      {/* Header mit Titel und Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#009245', fontWeight: 'bold' }}>
          {isEdit ? '✏️ Konto bearbeiten' : '➕ Neues Konto anlegen'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={loading || !formData.kontonummer || !formData.name || !formData.category}
          >
            {isEdit ? 'SPEICHERN' : 'ANLEGEN'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/buchhaltung/konten')}
          >
            ABBRECHEN
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Kontonummer"
                  name="kontonummer"
                  value={formData.kontonummer}
                  onChange={(e) => {
                    // Nur Zahlen erlauben
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData(prev => ({ ...prev, kontonummer: value }))
                  }}
                  fullWidth
                  required
                  helperText="z.B. 1000 für Hauptkasse"
                  inputProps={{ 
                    pattern: "[0-9]*",
                    inputMode: "numeric"
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="Kontoname"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="z.B. Hauptkasse, Bankkonto, etc."
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  label="Kontotyp"
                  name="konto_typ"
                  select
                  value={formData.konto_typ}
                  onChange={handleChange}
                  fullWidth
                  helperText="Wählen Sie den passenden Kontotyp"
                >
                  {kontoTypen.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  label="Saldo (€)"
                  name="saldo"
                  type="number"
                  value={formData.saldo}
                  onChange={handleChange}
                  fullWidth
                  helperText="Anfangssaldo des Kontos"
                  inputProps={{ step: "0.01" }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Kategorie"
                  name="category"
                  select
                  value={formData.category || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText={`Nur passende Kategorien für ${formData.konto_typ}`}
                >
                  {availableCategories.length === 0 ? (
                    <MenuItem value="" disabled>
                      Wählen Sie zuerst einen Kontotyp
                    </MenuItem>
                  ) : (
                    availableCategories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AccountForm