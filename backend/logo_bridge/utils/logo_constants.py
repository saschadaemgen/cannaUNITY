# backend/logo_bridge/utils/logo_constants.py
"""Konstanten und Konfiguration für Logo Bridge"""

# Modbus-Adressbereiche
MODBUS_COILS_START = 1
MODBUS_COILS_END = 9999
MODBUS_DISCRETE_INPUTS_START = 10001
MODBUS_DISCRETE_INPUTS_END = 19999
MODBUS_INPUT_REGISTERS_START = 30001
MODBUS_INPUT_REGISTERS_END = 39999
MODBUS_HOLDING_REGISTERS_START = 40001
MODBUS_HOLDING_REGISTERS_END = 49999

# Logo-spezifische Adressen
LOGO_MERKER_START = 'M'
LOGO_INPUT_START = 'I'
LOGO_OUTPUT_START = 'Q'
LOGO_VARIABLE_START = 'V'

# Standard-Ports
MODBUS_DEFAULT_PORT = 502
S7_DEFAULT_PORT = 102

# Timeout-Werte
CONNECTION_TIMEOUT = 5
READ_TIMEOUT = 3
WRITE_TIMEOUT = 3

# Datentyp-Mapping
DATA_TYPE_SIZES = {
    'bool': 1,
    'int': 2,
    'float': 4,
    'string': 0  # Variable Länge
}

# Beispiel-Adressen für verschiedene Logo-Modelle
LOGO_ADDRESS_EXAMPLES = {
    'modbus': {
        'coil': '00001',  # Digitaler Ausgang
        'discrete_input': '10001',  # Digitaler Eingang
        'input_register': '30001',  # Analoger Eingang
        'holding_register': '40001',  # Analoger Ausgang/Merker
        'merker_bit': 'M0.0',  # Merker Bit
        'merker_word': 'MW0',  # Merker Word
        'merker_dword': 'MD0',  # Merker DWord
    },
    's7': {
        'input_bit': 'I0.0',  # Eingang Bit
        'input_byte': 'IB0',  # Eingang Byte
        'input_word': 'IW0',  # Eingang Word
        'output_bit': 'Q0.0',  # Ausgang Bit
        'output_byte': 'QB0',  # Ausgang Byte
        'output_word': 'QW0',  # Ausgang Word
        'merker_bit': 'M0.0',  # Merker Bit
        'merker_byte': 'MB0',  # Merker Byte
        'merker_word': 'MW0',  # Merker Word
        'merker_dword': 'MD0',  # Merker DWord
        'variable_byte': 'VB0',  # Variable Byte (VM-Bereich)
        'variable_word': 'VW0',  # Variable Word (VM-Bereich)
        'variable_dword': 'VD0',  # Variable DWord (VM-Bereich)
    }
}