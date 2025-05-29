from django.db import models
from django.conf import settings
import uuid

class PLCDevice(models.Model):
    """SPS-Geräte verwalten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    port = models.IntegerField(default=80)
    username = models.CharField(max_length=50, default="Everybody")
    password = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.ip_address})"

class PLCOutput(models.Model):
    """Ausgänge der SPS"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(PLCDevice, on_delete=models.CASCADE, related_name='outputs')
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=20)  # z.B. "Q0.0"
    description = models.TextField(blank=True)
    current_state = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.address})"

class PLCLog(models.Model):
    """Logging von SPS-Aktionen"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    output = models.ForeignKey(PLCOutput, on_delete=models.CASCADE)
    action = models.CharField(max_length=20)  # 'on', 'off', 'read'
    old_state = models.BooleanField(null=True)
    new_state = models.BooleanField(null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Korrekte User-Referenz
        on_delete=models.SET_NULL, 
        null=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)