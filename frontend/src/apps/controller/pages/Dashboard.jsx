// frontend/src/apps/controller/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Dashboard from '../components/dashboard/Dashboard';

/**
 * Vereinfachte Dashboard-Seite - Lädt Daten und zeigt das Dashboard an
 */
const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Simuliere Datenabruf von API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulierte Daten für Testzwecke
        const mockData = {
          irrigationControllers: [
            { 
              id: 1, 
              name: 'Hauptbewässerung', 
              is_active: true, 
              is_connected: true,
              controller_type: 'irrigation',
              current_usage: 2.5
            }
          ],
          lightingControllers: [
            {
              id: 2,
              name: 'Beleuchtung Bereich 1',
              is_active: true,
              is_connected: true,
              controller_type: 'light',
              current_usage: 1.8
            }
          ],
          systemStatus: {
            uptime: '99.8%',
            lastSync: new Date().toISOString(),
            mqttStatus: 'Verbunden',
            responseTime: '45ms',
            warnings: 0
          },
          resourceData: {
            waterToday: 2.5,
            energyToday: 1.8,
            waterTotal: 875.3,
            energyTotal: 324.7,
            waterUsageHistory: [
              { name: 'Mo', value: 1.2 },
              { name: 'Di', value: 1.5 },
              { name: 'Mi', value: 3.2 },
              { name: 'Do', value: 2.1 },
              { name: 'Fr', value: 2.5 },
              { name: 'Sa', value: 0.8 },
              { name: 'So', value: 1.1 }
            ]
          },
          alerts: [
            {
              id: 1,
              action_type: 'irrigation_failure',
              controller_type: 'irrigation',
              error_message: 'Druckverlust im System',
              timestamp: new Date().toISOString()
            },
            {
              id: 2,
              action_type: 'light_schedule_error',
              controller_type: 'light',
              error_message: 'Zeitplan konnte nicht aktiviert werden',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          activeControllers: [
            { 
              id: 1, 
              name: 'Hauptbewässerung', 
              is_active: true, 
              is_connected: true,
              controller_type: 'irrigation',
              room: { id: 1, name: 'Hauptraum' },
              status: {
                current_schedule: {
                  progress: 75,
                  volume: 1.2
                }
              }
            },
            {
              id: 2,
              name: 'Beleuchtung Bereich 1',
              is_active: true,
              is_connected: true,
              controller_type: 'light',
              room: { id: 1, name: 'Hauptraum' },
              status: {
                current_light_state: {
                  is_on: true,
                  intensity: 85
                }
              }
            }
          ]
        };
        
        // Verzögerung simulieren
        setTimeout(() => {
          setDashboardData(mockData);
          setIsLoading(false);
        }, 300);
        
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        width: '100%'
      }}>
        <CircularProgress sx={{ color: 'rgb(76, 175, 80)' }} />
      </Box>
    );
  }
  
  return <Dashboard {...dashboardData} />;
};

export default DashboardPage;