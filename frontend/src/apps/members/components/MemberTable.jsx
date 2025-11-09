// frontend/src/apps/members/components/MemberTable.jsx
import React from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip, Chip,
  useTheme, alpha
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
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import AccordionRow from '@/components/common/AccordionRow';
import DetailCards from '@/components/common/DetailCards';
import PaginationFooter from '@/components/common/PaginationFooter';
import MemberDistributionHistory from './MemberDistributionHistory';

/**
 * MemberTable Komponente für die Darstellung der Mitgliederliste mit Details
 * Vollständig mit Dark Mode Unterstützung
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
  const theme = useTheme();
  
  const getGenderDisplay = (gender) => {
    const genderMap = {
      'male': 'Herr',
      'female': 'Frau',
      'diverse': 'Divers'
    };
    return genderMap[gender] || 'Herr';
  };
  
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
  
  const getAgeClass = (birthdate) => {
    const age = calculateAge(birthdate);
    if (!age) return '21+';
    
    if (age < 21) return '18+';
    return '21+';
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Name', width: '20%', align: 'left' },
    { label: 'Status', width: '10%', align: 'center' },
    { label: 'Altersklasse', width: '10%', align: 'center' },
    { label: 'Minijob', width: '10%', align: 'center' },
    { label: 'Pflichtstunden', width: '11%', align: 'center' },
    { label: 'Kontostand', width: '10%', align: 'center' },
    { label: 'Beitrag', width: '9%', align: 'center' },
    { label: 'Verwarnungen', width: '10%', align: 'center' },
    { label: 'Aktionen', width: '7%', align: 'center' }
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
            <GenderIcon 
              sx={{ 
                mr: 1, 
                fontSize: '1.2rem',
                color: 'primary.main' 
              }} 
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getGenderDisplay(member.gender)} {member.first_name} {member.last_name}
            </Typography>
          </Box>
        ),
        width: '20%',
        align: 'left'
      },
      {
        content: renderStatusChip(member.status),
        width: '10%',
        align: 'center'
      },
      {
        content: renderAgeClassChip(member.birthdate),
        width: '10%',
        align: 'center'
      },
      {
        content: renderEmploymentChip(member.is_marginally_employed, member.working_hours_per_month),
        width: '10%',
        align: 'center'
      },
      {
        content: (
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {member.duty_hours || 0} / 12 Std.
          </Typography>
        ),
        width: '11%',
        align: 'center'
      },
      {
        content: (
          <Typography variant="body2" sx={{ 
            fontSize: '0.8rem',
            fontWeight: 500,
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
            fontWeight: 500,
            color: 'info.main',
          }}>
            {parseFloat(member.beitrag || 0).toFixed(2)} €
          </Typography>
        ),
        width: '9%',
        align: 'center'
      },
      {
        content: member.warnings ? 'Ja' : 'Nein',
        width: '10%',
        align: 'center',
        color: member.warnings ? 'error.main' : 'success.main'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
            {/* Details anzeigen */}
            <Box
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: '4px',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                  borderColor: theme.palette.divider
                }
              }}
            >
              <Tooltip title="Details anzeigen">
                <IconButton 
                  component={Link} 
                  to={`/mitglieder/${member.id}`}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.text.secondary
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Bearbeiten - nur für Teamleiter */}
            {isTeamleiter && (
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    borderColor: theme.palette.divider
                  }
                }}
              >
                <Tooltip title="Bearbeiten">
                  <IconButton 
                    component={Link} 
                    to={`/mitglieder/${member.id}/edit`}
                    size="small"
                    sx={{ 
                      p: 0.5,
                      color: theme.palette.text.secondary
                    }}
                  >
                    <EditIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
            {/* Löschen - nur für Teamleiter */}
            {isTeamleiter && (
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    borderColor: alpha(theme.palette.error.main, 0.5)
                  }
                }}
              >
                <Tooltip title="Löschen">
                  <IconButton 
                    component={Link} 
                    to={`/mitglieder/${member.id}/delete`}
                    size="small"
                    sx={{ 
                      p: 0.5,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: 'error.main'
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        ),
        width: '7%',
        align: 'center'
      }
    ];
  };

  // Funktion für Activity-Stream-Nachrichten
  const getActivityMessage = (member) => {
    return `Mitglied ${getGenderDisplay(member.gender)} ${member.first_name} ${member.last_name} wurde am ${new Date(member.created || new Date()).toLocaleDateString('de-DE')} erstellt.`;
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      active: 'Aktiv',
      locked: 'Gesperrt',
      reminder1: '1. Mahnung',
      reminder2: '2. Mahnung'
    };
    return statusLabels[status] || 'Aktiv';
  };

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
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {getActivityMessage(member)}
          </Typography>
        </Box>

        {/* Cannabis-Produkthistorie */}
        <Box mb={3}>
          <DetailCards
            cards={[
              {
                title: 'Cannabis-Produkthistorie',
                content: (
                  <Box>
                    <MemberDistributionHistory 
                      memberId={member.id}
                      memberAge={age}
                      memberBirthDate={member.birthdate}
                      member={member}
                    />
                  </Box>
                )
              }
            ]}
            color="primary.main"
          />
        </Box>

        {/* Mitgliedsdetails mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: 'Persönliche Informationen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {getGenderDisplay(member.gender)} {member.first_name} {member.last_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Status:
                    </Typography>
                    <Typography variant="body2" sx={{ color: getStatusColor(member.status), fontWeight: 'bold' }}>
                      {getStatusLabel(member.status)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Geburtsdatum:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {formatDate(member.birthdate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Alter:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {age ? `${age} Jahre` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      UUID:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Arbeitsstunden/Monat:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                          {member.working_hours_per_month || 0} Stunden
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Maximale Stunden:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {member.max_working_hours || 40} Stunden
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Stundenlohn:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        E-Mail:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {member.email || '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Telefon:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {member.phone || '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Straße & Nr.:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {member.street} {member.house_number}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        PLZ & Ort:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
                        Körperliche Einschränkungen:
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          p: 1.5,
                          borderRadius: '4px',
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontStyle: member.physical_limitations ? 'normal' : 'italic',
                            color: member.physical_limitations ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {member.physical_limitations || 'Keine körperlichen Einschränkungen vorhanden'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
                        Geistige Einschränkungen:
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          p: 1.5,
                          borderRadius: '4px',
                          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontStyle: member.mental_limitations ? 'normal' : 'italic',
                            color: member.mental_limitations ? 'text.primary' : 'text.secondary',
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
                        backgroundColor: theme.palette.background.paper,
                        p: 1.5,
                        borderRadius: '4px',
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
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
                        backgroundColor: theme.palette.background.paper,
                        p: 1.5,
                        borderRadius: '4px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
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
        <Box sx={{ display: 'flex', gap: 1, mt: 4, mb: 1, flexWrap: 'wrap' }}>
          {/* Details anzeigen */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/mitglieder/${member.id}`}
              startIcon={<VisibilityIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Details anzeigen
            </Button>
          </Box>
          
          {/* Produkthistorie */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/mitglieder/${member.id}/history`}
              startIcon={<HistoryIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Vollständige Produkthistorie
            </Button>
          </Box>
          
          {/* Kontohistorie */}
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '4px',
              p: 0.75,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08),
                borderColor: theme.palette.divider
              }
            }}
          >
            <Button 
              variant="text" 
              color="inherit" 
              component={Link} 
              to={`/mitglieder/${member.id}/account`}
              startIcon={<AccountBalanceWalletIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Kontohistorie anzeigen
            </Button>
          </Box>
          
          {isTeamleiter && (
            <>
              {/* Bearbeiten */}
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.75,
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.08),
                    borderColor: theme.palette.divider
                  }
                }}
              >
                <Button 
                  variant="text" 
                  color="inherit" 
                  component={Link} 
                  to={`/mitglieder/${member.id}/edit`}
                  startIcon={<EditIcon />}
                  sx={{ textTransform: 'none', color: 'text.primary' }}
                >
                  Mitglied bearbeiten
                </Button>
              </Box>
              
              {/* Löschen */}
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  p: 0.75,
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: theme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    borderColor: alpha(theme.palette.error.main, 0.5)
                  }
                }}
              >
                <Button 
                  variant="text" 
                  color="error" 
                  component={Link} 
                  to={`/mitglieder/${member.id}/delete`}
                  startIcon={<DeleteIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Mitglied löschen
                </Button>
              </Box>
            </>
          )}
        </Box>
      </>
    );
  };

  // Dark Mode kompatibler Tabellenkopf
  const renderTableHeader = () => {
    return (
      <Box sx={{ 
        width: '100%', 
        display: 'flex',
        bgcolor: theme.palette.background.paper,
        height: '40px',
        alignItems: 'center',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        flexShrink: 0,  // Prevent header from shrinking
        // Subtiler Schatten beim Scrollen
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: '2px',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
          pointerEvents: 'none'
        }
      }}>
        {headerColumns.map((column, index) => (
          <Box
            key={index}
            sx={{ 
              width: column.width || 'auto', 
              px: 1.5,
              textAlign: column.align || 'left', 
              whiteSpace: 'nowrap',
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default,
      overflow: 'hidden'  // Prevent outer container from scrolling
    }}>
      {/* Scrollbare Container für Header + Content */}
      <Box sx={{ 
        width: '100%',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        {/* Tabellenkopf - sticky innerhalb des scrollbaren Containers */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex',
          bgcolor: theme.palette.background.paper,
          height: '40px',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          // Subtiler Schatten beim Scrollen
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: '2px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
            pointerEvents: 'none'
          }
        }}>
          {headerColumns.map((column, index) => (
            <Box
              key={index}
              sx={{ 
                width: column.width || 'auto', 
                px: 1.5,
                textAlign: column.align || 'left', 
                whiteSpace: 'nowrap',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {column.label}
              </Typography>
            </Box>
          ))}
        </Box>
  
        {/* Tabellenzeilen */}
        {data && data.length > 0 ? (
          data.map((member) => (
            <AccordionRow
              key={member.id}
              isExpanded={expandedMemberId === member.id}
              onClick={() => onExpandMember(member.id)}
              columns={getRowColumns(member)}
              borderColor="primary.main"
              expandIconPosition="none"
              borderless={true}
            >
              {renderMemberDetails(member)}
            </AccordionRow>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
            Keine Mitglieder vorhanden
          </Typography>
        )}
        
        {/* Pagination innerhalb des scrollbaren Bereichs */}
        {data && data.length > 0 && totalPages > 1 && (
          <Box 
            sx={{ 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              mt: 2,
              pt: 2,
              pb: 1,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              hasData={true}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MemberTable;