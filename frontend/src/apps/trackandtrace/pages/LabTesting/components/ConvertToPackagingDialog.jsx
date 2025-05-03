// frontend/src/apps/trackandtrace/pages/LabTesting/components/ConvertToPackagingDialog.jsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  FormHelperText,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import InfoIcon from '@mui/icons-material/Info';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const ConvertToPackagingDialog = ({
  open,
  onClose,
  onConvert,
  labTesting,
  members,
  rooms,
  loadingOptions
}) => {
  // Standardoptionen für Verpackungsgrößen in Gramm
  const packageSizeOptions = [
    { value: 5, label: '5g Verpackungen' },
    { value: 10, label: '10g Verpackungen' },
    { value: 15, label: '15g Verpackungen' },
    { value: 'custom', label: 'Individuelle Größe' }
  ];

  const [totalWeight, setTotalWeight] = useState('');
  const [packageSize, setPackageSize] = useState(5); // 5g als Standard
  const [customPackageSize, setCustomPackageSize] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [remainingWeight, setRemainingWeight] = useState(0);
  const [notes, setNotes] = useState('');
  const [memberId, setMemberId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  
  // Berechnete Werte
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isWeightValid, setIsWeightValid] = useState(false);

  useEffect(() => {
    if (open && labTesting) {
      // Setze Standardwerte: Standardmäßig das gesamte verbleibende Gewicht konvertieren
      const availableWeight = parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight);
      setTotalWeight(availableWeight.toString());
      
      // Standard-Verpackungsgröße auf 5g setzen
      setPackageSize(5);
      setCustomPackageSize('');
      
      // Berechne die Anzahl der Einheiten basierend auf der Standardgröße
      const calculatedUnits = Math.floor(availableWeight / 5);
      setUnitCount(calculatedUnits.toString());
      
      // Berechne Restmenge
      const usedWeight = calculatedUnits * 5;
      setRemainingWeight(Math.max(0, availableWeight - usedWeight).toFixed(2));
      
      // Zurücksetzen der anderen Felder
      setNotes(`Verpackung in 5g Einheiten. Verbleibende ${(availableWeight - usedWeight).toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
      setMemberId('');
      setRoomId('');
      setError('');
      
      // Kalkulierte Werte aktualisieren
      setCalculatedTotal(usedWeight);
      setIsWeightValid(true);
    }
  }, [open, labTesting]);
  
  // Aktualisiere Berechnungen bei Änderung der Verpackungsgröße
  useEffect(() => {
    if (packageSize !== 'custom' && totalWeight) {
      const availableWeight = parseFloat(totalWeight);
      if (!isNaN(availableWeight)) {
        // Berechne maximale Anzahl ganzer Einheiten
        const sizeValue = parseFloat(packageSize);
        const maxUnits = Math.floor(availableWeight / sizeValue);
        
        setUnitCount(maxUnits.toString());
        
        // Berechne verwendetes Gewicht und Restmenge
        const usedWeight = maxUnits * sizeValue;
        setRemainingWeight((availableWeight - usedWeight).toFixed(2));
        setCalculatedTotal(usedWeight);
        
        // Aktualisiere Notizen mit Standardtext
        setNotes(`Verpackung in ${sizeValue}g Einheiten. Verbleibende ${(availableWeight - usedWeight).toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
        
        setIsWeightValid(true);
      }
    }
  }, [packageSize, totalWeight]);
  
  // Aktualisiere Berechnungen bei Änderung der individuellen Größe
  useEffect(() => {
    if (packageSize === 'custom' && customPackageSize && totalWeight) {
      const customSize = parseFloat(customPackageSize);
      const availableWeight = parseFloat(totalWeight);
      
      if (!isNaN(customSize) && !isNaN(availableWeight) && customSize >= 5) {
        // Berechne maximale Anzahl ganzer Einheiten
        const maxUnits = Math.floor(availableWeight / customSize);
        
        setUnitCount(maxUnits.toString());
        
        // Berechne verwendetes Gewicht und Restmenge
        const usedWeight = maxUnits * customSize;
        setRemainingWeight((availableWeight - usedWeight).toFixed(2));
        setCalculatedTotal(usedWeight);
        
        // Aktualisiere Notizen mit Standardtext
        setNotes(`Verpackung in individuellen ${customSize}g Einheiten. Verbleibende ${(availableWeight - usedWeight).toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
        
        setIsWeightValid(true);
      } else {
        setIsWeightValid(false);
      }
    }
  }, [customPackageSize, packageSize, totalWeight]);
  
  // Aktualisiere Berechnungen bei Änderung der Einheitenzahl
  useEffect(() => {
    if (unitCount && totalWeight) {
      const units = parseInt(unitCount);
      const availableWeight = parseFloat(totalWeight);
      
      if (!isNaN(units) && !isNaN(availableWeight) && units > 0) {
        const size = packageSize === 'custom' ? parseFloat(customPackageSize) : parseFloat(packageSize);
        
        if (!isNaN(size) && size >= 5) {
          // Berechne verwendetes Gewicht und Restmenge
          const usedWeight = units * size;
          
          if (usedWeight <= availableWeight) {
            setRemainingWeight((availableWeight - usedWeight).toFixed(2));
            setCalculatedTotal(usedWeight);
            
            // Aktualisiere Notizen
            setNotes(`Verpackung in ${size}g Einheiten. Verbleibende ${(availableWeight - usedWeight).toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
            
            setIsWeightValid(true);
          } else {
            setIsWeightValid(false);
          }
        }
      }
    }
  }, [unitCount, packageSize, customPackageSize, totalWeight]);

  const handlePackageSizeChange = (event) => {
    const newSize = event.target.value;
    setPackageSize(newSize);
    
    // Wenn eine vordefinierte Größe gewählt wird, setze das individuelle Feld zurück
    if (newSize !== 'custom') {
      setCustomPackageSize('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Ermittle die tatsächliche Verpackungsgröße
    const actualPackageSize = packageSize === 'custom' ? parseFloat(customPackageSize) : parseFloat(packageSize);
    
    // Validierung
    if (!totalWeight || parseFloat(totalWeight) <= 0) {
      setError('Bitte geben Sie ein gültiges Gesamtgewicht ein');
      return;
    }
    
    if (packageSize === 'custom' && (!customPackageSize || parseFloat(customPackageSize) < 5)) {
      setError('Die individuelle Verpackungsgröße muss mindestens 5g betragen');
      return;
    }
    
    if (!unitCount || parseInt(unitCount) <= 0) {
      setError('Die Anzahl der Einheiten muss größer als 0 sein');
      return;
    }
    
    if (!memberId) {
      setError('Bitte wählen Sie ein verantwortliches Mitglied aus');
      return;
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus');
      return;
    }
    
    // Submit-Daten
    const formData = {
      total_weight: calculatedTotal,
      unit_count: parseInt(unitCount),
      unit_weight: actualPackageSize,
      notes: notes,
      member_id: memberId,
      room_id: roomId,
      remaining_weight: parseFloat(remainingWeight),
      auto_destroy_remainder: true  // Automatische Vernichtung der Restmenge aktivieren
    };
    
    onConvert(formData);
  };

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6">Zu Verpackung konvertieren</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {labTesting && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Laborkontrolle-Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Genetik:
                </Typography>
                <Typography variant="body2">
                  {labTesting.source_strain || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Produkttyp:
                </Typography>
                <Typography variant="body2">
                  {labTesting.product_type === 'marijuana' ? 'Marihuana' : 
                   labTesting.product_type === 'hashish' ? 'Haschisch' : 
                   labTesting.product_type || "Unbekannt"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  THC-Gehalt:
                </Typography>
                <Typography variant="body2">
                  {labTesting.thc_content ? `${labTesting.thc_content}%` : "Nicht getestet"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verfügbares Gewicht:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {labTesting ? (parseFloat(labTesting.input_weight) - parseFloat(labTesting.sample_weight)).toLocaleString('de-DE') : 0}g
                </Typography>
              </Box>
            </Box>
          )}
          
          <TextField
            margin="dense"
            id="total-weight"
            label="Gesamtgewicht (g)"
            type="number"
            fullWidth
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
            required
            inputProps={{ min: 0.01, step: 0.01 }}
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={true} // Das Gesamtgewicht ist fix vom Labor-Test
            helperText="Gesamtgewicht aus der Laborkontrolle (kann nicht geändert werden)"
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="package-size-label">Verpackungsgröße</InputLabel>
            <Select
              labelId="package-size-label"
              id="package-size"
              value={packageSize}
              onChange={handlePackageSizeChange}
              label="Verpackungsgröße"
            >
              {packageSizeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Wählen Sie eine Standardgröße oder "Individuelle Größe" (min. 5g)
            </FormHelperText>
          </FormControl>
          
          {packageSize === 'custom' && (
            <TextField
              margin="dense"
              id="custom-package-size"
              label="Individuelle Verpackungsgröße (g)"
              type="number"
              fullWidth
              value={customPackageSize}
              onChange={(e) => setCustomPackageSize(e.target.value)}
              required
              inputProps={{ min: 5, step: 0.1 }}
              variant="outlined"
              sx={{ mb: 2 }}
              error={customPackageSize !== '' && parseFloat(customPackageSize) < 5}
              helperText="Die Mindestgröße für Verpackungen beträgt 5g"
            />
          )}
          
          <TextField
            margin="dense"
            id="unit-count"
            label="Anzahl der Einheiten"
            type="number"
            fullWidth
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            required
            inputProps={{ min: 1, step: 1 }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, fontSize: 20 }} />
              Berechnete Werte
            </Typography>
            
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verpackungsgröße:
                </Typography>
                <Typography variant="body2">
                  {packageSize === 'custom' ? `${customPackageSize}g (individuell)` : `${packageSize}g (Standard)`}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Anzahl Einheiten:
                </Typography>
                <Typography variant="body2">
                  {unitCount || '0'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Verpacktes Gewicht:
                </Typography>
                <Typography variant="body2">
                  {calculatedTotal.toFixed(2)}g
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Restmenge (wird vernichtet):
                </Typography>
                <Typography variant="body2" sx={{ color: remainingWeight > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>
                  {remainingWeight}g
                </Typography>
              </Box>
            </Box>
            
            {remainingWeight > 0 && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LocalFireDepartmentIcon sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
                <Typography variant="caption" color="error">
                  Die Restmenge wird automatisch zur Vernichtung markiert
                </Typography>
              </Box>
            )}
          </Box>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="member-label">Verantwortliches Mitglied</InputLabel>
            <Select
              labelId="member-label"
              id="member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              label="Verantwortliches Mitglied"
              required
              disabled={loadingOptions}
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.display_name || `${member.first_name} ${member.last_name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="room-label">Raum</InputLabel>
            <Select
              labelId="room-label"
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              label="Raum"
              required
              disabled={loadingOptions}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            id="notes"
            label="Notizen"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
          />
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="success"
            startIcon={<InventoryIcon />}
            disabled={!isWeightValid}
          >
            Zu Verpackung konvertieren
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConvertToPackagingDialog;