// frontend/src/apps/trackandtrace/pages/Manufacturer/ManufacturerForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  TextField, 
  Button,
  Box,
  Typography,
  Paper
} from '@mui/material';

const FormSection = ({ title, children }) => (
  <Paper sx={{ 
    p: 3, 
    mb: 3, 
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  }}>
    <Typography 
      variant="h6" 
      sx={{ 
        mb: 2, 
        color: 'primary.main', 
        fontWeight: 500,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 1
      }}
    >
      {title}
    </Typography>
    {children}
  </Paper>
);

const ManufacturerForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    country: '',
    contact_person: '',
    email: '',
    phone: '',
    order_history: '',
    notes: '',
    // Neue Felder
    address: '',
    contact_email: '',
    delivery_time: '',
  });
  const [errors, setErrors] = useState({});

  // Formulardaten initialisieren, wenn initialData vorhanden
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Stelle sicher, dass neue Felder auch übernommen werden
        address: initialData.address || '',
        contact_email: initialData.contact_email || '',
        delivery_time: initialData.delivery_time || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name des Herstellers ist erforderlich';
    if (formData.website && !isValidUrl(formData.website)) newErrors.website = 'Bitte geben Sie eine gültige URL ein';
    if (formData.email && !isValidEmail(formData.email)) newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    if (formData.contact_email && !isValidEmail(formData.contact_email)) newErrors.contact_email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    if (formData.delivery_time && isNaN(Number(formData.delivery_time))) newErrors.delivery_time = 'Lieferzeit muss eine Zahl sein';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Hilfsfunktionen für die Validierung
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormSection title="Allgemeine Informationen">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Name des Herstellers"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Land"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Anschrift"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Straße, Hausnummer, PLZ, Ort"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              error={!!errors.website}
              helperText={errors.website || 'Format: https://www.beispiel.de'}
              placeholder="https://"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Lieferzeit (Tage)"
              name="delivery_time"
              type="number"
              value={formData.delivery_time}
              onChange={handleChange}
              error={!!errors.delivery_time}
              helperText={errors.delivery_time}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Kontaktinformationen">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ansprechpartner"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefonnummer"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Info E-Mail"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="info@beispiel.de"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-Mail des Ansprechpartners"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              error={!!errors.contact_email}
              helperText={errors.contact_email}
              placeholder="kontakt@beispiel.de"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Zusätzliche Informationen">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bestellhistorie"
              name="order_history"
              value={formData.order_history}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Informationen zu bisherigen Bestellungen"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notizen"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Zusätzliche Informationen zum Hersteller"
            />
          </Grid>
        </Grid>
      </FormSection>

      <Box display="flex" justifyContent="flex-end" mt={3} mb={2}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          sx={{ mr: 2 }}
        >
          Abbrechen
        </Button>
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          size="large"
        >
          {initialData ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </Box>
    </form>
  );
};

export default ManufacturerForm;