# backend/logo_bridge/models.py
from django.db import models
from django.contrib.auth.models import User
import uuid
import json

class LogoDevice(models.Model):
    """Repräsentiert ein Siemens Logo Gerät"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    port = models.IntegerField(default=502)  # Modbus TCP Standard Port
    protocol = models.CharField(
        max_length=20,
        choices=[
            ('modbus_tcp', 'Modbus TCP'),
            ('s7', 'S7 Protocol'),
        ],
        default='modbus_tcp'
    )
    is_active = models.BooleanField(default=True)
    last_connection = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.ip_address})"

class LogoVariable(models.Model):
    """Definiert Variablen/Register in der Logo"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(LogoDevice, on_delete=models.CASCADE, related_name='variables')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=50)  # z.B. "M0.0", "VW100"
    data_type = models.CharField(
        max_length=20,
        choices=[
            ('bool', 'Boolean'),
            ('int', 'Integer'),
            ('float', 'Float'),
            ('string', 'String'),
        ]
    )
    access_mode = models.CharField(
        max_length=10,
        choices=[
            ('read', 'Read Only'),
            ('write', 'Write Only'),
            ('read_write', 'Read/Write'),
        ],
        default='read_write'
    )
    unit = models.CharField(max_length=20, blank=True)  # z.B. "°C", "bar"
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['device', 'address']
    
    def __str__(self):
        return f"{self.device.name} - {self.name} ({self.address})"

class LogoCommand(models.Model):
    """Vordefinierte Befehle für die Logo"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(LogoDevice, on_delete=models.CASCADE, related_name='commands')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    command_type = models.CharField(
        max_length=20,
        choices=[
            ('single', 'Single Variable'),
            ('sequence', 'Sequence'),
            ('script', 'Script'),
        ]
    )
    variables = models.ManyToManyField(LogoVariable)
    parameters = models.JSONField(default=dict)  # Flexible Parameter-Speicherung
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.device.name} - {self.name}"

class LogoLog(models.Model):
    """Logging aller Logo-Aktivitäten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(LogoDevice, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)  # read, write, command
    variable = models.ForeignKey(LogoVariable, on_delete=models.SET_NULL, null=True, blank=True)
    value = models.JSONField(null=True, blank=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']