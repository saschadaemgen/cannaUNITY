// /trackandtrace/components/MemberDistributionHistory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Paper, Divider, Chip, Button,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Accordion, AccordionSummary, 
  AccordionDetails, Tab, Tabs, useTheme, alpha,
  Card, CardContent, Grid, IconButton, MenuItem,
  LinearProgress, Tooltip, Stack, Menu, Switch,
  FormControlLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScaleIcon from '@mui/icons-material/Scale';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GppGoodIcon from '@mui/icons-material/GppGood';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TodayIcon from '@mui/icons-material/Today';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EuroIcon from '@mui/icons-material/Euro';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HistoryIcon from '@mui/icons-material/History';
import ReactECharts from 'echarts-for-react';
import api from '@/utils/api';

// Konstanten für Produkttypen - exakt wie im Backend (PRODUCT_TYPE_CHOICES)
const PRODUCT_TYPES = {
  MARIJUANA: 'Marihuana',
  HASHISH: 'Haschisch'
};

// Konstanten für Alterslimits
const AGE_LIMITS = {
  YOUNG_ADULT: {
    MIN_AGE: 18,
    MAX_AGE: 21,
    DAILY_LIMIT: 25, // g
    MONTHLY_LIMIT: 30, // g
    MAX_THC: 10, // %
  },
  ADULT: {
    MIN_AGE: 21,
    DAILY_LIMIT: 25, // g
    MONTHLY_LIMIT: 50, // g
    MAX_THC: null, // keine Begrenzung
  }
};

/**
 * Komponente zur Anzeige der Cannabis-Ausgabehistorie eines Mitglieds
 * 
 * @param {Object} props - Die Props der Komponente
 * @param {string} props.memberId - Die ID des Mitglieds
 * @param {number} [props.memberAge] - Das Alter des Mitglieds (optional)
 * @param {string} [props.memberBirthDate] - Das Geburtsdatum des Mitglieds (optional)
 * @param {Object} [props.member] - Das komplette Mitgliedsobjekt (optional, für Kontostand)
 * @returns {JSX.Element} Die gerenderte Komponente
 */
const MemberDistributionHistory = ({ memberId, memberAge, memberBirthDate, member }) => {
  const theme = useTheme();
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  
  // Zeitauswahl-State mit aktuellem Monat/Jahr als Standardwert
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Debug-Logging aktivieren
  const DEBUG = false;
  const logDebug = (message, data) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${message}`, data);
    }
  };
  
  // Berechne das Alter des Mitglieds, falls nicht direkt übergeben
  const calculateMemberAge = useMemo(() => {
    if (memberAge !== undefined) return memberAge;
    
    if (memberBirthDate) {
      const birthDate = new Date(memberBirthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    
    // Fallback, wenn keine Altersinformationen verfügbar sind
    return 25; // Wir nehmen an, dass das Mitglied älter als 21 ist
  }, [memberAge, memberBirthDate]);
  
  // Bestimme die Limits basierend auf dem Alter
  const limits = useMemo(() => {
    if (calculateMemberAge < AGE_LIMITS.YOUNG_ADULT.MAX_AGE) {
      return {
        daily: AGE_LIMITS.YOUNG_ADULT.DAILY_LIMIT,
        monthly: AGE_LIMITS.YOUNG_ADULT.MONTHLY_LIMIT,
        maxThc: AGE_LIMITS.YOUNG_ADULT.MAX_THC,
        category: 'young-adult'
      };
    } else {
      return {
        daily: AGE_LIMITS.ADULT.DAILY_LIMIT,
        monthly: AGE_LIMITS.ADULT.MONTHLY_LIMIT,
        maxThc: AGE_LIMITS.ADULT.MAX_THC,
        category: 'adult'
      };
    }
  }, [calculateMemberAge]);
  
  // Hilfsfunktion zur Darstellung des Monatsnamens
  const getMonthName = (monthIndex) => {
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return monthNames[monthIndex];
  };

  // Hilfsfunktion zur Darstellung des heutigen Tages
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Handler für die Monatsnavigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    // Verhindere Navigation in die Zukunft
    const currentDate = new Date();
    const isCurrentMonth = selectedMonth === currentDate.getMonth() && 
                          selectedYear === currentDate.getFullYear();
    
    if (isCurrentMonth) return;
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  // Handler für direkten Monat/Jahr-Auswahlmenü
  const handleMonthMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMonthMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMonthYearSelect = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    handleMonthMenuClose();
  };
  
  // Generiere Jahre und Monate für das Auswahlmenü (bis zu 3 Jahre zurück)
  const getYearMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    for (let year = currentYear; year >= currentYear - 2; year--) {
      const startMonth = year === currentYear ? currentMonth : 11;
      const endMonth = year === currentYear - 2 ? 0 : -1;
      
      for (let month = startMonth; month > endMonth; month--) {
        options.push({ year, month });
      }
    }
    
    return options;
  };
  
  useEffect(() => {
    if (!memberId) return;
    
    const fetchDistributionData = async () => {
      setLoading(true);
      try {
        // API-Parameter für den gewählten Monat/Jahr
        const year = selectedYear;
        const month = selectedMonth + 1; // JavaScript-Monate sind 0-basiert, API erwartet 1-basiert
        
        // API-Anfrage mit Jahr/Monat-Parameter
        const response = await api.get(`/trackandtrace/distributions/member_summary/?member_id=${memberId}&year=${year}&month=${month}`);
        
        // Falls member_summary keinen Kontostand liefert, hole ihn separat
        let memberData = null;
        if (!response.data.member || !response.data.member.kontostand) {
          try {
            const memberResponse = await api.get(`/members/${memberId}/`);
            memberData = memberResponse.data;
            logDebug('Member-Daten separat geholt:', memberData);
          } catch (err) {
            logDebug('Fehler beim Holen der Member-Daten:', err);
          }
        }
        
        // Debugging der API-Antwort
        logDebug('API-Antwort erhalten:', response.data);
        
        // Verarbeite die Daten und füge eine Produktzusammenfassung hinzu, falls sie fehlt
        const processedData = processApiResponse(response.data, memberData);
        setDistributionData(processedData);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Ausgabehistorie:', err);
        setError('Distributionsdaten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistributionData();
  }, [memberId, selectedMonth, selectedYear]);
  
  // Hilfsfunktion zur Verarbeitung der API-Antwort
  const processApiResponse = (apiData, memberData = null) => {
    if (!apiData) return null;
    
    // Tiefe Kopie der API-Daten erstellen
    const processedData = JSON.parse(JSON.stringify(apiData));
    
    // Falls memberData separat geholt wurde, füge es hinzu
    if (memberData && !processedData.member) {
      processedData.member = memberData;
    }
    
    if (processedData.received) {
      // Stellen Sie sicher, dass alle Distributionen ein Array sind
      if (!Array.isArray(processedData.received.recent_distributions)) {
        processedData.received.recent_distributions = [];
      }
      
      // Stellen Sie sicher, dass ein Feld für alle Distributionen existiert
      if (!processedData.received.all_distributions) {
        // Falls nur recent_distributions vorhanden ist, können wir dies als all_distributions verwenden
        processedData.received.all_distributions = [...processedData.received.recent_distributions];
      }
      
      // Berechnen der Produktzusammenfassung, falls nicht vorhanden
      if (!processedData.received.product_summary) {
        const summary = calculateProductSummary(processedData.received.recent_distributions);
        processedData.received.product_summary = summary;
        
        logDebug('Berechnete Produktzusammenfassung:', summary);
      }
      
      // Stellen Sie sicher, dass jede Distribution eine product_type_summary hat
      if (processedData.received.recent_distributions) {
        processedData.received.recent_distributions.forEach(dist => {
          if (!dist.product_type_summary) {
            // Berechnen Sie die Zusammenfassung basierend auf den Verpackungseinheiten
            dist.product_type_summary = calculateDistributionSummary(dist);
            
            logDebug(`Berechnete product_type_summary für Distribution ${dist.id}:`, dist.product_type_summary);
          }
        });
      }
      
      // Berechne Monats- und Tagesverbrauch für Limitanzeige
      const monthlyConsumption = processedData.received.total_weight || 0;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Berechne heutigen Verbrauch
      let todayConsumption = 0;
      if (processedData.received.recent_distributions) {
        todayConsumption = processedData.received.recent_distributions
          .filter(dist => dist && dist.distribution_date && 
            new Date(dist.distribution_date).toISOString().split('T')[0] === today)
          .reduce((total, dist) => total + (dist.total_weight || 0), 0);
      }
      
      // Füge Verbrauchsinformationen zum Ergebnis hinzu
      processedData.consumption = {
        monthly: monthlyConsumption,
        today: todayConsumption,
        monthlyLimit: limits.monthly,
        dailyLimit: limits.daily,
        maxThc: limits.maxThc,
        monthlyPercentage: Math.min(100, (monthlyConsumption / limits.monthly) * 100),
        dailyPercentage: Math.min(100, (todayConsumption / limits.daily) * 100),
        remainingMonthly: Math.max(0, limits.monthly - monthlyConsumption),
        remainingDaily: Math.max(0, limits.daily - todayConsumption)
      };
      
      // 🆕 Kontostand-Historie berechnen
      if (processedData.received.recent_distributions && processedData.received.recent_distributions.length > 0) {
        // Kontostand aus verschiedenen Quellen versuchen zu holen
        let currentBalance = 0;
        let foundBalance = false;
        
        // 1. Aus processedData.member (wenn hinzugefügt)
        if (processedData.member && processedData.member.kontostand !== undefined) {
          currentBalance = parseFloat(processedData.member.kontostand);
          foundBalance = true;
          logDebug('Kontostand aus processedData.member:', currentBalance);
        }
        // 2. Aus apiData.member
        else if (apiData.member && apiData.member.kontostand !== undefined) {
          currentBalance = parseFloat(apiData.member.kontostand);
          foundBalance = true;
          logDebug('Kontostand aus apiData.member:', currentBalance);
        }
        // 3. Aus memberData (separat geholt)
        else if (memberData && memberData.kontostand !== undefined) {
          currentBalance = parseFloat(memberData.kontostand);
          foundBalance = true;
          logDebug('Kontostand aus memberData:', currentBalance);
        }
        // 4. Aus member Prop
        else if (member?.kontostand !== undefined) {
          currentBalance = parseFloat(member.kontostand);
          foundBalance = true;
          logDebug('Kontostand aus member Prop:', currentBalance);
        }
        
        if (!foundBalance) {
          console.error('❌ Kein Kontostand gefunden! Berechnung nicht möglich.');
          logDebug('Verfügbare Daten:', {
            apiData,
            memberData,
            member,
            processedData
          });
          return processedData; // Beende hier, da keine sinnvolle Berechnung möglich
        }
        
        logDebug('Start-Kontostand für Berechnung:', currentBalance);
        logDebug('Anzahl Distributionen:', processedData.received.recent_distributions.length);
        
        // Sortiere Distributionen chronologisch (älteste zuerst für die Berechnung)
        const sortedDistributions = [...processedData.received.recent_distributions]
          .sort((a, b) => new Date(a.distribution_date) - new Date(b.distribution_date));
        
        // Berechne rückwärts vom aktuellen Kontostand
        let runningBalance = currentBalance;
        
        // Gehe rückwärts durch die Distributionen (von neu nach alt)
        for (let i = sortedDistributions.length - 1; i >= 0; i--) {
          const dist = sortedDistributions[i];
          
          // Berechne total_price falls nicht vorhanden
          if (dist.total_price === undefined || dist.total_price === null) {
            if (dist.packaging_units && dist.packaging_units.length > 0) {
              dist.total_price = dist.packaging_units.reduce((sum, unit) => {
                const unitPrice = parseFloat(unit.unit_price || 0);
                return sum + (isNaN(unitPrice) ? 0 : unitPrice);
              }, 0);
              logDebug(`Berechneter total_price für Distribution ${i}:`, dist.total_price);
            } else {
              dist.total_price = 0;
              logDebug(`Keine packaging_units für Distribution ${i}, setze total_price auf 0`);
            }
          } else {
            dist.total_price = parseFloat(dist.total_price);
            if (isNaN(dist.total_price)) {
              console.warn(`total_price ist NaN für Distribution ${i}, setze auf 0`);
              dist.total_price = 0;
            }
          }
          
          // Balance-Informationen berechnen
          // Nach der Ausgabe = aktueller runningBalance
          dist.balance_after = runningBalance;
          // Vor der Ausgabe = runningBalance + Ausgabebetrag
          dist.balance_before = runningBalance + dist.total_price;
          
          logDebug(`Distribution ${i} (${dist.distribution_date}):`, {
            total_price: dist.total_price,
            balance_before: dist.balance_before,
            balance_after: dist.balance_after
          });
          
          // Für die nächste (ältere) Distribution
          runningBalance = dist.balance_before;
        }
        
        logDebug('Finale Distributions mit Balance:', processedData.received.recent_distributions);
      }
      
      // Member-Daten aus der API-Response übernehmen, falls vorhanden
      if (apiData.member) {
        processedData.member = apiData.member;
      }
    }
    
    return processedData;
  };
  
  // Hilfsfunktion zur Berechnung der Produktzusammenfassung für alle Distributionen
  const calculateProductSummary = (distributions) => {
    const summary = {
      [PRODUCT_TYPES.MARIJUANA]: { type: PRODUCT_TYPES.MARIJUANA, weight: 0, unit_count: 0 },
      [PRODUCT_TYPES.HASHISH]: { type: PRODUCT_TYPES.HASHISH, weight: 0, unit_count: 0 }
    };
    
    distributions.forEach(dist => {
      if (!dist.packaging_units) return;
      
      dist.packaging_units.forEach(unit => {
        // Bestimmen des Produkttyps durch Analyse der Batch-Nummer oder des Batch-Objekts
        const productType = determineProductType(unit);
        
        if (productType === 'marijuana') {
          summary[PRODUCT_TYPES.MARIJUANA].weight += parseFloat(unit.weight || 0);
          summary[PRODUCT_TYPES.MARIJUANA].unit_count += 1;
        } else if (productType === 'hashish') {
          summary[PRODUCT_TYPES.HASHISH].weight += parseFloat(unit.weight || 0);
          summary[PRODUCT_TYPES.HASHISH].unit_count += 1;
        }
      });
    });
    
    // Konvertieren des Objekts in ein Array für die API-Kompatibilität
    return Object.values(summary);
  };
  
  // Hilfsfunktion zur Berechnung der Produktzusammenfassung für eine einzelne Distribution
  const calculateDistributionSummary = (distribution) => {
    const summary = {
      [PRODUCT_TYPES.MARIJUANA]: { type: PRODUCT_TYPES.MARIJUANA, weight: 0 },
      [PRODUCT_TYPES.HASHISH]: { type: PRODUCT_TYPES.HASHISH, weight: 0 }
    };
    
    if (!distribution.packaging_units) return Object.values(summary);
    
    distribution.packaging_units.forEach(unit => {
      // Bestimmen des Produkttyps
      const productType = determineProductType(unit);
      
      if (productType === 'marijuana') {
        summary[PRODUCT_TYPES.MARIJUANA].weight += parseFloat(unit.weight || 0);
      } else if (productType === 'hashish') {
        summary[PRODUCT_TYPES.HASHISH].weight += parseFloat(unit.weight || 0);
      }
    });
    
    // Konvertieren des Objekts in ein Array für die API-Kompatibilität
    return Object.values(summary);
  };
  
  // Hilfsfunktion zur Bestimmung des Produkttyps einer Verpackungseinheit
  const determineProductType = (unit) => {
    // Verschiedene Möglichkeiten zur Bestimmung des Produkttyps prüfen
    
    // 1. Direkt aus der Einheit, falls vorhanden
    if (unit.product_type) return unit.product_type;
    
    // 2. Aus dem Batch-Objekt, falls vorhanden
    if (unit.batch && unit.batch.product_type) return unit.batch.product_type;
    
    // 3. Aus der Batch-Nummer ableiten, falls vorhanden
    if (unit.batch_number) {
      if (unit.batch_number.includes('marijuana') || unit.batch_number.includes('marihuana')) {
        return 'marijuana';
      } else if (unit.batch_number.includes('hashish') || unit.batch_number.includes('haschisch')) {
        return 'hashish';
      }
    }
    
    // 4. Fallback-Prüfung: Überprüfen des verschachtelten Pfads
    try {
      if (
        unit.batch && 
        unit.batch.lab_testing_batch && 
        unit.batch.lab_testing_batch.processing_batch && 
        unit.batch.lab_testing_batch.processing_batch.product_type
      ) {
        return unit.batch.lab_testing_batch.processing_batch.product_type;
      }
    } catch (e) {
      // Ignorieren einer möglichen Exception durch verschachtelte Zugriffe
    }
    
    // Falls der Typ aus dem Batch-Objekt nicht bestimmt werden kann, prüfe die Batch-Objekt-Beziehung
    try {
      // Prüfe, ob wir bereits ein Batch-Objekt haben
      if (unit.batch) {
        // Versuche den Produkttyp aus dem `product_type_display` des Batches zu ermitteln
        if (typeof unit.batch.product_type_display === 'string') {
          if (unit.batch.product_type_display.toLowerCase().includes('marihuana')) {
            return 'marijuana';
          } else if (unit.batch.product_type_display.toLowerCase().includes('haschisch')) {
            return 'hashish';
          }
        }
      }
    } catch (e) {
      // Ignorieren einer möglichen Exception
    }
    
    // Standardwert, wenn nichts gefunden wurde
    return 'marijuana';  // Standardmäßig Marihuana annehmen
  };
  
  // Hilfsfunktion zur Formatierung des Datums
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hilfsfunktion für kurzes Datum (nur für Charts)
  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
  };
  
  // Generiere Konsumverlaufsdaten für die Tabelle
  const consumptionTableData = useMemo(() => {
    if (!distributionData || !distributionData.received || !distributionData.received.recent_distributions) {
      return [];
    }
    
    return distributionData.received.recent_distributions.map(dist => {
      // Berechnung der Summen nach Produkttyp
      const productTypeSummary = {};
      
      // Verwende product_type_summary, falls vorhanden, sonst berechne es basierend auf packaging_units
      const productSummaries = dist.product_type_summary || calculateDistributionSummary(dist);
      
      productSummaries.forEach(summary => {
        const type = summary.type;
        if (!productTypeSummary[type]) {
          productTypeSummary[type] = {
            count: 0,
            weight: 0,
            thcRange: []
          };
        }
        
        productTypeSummary[type].weight += parseFloat(summary.weight || 0);
      });
      
      // Zusätzliche Informationen aus packaging_units extrahieren, falls verfügbar
      if (dist.packaging_units && dist.packaging_units.length > 0) {
        dist.packaging_units.forEach(unit => {
          const productType = determineProductType(unit);
          const displayType = productType === 'marijuana' ? PRODUCT_TYPES.MARIJUANA : PRODUCT_TYPES.HASHISH;
          
          if (!productTypeSummary[displayType]) {
            productTypeSummary[displayType] = {
              count: 0,
              weight: 0,
              thcRange: []
            };
          }
          
          productTypeSummary[displayType].count += 1;
          
          // THC-Gehalt erfassen, falls verfügbar
          try {
            let thcContent = null;
            
            // Versuche, THC-Inhalt aus verschiedenen Quellen zu erhalten
            if (unit.batch && unit.batch.thc_content) {
              thcContent = parseFloat(unit.batch.thc_content);
            } else if (unit.batch && unit.batch.lab_testing_batch && unit.batch.lab_testing_batch.thc_content) {
              thcContent = parseFloat(unit.batch.lab_testing_batch.thc_content);
            }
            
            if (thcContent !== null && !isNaN(thcContent)) {
              productTypeSummary[displayType].thcRange.push(thcContent);
            }
          } catch (e) {
            // Ignorieren von Fehlern bei der THC-Extraktion
          }
        });
      }
      
      // THC-Bereich formatieren
      Object.keys(productTypeSummary).forEach(type => {
        const thcValues = productTypeSummary[type].thcRange;
        if (thcValues.length > 0) {
          const min = Math.min(...thcValues);
          const max = Math.max(...thcValues);
          productTypeSummary[type].thcDisplay = min === max 
            ? `${min.toFixed(1)}%`
            : `${min.toFixed(1)}-${max.toFixed(1)}%`;
        } else {
          productTypeSummary[type].thcDisplay = 'k.A.';
        }
      });
      
      return {
        id: dist.id,
        date: new Date(dist.distribution_date),
        dateFormatted: formatDate(dist.distribution_date),
        totalWeight: parseFloat(dist.total_weight || 0),
        batchNumber: dist.batch_number,
        distributor: dist.distributor ? 
          (dist.distributor.display_name || `${dist.distributor.first_name || ''} ${dist.distributor.last_name || ''}`) :
          'Unbekannt',
        notes: dist.notes || '',
        productSummary: productTypeSummary,
        packagingUnits: dist.packaging_units || [],
        totalPrice: parseFloat(dist.total_price || dist.calculated_total_price || 0),
        balanceBefore: dist.balance_before !== undefined ? parseFloat(dist.balance_before) : undefined,
        balanceAfter: dist.balance_after !== undefined ? parseFloat(dist.balance_after) : undefined,
        pricePerGram: dist.total_weight > 0 ? parseFloat((dist.total_price || 0) / dist.total_weight) : 0
      };
    }).sort((a, b) => b.date - a.date); // Neueste zuerst
  }, [distributionData]);
  
  // Debug-Logging für die Konsumtabellendaten
  useEffect(() => {
    logDebug('Konsumtabellendaten:', consumptionTableData);
  }, [consumptionTableData]);
  
  // Generiere Daten für echarts - Verbesserter Ansatz mit mehr Informationen
  const echartsOptions = useMemo(() => {
    if (!consumptionTableData.length) return null;
    
    // Datenpunkte für den Chart vorbereiten
    const chartData = [...consumptionTableData].reverse(); // Chronologisch für Chart
    const dates = chartData.map(item => formatShortDate(item.date));
    
    // Gewichtsdaten nach Produkttyp
    const marijuanaData = chartData.map(item => {
      const marijuanaSummary = item.productSummary[PRODUCT_TYPES.MARIJUANA];
      return marijuanaSummary ? +(marijuanaSummary.weight.toFixed(2)) : 0;
    });
    
    const hashishData = chartData.map(item => {
      const hashishSummary = item.productSummary[PRODUCT_TYPES.HASHISH];
      return hashishSummary ? +(hashishSummary.weight.toFixed(2)) : 0;
    });
    
    // Kumulatives Gesamtgewicht berechnen
    let cumulativeTotal = 0;
    const cumulativeData = chartData.map(item => {
      cumulativeTotal += parseFloat(item.totalWeight || 0);
      return +(cumulativeTotal.toFixed(2));
    });
    
    // Monatslimit als horizontale Linie
    const monthlyLimitData = new Array(dates.length).fill(limits.monthly);
    
    // 🆕 Preisdaten
    const priceData = chartData.map(item => item.totalPrice);
    const balanceData = chartData.map(item => item.balanceAfter !== undefined ? item.balanceAfter : 0);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const date = params[0].name;
          let tooltip = `<div style="font-weight:bold;margin-bottom:5px;">${date}</div>`;
          
          // Variable für Gesamtgewicht der Ausgabe
          let totalDayWeight = 0;
          let totalDayPrice = 0;
          
          params.forEach(param => {
            if (param.seriesName === 'Monatslimit') return;  // Limit nicht im Tooltip anzeigen
            
            const color = param.color;
            const name = param.seriesName;
            const value = param.value;
            const unit = name === 'Kumulativ' ? 'g gesamt' : 
                        (name === 'Kosten' || name === 'Kontostand') ? '€' : 'g';
            
            if (value > 0 || name === 'Kontostand') {
              tooltip += `<div style="display:flex;align-items:center;margin:3px 0;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px;"></span>
                <span style="margin-right:5px;">${name}:</span>
                <span style="font-weight:bold;">${value} ${unit}</span>
              </div>`;
            }
            
            // Berechne das Gesamtgewicht für diesen Tag (nur für Produkttypen)
            if (name === 'Marihuana' || name === 'Haschisch') {
              totalDayWeight += value;
            }
            
            if (name === 'Kosten') {
              totalDayPrice = value;
            }
          });
          
          // Zeige Tageslimit an, wenn Daten vorhanden sind
          const index = params[0].dataIndex;
          if (index >= 0 && (marijuanaData[index] > 0 || hashishData[index] > 0)) {
            const limitPercent = Math.min(100, (totalDayWeight / limits.daily) * 100).toFixed(0);
            tooltip += `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed rgba(255,255,255,0.3);">
              <div>Tageslimit: ${totalDayWeight}/${limits.daily}g (${limitPercent}%)</div>
            </div>`;
          }
          
          // Zeige Preis pro Gramm
          if (totalDayPrice > 0 && totalDayWeight > 0) {
            const pricePerGram = (totalDayPrice / totalDayWeight).toFixed(2);
            tooltip += `<div>Preis pro Gramm: ${pricePerGram} €/g</div>`;
          }
          
          // Zeige Monatslimit an, wenn Kumulativdaten vorhanden sind
          const cumIndex = params.findIndex(p => p.seriesName === 'Kumulativ');
          if (cumIndex >= 0) {
            const cumValue = params[cumIndex].value;
            const limitPercent = Math.min(100, (cumValue / limits.monthly) * 100).toFixed(0);
            tooltip += `<div style="margin-top:5px;">
              <div>Monatslimit: ${cumValue}/${limits.monthly}g (${limitPercent}%)</div>
            </div>`;
          }
          
          return tooltip;
        }
      },
      legend: {
        data: ['Marihuana', 'Haschisch', 'Kumulativ', 'Monatslimit', 'Kosten', 'Kontostand'],
        icon: 'circle',
        bottom: 0,
        selected: {
          'Monatslimit': true,
          'Kosten': showPriceHistory,
          'Kontostand': showPriceHistory
        }
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          interval: Math.ceil(dates.length / 10), // Bei vielen Datenpunkten nur einige Labels anzeigen
          rotate: dates.length > 8 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Gramm',
          splitLine: { show: false },
          axisLabel: {
            formatter: '{value} g'
          }
        },
        {
          type: 'value',
          name: 'Euro',
          position: 'right',
          axisLabel: {
            formatter: '{value} €'
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Marihuana',
          type: 'bar',
          stack: 'Produkte',
          emphasis: { focus: 'series' },
          data: marijuanaData,
          itemStyle: { color: theme.palette.success.main }
        },
        {
          name: 'Haschisch',
          type: 'bar',
          stack: 'Produkte',
          emphasis: { focus: 'series' },
          data: hashishData,
          itemStyle: { color: theme.palette.warning.main }
        },
        {
          name: 'Kumulativ',
          type: 'line',
          smooth: true,
          emphasis: { focus: 'series' },
          data: cumulativeData,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: theme.palette.primary.main },
          lineStyle: { width: 3, shadowColor: alpha(theme.palette.primary.main, 0.3), shadowBlur: 10 }
        },
        {
          name: 'Monatslimit',
          type: 'line',
          symbol: 'none',
          lineStyle: { 
            type: 'dashed',
            color: theme.palette.error.main,
            width: 2
          },
          data: monthlyLimitData
        },
        {
          name: 'Kosten',
          type: 'bar',
          yAxisIndex: 1,
          data: priceData,
          itemStyle: { color: alpha(theme.palette.primary.main, 0.5) }
        },
        {
          name: 'Kontostand',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: balanceData,
          itemStyle: { color: theme.palette.secondary.main },
          lineStyle: { width: 2 }
        }
      ]
    };
  }, [consumptionTableData, theme, limits, showPriceHistory]);
  
  // Debug-Logging für die Chart-Optionen
  useEffect(() => {
    logDebug('ECharts-Optionen:', echartsOptions);
  }, [echartsOptions]);
  
  if (loading) {
    return (
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[3] }}>
        <Typography>Lade Ausgabehistorie...</Typography>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[3], border: `1px solid ${theme.palette.error.light}` }}>
        <Typography color="error" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoOutlinedIcon sx={{ mr: 1 }} /> {error}
        </Typography>
      </Card>
    );
  }
  
  if (!distributionData) {
    return (
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[3] }}>
        <Typography>Keine Daten verfügbar</Typography>
      </Card>
    );
  }
  
  return (
    <div className="member-distribution-history">
      <Box sx={{ mt: 3 }}>
        <Card sx={{ 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: theme.shadows[3],
          background: `linear-gradient(120deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.lighter || theme.palette.primary.light, 0.1)} 100%)`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 600
              }}>
                Cannabis-Ausgabehistorie für {getMonthName(selectedMonth)} {selectedYear}
              </Typography>
              
              {/* Monats- und Jahresauswahl - Wird neben Erwachsenen-Limits verschoben */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Altersbezogene Limits-Anzeige */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Altersbezogene Limits:
                      </Typography>
                      <Typography variant="body2">
                        • Maximal {limits.daily}g pro Tag
                      </Typography>
                      <Typography variant="body2">
                        • Maximal {limits.monthly}g pro Monat
                      </Typography>
                      {limits.maxThc && (
                        <Typography variant="body2">
                          • THC-Gehalt maximal {limits.maxThc}%
                        </Typography>
                      )}
                    </Box>
                  }>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      border: `1px solid ${limits.category === 'young-adult' ? theme.palette.warning.main : theme.palette.primary.main}`,
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      mr: 2
                    }}>
                      <FingerprintIcon 
                        sx={{ 
                          mr: 0.5, 
                          color: limits.category === 'young-adult' ? theme.palette.warning.main : theme.palette.primary.main 
                        }} 
                        fontSize="small" 
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {limits.category === 'young-adult' ? 'U21-Limits' : 'Erwachsenen-Limits'}
                      </Typography>
                      <HelpOutlineIcon sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                    </Box>
                  </Tooltip>
                </Box>

                {/* Monats- und Jahresauswahl - jetzt direkt nach Erwachsenen-Limits */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    onClick={handlePreviousMonth}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <KeyboardArrowLeftIcon />
                  </IconButton>
                  
                  <Button 
                    variant="outlined" 
                    onClick={handleMonthMenuOpen}
                    endIcon={<ExpandMoreIcon />}
                    size="small"
                  >
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Button>
                  
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMonthMenuClose}
                    PaperProps={{
                      style: {
                        maxHeight: 300,
                        width: 200,
                      },
                    }}
                  >
                    {getYearMonthOptions().map((option) => (
                      <MenuItem
                        key={`${option.year}-${option.month}`}
                        onClick={() => handleMonthYearSelect(option.year, option.month)}
                        selected={selectedYear === option.year && selectedMonth === option.month}
                      >
                        {getMonthName(option.month)} {option.year}
                      </MenuItem>
                    ))}
                  </Menu>
                  
                  <IconButton 
                    onClick={handleNextMonth}
                    size="small"
                    sx={{ ml: 1 }}
                    disabled={selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()}
                  >
                    <KeyboardArrowRightIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
            
            {/* Neues moderneres Karten-Layout mit exakt gleicher Breite */}
            <Box sx={{ 
              display: 'flex',
              width: '100%',
              mb: 3,
              overflow: 'hidden'
            }}>
              {/* Gemeinsame Kartenformat-Funktion */}
              {[
                // Karte 1: Ausgaben (Erste Position)
                {
                  icon: <InventoryIcon />,
                  title: "Ausgaben",
                  value: distributionData.received.total_count || 0,
                  unit: "",
                  color: theme.palette.success.main,
                  infoText: `insgesamt im ${getMonthName(selectedMonth)}`
                },
                
                // Karte 2: Heutiges Limit (Zweite Position)
                {
                  icon: <ScheduleIcon />,
                  title: "Tageslimit",
                  value: distributionData.consumption ? distributionData.consumption.today.toFixed(1) : '0.0',
                  unit: "g",
                  maxValue: distributionData.consumption?.dailyLimit,
                  color: theme.palette.success.main,
                  percentage: distributionData.consumption?.dailyPercentage || 0,
                  remaining: distributionData.consumption?.remainingDaily || 0,
                  progressColor: distributionData.consumption?.dailyPercentage > 90 ? theme.palette.error.main : theme.palette.success.main
                },
                
                // Karte 3: Monatslimit (Dritte Position)
                {
                  icon: <ScaleIcon />,
                  title: "Monatslimit",
                  value: distributionData.received.total_weight ? distributionData.received.total_weight.toFixed(1) : '0.0',
                  unit: "g",
                  maxValue: distributionData.consumption?.monthlyLimit,
                  color: theme.palette.success.main,
                  percentage: distributionData.consumption?.monthlyPercentage || 0,
                  remaining: distributionData.consumption?.remainingMonthly || 0,
                  progressColor: distributionData.consumption?.monthlyPercentage > 90 ? theme.palette.error.main : theme.palette.success.main
                },
                
                // Karte 4: Marihuana 
                {
                  icon: <LocalFloristIcon />,
                  title: "Marihuana",
                  value: (() => {
                    if (distributionData.received.product_summary) {
                      const marijuanaSummary = distributionData.received.product_summary.find(p => p.type === PRODUCT_TYPES.MARIJUANA);
                      return marijuanaSummary ? marijuanaSummary.weight.toFixed(1) : '0.0';
                    }
                    return '0.0';
                  })(),
                  unit: "g",
                  color: theme.palette.success.main,
                  infoText: (() => {
                    if (distributionData.received.product_summary) {
                      const marijuanaSummary = distributionData.received.product_summary.find(p => p.type === PRODUCT_TYPES.MARIJUANA);
                      return `${marijuanaSummary ? (marijuanaSummary.unit_count || 0) : 0} Einheiten`;
                    }
                    return "0 Einheiten";
                  })(),
                  badge: limits.maxThc ? `max ${limits.maxThc}% THC` : null
                },
                
                // Karte 5: Haschisch - jetzt auch in Grün
                {
                  icon: <FilterDramaIcon />,
                  title: "Haschisch",
                  value: (() => {
                    if (distributionData.received.product_summary) {
                      const hashishSummary = distributionData.received.product_summary.find(p => p.type === PRODUCT_TYPES.HASHISH);
                      return hashishSummary ? hashishSummary.weight.toFixed(1) : '0.0';
                    }
                    return '0.0';
                  })(),
                  unit: "g",
                  color: theme.palette.success.main,
                  infoText: (() => {
                    if (distributionData.received.product_summary) {
                      const hashishSummary = distributionData.received.product_summary.find(p => p.type === PRODUCT_TYPES.HASHISH);
                      return `${hashishSummary ? (hashishSummary.unit_count || 0) : 0} Einheiten`;
                    }
                    return "0 Einheiten";
                  })()
                },
                
                // 🆕 Karte 6: Kontostand
                {
                  icon: <AccountBalanceWalletIcon />,
                  title: "Kontostand",
                  value: (() => {
                    // Versuche Kontostand aus verschiedenen Quellen zu holen
                    let kontostand = 0;
                    if (distributionData.member?.kontostand !== undefined) {
                      kontostand = parseFloat(distributionData.member.kontostand);
                    } else if (member?.kontostand !== undefined) {
                      kontostand = parseFloat(member.kontostand);
                    }
                    return kontostand.toFixed(2);
                  })(),
                  unit: "€",
                  color: (() => {
                    let kontostand = 0;
                    if (distributionData.member?.kontostand !== undefined) {
                      kontostand = parseFloat(distributionData.member.kontostand);
                    } else if (member?.kontostand !== undefined) {
                      kontostand = parseFloat(member.kontostand);
                    }
                    return kontostand >= 0 ? theme.palette.success.main : theme.palette.error.main;
                  })(),
                  infoText: `Monatsbeitrag: ${distributionData.member?.beitrag || member?.beitrag || 0} €`,
                  badge: (() => {
                    let kontostand = 0;
                    if (distributionData.member?.kontostand !== undefined) {
                      kontostand = parseFloat(distributionData.member.kontostand);
                    } else if (member?.kontostand !== undefined) {
                      kontostand = parseFloat(member.kontostand);
                    }
                    return kontostand < 0 ? 'Negativ' : null;
                  })(),
                  additionalAction: (
                    <IconButton 
                      size="small" 
                      onClick={() => setShowPriceHistory(!showPriceHistory)}
                      sx={{ ml: 1 }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  )
                }
              ].map((card, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: `${100/6}%`,
                    px: 0.5 // Reduzierter seitlicher Abstand für gleichmäßige Breite
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5, // Reduziertes Padding für gleichmäßige Breite
                      height: '100%',
                      borderRadius: 2,
                      border: `1px solid ${alpha(card.color || theme.palette.success.main, 0.2)}`,
                      background: `linear-gradient(145deg, ${alpha(card.color || theme.palette.success.main, 0.02)} 0%, ${alpha(card.color || theme.palette.success.main, 0.08)} 100%)`,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: `0 0 8px ${alpha(card.color || theme.palette.success.main, 0.3)}`,
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    {/* Kartenkopf */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            mr: 1, 
                            color: card.color || theme.palette.success.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: alpha(card.color || theme.palette.success.main, 0.1)
                          }}
                        >
                          {React.cloneElement(card.icon, { fontSize: 'small' })}
                        </Box>
                        <Typography 
                          variant="subtitle2" 
                          noWrap 
                          sx={{ 
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          {card.title}
                        </Typography>
                      </Box>
                      
                      {/* Badge falls vorhanden */}
                      {card.badge && (
                        <Tooltip title={`THC-Gehalt begrenzt auf ${limits.maxThc}%`}>
                          <Chip
                            size="small"
                            label={card.badge}
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: alpha(card.color || theme.palette.success.main, 0.1),
                              color: card.color || theme.palette.success.main
                            }}
                          />
                        </Tooltip>
                      )}
                      
                      {/* Prozentanzeige falls vorhanden */}
                      {card.percentage && (
                        <Tooltip title={`${card.title}: ${card.percentage.toFixed(0)}% genutzt`}>
                          <Chip
                            size="small"
                            label={`${card.percentage.toFixed(0)}%`}
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: alpha(card.progressColor || theme.palette.success.main, 0.1),
                              color: card.progressColor || theme.palette.success.main
                            }}
                          />
                        </Tooltip>
                      )}
                      
                      {/* Zusätzliche Aktion falls vorhanden */}
                      {card.additionalAction}
                    </Box>
                    
                    {/* Karteninhalt mit Speziallayout für Alterslimits */}
                    {card.additionalInfo ? (
                      <>
                        {/* Standardformat für Wertanzeigen */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: card.color || theme.palette.success.dark, fontSize: '1.7rem' }}>
                            {card.value}
                          </Typography>
                          {card.unit && (
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                              {card.unit}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Tageslimit und Monatslimit direkt unter dem Alter nebeneinander */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', color: card.color || theme.palette.success.dark }}>
                            {card.additionalInfo.dailyLimit}g/Tag
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', color: card.color || theme.palette.success.dark, ml: 2 }}>
                            {card.additionalInfo.monthlyLimit}g/Monat
                          </Typography>
                        </Box>
                        
                        {/* THC-Info am unteren Rand */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 'auto', 
                          pt: 0.5,
                          borderTop: `1px dashed ${alpha(theme.palette.text.disabled, 0.2)}`
                        }}>
                          <Typography 
                            variant="body2" 
                            color="textSecondary" 
                            noWrap 
                            sx={{ 
                              fontSize: '0.7rem',
                              width: '100%',
                              textAlign: 'center'
                            }}
                          >
                            {card.additionalInfo.thcInfo}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        {/* Standardformat für Wertanzeigen */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: card.color || theme.palette.success.dark, fontSize: '1.7rem' }}>
                            {card.value}
                          </Typography>
                          {card.unit && (
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                              {card.unit}
                            </Typography>
                          )}
                          {card.maxValue && (
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.4), fontSize: '0.75rem' }}>
                              /{card.maxValue}{card.unit}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Fortschrittsbalken falls vorhanden */}
                        {card.percentage !== undefined && (
                          <Box sx={{ my: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, card.percentage)}
                              sx={{
                                height: 6,
                                borderRadius: 1,
                                backgroundColor: alpha(card.color || theme.palette.success.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: card.progressColor || card.color || theme.palette.success.main
                                }
                              }}
                            />
                          </Box>
                        )}
                        
                        {/* Informationstext */}
                        {(card.infoText || card.remaining !== undefined) && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mt: 'auto', 
                            pt: 0.5,
                            borderTop: `1px dashed ${alpha(theme.palette.text.disabled, 0.2)}`
                          }}>
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              noWrap 
                              sx={{ 
                                fontSize: '0.7rem',
                                width: '100%',
                                textAlign: 'center'
                              }}
                            >
                              {card.infoText || (card.remaining !== undefined ? `Noch ${card.remaining.toFixed(1)}${card.unit} verfügbar` : '')}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Paper>
                </Box>
              ))}
            </Box>
            
            {/* 🆕 Kontostand-Historie Modal/Accordion */}
            {showPriceHistory && (
              <Card sx={{ mt: 2, mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Kontostand-Historie
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Datum</TableCell>
                        <TableCell>Transaktion</TableCell>
                        <TableCell align="right">Betrag</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Aktueller Kontostand als erste Zeile */}
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Heute</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Aktueller Stand</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>—</TableCell>
                        <TableCell align="right" sx={{ 
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: (distributionData.member?.kontostand !== undefined ? parseFloat(distributionData.member.kontostand) : 0) >= 0 ? 'success.main' : 'error.main'
                        }}>
                          {distributionData.member?.kontostand !== undefined ? parseFloat(distributionData.member.kontostand).toFixed(2) : '0.00'} €
                        </TableCell>
                      </TableRow>
                      {/* Transaktionen - neueste zuerst */}
                      {consumptionTableData
                        .sort((a, b) => b.date - a.date)
                        .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatShortDate(item.date)}</TableCell>
                          <TableCell>Cannabis-Ausgabe</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            -{item.totalPrice.toFixed(2)} €
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontWeight: 600,
                            color: (item.balanceAfter !== undefined ? item.balanceAfter : 0) >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {item.balanceAfter !== undefined ? item.balanceAfter.toFixed(2) : '—'} €
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </CardContent>
        </Card>
        
        {/* Tabs für Konsumverlauf und Details */}
        <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab 
              icon={<TimelineIcon sx={{ mr: 1 }} />} 
              label="Konsumverlauf" 
              iconPosition="start"
              sx={{ fontWeight: activeTab === 0 ? 600 : 400 }}
            />
            <Tab 
              icon={<TableChartIcon sx={{ mr: 1 }} />} 
              label="Detaillierte Ausgaben" 
              iconPosition="start"
              sx={{ fontWeight: activeTab === 1 ? 600 : 400 }}
            />
          </Tabs>
        </Box>
        
        {/* Konsumverlauf Tab */}
        {activeTab === 0 && (
          <Box>
            {/* Hinweis auf Tageslimit */}
            {distributionData.consumption && (
              <Card sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                <GppGoodIcon sx={{ color: 
                  distributionData.consumption.dailyPercentage > 90 
                    ? theme.palette.error.main 
                    : distributionData.consumption.dailyPercentage > 70 
                      ? theme.palette.warning.main 
                      : theme.palette.success.main, 
                  mr: 2 
                }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2">Tagesbezug: {distributionData.consumption.today.toFixed(1)}g von {distributionData.consumption.dailyLimit}g</Typography>
                    <Typography variant="caption" sx={{ 
                      color: distributionData.consumption.dailyPercentage > 90 
                        ? theme.palette.error.main 
                        : 'text.secondary' 
                    }}>
                      {distributionData.consumption.remainingDaily.toFixed(1)}g verbleibend
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={distributionData.consumption.dailyPercentage}
                    sx={{ 
                      height: 6, 
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: distributionData.consumption.dailyPercentage > 90 
                          ? theme.palette.error.main 
                          : distributionData.consumption.dailyPercentage > 70
                            ? theme.palette.warning.main
                            : theme.palette.success.main
                      }
                    }}
                  />
                </Box>
              </Card>
            )}
            
            {/* ECharts Diagramm */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Grafischer Konsumverlauf
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showPriceHistory}
                        onChange={(e) => setShowPriceHistory(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Preise anzeigen"
                    sx={{ m: 0 }}
                  />
                  
                  <Tooltip title="Die Balken zeigen die täglichen Ausgaben, die Linie den kumulativen Monatskonsum. Die gestrichelte Linie markiert das Monatslimit.">
                    <InfoOutlinedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </Tooltip>
                </Box>
              </Box>
              
              {echartsOptions && consumptionTableData.length > 0 ? (
                <Box sx={{ height: 400 }}>
                  <ReactECharts 
                    option={echartsOptions} 
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 10 }}>
                  Nicht genügend Daten für die Visualisierung vorhanden
                </Typography>
              )}
            </Card>
            
            {/* Tabellarischer Konsumverlauf */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell>Datum</TableCell>
                      <TableCell>Chargennummer</TableCell>
                      <TableCell>Marihuana</TableCell>
                      <TableCell>Haschisch</TableCell>
                      <TableCell align="right">Gewicht</TableCell>
                      <TableCell align="right">Preis</TableCell>
                      <TableCell align="right">€/g</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Typography>Kontostand nach Ausgabe</Typography>
                          <Tooltip title="Zeigt den Kontostand nach der Cannabis-Ausgabe. Der Pfeil zeigt die Änderung: vorher → nachher">
                            <InfoOutlinedIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>Ausgeber</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumptionTableData.length > 0 ? (
                      consumptionTableData.map((item) => {
                        // Berechne Tagesgesamtgewicht für den Limitprozentsatz
                        const dayWeight = Object.values(item.productSummary).reduce(
                          (total, product) => total + (product?.weight || 0), 
                          0
                        );
                        const dayLimitPercentage = Math.min(100, (dayWeight / limits.daily) * 100);
                        
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell>{item.dateFormatted}</TableCell>
                            <TableCell>{item.batchNumber}</TableCell>
                            <TableCell>
                              {item.productSummary[PRODUCT_TYPES.MARIJUANA] && 
                               item.productSummary[PRODUCT_TYPES.MARIJUANA].weight > 0 ? (
                                <Box>
                                  <Typography variant="body2">
                                    {item.productSummary[PRODUCT_TYPES.MARIJUANA].weight.toFixed(2)}g
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    THC: {item.productSummary[PRODUCT_TYPES.MARIJUANA].thcDisplay}
                                  </Typography>
                                </Box>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {item.productSummary[PRODUCT_TYPES.HASHISH] && 
                               item.productSummary[PRODUCT_TYPES.HASHISH].weight > 0 ? (
                                <Box>
                                  <Typography variant="body2">
                                    {item.productSummary[PRODUCT_TYPES.HASHISH].weight.toFixed(2)}g
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    THC: {item.productSummary[PRODUCT_TYPES.HASHISH].thcDisplay}
                                  </Typography>
                                </Box>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                              {item.totalWeight.toFixed(2)}g
                            </TableCell>
                            
                            {/* 🆕 Preis-Zellen */}
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {item.totalPrice.toFixed(2)} €
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {item.pricePerGram.toFixed(2)} €/g
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600,
                                  color: (item.balanceAfter !== undefined ? item.balanceAfter : 0) >= 0 ? 'success.main' : 'error.main',
                                  textAlign: 'right'
                                }}>
                                  {item.balanceAfter !== undefined ? item.balanceAfter.toFixed(2) : '—'} €
                                </Typography>
                                {item.balanceBefore !== undefined && item.balanceAfter !== undefined && (
                                  <Typography variant="caption" sx={{ 
                                    color: 'text.disabled',
                                    display: 'block',
                                    textAlign: 'right',
                                    mt: 0.25
                                  }}>
                                    {item.balanceBefore.toFixed(2)} € → {item.balanceAfter.toFixed(2)} €
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            <TableCell>{item.distributor}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                            Keine Ausgabedaten im gewählten Zeitraum
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        )}
        
        {/* Detaillierte Ausgaben Tab - Code unverändert */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
              Detaillierte Einzelausgaben
            </Typography>
            
            {distributionData.received.recent_distributions && distributionData.received.recent_distributions.length > 0 ? (
              <Box>
                {distributionData.received.recent_distributions.map((distribution) => (
                  <Accordion 
                    key={distribution.id} 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '8px !important',
                      overflow: 'hidden',
                      '&:before': { display: 'none' },
                      boxShadow: theme.shadows[2]
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Ausgabe vom {formatDate(distribution.distribution_date)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={`${distribution.total_weight.toFixed(2)}g`}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main
                              }}
                            />
                            {/* 🆕 Preis-Chip */}
                            <Chip 
                              label={`${(parseFloat(distribution.total_price || 0)).toFixed(2)} €`}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.main
                              }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {/* Verwende product_type_summary, falls vorhanden, sonst erstelle es */}
                          {(distribution.product_type_summary || []).map((product, idx) => {
                            if (!product || !product.type || product.weight <= 0) return null;
                            
                            const isMarijuana = product.type === PRODUCT_TYPES.MARIJUANA;
                            const ProductIcon = isMarijuana ? LocalFloristIcon : FilterDramaIcon;
                            const color = isMarijuana ? theme.palette.success.main : theme.palette.warning.main;
                            
                            return (
                              <Chip
                                key={idx}
                                size="small"
                                icon={<ProductIcon style={{ color }} />}
                                label={`${product.type}: ${product.weight.toFixed(2)}g`}
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  height: '24px',
                                  backgroundColor: alpha(color, 0.1),
                                  color: color,
                                  '& .MuiChip-label': { px: 1 },
                                  '& .MuiChip-icon': { ml: 0.5 }
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                            <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                              Chargennummer
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {distribution.batch_number}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                            <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                              Ausgegeben von
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {distribution.distributor?.display_name || `${distribution.distributor?.first_name || ''} ${distribution.distributor?.last_name || ''}`}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        {/* 🆕 Kontostand-Feld */}
                        <Grid item xs={12} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                            <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                              Kontostand-Verlauf
                            </Typography>
                            <Box>
                              <Typography variant="body1" sx={{ 
                                fontWeight: 500, 
                                color: (distribution.balance_after !== undefined ? parseFloat(distribution.balance_after) : 0) >= 0 ? 'success.main' : 'error.main' 
                              }}>
                                {distribution.balance_after !== undefined ? parseFloat(distribution.balance_after).toFixed(2) : '—'} €
                              </Typography>
                              {distribution.balance_before !== undefined && distribution.balance_after !== undefined && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                  {parseFloat(distribution.balance_before).toFixed(2)} € → {parseFloat(distribution.balance_after).toFixed(2)} €
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                            <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                              Bemerkungen
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {distribution.notes || 'Keine Bemerkungen'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, mb: 2 }}>
                        Erhaltene Verpackungseinheiten
                      </Typography>
                      
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell>Einheits-Nr.</TableCell>
                              <TableCell>Produkttyp</TableCell>
                              <TableCell align="right">Gewicht</TableCell>
                              <TableCell align="right">Preis</TableCell>
                              <TableCell>THC-Gehalt</TableCell>
                              <TableCell>CBD-Gehalt</TableCell>
                              <TableCell>Sorte</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(distribution.packaging_units || []).length > 0 ? (
                              distribution.packaging_units.map((unit) => {
                                // Bestimme den Produkttyp für die Anzeige
                                const productType = determineProductType(unit);
                                const isMarijuana = productType === 'marijuana';
                                const displayType = isMarijuana ? PRODUCT_TYPES.MARIJUANA : PRODUCT_TYPES.HASHISH;
                                
                                // Versuch, THC- und CBD-Gehalt zu extrahieren
                                let thcContent = 'k.A.';
                                let cbdContent = 'k.A.';
                                let strain = 'k.A.';
                                
                                try {
                                  // THC-Gehalt aus verschiedenen Quellen versuchen zu extrahieren
                                  if (unit.batch && unit.batch.thc_content) {
                                    thcContent = `${unit.batch.thc_content}%`;
                                  } else if (unit.batch && unit.batch.lab_testing_batch && unit.batch.lab_testing_batch.thc_content) {
                                    thcContent = `${unit.batch.lab_testing_batch.thc_content}%`;
                                  }
                                  
                                  // CBD-Gehalt
                                  if (unit.batch && unit.batch.cbd_content) {
                                    cbdContent = `${unit.batch.cbd_content}%`;
                                  } else if (unit.batch && unit.batch.lab_testing_batch && unit.batch.lab_testing_batch.cbd_content) {
                                    cbdContent = `${unit.batch.lab_testing_batch.cbd_content}%`;
                                  }
                                  
                                  // Sorte/Strain
                                  if (unit.batch && unit.batch.source_strain) {
                                    strain = unit.batch.source_strain;
                                  }
                                } catch (e) {
                                  // Ignorieren von Fehlern bei der Datenextraktion
                                }
                                
                                return (
                                  <TableRow key={unit.id} hover>
                                    <TableCell>{unit.batch_number}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {isMarijuana ? (
                                          <LocalFloristIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                        ) : (
                                          <FilterDramaIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                                        )}
                                        {displayType}
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">{parseFloat(unit.weight).toFixed(2)}g</TableCell>
                                    {/* 🆕 Preis-Spalte */}
                                    <TableCell align="right">
                                      {unit.unit_price !== undefined && unit.unit_price !== null ? (
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {parseFloat(unit.unit_price).toFixed(2)} €
                                        </Typography>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {thcContent !== 'k.A.' ? (
                                        <Chip 
                                          size="small" 
                                          label={thcContent}
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.7rem',
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main
                                          }} 
                                        />
                                      ) : (
                                        'k.A.'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {cbdContent !== 'k.A.' ? (
                                        <Chip 
                                          size="small" 
                                          label={cbdContent}
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.7rem',
                                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                                            color: theme.palette.info.main
                                          }} 
                                        />
                                      ) : (
                                        'k.A.'
                                      )}
                                    </TableCell>
                                    <TableCell>{strain}</TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} align="center">
                                  <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                    Keine Verpackungseinheiten verfügbar
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Card sx={{ p: 3, mb: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Keine Produktausgaben im gewählten Zeitraum
                </Typography>
              </Card>
            )}
          </Box>
        )}
      </Box>
    </div>
  );
};

export default MemberDistributionHistory;