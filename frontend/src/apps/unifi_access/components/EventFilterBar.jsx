import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
  } from '@mui/material'
  
  export default function EventFilterBar({ filters, setFilters }) {
    const handleChange = (key) => (event) => {
      setFilters((prev) => ({ ...prev, [key]: event.target.value }))
    }
  
    return (
      <Box sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        mb: 2,
        alignItems: 'center'
      }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Zeitraum</InputLabel>
          <Select
            value={filters.timeframe}
            onChange={handleChange('timeframe')}
            label="Zeitraum"
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="today">Heute</MenuItem>
            <MenuItem value="week">Diese Woche</MenuItem>
            <MenuItem value="month">Dieser Monat</MenuItem>
          </Select>
        </FormControl>
  
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Authentifizierung</InputLabel>
          <Select
            value={filters.authMethod}
            onChange={handleChange('authMethod')}
            label="Authentifizierung"
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="NFC">NFC</MenuItem>
            <MenuItem value="Face">Gesicht</MenuItem>
            <MenuItem value="Manual">Manuell</MenuItem>
          </Select>
        </FormControl>
  
        <TextField
          size="small"
          label="Name oder Tür"
          value={filters.search}
          onChange={handleChange('search')}
        />
      </Box>
    )
  }
  