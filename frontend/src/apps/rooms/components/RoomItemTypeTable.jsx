// frontend/src/apps/rooms/components/RoomItemTypeTable.jsx
import React, { useState } from 'react';
import { 
  Box, Typography, Button, IconButton, Tooltip,
  Chip, useTheme, alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ChairIcon from '@mui/icons-material/Chair';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SensorsIcon from '@mui/icons-material/Sensors';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';

import AccordionRow from '@/components/common/AccordionRow';
import DetailCards from '@/components/common/DetailCards';
import PaginationFooter from '@/components/common/PaginationFooter';

/**
 * RoomItemTypeTable Komponente für die Darstellung der Raumelement-Typen
 * Im gleichen modernen Design wie RoomTable
 */
const RoomItemTypeTable = ({
  data,
  expandedItemId,
  onExpandItem,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const theme = useTheme();
  
  // Kategorie-Definitionen
  const categoryConfig = {
    'furniture': { 
      label: 'Möbel', 
      color: '#2196f3', // Blau
      icon: ChairIcon 
    },
    'lighting': { 
      label: 'Beleuchtung', 
      color: '#ff9800', // Orange
      icon: LightbulbIcon 
    },
    'sensor': { 
      label: 'Sensorik', 
      color: '#00bcd4', // Cyan
      icon: SensorsIcon 
    },
    'access': { 
      label: 'Zugang', 
      color: '#4caf50', // Grün
      icon: LockIcon 
    },
    'other': { 
      label: 'Sonstiges', 
      color: '#9e9e9e', // Grau
      icon: MoreHorizIcon 
    }
  };

  // Spalten für den Tabellenkopf definieren
  const headerColumns = [
    { label: '', width: '3%', align: 'center' },
    { label: 'Name', width: '25%', align: 'left' },
    { label: 'Kategorie', width: '15%', align: 'left' },
    { label: 'Standardgröße', width: '15%', align: 'center' },
    { label: 'Erlaubte Mengen', width: '20%', align: 'left' },
    { label: 'Eigenschaften', width: '12%', align: 'center' },
    { label: 'Aktionen', width: '10%', align: 'center' }
  ];

  // Icon für Kategorie
  const getCategoryIcon = (category) => {
    const config = categoryConfig[category] || categoryConfig['other'];
    const IconComponent = config.icon;
    return <IconComponent sx={{ fontSize: 20 }} />;
  };

  // Funktion zum Erstellen der Spalten für eine Zeile
  const getRowColumns = (itemType) => {
    const config = categoryConfig[itemType.category] || categoryConfig['other'];
    
    return [
      {
        content: (
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onExpandItem(itemType.id);
            }}
            size="small"
            sx={{ 
              color: 'primary.main',
              width: '28px',
              height: '28px',
              transform: expandedItemId === itemType.id ? 'rotate(180deg)' : 'rotate(0deg)',
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
        content: itemType.name,
        width: '25%',
        bold: true,
        icon: CategoryIcon,
        iconColor: 'success.main'
      },
      {
        content: config.label,
        width: '15%'
      },
      {
        content: `${itemType.default_width} × ${itemType.default_height} cm`,
        width: '15%',
        align: 'center'
      },
      {
        content: (() => {
          if (itemType.allowed_quantities && itemType.allowed_quantities.length > 0) {
            return itemType.allowed_quantities.slice(0, 3).join(', ') + 
                   (itemType.allowed_quantities.length > 3 ? ' ...' : '');
          } else {
            return '(keine)';
          }
        })(),
        width: '20%',
        color: itemType.allowed_quantities && itemType.allowed_quantities.length > 0 
                ? 'text.primary' 
                : 'text.secondary'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {itemType.can_rotate && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Drehbar
              </Typography>
            )}
            {itemType.can_rotate && itemType.can_stack && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
            )}
            {itemType.can_stack && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Stapelbar
              </Typography>
            )}
            {!itemType.can_rotate && !itemType.can_stack && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                -
              </Typography>
            )}
          </Box>
        ),
        width: '12%',
        align: 'center'
      },
      {
        content: (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
            {/* Bearbeiten */}
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
                  to={`/rooms/item-types/${itemType.id}/edit`}
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
            
            {/* Löschen */}
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
                  to={`/rooms/item-types/${itemType.id}/delete`}
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
          </Box>
        ),
        width: '10%',
        align: 'center'
      }
    ];
  };

  // Detailansicht für einen Element-Typ
  const renderItemDetails = (itemType) => {
    const config = categoryConfig[itemType.category] || categoryConfig['other'];
    
    return (
      <>
        {/* Activity Stream Message */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.background.paper, 
            borderLeft: '4px solid',
            borderColor: config.color,
            borderRadius: '4px',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            Element-Typ "{itemType.name}" wurde erstellt und kann in Räumen platziert werden.
          </Typography>
        </Box>

        {/* Details mit DetailCards */}
        <DetailCards 
          cards={[
            {
              title: 'Grundinformationen',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Name:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Kategorie:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {config.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Icon:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.icon || 'Standard'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Farbe:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '4px',
                        backgroundColor: itemType.color || '#888888',
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                      }} />
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {itemType.color || '#888888'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Abmessungen & Eigenschaften',
              content: (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Standardbreite:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.default_width} cm
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Standardhöhe:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.default_height} cm
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Drehbar:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.can_rotate ? 'Ja' : 'Nein'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Stapelbar:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {itemType.can_stack ? 'Ja' : 'Nein'}
                    </Typography>
                  </Box>
                </Box>
              )
            },
            {
              title: 'Erlaubte Pflanzenmengen',
              content: (
                <Box>
                  {itemType.allowed_quantities && itemType.allowed_quantities.length > 0 ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Folgende Pflanzenmengen sind erlaubt:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {itemType.allowed_quantities.map((qty, index) => (
                          <Chip
                            key={index}
                            label={`${qty} Pflanzen`}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Dieses Element kann keine Pflanzen enthalten
                    </Typography>
                  )}
                </Box>
              )
            }
          ]}
          color={config.color}
        />

        {/* Aktionsbereich */}
        <Box sx={{ display: 'flex', gap: 1, mt: 4, mb: 1, flexWrap: 'wrap' }}>
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
              to={`/rooms/item-types/${itemType.id}/edit`}
              startIcon={<EditIcon />}
              sx={{ textTransform: 'none', color: 'text.primary' }}
            >
              Element-Typ bearbeiten
            </Button>
          </Box>
          
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
              to={`/rooms/item-types/${itemType.id}/delete`}
              startIcon={<DeleteIcon />}
              sx={{ textTransform: 'none' }}
            >
              Element-Typ löschen
            </Button>
          </Box>
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
    );
  };

  // Header mit "Neuer Element-Typ" Button
  const renderPageHeader = () => {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
      }}>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          Raumelement-Typen
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/rooms/item-types/new"
          startIcon={<AddIcon />}
          size="small"
        >
          Neuen Element-Typ
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.default
    }}>
      {/* Page Header mit Button */}
      {renderPageHeader()}
      
      {/* Tabellenkopf */}
      {renderTableHeader()}
  
      {/* Tabellenzeilen */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        width: '100%'
      }}>
        {data && data.length > 0 ? (
          data.map((itemType) => (
            <AccordionRow
              key={itemType.id}
              isExpanded={expandedItemId === itemType.id}
              onClick={() => onExpandItem(itemType.id)}
              columns={getRowColumns(itemType)}
              borderColor={categoryConfig[itemType.category]?.color || '#9e9e9e'}
              expandIconPosition="none"
              borderless={true}
            >
              {renderItemDetails(itemType)}
            </AccordionRow>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 4, width: '100%', color: 'text.secondary' }}>
            Keine Element-Typen vorhanden
          </Typography>
        )}
      </Box>
  
      {/* Pagination */}
      {data && data.length > 0 && totalPages > 1 && (
        <Box 
          sx={{ 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            pt: 2,
            pb: 1,
            px: 2,
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
  );
};

export default RoomItemTypeTable;