// frontend/src/apps/trackandtrace/components/common/TabsHeader.jsx
import { Paper, Tabs, Tab, Divider, Box } from '@mui/material'

/**
 * TabsHeader Komponente für die Tab-Navigation
 * 
 * @param {number} tabValue - Aktueller Tab-Index
 * @param {function} onTabChange - Handler für Tab-Wechsel
 * @param {Array} tabs - Array mit Tab-Konfigurationen (label)
 * @param {string} color - Primärfarbe für die Tabs (default: 'success')
 * @param {string} ariaLabel - ARIA-Label für die Tabs
 */
const TabsHeader = ({ 
  tabValue, 
  onTabChange, 
  tabs, 
  color = 'success',
  ariaLabel = 'tabs'
}) => {
  return (
    // Aktualisiere die Paper-Komponente, um 100% Breite zu verwenden
    <Paper sx={{ mb: 2, width: '100%', overflow: 'hidden', borderRadius: 0 }}>
      <Tabs 
        value={tabValue} 
        onChange={onTabChange} 
        aria-label={ariaLabel}
        variant="fullWidth" // Wichtig: Tabs nehmen die volle Breite ein
        sx={{
          '& .MuiTabs-indicator': { height: '3px' },
          '& .MuiTab-root': { 
            minWidth: 0, // Erlaubt schmalere Tabs
            padding: '12px 8px', // Reduzierte Polsterung
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' }, // Responsive Schriftgröße
            position: 'relative' // Wichtig für die positionierung der Divider
          },
          '& .MuiTab-root:not(:last-child)::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: '20%', // Beginnt bei 20% von oben
            height: '60%', // Nimmt 60% der Höhe ein
            width: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)' // Hellgrauer Trennstrich
          }
        }}
      >
        {tabs.map((tab, index) => (
          <Tab 
            key={index}
            label={tab.label}
            sx={{ 
              color: tabValue === index ? `${color}.main` : 'text.primary',
              '&.Mui-selected': {
                color: `${color}.main`,
                fontWeight: 700
              },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          />
        ))}
      </Tabs>
    </Paper>
  )
}

export default TabsHeader