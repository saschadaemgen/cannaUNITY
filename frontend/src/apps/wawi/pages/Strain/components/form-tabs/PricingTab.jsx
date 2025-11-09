// frontend/src/apps/wawi/pages/Strain/components/form-tabs/PricingTab.jsx
import { useState, useEffect } from 'react';
import {
  Stack,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Paper,
  CircularProgress
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
import api from '@/utils/api';

export default function PricingTab({ 
  priceTiers = [], 
  onPriceTiersChange,
  initialData 
}) {
  const [tiers, setTiers] = useState(priceTiers);
  const [warnings, setWarnings] = useState([]);
  const [trackTraceData, setTrackTraceData] = useState(null);
  const [loadingTrackTrace, setLoadingTrackTrace] = useState(false);

  // WICHTIG: Aktualisiere tiers wenn priceTiers von außen geändert werden
  useEffect(() => {
    console.log('PricingTab: priceTiers prop changed:', priceTiers);
    if (priceTiers.length > 0) {
      // Normalisiere die Daten für die interne Verwendung
      const normalizedTiers = priceTiers.map(tier => ({
        id: tier.id,
        tierName: tier.tierName || tier.tier_name,
        quantity: tier.quantity,
        totalPrice: parseFloat(tier.totalPrice || tier.total_price),
        isDefault: tier.isDefault || tier.is_default || false,
        isNew: tier.isNew || false,
        // API Daten
        totalPurchasedQuantity: tier.totalPurchasedQuantity || 0,
        floweringPlants: tier.floweringPlants || 0,
        motherPlants: tier.motherPlants || 0,
        purchaseHistory: tier.purchaseHistory || []
      }));
      setTiers(normalizedTiers);
    } else if (!initialData.id && priceTiers.length === 0 && tiers.length === 0) {
      // Nur bei neuen Einträgen UND wenn noch keine Tiers existieren
      const defaultTier = {
        id: `new-${Date.now()}`,
        tierName: '4er Packung',
        quantity: 4,
        totalPrice: 28.00,
        isDefault: true,
        isNew: true,
        totalPurchasedQuantity: 0,
        floweringPlants: 0,
        motherPlants: 0,
        purchaseHistory: []
      };
      setTiers([defaultTier]);
      onPriceTiersChange([defaultTier]);
    }
  }, [priceTiers, initialData.id]);

  // Lade Track and Trace Daten wenn eine Strain ID vorhanden ist
  useEffect(() => {
    if (initialData.id) {
      loadTrackTraceData();
    }
  }, [initialData.id]);

  const loadTrackTraceData = async () => {
    if (!initialData.id) return;
    
    setLoadingTrackTrace(true);
    try {
      const response = await api.get(`/wawi/strains/${initialData.id}/track_and_trace_stats/`);
      setTrackTraceData(response.data);
      console.log('Track and Trace Daten geladen:', response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Track and Trace Daten:', error);
      // Setze Standardwerte bei Fehler
      setTrackTraceData({
        total_purchased: 0,
        total_available: 0,
        mother_plants_count: 0,
        flowering_plants_count: 0,
        purchase_count: 0,
        purchase_details: []
      });
    } finally {
      setLoadingTrackTrace(false);
    }
  };

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
    // Wichtig: Änderungen nach außen kommunizieren
    onPriceTiersChange(updatedTiers);
  };

  const handleDeleteTier = (tierId) => {
    const updatedTiers = tiers.filter(t => t.id !== tierId);
    
    // Wenn der gelöschte Tier der Standard war, setze den ersten als Standard
    if (tiers.find(t => t.id === tierId)?.isDefault && updatedTiers.length > 0) {
      updatedTiers[0].isDefault = true;
    }
    
    setTiers(updatedTiers);
    // Wichtig: Änderungen nach außen kommunizieren
    onPriceTiersChange(updatedTiers);
  };

  const handleSetDefaultTier = (tierId) => {
    const updatedTiers = tiers.map(t => ({
      ...t,
      isDefault: t.id === tierId
    }));
    setTiers(updatedTiers);
    // Wichtig: Änderungen nach außen kommunizieren
    onPriceTiersChange(updatedTiers);
  };

  // Sortiere Tiers nach Menge und finde die Basis-Staffel (kleinste Menge)
  const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
  const baseTier = sortedTiers[0];

  // Verwende Track and Trace Daten wenn verfügbar, sonst Platzhalter
  const totalStats = {
    totalPurchased: trackTraceData?.total_purchased || 0,
    totalAvailable: trackTraceData?.total_available || 0,
    totalFlowering: trackTraceData?.flowering_plants_count || 0,
    totalMother: trackTraceData?.mother_plants_count || 0,
    purchaseCount: trackTraceData?.purchase_count || 0
  };

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
            Detaillierte Bestandsübersicht (Track & Trace Integration)
          </Typography>
          
          {loadingTrackTrace ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} color="success" />
            </Box>
          ) : (
            <>
              {/* Eine einzelne Zeile mit Gesamtübersicht */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShoppingCartIcon fontSize="small" sx={{ color: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary">Gesamt eingekauft:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {totalStats.totalPurchased} Samen
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({totalStats.purchaseCount} Einkäufe)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">Daraus entstanden:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocalFloristIcon fontSize="small" sx={{ color: 'warning.main' }} />
                    <Typography variant="body2">
                      <strong>{totalStats.totalFlowering}</strong> Blütepflanzen
                    </Typography>
                  </Box>
                  <Typography variant="body2">,</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SpaIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography variant="body2">
                      <strong>{totalStats.totalMother}</strong> Mutterpflanzen
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
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: totalStats.totalAvailable > 0 ? 'success.main' : 'text.primary' }}>
                    {totalStats.totalAvailable} Samen
                  </Typography>
                </Box>
              </Box>

              {/* Detaillierte Einkaufsliste bei Bedarf */}
              {trackTraceData?.purchase_details && trackTraceData.purchase_details.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                    Einkaufshistorie:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {trackTraceData.purchase_details.slice(0, 3).map((purchase, index) => (
                      <Box key={purchase.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(purchase.created_at).toLocaleDateString('de-DE')}:
                        </Typography>
                        <Typography variant="caption">
                          {purchase.quantity} Samen (Charge: {purchase.batch_number})
                        </Typography>
                        {purchase.member && (
                          <Typography variant="caption" color="text.secondary">
                            - {purchase.member}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {trackTraceData.purchase_details.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        ... und {trackTraceData.purchase_details.length - 3} weitere Einkäufe
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}