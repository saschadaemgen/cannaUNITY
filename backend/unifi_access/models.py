# models.py für unifi_access
from django.db import models

class AccessEvent(models.Model):
    actor = models.CharField(max_length=255, help_text="Benutzer, der das Ereignis ausgelöst hat")
    door = models.CharField(max_length=255, help_text="Tür, an der das Ereignis stattfand")
    event_type = models.CharField(max_length=50, help_text="Typ des Ereignisses (z.B. unlock)")
    timestamp = models.DateTimeField(auto_now_add=True, help_text="Zeitpunkt des Ereignisses")
    authentication = models.CharField(max_length=100, blank=True, null=True)
    card_uid = models.CharField(max_length=50, blank=True, null=True, help_text="UID der RFID-Karte (falls übermittelt)")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Zugriffsereignis"
        verbose_name_plural = "Zugriffsereignisse"

    def __str__(self):
        return f"{self.actor} - {self.door} - {self.event_type} ({self.timestamp.strftime('%d.%m.%Y %H:%M:%S')})"
