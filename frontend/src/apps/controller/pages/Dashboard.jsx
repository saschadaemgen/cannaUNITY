// frontend/src/apps/controller/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Chip, CircularProgress, Fade } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts'; // Import hinzugefügt
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WarningIcon from '@mui/icons-material/Warning';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import api from '@/utils/api';

// NASA-inspirierte Komponenten
import ControllerStatusCard from '../components/common/ControllerStatusCard';
import SystemStatus from '../components/dashboard/SystemStatus';
import ResourceMonitor from '../components/dashboard/ResourceMonitor';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import ControllerList from '../components/dashboard/ControllerList';

export default function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [irrigationStats, setIrrigationStats] = useState(null);
  const [lightingStats, setLightingStats] = useState(null);
  const [waterUsage, setWaterUsage] = useState([]);
  const [energyUsage, setEnergyUsage] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [activeControllers, setActiveControllers] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Bewässerungsstatistiken abrufen
        const irrigationRes = await api.get('/controller/irrigation/dashboard_data/');
        setIrrigationStats(irrigationRes.data);
        
        // Lichtstatistiken abrufen
        const lightRes = await api.get('/controller/light/dashboard_data/');
        setLightingStats(lightRes.data);
        
        // Wasserverbrauch der letzten 7 Tage
        const waterRes = await api.get('/controller/resource-usage/summary/?days=7&resource_type=water');
        setWaterUsage(waterRes.data?.daily_usage?.water || []);
        
        // Stromverbrauch der letzten 7 Tage
        const energyRes = await api.get('/controller/resource-usage/summary/?days=7&resource_type=electricity');
        setEnergyUsage(energyRes.data?.daily_usage?.electricity || []);
        
        // Aktuelle Alarme
        const logsRes = await api.get('/controller/logs/?success=false&limit=5');
        setRecentAlerts(logsRes.data.results || []);
        
        // Aktive Controller abrufen
        const controllersRes = await api.get('/controller/irrigation/?is_active=true');
        setActiveControllers(controllersRes.data.results || []);
        
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Charts für Wasserverbrauch vorbereiten
  const getWaterUsageOptions = () => {
    return {
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} Liter'
      },
      xAxis: {
        type: 'category',
        data: waterUsage.map(item => item.date),
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: 'Liter',
        nameTextStyle: { fontSize: 10 }
      },
      series: [{
        data: waterUsage.map(item => item.value),
        type: 'bar',
        name: 'Wasserverbrauch',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1976d2' },
            { offset: 1, color: '#03a9f4' }
          ])
        }
      }]
    };
  };
  
  // Charts für Stromverbrauch vorbereiten
  const getEnergyUsageOptions = () => {
    return {
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} kWh'
      },
      xAxis: {
        type: 'category',
        data: energyUsage.map(item => item.date),
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { fontSize: 10 }
      },
      series: [{
        data: energyUsage.map(item => item.value),
        type: 'line',
        name: 'Stromverbrauch',
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 5,
        lineStyle: { width: 3 },
        itemStyle: { color: '#ffc107' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: alpha('#ffc107', 0.5) },
            { offset: 1, color: alpha('#ffc107', 0.1) }
          ])
        }
      }]
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            Grow Controller Dashboard
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Echtzeit-Überwachung der Bewässerungs- und Lichtsteuerungssysteme
          </Typography>
        </Box>
      </Fade>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} mt={1}>
          {/* Status-Karten */}
          <Grid item xs={12} md={6} lg={3}>
            <ControllerStatusCard 
              title="Bewässerungssteuerung"
              icon={<OpacityIcon />}
              total={irrigationStats?.controller_status?.total || 0}
              active={irrigationStats?.controller_status?.active || 0}
              connected={irrigationStats?.controller_status?.connected || 0}
              warning={irrigationStats?.controller_status?.emergency_stopped || 0}
              color="#03a9f4"
              unit="Liter"
              todayValue={irrigationStats?.water_usage?.today || 0}
              linkTo="/controllers/irrigation"
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <ControllerStatusCard 
              title="Lichtsteuerung"
              icon={<WbSunnyIcon />}
              total={lightingStats?.controller_status?.total || 0}
              active={lightingStats?.controller_status?.active || 0}
              connected={lightingStats?.controller_status?.connected || 0}
              warning={lightingStats?.controller_status?.emergency_off || 0}
              color="#ffc107"
              unit="kWh"
              todayValue={lightingStats?.energy_usage?.today || 0}
              linkTo="/controllers/lighting"
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <SystemStatus 
              uptime="99.8%"
              lastSync={new Date().toISOString()}
              mqttStatus="Verbunden"
              responseTime="46ms"
              warnings={recentAlerts.length}
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <ResourceMonitor 
              waterToday={irrigationStats?.water_usage?.today || 0}
              energyToday={lightingStats?.energy_usage?.today || 0}
              waterTotal={2875.5} // Beispielwert
              energyTotal={982.3} // Beispielwert
            />
          </Grid>
          
          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                height: '100%',
                backgroundImage: 'linear-gradient(to bottom, rgba(3, 169, 244, 0.05), rgba(3, 169, 244, 0.01))'
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mb: 2 }}>
                Wasserverbrauch (letzte 7 Tage)
              </Typography>
              <ReactECharts option={getWaterUsageOptions()} style={{ height: 240 }} />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                height: '100%',
                backgroundImage: 'linear-gradient(to bottom, rgba(255, 193, 7, 0.05), rgba(255, 193, 7, 0.01))'
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mb: 2 }}>
                Stromverbrauch (letzte 7 Tage)
              </Typography>
              <ReactECharts option={getEnergyUsageOptions()} style={{ height: 240 }} />
            </Paper>
          </Grid>
          
          {/* Aktive Controller & Alarme */}
          <Grid item xs={12} md={8}>
            <ControllerList 
              controllers={activeControllers} 
              title="Aktive Controller"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <RecentAlerts alerts={recentAlerts} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}