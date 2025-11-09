# backend/controller/plc_interface.py

import json
import logging
import requests
import threading
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
import urllib3
import re

# SSL-Warnungen deaktivieren für selbstsignierte Zertifikate
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


class PLCJSONRPCInterface:
    """JSON-RPC Interface zur Kommunikation mit Siemens S7-1200 G2 Web API"""
    
    # Class-level storage für Keep-Alive Threads
    _keepalive_threads = {}
    
    def __init__(self, control_unit=None):
        self.control_unit = control_unit
        self.session = requests.Session()
        self.session.verify = False  # SSL-Verifikation deaktivieren
        self.request_id = 1
        self._keepalive_stop = threading.Event()
        
        # Konfiguration
        if control_unit and control_unit.plc_address:
            self.base_url = control_unit.get_api_url()
            self.username = control_unit.plc_username or 'sash'
            self.password = control_unit.plc_password or 'Janus72728'
        else:
            # Fallback auf globale Konfiguration
            from .models import PLCConfiguration
            config = PLCConfiguration.get_config()
            self.base_url = f"https://{config.default_plc_address}/api/jsonrpc"
            self.username = config.default_username
            self.password = config.default_password
    
    def __del__(self):
        """Cleanup: Stop Keep-Alive Thread"""
        self.stop_keepalive()
    
    def _get_next_id(self) -> int:
        """Gibt die nächste Request-ID zurück"""
        current_id = self.request_id
        self.request_id += 1
        return current_id
    
    def _make_request(self, method: str, params: Dict[str, Any] = None, use_auth: bool = True) -> Dict[str, Any]:
        """Führt einen JSON-RPC Request aus"""
        payload = {
            "jsonrpc": "2.0",
            "id": self._get_next_id(),
            "method": method
        }
        
        if params:
            payload["params"] = params
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Auth-Token hinzufügen wenn verfügbar
        if use_auth and self.control_unit and self.control_unit.plc_auth_token:
            headers["X-Auth-Token"] = self.control_unit.plc_auth_token
        
        try:
            logger.debug(f"Request an {self.base_url}: {json.dumps(payload, indent=2)}")
            
            response = self.session.post(
                self.base_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            logger.debug(f"Response Status: {response.status_code}")
            
            response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"JSON-RPC Error: {result['error']}")
                # Bei Authentication-Fehler Token löschen
                if result['error'].get('code') == -32604:  # Unauthorized
                    self._clear_token()
                raise Exception(f"PLC Error: {result['error'].get('message', 'Unknown error')}")
            
            return result.get("result", {})
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise Exception(f"Kommunikationsfehler mit SPS: {str(e)}")
    
    def _clear_token(self):
        """Löscht den gespeicherten Token"""
        if self.control_unit:
            self.control_unit.plc_auth_token = None
            self.control_unit.plc_token_expires = None
            self.control_unit.save(update_fields=['plc_auth_token', 'plc_token_expires'])
            self.stop_keepalive()
    
    def authenticate(self) -> str:
        """Authentifiziert bei der SPS und gibt den Token zurück"""
        # Stoppe alten Keep-Alive falls vorhanden
        self.stop_keepalive()
        
        params = {
            "user": self.username,
            "password": self.password
        }
        
        try:
            logger.info(f"Authentifiziere bei {self.base_url} mit Benutzer: {self.username}")
            result = self._make_request("Api.Login", params, use_auth=False)
            
            logger.debug(f"Auth Response: {result}")
            
            if "token" in result:
                token = result["token"]
                
                # runtime_timeout kann String, Int oder ISO 8601 Duration sein
                runtime_timeout_raw = result.get("runtime_timeout", "PT30M")
                
                # ISO 8601 Duration Format behandeln (z.B. "PT30M" = 30 Minuten)
                if isinstance(runtime_timeout_raw, str) and runtime_timeout_raw.startswith("PT"):
                    match = re.match(r'PT(\d+)([HM])', runtime_timeout_raw)
                    if match:
                        value = int(match.group(1))
                        unit = match.group(2)
                        if unit == 'H':
                            runtime_timeout = value * 60  # Stunden zu Minuten
                        else:  # 'M'
                            runtime_timeout = value
                        logger.debug(f"Parsed ISO 8601 duration {runtime_timeout_raw} als {runtime_timeout} Minuten")
                    else:
                        logger.warning(f"Konnte ISO 8601 duration nicht parsen: {runtime_timeout_raw}, verwende Standard 30")
                        runtime_timeout = 30
                else:
                    # Normale String/Int Konvertierung
                    try:
                        runtime_timeout = int(runtime_timeout_raw)
                    except (ValueError, TypeError):
                        logger.warning(f"Konnte runtime_timeout nicht parsen: {runtime_timeout_raw}, verwende Standard 30")
                        runtime_timeout = 30
                
                # Token in Control Unit speichern
                if self.control_unit:
                    self.control_unit.plc_auth_token = token
                    # Token-Ablauf ist runtime_timeout, aber Session läuft nach 2 Min Inaktivität ab!
                    self.control_unit.plc_token_expires = timezone.now() + timedelta(minutes=runtime_timeout)
                    self.control_unit.save(update_fields=['plc_auth_token', 'plc_token_expires'])
                
                logger.info(f"Erfolgreich authentifiziert. Token gültig für {runtime_timeout} Minuten")
                
                # Starte Keep-Alive Thread (Ping alle 90 Sekunden)
                self.start_keepalive()
                
                return token
            else:
                raise Exception("Keine Token-Antwort von SPS")
                
        except Exception as e:
            logger.error(f"Authentifizierung fehlgeschlagen: {e}")
            raise
    
    def start_keepalive(self):
        """Startet den Keep-Alive Thread für die Session"""
        if not self.control_unit or not self.control_unit.plc_auth_token:
            return
        
        # Stoppe existierenden Thread falls vorhanden
        self.stop_keepalive()
        
        # Erstelle neuen Thread
        self._keepalive_stop.clear()
        thread = threading.Thread(target=self._keepalive_worker, daemon=True)
        thread.start()
        
        # Speichere Thread-Referenz
        if self.control_unit:
            PLCJSONRPCInterface._keepalive_threads[self.control_unit.id] = (thread, self._keepalive_stop)
        
        logger.info("Keep-Alive Thread gestartet")
    
    def stop_keepalive(self):
        """Stoppt den Keep-Alive Thread"""
        if self.control_unit and self.control_unit.id in PLCJSONRPCInterface._keepalive_threads:
            thread, stop_event = PLCJSONRPCInterface._keepalive_threads[self.control_unit.id]
            stop_event.set()
            thread.join(timeout=2)
            del PLCJSONRPCInterface._keepalive_threads[self.control_unit.id]
            logger.info("Keep-Alive Thread gestoppt")
        else:
            self._keepalive_stop.set()
    
    def _keepalive_worker(self):
        """Worker-Thread der regelmäßig Pings sendet"""
        logger.info("Keep-Alive Worker gestartet")
        
        while not self._keepalive_stop.wait(90):  # Alle 90 Sekunden
            try:
                # Prüfe ob Token noch gültig
                if not self.control_unit or not self.control_unit.plc_auth_token:
                    logger.info("Kein Token vorhanden, beende Keep-Alive")
                    break
                
                # Sende Ping
                logger.debug("Sende Keep-Alive Ping")
                self._make_request("Api.Ping")
                logger.debug("Keep-Alive Ping erfolgreich")
                
            except Exception as e:
                logger.error(f"Keep-Alive Ping fehlgeschlagen: {e}")
                # Bei Fehler neu authentifizieren
                try:
                    self.authenticate()
                except:
                    logger.error("Re-Authentifizierung fehlgeschlagen, beende Keep-Alive")
                    break
        
        logger.info("Keep-Alive Worker beendet")
    
    def ensure_authenticated(self):
        """Stellt sicher, dass ein gültiger Token vorhanden ist"""
        if not self.control_unit:
            return
        
        # Prüfen ob Token vorhanden und gültig
        if (not self.control_unit.plc_auth_token or 
            not self.control_unit.plc_token_expires or
            self.control_unit.plc_token_expires <= timezone.now()):
            logger.info("Token abgelaufen oder nicht vorhanden. Neue Authentifizierung...")
            self.authenticate()
    
    def write_output(self, var_name: str, value: Union[bool, int, float]) -> bool:
        """Schreibt einen Wert auf einen Ausgang"""
        self.ensure_authenticated()
        
        params = {
            "var": var_name,
            "value": value
        }
        
        try:
            logger.info(f"Schreibe {var_name} = {value}")
            result = self._make_request("PlcProgram.Write", params)
            logger.debug(f"Write Result: {result}")
            
            # Die SPS antwortet normalerweise mit einem leeren result bei Erfolg
            # oder mit {"result": true}
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Schreiben von {var_name}: {e}")
            # Bei Auth-Fehler neu versuchen
            if "unauthorized" in str(e).lower():
                logger.info("Authentifizierung abgelaufen, versuche erneut...")
                self.authenticate()
                # Zweiter Versuch
                try:
                    result = self._make_request("PlcProgram.Write", params)
                    return True
                except Exception as e2:
                    logger.error(f"Zweiter Versuch fehlgeschlagen: {e2}")
            return False
    
    def read_output(self, address: str) -> Optional[Dict[str, Any]]:
        """Liest den Status eines Ausgangs"""
        self.ensure_authenticated()
        
        params = {
            "id": int(address) if isinstance(address, str) else address
        }
        
        try:
            logger.info(f"Lese Ausgang mit ID: {params['id']}")
            result = self._make_request("PlcProgram.Read", params)
            logger.debug(f"Read Result: {result}")
            return result
        except Exception as e:
            logger.error(f"Fehler beim Lesen von {address}: {e}")
            return None
    
    def set_led_status(self, status: bool) -> bool:
        """Setzt den LED Start/Stopp Status"""
        return self.write_output('"DB_Control".api_output', status)
    
    def set_output_q0(self, status: bool) -> bool:
        """Setzt den Ausgang Q0"""
        # Q0 ist mit api_output verknüpft
        return self.write_output('"DB_Control".api_output', status)
    
    def get_output_q0_status(self) -> Optional[bool]:
        """Liest den Status von Ausgang Q0"""
        result = self.read_output("209")  # ID für Q0
        if result:
            # Result kann verschiedene Formate haben
            if isinstance(result, dict):
                return result.get("result", result.get("value"))
            elif isinstance(result, bool):
                return result
        return None
    
    def send_command(self, command) -> bool:
        """Sendet einen Befehl an die SPS"""
        try:
            control_unit = command.control_unit
            command_type = command.command_type
            payload = command.payload
            
            # Verschiedene Command-Types verarbeiten
            if command_type == 'set_led':
                success = self.set_led_status(payload.get('status', False))
            elif command_type == 'set_output':
                success = self.set_output_q0(payload.get('status', False))
            elif command_type == 'update_config':
                # Konfiguration an SPS senden
                success = self._send_config_update(control_unit, payload)
            else:
                logger.warning(f"Unbekannter Command-Type: {command_type}")
                success = False
            
            # Command-Status aktualisieren
            command.status = 'sent' if success else 'failed'
            command.sent_at = timezone.now()
            command.save()
            
            # Status synchronisieren
            if success:
                self._sync_status(control_unit)
            
            return success
            
        except Exception as e:
            logger.error(f"Fehler beim Senden des Befehls: {e}")
            command.status = 'failed'
            command.error_message = str(e)
            command.save()
            return False
    
    def _send_config_update(self, control_unit, config_data) -> bool:
        """Sendet eine Konfigurationsaktualisierung an die SPS"""
        try:
            # Beispiel: Schreibe verschiedene Parameter
            if 'target_temperature' in config_data:
                self.write_output('"DB_Control".target_temp', config_data['target_temperature'])
            
            if 'humidity_setpoint' in config_data:
                self.write_output('"DB_Control".humidity_sp', config_data['humidity_setpoint'])
            
            return True
            
        except Exception as e:
            logger.error(f"Config-Update fehlgeschlagen: {e}")
            return False
    
    def _sync_status(self, control_unit):
        """Synchronisiert den Status mit der SPS"""
        try:
            # Status-Objekt aktualisieren oder erstellen
            from .models import ControlStatus
            status, created = ControlStatus.objects.get_or_create(control_unit=control_unit)
            
            # Vorerst nur Online-Status setzen
            status.is_online = True
            status.last_update = timezone.now()
            status.error_message = None
            status.save()
            
            # Control Unit Status aktualisieren
            control_unit.status = 'active'
            control_unit.last_sync = timezone.now()
            control_unit.save(update_fields=['status', 'last_sync'])
            
        except Exception as e:
            logger.error(f"Status-Sync fehlgeschlagen: {e}")
            if hasattr(control_unit, 'current_status'):
                control_unit.current_status.is_online = False
                control_unit.current_status.error_message = str(e)
                control_unit.current_status.save()


# Cleanup-Funktion für Server-Shutdown
def cleanup_keepalive_threads():
    """Stoppt alle Keep-Alive Threads beim Server-Shutdown"""
    logger.info(f"Stoppe {len(PLCJSONRPCInterface._keepalive_threads)} Keep-Alive Threads")
    for unit_id, (thread, stop_event) in list(PLCJSONRPCInterface._keepalive_threads.items()):
        stop_event.set()
        thread.join(timeout=2)
    PLCJSONRPCInterface._keepalive_threads.clear()


# Mock Interface bleibt unverändert
class MockPLCInterface:
    """Mock-Interface für Entwicklung ohne echte SPS"""
    
    def __init__(self, control_unit=None):
        self.control_unit = control_unit
        self._mock_states = {
            'led_status': False,
            'output_q0': False,
            'temperature': 22.5,
            'humidity': 65.0
        }
    
    def authenticate(self) -> str:
        """Mock-Authentifizierung"""
        logger.info("Mock: Authentifizierung simuliert")
        
        # Mock Token speichern
        if self.control_unit:
            self.control_unit.plc_auth_token = "mock_token_12345"
            self.control_unit.plc_token_expires = timezone.now() + timedelta(hours=3)
            self.control_unit.save(update_fields=['plc_auth_token', 'plc_token_expires'])
        
        return "mock_token_12345"
    
    def ensure_authenticated(self):
        """Mock: Prüft Token"""
        if not self.control_unit:
            return
            
        if (not self.control_unit.plc_auth_token or 
            not self.control_unit.plc_token_expires or
            self.control_unit.plc_token_expires <= timezone.now()):
            self.authenticate()
    
    def start_keepalive(self):
        """Mock: Keep-Alive nicht notwendig"""
        pass
    
    def stop_keepalive(self):
        """Mock: Keep-Alive nicht notwendig"""
        pass
    
    def set_led_status(self, status: bool) -> bool:
        """Mock: LED-Status setzen"""
        self._mock_states['led_status'] = status
        logger.info(f"Mock: LED-Status auf {status} gesetzt")
        
        # Status in DB aktualisieren
        if self.control_unit and hasattr(self.control_unit, 'current_status'):
            self.control_unit.current_status.led_status = status
            self.control_unit.current_status.output_q0_status = status
            self.control_unit.current_status.save()
        
        return True
    
    def set_output_q0(self, status: bool) -> bool:
        """Mock: Ausgang Q0 setzen"""
        self._mock_states['output_q0'] = status
        logger.info(f"Mock: Ausgang Q0 auf {status} gesetzt")
        return True
    
    def get_output_q0_status(self) -> bool:
        """Mock: Q0-Status lesen"""
        return self._mock_states['output_q0']
    
    def send_command(self, command) -> bool:
        """Mock: Befehl senden"""
        logger.info(f"Mock: Befehl {command.command_type} empfangen")
        command.status = 'sent'
        command.sent_at = timezone.now()
        command.save()
        return True


# Factory-Funktion für Interface-Auswahl
def get_plc_interface(control_unit=None) -> Union[PLCJSONRPCInterface, MockPLCInterface]:
    """Gibt das passende PLC-Interface zurück"""
    use_mock = getattr(settings, 'PLC_USE_MOCK', False)
    
    if use_mock:
        return MockPLCInterface(control_unit)
    else:
        return PLCJSONRPCInterface(control_unit)