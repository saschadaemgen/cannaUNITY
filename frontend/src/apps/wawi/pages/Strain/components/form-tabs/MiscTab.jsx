// frontend/src/apps/wawi/pages/Strain/components/form-tabs/MiscTab.jsx
import { Stack, TextField, Box, Typography } from '@mui/material';
import { StyledRating } from '../shared/StyledComponents';

export default function MiscTab({ formData, handleChange, handleRatingChange }) {
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
        <TextField
          label="Jahr der Markteinführung"
          name="release_year"
          type="number"
          value={formData.release_year}
          onChange={handleChange}
          fullWidth
          inputProps={{ min: 1970, max: new Date().getFullYear() }}
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography component="legend" gutterBottom>Bewertung</Typography>
          <StyledRating
            name="rating"
            value={formData.rating}
            precision={0.5}
            onChange={handleRatingChange}
            size="large"
          />
        </Box>
      </Stack>
      
      <TextField
        label="Auszeichnungen/Awards"
        name="awards"
        value={formData.awards}
        onChange={handleChange}
        fullWidth
        multiline
        rows={4}
        placeholder="Geben Sie hier Auszeichnungen und Awards ein..."
      />
    </Stack>
  );
}