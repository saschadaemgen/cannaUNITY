// frontend/src/apps/wawi/pages/Strain/components/form-components/PriceTierCard.jsx
import { Box, Paper, TextField, IconButton, Chip, Typography, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

export default function PriceTierCard({ 
  tier, 
  baseTier, 
  onUpdate, 
  onDelete, 
  onSetDefault,
  canDelete,
  isFirst 
}) {
  const unitPrice = tier.quantity > 0 ? (tier.totalPrice / tier.quantity).toFixed(2) : 0;
  
  // Rabatt relativ zur kleinsten Packung berechnen
  let discount = 0;
  let discountText = '';
  if (baseTier && !isFirst) {
    const baseUnitPrice = baseTier.totalPrice / baseTier.quantity;
    discount = Math.round(((baseUnitPrice - unitPrice) / baseUnitPrice) * 100);
    discountText = baseTier.tierName || `${baseTier.quantity}er Pack`;
  }

  const handleFieldChange = (field, value) => {
    onUpdate({
      ...tier,
      [field]: value
    });
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 1.5, 
        position: 'relative',
        border: tier.isDefault ? '2px solid' : '1px solid',
        borderColor: tier.isDefault ? 'success.main' : 'divider',
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Radio Button */}
        <IconButton 
          size="small" 
          onClick={onSetDefault}
          color={tier.isDefault ? 'success' : 'default'}
        >
          {tier.isDefault ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
        </IconButton>

        {/* Hauptzeile mit allen Informationen */}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Eingabefelder */}
            <TextField
              label="Bezeichnung"
              value={tier.tierName || ''}
              onChange={(e) => handleFieldChange('tierName', e.target.value)}
              size="small"
              sx={{ width: 200 }}
              placeholder="z.B. 4er Pack"
            />
            
            <TextField
              label="Menge"
              type="number"
              value={tier.quantity}
              onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 1)}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
              InputProps={{
                endAdornment: <Typography variant="caption">Samen</Typography>
              }}
            />
            
            <TextField
              label="Gesamtpreis"
              type="number"
              value={tier.totalPrice}
              onChange={(e) => handleFieldChange('totalPrice', parseFloat(e.target.value) || 0)}
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                endAdornment: <Typography variant="caption">€</Typography>
              }}
            />

            {/* Preis pro Samen */}
            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 120 }}>
              = {unitPrice} € pro Samen
            </Typography>

            {/* Rabatt-Chip */}
            {discount > 0 && !isFirst && (
              <Chip 
                label={`-${discount}% ggü. ${discountText}`} 
                color="success" 
                size="small" 
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            
            {tier.isDefault && (
              <Chip 
                label="Standardpreis" 
                color="success" 
                size="small"
              />
            )}
          </Stack>


        </Box>

        {/* Löschen Button */}
        {canDelete && (
          <IconButton 
            size="small" 
            onClick={onDelete}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
}