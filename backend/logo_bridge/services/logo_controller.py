# backend/logo_bridge/services/logo_controller.py
from typing import Dict, Any, Optional
from ..models import LogoDevice, LogoVariable, LogoLog
from .logo_connection import ModbusLogoConnection, S7LogoConnection
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class LogoController:
    """Synchroner Controller für Logo-Operationen"""
    
    def __init__(self):
        self.connections: Dict[str, Any] = {}
    
    def get_connection(self, device: LogoDevice):
        """Holt oder erstellt eine Verbindung zur Logo"""
        device_key = str(device.id)
        
        if device_key not in self.connections:
            if device.protocol == 'modbus_tcp':
                conn = ModbusLogoConnection(device.ip_address, device.port)
            elif device.protocol == 's7':
                conn = S7LogoConnection(device.ip_address, device.port)
            else:
                raise ValueError(f"Unknown protocol: {device.protocol}")
            
            if conn.connect():
                self.connections[device_key] = conn
                device.last_connection = timezone.now()
                device.save()
            else:
                raise Exception("Failed to connect to Logo")
        
        return self.connections[device_key]
    
    def disconnect_device(self, device: LogoDevice):
        """Trennt die Verbindung zu einem Gerät"""
        device_key = str(device.id)
        
        if device_key in self.connections:
            self.connections[device_key].disconnect()
            del self.connections[device_key]
    
    def read_variable(self, variable: LogoVariable, user=None) -> Any:
        """Liest eine Variable von der Logo"""
        conn = self.get_connection(variable.device)
        
        try:
            value = conn.read_variable(variable.address, variable.data_type)
            
            # Log successful read
            LogoLog.objects.create(
                device=variable.device,
                user=user,
                action='read',
                variable=variable,
                value={'value': value},
                success=True
            )
            
            return value
            
        except Exception as e:
            # Log error
            LogoLog.objects.create(
                device=variable.device,
                user=user,
                action='read',
                variable=variable,
                success=False,
                error_message=str(e)
            )
            raise
    
    def write_variable(self, variable: LogoVariable, value: Any, user=None) -> bool:
        """Schreibt eine Variable zur Logo"""
        # Validierung
        if variable.access_mode == 'read':
            raise ValueError("Variable is read-only")
        
        if variable.min_value is not None and float(value) < variable.min_value:
            raise ValueError(f"Value below minimum: {variable.min_value}")
        
        if variable.max_value is not None and float(value) > variable.max_value:
            raise ValueError(f"Value above maximum: {variable.max_value}")
        
        conn = self.get_connection(variable.device)
        
        try:
            success = conn.write_variable(variable.address, value, variable.data_type)
            
            LogoLog.objects.create(
                device=variable.device,
                user=user,
                action='write',
                variable=variable,
                value={'value': value},
                success=success
            )
            
            return success
            
        except Exception as e:
            LogoLog.objects.create(
                device=variable.device,
                user=user,
                action='write',
                variable=variable,
                value={'value': value},
                success=False,
                error_message=str(e)
            )
            raise
    
    def execute_command(self, command, parameters: Dict[str, Any], user=None) -> bool:
        """Führt einen vordefinierten Befehl aus"""
        try:
            if command.command_type == 'single':
                # Einzelne Variable setzen
                variable = command.variables.first()
                if not variable:
                    raise ValueError("No variable assigned to command")
                
                value = parameters.get('value')
                if value is None:
                    raise ValueError("Value parameter required")
                
                return self.write_variable(variable, value, user=user)
                
            elif command.command_type == 'sequence':
                # Sequenz von Variablen setzen
                success = True
                for var_config in command.parameters.get('sequence', []):
                    variable_id = var_config.get('variable_id')
                    value = var_config.get('value')
                    
                    if variable_id and value is not None:
                        variable = command.variables.filter(id=variable_id).first()
                        if variable:
                            success &= self.write_variable(variable, value, user=user)
                
                return success
                
            elif command.command_type == 'script':
                # Komplexere Skript-Logik
                # TODO: Implementieren Sie nach Bedarf
                return True
                
            else:
                raise ValueError(f"Unknown command type: {command.command_type}")
                
        except Exception as e:
            LogoLog.objects.create(
                device=command.device,
                user=user,
                action='command',
                value={'command': command.name, 'parameters': parameters},
                success=False,
                error_message=str(e)
            )
            raise

# Globale Instanz
logo_controller = LogoController()


# backend/logo_bridge/services/logo_connection.py
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException
import snap7
from typing import Any
import logging
import struct

logger = logging.getLogger(__name__)

class LogoConnection:
    """Abstrakte Basisklasse für Logo-Verbindungen"""
    
    def __init__(self, ip_address: str, port: int):
        self.ip_address = ip_address
        self.port = port
        self.connected = False
    
    def connect(self) -> bool:
        raise NotImplementedError
    
    def disconnect(self) -> None:
        raise NotImplementedError
    
    def read_variable(self, address: str, data_type: str) -> Any:
        raise NotImplementedError
    
    def write_variable(self, address: str, value: Any, data_type: str) -> bool:
        raise NotImplementedError

class ModbusLogoConnection(LogoConnection):
    """Synchrone Modbus TCP Verbindung zur Siemens Logo"""
    
    def __init__(self, ip_address: str, port: int = 502):
        super().__init__(ip_address, port)
        self.client = None
    
    def connect(self) -> bool:
        try:
            self.client = ModbusTcpClient(
                host=self.ip_address,
                port=self.port,
                timeout=5
            )
            result = self.client.connect()
            self.connected = result
            
            if result:
                logger.info(f"Connected to Logo at {self.ip_address}:{self.port}")
            else:
                logger.error(f"Failed to connect to Logo at {self.ip_address}:{self.port}")
                
            return result
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self.connected = False
            return False
    
    def disconnect(self) -> None:
        if self.client:
            self.client.close()
            self.connected = False
            logger.info(f"Disconnected from Logo at {self.ip_address}")
    
    def read_variable(self, address: str, data_type: str) -> Any:
        """Liest eine Variable von der Logo
        
        Unterstützte Adressformate:
        - 40001-49999: Holding Register
        - 00001-09999: Coils (Discrete Outputs)
        - 10001-19999: Discrete Inputs
        - 30001-39999: Input Registers
        - M0.0: Merker Bit
        - MW0: Merker Word
        - MD0: Merker DWord
        """
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            # Holding Register (40001-49999)
            if 40001 <= int(address) <= 49999:
                register = int(address) - 40001
                
                if data_type == 'bool':
                    # Lese Register und extrahiere Bit 0
                    result = self.client.read_holding_registers(register, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return bool(result.registers[0] & 0x0001)
                    
                elif data_type == 'int':
                    result = self.client.read_holding_registers(register, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return result.registers[0]
                    
                elif data_type == 'float':
                    result = self.client.read_holding_registers(register, 2)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return self._registers_to_float(result.registers)
                    
            # Coils (00001-09999)
            elif 1 <= int(address) <= 9999:
                coil = int(address) - 1
                result = self.client.read_coils(coil, 1)
                if result.isError():
                    raise ModbusException(f"Read error: {result}")
                return result.bits[0]
                
            # Discrete Inputs (10001-19999)
            elif 10001 <= int(address) <= 19999:
                input_addr = int(address) - 10001
                result = self.client.read_discrete_inputs(input_addr, 1)
                if result.isError():
                    raise ModbusException(f"Read error: {result}")
                return result.bits[0]
                
            # Input Registers (30001-39999)
            elif 30001 <= int(address) <= 39999:
                register = int(address) - 30001
                
                if data_type in ['bool', 'int']:
                    result = self.client.read_input_registers(register, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    if data_type == 'bool':
                        return bool(result.registers[0] & 0x0001)
                    return result.registers[0]
                    
                elif data_type == 'float':
                    result = self.client.read_input_registers(register, 2)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return self._registers_to_float(result.registers)
                    
            # Logo-spezifische Merker-Adressierung
            elif address.startswith('M'):
                if address.startswith('MW'):  # Merker Word
                    register = int(address[2:])
                    result = self.client.read_holding_registers(register, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return result.registers[0]
                    
                elif address.startswith('MD'):  # Merker DWord
                    register = int(address[2:])
                    if data_type == 'float':
                        result = self.client.read_holding_registers(register, 2)
                        if result.isError():
                            raise ModbusException(f"Read error: {result}")
                        return self._registers_to_float(result.registers)
                    else:
                        result = self.client.read_holding_registers(register, 2)
                        if result.isError():
                            raise ModbusException(f"Read error: {result}")
                        return (result.registers[0] << 16) | result.registers[1]
                        
                else:  # M0.0 Format (Merker Bit)
                    parts = address[1:].split('.')
                    byte_addr = int(parts[0])
                    bit_addr = int(parts[1]) if len(parts) > 1 else 0
                    
                    # Lese Merker-Bit über Coils
                    coil_addr = byte_addr * 8 + bit_addr
                    result = self.client.read_coils(coil_addr, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return result.bits[0]
                    
            else:
                # Versuche es als Integer zu parsen
                try:
                    addr_int = int(address)
                    # Standard Holding Register
                    result = self.client.read_holding_registers(addr_int, 1)
                    if result.isError():
                        raise ModbusException(f"Read error: {result}")
                    return result.registers[0]
                except ValueError:
                    raise ValueError(f"Unknown address format: {address}")
                
        except ModbusException as e:
            logger.error(f"Modbus read error: {e}")
            raise
        except Exception as e:
            logger.error(f"Read error: {e}")
            raise
    
    def write_variable(self, address: str, value: Any, data_type: str) -> bool:
        """Schreibt eine Variable zur Logo"""
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            # Holding Register (40001-49999)
            if 40001 <= int(address) <= 49999:
                register = int(address) - 40001
                
                if data_type == 'bool':
                    # Schreibe als einzelnes Register (0 oder 1)
                    result = self.client.write_register(register, 1 if bool(value) else 0)
                elif data_type == 'int':
                    result = self.client.write_register(register, int(value))
                elif data_type == 'float':
                    registers = self._float_to_registers(float(value))
                    result = self.client.write_registers(register, registers)
                else:
                    raise ValueError(f"Unsupported data type: {data_type}")
                    
                return not result.isError()
                
            # Coils (00001-09999)
            elif 1 <= int(address) <= 9999:
                coil = int(address) - 1
                result = self.client.write_coil(coil, bool(value))
                return not result.isError()
                
            # Logo-spezifische Merker-Adressierung
            elif address.startswith('M'):
                if address.startswith('MW'):  # Merker Word
                    register = int(address[2:])
                    result = self.client.write_register(register, int(value))
                    return not result.isError()
                    
                elif address.startswith('MD'):  # Merker DWord
                    register = int(address[2:])
                    if data_type == 'float':
                        registers = self._float_to_registers(float(value))
                        result = self.client.write_registers(register, registers)
                    else:
                        # Integer als DWord
                        int_value = int(value)
                        registers = [(int_value >> 16) & 0xFFFF, int_value & 0xFFFF]
                        result = self.client.write_registers(register, registers)
                    return not result.isError()
                    
                else:  # M0.0 Format (Merker Bit)
                    parts = address[1:].split('.')
                    byte_addr = int(parts[0])
                    bit_addr = int(parts[1]) if len(parts) > 1 else 0
                    
                    # Schreibe Merker-Bit über Coils
                    coil_addr = byte_addr * 8 + bit_addr
                    result = self.client.write_coil(coil_addr, bool(value))
                    return not result.isError()
                    
            else:
                # Versuche es als Integer zu parsen
                try:
                    addr_int = int(address)
                    # Standard Holding Register
                    result = self.client.write_register(addr_int, int(value))
                    return not result.isError()
                except ValueError:
                    raise ValueError(f"Unknown address format: {address}")
                
        except ModbusException as e:
            logger.error(f"Modbus write error: {e}")
            return False
        except Exception as e:
            logger.error(f"Write error: {e}")
            raise
    
    def _registers_to_float(self, registers):
        """Konvertiert zwei 16-bit Register zu einem Float"""
        if len(registers) < 2:
            raise ValueError("Need 2 registers for float conversion")
        
        # Big-endian byte order (AB CD)
        bytes_data = struct.pack('>HH', registers[0], registers[1])
        return struct.unpack('>f', bytes_data)[0]
    
    def _float_to_registers(self, value):
        """Konvertiert einen Float zu zwei 16-bit Registern"""
        bytes_data = struct.pack('>f', float(value))
        return list(struct.unpack('>HH', bytes_data))

class S7LogoConnection(LogoConnection):
    """S7 Protokoll Verbindung zur Siemens Logo"""
    
    def __init__(self, ip_address: str, port: int = 102):
        super().__init__(ip_address, port)
        self.client = None
    
    def connect(self) -> bool:
        try:
            self.client = snap7.client.Client()
            # Logo 8: Rack 0, Slot 2
            # Logo 0BA7 und älter: Rack 0, Slot 1
            self.client.connect(self.ip_address, 0, 2)
            self.connected = True
            logger.info(f"Connected to Logo via S7 at {self.ip_address}")
            return True
        except Exception as e:
            logger.error(f"S7 connection failed: {e}")
            self.connected = False
            return False
    
    def disconnect(self) -> None:
        if self.client:
            self.client.disconnect()
            self.connected = False
            logger.info(f"Disconnected from Logo at {self.ip_address}")
    
    def read_variable(self, address: str, data_type: str) -> Any:
        """Liest eine Variable über S7"""
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            # Merker-Bereich
            if address.startswith('M'):
                if 'MB' in address:  # Byte
                    offset = int(address[2:])
                    data = self.client.mb_read(offset, 1)
                    return data[0]
                    
                elif 'MW' in address:  # Word
                    offset = int(address[2:])
                    data = self.client.mb_read(offset, 2)
                    return struct.unpack('>H', data)[0]
                    
                elif 'MD' in address:  # DWord
                    offset = int(address[2:])
                    data = self.client.mb_read(offset, 4)
                    if data_type == 'float':
                        return struct.unpack('>f', data)[0]
                    else:
                        return struct.unpack('>I', data)[0]
                        
                else:  # M0.0 Format
                    parts = address[1:].split('.')
                    byte_offset = int(parts[0])
                    bit_offset = int(parts[1]) if len(parts) > 1 else 0
                    data = self.client.mb_read(byte_offset, 1)
                    return bool(data[0] & (1 << bit_offset))
                    
            # Eingangsbereich
            elif address.startswith('I'):
                if 'IB' in address:  # Input Byte
                    offset = int(address[2:])
                    data = self.client.eb_read(offset, 1)
                    return data[0]
                    
                elif 'IW' in address:  # Input Word
                    offset = int(address[2:])
                    data = self.client.eb_read(offset, 2)
                    return struct.unpack('>H', data)[0]
                    
                else:  # I0.0 Format
                    parts = address[1:].split('.')
                    byte_offset = int(parts[0])
                    bit_offset = int(parts[1]) if len(parts) > 1 else 0
                    data = self.client.eb_read(byte_offset, 1)
                    return bool(data[0] & (1 << bit_offset))
                    
            # Ausgangsbereich
            elif address.startswith('Q'):
                if 'QB' in address:  # Output Byte
                    offset = int(address[2:])
                    data = self.client.ab_read(offset, 1)
                    return data[0]
                    
                elif 'QW' in address:  # Output Word
                    offset = int(address[2:])
                    data = self.client.ab_read(offset, 2)
                    return struct.unpack('>H', data)[0]
                    
                else:  # Q0.0 Format
                    parts = address[1:].split('.')
                    byte_offset = int(parts[0])
                    bit_offset = int(parts[1]) if len(parts) > 1 else 0
                    data = self.client.ab_read(byte_offset, 1)
                    return bool(data[0] & (1 << bit_offset))
                    
            # VM-Bereich (Logo-spezifisch)
            elif address.startswith('V'):
                if 'VB' in address:  # Variable Byte
                    offset = int(address[2:])
                    # VM-Bereich beginnt bei DB1 in Logo
                    data = self.client.db_read(1, offset, 1)
                    return data[0]
                    
                elif 'VW' in address:  # Variable Word
                    offset = int(address[2:])
                    data = self.client.db_read(1, offset, 2)
                    return struct.unpack('>H', data)[0]
                    
                elif 'VD' in address:  # Variable DWord
                    offset = int(address[2:])
                    data = self.client.db_read(1, offset, 4)
                    if data_type == 'float':
                        return struct.unpack('>f', data)[0]
                    else:
                        return struct.unpack('>I', data)[0]
                        
            else:
                raise ValueError(f"Unknown S7 address format: {address}")
                
        except Exception as e:
            logger.error(f"S7 read error: {e}")
            raise
    
    def write_variable(self, address: str, value: Any, data_type: str) -> bool:
        """Schreibt eine Variable über S7"""
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            # Merker-Bereich
            if address.startswith('M'):
                if 'MB' in address:  # Byte
                    offset = int(address[2:])
                    self.client.mb_write(offset, bytes([int(value)]))
                    
                elif 'MW' in address:  # Word
                    offset = int(address[2:])
                    data = struct.pack('>H', int(value))
                    self.client.mb_write(offset, data)
                    
                elif 'MD' in address:  # DWord
                    offset = int(address[2:])
                    if data_type == 'float':
                        data = struct.pack('>f', float(value))
                    else:
                        data = struct.pack('>I', int(value))
                    self.client.mb_write(offset, data)
                    
                else:  # M0.0 Format
                    parts = address[1:].split('.')
                    byte_offset = int(parts[0])
                    bit_offset = int(parts[1]) if len(parts) > 1 else 0
                    
                    # Lese aktuellen Byte-Wert
                    current = self.client.mb_read(byte_offset, 1)[0]
                    
                    # Setze oder lösche Bit
                    if bool(value):
                        new_value = current | (1 << bit_offset)
                    else:
                        new_value = current & ~(1 << bit_offset)
                    
                    self.client.mb_write(byte_offset, bytes([new_value]))
                    
            # Ausgangsbereich
            elif address.startswith('Q'):
                if 'QB' in address:  # Output Byte
                    offset = int(address[2:])
                    self.client.ab_write(offset, bytes([int(value)]))
                    
                elif 'QW' in address:  # Output Word
                    offset = int(address[2:])
                    data = struct.pack('>H', int(value))
                    self.client.ab_write(offset, data)
                    
                else:  # Q0.0 Format
                    parts = address[1:].split('.')
                    byte_offset = int(parts[0])
                    bit_offset = int(parts[1]) if len(parts) > 1 else 0
                    
                    # Lese aktuellen Byte-Wert
                    current = self.client.ab_read(byte_offset, 1)[0]
                    
                    # Setze oder lösche Bit
                    if bool(value):
                        new_value = current | (1 << bit_offset)
                    else:
                        new_value = current & ~(1 << bit_offset)
                    
                    self.client.ab_write(byte_offset, bytes([new_value]))
                    
            # VM-Bereich (Logo-spezifisch)
            elif address.startswith('V'):
                if 'VB' in address:  # Variable Byte
                    offset = int(address[2:])
                    self.client.db_write(1, offset, bytes([int(value)]))
                    
                elif 'VW' in address:  # Variable Word
                    offset = int(address[2:])
                    data = struct.pack('>H', int(value))
                    self.client.db_write(1, offset, data)
                    
                elif 'VD' in address:  # Variable DWord
                    offset = int(address[2:])
                    if data_type == 'float':
                        data = struct.pack('>f', float(value))
                    else:
                        data = struct.pack('>I', int(value))
                    self.client.db_write(1, offset, data)
                    
            else:
                raise ValueError(f"Unknown S7 address format: {address}")
                
            return True
            
        except Exception as e:
            logger.error(f"S7 write error: {e}")
            return False