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
  Zoom,
  InputAdornment
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
import EuroIcon from '@mui/icons-material/Euro';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
  
  // NEUE STATE-VARIABLEN FÜR PREIS:
  const [pricePerGram, setPricePerGram] = useState('');
  const [totalPackageValue, setTotalPackageValue] = useState(0);
  const [remainingValue, setRemainingValue] = useState(0);
  
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
      
      // PREISE ZURÜCKSETZEN:
      setPricePerGram('');
      setTotalPackageValue(0);
      setRemainingValue(0);
      
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
    
    // WERT-BERECHNUNG:
    const priceValue = parseFloat(pricePerGram) || 0;
    const calculatedTotalValue = calculatedTotalWeight * priceValue;
    const calculatedRemainingValue = remaining * priceValue;
    
    setTotalPackageValue(calculatedTotalValue);
    setRemainingValue(calculatedRemainingValue);
    
    // Aktualisiere Notizen
    setNotes(`Verpackung in verschiedenen Einheitsgrößen. Verbleibende ${remaining.toFixed(2)}g werden vorschriftsgemäß vernichtet.`);
    
    debugLog('Neuberechnung:', {
      totalUnits: calculatedTotalUnits,
      totalWeight: calculatedTotalWeight,
      remainingWeight: remaining,
      totalValue: calculatedTotalValue,
      remainingValue: calculatedRemainingValue
    });
  }, [packagingLines, availableWeight, pricePerGram]);
  
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
    // MAXIMAL 5 VERPACKUNGSLINIEN
    if (packagingLines.length >= 5) {
      setError('Maximal 5 verschiedene Verpackungsgrößen können gleichzeitig erstellt werden.');
      return;
    }

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
    
    // PREIS-VALIDIERUNG:
    if (!pricePerGram || parseFloat(pricePerGram) <= 0) {
      setError('Bitte geben Sie einen gültigen Preis pro Gramm ein');
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
      total_weight: calculatedTotalWeight,
      price_per_gram: parseFloat(pricePerGram)
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
    
    // PREIS-VALIDIERUNG:
    if (!pricePerGram || parseFloat(pricePerGram) <= 0) {
      setError('Bitte geben Sie einen gültigen Preis pro Gramm ein (> 0)');
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
      total_weight: calculatedTotalWeight,
      price_per_gram: parseFloat(pricePerGram)
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
      maxWidth={false}
      disableEscapeKeyDown
      PaperProps={{
        sx: { 
          position: 'relative',
          overflow: scanMode ? 'hidden' : 'visible',
          // 🎯 OPTIMIERT FÜR 1920x1080 - MEHR PLATZ GENUTZT
          width: '95vw',
          height: '88vh',
          maxWidth: '1820px',
          maxHeight: '940px'
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
                  <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'white', mb: 2 }} />
                </Zoom>
                
                <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                  Autorisierung erfolgreich
                </Typography>
                
                <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                  {totalPackages} Verpackung{totalPackages > 1 ? 'en wurden' : ' wurde'} erstellt
                </Typography>
                
                {totalPackageValue > 0 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="h6" align="center" color="white" fontWeight="bold">
                      💰 Gesamtwert: {totalPackageValue.toFixed(2)} €
                    </Typography>
                    <Typography variant="caption" align="center" color="white" sx={{ opacity: 0.9 }}>
                      (inkl. 19% MwSt.)
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="h6" align="center" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                  Verantwortlich: {scannedMemberName}
                </Typography>
              </Box>
            </Fade>
          ) : (
            <>
              <CreditCardIcon sx={{ fontSize: 100, color: 'white', mb: 3 }} />
              
              <Typography variant="h5" align="center" color="white" fontWeight="bold" gutterBottom>
                Bitte Ausweis jetzt scannen
              </Typography>
              
              <Typography variant="body1" align="center" color="white" gutterBottom>
                um die Verpackung zu erstellen
              </Typography>
              
              {loading && (
                <CircularProgress 
                  size={50} 
                  thickness={5} 
                  sx={{ 
                    color: 'white', 
                    mt: 3 
                  }} 
                />
              )}
            </>
          )}
        </Box>
      )}
      
      {/* 🎯 VERBESSERTE HEADER-GRÖSSE */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: 1.5,
        px: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: '56px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ mr: 1.5, color: 'success.main', fontSize: '1.4rem' }} />
          <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Erweiterte Verpackungserstellung</Typography>
        </Box>
        <IconButton onClick={handleDialogClose} size="medium">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent 
          dividers 
          sx={{ 
            p: 2,
            height: 'calc(88vh - 160px)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 2 }}>
            
            {/* 🎯 LINKE SPALTE - VERGRÖSSERT */}
            <Box sx={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              
              {/* Laborkontrolle-Information - VERGRÖSSERT */}
              {labTesting && (
                <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.85rem', mb: 1, fontWeight: 'bold' }}>
                    Laborkontrolle-Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.8rem' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      Genetik:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {labTesting.source_strain || "Unbekannt"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      THC-Gehalt:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {labTesting.thc_content ? `${labTesting.thc_content}%` : "Nicht getestet"}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    p: 1, 
                    bgcolor: 'info.lighter', 
                    borderRadius: 1, 
                    mt: 1 
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      Verfügbares Gewicht:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {availableWeight.toFixed(3)}g
                    </Typography>
                  </Box>
                </Paper>
              )}
              
              {/* 🎯 PREISEINGABE - VERGRÖSSERT */}
              <Paper sx={{ p: 1.5, bgcolor: 'warning.lighter' }}>
                <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1.5, fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <EuroIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                  Preisfestlegung
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Preis pro Gramm"
                  value={pricePerGram}
                  onChange={(e) => setPricePerGram(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="body2">/g</Typography>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    sx: { fontSize: '0.9rem' }
                  }}
                  inputProps={{ 
                    min: 0, 
                    step: 0.01,
                    placeholder: "z.B. 12.50",
                    sx: { fontSize: '0.9rem' }
                  }}
                  required
                  FormHelperTextProps={{
                    sx: { fontSize: '0.75rem' }
                  }}
                  helperText="Verkaufspreis pro Gramm (inkl. 19% MwSt.)"
                  error={pricePerGram !== '' && parseFloat(pricePerGram) <= 0}
                />
                
                {/* PREIS-VORSCHAU - VERGRÖSSERT */}
                {pricePerGram && parseFloat(pricePerGram) > 0 && (
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                      Erwarteter Gesamtwert:
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {totalPackageValue.toFixed(2)} €
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      (inkl. 19% MwSt.)
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              {/* Raum-Auswahl - VERGRÖSSERT */}
              <FormControl fullWidth size="small">
                <InputLabel id="room-label" sx={{ fontSize: '0.9rem' }}>Raum</InputLabel>
                <Select
                  labelId="room-label"
                  id="room"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  label="Raum"
                  required
                  disabled={loadingOptions}
                  sx={{ fontSize: '0.9rem' }}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id} sx={{ fontSize: '0.9rem' }}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Notizen - VERGRÖSSERT */}
              <TextField
                size="small"
                id="notes"
                label="Notizen"
                multiline
                rows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: '0.9rem' }
                }}
                inputProps={{
                  sx: { fontSize: '0.85rem' }
                }}
              />
              
              {/* 🎯 ZUSAMMENFASSUNG - VERGRÖSSERT */}
              <Paper sx={{ p: 1.5, bgcolor: 'success.lighter', flex: 1 }}>
                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                  Zusammenfassung
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0.5, fontSize: '0.8rem' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Verpackungen:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {totalPackages}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Gewicht (verpackt):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {totalPackagedWeight.toFixed(2)}g
                  </Typography>
                  
                  {pricePerGram && parseFloat(pricePerGram) > 0 && (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Preis pro Gramm:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main', fontSize: '0.8rem' }}>
                        {parseFloat(pricePerGram).toFixed(2)} €/g
                      </Typography>
                      
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        💰 Gesamtwert:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1rem' }}>
                        {totalPackageValue.toFixed(2)} €
                      </Typography>
                    </>
                  )}
                </Box>
                
                {pricePerGram && parseFloat(pricePerGram) > 0 && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block', textAlign: 'center', mt: 0.5 }}>
                    (inkl. 19% MwSt.)
                  </Typography>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Restmenge:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: remainingWeight > 0 ? 'error.main' : 'inherit', 
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {remainingWeight.toFixed(2)}g
                  </Typography>
                  
                  {remainingWeight > 0 && pricePerGram && parseFloat(pricePerGram) > 0 && (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        ⚠️ Wert Restmenge:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {remainingValue.toFixed(2)} €
                      </Typography>
                    </>
                  )}
                </Box>
                
                {remainingWeight > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <LocalFireDepartmentIcon sx={{ mr: 1, fontSize: 14, color: 'error.main' }} />
                    <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                      Restmenge → automatische Vernichtung
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              {error && (
                <Alert severity="error" sx={{ 
                  py: 1,
                  '& .MuiAlert-message': { fontSize: '0.8rem' },
                  '& .MuiAlert-icon': { fontSize: '1.2rem' }
                }}>
                  {error}
                </Alert>
              )}
            </Box>
            
            {/* 🎯 RECHTE SPALTE - TABELLE VERGRÖSSERT + SCROLLING */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Verpackungslinien
                  </Typography>
                  <Box>
                    <Tooltip title="Gewicht intelligent verteilen">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<CalculateIcon />}
                        onClick={smartDistribute}
                        sx={{ mr: 1, fontSize: '0.8rem' }}
                      >
                        Auto-Verteilung
                      </Button>
                    </Tooltip>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addPackagingLine}
                      disabled={packagingLines.length >= 5}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      + Neue Zeile {packagingLines.length >= 5 && '(Max. 5)'}
                    </Button>
                  </Box>
                </Box>
                
                {/* 🎯 VERBESSERTE TABELLE MIT SCROLLING AB 6 ZEILEN */}
                <TableContainer sx={{ 
                  flex: 1,
                  maxHeight: packagingLines.length > 5 ? '400px' : 'none',
                  overflow: packagingLines.length > 5 ? 'auto' : 'visible'
                }}>
                  <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1, px: 1.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Verpackungsgröße
                        </TableCell>
                        <TableCell sx={{ width: '15%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Anzahl
                        </TableCell>
                        <TableCell sx={{ width: '18%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Gesamtgewicht
                        </TableCell>
                        <TableCell sx={{ width: '20%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Wert (inkl. MwSt.)
                        </TableCell>
                        <TableCell sx={{ width: '17%', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Aktionen
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {packagingLines.map((line) => {
                        const lineValue = parseFloat(line.totalWeight) * (parseFloat(pricePerGram) || 0);
                        
                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={line.packageSize}
                                    onChange={(e) => updatePackagingLine(line.id, 'packageSize', e.target.value)}
                                    sx={{ fontSize: '0.8rem', minHeight: '32px' }}
                                  >
                                    {packageSizeOptions.map(option => (
                                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
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
                                      endAdornment: <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>g</Typography>,
                                      sx: { fontSize: '0.8rem' }
                                    }}
                                    inputProps={{ 
                                      min: 5, 
                                      step: 0.1,
                                      sx: { fontSize: '0.8rem' }
                                    }}
                                    sx={{ width: '70px' }}
                                    error={line.customSize !== '' && parseFloat(line.customSize) < 5}
                                  />
                                )}
                              </Box>
                              {line.packageSize === 'custom' && line.customSize !== '' && parseFloat(line.customSize) < 5 && (
                                <FormHelperText error sx={{ fontSize: '0.7rem', mt: 0.5 }}>Min. 5g</FormHelperText>
                              )}
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={line.unitCount}
                                onChange={(e) => updatePackagingLine(line.id, 'unitCount', e.target.value)}
                                inputProps={{ 
                                  min: 0,
                                  sx: { fontSize: '0.8rem' }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {parseFloat(line.totalWeight).toFixed(2)}g
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography sx={{ 
                                  color: lineValue > 0 ? 'success.main' : 'text.secondary',
                                  fontWeight: lineValue > 0 ? 'bold' : 'normal',
                                  fontSize: '0.8rem'
                                }}>
                                  {lineValue > 0 ? `${lineValue.toFixed(2)} €` : '—'}
                                </Typography>
                                {lineValue > 0 && (
                                  <Typography variant="caption" sx={{ 
                                    fontSize: '0.7rem', 
                                    color: 'text.secondary',
                                    display: 'block'
                                  }}>
                                    (inkl. MwSt.)
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                color="error"
                                size="small"
                                onClick={() => removePackagingLine(line.id)}
                                disabled={packagingLines.length <= 1}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </Box>
          
          {/* 🎯 RFID-HINWEIS VERGRÖSSERT */}
          <Box sx={{ 
            mt: 1.5, 
            p: 1.5, 
            bgcolor: 'info.lighter', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCardIcon sx={{ mr: 1, color: 'info.main', fontSize: '1.1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
              <strong>Hinweis:</strong> Zuordnung per RFID-Autorisierung. Preise inkl. 19% MwSt. 
              Max. 5 Verpackungsgrößen empfohlen - bei mehr erscheint automatisch ein Scrollbalken.
            </Typography>
          </Box>
        </DialogContent>
        
        {/* 🎯 VERBESSERTER FOOTER */}
        <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', minHeight: '60px' }}>
          <Button onClick={handleDialogClose} color="inherit" size="medium" sx={{ fontSize: '0.9rem' }}>
            Abbrechen
          </Button>
          <Button 
            onClick={startRfidScan}
            variant="contained" 
            color="success"
            size="medium"
            startIcon={loading ? <CircularProgress size={16} /> : <AttachMoneyIcon />}
            disabled={loading || totalPackagedWeight <= 0 || !roomId || !pricePerGram || parseFloat(pricePerGram) <= 0}
            sx={{ fontSize: '0.9rem', px: 3 }}
          >
            Mit RFID autorisieren & Verpackungen erstellen
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EnhancedConvertToPackagingDialog;