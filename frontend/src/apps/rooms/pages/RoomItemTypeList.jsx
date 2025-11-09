// frontend/src/apps/rooms/pages/RoomItemTypeList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Alert, Snackbar, useTheme, alpha
} from '@mui/material';
import axios from 'axios';

// Komponenten importieren
import RoomItemTypeTable from '../components/RoomItemTypeTable';
import LoadingIndicator from '@/components/common/LoadingIndicator';

const RoomItemTypeList = () => {
  const theme = useTheme();
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Zusätzliche States für erweiterte Funktionalität
  const [expandedItemId, setExpandedItemId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const response = await axios.get('/api/room-item-types/');
        console.log('API response:', response.data);
        
        // Prüfen, ob es sich um ein paginiertes Ergebnis handelt
        if (response.data && response.data.results) {
          setItemTypes(response.data.results);
          
          // Berechne die Gesamtanzahl der Seiten
          const total = response.data.count || 0;
          const pages = Math.ceil(total / 10);
          setTotalPages(pages);
        } else if (Array.isArray(response.data)) {
          setItemTypes(response.data);
          
          // Bei nicht-paginierten Daten
          const pages = Math.ceil(response.data.length / 10); 
          setTotalPages(pages);
        } else {
          console.error('Unerwartetes Datenformat:', response.data);
          setItemTypes([]);
          setError('Unerwartetes Datenformat von der API');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching room item types:', error);
        setError('Fehler beim Laden der Raumelement-Typen');
        setItemTypes([]);
        setLoading(false);
      }
    };
    
    fetchItemTypes();
  }, [currentPage]);
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    setExpandedItemId('');
  };
  
  const handleAccordionChange = (itemId) => {
    if (expandedItemId === itemId) {
      setExpandedItemId('');
    } else {
      setExpandedItemId(itemId);
    }
  };
  
  const handleCloseError = () => {
    setError(null);
  };
  
  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };
  
  // Zeige einen Ladeindikator
  if (loading) {
    return (
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingIndicator />
      </Box>
    );
  }
  
  // Sicherheitsprüfung
  if (!Array.isArray(itemTypes)) {
    return (
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        p: 2 
      }}>
        <Alert severity="error" onClose={handleCloseError}>
          Die Daten haben ein unerwartetes Format
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.default
    }}>
      {error && (
        <Alert 
          severity="error" 
          onClose={handleCloseError}
          sx={{ 
            borderRadius: 0,
            flexShrink: 0 
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* ItemType Table - volle Höhe und Breite */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <RoomItemTypeTable 
          data={itemTypes}
          expandedItemId={expandedItemId}
          onExpandItem={handleAccordionChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Box>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={successMessage}
      />
    </Box>
  );
};

export default RoomItemTypeList;