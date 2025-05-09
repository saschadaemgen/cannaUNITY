// frontend/src/apps/wawi/components/common/FilterSection.jsx
// Erweiterte FilterSection.jsx mit speziellen Filtern für Cannabis-Sorten
import { 
    Paper, Grid, TextField, FormControl, InputLabel, 
    Select, MenuItem, Button, InputAdornment, IconButton 
  } from '@mui/material'
  import ClearIcon from '@mui/icons-material/Clear'
  import SearchIcon from '@mui/icons-material/Search'
  
  const FilterSection = ({
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    dayFilter,
    setDayFilter,
    onApply,
    onReset,
    showFilters,
    // Neue Filtereigenschaften für Cannabis-Sorten
    strainTypeFilter,
    setStrainTypeFilter,
    searchQuery,
    setSearchQuery
  }) => {
    if (!showFilters) return null
  
    return (
      <Paper sx={{ mb: 2, p: 2, width: '100%' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Suche nach Name oder Hersteller"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Samentyp</InputLabel>
              <Select
                value={strainTypeFilter}
                label="Samentyp"
                onChange={(e) => setStrainTypeFilter(e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="feminized">Feminisiert</MenuItem>
                <MenuItem value="regular">Regulär</MenuItem>
                <MenuItem value="autoflower">Autoflower</MenuItem>
                <MenuItem value="f1_hybrid">F1 Hybrid</MenuItem>
                <MenuItem value="cbd">CBD-Samen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              label="Jahr"
              fullWidth
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              InputProps={{
                endAdornment: yearFilter && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setYearFilter('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth>
              <InputLabel>Monat</InputLabel>
              <Select
                value={monthFilter}
                label="Monat"
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('de-DE', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              label="Tag"
              fullWidth
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              type="number"
              inputProps={{ min: 1, max: 31 }}
              InputProps={{
                endAdornment: dayFilter && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setDayFilter('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} container spacing={1} justifyContent="flex-end">
            <Grid item>
              <Button variant="outlined" onClick={onReset}>
                Zurücksetzen
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={onApply}>
                Filter anwenden
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    )
  }
  
  export default FilterSection