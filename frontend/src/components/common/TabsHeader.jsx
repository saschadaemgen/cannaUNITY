// frontend/src/apps/wawi/components/common/TabsHeader.jsx
import { Paper, Tabs, Tab, Box, Typography } from '@mui/material'

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
        variant="fullWidth"
        sx={{
          '& .MuiTabs-indicator': { height: '3px' },
          '& .MuiTab-root': { 
            minWidth: 0,
            padding: '12px 8px', 
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' },
            position: 'relative'
          },
          '& .MuiTab-root:not(:last-child)::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: '20%',
            height: '60%',
            width: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)'
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