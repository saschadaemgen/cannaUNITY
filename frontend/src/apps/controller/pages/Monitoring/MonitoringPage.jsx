// frontend/src/apps/controller/pages/Monitoring/MonitoringPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Chip, 
  CircularProgress, Fade, Tabs, Tab, IconButton, Menu, MenuItem,
  FormControl, InputLabel, Select, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import PrintIcon from '@mui/icons-material/Print';
import GetAppIcon from '@mui/icons-material/GetApp';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import Co2Icon from '@mui/icons-material/Co2';
import DateRangeIcon from '@mui/icons-material/DateRange';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import ReactECharts from 'echarts-for-react';
import { format, subDays, startOfDay, endOfDay, subMonths, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/utils/api';

// Komponenten für diese Seite könnten in separaten Dateien sein
import ResourceComparisonCard from '../../components/monitoring/ResourceComparisonCard';
// Verwenden der integrierten DateRangePicker von Material-UI
import { DateRangePicker } from '@mui/lab';

export default function MonitoringPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [resourceData, setResourceData] = useState({
    water: [],
    electricity: [],
    nutrient: [],
    co2: []
  });
  const [controllers, setControllers] = useState({
    irrigation: [],
    light: []
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [tabValue, setTabValue] = useState(0);
  const [viewType, setViewType] = useState('chart');
  const [filterOptions, setFilterOptions] = useState({
    resource: 'all',
    controller: 'all',
    room: 'all'
  });
  
  // Daten laden
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Ressourcennutzungsdaten laden
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');
      
      // Wasserverbrauch
      const waterRes = await api.get(`/controller/resource-usage/summary/?resource_type=water&start_date=${startDate}&end_date=${endDate}`);
      
      // Stromverbrauch
      const electricityRes = await api.get(`/controller/resource-usage/summary/?resource_type=electricity&start_date=${startDate}&end_date=${endDate}`);
      
      // Nährstoffverbrauch
      const nutrientRes = await api.get(`/controller/resource-usage/summary/?resource_type=nutrient&start_date=${startDate}&end_date=${endDate}`);
      
      // CO2-Verbrauch
      const co2Res = await api.get(`/controller/resource-usage/summary/?resource_type=co2&start_date=${startDate}&end_date=${endDate}`);
      
      // Daten zusammenführen
      setResourceData({
        water: waterRes.data?.daily_usage?.water || [],
        electricity: electricityRes.data?.daily_usage?.electricity || [],
        nutrient: nutrientRes.data?.daily_usage?.nutrient || [],
        co2: co2Res.data?.daily_usage?.co2 || []
      });
      
      // Controller-Informationen laden
      const irrigationRes = await api.get('/controller/irrigation/');
      const lightRes = await api.get('/controller/light/');
      
      setControllers({
        irrigation: irrigationRes.data.results || [],
        light: lightRes.data.results || []
      });
      
    } catch (error) {
      console.error('Fehler beim Laden der Monitoring-Daten:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter-Menü-Funktionen
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Tab-Wechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Ansichtstyp wechseln (Diagramm/Tabelle)
  const handleViewTypeChange = (event, newViewType) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };
  
  // Datumsbereich ändern
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  // Exportfunktionen
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportCSV = () => {
    // CSV-Export-Logik hier implementieren
    console.log('Exportiere Daten als CSV');
  };
  
  // Gesamt-Ressourcenverbrauch berechnen
  const calculateTotalUsage = (resourceType) => {
    const data = resourceData[resourceType];
    return data.reduce((total, item) => total + item.value, 0);
  };
  
  const waterTotal = calculateTotalUsage('water');
  const electricityTotal = calculateTotalUsage('electricity');
  const nutrientTotal = calculateTotalUsage('nutrient');
  const co2Total = calculateTotalUsage('co2');
  
  // Durchschnittlichen täglichen Verbrauch berechnen
  const calculateDailyAverage = (resourceType) => {
    const data = resourceData[resourceType];
    if (data.length === 0) return 0;
    return waterTotal / data.length;
  };
  
  // Echarts-Optionen für kombiniertes Diagramm
  const getCombinedChartOptions = () => {
    // Alle Datumswerte sammeln und sortieren
    const allDates = [...new Set([
      ...resourceData.water.map(item => item.date),
      ...resourceData.electricity.map(item => item.date),
      ...resourceData.nutrient.map(item => item.date),
      ...resourceData.co2.map(item => item.date)
    ])].sort();
    
    // Werte für jeden Ressourcentyp auf der Zeitachse finden
    const getSeriesData = (data) => {
      return allDates.map(date => {
        const entry = data.find(item => item.date === date);
        return entry ? entry.value : 0;
      });
    };
    
    return {
      title: {
        text: 'Ressourcenverbrauch im Zeitverlauf',
        left: 'center',
        top: 10,
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            // Einheit je nach Ressourcentyp hinzufügen
            let unit = '';
            if (param.seriesName === 'Wasser') unit = ' l';
            else if (param.seriesName === 'Strom') unit = ' kWh';
            else if (param.seriesName === 'Nährstoffe') unit = ' ml';
            else if (param.seriesName === 'CO₂') unit = ' kg';
            
            result += param.marker + param.seriesName + ': ' + param.value.toFixed(1) + unit + '<br/>';
          });
          return result;
        }
      },
      legend: {
        data: ['Wasser', 'Strom', 'Nährstoffe', 'CO₂'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: allDates,
        axisLabel: {
          formatter: value => {
            const date = new Date(value);
            return format(date, 'dd.MM.', { locale: de });
          },
          interval: Math.ceil(allDates.length / 12) // Automatische Intervalle basierend auf Datenumfang
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Wasser/Strom',
          splitLine: {
            show: false
          }
        },
        {
          type: 'value',
          name: 'Nährstoffe/CO₂',
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: 'Wasser',
          type: 'bar',
          stack: 'resource',
          barMaxWidth: 20,
          itemStyle: {
            color: theme.palette.primary.main
          },
          data: getSeriesData(resourceData.water)
        },
        {
          name: 'Strom',
          type: 'bar',
          stack: 'resource',
          barMaxWidth: 20,
          itemStyle: {
            color: theme.palette.warning.main
          },
          data: getSeriesData(resourceData.electricity)
        },
        {
          name: 'Nährstoffe',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: theme.palette.success.main
          },
          data: getSeriesData(resourceData.nutrient)
        },
        {
          name: 'CO₂',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'diamond',
          symbolSize: 6,
          itemStyle: {
            color: theme.palette.grey[600]
          },
          data: getSeriesData(resourceData.co2)
        }
      ]
    };
  };
  
  // Donut-Chart für Ressourcenanteile
  const getResourceDistributionOptions = () => {
    const totalWater = calculateTotalUsage('water');
    const totalElectricity = calculateTotalUsage('electricity');
    const totalNutrient = calculateTotalUsage('nutrient');
    const totalCO2 = calculateTotalUsage('co2');
    
    return {
      title: {
        text: 'Ressourcenverteilung nach Typ',
        left: 'center',
        top: 10,
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 10,
        data: ['Wasser', 'Strom', 'Nährstoffe', 'CO₂']
      },
      series: [
        {
          name: 'Ressourcen',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { 
              value: totalWater, 
              name: 'Wasser',
              itemStyle: { color: theme.palette.primary.main }
            },
            { 
              value: totalElectricity, 
              name: 'Strom',
              itemStyle: { color: theme.palette.warning.main }
            },
            { 
              value: totalNutrient, 
              name: 'Nährstoffe',
              itemStyle: { color: theme.palette.success.main }
            },
            { 
              value: totalCO2, 
              name: 'CO₂',
              itemStyle: { color: theme.palette.grey[600] }
            }
          ]
        }
      ]
    };
  };
  
  // Tabellenansicht für die Ressourcendaten
  const ResourceTable = ({ data, title, unit }) => {
    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableCell 
                colSpan={3} 
                sx={{ 
                  fontWeight: 'bold',
                  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                {title} ({unit})
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'medium' }}>Datum</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'medium' }}>Menge</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'medium' }}>Anteil (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">Keine Daten verfügbar</TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((item, index) => {
                  const date = new Date(item.date);
                  const total = data.reduce((acc, curr) => acc + curr.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{format(date, 'dd.MM.yyyy', { locale: de })}</TableCell>
                      <TableCell align="right">{item.value.toFixed(1)}</TableCell>
                      <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
                
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Gesamt</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {data.reduce((total, item) => total + item.value, 0).toFixed(1)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Ressourcenkarten für die Übersicht
  const resourceCards = [
    {
      title: 'Wasserverbrauch',
      icon: <WaterDropIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      value: waterTotal.toFixed(1),
      unit: 'Liter',
      dailyAvg: calculateDailyAverage('water').toFixed(1),
      color: theme.palette.primary.main,
      data: resourceData.water
    },
    {
      title: 'Stromverbrauch',
      icon: <ElectricBoltIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      value: electricityTotal.toFixed(1),
      unit: 'kWh',
      dailyAvg: calculateDailyAverage('electricity').toFixed(1),
      color: theme.palette.warning.main,
      data: resourceData.electricity
    },
    {
      title: 'Nährstoffverbrauch',
      icon: <LocalFloristIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      value: nutrientTotal.toFixed(1),
      unit: 'ml',
      dailyAvg: calculateDailyAverage('nutrient').toFixed(1),
      color: theme.palette.success.main,
      data: resourceData.nutrient
    },
    {
      title: 'CO₂-Verbrauch',
      icon: <Co2Icon sx={{ fontSize: 40, color: theme.palette.grey[600] }} />,
      value: co2Total.toFixed(1),
      unit: 'kg',
      dailyAvg: calculateDailyAverage('co2').toFixed(1),
      color: theme.palette.grey[600],
      data: resourceData.co2
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 0 }}>
                Ressourcenmonitoring
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Verfolgen Sie den Verbrauch von Wasser, Strom, Nährstoffen und CO₂ in Ihrem System
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                <DateRangeIcon sx={{ mr: 1, color: theme.palette.action.active }} />
                <Box sx={{ minWidth: 200 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value="custom"
                      displayEmpty
                      onChange={() => {}}
                    >
                      <MenuItem value="today">Heute</MenuItem>
                      <MenuItem value="yesterday">Gestern</MenuItem>
                      <MenuItem value="last7">Letzte 7 Tage</MenuItem>
                      <MenuItem value="last30">Letzte 30 Tage</MenuItem>
                      <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={handleViewTypeChange}
                size="small"
                sx={{ mr: 2 }}
              >
                <ToggleButton value="chart" aria-label="chart view">
                  <BarChartIcon />
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                  <TableChartIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <IconButton onClick={handleFilterMenuOpen} sx={{ mr: 1 }}>
                <FilterListIcon />
              </IconButton>
              <IconButton onClick={loadData} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
              
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleFilterMenuClose}
              >
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Ressource</InputLabel>
                    <Select
                      value={filterOptions.resource}
                      onChange={(e) => setFilterOptions({...filterOptions, resource: e.target.value})}
                      label="Ressource"
                    >
                      <MenuItem value="all">Alle Ressourcen</MenuItem>
                      <MenuItem value="water">Wasser</MenuItem>
                      <MenuItem value="electricity">Strom</MenuItem>
                      <MenuItem value="nutrient">Nährstoffe</MenuItem>
                      <MenuItem value="co2">CO₂</MenuItem>
                    </Select>
                  </FormControl>
                </MenuItem>
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Controller</InputLabel>
                    <Select
                      value={filterOptions.controller}
                      onChange={(e) => setFilterOptions({...filterOptions, controller: e.target.value})}
                      label="Controller"
                    >
                      <MenuItem value="all">Alle Controller</MenuItem>
                      <MenuItem value="irrigation">Nur Bewässerung</MenuItem>
                      <MenuItem value="light">Nur Licht</MenuItem>
                    </Select>
                  </FormControl>
                </MenuItem>
                <MenuItem>
                  <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Raum</InputLabel>
                    <Select
                      value={filterOptions.room}
                      onChange={(e) => setFilterOptions({...filterOptions, room: e.target.value})}
                      label="Raum"
                    >
                      <MenuItem value="all">Alle Räume</MenuItem>
                      {/* Hier Räume dynamisch laden */}
                    </Select>
                  </FormControl>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Obere Karten mit Übersicht */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {resourceCards.map((card, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        borderLeft: `4px solid ${card.color}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: `0 0 15px ${alpha(card.color, 0.2)}`,
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                              {card.title}
                            </Typography>
                            <Typography variant="h4" sx={{ color: card.color }}>
                              {card.value} <Typography component="span" variant="body2">{card.unit}</Typography>
                            </Typography>
                          </Box>
                          {card.icon}
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Ø {card.dailyAvg} {card.unit}/Tag
                          </Typography>
                          
                          <Chip 
                            label={`${format(dateRange.start, 'dd.MM.', { locale: de })} - ${format(dateRange.end, 'dd.MM.', { locale: de })}`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* Tab-Navigation */}
              <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
                    <Tab label="Übersicht" id="tab-0" />
                    <Tab label="Wasser" id="tab-1" />
                    <Tab label="Strom" id="tab-2" />
                    <Tab label="Nährstoffe" id="tab-3" />
                    <Tab label="CO₂" id="tab-4" />
                  </Tabs>
                </Box>
                
                {/* Übersicht Tab */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 0}
                  id={`tabpanel-0`}
                  aria-labelledby={`tab-0`}
                  sx={{ p: 3 }}
                >
                  {tabValue === 0 && (
                    <>
                      {viewType === 'chart' ? (
                        <Grid container spacing={3}>
                          <Grid item xs={12} lg={8}>
                            <Paper variant="outlined" sx={{ p: 2, height: '400px' }}>
                              <ReactECharts 
                                option={getCombinedChartOptions()} 
                                style={{ height: '100%', width: '100%' }} 
                              />
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={12} lg={4}>
                            <Paper variant="outlined" sx={{ p: 2, height: '400px' }}>
                              <ReactECharts 
                                option={getResourceDistributionOptions()} 
                                style={{ height: '100%', width: '100%' }} 
                              />
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                              >
                                Drucken
                              </Button>
                              <Button 
                                variant="outlined" 
                                startIcon={<GetAppIcon />}
                                onClick={handleExportCSV}
                              >
                                CSV exportieren
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      ) : (
                        <Grid container spacing={3}>
                          <Grid item xs={12} lg={6}>
                            <ResourceTable 
                              data={resourceData.water} 
                              title="Wasserverbrauch" 
                              unit="l" 
                            />
                            <ResourceTable 
                              data={resourceData.electricity} 
                              title="Stromverbrauch" 
                              unit="kWh" 
                            />
                          </Grid>
                          <Grid item xs={12} lg={6}>
                            <ResourceTable 
                              data={resourceData.nutrient} 
                              title="Nährstoffverbrauch" 
                              unit="ml" 
                            />
                            <ResourceTable 
                              data={resourceData.co2} 
                              title="CO₂-Verbrauch" 
                              unit="kg" 
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                              >
                                Drucken
                              </Button>
                              <Button 
                                variant="outlined" 
                                startIcon={<GetAppIcon />}
                                onClick={handleExportCSV}
                              >
                                CSV exportieren
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    </>
                  )}
                </Box>
                
                {/* Tab für Wasser */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 1}
                  id={`tabpanel-1`}
                  aria-labelledby={`tab-1`}
                  sx={{ p: 3 }}
                >
                  {tabValue === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Wasserverbrauch</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Detaillierte Analyse des Wasserverbrauchs im ausgewählten Zeitraum
                      </Typography>
                      
                      {/* Detaillierte Wasserverbrauchsdaten würden hier angezeigt */}
                    </Box>
                  )}
                </Box>
                
                {/* Tab für Strom */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 2}
                  id={`tabpanel-2`}
                  aria-labelledby={`tab-2`}
                  sx={{ p: 3 }}
                >
                  {tabValue === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Stromverbrauch</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Detaillierte Analyse des Stromverbrauchs im ausgewählten Zeitraum
                      </Typography>
                      
                      {/* Detaillierte Stromverbrauchsdaten würden hier angezeigt */}
                    </Box>
                  )}
                </Box>
                
                {/* Tab für Nährstoffe */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 3}
                  id={`tabpanel-3`}
                  aria-labelledby={`tab-3`}
                  sx={{ p: 3 }}
                >
                  {tabValue === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Nährstoffverbrauch</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Detaillierte Analyse des Nährstoffverbrauchs im ausgewählten Zeitraum
                      </Typography>
                      
                      {/* Detaillierte Nährstoffverbrauchsdaten würden hier angezeigt */}
                    </Box>
                  )}
                </Box>
                
                {/* Tab für CO2 */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 4}
                  id={`tabpanel-4`}
                  aria-labelledby={`tab-4`}
                  sx={{ p: 3 }}
                >
                  {tabValue === 4 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>CO₂-Verbrauch</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Detaillierte Analyse des CO₂-Verbrauchs im ausgewählten Zeitraum
                      </Typography>
                      
                      {/* Detaillierte CO2-Verbrauchsdaten würden hier angezeigt */}
                    </Box>
                  )}
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Fade>
    </Container>
  );
}