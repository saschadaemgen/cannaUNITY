import requests
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class S7WebServerClient:
    """Client für S7-1200 G2 Webserver JSON-RPC Kommunikation"""
    
    def __init__(self, ip: str, port: int = 80, username: str = "", password: str = ""):
        self.base_url = f"http://{ip}:{port}"
        self.api_url = f"{self.base_url}/api/jsonrpc"
        self.session = requests.Session()
        
        # Authentifizierung falls erforderlich
        if username and password:
            self.authenticate(username, password)
    
    def authenticate(self, username: str, password: str) -> bool:
        """Authentifizierung bei der S7-1200"""
        try:
            # Bei S7-1200 oft Basic Auth
            self.session.auth = (username, password)
            
            # Test-Request
            response = self.session.get(self.base_url)
            return response.status_code != 401
        except Exception as e:
            logger.error(f"Auth failed: {e}")
            return False
    
    def json_rpc_call(self, method: str, params: Dict[str, Any]) -> Optional[Dict]:
        """JSON-RPC 2.0 Aufruf gemäß Siemens Spezifikation"""
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        try:
            logger.debug(f"Sending to {self.api_url}: {json.dumps(payload)}")
            
            response = self.session.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=5
            )
            
            logger.debug(f"Response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                
                if "error" in result:
                    logger.error(f"RPC Error: {result['error']}")
                    return None
                    
                return result.get("result")
            else:
                logger.error(f"HTTP Error: {response.status_code}")
                return None
                
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection failed to {self.api_url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return None
    
    def read_output(self, address: str) -> Optional[bool]:
        """Liest PLC Variable mit PlcProgram.Read"""
        
        # Korrekte Syntax für S7-1200
        result = self.json_rpc_call("PlcProgram.Read", {
            "var": address,
            "mode": "simple"
        })
        
        if result is not None:
            # Result kann verschiedene Formate haben
            if isinstance(result, dict):
                return bool(result.get("value", result.get("Value", False)))
            else:
                return bool(result)
        
        return None
    
    def write_output(self, address: str, value: bool) -> bool:
        """Schreibt PLC Variable mit PlcProgram.Write"""
        
        result = self.json_rpc_call("PlcProgram.Write", {
            "var": address,
            "value": value
        })
        
        return result is not None