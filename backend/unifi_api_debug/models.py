from django.db import models

class NfcDebugLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=128)
    status = models.CharField(max_length=32)
    raw_data = models.TextField(blank=True)
