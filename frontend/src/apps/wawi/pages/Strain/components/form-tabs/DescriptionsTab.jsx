// frontend/src/apps/wawi/pages/Strain/components/form-tabs/DescriptionsTab.jsx
import { Stack, TextField } from '@mui/material';

export default function DescriptionsTab({ formData, handleChange }) {
  return (
    <Stack spacing={3}>
      <TextField
        label="Allgemeine Informationen"
        name="general_information"
        value={formData.general_information}
        onChange={handleChange}
        fullWidth
        multiline
        rows={6}
        placeholder="Geben Sie hier allgemeine Informationen zur Sorte ein..."
      />
      
      <TextField
        label="Anbauspezifische Informationen"
        name="growing_information"
        value={formData.growing_information}
        onChange={handleChange}
        fullWidth
        multiline
        rows={6}
        placeholder="Geben Sie hier anbauspezifische Informationen zur Sorte ein..."
      />
    </Stack>
  );
}