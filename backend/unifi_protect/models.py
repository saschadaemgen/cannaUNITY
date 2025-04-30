# backend/unifi_protect/models.py

from django.db import models

class ProtectSensor(models.Model):
    """
    Modell für UniFi Protect Sensoren.
    Speichert den aktuellen Zustand jedes Sensors.
    """
    name = models.CharField(max_length=100)
    sensor_type = models.CharField(max_length=50)
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    # Wird bei jedem Update automatisch aktualisiert
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['last_seen']),
            models.Index(fields=['name', 'last_seen']),
        ]
        verbose_name = "Protect Sensor"
        verbose_name_plural = "Protect Sensoren"


class ProtectSensorHistory(models.Model):
    """
    Modell für historische Sensordaten.
    Speichert für jeden 5-Minuten-Intervall einen Eintrag für Temperatur und Luftfeuchtigkeit.
    """
    # Referenz auf den Sensornamen (nicht direkte ForeignKey, um Flexibilität zu behalten)
    sensor_name = models.CharField(max_length=100, db_index=True)
    
    # Explizites Zeitstempelfeld, das nicht automatisch aktualisiert wird
    timestamp = models.DateTimeField(db_index=True)
    
    # Messwerte
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    
    # Optional: Quelle des Datenpunktes
    source = models.CharField(max_length=50, default="listener", help_text="Datenquelle: listener, api, etc.")

    def __str__(self):
        return f"{self.sensor_name} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-timestamp']
        # Verbundsindex für schnelle Abfragen nach Name+Zeit
        indexes = [
            models.Index(fields=['sensor_name', 'timestamp']),
        ]
        # Optional: Speicherplatz sparen durch eindeutige Einträge pro Sensor und Zeit
        # (Verhindert doppelte Einträge im gleichen Zeitraum)
        unique_together = ['sensor_name', 'timestamp']
        verbose_name = "Sensorverlauf"
        verbose_name_plural = "Sensorverläufe"