// frontend/src/apps/members/components/MemberTable.jsx
import React from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip,
  TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AccordionRow from './common/AccordionRow';
import TableHeader from './common/TableHeader';
import PaginationFooter from './common/PaginationFooter';
import DetailCards from './common/DetailCards';

/**
 * MemberTable Komponente für die Darstellung der Mitgliederliste mit Details
 */
const MemberTable = ({
  data,
  expandedMemberId,
  onExpandMember,
  currentPage,
  totalPages,
  onPageChange,
  isTeamleiter
}) => {
  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Name', width: '14%', align: 'left' },
    { label: 'E-Mail', width: '15%', align: 'left' },
    { label: 'Geburtsdatum', width: '10%', align: 'center' },
    { label: 'Adresse', width: '20%', align: 'left' },
    { label: 'Kontostand', width: '8%', align: 'center' },
    { label: 'Beitragsmodell', width: '12%', align: 'left' },
    { label: 'Verwarnungen', width: '7%', align: 'center' },
    { label: 'Aktionen', width: '11%', align: 'center' }
  ];

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (member) => {
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandMember(member.id);
            }}
            size="small"
            sx={{ 
              color: 'primary.main',
              width: '28px',
              height: '28px',
              transform: expandedMemberId === member.id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 300ms ease-in-out'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        ),
        width: '3%',
        align: 'center'
      },
      {
        content: `${member.first_name} ${member.last_name}`,
        width: '14%',
        bold: true,
        icon: PersonIcon,
        iconColor: 'success.main'
      },
      {
        content: member.email || '—',
        width: '15%'
      },
      {
        content: member.birthdate || '—',
        width: '10%',
        align: 'center'
      },
      {
        content: `${member.street || ''} ${member.house_number || ''}, ${member.zip_code || ''} ${member.city || ''}`,
        width: '20%'
      },
      {
        content: `${member.kontostand || '0'} €`,
        width: '8%',
        align: 'center',
        color: parseFloat(member.kontostand) < 0 ? 'error.main' : 'success.main'
      },
      {
        content: member.beitragsmodell_name || '—',
        width: '12%'
      },
      {
        content: member.warnings ? 'Ja' : 'Nein',
        width: '7%',
        align: 'center',
        color: member.warnings ? 'error.main' : 'success.main'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', pl: 1 }}>
            <Tooltip title="Details anzeigen">
              <IconButton 
                component={Link} 
                to={`/mitglieder/${member.id}`}
                size="small"
                sx={{ 
                  color: 'white',
                  backgroundColor: 'info.main',
                  '&:hover': { backgroundColor: 'info.dark' },
                  width: '28px',
                  height: '28px',
                  mr: 0.5
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isTeamleiter && (
              <>
                <Tooltip title="Bearbeiten">
                  <IconButton 
                    component={Link} 
                    to={`/mitglieder/${member.id}/edit`}
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      width: '28px',
                      height: '28px',
                      mr: 0.5
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Löschen">
                  <IconButton 
                    component={Link} 
                    to={`/mitglieder/${member.id}/delete`}
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'error.main',
                      '&:hover': { backgroundColor: 'error.dark' },
                      width: '28px',
                      height: '28px',
                      mr: 0.5
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
        width: '11%',
        align: 'center'
      }
    ];
  };

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (member) => {
    return `Mitglied ${member.first_name} ${member.last_name} wurde am ${new Date(member.created || new Date()).toLocaleDateString('de-DE')} erstellt.`;
  };

  // Detailansicht für ein Mitglied rendern
  const renderMemberDetails = (member) => {
    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'white', 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.6)' }}>
            {getActivityMessage(member)}
          </Typography>
        </Box>

        {/* Mitgliedsdetails mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: 'Persönliche Informationen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {member.first_name} {member.last_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      E-Mail:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {member.email || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Geburtsdatum:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {member.birthdate || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      UUID:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      <code>{member.uuid || '—'}</code>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Kontostand:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: parseFloat(member.kontostand) < 0 ? 'error.main' : 'success.main',
                      fontWeight: 'bold'
                    }}>
                      {member.kontostand || '0'} €
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Adresse',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Straße & Nr.:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {member.street} {member.house_number}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      PLZ & Ort:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {member.zip_code} {member.city}
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Gesundheitliche Informationen',
              content: (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>
                      Körperliche Einschränkungen:
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: 'white',
                        p: 1.5,
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: member.physical_limitations ? 'normal' : 'italic',
                          color: member.physical_limitations ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        {member.physical_limitations || 'Keine körperlichen Einschränkungen vorhanden'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>
                      Geistige Einschränkungen:
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: 'white',
                        p: 1.5,
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontStyle: member.mental_limitations ? 'normal' : 'italic',
                          color: member.mental_limitations ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        {member.mental_limitations || 'Keine geistigen Einschränkungen vorhanden'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            }
          ]}
          color="primary.main"
        />

        {/* Verwarnungen und Bemerkungen */}
        {(member.warnings || member.notes) && (
          <Box mt={3}>
            <DetailCards
              cards={[
                member.warnings ? {
                  title: 'Verwarnungen',
                  content: (
                    <Box
                      sx={{
                        backgroundColor: 'white',
                        p: 1.5,
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'error.main',
                      }}
                    >
                      <Typography variant="body2" color="error.main">
                        {member.warnings}
                      </Typography>
                    </Box>
                  )
                } : null,
                member.notes ? {
                  title: 'Bemerkungen',
                  content: (
                    <Box
                      sx={{
                        backgroundColor: 'white',
                        p: 1.5,
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <Typography variant="body2">
                        {member.notes}
                      </Typography>
                    </Box>
                  )
                } : null
              ].filter(Boolean)}
              color="primary.main"
            />
          </Box>
        )}

        {/* Aktionsbereich mit ausreichend Abstand zu den Karten darüber */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 1 }}>
          <Button 
            variant="contained" 
            color="info" 
            component={Link} 
            to={`/mitglieder/${member.id}`}
            startIcon={<VisibilityIcon />}
          >
            Details anzeigen
          </Button>
          {isTeamleiter && (
            <>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to={`/mitglieder/${member.id}/edit`}
                startIcon={<EditIcon />}
              >
                Mitglied bearbeiten
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                component={Link} 
                to={`/mitglieder/${member.id}/delete`}
                startIcon={<DeleteIcon />}
              >
                Mitglied löschen
              </Button>
            </>
          )}
        </Box>
      </>
    );
  };

  // Tabellenkopf mit der TableHeader-Komponente
  const renderTableHeader = () => {
    return <TableHeader columns={headerColumns} />;
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Tabellenkopf */}
      {renderTableHeader()}
  
      {/* Tabellenzeilen */}
      {data && data.length > 0 ? (
        data.map((member) => (
          <AccordionRow
            key={member.id}
            isExpanded={expandedMemberId === member.id}
            onClick={() => onExpandMember(member.id)}
            columns={getRowColumns(member)}
            borderColor="primary.main"
            expandIconPosition="none" // Deaktiviere das Standard-Icon, da wir ein eigenes verwenden
          >
            {renderMemberDetails(member)}
          </AccordionRow>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 4, width: '100%' }}>
          Keine Mitglieder vorhanden
        </Typography>
      )}
  
      {/* Pagination mit der PaginationFooter-Komponente */}
      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasData={data && data.length > 0}
        emptyMessage="Keine Mitglieder vorhanden"
        color="primary"
      />
    </Box>
  );
};

export default MemberTable;