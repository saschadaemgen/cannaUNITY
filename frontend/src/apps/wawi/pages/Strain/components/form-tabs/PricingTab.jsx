// frontend/src/apps/wawi/pages/Strain/components/form-tabs/PricingTab.jsx
import { useState, useEffect } from 'react';
import {
  Stack,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import SpaIcon from '@mui/icons-material/Spa';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PriceTierCard from '../form-components/PriceTierCard';

export default function PricingTab({ 
  priceTiers = [], 
  onPriceTiersChange,
  initialData 
}) {
  const [tiers, setTiers] = useState(priceTiers);
  const [warnings, setWarnings] = useState([]);

  // Initialisiere mit einem Standard-Einzelpreis, wenn keine Preisstaffeln vorhanden
  useEffect(() => {
    if (tiers.length === 0) {
      const defaultTier = {
        id: `new-${Date.now()}`,
        tierName: '4er Packung',
        quantity: 4,
        totalPrice: 28.00,
        isDefault: true,
        isNew: true,
        // Platzhalter-Daten
        totalPurchasedQuantity: 0,
        floweringPlants: 0,
        motherPlants: 0,
        purchaseHistory: []
      };
      setTiers([defaultTier]);
      onPriceTiersChange([defaultTier]);
    }
  }, []);

  // Validierung der Preisstaffeln
  useEffect(() => {
    const newWarnings = [];
    
    // Prüfe auf doppelte Mengen
    const quantities = tiers.map(t => t.quantity);
    const duplicates = quantities.filter((q, i) => quantities.indexOf(q) !== i);
    if (duplicates.length > 0) {
      newWarnings.push(`Doppelte Mengenangaben gefunden: ${duplicates.join(', ')}`);
    }
    
    // Prüfe ob Stückpreise mit steigender Menge sinken
    const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevUnitPrice = sortedTiers[i-1].totalPrice / sortedTiers[i-1].quantity;
      const currUnitPrice = sortedTiers[i].totalPrice / sortedTiers[i].quantity;
      
      if (currUnitPrice >= prevUnitPrice) {
        newWarnings.push(
          `Der Stückpreis für ${sortedTiers[i].quantity} Samen (${currUnitPrice.toFixed(2)}€) ` +
          `sollte niedriger sein als für ${sortedTiers[i-1].quantity} Samen (${prevUnitPrice.toFixed(2)}€)`
        );
      }
    }
    
    setWarnings(newWarnings);
  }, [tiers]);

  const handleAddTier = () => {
    const nextQuantity = tiers.length === 0 ? 4 : Math.max(...tiers.map(t => t.quantity)) + 3;
    const newTier = {
      id: `new-${Date.now()}`,
      tierName: '',
      quantity: nextQuantity,
      totalPrice: 0,
      isDefault: false,
      isNew: true,
      // Platzhalter-Daten
      totalPurchasedQuantity: 0,
      floweringPlants: 0,
      motherPlants: 0,
      purchaseHistory: []
    };
    const updatedTiers = [...tiers, newTier];
    setTiers(updatedTiers);
    onPriceTiersChange(updatedTiers);
  };

  const handleUpdateTier = (tierId, updatedTier) => {
    const updatedTiers = tiers.map(t => t.id === tierId ? updatedTier : t);
    setTiers(updatedTiers);
    onPriceTiersChange(updatedTiers);
  };

  const handleDeleteTier = (tierId) => {
    const updatedTiers = tiers.filter(t => t.id !== tierId);
    
    // Wenn der gelöschte Tier der Standard war, setze den ersten als Standard
    if (tiers.find(t => t.id === tierId)?.isDefault && updatedTiers.length > 0) {
      updatedTiers[0].isDefault = true;
    }
    
    setTiers(updatedTiers);
    onPriceTiersChange(updatedTiers);
  };

  const handleSetDefaultTier = (tierId) => {
    const updatedTiers = tiers.map(t => ({
      ...t,
      isDefault: t.id === tierId
    }));
    setTiers(updatedTiers);
    onPriceTiersChange(updatedTiers);
  };

  // Sortiere Tiers nach Menge und finde die Basis-Staffel (kleinste Menge)
  const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
  const baseTier = sortedTiers[0];

  // Berechne Gesamtstatistiken
  const totalStats = tiers.reduce((acc, tier) => ({
    totalPurchased: acc.totalPurchased + ((tier.totalPurchasedQuantity || 0) * tier.quantity),
    totalFlowering: acc.totalFlowering + (tier.floweringPlants || 0),
    totalMother: acc.totalMother + (tier.motherPlants || 0)
  }), { totalPurchased: 0, totalFlowering: 0, totalMother: 0 });

  const totalAvailable = totalStats.totalPurchased - (totalStats.totalFlowering + totalStats.totalMother);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Kompakte Überschrift */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOfferIcon color="success" />
          Preisgestaltung & Staffelrabatte
        </Typography>
      </Box>

      {/* Gesamtübersicht oben - kompakt in einer Zeile */}
      {initialData.id && tiers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Gesamtübersicht aller Preisstaffeln
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Gesamt eingekauft:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {totalStats.totalPurchased} Samen
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Noch verfügbar:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: totalAvailable > 0 ? 'success.main' : 'text.primary' }}>
                {totalAvailable} Samen
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Blütepflanzen:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {totalStats.totalFlowering} Pflanzen
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Mutterpflanzen:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {totalStats.totalMother} Pflanzen
              </Typography>
            </Box>
          </Box>

          {/* Preisübersicht in einer Zeile */}
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                Preisübersicht:
              </Typography>
              {sortedTiers.map((tier, index) => {
                const unitPrice = tier.quantity > 0 ? (tier.totalPrice / tier.quantity).toFixed(2) : 0;
                let discount = 0;
                if (baseTier && index > 0) {
                  const baseUnitPrice = baseTier.totalPrice / baseTier.quantity;
                  discount = Math.round(((baseUnitPrice - unitPrice) / baseUnitPrice) * 100);
                }
                
                return (
                  <Box
                    key={tier.id}
                    sx={{ 
                      px: 1, 
                      py: 0.25, 
                      bgcolor: tier.isDefault ? 'transparent' : 'grey.100',
                      color: tier.isDefault ? 'success.main' : 'text.primary',
                      borderRadius: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: tier.isDefault ? 'bold' : 'normal',
                      border: tier.isDefault ? '1px solid' : 'none',
                      borderColor: tier.isDefault ? 'success.main' : 'transparent'
                    }}
                  >
                    {tier.quantity}× {tier.totalPrice.toFixed(2)}€ ({unitPrice}€/Stk)
                    {discount > 0 && <Box component="span" sx={{ fontWeight: 'bold' }}> -{discount}%</Box>}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {warnings.length > 0 && (
        <Alert severity="warning" icon={<TrendingDownIcon />} sx={{ mb: 2 }}>
          {warnings.map((warning, idx) => (
            <Typography key={idx} variant="body2">
              • {warning}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Preisstaffeln */}
      <Stack spacing={1.5}>
        {sortedTiers.map((tier, index) => (
          <PriceTierCard
            key={tier.id}
            tier={tier}
            baseTier={baseTier}
            isFirst={index === 0}
            onUpdate={(updated) => handleUpdateTier(tier.id, updated)}
            onDelete={() => handleDeleteTier(tier.id)}
            onSetDefault={() => handleSetDefaultTier(tier.id)}
            canDelete={tiers.length > 1}
          />
        ))}
      </Stack>

      <Button
        variant="outlined"
        color="success"
        startIcon={<AddIcon />}
        onClick={handleAddTier}
        fullWidth
        sx={{ mt: 1.5, py: 1 }}
      >
        Neue Preisstaffel hinzufügen
      </Button>

      {/* Zusammengefasste Einkaufs- und Bestandsübersicht */}
      {initialData.id && tiers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon fontSize="small" color="success" />
            Detaillierte Bestandsübersicht
          </Typography>
          
          {/* Für jede Preisstaffel */}
          {sortedTiers.map((tier) => {
            const purchasedSeeds = (tier.totalPurchasedQuantity || 0) * tier.quantity;
            const availableSeeds = purchasedSeeds - ((tier.floweringPlants || 0) + (tier.motherPlants || 0));
            
            return (
              <Box key={tier.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tier.tierName || `${tier.quantity}er Packung`}:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', pl: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ShoppingCartIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">Bereits eingekauft:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {tier.totalPurchasedQuantity || 0} Packungen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({purchasedSeeds} Samen)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">Daraus entstanden:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalFloristIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      <Typography variant="body2">
                        <strong>{tier.floweringPlants || 0}</strong> Blütepflanzen
                      </Typography>
                    </Box>
                    <Typography variant="body2">,</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SpaIcon fontSize="small" sx={{ color: 'success.main' }} />
                      <Typography variant="body2">
                        <strong>{tier.motherPlants || 0}</strong> Mutterpflanzen
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 'auto'
                  }}>
                    <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">
                      Noch verfügbar:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: availableSeeds > 0 ? 'success.main' : 'text.primary' }}>
                      {availableSeeds} Samen
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}