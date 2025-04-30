from django.db import models
from django.contrib.postgres.fields import JSONField

class SensorTemplate(models.Model):
    protect_id   = models.CharField(max_length=64, unique=True)
    name         = models.CharField(max_length=128)
    sensor_type  = models.CharField(max_length=64)
    capabilities = models.JSONField()          # <-- geändert
    last_synced  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.protect_id})"

class RoomSensor(models.Model):
    room       = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="ha_sensors")
    template   = models.ForeignKey(SensorTemplate, on_delete=models.PROTECT)
    label      = models.CharField(max_length=100, blank=True)
    installed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.label or self.template.name
