# backend/controller/plc_interface.py

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import snap7
from snap7.util import get_real, set_real, get_int, set_int
from django.conf import settings

logger = logging.getLogger(__name__)


class PLCInterface:
    """Interface zur Kommunikation mit Siemens S7-1200 G2"""
    
    def __init__(self):
        self.client = snap7.client.Client()
        self.connected = False
        self.plc_config = getattr(settings, 'PLC_CONFIG', {
            'host': '192.168.1.100',
            'rack': 0,
            'slot': 1,
            'timeout': 5000,
        })
    
    def connect(self):
        """Verbindung zur SPS herstellen"""
        try:
            self.client.connect(
                self.plc_config['host'],
                self.plc_config['rack'],
                self.plc_config['slot']
            )
            self.connected = True
            logger.info(f"Verbindung zu SPS {self.plc_config['host']} hergestellt")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Verbinden zur SPS: {e}")
            self.connected = False
            return False
    
    def disconnect(self):
        """Verbindung trennen"""
        if self.connected:
            self.client.disconnect()
            self.connected = False
            logger.info("SPS-Verbindung getrennt")
    
    def send_command(self, command) -> bool:
        """Sendet einen Befehl an die SPS"""
        if not self.connected:
            if not self.connect():
                return False
        
        try:
            control_unit = command.control_unit
            db_number = control_unit.plc_db_number or 100  # Standard-DB
            
            # Payload vorbereiten
            data = self._prepare_plc_data(command.payload)
            
            # Daten in DB schreiben
            self.client.db_write(db_number, 0, data)
            
            # Trigger-Bit setzen
            trigger_data = bytearray(1)
            trigger_data[0] = 1
            self.client.db_write(db_number, 1000, trigger_data)  # Offset für Trigger
            
            logger.info(f"Befehl {command.command_type} an DB{db_number} gesendet")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Senden des Befehls: {e}")
            return False
        finally:
            self.disconnect()
    
    def read_status(self, control_unit) -> Optional[Dict[str, Any]]:
        """Liest den aktuellen Status aus der SPS"""
        if not self.connected:
            if not self.connect():
                return None
        
        try:
            db_number = control_unit.plc_db_number or 100
            
            # Status-Daten lesen (Beispiel-Struktur)
            data = self.client.db_read(db_number, 2000, 100)  # Status-Offset
            
            status = {
                'is_online': bool(data[0]),
                'current_value': get_real(data, 4),
                'secondary_value': get_real(data, 8),
                'error_code': get_int(data, 12),
                'timestamp': datetime.now().isoformat(),
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Fehler beim Lesen des Status: {e}")
            return None
        finally:
            self.disconnect()
    
    def _prepare_plc_data(self, payload: Dict[str, Any]) -> bytearray:
        """Konvertiert Payload in SPS-kompatible Daten"""
        # Beispiel-Implementation - muss an tatsächliche SPS-Struktur angepasst werden
        data = bytearray(1024)  # Buffer
        
        unit_config = payload.get('unit_config', {})
        parameters = payload.get('parameters', {})
        
        # Steuerungstyp (Offset 0)
        unit_types = {
            'lighting': 1,
            'climate': 2,
            'watering': 3,
            'co2': 4,
            'humidity': 5,
        }
        data[0] = unit_types.get(unit_config.get('unit_type'), 0)
        
        # Parameter schreiben (Beispiel)
        if 'target_temperature' in parameters:
            set_real(data, 10, parameters['target_temperature'])
        
        if 'humidity_setpoint' in parameters:
            set_real(data, 14, parameters['humidity_setpoint'])
        
        # Zeitplan-Daten könnten hier ebenfalls kodiert werden
        
        return data


# Alternative: MQTT-basierte Implementierung
class MQTTInterface:
    """Alternative MQTT-Implementierung für SPS-Kommunikation"""
    
    def __init__(self):
        import paho.mqtt.client as mqtt
        self.client = mqtt.Client()
        self.broker_config = getattr(settings, 'MQTT_CONFIG', {
            'host': 'localhost',
            'port': 1883,
            'keepalive': 60,
            'username': None,
            'password': None,
        })
        self._setup_callbacks()
    
    def _setup_callbacks(self):
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
    
    def _on_connect(self, client, userdata, flags, rc):
        logger.info(f"MQTT verbunden mit Code: {rc}")
        # Status-Updates abonnieren
        client.subscribe("cannaunity/+/status")
    
    def _on_message(self, client, userdata, msg):
        logger.info(f"MQTT Nachricht: {msg.topic} - {msg.payload}")
        # Status-Updates verarbeiten
    
    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"MQTT getrennt mit Code: {rc}")
    
    def send_command(self, command) -> bool:
        """Sendet Befehl über MQTT"""
        try:
            topic = f"cannaunity/{command.control_unit.id}/command"
            payload = json.dumps(command.payload)
            
            self.client.connect(**self.broker_config)
            result = self.client.publish(topic, payload, qos=1)
            self.client.disconnect()
            
            return result.rc == 0
        except Exception as e:
            logger.error(f"MQTT-Fehler: {e}")
            return False