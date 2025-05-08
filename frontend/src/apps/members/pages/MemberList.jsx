// frontend/src/apps/members/pages/MemberList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, Paper, 
  Fade, Alert, Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import api from '@/utils/api';

// Komponenten importieren
import MemberTable from '../components/MemberTable';
import PageHeader from '../components/common/PageHeader';
import LoadingIndicator from '../components/common/LoadingIndicator';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  
  // Zusätzliche States für erweiterte Funktionalität
  const [expandedMemberId, setExpandedMemberId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Benutzergruppen laden
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get('/user-info/');
        setUserGroups(res.data.groups || []);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUserGroups([]);
      }
    };
    fetchUserInfo();
  }, []);
  
  // Teamleiter-Berechtigungen prüfen
  const isTeamleiter = userGroups.includes('teamleiter');
  
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get(`/members/?page=${currentPage}`);
        console.log('API response:', response.data);
        
        // Prüfen, ob es sich um ein paginiertes Ergebnis handelt
        if (response.data && response.data.results) {
          setMembers(response.data.results);
          
          // Berechne die Gesamtanzahl der Seiten basierend auf der Gesamtanzahl der Einträge
          const total = response.data.count || 0;
          const pages = Math.ceil(total / 25); // 25 Einträge pro Seite (MemberPagination)
          setTotalPages(pages);
        } else if (Array.isArray(response.data)) {
          setMembers(response.data);
          
          // Bei nicht-paginierten Daten Seitenzahl basierend auf Arraygröße berechnen
          const pages = Math.ceil(response.data.length / 25); 
          setTotalPages(pages);
        } else {
          // Fallback: Leeres Array, wenn das Format unbekannt ist
          console.error('Unerwartetes Datenformat:', response.data);
          setMembers([]);
          setError('Unerwartetes Datenformat von der API');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Fehler beim Laden der Mitglieder');
        setMembers([]);
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [currentPage]); // Abhängigkeit hinzugefügt, damit bei Seitenwechsel neu geladen wird
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    // Beim Seitenwechsel alle geöffneten Akkordeons schließen
    setExpandedMemberId('');
  };
  
  const handleAccordionChange = (memberId) => {
    if (expandedMemberId === memberId) {
      setExpandedMemberId('');
    } else {
      setExpandedMemberId(memberId);
    }
  };
  
  const handleCloseError = () => {
    setError(null);
  };
  
  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };
  
  // Zeige einen Ladeindikator, falls die Daten noch geladen werden
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ my: 4 }}>
          <PageHeader 
            title="Mitgliederliste"
            showFilters={false}
            setShowFilters={() => {}}
            actions={
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/mitglieder/neu"
                startIcon={<AddIcon />}
                disabled
              >
                Neues Mitglied hinzufügen
              </Button>
            }
          />
          <LoadingIndicator />
        </Box>
      </Container>
    );
  }
  
  // Sicherheitsprüfung vor dem Rendern
  if (!Array.isArray(members)) {
    return (
      <Container maxWidth="xl" sx={{ width: '100%' }}>
        <Box sx={{ my: 4 }}>
          <Alert severity="error" onClose={handleCloseError}>
            Die Daten haben ein unerwartetes Format
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ width: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box sx={{ my: 4 }}>
          <PageHeader 
            title="Mitgliederliste"
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            actions={
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/mitglieder/neu"
                startIcon={<AddIcon />}
              >
                Neues Mitglied hinzufügen
              </Button>
            }
          />
          
          {error && (
            <Alert 
              severity="error" 
              onClose={handleCloseError}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}
          
          {/* Hier kann später ein Filter-Bereich eingefügt werden */}
          {showFilters && (
            <Fade in={showFilters} timeout={500}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">
                  Filter-Optionen können hier später hinzugefügt werden
                </Typography>
              </Paper>
            </Fade>
          )}
          
          {/* MemberTable Komponente einbinden */}
          <MemberTable 
            data={members}
            expandedMemberId={expandedMemberId}
            onExpandMember={handleAccordionChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isTeamleiter={isTeamleiter}
          />
        </Box>
      </Fade>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={successMessage}
      />
    </Container>
  );
};

export default MemberList;