// frontend/src/apps/wawi/pages/Strain/components/form-tabs/BasicInfoTab.jsx
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormHelperText
} from '@mui/material';
import { StyledSlider } from '../shared/StyledComponents';
import HistorySection from '../form-components/HistorySection';

export default function BasicInfoTab({ 
  formData, 
  handleChange, 
  handleSliderChange, 
  errors,
  initialData,
  history,
  historyLoading
}) {
  const sativaPercentage = 100 - formData.indica_percentage;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Sortenname"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        
        <TextField
          label="Hersteller/Züchter"
          name="breeder"
          value={formData.breeder}
          onChange={handleChange}
          fullWidth
          required
          error={!!errors.breeder}
          helperText={errors.breeder}
        />
      </Stack>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Genetische Herkunft"
          name="genetic_origin"
          value={formData.genetic_origin}
          onChange={handleChange}
          fullWidth
          placeholder="z.B. OG Kush x Sour Diesel"
        />
      </Stack>
      
      <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
        <Typography gutterBottom>
          Indica/Sativa Verhältnis: {formData.indica_percentage}% Indica / {sativaPercentage}% Sativa
        </Typography>
        
        <Box sx={{ mt: 1, mb: 3, width: '100%' }}>
          <StyledSlider
            value={formData.indica_percentage}
            onChange={handleSliderChange('indica_percentage')}
            aria-labelledby="indica-percentage-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}% Indica`}
            marks={[
              { value: 0, label: '100% Sativa' },
              { value: 50, label: '50/50' },
              { value: 100, label: '100% Indica' }
            ]}
          />
        </Box>
        
        {errors.indica_percentage && (
          <FormHelperText error>{errors.indica_percentage}</FormHelperText>
        )}
      </Box>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Samentyp</InputLabel>
          <Select
            name="strain_type"
            value={formData.strain_type}
            onChange={handleChange}
            label="Samentyp"
          >
            <MenuItem value="feminized">Feminisiert</MenuItem>
            <MenuItem value="regular">Regulär</MenuItem>
            <MenuItem value="autoflower">Autoflower</MenuItem>
            <MenuItem value="f1_hybrid">F1 Hybrid</MenuItem>
            <MenuItem value="cbd">CBD-Samen</MenuItem>
          </Select>
        </FormControl>
        
        {initialData.id && (
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="is_active"
              value={formData.is_active}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value={true}>Aktiv</MenuItem>
              <MenuItem value={false}>Inaktiv</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>
      
      {initialData.id && (
        <Box 
          sx={{ 
            p: 2, 
            mt: 2, 
            mb: 2, 
            bgcolor: 'info.light', 
            color: 'info.contrastText',
            borderRadius: 1,
            width: '100%'
          }}
        >
          <Typography variant="body2">
            <strong>Hinweis:</strong> Die Zuordnung des Mitglieds erfolgt automatisch beim Speichern per RFID-Autorisierung.
          </Typography>
        </Box>
      )}
      
      {initialData.id && (
        <HistorySection 
          history={history}
          historyLoading={historyLoading}
        />
      )}
    </Stack>
  );
}