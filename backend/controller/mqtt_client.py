# controller/mqtt_client.py
import json
import logging
from django.conf import settings
from django.utils import timezone
from django.db import transaction

# Versuche paho-mqtt zu importieren, handle fehlenden Import
try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    mqtt = None
    import logging
    logging.error("paho-mqtt ist nicht installiert. Bitte installieren Sie es mit 'pip install paho-mqtt'")

# Logger einrichten
logger = logging.getLogger(__name__)

class MQTTClient:
    """
    MQTT-Client für die Kommunikation mit Cannabis-Grow-Controllern.
    Dieser Client kann für Bewässerungs- und Lichtsteuerung verwendet werden
    und bietet eine zuverlässige bidirektionale Kommunikation mit der Hardware.
    """
    
    def __init__(self):
        # Prüfen, ob paho-mqtt verfügbar ist
        if not MQTT_AVAILABLE:
            logger.error("MQTT-Client kann nicht initialisiert werden: paho-mqtt ist nicht installiert")
            return
            
        # MQTT-Broker-Konfiguration aus den Django-Einstellungen lesen
        self.mqtt_host = getattr(settings, 'MQTT_HOST', 'localhost')
        self.mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
        self.mqtt_user = getattr(settings, 'MQTT_USERNAME', None)
        self.mqtt_password = getattr(settings, 'MQTT_PASSWORD', None)
        self.mqtt_client_id = getattr(settings, 'MQTT_CLIENT_ID', f'django_controller_{timezone.now().timestamp()}')
        self.mqtt_keepalive = getattr(settings, 'MQTT_KEEPALIVE', 60)
        self.mqtt_qos = getattr(settings, 'MQTT_QOS', 1)  # QoS 1: At least once
        
        # TLS-Konfiguration, falls verfügbar
        self.mqtt_use_tls = getattr(settings, 'MQTT_USE_TLS', False)
        self.mqtt_ca_certs = getattr(settings, 'MQTT_CA_CERTS', None)
        self.mqtt_certfile = getattr(settings, 'MQTT_CERTFILE', None)
        self.mqtt_keyfile = getattr(settings, 'MQTT_KEYFILE', None)
        
        # Last-Will-Testament konfigurieren (wird ausgelöst, wenn Client unerwartet die Verbindung verliert)
        self.mqtt_lwt_topic = getattr(settings, 'MQTT_LWT_TOPIC', 'controller/status')
        self.mqtt_lwt_payload = getattr(settings, 'MQTT_LWT_PAYLOAD', json.dumps({"status": "offline", "message": "Unexpected disconnect"}))
        
        # MQTT-Client initialisieren
        self.client = mqtt.Client(client_id=self.mqtt_client_id, clean_session=True)
        
        # Last-Will-Testament setzen
        self.client.will_set(
            self.mqtt_lwt_topic,
            self.mqtt_lwt_payload,
            qos=self.mqtt_qos,
            retain=True
        )
        
        # Authentifizierung einrichten, falls konfiguriert
        if self.mqtt_user and self.mqtt_password:
            self.client.username_pw_set(self.mqtt_user, self.mqtt_password)
        
        # TLS einrichten, falls konfiguriert
        if self.mqtt_use_tls:
            if self.mqtt_ca_certs:
                self.client.tls_set(
                    ca_certs=self.mqtt_ca_certs,
                    certfile=self.mqtt_certfile,
                    keyfile=self.mqtt_keyfile
                )
            else:
                self.client.tls_set()  # Verwendet Standard-CAs des Systems
        
        # Callbacks konfigurieren
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.client.on_publish = self.on_publish
        self.client.on_subscribe = self.on_subscribe
        
        # Tracking-Variablen
        self.connected = False
        self.subscribed_topics = set()
        self.message_callbacks = {}  # Topic -> Callback-Funktion
        self.pending_messages = {}  # mid -> (topic, payload, callback)
    
    def connect(self, clean_session=True):
        """
        Verbindung zum MQTT-Broker herstellen
        
        Args:
            clean_session (bool): True um eine frische Session zu starten, False um eine bestehende fortzusetzen
            
        Returns:
            bool: True bei erfolgreicher Verbindung, sonst False
        """
        if not MQTT_AVAILABLE:
            logger.error("MQTT-Verbindung nicht möglich: paho-mqtt ist nicht installiert")
            return False
        
        try:
            # Clean-Session-Flag setzen
            self.client._clean_session = clean_session
            
            # Verbindung herstellen
            self.client.connect(
                self.mqtt_host, 
                self.mqtt_port, 
                keepalive=self.mqtt_keepalive
            )
            
            # Hintergrund-Thread starten
            self.client.loop_start()
            
            # Online-Status veröffentlichen
            self.publish(
                'controller/status',
                json.dumps({"status": "online", "timestamp": timezone.now().isoformat()}),
                retain=True
            )
            
            logger.info(f"MQTT-Verbindung zum Broker {self.mqtt_host}:{self.mqtt_port} hergestellt")
            return True
            
        except Exception as e:
            logger.error(f"MQTT-Verbindungsfehler: {e}")
            return False
    
    def disconnect(self):
        """
        Verbindung zum MQTT-Broker ordnungsgemäß trennen
        
        Returns:
            bool: True bei erfolgreicher Trennung, sonst False
        """
        if not MQTT_AVAILABLE or not self.client:
            return False
        
        try:
            # Offline-Status veröffentlichen
            self.publish(
                'controller/status',
                json.dumps({"status": "offline", "timestamp": timezone.now().isoformat()}),
                retain=True
            )
            
            # Hintergrund-Thread stoppen
            self.client.loop_stop()
            
            # Verbindung trennen
            self.client.disconnect()
            
            self.connected = False
            logger.info("MQTT-Verbindung getrennt")
            return True
        except Exception as e:
            logger.error(f"MQTT-Trennungsfehler: {e}")
            return False
    
    def publish(self, topic, payload, qos=None, retain=False):
        """
        Nachricht an ein MQTT-Topic senden
        
        Args:
            topic (str): Das MQTT-Topic
            payload (str/dict): Die Nachricht als String oder Dictionary (wird zu JSON konvertiert)
            qos (int, optional): Quality of Service (0, 1, oder 2)
            retain (bool): Flag, ob die Nachricht vom Broker gespeichert werden soll
            
        Returns:
            bool: True bei erfolgreicher Veröffentlichung, sonst False
        """
        if not MQTT_AVAILABLE or not self.client:
            return False
        
        # Verbindung herstellen, falls nicht bereits verbunden
        if not self.connected:
            self.connect()
        
        try:
            # QoS aus Einstellungen oder Parameter verwenden
            qos_level = qos if qos is not None else self.mqtt_qos
            
            # Payload in String konvertieren, falls es ein Dict ist
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            
            # Nachricht senden
            result = self.client.publish(topic, payload, qos=qos_level, retain=retain)
            
            # Auf Erfolg prüfen
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"MQTT-Nachricht an {topic} gesendet: {payload[:100]}...")
                return True
            else:
                logger.error(f"MQTT-Sendefehler: {mqtt.error_string(result.rc)}")
                return False
                
        except Exception as e:
            logger.error(f"MQTT-Publikationsfehler: {e}")
            return False
    
    def subscribe(self, topic, qos=None, callback=None):
        """
        MQTT-Topic abonnieren
        
        Args:
            topic (str): Das zu abonnierende Topic
            qos (int, optional): Quality of Service (0, 1 oder 2)
            callback (callable, optional): Funktion, die bei Nachrichten aufgerufen wird
            
        Returns:
            bool: True bei erfolgreichem Abonnement, sonst False
        """
        if not MQTT_AVAILABLE or not self.client:
            return False
        
        # Verbindung herstellen, falls nicht bereits verbunden
        if not self.connected:
            self.connect()
        
        try:
            # QoS aus Einstellungen oder Parameter verwenden
            qos_level = qos if qos is not None else self.mqtt_qos
            
            # Topic abonnieren
            result, mid = self.client.subscribe(topic, qos_level)
            
            # Auf Erfolg prüfen
            if result == mqtt.MQTT_ERR_SUCCESS:
                self.subscribed_topics.add(topic)
                
                # Callback registrieren, falls angegeben
                if callback:
                    self.message_callbacks[topic] = callback
                
                logger.info(f"MQTT-Topic abonniert: {topic}")
                return True
            else:
                logger.error(f"MQTT-Abonnementfehler: {mqtt.error_string(result)}")
                return False
        except Exception as e:
            logger.error(f"MQTT-Abonnementfehler: {e}")
            return False
    
    def unsubscribe(self, topic):
        """
        Abonnement eines MQTT-Topics beenden
        
        Args:
            topic (str): Das zu kündigende Topic
            
        Returns:
            bool: True bei erfolgreicher Kündigung, sonst False
        """
        if not MQTT_AVAILABLE or not self.client:
            return False
        
        if not self.connected:
            return False
        
        try:
            result, mid = self.client.unsubscribe(topic)
            
            if result == mqtt.MQTT_ERR_SUCCESS:
                if topic in self.subscribed_topics:
                    self.subscribed_topics.remove(topic)
                
                if topic in self.message_callbacks:
                    del self.message_callbacks[topic]
                
                logger.info(f"MQTT-Topic-Abonnement beendet: {topic}")
                return True
            else:
                logger.error(f"MQTT-Abonnement-Kündigungsfehler: {mqtt.error_string(result)}")
                return False
        except Exception as e:
            logger.error(f"MQTT-Abonnement-Kündigungsfehler: {e}")
            return False
    
    # MQTT-Callbacks
    
    def on_connect(self, client, userdata, flags, rc):
        """
        Callback bei erfolgreicher Verbindung
        
        Args:
            client: MQTT-Client-Instanz
            userdata: Benutzerdaten (nicht verwendet)
            flags: Verbindungsflags
            rc: Verbindungscode (0 = erfolgreiche Verbindung)
        """
        if rc == 0:
            self.connected = True
            logger.info(f"MQTT-Verbindung hergestellt mit Broker {self.mqtt_host}:{self.mqtt_port}")
            
            # Zuvor abonnierte Topics wieder abonnieren
            for topic in self.subscribed_topics:
                self.client.subscribe(topic, qos=self.mqtt_qos)
                logger.debug(f"MQTT-Topic nach Reconnect wieder abonniert: {topic}")
        else:
            self.connected = False
            logger.error(f"MQTT-Verbindungsfehler: {mqtt.connack_string(rc)}")
    
    def on_disconnect(self, client, userdata, rc):
        """
        Callback bei Verbindungstrennung
        
        Args:
            client: MQTT-Client-Instanz
            userdata: Benutzerdaten (nicht verwendet)
            rc: Trennungscode (0 = normale Trennung, sonst Fehler)
        """
        self.connected = False
        
        if rc == 0:
            logger.info("MQTT-Verbindung normal getrennt")
        else:
            logger.warning(f"MQTT-Verbindung unerwartet getrennt: {mqtt.error_string(rc)}")
            # Bei abnormaler Trennung automatischen Reconnect überlassen (loop_start)
    
    def on_message(self, client, userdata, msg):
        """
        Callback für eingehende Nachrichten
        
        Args:
            client: MQTT-Client-Instanz
            userdata: Benutzerdaten (nicht verwendet)
            msg: Die empfangene Nachricht (topic, payload, qos, retain)
        """
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        
        logger.debug(f"MQTT-Nachricht empfangen: {topic} - {payload[:100]}...")
        
        try:
            # JSON-Payload parsen
            try:
                json_payload = json.loads(payload)
                payload_type = "json"
            except json.JSONDecodeError:
                json_payload = payload
                payload_type = "text"
            
            # Topic-spezifischen Callback aufrufen, falls vorhanden
            if topic in self.message_callbacks:
                try:
                    if payload_type == "json":
                        self.message_callbacks[topic](topic, json_payload)
                    else:
                        self.message_callbacks[topic](topic, payload)
                except Exception as callback_error:
                    logger.error(f"Fehler im Message-Callback für Topic {topic}: {callback_error}")
            
            # Controller-Status- und Telemetrie-Nachrichten verarbeiten
            self._process_controller_message(topic, json_payload if payload_type == "json" else payload)
            
        except Exception as e:
            logger.error(f"Fehler bei der Nachrichtenverarbeitung: {e}")
    
    def on_publish(self, client, userdata, mid):
        """
        Callback nach erfolgreicher Veröffentlichung
        
        Args:
            client: MQTT-Client-Instanz
            userdata: Benutzerdaten (nicht verwendet)
            mid: Message-ID der veröffentlichten Nachricht
        """
        logger.debug(f"MQTT-Nachricht {mid} erfolgreich veröffentlicht")
        
        # Callback für diese Nachricht aufrufen, falls vorhanden
        if mid in self.pending_messages:
            topic, payload, callback = self.pending_messages.pop(mid)
            
            if callback:
                try:
                    callback(topic, payload, True)  # True für erfolgreiche Veröffentlichung
                except Exception as e:
                    logger.error(f"Fehler im Publish-Callback: {e}")
    
    def on_subscribe(self, client, userdata, mid, granted_qos):
        """
        Callback nach erfolgreichem Abonnement
        
        Args:
            client: MQTT-Client-Instanz
            userdata: Benutzerdaten (nicht verwendet)
            mid: Message-ID des Abonnements
            granted_qos: Liste der gewährten QoS-Level
        """
        logger.debug(f"MQTT-Abonnement {mid} erfolgreich mit QoS {granted_qos}")
    
    # Hilfsmethoden zur Nachrichtenverarbeitung
    
    def _process_controller_message(self, topic, payload):
        """
        Verarbeitet Nachrichten von Controllern und aktualisiert die Datenbank
        
        Args:
            topic (str): Das MQTT-Topic
            payload (dict/str): Die JSON-Payload oder String-Nachricht
            
        Diese Methode kann erweitert werden, um Controller-Daten zu verarbeiten
        und in der Datenbank zu aktualisieren.
        """
        # Typischen Topic-Aufbau analysieren: controller/TYPE/ID/STATUS
        try:
            topic_parts = topic.split('/')
            
            # Prüfen, ob dies ein Controller-Topic ist
            if len(topic_parts) >= 3 and topic_parts[0] == 'controller':
                controller_type = topic_parts[1]  # 'irrigation', 'light', etc.
                
                if len(topic_parts) >= 4:
                    controller_id = topic_parts[2]    # UUID des Controllers
                    message_type = topic_parts[3]     # 'status', 'telemetry', etc.
                    
                    # Verschiedene Nachrichtentypen verarbeiten
                    if message_type == 'status' and isinstance(payload, dict):
                        self._update_controller_status(controller_type, controller_id, payload)
                    elif message_type == 'telemetry' and isinstance(payload, dict):
                        self._update_controller_telemetry(controller_type, controller_id, payload)
                    elif message_type == 'response' and isinstance(payload, dict):
                        self._process_command_response(controller_type, controller_id, payload)
        except Exception as e:
            logger.error(f"Fehler bei der Controller-Nachrichtenverarbeitung: {e}")
    
    def _update_controller_status(self, controller_type, controller_id, status_data):
        """
        Aktualisiert den Status eines Controllers in der Datenbank
        
        Args:
            controller_type (str): Typ des Controllers ('irrigation', 'light', etc.)
            controller_id (str): UUID des Controllers
            status_data (dict): Statusdaten aus der MQTT-Nachricht
        """
        # Diese Methode sollte später implementiert werden, um Controller-Status zu aktualisieren
        try:
            # Dynamischer Import, da dieser erst während der Laufzeit benötigt wird
            if controller_type == 'irrigation':
                from .models import IrrigationController
                controller_model = IrrigationController
            elif controller_type == 'light':
                from .models import LightController
                controller_model = LightController
            else:
                logger.warning(f"Unbekannter Controller-Typ: {controller_type}")
                return
            
            # Controller in der Datenbank suchen
            try:
                with transaction.atomic():
                    controller = controller_model.objects.get(id=controller_id)
                    
                    # Verbindungsstatus aktualisieren
                    if 'connected' in status_data:
                        controller.is_connected = status_data['connected']
                    
                    # Letzte Kommunikation aktualisieren
                    controller.last_communication = timezone.now()
                    
                    # Weitere Controller-spezifische Felder aktualisieren
                    if controller_type == 'irrigation':
                        if 'emergency_stop' in status_data:
                            controller.emergency_stop = status_data['emergency_stop']
                        if 'volume_used' in status_data:
                            controller.total_volume_used += float(status_data['volume_used'])
                    elif controller_type == 'light':
                        if 'emergency_off' in status_data:
                            controller.emergency_off = status_data['emergency_off']
                        if 'current_day' in status_data:
                            controller.current_day_in_cycle = int(status_data['current_day'])
                    
                    controller.save()
                    
                    logger.info(f"{controller_type.capitalize()}-Controller {controller_id} Status aktualisiert")
            except controller_model.DoesNotExist:
                logger.warning(f"{controller_type.capitalize()}-Controller mit ID {controller_id} nicht gefunden")
        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren des Controller-Status: {e}")
    
    def _update_controller_telemetry(self, controller_type, controller_id, telemetry_data):
        """
        Aktualisiert Telemetriedaten eines Controllers in der Datenbank
        
        Args:
            controller_type (str): Typ des Controllers ('irrigation', 'light', etc.)
            controller_id (str): UUID des Controllers
            telemetry_data (dict): Telemetriedaten aus der MQTT-Nachricht
        """
        # Diese Methode sollte später implementiert werden, um Controller-Telemetrie zu aktualisieren
        try:
            # Erstelle einen Logeintrag für die Telemetrie
            from .models import ControllerLog
            
            ControllerLog.objects.create(
                controller_type=controller_type,
                controller_id=controller_id,
                action_type="telemetry",
                value=telemetry_data,
                success_status=True
            )
            
            # Ressourcenverbrauch aktualisieren, falls vorhanden
            if 'resources' in telemetry_data:
                self._update_resource_usage(controller_type, controller_id, telemetry_data['resources'])
                
            logger.debug(f"Telemetriedaten für {controller_type}-Controller {controller_id} gespeichert")
        except Exception as e:
            logger.error(f"Fehler beim Speichern der Telemetriedaten: {e}")
    
    def _process_command_response(self, controller_type, controller_id, response_data):
        """
        Verarbeitet Antworten auf Befehle
        
        Args:
            controller_type (str): Typ des Controllers ('irrigation', 'light', etc.)
            controller_id (str): UUID des Controllers
            response_data (dict): Antwortdaten aus der MQTT-Nachricht
        """
        # Diese Methode sollte später implementiert werden, um Antworten auf Befehle zu verarbeiten
        try:
            # Protokollieren der Antwort
            from .models import ControllerLog
            
            request_id = response_data.get('request_id')
            success = response_data.get('success', False)
            
            ControllerLog.objects.create(
                controller_type=controller_type,
                controller_id=controller_id,
                action_type="command_response",
                value={
                    'request_id': request_id,
                    'success': success,
                    'message': response_data.get('message'),
                    'data': response_data.get('data')
                },
                success_status=success
            )
            
            logger.info(f"Antwort auf Befehl für {controller_type}-Controller {controller_id} verarbeitet: "
                      f"{'Erfolgreich' if success else 'Fehlgeschlagen'}")
        except Exception as e:
            logger.error(f"Fehler bei der Verarbeitung der Befehlsantwort: {e}")
    
    def _update_resource_usage(self, controller_type, controller_id, resource_data):
        """
        Aktualisiert Ressourcenverbrauchsdaten in der Datenbank
        
        Args:
            controller_type (str): Typ des Controllers ('irrigation', 'light', etc.)
            controller_id (str): UUID des Controllers
            resource_data (dict): Ressourcendaten aus der Telemetrie
        """
        try:
            from .models import ResourceUsage
            today = timezone.now().date()
            
            # Wasser für Bewässerungscontroller
            if controller_type == 'irrigation' and 'water' in resource_data:
                water_amount = float(resource_data['water'].get('amount', 0))
                
                if water_amount > 0:
                    ResourceUsage.objects.create(
                        controller_type=controller_type,
                        controller_id=controller_id,
                        resource_type='water',
                        date=today,
                        amount=water_amount,
                        unit='l'
                    )
            
            # Strom für Lichtcontroller
            if controller_type == 'light' and 'electricity' in resource_data:
                energy_amount = float(resource_data['electricity'].get('amount', 0))
                
                if energy_amount > 0:
                    ResourceUsage.objects.create(
                        controller_type=controller_type,
                        controller_id=controller_id,
                        resource_type='electricity',
                        date=today,
                        amount=energy_amount,
                        unit='kWh'
                    )
            
            logger.debug(f"Ressourcenverbrauch für {controller_type}-Controller {controller_id} aktualisiert")
        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren des Ressourcenverbrauchs: {e}")