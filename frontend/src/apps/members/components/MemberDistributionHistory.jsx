// /trackandtrace/components/MemberDistributionHistory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Paper, Divider, Chip, Button,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Accordion, AccordionSummary, 
  AccordionDetails, Tab, Tabs, useTheme, alpha,
  Card, CardContent, Grid, IconButton, MenuItem,
  Select, FormControl, InputLabel, LinearProgress,
  Tooltip, Stack, Menu
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import InventoryIcon from '@mui/icons-material/Inventory';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ScaleIcon from '@mui/icons-material/Scale';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GppGoodIcon from '@mui/icons-material/GppGood';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
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
 * @returns {JSX.Element} Die gerenderte Komponente
 */
const MemberDistributionHistory = ({ memberId, memberAge, memberBirthDate }) => {
  const theme = useTheme();
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Zeitauswahl-State mit aktuellem Monat/Jahr als Standardwert
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Debug-Logging aktivieren
  const DEBUG = true;
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
        
        // Debugging der API-Antwort
        logDebug('API-Antwort erhalten:', response.data);
        
        // Verarbeite die Daten und füge eine Produktzusammenfassung hinzu, falls sie fehlt
        const processedData = processApiResponse(response.data);
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
  const processApiResponse = (apiData) => {
    if (!apiData) return null;
    
    // Tiefe Kopie der API-Daten erstellen
    const processedData = JSON.parse(JSON.stringify(apiData));
    
    // Für empfangene Distributionen
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
        totalWeight: dist.total_weight,
        batchNumber: dist.batch_number,
        distributor: dist.distributor ? 
          (dist.distributor.display_name || `${dist.distributor.first_name || ''} ${dist.distributor.last_name || ''}`) :
          'Unbekannt',
        notes: dist.notes || '',
        productSummary: productTypeSummary,
        packagingUnits: dist.packaging_units || []
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
      cumulativeTotal += item.totalWeight;
      return +(cumulativeTotal.toFixed(2));
    });
    
    // Monatslimit als horizontale Linie
    const monthlyLimitData = new Array(dates.length).fill(limits.monthly);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          const date = params[0].name;
          let tooltip = `<div style="font-weight:bold;margin-bottom:5px;">${date}</div>`;
          
          // Variable für Gesamtgewicht der Ausgabe
          let totalDayWeight = 0;
          
          params.forEach(param => {
            if (param.seriesName === 'Monatslimit') return;  // Limit nicht im Tooltip anzeigen
            
            const color = param.color;
            const name = param.seriesName;
            const value = param.value;
            const unit = name === 'Kumulativ' ? 'g gesamt' : 'g';
            
            if (value > 0) {
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
          });
          
          // Zeige Tageslimit an, wenn Daten vorhanden sind
          const index = params[0].dataIndex;
          if (index >= 0 && (marijuanaData[index] > 0 || hashishData[index] > 0)) {
            const limitPercent = Math.min(100, (totalDayWeight / limits.daily) * 100).toFixed(0);
            tooltip += `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed rgba(255,255,255,0.3);">
              <div>Tageslimit: ${totalDayWeight}/${limits.daily}g (${limitPercent}%)</div>
            </div>`;
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
        data: ['Marihuana', 'Haschisch', 'Kumulativ', 'Monatslimit'],
        icon: 'circle',
        bottom: 0,
        selected: {
          'Monatslimit': true // Standardmäßig ausgewählt
        }
      },
      grid: {
        left: '3%',
        right: '4%',
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
        }
      ]
    };
  }, [consumptionTableData, theme, limits]);
  
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
              fontWeight: 600, 
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 4,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 2
              }
            }}>
              Cannabis-Ausgabehistorie für {getMonthName(selectedMonth)} {selectedYear}
            </Typography>
            
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
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Zeitraum
            </Typography>
            
            {/* Monats- und Jahresauswahl */}
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
          
          {/* Zusammenfassung mit Limitanzeigen - symmetrisches Layout mit grünem Farbschema */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Karte 1: Ausgaben */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InventoryIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle2">Ausgaben</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                  {distributionData.received.total_count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  insgesamt im {getMonthName(selectedMonth)}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Karte 2: Gesamtgewicht */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScaleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="subtitle2">Gesamtgewicht</Typography>
                  </Box>
                  {distributionData.consumption && (
                    <Tooltip title={`Monatslimit: ${distributionData.consumption.monthlyLimit}g`}>
                      <Chip 
                        size="small" 
                        label={`${distributionData.consumption.monthlyPercentage.toFixed(0)}%`}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: distributionData.consumption.monthlyPercentage > 90 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.light, 0.2),
                          color: distributionData.consumption.monthlyPercentage > 90 ? theme.palette.error.main : theme.palette.success.dark
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                    {distributionData.received.total_weight ? distributionData.received.total_weight.toFixed(1) : '0.0'}g
                  </Typography>
                  {distributionData.consumption && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      /{distributionData.consumption.monthlyLimit}g
                    </Typography>
                  )}
                </Box>
                {distributionData.consumption && (
                  <Box sx={{ mt: 1.5, mb: 0.5 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={distributionData.consumption.monthlyPercentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.success.light, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: distributionData.consumption.monthlyPercentage > 90 
                            ? theme.palette.error.main 
                            : theme.palette.success.main
                        }
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Karte 3: Marihuana */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalFloristIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle2">Marihuana</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                  {(() => {
                    // Suche nach Marihuana in der Produktzusammenfassung
                    if (distributionData.received.product_summary) {
                      const marijuanaSummary = distributionData.received.product_summary.find(
                        p => p.type === PRODUCT_TYPES.MARIJUANA
                      );
                      return marijuanaSummary ? marijuanaSummary.weight.toFixed(1) : '0.0';
                    }
                    return '0.0';
                  })()}g
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">
                    ({(() => {
                      // Einheiten für Marihuana
                      if (distributionData.received.product_summary) {
                        const marijuanaSummary = distributionData.received.product_summary.find(
                          p => p.type === PRODUCT_TYPES.MARIJUANA
                        );
                        return marijuanaSummary ? (marijuanaSummary.unit_count || 0) : 0;
                      }
                      return 0;
                    })()} Einheiten)
                  </Typography>
                  
                  {/* THC-Begrenzung für junge Erwachsene */}
                  {limits.maxThc && (
                    <Tooltip title={`THC-Gehalt begrenzt auf ${limits.maxThc}%`}>
                      <Chip 
                        size="small" 
                        label={`max ${limits.maxThc}% THC`}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.6rem',
                          bgcolor: alpha(theme.palette.success.light, 0.2),
                          color: theme.palette.success.dark
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            </Grid>
            
            {/* Karte 4: Haschisch */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FilterDramaIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle2">Haschisch</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                  {(() => {
                    // Suche nach Haschisch in der Produktzusammenfassung
                    if (distributionData.received.product_summary) {
                      const hashishSummary = distributionData.received.product_summary.find(
                        p => p.type === PRODUCT_TYPES.HASHISH
                      );
                      return hashishSummary ? hashishSummary.weight.toFixed(1) : '0.0';
                    }
                    return '0.0';
                  })()}g
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ({(() => {
                    // Einheiten für Haschisch
                    if (distributionData.received.product_summary) {
                      const hashishSummary = distributionData.received.product_summary.find(
                        p => p.type === PRODUCT_TYPES.HASHISH
                      );
                      return hashishSummary ? (hashishSummary.unit_count || 0) : 0;
                    }
                    return 0;
                  })()} Einheiten)
                </Typography>
              </Paper>
            </Grid>
            
            {/* Karte 5: Tageslimit */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScheduleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="subtitle2">Heutiges Limit</Typography>
                  </Box>
                  {distributionData.consumption && (
                    <Tooltip title={`Tageslimit: ${distributionData.consumption.dailyLimit}g`}>
                      <Chip 
                        size="small" 
                        label={`${distributionData.consumption.dailyPercentage.toFixed(0)}%`}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: distributionData.consumption.dailyPercentage > 90 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.light, 0.2),
                          color: distributionData.consumption.dailyPercentage > 90 ? theme.palette.error.main : theme.palette.success.dark
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                    {distributionData.consumption ? distributionData.consumption.today.toFixed(1) : '0.0'}g
                  </Typography>
                  {distributionData.consumption && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      /{distributionData.consumption.dailyLimit}g
                    </Typography>
                  )}
                </Box>
                {distributionData.consumption && (
                  <Box sx={{ mt: 1.5, mb: 0.5 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={distributionData.consumption.dailyPercentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.success.light, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: distributionData.consumption.dailyPercentage > 90 
                            ? theme.palette.error.main 
                            : theme.palette.success.main
                        }
                      }}
                    />
                  </Box>
                )}
                <Typography variant="body2" color="textSecondary">
                  {distributionData.consumption && distributionData.consumption.remainingDaily > 0 ? 
                    `Noch ${distributionData.consumption.remainingDaily.toFixed(1)}g heute verfügbar` : 
                    'Tageslimit erreicht'}
                </Typography>
              </Paper>
            </Grid>
            
            {/* Karte 6: Alterslimits */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  background: alpha(theme.palette.success.light, 0.05)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FingerprintIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle2">Altersbezogene Limits</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.dark, mb: 1 }}>
                  {limits.category === 'young-adult' ? 'U21-Limits' : 'Ü21-Limits'}
                </Typography>
                
                <Stack spacing={0.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Tägliche Ausgabe:</Typography>
                    <Typography variant="body2" fontWeight={500}>{limits.daily}g</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Monatliche Ausgabe:</Typography>
                    <Typography variant="body2" fontWeight={500}>{limits.monthly}g</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Max. THC-Gehalt:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {limits.maxThc ? `${limits.maxThc}%` : 'Keine Begrenzung'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
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
              
              <Tooltip title="Die Balken zeigen die täglichen Ausgaben, die Linie den kumulativen Monatskonsum. Die gestrichelte Linie markiert das Monatslimit.">
                <InfoOutlinedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
              </Tooltip>
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
                    <TableCell align="right">Gesamtgewicht</TableCell>
                    <TableCell align="right">Tageslimit</TableCell>
                    <TableCell>Ausgegeben von</TableCell>
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
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              <Typography variant="body2">
                                {dayWeight.toFixed(1)}/{limits.daily}g
                              </Typography>
                              <Chip 
                                size="small"
                                label={`${dayLimitPercentage.toFixed(0)}%`}
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  minWidth: 40,
                                  bgcolor: dayLimitPercentage > 90 
                                    ? alpha(theme.palette.error.main, 0.1)
                                    : dayLimitPercentage > 70
                                      ? alpha(theme.palette.warning.main, 0.1)
                                      : alpha(theme.palette.success.main, 0.1),
                                  color: dayLimitPercentage > 90 
                                    ? theme.palette.error.main
                                    : dayLimitPercentage > 70
                                      ? theme.palette.warning.main
                                      : theme.palette.success.main
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{item.distributor}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
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
      
      {/* Detaillierte Ausgaben Tab */}
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
                        <Chip 
                          label={`${distribution.total_weight.toFixed(2)}g`}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        />
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
                      <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                            Chargennummer
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {distribution.batch_number}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                          <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                            Ausgegeben von
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {distribution.distributor?.display_name || `${distribution.distributor?.first_name || ''} ${distribution.distributor?.last_name || ''}`}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
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
                              <TableCell colSpan={6} align="center">
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
  );
};

export default MemberDistributionHistory;