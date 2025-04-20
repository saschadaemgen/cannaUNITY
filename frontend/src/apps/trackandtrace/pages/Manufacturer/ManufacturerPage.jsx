// frontend/src/apps/trackandtrace/pages/Manufacturer/ManufacturerPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../../../utils/api';
import TableComponent from '../../components/TableComponent';
import ManufacturerDetails from './ManufacturerDetails';
import ManufacturerForm from './ManufacturerForm';

const ManufacturerPage = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [currentManufacturer, setCurrentManufacturer] = useState(null);

  const columns = [
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'country', label: 'Land', minWidth: 100 },
    { id: 'contact_person', label: 'Ansprechpartner', minWidth: 150 },
    { id: 'email', label: 'E-Mail', minWidth: 150 },
    { id: 'phone', label: 'Telefon', minWidth: 120 },
    { id: 'delivery_time', label: 'Lieferzeit (Tage)', minWidth: 120 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trackandtrace/manufacturers/');
      
      if (Array.isArray(response.data)) {
        setManufacturers(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setManufacturers(response.data.results);
      } else {
        console.error('Unerwartetes Datenformat:', response.data);
        setManufacturers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Laden der Hersteller:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Formular-Handling
  const handleOpenForm = (manufacturer = null) => {
    setCurrentManufacturer(manufacturer);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentManufacturer(null);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (currentManufacturer) {
        // Update
        await api.put(`/trackandtrace/manufacturers/${currentManufacturer.id}/`, formData);
      } else {
        // Create
        await api.post('/trackandtrace/manufacturers/', formData);
      }
      fetchData();
      handleCloseForm();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      if (err.response && err.response.data) {
        alert(`Fehler beim Speichern: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten');
      }
    }
  };

  // Delete-Handling
  const handleDelete = async (manufacturer) => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${manufacturer.name} löschen möchten?`)) {
      try {
        await api.delete(`/trackandtrace/manufacturers/${manufacturer.id}/`);
        fetchData();
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen. Möglicherweise gibt es abhängige Datensätze.');
      }
    }
  };

  if (loading && manufacturers.length === 0) return <Typography>Lade Daten...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mb={4} mt={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Hersteller-Verwaltung
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
          >
            Neuer Hersteller
          </Button>
        </Box>
        
        <TableComponent 
          columns={columns}
          data={manufacturers}
          detailsComponent={(props) => (
            <ManufacturerDetails 
              {...props} 
              onEdit={handleOpenForm}
              onDelete={handleDelete}
            />
          )}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
        />
      </Box>
      
      {/* Formular-Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentManufacturer ? 'Hersteller bearbeiten' : 'Neuer Hersteller'}
        </DialogTitle>
        <DialogContent>
          <ManufacturerForm 
            initialData={currentManufacturer} 
            onSave={handleSaveForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ManufacturerPage;