// frontend/src/apps/wawi/pages/Strain/components/form-tabs/CannabinoidsTab.jsx
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Typography,
  Slider,
  Divider,
  FormHelperText,
  Chip
} from '@mui/material';

export default function CannabinoidsTab({ 
  formData, 
  handleChange, 
  handleDirectValueChange,
  errors,
  availableTerpenes = []
}) {
  return (
    <Stack spacing={3}>
      <Divider>THC & CBD-Gehalt</Divider>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>THC-Gehalt (%)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="thc_percentage_min"
            type="number"
            value={formData.thc_percentage_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 0, max: formData.thc_percentage_max, step: 0.1 }}
            error={!!errors.thc_percentage_min}
          />
          
          <Slider
            value={[formData.thc_percentage_min, formData.thc_percentage_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('thc_percentage_min', newValue[0]);
              handleDirectValueChange('thc_percentage_max', newValue[1]);
            }}
            min={0}
            max={35}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}%`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="thc_percentage_max"
            type="number"
            value={formData.thc_percentage_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.thc_percentage_min, max: 35, step: 0.1 }}
            error={!!errors.thc_percentage_max}
          />
        </Stack>
        {(errors.thc_percentage_min || errors.thc_percentage_max) && (
          <FormHelperText error>
            {errors.thc_percentage_min || errors.thc_percentage_max}
          </FormHelperText>
        )}
      </Box>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>CBD-Gehalt (%)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="cbd_percentage_min"
            type="number"
            value={formData.cbd_percentage_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 0, max: formData.cbd_percentage_max, step: 0.1 }}
            error={!!errors.cbd_percentage_min}
          />
          
          <Slider
            value={[formData.cbd_percentage_min, formData.cbd_percentage_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('cbd_percentage_min', newValue[0]);
              handleDirectValueChange('cbd_percentage_max', newValue[1]);
            }}
            min={0}
            max={25}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}%`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="cbd_percentage_max"
            type="number"
            value={formData.cbd_percentage_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.cbd_percentage_min, max: 25, step: 0.1 }}
            error={!!errors.cbd_percentage_max}
          />
        </Stack>
        {(errors.cbd_percentage_min || errors.cbd_percentage_max) && (
          <FormHelperText error>
            {errors.cbd_percentage_min || errors.cbd_percentage_max}
          </FormHelperText>
        )}
      </Box>
      
      <Divider>Terpenprofil</Divider>
      
      <FormControl fullWidth>
        <InputLabel>Dominante Terpene</InputLabel>
        <Select
          multiple
          name="dominant_terpenes"
          value={formData.dominant_terpenes ? formData.dominant_terpenes.split(',').map(t => t.trim()).filter(Boolean) : []}
          onChange={(e) => {
            handleDirectValueChange('dominant_terpenes', e.target.value.join(', '));
          }}
          input={<OutlinedInput label="Dominante Terpene" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          {/* Standard Terpene */}
          <MenuItem value="Myrcen">Myrcen</MenuItem>
          <MenuItem value="Limonen">Limonen</MenuItem>
          <MenuItem value="Caryophyllen">Caryophyllen</MenuItem>
          <MenuItem value="Pinen">Pinen</MenuItem>
          <MenuItem value="Linalool">Linalool</MenuItem>
          <MenuItem value="Humulen">Humulen</MenuItem>
          <MenuItem value="Terpinolen">Terpinolen</MenuItem>
          <MenuItem value="Ocimen">Ocimen</MenuItem>
          
          {/* Dynamisch geladene Terpene */}
          {availableTerpenes
            .filter(terpene => !['Myrcen', 'Limonen', 'Caryophyllen', 'Pinen', 'Linalool', 'Humulen', 'Terpinolen', 'Ocimen'].includes(terpene))
            .map(terpene => (
              <MenuItem key={terpene} value={terpene}>{terpene}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
      
      <TextField
        label="Andere Terpene (Komma-getrennt)"
        name="dominant_terpenes"
        value={formData.dominant_terpenes}
        onChange={handleChange}
        fullWidth
        margin="normal"
        helperText="Geben Sie die Terpene direkt ein oder wählen Sie aus dem Dropdown oben"
      />
    </Stack>
  );
}