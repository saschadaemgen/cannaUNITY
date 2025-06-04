// frontend/src/apps/wawi/pages/Strain/components/form-tabs/AromaEffectsTab.jsx
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Chip
} from '@mui/material';

export default function AromaEffectsTab({ 
  formData, 
  handleChange, 
  handleDirectValueChange,
  availableFlavors = [],
  availableEffects = []
}) {
  return (
    <Stack spacing={3}>
      <FormControl fullWidth>
        <InputLabel>Geschmacksrichtungen</InputLabel>
        <Select
          multiple
          name="flavors"
          value={formData.flavors ? formData.flavors.split(',').map(f => f.trim()).filter(Boolean) : []}
          onChange={(e) => {
            handleDirectValueChange('flavors', e.target.value.join(', '));
          }}
          input={<OutlinedInput label="Geschmacksrichtungen" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          {/* Standard Geschmacksrichtungen */}
          <MenuItem value="Süß">Süß</MenuItem>
          <MenuItem value="Sauer">Sauer</MenuItem>
          <MenuItem value="Würzig">Würzig</MenuItem>
          <MenuItem value="Erdig">Erdig</MenuItem>
          <MenuItem value="Holzig">Holzig</MenuItem>
          <MenuItem value="Kiefer">Kiefer</MenuItem>
          <MenuItem value="Zitrus">Zitrus</MenuItem>
          <MenuItem value="Beeren">Beeren</MenuItem>
          <MenuItem value="Trauben">Trauben</MenuItem>
          <MenuItem value="Tropisch">Tropisch</MenuItem>
          <MenuItem value="Diesel">Diesel</MenuItem>
          <MenuItem value="Käse">Käse</MenuItem>
          <MenuItem value="Kaffee">Kaffee</MenuItem>
          <MenuItem value="Minze">Minze</MenuItem>
          <MenuItem value="Ammoniak">Ammoniak</MenuItem>
          <MenuItem value="Skunk">Skunk</MenuItem>
          <MenuItem value="Blumig">Blumig</MenuItem>
          
          {/* Dynamisch geladene Geschmacksrichtungen */}
          {availableFlavors
            .filter(flavor => ![
              'Süß', 'Sauer', 'Würzig', 'Erdig', 'Holzig', 'Kiefer', 'Zitrus', 
              'Beeren', 'Trauben', 'Tropisch', 'Diesel', 'Käse', 'Kaffee', 
              'Minze', 'Ammoniak', 'Skunk', 'Blumig'
            ].includes(flavor))
            .map(flavor => (
              <MenuItem key={flavor} value={flavor}>{flavor}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
      
      <TextField
        label="Andere Geschmacksrichtungen (Komma-getrennt)"
        name="flavors"
        value={formData.flavors}
        onChange={handleChange}
        fullWidth
        margin="normal"
        helperText="Geben Sie die Geschmacksrichtungen direkt ein oder wählen Sie aus dem Dropdown oben"
      />
      
      <FormControl fullWidth>
        <InputLabel>Effekte/Wirkungen</InputLabel>
        <Select
          multiple
          name="effects"
          value={formData.effects ? formData.effects.split(',').map(e => e.trim()).filter(Boolean) : []}
          onChange={(e) => {
            handleDirectValueChange('effects', e.target.value.join(', '));
          }}
          input={<OutlinedInput label="Effekte/Wirkungen" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          {/* Standard Effekte */}
          <MenuItem value="Entspannend">Entspannend</MenuItem>
          <MenuItem value="Aufmunternd">Aufmunternd</MenuItem>
          <MenuItem value="Kreativ">Kreativ</MenuItem>
          <MenuItem value="Energetisch">Energetisch</MenuItem>
          <MenuItem value="Fokussiert">Fokussiert</MenuItem>
          <MenuItem value="Schläfrig">Schläfrig</MenuItem>
          <MenuItem value="Euphorisch">Euphorisch</MenuItem>
          <MenuItem value="Glücklich">Glücklich</MenuItem>
          <MenuItem value="Hungrig">Hungrig</MenuItem>
          <MenuItem value="Gesprächig">Gesprächig</MenuItem>
          
          {/* Dynamisch geladene Effekte */}
          {availableEffects
            .filter(effect => ![
              'Entspannend', 'Aufmunternd', 'Kreativ', 'Energetisch', 'Fokussiert', 
              'Schläfrig', 'Euphorisch', 'Glücklich', 'Hungrig', 'Gesprächig'
            ].includes(effect))
            .map(effect => (
              <MenuItem key={effect} value={effect}>{effect}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
      
      <TextField
        label="Andere Effekte (Komma-getrennt)"
        name="effects"
        value={formData.effects}
        onChange={handleChange}
        fullWidth
        margin="normal"
        helperText="Geben Sie die Effekte direkt ein oder wählen Sie aus dem Dropdown oben"
      />
    </Stack>
  );
}