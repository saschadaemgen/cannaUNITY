// frontend/src/apps/trackandtrace/components/common/TabsHeader.jsx
import { Paper, Tabs, Tab } from '@mui/material'

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
    <Paper sx={{ mb: 2, width: '100%', overflow: 'hidden', borderRadius: 0 }}>
      <Tabs 
        value={tabValue} 
        onChange={onTabChange} 
        aria-label={ariaLabel}
        sx={{
          '& .MuiTabs-indicator': { height: '3px' }
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
              whiteSpace: 'nowrap'
            }}
          />
        ))}
      </Tabs>
    </Paper>
  )
}

export default TabsHeader