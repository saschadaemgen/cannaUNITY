// frontend/src/apps/trackandtrace/components/common/FilterSection.jsx
import { 
    Paper, Grid, TextField, FormControl, InputLabel, 
    Select, MenuItem, Button, InputAdornment, IconButton 
  } from '@mui/material'
  import ClearIcon from '@mui/icons-material/Clear'
  
  /**
   * FilterSection Komponente für die Filter-Bedienelemente
   * 
   * @param {string} yearFilter - Jahr-Filter
   * @param {function} setYearFilter - Jahr-Filter setzen
   * @param {string} monthFilter - Monats-Filter
   * @param {function} setMonthFilter - Monats-Filter setzen
   * @param {string} dayFilter - Tag-Filter
   * @param {function} setDayFilter - Tag-Filter setzen
   * @param {function} onApply - Handler für "Filter anwenden"
   * @param {function} onReset - Handler für "Zurücksetzen"
   * @param {boolean} showFilters - Gibt an, ob Filter angezeigt werden
   */
  const FilterSection = ({
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    dayFilter,
    setDayFilter,
    onApply,
    onReset,
    showFilters
  }) => {
    if (!showFilters) return null
  
    return (
      <Paper sx={{ mb: 2, p: 2, width: '100%' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
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
          <Grid item xs={12} sm={3}>
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
          <Grid item xs={12} sm={2}>
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
          <Grid item xs={12} sm={4} container spacing={1} justifyContent="flex-end">
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