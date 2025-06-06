// frontend/src/apps/wawi/pages/Strain/components/form-components/HistorySection.jsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Tooltip,
  Popover
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LabelIcon from '@mui/icons-material/Label';
import BusinessIcon from '@mui/icons-material/Business';
import GrassIcon from '@mui/icons-material/Grass';
import HeightIcon from '@mui/icons-material/Height';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScaleIcon from '@mui/icons-material/Scale';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import TerrainIcon from '@mui/icons-material/Terrain';
import BugReportIcon from '@mui/icons-material/BugReport';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

export default function HistorySection({ history, historyLoading }) {
  const [historyInfoAnchorEl, setHistoryInfoAnchorEl] = useState(null);

  const formatDateTime = (timestampStr) => {
    if (!timestampStr) return '';
    
    if (typeof timestampStr === 'string' && timestampStr.includes('.') && !timestampStr.includes('T')) {
      return `am ${timestampStr}`;
    }
    
    try {
      const date = new Date(timestampStr);
      return `am ${date.toLocaleDateString('de-DE')} um ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
    } catch (e) {
      return `am ${timestampStr}`;
    }
  };

  const groupEditsByDate = (edits) => {
    if (!edits || !Array.isArray(edits) || edits.length === 0) return {};
    
    return edits.reduce((groups, edit) => {
      try {
        let dateStr;
        
        if (edit.timestamp) {
          if (typeof edit.timestamp === 'string') {
            if (edit.timestamp.includes('T')) {
              dateStr = edit.timestamp.split('T')[0];
            } else if (edit.timestamp.includes(' um ')) {
              dateStr = edit.timestamp.split(' um ')[0].replace('am ', '');
            } else if (edit.timestamp.includes('.')) {
              dateStr = edit.timestamp;
            } else {
              dateStr = 'Unbekanntes Datum';
            }
          } else {
            dateStr = 'Unbekanntes Datum';
          }
        } else {
          dateStr = 'Unbekanntes Datum';
        }
        
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        
        groups[dateStr].push(edit);
        
        return groups;
      } catch (error) {
        console.error('Fehler beim Gruppieren nach Datum:', error);
        return groups;
      }
    }, {});
  };

  const getIconForField = (field) => {
    const iconMap = {
      name: <LabelIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      breeder: <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      strain_type: <GrassIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      indica_percentage: <GrassIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      genetic_origin: <ScienceIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      flowering_time_min: <CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      flowering_time_max: <CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      height_indoor_min: <HeightIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      height_indoor_max: <HeightIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      height_outdoor_min: <HeightIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      height_outdoor_max: <HeightIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      yield_indoor_min: <ScaleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      yield_indoor_max: <ScaleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      yield_outdoor_min: <ScaleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      yield_outdoor_max: <ScaleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      thc_percentage_min: <ScienceIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      thc_percentage_max: <ScienceIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      cbd_percentage_min: <ScienceIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      cbd_percentage_max: <ScienceIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      difficulty: <PsychologyIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      dominant_terpenes: <LocalFloristIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      flavors: <LocalFloristIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      effects: <PsychologyIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      growing_information: <InfoIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      general_information: <InfoIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      suitable_climate: <TerrainIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      growing_method: <GrassIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      resistance_mold: <BugReportIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      resistance_pests: <BugReportIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      resistance_cold: <AcUnitIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      awards: <EmojiEventsIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      release_year: <EventIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      rating: <StarIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>,
      price_per_seed: <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
      seeds_per_pack: <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>,
      is_active: <ToggleOnIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>,
    };
    
    return iconMap[field] || <EditIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }}/>;
  };

  const getNarrativeForPriceAction = (action, details, memberName, timestamp) => {
    const timeStr = formatDateTime(timestamp);
    const timeOnly = timeStr.includes('am') ? timeStr.split('am ')[1] : timeStr;
    
    let icon;
    let narrativeContent;
    
    switch (action) {
      case 'price_tier_added':
        icon = <LocalOfferIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>;
        narrativeContent = (
          <>
            fügte{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {timeOnly}
            </Box>
            {' '}eine neue Preisstaffel hinzu:{' '}
            <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
              {details.tier_name || `${details.quantity}er Packung`} für {details.price}€
            </Box>
            {'.'}
          </>
        );
        break;
        
      case 'price_tier_updated':
        icon = <EditIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>;
        narrativeContent = (
          <>
            aktualisierte{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {timeOnly}
            </Box>
            {' '}eine Preisstaffel
            {details.tier_name && (
              <>
                :{' '}
                <Box component="span" sx={{ color: 'info.main', fontWeight: 'medium' }}>
                  {details.tier_name}
                </Box>
              </>
            )}
            {'.'}
          </>
        );
        break;
        
      case 'price_tier_deleted':
        icon = <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }}/>;
        narrativeContent = (
          <>
            löschte{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {timeOnly}
            </Box>
            {' '}eine Preisstaffel
            {details.tier_name && (
              <>
                :{' '}
                <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                  {details.tier_name} ({details.quantity} Samen für {details.price}€)
                </Box>
              </>
            )}
            {'.'}
          </>
        );
        break;
        
      case 'purchase_added':
        icon = <ShoppingCartIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>;
        narrativeContent = (
          <>
            dokumentierte{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {timeOnly}
            </Box>
            {' '}einen Einkauf:{' '}
            <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
              {details.quantity} × {details.tier_name} für {details.total_cost}€
            </Box>
            {' '}am{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {details.date}
            </Box>
            {'.'}
          </>
        );
        break;
        
      default:
        return null;
    }
    
    return (
      <Box 
        component="div" 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          py: 0.25,
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.02)'
          }
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'medium',
            color: 'primary.main',
            minWidth: '120px'
          }}
        >
          {icon}
          {memberName}
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          &nbsp;{narrativeContent}
        </Typography>
      </Box>
    );
  };

  const getNarrativeForChange = (field, values, memberName, timestamp) => {
    // Spezielle Behandlung für Preis-bezogene Aktionen
    if (['price_tier_added', 'price_tier_updated', 'price_tier_deleted', 'purchase_added'].includes(field)) {
      return getNarrativeForPriceAction(field, values, memberName, timestamp);
    }
    
    const fieldLabels = {
      name: 'den Sortennamen',
      breeder: 'den Hersteller/Züchter',
      strain_type: 'den Samentyp',
      indica_percentage: 'das Indica/Sativa Verhältnis',
      genetic_origin: 'die genetische Herkunft',
      flowering_time_min: 'die minimale Blütezeit',
      flowering_time_max: 'die maximale Blütezeit',
      height_indoor_min: 'die minimale Indoor-Höhe',
      height_indoor_max: 'die maximale Indoor-Höhe',
      height_outdoor_min: 'die minimale Outdoor-Höhe',
      height_outdoor_max: 'die maximale Outdoor-Höhe',
      yield_indoor_min: 'den minimalen Indoor-Ertrag',
      yield_indoor_max: 'den maximalen Indoor-Ertrag',
      yield_outdoor_min: 'den minimalen Outdoor-Ertrag',
      yield_outdoor_max: 'den maximalen Outdoor-Ertrag',
      thc_percentage_min: 'den minimalen THC-Gehalt',
      thc_percentage_max: 'den maximalen THC-Gehalt',
      cbd_percentage_min: 'den minimalen CBD-Gehalt',
      cbd_percentage_max: 'den maximalen CBD-Gehalt',
      difficulty: 'den Schwierigkeitsgrad',
      dominant_terpenes: 'die dominanten Terpene',
      flavors: 'die Aromen',
      effects: 'die Effekte',
      growing_information: 'die Anbauinformationen',
      general_information: 'die allgemeinen Informationen',
      suitable_climate: 'das geeignete Klima',
      growing_method: 'die Anbaumethode',
      resistance_mold: 'die Schimmelresistenz',
      resistance_pests: 'die Schädlingsresistenz',
      resistance_cold: 'die Kälteresistenz',
      awards: 'die Auszeichnungen',
      release_year: 'das Erscheinungsjahr',
      rating: 'die Bewertung',
      price_per_seed: 'den Preis pro Samen',
      seeds_per_pack: 'die Anzahl der Samen pro Packung',
      is_active: 'den Status',
    };
    
    let oldValueFormatted = values.old !== null && values.old !== undefined ? String(values.old) : '(leer)';
    let newValueFormatted = values.new !== null && values.new !== undefined ? String(values.new) : '(leer)';
    
    switch (field) {
      case 'indica_percentage':
        oldValueFormatted = `${values.old}% Indica / ${100 - values.old}% Sativa`;
        newValueFormatted = `${values.new}% Indica / ${100 - values.new}% Sativa`;
        break;
      case 'is_active':
        oldValueFormatted = values.old ? 'Aktiv' : 'Inaktiv';
        newValueFormatted = values.new ? 'Aktiv' : 'Inaktiv';
        break;
      case 'rating':
        oldValueFormatted = `${values.old} Sterne`;
        newValueFormatted = `${values.new} Sterne`;
        break;
      case 'price_per_seed':
        oldValueFormatted = `${values.old}€`;
        newValueFormatted = `${values.new}€`;
        break;
    }
    
    const timeStr = formatDateTime(timestamp);
    const fieldLabel = fieldLabels[field] || field;
    const icon = getIconForField(field);
    
    return (
      <Box 
        component="div" 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          py: 0.25,
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.02)'
          }
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'medium', 
            color: 'primary.main',
            minWidth: '120px'
          }}
        >
          {icon}
          {memberName}
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          &nbsp;änderte{' '}
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {timeStr.includes('am') ? timeStr.split('am ')[1] : timeStr}
          </Box>
          {' '}
          <Box component="span" sx={{ fontWeight: 'medium' }}>
            {fieldLabel}
          </Box>
          {' '}von{' '}
          <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
            {oldValueFormatted}
          </Box>
          {' '}zu{' '}
          <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
            {newValueFormatted}
          </Box>
          {'.'}
        </Typography>
      </Box>
    );
  };
  
  const getNarrativeForImageAction = (edit) => {
    if (!edit || !edit.image_action) return null;
    
    const imageAction = edit.image_action;
    const memberName = edit.member_name;
    const timeStr = formatDateTime(edit.timestamp);
    const timeOnly = timeStr.includes('am') ? timeStr.split('am ')[1] : timeStr;
    const caption = edit.image_details?.caption || '';
    const oldCaption = edit.image_details?.old_caption || '';
    const newCaption = edit.image_details?.new_caption || '';
    
    let icon;
    switch (imageAction) {
      case 'added':
        icon = <AddPhotoAlternateIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }}/>;
        break;
      case 'removed':
        icon = <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }}/>;
        break;
      case 'set_primary':
        icon = <StarIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }}/>;
        break;
      case 'caption_updated':
        icon = <EditIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }}/>;
        break;
      default:
        icon = <EditIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }}/>;
    }
    
    const narrativeContent = (() => {
      switch (imageAction) {
        case 'added':
          return (
            <>
              fügte{' '}
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {timeOnly}
              </Box>
              {' '}ein neues Bild hinzu
              {caption && (
                <>
                  {' '}mit der Beschreibung{' '}
                  <Box component="span" sx={{ color: 'success.main', fontStyle: 'italic' }}>
                    "{caption}"
                  </Box>
                </>
              )}
              {'.'}
            </>
          );
        case 'removed':
          return (
            <>
              entfernte{' '}
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {timeOnly}
              </Box>
              {' '}ein Bild
              {caption && (
                <>
                  {' '}mit der Beschreibung{' '}
                  <Box component="span" sx={{ color: 'error.main', fontStyle: 'italic' }}>
                    "{caption}"
                  </Box>
                </>
              )}
              {'.'}
            </>
          );
        default:
          return null;
      }
    })();
    
    return (
      <Box 
        component="div" 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 0.5,
          py: 0.25,
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.02)'
          }
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'medium',
            color: 'primary.main',
            minWidth: '120px'
          }}
        >
          {icon}
          {memberName}
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          &nbsp;{narrativeContent}
        </Typography>
      </Box>
    );
  };
  
  const renderHistoryContent = () => {
    const creator = history.find(entry => entry.action === 'created');
    
    const edits = history
      .filter(entry => entry.action === 'updated')
      .sort((a, b) => {
        try {
          return new Date(b.timestamp) - new Date(a.timestamp);
        } catch (e) {
          return 0;
        }
      });
    
    const creatorSection = creator ? (
      <Box sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1.5,
            p: 1,
            borderRadius: 1,
            bgcolor: 'success.light',
            color: 'success.contrastText'
          }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {creator.member_name} erstellte diese Sorte {formatDateTime(creator.timestamp)}
          </Typography>
        </Box>
      </Box>
    ) : null;
    
    const groupedEdits = groupEditsByDate(edits);
    
    const editSections = Object.entries(groupedEdits).map(([dateStr, dateEdits]) => {
      const allChanges = [];
      
      dateEdits.forEach(edit => {
        if (edit.image_action) {
          allChanges.push({
            type: 'image',
            content: getNarrativeForImageAction(edit),
            timestamp: edit.timestamp,
            key: `img-${edit.id || Math.random()}`
          });
        }
        
        if (edit.action === 'updated' && edit.changes) {
          const changeEntries = Object.entries(edit.changes);
          if (changeEntries.length === 0) return;
          
          changeEntries.forEach(([field, values]) => {
            allChanges.push({
              type: 'field',
              content: getNarrativeForChange(field, values, edit.member_name, edit.timestamp),
              timestamp: edit.timestamp,
              key: `${edit.id || Math.random()}-${field}`
            });
          });
        }
      });
      
      allChanges.sort((a, b) => {
        try {
          return new Date(b.timestamp) - new Date(a.timestamp);
        } catch (e) {
          return 0;
        }
      });
      
      if (allChanges.length === 0) return null;
      
      const formattedDate = (() => {
        try {
          if (dateStr.includes('.')) {
            return dateStr;
          }
          
          const date = new Date(dateStr);
          return date.toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          });
        } catch (e) {
          return dateStr;
        }
      })();
      
      return (
        <Box key={dateStr} sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              mt: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 0.5
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              {formattedDate}
            </Typography>
          </Box>
          
          <Box sx={{ pl: 1 }}>
            {allChanges.map(change => (
              <Box key={change.key}>
                {change.content}
              </Box>
            ))}
          </Box>
        </Box>
      );
    }).filter(Boolean);
    
    if (!creatorSection && editSections.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          Keine Verlaufshistorie verfügbar.
        </Typography>
      );
    }
    
    return (
      <>
        {creatorSection}
        {editSections.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {editSections}
          </Box>
        )}
      </>
    );
  };

  const creator = history.find(entry => entry.action === 'created');
  const creatorInfo = creator ? (
    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
      <PersonIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'success.main' }} />
      Erstellt von: 
      <Box component="span" sx={{ ml: 0.5, fontWeight: 'medium', color: 'success.main' }}>
        {creator.member_name}
      </Box>
      <Box component="span" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.9rem' }}>
        {formatDateTime(creator.timestamp)}
      </Box>
    </Typography>
  ) : (
    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
      <PersonIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: 'success.main' }} />
      Keine Erstellerinformation
    </Typography>
  );

  return (
    <>
      <Accordion 
        defaultExpanded={false} 
        sx={{ 
          mt: 2, 
          mb: 2, 
          width: '100%',
          '& .MuiAccordionSummary-root': {
            borderLeft: '3px solid #4caf50'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            '&.Mui-expanded': {
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            {creatorInfo}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'success.main',
                  fontWeight: 'bold',
                  mr: 1
                }}
              >
                <HistoryIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                Verlaufshistorie
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !history || history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Verlaufshistorie verfügbar.
            </Typography>
          ) : !Array.isArray(history) ? (
            <Typography variant="body2" color="text.secondary">
              Verlaufshistorie im falschen Format.
            </Typography>
          ) : (
            <Box sx={{ width: '100%' }}>
              {renderHistoryContent()}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Info-Icon außerhalb des Accordions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
        <Tooltip title="Zeigt die vollständige Änderungshistorie dieses Datensatzes an, inklusive Erstellung und nachfolgenden Bearbeitungen.">
          <IconButton 
            size="small" 
            onClick={(e) => setHistoryInfoAnchorEl(e.currentTarget)}
          >
            <InfoIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      </Box>

      <Popover
        open={Boolean(historyInfoAnchorEl)}
        anchorEl={historyInfoAnchorEl}
        onClose={() => setHistoryInfoAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 350 }}>
          <Typography variant="subtitle2" gutterBottom>
            Verlaufshistorie
          </Typography>
          <Typography variant="body2">
            Hier sehen Sie die komplette Änderungshistorie dieser Cannabis-Sorte, beginnend mit 
            der ersten Erstellung bis hin zu allen nachfolgenden Bearbeitungen.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Jede Änderung wird mit Zeitstempel und dem verantwortlichen Mitglied protokolliert, 
            was eine vollständige Nachverfolgbarkeit aller Aktivitäten gewährleistet.
          </Typography>
        </Box>
      </Popover>
    </>
  );
}