// frontend/src/apps/trackandtrace/pages/LabTesting/components/EnhancedConvertToPackagingDialog.jsx
import { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormHelperText,
  Alert,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InventoryIcon from '@mui/icons-material/Inventory';
import InfoIcon from '@mui/icons-material/Info';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalculateIcon from '@mui/icons-material/Calculate';
import api from '@/utils/api';

const EnhancedConvertToPackagingDialog = ({
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
    { value: 5, label: '5g' },
    { value: 10, label: '10g' },
    { value: 15, label: '15g' },
    { value: 20, label: '20g' },
    { value: 25, label: '25g' },
    { value: 50, label: '50g' },
    { value: 'custom', label: 'Individuell' }
  ];

  // Verfügbares Gesamtgewicht
  const [availableWeight, setAvailableWeight] = useState(0);
  
  // Array für Verpackungszeilen
  const [packagingLines, setPackagingLines] = useState([
    { id: 1, packageSize: 5, customSize: '', unitCount: 0, totalWeight: 0 }
  ]);
  
  // Restmengen-Berechnung
  const [remainingWeight, setRemainingWeight] = useState(0);
  const [notes, setNotes] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  // Gesamtberechnungen
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalPackagedWeight, setTotalPackagedWeight] = useState(0);
  
  // RFID-States
  const [scanMode, setScanMode] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedMemberName, setScannedMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isAborting, setIsAborting] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [memberIdFromRfid, setMemberIdFromRfid] = useState(null);
  
  // Debug Flag
  const DEBUG = true;
  
  // Debug-Logger
  const debugLog = (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  };
  
  // Initialisierung, wenn Dialog geöffnet wird
  useEffect(() => {
    if (open && labTesting) {
      // Setze verfügbares Gewicht
      const weight = parseFloat(labTesting.input_weight || 0) - parseFloat(labTesting.sample_weight || 0);
      setAvailableWeight(weight);
      debugLog('Verfügbares Gewicht gesetzt:', weight);
      
      // Standard-Verpackungsgröße und -Anzahl
      setPackagingLines([
        { id: 1, packageSize: 20, customSize: '', unitCount: 0, totalWeight: 0 }
      ]);
      
      // Setze verbleibende Werte zurück
      setRemainingWeight(weight);
      setNotes(`Verpackung in verschiedenen Einheitsgrößen. Verbleibende Restmenge wird vorschriftsgemäß vernichtet.`);
      setMemberId('');
      setRoomId('');
      setError('');
      setTotalPackages(0);
      setTotalPackagedWeight(0);
      
      // RFID-States zurücksetzen
      setScanMode(false);
      setScanSuccess(false);
      setScannedMemberName('');
      setMemberIdFromRfid(null);
      setAbortController(null);
      setIsAborting(false);
    }
  }, [open, labTesting]);
  
  // Berechne Totals und Restmenge, wenn sich Verpackungslinien ändern
  useEffect(() => {
    // Sicherstellen, dass packagingLines existiert
    if (!packagingLines || packagingLines.length === 0) return;
    
    let calculatedTotalUnits = 0;
    let calculatedTotalWeight = 0;
    
    // Berechne Totals aus allen Zeilen
    packagingLines.forEach(line => {
      // Sicherstellen, dass wir mit Zahlen arbeiten
      const count = parseInt(line.unitCount) || 0;
      const weight = parseFloat(line.totalWeight) || 0;
      
      calculatedTotalUnits += count;
      calculatedTotalWeight += weight;
    });
    
    // Aktualisiere Zustandsvariablen
    setTotalPackages(calculatedTotalUnits);
    setTotalPackagedWeight(calculatedTotalWeight);
    
    // Berechne verbleibende Restmenge
    const remaining = Math.max(0, parseFloat(availableWeight) - calculatedTotalWeight);
    setRemainingWeight(remaining);
    
    // Aktualisiere Notizen
    setNotes(`Verpackung in verschiedenen Einheitsgrößen. Verbleibende ${remaining.toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
    
    debugLog('Neuberechnung:', {
      totalUnits: calculatedTotalUnits,
      totalWeight: calculatedTotalWeight,
      remainingWeight: remaining
    });
  }, [packagingLines, availableWeight]);
  
  // Aktualisiere eine Verpackungszeile und berechne das Gesamtgewicht neu
  const updatePackagingLine = (id, field, value) => {
    debugLog(`Aktualisiere Zeile ${id}, Feld ${field} auf Wert ${value}`);
    
    // Erstelle eine Kopie der Zeilen
    const updatedLines = packagingLines.map(line => {
      if (line.id === id) {
        // Erstelle eine Kopie der zu ändernden Zeile
        const updatedLine = { ...line, [field]: value };
        
        // Wenn Größe oder Anzahl geändert wurde, berechne das Gesamtgewicht neu
        if (field === 'packageSize' || field === 'customSize' || field === 'unitCount') {
          // Bestimme die tatsächliche Größe
          let actualSize = 0;
          
          if (field === 'packageSize') {
            if (value === 'custom') {
              // Bei Wechsel auf "Custom" nehmen wir die existierende benutzerdefinierte Größe
              actualSize = line.customSize ? parseFloat(line.customSize) : 0;
            } else {
              // Bei Standard-Größen nehmen wir den neuen Wert
              actualSize = parseFloat(value);
            }
          } else if (field === 'customSize' && updatedLine.packageSize === 'custom') {
            // Bei Änderung der benutzerdefinierten Größe
            actualSize = value ? parseFloat(value) : 0;
          } else {
            // In allen anderen Fällen: existierende Größe beibehalten
            actualSize = updatedLine.packageSize === 'custom' 
              ? (updatedLine.customSize ? parseFloat(updatedLine.customSize) : 0) 
              : parseFloat(updatedLine.packageSize);
          }
          
          // Bestimme die Anzahl (bei Änderung der Anzahl nehmen wir den neuen Wert)
          const count = field === 'unitCount' 
            ? (parseInt(value) || 0)
            : (parseInt(updatedLine.unitCount) || 0);
          
          // Berechne das Gesamtgewicht für diese Zeile
          const totalLineWeight = count * actualSize;
          updatedLine.totalWeight = isNaN(totalLineWeight) ? 0 : totalLineWeight;
          
          debugLog('Neuberechnung der Zeile:', {
            id: id,
            size: actualSize,
            count: count,
            totalWeight: updatedLine.totalWeight
          });
        }
        
        return updatedLine;
      }
      return line;
    });
    
    setPackagingLines(updatedLines);
  };
  
  // Füge eine neue Verpackungszeile hinzu
  const addPackagingLine = () => {
    // Finde die nächste verfügbare ID
    const nextId = Math.max(...packagingLines.map(line => line.id), 0) + 1;
    
    // Finde die nächste unbenutzte Standard-Verpackungsgröße
    const usedSizes = packagingLines.map(line => 
      line.packageSize === 'custom' ? null : parseFloat(line.packageSize)
    ).filter(size => size !== null);
    
    // Wähle die erste unbenutzte Größe oder die erste Größe, wenn alle benutzt sind
    let nextSize = packageSizeOptions.find(option => 
      option.value !== 'custom' && !usedSizes.includes(option.value)
    )?.value || packageSizeOptions[0].value;
    
    // Füge neue Zeile hinzu
    const newLines = [
      ...packagingLines,
      { id: nextId, packageSize: nextSize, customSize: '', unitCount: 0, totalWeight: 0 }
    ];
    
    debugLog('Neue Zeile hinzugefügt:', { id: nextId, size: nextSize });
    setPackagingLines(newLines);
  };
  
  // Entferne eine Verpackungszeile
  const removePackagingLine = (id) => {
    if (packagingLines.length <= 1) {
      // Verhindere Entfernen der letzten Zeile
      return;
    }
    
    const updatedLines = packagingLines.filter(line => line.id !== id);
    debugLog('Zeile entfernt:', { id: id });
    setPackagingLines(updatedLines);
  };
  
  // Intelligente Verteilung des Gewichts
  const smartDistribute = () => {
    debugLog('Smart Distribute gestartet');
    debugLog('Verfügbares Gewicht:', availableWeight);
    debugLog('Aktuelle Zeilen:', packagingLines);
    
    // Verpackungszeilen validieren und sortieren
    const sortedSizes = [];
    
    // Extrahiere alle gültigen Größen und sortiere sie absteigend
    for (const line of packagingLines) {
      // Bestimme tatsächliche Größe
      let size;
      if (line.packageSize === 'custom') {
        size = line.customSize ? parseFloat(line.customSize) : 0;
      } else {
        size = parseFloat(line.packageSize);
      }
      
      // Nur gültige Größen berücksichtigen (>= 5g)
      if (!isNaN(size) && size >= 5) {
        sortedSizes.push({
          id: line.id,
          size: size
        });
      }
    }
    
    // Sortiere absteigend nach Größe
    sortedSizes.sort((a, b) => b.size - a.size);
    
    debugLog('Sortierte Größen:', sortedSizes);
    
    // Prüfe, ob es gültige Größen gibt
    if (sortedSizes.length === 0) {
      setError('Keine gültigen Verpackungsgrößen gefunden. Mindestgröße ist 5g.');
      return;
    }
    
    // Erstelle neue Zeilen mit zurückgesetzten Werten
    const newLines = [...packagingLines].map(line => ({
      ...line,
      unitCount: 0,
      totalWeight: 0
    }));
    
    // Verfügbares Gewicht
    let remainingToDistribute = parseFloat(availableWeight);
    
    // Verteile das Gewicht auf die Größen, beginnend mit der größten
    for (const sortedSize of sortedSizes) {
      // Wenn nichts mehr zu verteilen ist, beende die Schleife
      if (remainingToDistribute <= 0) break;
      
      // Finde die entsprechende Zeile
      const lineIndex = newLines.findIndex(line => line.id === sortedSize.id);
      if (lineIndex === -1) continue;
      
      // Berechne maximale Anzahl ganzer Einheiten
      const maxUnits = Math.floor(remainingToDistribute / sortedSize.size);
      
      if (maxUnits > 0) {
        // Berechne tatsächlich verwendetes Gewicht
        const usedWeight = maxUnits * sortedSize.size;
        
        // Aktualisiere die Zeile
        newLines[lineIndex].unitCount = maxUnits;
        newLines[lineIndex].totalWeight = usedWeight;
        
        // Reduziere das verbleibende Gewicht
        remainingToDistribute -= usedWeight;
        
        debugLog(`Für Größe ${sortedSize.size}g: ${maxUnits} Einheiten, ${usedWeight}g verwendet`);
      }
    }
    
    debugLog('Neue Zeilen nach Verteilung:', newLines);
    debugLog('Verbleibendes Gewicht:', remainingToDistribute);
    
    // Aktualisiere den Zustand
    setPackagingLines(newLines);
  };

  // RFID-Scan starten
  const startRfidScan = async () => {
    setScanMode(true);
    setScanSuccess(false);
    await handleRfidScan();
  };

  // RFID-Scan Handler
  const handleRfidScan = async () => {
    if (isAborting) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    
    try {
      console.log("🚀 Starte RFID-Scan für Verpackungserstellung...");
      
      if (isAborting) return;
      
      const bindRes = await api.get('/unifi_api_debug/bind-rfid-session/', {
        signal: controller.signal
      });
      
      if (isAborting) return;
      
      const { token, unifi_user_id, message, unifi_name } = bindRes.data;
      
      if (!token || !unifi_user_id || !unifi_name) {
        throw new Error('RFID-Zuweisung fehlgeschlagen. Nutzerinformationen unvollständig.');
      }
      
      if (isAborting) return;
      
      const verifyRes = await api.post('/unifi_api_debug/secure-member-binding/', 
        { token, unifi_name }, 
        { signal: controller.signal }
      );
      
      const { member_id, member_name } = verifyRes.data;
      
      setMemberId(member_id);
      setMemberIdFromRfid(member_id);
      setScannedMemberName(member_name);
      setScanSuccess(true);
      
      setTimeout(async () => {
        await handleSubmitWithRfid(member_id);
        
        setTimeout(() => {
          handleDialogClose();
        }, 2000);
      }, 500);
      
    } catch (error) {
      if (error.name === 'AbortError' || isAborting) {
        console.log('RFID-Scan wurde abgebrochen');
      } else {
        console.error('RFID-Bindungsfehler:', error);
        alert(error.response?.data?.detail || error.message || 'RFID-Verifizierung fehlgeschlagen');
      }
      
      if (!isAborting) {
        setScanMode(false);
      }
    } finally {
      if (!isAborting) {
        setLoading(false);
      }
    }
  };

  // RFID-Scan abbrechen
  const handleCancelScan = async () => {
    setIsAborting(true);
    
    if (abortController) {
      abortController.abort();
    }
    
    try {
      await api.post('/unifi_api_debug/cancel-rfid-session/');
      console.log("RFID-Scan erfolgreich abgebrochen");
    } catch (error) {
      console.error('RFID-Scan-Abbruch fehlgeschlagen:', error);
    } finally {
      setScanMode(false);
      setLoading(false);
      setScanSuccess(false);
      setScannedMemberName('');
      
      setTimeout(() => {
        setIsAborting(false);
      }, 500);
    }
  };

  // Dialog schließen Handler
  const handleDialogClose = () => {
    setScanMode(false);
    setScanSuccess(false);
    setScannedMemberName('');
    setMemberIdFromRfid(null);
    
    if (onClose) {
      onClose();
    }
  };

  // Submit-Handler mit RFID member_id
  const handleSubmitWithRfid = async (rfidMemberId) => {
    setError('');
    
    const validPackagings = packagingLines.filter(line => {
      const count = parseInt(line.unitCount) || 0;
      const weight = parseFloat(line.totalWeight) || 0;
      return count > 0 && weight > 0;
    });
    
    const calculatedTotalWeight = validPackagings.reduce((sum, line) => 
      sum + (parseFloat(line.totalWeight) || 0), 0);
    
    if (validPackagings.length === 0 || calculatedTotalWeight <= 0) {
      setError('Es muss mindestens eine Verpackung erstellt werden (Gesamtgewicht > 0)');
      return;
    }
    
    if (!roomId) {
      setError('Bitte wählen Sie einen Raum aus');
      return;
    }
    
    const packagingRequests = validPackagings.map(line => {
      const unitSize = line.packageSize === 'custom' 
        ? (parseFloat(line.customSize) || 0) 
        : parseFloat(line.packageSize);
      
      const unitCount = parseInt(line.unitCount) || 0;
      const totalWeight = parseFloat(line.totalWeight) || 0;
      
      return {
        unit_count: unitCount,
        unit_weight: unitSize,
        total_weight: totalWeight
      };
    });
    
    const formData = {
      packagings: packagingRequests,
      remaining_weight: parseFloat(remainingWeight) || 0,
      auto_destroy_remainder: true,
      member_id: rfidMemberId,
      room_id: roomId,
      notes: notes,
      total_weight: calculatedTotalWeight
    };
    
    onConvert(formData, rfidMemberId);
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    debugLog('Formular wird abgesendet');
    
    // Prüfe, ob mindestens eine Verpackung definiert ist
    const validPackagings = packagingLines.filter(line => {
      const count = parseInt(line.unitCount) || 0;
      const weight = parseFloat(line.totalWeight) || 0;
      return count > 0 && weight > 0;
    });
    
    debugLog('Gültige Verpackungen:', validPackagings);
    
    // Berechne Gesamtgewicht aller Verpackungen
    const calculatedTotalWeight = validPackagings.reduce((sum, line) => 
      sum + (parseFloat(line.totalWeight) || 0), 0);
    
    debugLog('Berechnetes Gesamtgewicht:', calculatedTotalWeight);
    
    // Validierung
    if (validPackagings.length === 0 || calculatedTotalWeight <= 0) {
      setError('Es muss mindestens eine Verpackung erstellt werden (Gesamtgewicht > 0)');
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
    
    // Erstelle ein Array von Verpackungen für die API
    const packagingRequests = validPackagings.map(line => {
      // Bestimme die tatsächliche Größe
      const unitSize = line.packageSize === 'custom' 
        ? (parseFloat(line.customSize) || 0) 
        : parseFloat(line.packageSize);
      
      // Bestimme die Anzahl
      const unitCount = parseInt(line.unitCount) || 0;
      
      // Bestimme das Gesamtgewicht
      const totalWeight = parseFloat(line.totalWeight) || 0;
      
      // Erstelle das Objekt für die API
      return {
        unit_count: unitCount,
        unit_weight: unitSize,
        total_weight: totalWeight
      };
    });
    
    // Erstelle das Gesamtobjekt für die API - WICHTIG: Verwende immer die packagings-Property
    const formData = {
      packagings: packagingRequests,
      remaining_weight: parseFloat(remainingWeight) || 0,
      auto_destroy_remainder: true,
      member_id: memberId,
      room_id: roomId,
      notes: notes,
      // WICHTIG: Füge zusätzlich Gesamtgewicht für ältere API-Versionen hinzu
      total_weight: calculatedTotalWeight
    };
    
    debugLog('API-Anfragedaten:', formData);
    
    // API-Aufruf mit Callback
    onConvert(formData);
  };

  return (
    <Dialog 
      open={open}
      onClose={(event, reason) => {
        if (scanMode && !scanSuccess) {
          return;
        }
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleDialogClose();
        }
      }}
      fullWidth
      maxWidth="xl"
      disableEscapeKeyDown
      PaperProps={{
        sx: { 
          position: 'relative',
          overflow: scanMode ? 'hidden' : 'visible'
        }
      }}
    >
      {/* RFID-Scan-Overlay */}
      {scanMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'success.light',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          zIndex: 1300
        }}>
          {!scanSuccess && (
            <Button 
              onClick={handleCancelScan}
              variant="contained" 
              color="error"
              size="small"
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                minWidth: '100px'
              }}
            >
              Abbrechen
            </Button>
          )}
          
          {scanSuccess ? (
            <Fade in={scanSuccess}>
              <Box sx={{ textAlign: 'center' }}>
                <Zoom in={scanSuccess}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 120, color: 'white', mb: 3 }} />
                </Zoom>
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Autorisierung erfolgreich
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                  {totalPackages} Verpackung{totalPackages > 1 ? 'en wurden' : ' wurde'} erstellt
                </Typography>
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  Verantwortlich: {scannedMemberName}
                </Typography>
              </Box>
            </Fade>
          ) : (
            <>
              <CreditCardIcon sx={{ fontSize: 120, color: 'white', mb: 4 }} />
              
              <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                Bitte Ausweis jetzt scannen
              </Typography>
              
              <Typography variant="body1" align="center" color="white" gutterBottom>
                um die Verpackung zu erstellen
              </Typography>
              
              {loading && (
                <CircularProgress 
                  size={60} 
                  thickness={5} 
                  sx={{ 
                    color: 'white', 
                    mt: 4 
                  }} 
                />
              )}
            </>
          )}
        </Box>
      )}
      
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6">Erweiterte Verpackungserstellung</Typography>
        </Box>
        <IconButton onClick={handleDialogClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', width: '100%' }}>
            {/* Linke Spalte */}
            <Box sx={{ width: '350px', flexShrink: 0, pr: 3 }}>
              {labTesting && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', 
                        p: 1, bgcolor: 'info.lighter', borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Verfügbares Gewicht:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {availableWeight.toFixed(3)}g
                    </Typography>
                  </Box>
                </Paper>
              )}
              
              {/* RFID-Hinweis statt Mitglieder-Dropdown */}
              <Box 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  bgcolor: 'info.light', 
                  color: 'info.contrastText',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2">
                  <strong>Hinweis:</strong> Die Zuordnung des verantwortlichen Mitglieds erfolgt automatisch per RFID-Autorisierung.
                </Typography>
              </Box>
              
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
                sx={{ mb: 2 }}
              />
              
              {/* Zusammenfassung und Restmenge */}
              <Paper sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                  Zusammenfassung
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Gesamtanzahl Verpackungen:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {totalPackages}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Gesamtgewicht (verpackt):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {totalPackagedWeight.toFixed(2)}g
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Restmenge (wird vernichtet):
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: remainingWeight > 0 ? 'error.main' : 'inherit', 
                    fontWeight: 'bold' 
                  }}>
                    {remainingWeight.toFixed(2)}g
                  </Typography>
                </Box>
                
                {remainingWeight > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <LocalFireDepartmentIcon sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
                    <Typography variant="caption" color="error">
                      Die Restmenge wird automatisch zur Vernichtung markiert
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
            
            {/* Rechte Spalte - Verpackungslinien */}
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Verpackungslinien
                  </Typography>
                  <Box>
                    <Tooltip title="Gewicht intelligent auf vorhandene Zeilen verteilen">
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<CalculateIcon />}
                        onClick={smartDistribute}
                        sx={{ mr: 1 }}
                      >
                        Auto-Verteilung
                      </Button>
                    </Tooltip>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addPackagingLine}
                    >
                      Neue Zeile
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Verpackungsgröße</TableCell>
                        <TableCell sx={{ width: '25%' }}>Anzahl</TableCell>
                        <TableCell sx={{ width: '25%' }}>Gesamtgewicht</TableCell>
                        <TableCell sx={{ width: '20%' }}>Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {packagingLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={line.packageSize}
                                  onChange={(e) => updatePackagingLine(line.id, 'packageSize', e.target.value)}
                                >
                                  {packageSizeOptions.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              
                              {line.packageSize === 'custom' && (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={line.customSize}
                                  onChange={(e) => updatePackagingLine(line.id, 'customSize', e.target.value)}
                                  InputProps={{
                                    endAdornment: <Typography variant="caption">g</Typography>,
                                  }}
                                  inputProps={{ min: 5, step: 0.1 }}
                                  sx={{ ml: 1, width: '80px' }}
                                  error={line.customSize !== '' && parseFloat(line.customSize) < 5}
                                />
                              )}
                            </Box>
                            {line.packageSize === 'custom' && line.customSize !== '' && parseFloat(line.customSize) < 5 && (
                              <FormHelperText error>Min. 5g</FormHelperText>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={line.unitCount}
                              onChange={(e) => updatePackagingLine(line.id, 'unitCount', e.target.value)}
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography>
                              {parseFloat(line.totalWeight).toFixed(2)}g
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="error"
                              onClick={() => removePackagingLine(line.id)}
                              disabled={packagingLines.length <= 1}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              {/* Informationsbereich */}
              <Paper sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <InfoIcon sx={{ mr: 1, color: 'info.main', mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Hinweise zur Verpackungserstellung:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Für jede Verpackungszeile wird im Backend eine separate Batch-Nummer mit eigener UUID generiert
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Die Mindestgröße für Verpackungen beträgt 5g
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Mit "Auto-Verteilung" können Sie das verfügbare Gewicht automatisch auf die vorhandenen Zeilen verteilen
                    </Typography>
                    <Typography variant="body2">
                      • Übrige Restmengen werden automatisch als vernichtet markiert
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} color="inherit">
            Abbrechen
          </Button>
          <Button 
            onClick={startRfidScan}
            variant="contained" 
            color="success"
            startIcon={loading ? <CircularProgress size={16} /> : <InventoryIcon />}
            disabled={loading || totalPackagedWeight <= 0 || !roomId}
          >
            Mit RFID autorisieren & Verpackungen erstellen
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EnhancedConvertToPackagingDialog;