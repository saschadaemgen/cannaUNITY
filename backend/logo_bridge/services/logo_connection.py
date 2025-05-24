# backend/logo_bridge/services/logo_connection.py
import asyncio
from pymodbus.client import AsyncModbusTcpClient
from pymodbus.exceptions import ModbusException
import snap7
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class LogoConnection:
    """Abstrakte Basisklasse für Logo-Verbindungen"""
    
    def __init__(self, ip_address: str, port: int):
        self.ip_address = ip_address
        self.port = port
        self.connected = False
    
    async def connect(self) -> bool:
        raise NotImplementedError
    
    async def disconnect(self) -> None:
        raise NotImplementedError
    
    async def read_variable(self, address: str, data_type: str) -> Any:
        raise NotImplementedError
    
    async def write_variable(self, address: str, value: Any, data_type: str) -> bool:
        raise NotImplementedError

class ModbusLogoConnection(LogoConnection):
    """Modbus TCP Verbindung zur Siemens Logo"""
    
    def __init__(self, ip_address: str, port: int = 502):
        super().__init__(ip_address, port)
        self.client = None
    
    async def connect(self) -> bool:
        try:
            self.client = AsyncModbusTcpClient(
                host=self.ip_address,
                port=self.port,
                timeout=5
            )
            await self.client.connect()
            self.connected = True
            logger.info(f"Connected to Logo at {self.ip_address}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self.connected = False
            return False
    
    async def disconnect(self) -> None:
        if self.client:
            self.client.close()
            self.connected = False
            logger.info(f"Disconnected from Logo at {self.ip_address}")
    
    async def read_variable(self, address: str, data_type: str) -> Any:
        """Liest eine Variable von der Logo
        
        Args:
            address: Modbus-Adresse (z.B. "40001" für Holding Register 1)
            data_type: Datentyp ('bool', 'int', 'float')
        """
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            # Parse address
            register = int(address) - 40001  # Modbus offset
            
            if data_type == 'bool':
                result = await self.client.read_coils(register, 1)
                return result.bits[0]
            elif data_type == 'int':
                result = await self.client.read_holding_registers(register, 1)
                return result.registers[0]
            elif data_type == 'float':
                result = await self.client.read_holding_registers(register, 2)
                # Convert two registers to float (big-endian)
                return self._registers_to_float(result.registers)
            else:
                raise ValueError(f"Unsupported data type: {data_type}")
                
        except ModbusException as e:
            logger.error(f"Modbus read error: {e}")
            raise
    
    async def write_variable(self, address: str, value: Any, data_type: str) -> bool:
        """Schreibt eine Variable zur Logo"""
        if not self.connected:
            raise Exception("Not connected to Logo")
        
        try:
            register = int(address) - 40001
            
            if data_type == 'bool':
                await self.client.write_coil(register, value)
            elif data_type == 'int':
                await self.client.write_register(register, int(value))
            elif data_type == 'float':
                registers = self._float_to_registers(float(value))
                await self.client.write_registers(register, registers)
            else:
                raise ValueError(f"Unsupported data type: {data_type}")
            
            return True
            
        except ModbusException as e:
            logger.error(f"Modbus write error: {e}")
            return False
    
    def _registers_to_float(self, registers):
        """Konvertiert zwei 16-bit Register zu einem Float"""
        # Implementation abhängig vom Logo-Format
        pass
    
    def _float_to_registers(self, value):
        """Konvertiert einen Float zu zwei 16-bit Registern"""
        # Implementation abhängig vom Logo-Format
        pass

class S7LogoConnection(LogoConnection):
    """S7 Protokoll Verbindung zur Siemens Logo"""
    
    def __init__(self, ip_address: str, port: int = 102):
        super().__init__(ip_address, port)
        self.client = snap7.client.Client()
    
    async def connect(self) -> bool:
        try:
            self.client.connect(self.ip_address, 0, 1)  # Rack 0, Slot 1
            self.connected = True
            logger.info(f"Connected to Logo via S7 at {self.ip_address}")
            return True
        except Exception as e:
            logger.error(f"S7 connection failed: {e}")
            self.connected = False
            return False
    
    # Weitere S7-spezifische Implementierungen...