// frontend/src/apps/members/components/MemberTable.jsx
import React from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip, Chip,
  TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EighteenUpRatingIcon from '@mui/icons-material/EighteenUpRating';
import TwentyOneUpIcon from '@mui/icons-material/NoAdultContent';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import TransgenderIcon from '@mui/icons-material/Transgender';
import WorkIcon from '@mui/icons-material/Work';
import WorkOffIcon from '@mui/icons-material/WorkOff';

import AccordionRow from '@/components/common//AccordionRow';
import TableHeader from '@/components/common//TableHeader';
import PaginationFooter from '@/components/common/PaginationFooter';
import DetailCards from '@/components/common/DetailCards';
import MemberDistributionHistory from './MemberDistributionHistory';

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
  // Gibt die Anrede basierend auf dem Gender-Wert zurück
  const getGenderDisplay = (gender) => {
    const genderMap = {
      'male': 'Herr',
      'female': 'Frau',
      'diverse': 'Divers'
    };
    return genderMap[gender] || 'Herr';
  };
  
  // Gibt das Gender-Icon basierend auf dem Gender-Wert zurück
  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'female':
        return FemaleIcon;
      case 'diverse':
        return TransgenderIcon;
      case 'male':
      default:
        return MaleIcon;
    }
  };

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

  // Hilfsfunktion für Status-Chip
  const renderStatusChip = (status) => {
    const statusConfig = {
      active: { label: 'Aktiv', color: 'success', icon: CheckCircleIcon },
      locked: { label: 'Gesperrt', color: 'error', icon: BlockIcon },
      reminder1: { label: '1. Mahnung', color: 'warning', icon: WarningIcon },
      reminder2: { label: '2. Mahnung', color: 'error', icon: ErrorIcon }
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <Chip
        size="small"
        icon={<config.icon style={{ fontSize: '14px' }} />}
        label={config.label}
        color={config.color}
        sx={{ 
          fontSize: '0.7rem', 
          height: '24px',
          '& .MuiChip-label': { px: 1 },
          '& .MuiChip-icon': { ml: 0.5 }
        }}
      />
    );
  };

  // Hilfsfunktion für Age-Class-Chip
  const renderAgeClassChip = (birthdate) => {
    const ageClass = getAgeClass(birthdate);
    const ageClassConfig = {
      '18+': { 
        label: '18+', 
        color: 'warning', 
        icon: EighteenUpRatingIcon, 
        tooltip: 'Altersklasse 18-21 Jahre (max. 10% THC)' 
      },
      '21+': { 
        label: '21+', 
        color: 'success', 
        icon: TwentyOneUpIcon, 
        tooltip: 'Altersklasse ab 21 Jahre (über 10% THC erlaubt)' 
      }
    };

    const config = ageClassConfig[ageClass] || ageClassConfig['21+'];

    return (
      <Tooltip title={config.tooltip}>
        <Chip
          size="small"
          icon={<config.icon style={{ fontSize: '14px' }} />}
          label={config.label}
          color={config.color}
          sx={{ 
            fontSize: '0.7rem', 
            height: '24px',
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-icon': { ml: 0.5 }
          }}
        />
      </Tooltip>
    );
  };
  
  // Hilfsfunktion für Beschäftigungs-Chip
  const renderEmploymentChip = (isEmployed, hours) => {
    if (!isEmployed) {
      return (
        <Tooltip title="Nicht beschäftigt">
          <Chip
            size="small"
            icon={<WorkOffIcon style={{ fontSize: '14px' }} />}
            label="Nein"
            color="default"
            sx={{ 
              fontSize: '0.7rem', 
              height: '24px',
              '& .MuiChip-label': { px: 1 },
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
        </Tooltip>
      );
    }
    
    return (
      <Tooltip title={`${hours || 0} Stunden pro Monat`}>
        <Chip
          size="small"
          icon={<WorkIcon style={{ fontSize: '14px' }} />}
          label={`${hours || 0} Std/M`}
          color="info"
          sx={{ 
            fontSize: '0.7rem', 
            height: '24px',
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-icon': { ml: 0.5 }
          }}
        />
      </Tooltip>
    );
  };

  // Formatierung des deutschen Datums
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Name', width: '19%', align: 'left' },
    { label: 'Status', width: '10%', align: 'center' },
    { label: 'Altersklasse', width: '9%', align: 'center' },
    { label: 'Minijob', width: '9%', align: 'center' },
    { label: 'Pflichtstunden', width: '10%', align: 'center' },
    { label: 'Kontostand', width: '10%', align: 'center' },
    { label: 'Beitrag', width: '8%', align: 'center' },
    { label: 'Verwarnungen', width: '8%', align: 'center' },
    { label: 'Aktionen', width: '14%', align: 'center' }
  ];

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (member) => {
    const GenderIcon = getGenderIcon(member.gender);
    
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
        content: (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GenderIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {getGenderDisplay(member.gender)} {member.first_name} {member.last_name}
            </Typography>
          </Box>
        ),
        width: '19%',
        align: 'left'
      },
      {
        content: renderStatusChip(member.status),
        width: '10%',
        align: 'center'
      },
      {
        content: renderAgeClassChip(member.birthdate),
        width: '9%',
        align: 'center'
      },
      {
        content: renderEmploymentChip(member.is_marginally_employed, member.working_hours_per_month),
        width: '9%',
        align: 'center'
      },
      {
        content: (
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {member.duty_hours || 0} / 12 Std.
          </Typography>
        ),
        width: '10%',
        align: 'center'
      },
      {
        content: (
          <Typography variant="body2" sx={{ 
            fontSize: '0.8rem',
            fontWeight: 'medium',
            color: parseFloat(member.kontostand) < 0 ? 'error.main' : 'success.main',
          }}>
            {parseFloat(member.kontostand || 0).toFixed(2)} €
          </Typography>
        ),
        width: '10%',
        align: 'center'
      },
      {
        content: (
          <Typography variant="body2" sx={{ 
            fontSize: '0.8rem',
            fontWeight: 'medium',
            color: 'info.main',
          }}>
            {parseFloat(member.beitrag || 0).toFixed(2)} €
          </Typography>
        ),
        width: '8%',
        align: 'center'
      },
      {
        content: member.warnings ? 'Ja' : 'Nein',
        width: '8%',
        align: 'center',
        color: member.warnings ? 'error.main' : 'success.main'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
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
                      height: '28px'
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
        width: '14%',
        align: 'center'
      }
    ];
  };

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (member) => {
    return `Mitglied ${getGenderDisplay(member.gender)} ${member.first_name} ${member.last_name} wurde am ${new Date(member.created || new Date()).toLocaleDateString('de-DE')} erstellt.`;
  };

  // Status-Label für die Detailansicht
  const getStatusLabel = (status) => {
    const statusLabels = {
      active: 'Aktiv',
      locked: 'Gesperrt',
      reminder1: '1. Mahnung',
      reminder2: '2. Mahnung'
    };
    return statusLabels[status] || 'Aktiv';
  };

  // Status-Farbe für die Detailansicht
  const getStatusColor = (status) => {
    const statusColors = {
      active: 'success.main',
      locked: 'error.main',
      reminder1: 'warning.main',
      reminder2: 'error.main'
    };
    return statusColors[status] || 'success.main';
  };

  // Detailansicht für ein Mitglied rendern
  const renderMemberDetails = (member) => {
    const age = calculateAge(member.birthdate);
    const ageClass = getAgeClass(member.birthdate);
    
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
                      {getGenderDisplay(member.gender)} {member.first_name} {member.last_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Status:
                    </Typography>
                    <Typography variant="body2" sx={{ color: getStatusColor(member.status), fontWeight: 'bold' }}>
                      {getStatusLabel(member.status)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Geburtsdatum:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {formatDate(member.birthdate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Alter:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                      {age ? `${age} Jahre` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Altersklasse:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: ageClass === '18+' ? 'warning.main' : 'success.main',
                      fontWeight: 'bold'
                    }}>
                      {ageClass} {ageClass === '18+' ? '(max. 10% THC)' : '(keine THC-Beschränkung)'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Pflichtstunden:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: member.duty_hours >= 12 ? 'success.main' : 'warning.main',
                      fontWeight: 'bold'
                    }}>
                      {member.duty_hours || 0} / 12 Stunden
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
                </Box>
              )
            },
            {
              title: 'Beschäftigungsinformationen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Geringfügig beschäftigt:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: member.is_marginally_employed ? 'info.main' : 'text.secondary',
                      fontWeight: member.is_marginally_employed ? 'bold' : 'normal' 
                    }}>
                      {member.is_marginally_employed ? 'Ja' : 'Nein'}
                    </Typography>
                  </Box>
                  {member.is_marginally_employed && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                          Arbeitsstunden/Monat:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                          {member.working_hours_per_month || 0} Stunden
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                          Maximale Stunden:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                          {member.max_working_hours || 40} Stunden
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                          Stundenlohn:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                          {parseFloat(member.hourly_wage || 12).toFixed(2)} €/Std
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              )
            },
            {
              title: 'Finanzielle Information',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Kontostand:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: parseFloat(member.kontostand) < 0 ? 'error.main' : 'success.main',
                      fontWeight: 'bold'
                    }}>
                      {parseFloat(member.kontostand || 0).toFixed(2)} €
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.6)' }}>
                      Monatsbeitrag:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'info.main',
                      fontWeight: 'bold'
                    }}>
                      {parseFloat(member.beitrag || 0).toFixed(2)} €
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Kontostand und Beitrag werden über die Buchhaltung verwaltet und können hier nicht direkt bearbeitet werden.
                    </Typography>
                  </Box>
                </Box>
              )
            }
          ]}
          color="primary.main"
        />

        {/* Zweite Reihe von Karten */}
        <Box mt={3}>
          <DetailCards
            cards={[
              {
                title: 'Kontaktdaten',
                content: (
                  <Box>
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
                        Telefon:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                        {member.phone || '—'}
                      </Typography>
                    </Box>
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
        </Box>

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

        {/* Produkthistorie hinzufügen */}
        <Box mt={3}>
          <DetailCards
            cards={[
              {
                title: 'Cannabis-Produkthistorie',
                content: (
                  <Box>
                    {/* MemberDistributionHistory-Komponente einbinden */}
                    <MemberDistributionHistory memberId={member.id} />
                  </Box>
                )
              }
            ]}
            color="primary.main"
          />
        </Box>

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