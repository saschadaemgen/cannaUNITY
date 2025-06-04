// frontend/src/apps/wawi/pages/Strain/components/form-tabs/GrowthTab.jsx
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Slider,
  Divider,
  FormHelperText
} from '@mui/material';

export default function GrowthTab({ 
  formData, 
  handleChange, 
  handleDirectValueChange,
  handleSliderChange,
  errors 
}) {
  return (
    <Stack spacing={3}>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Blütezeit (Tage)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="flowering_time_min"
            type="number"
            value={formData.flowering_time_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 30, max: formData.flowering_time_max }}
            error={!!errors.flowering_time_min}
          />
          
          <Slider
            value={[formData.flowering_time_min, formData.flowering_time_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('flowering_time_min', newValue[0]);
              handleDirectValueChange('flowering_time_max', newValue[1]);
            }}
            min={30}
            max={120}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} Tage`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="flowering_time_max"
            type="number"
            value={formData.flowering_time_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.flowering_time_min, max: 120 }}
            error={!!errors.flowering_time_max}
          />
        </Stack>
        {(errors.flowering_time_min || errors.flowering_time_max) && (
          <FormHelperText error>
            {errors.flowering_time_min || errors.flowering_time_max}
          </FormHelperText>
        )}
      </Box>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Schwierigkeitsgrad</InputLabel>
        <Select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          label="Schwierigkeitsgrad"
        >
          <MenuItem value="beginner">Anfänger</MenuItem>
          <MenuItem value="intermediate">Mittel</MenuItem>
          <MenuItem value="advanced">Fortgeschritten</MenuItem>
          <MenuItem value="expert">Experte</MenuItem>
        </Select>
      </FormControl>
      
      <Divider>Indoor-Wachstum</Divider>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Höhe Indoor (cm)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="height_indoor_min"
            type="number"
            value={formData.height_indoor_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 20, max: formData.height_indoor_max, step: 5 }}
            error={!!errors.height_indoor_min}
          />
          
          <Slider
            value={[formData.height_indoor_min, formData.height_indoor_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('height_indoor_min', newValue[0]);
              handleDirectValueChange('height_indoor_max', newValue[1]);
            }}
            min={20}
            max={400}
            step={5}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} cm`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="height_indoor_max"
            type="number"
            value={formData.height_indoor_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.height_indoor_min, max: 400, step: 5 }}
            error={!!errors.height_indoor_max}
          />
        </Stack>
      </Box>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Ertrag Indoor (g/m²)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="yield_indoor_min"
            type="number"
            value={formData.yield_indoor_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 50, max: formData.yield_indoor_max, step: 10 }}
            error={!!errors.yield_indoor_min}
          />
          
          <Slider
            value={[formData.yield_indoor_min, formData.yield_indoor_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('yield_indoor_min', newValue[0]);
              handleDirectValueChange('yield_indoor_max', newValue[1]);
            }}
            min={50}
            max={1000}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} g/m²`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="yield_indoor_max"
            type="number"
            value={formData.yield_indoor_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.yield_indoor_min, max: 1000, step: 10 }}
            error={!!errors.yield_indoor_max}
          />
        </Stack>
      </Box>
      
      <Divider>Outdoor-Wachstum</Divider>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Höhe Outdoor (cm)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="height_outdoor_min"
            type="number"
            value={formData.height_outdoor_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 50, max: formData.height_outdoor_max, step: 10 }}
            error={!!errors.height_outdoor_min}
          />
          
          <Slider
            value={[formData.height_outdoor_min, formData.height_outdoor_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('height_outdoor_min', newValue[0]);
              handleDirectValueChange('height_outdoor_max', newValue[1]);
            }}
            min={50}
            max={500}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} cm`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="height_outdoor_max"
            type="number"
            value={formData.height_outdoor_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.height_outdoor_min, max: 500, step: 10 }}
            error={!!errors.height_outdoor_max}
          />
        </Stack>
      </Box>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Ertrag Outdoor (g/Pflanze)</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Minimum"
            name="yield_outdoor_min"
            type="number"
            value={formData.yield_outdoor_min}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: 50, max: formData.yield_outdoor_max, step: 50 }}
            error={!!errors.yield_outdoor_min}
          />
          
          <Slider
            value={[formData.yield_outdoor_min, formData.yield_outdoor_max]}
            onChange={(e, newValue) => {
              handleDirectValueChange('yield_outdoor_min', newValue[0]);
              handleDirectValueChange('yield_outdoor_max', newValue[1]);
            }}
            min={50}
            max={2000}
            step={50}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} g/Pflanze`}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          
          <TextField
            label="Maximum"
            name="yield_outdoor_max"
            type="number"
            value={formData.yield_outdoor_max}
            onChange={handleChange}
            size="small"
            sx={{ width: '120px' }}
            inputProps={{ min: formData.yield_outdoor_min, max: 2000, step: 50 }}
            error={!!errors.yield_outdoor_max}
          />
        </Stack>
      </Box>
      
      <Divider>Wachstumsumgebung</Divider>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Geeignetes Klima</InputLabel>
          <Select
            name="suitable_climate"
            value={formData.suitable_climate}
            onChange={handleChange}
            label="Geeignetes Klima"
          >
            <MenuItem value="indoor">Indoor</MenuItem>
            <MenuItem value="outdoor">Outdoor</MenuItem>
            <MenuItem value="greenhouse">Gewächshaus</MenuItem>
            <MenuItem value="all">Alle</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Bevorzugte Anbaumethode</InputLabel>
          <Select
            name="growing_method"
            value={formData.growing_method}
            onChange={handleChange}
            label="Bevorzugte Anbaumethode"
          >
            <MenuItem value="soil">Erde</MenuItem>
            <MenuItem value="hydro">Hydrokultur</MenuItem>
            <MenuItem value="coco">Kokos</MenuItem>
            <MenuItem value="all">Alle</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      
      <Divider>Resistenzen</Divider>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
        <Box sx={{ width: '100%' }}>
          <Typography gutterBottom>Schimmelresistenz: {formData.resistance_mold}/5</Typography>
          <Slider
            value={formData.resistance_mold}
            onChange={handleSliderChange('resistance_mold')}
            aria-labelledby="mold-resistance-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={5}
          />
        </Box>
        
        <Box sx={{ width: '100%' }}>
          <Typography gutterBottom>Schädlingsresistenz: {formData.resistance_pests}/5</Typography>
          <Slider
            value={formData.resistance_pests}
            onChange={handleSliderChange('resistance_pests')}
            aria-labelledby="pest-resistance-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={5}
          />
        </Box>
        
        <Box sx={{ width: '100%' }}>
          <Typography gutterBottom>Kälteresistenz: {formData.resistance_cold}/5</Typography>
          <Slider
            value={formData.resistance_cold}
            onChange={handleSliderChange('resistance_cold')}
            aria-labelledby="cold-resistance-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={5}
          />
        </Box>
      </Stack>
    </Stack>
  );
}