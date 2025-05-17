# rfid_bridge/models.py
import uuid
from django.db import models
from django.utils import timezone

class RFIDSession(models.Model):
    """Session-Tracking für RFID-Authentifizierung"""
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_app = models.CharField(max_length=100, help_text="Ziel-App für die Authentifizierung")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    member_id = models.IntegerField(null=True, blank=True)
    
    @property
    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()