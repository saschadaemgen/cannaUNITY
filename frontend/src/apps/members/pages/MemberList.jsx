// frontend/src/apps/members/pages/MemberList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Alert, Snackbar, alpha, Typography, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '@/utils/api';

// Komponenten importieren
import MemberTable from '../components/MemberTable';
import LoadingIndicator from '@/components/common/LoadingIndicator';

const MemberList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  
  // Zusätzliche States für erweiterte Funktionalität
  const [expandedMemberId, setExpandedMemberId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
          const pages = Math.ceil(total / 25); // 25 Einträge pro Seite
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
  
  // Sicherheitsprüfung vor dem Rendern
  if (!Array.isArray(members)) {
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
      overflow: 'hidden'
    }}>
      {/* Header mit Titel */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Mitgliederverwaltung: Übersicht
        </Typography>
        
        {/* Neues Mitglied Button oben rechts */}
        <Box
          sx={{
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '4px',
            p: 0.75,
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: theme => alpha(theme.palette.success.main, 0.08),
              borderColor: theme => alpha(theme.palette.success.main, 0.5)
            }
          }}
        >
          <Button 
            variant="text" 
            color="success" 
            onClick={() => navigate('/mitglieder/neu')}
            startIcon={<PersonAddIcon />}
            sx={{ 
              textTransform: 'none',
              fontSize: '0.875rem'
            }}
          >
            Neues Mitglied
          </Button>
        </Box>
      </Box>
      
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
      
      {/* MemberTable Komponente - volle Höhe und Breite */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        position: 'relative',
        // Schöne Scrollbar für Webkit-Browser
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.3),
          },
        },
      }}>
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
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message={successMessage}
      />
    </Box>
  );
};

export default MemberList;