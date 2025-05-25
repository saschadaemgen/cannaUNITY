# backend/controller/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import json


class ControlUnit(models.Model):
    """Repräsentiert eine Steuerungseinheit in einem Raum"""
    
    UNIT_TYPE_CHOICES = [
        ('lighting', 'Beleuchtung'),
        ('climate', 'Klimasteuerung'),
        ('watering', 'Bewässerung'),
        ('co2', 'CO2-Kontrolle'),
        ('humidity', 'Luftfeuchtigkeit'),
        ('other', 'Sonstiges'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Aktiv'),
        ('inactive', 'Inaktiv'),
        ('error', 'Fehler'),
        ('maintenance', 'Wartung'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='control_units')
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES)
    name = models.CharField(max_length=100, help_text="Eindeutiger Name der Steuerungseinheit")
    description = models.TextField(blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    last_sync = models.DateTimeField(null=True, blank=True, help_text="Letzter erfolgreicher Sync mit SPS")
    
    # SPS-Verbindungsdaten
    plc_address = models.CharField(max_length=50, blank=True, null=True, help_text="SPS-Adresse oder ID")
    plc_db_number = models.IntegerField(null=True, blank=True, help_text="Datenbaustein-Nummer in der SPS")
    
    # Metadaten
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['room', 'name']
        ordering = ['room', 'name']
        verbose_name = 'Steuerungseinheit'
        verbose_name_plural = 'Steuerungseinheiten'
    
    def __str__(self):
        return f"{self.name} ({self.room.name})"


class ControlSchedule(models.Model):
    """Zeitplan für eine Steuerungseinheit"""
    
    WEEKDAY_CHOICES = [
        (0, 'Montag'),
        (1, 'Dienstag'),
        (2, 'Mittwoch'),
        (3, 'Donnerstag'),
        (4, 'Freitag'),
        (5, 'Samstag'),
        (6, 'Sonntag'),
    ]
    
    control_unit = models.ForeignKey(ControlUnit, on_delete=models.CASCADE, related_name='schedules')
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Werte während dieser Zeit
    target_value = models.FloatField(help_text="Zielwert (z.B. Temperatur, Dimmlevel)")
    secondary_value = models.FloatField(null=True, blank=True, help_text="Sekundärwert (z.B. Luftfeuchtigkeit)")
    
    # Zusätzliche Parameter als JSON
    parameters = models.JSONField(default=dict, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['weekday', 'start_time']
        unique_together = ['control_unit', 'weekday', 'start_time']
        verbose_name = 'Zeitplan'
        verbose_name_plural = 'Zeitpläne'
    
    def __str__(self):
        return f"{self.control_unit.name} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class ControlParameter(models.Model):
    """Konfigurationsparameter für Steuerungseinheiten"""
    
    PARAM_TYPE_CHOICES = [
        ('float', 'Dezimalzahl'),
        ('int', 'Ganzzahl'),
        ('bool', 'Boolean'),
        ('string', 'Text'),
        ('json', 'JSON'),
    ]
    
    control_unit = models.ForeignKey(ControlUnit, on_delete=models.CASCADE, related_name='parameters')
    key = models.CharField(max_length=50, help_text="Parameter-Schlüssel")
    value = models.TextField(help_text="Parameter-Wert")
    param_type = models.CharField(max_length=10, choices=PARAM_TYPE_CHOICES, default='string')
    
    # Validierung
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    
    # Metadaten
    unit = models.CharField(max_length=20, blank=True, null=True, help_text="Einheit (z.B. °C, %, lux)")
    description = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        unique_together = ['control_unit', 'key']
        ordering = ['control_unit', 'key']
        verbose_name = 'Parameter'
        verbose_name_plural = 'Parameter'
    
    def get_typed_value(self):
        """Gibt den Wert im korrekten Datentyp zurück"""
        if self.param_type == 'float':
            return float(self.value)
        elif self.param_type == 'int':
            return int(self.value)
        elif self.param_type == 'bool':
            return self.value.lower() in ['true', '1', 'yes']
        elif self.param_type == 'json':
            return json.loads(self.value)
        return self.value
    
    def __str__(self):
        return f"{self.control_unit.name} - {self.key}: {self.value}"


class ControlStatus(models.Model):
    """Aktueller Status und Messwerte einer Steuerungseinheit"""
    
    control_unit = models.OneToOneField(ControlUnit, on_delete=models.CASCADE, related_name='current_status')
    
    # Aktuelle Werte
    current_value = models.FloatField(null=True, blank=True, help_text="Aktueller Hauptwert")
    secondary_value = models.FloatField(null=True, blank=True, help_text="Aktueller Sekundärwert")
    
    # Status-Informationen
    is_online = models.BooleanField(default=False)
    last_update = models.DateTimeField(auto_now=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Zusätzliche Messwerte als JSON
    measurements = models.JSONField(default=dict, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Status'
        verbose_name_plural = 'Status'
    
    def __str__(self):
        return f"Status: {self.control_unit.name}"


class ControlCommand(models.Model):
    """Befehle, die an die SPS gesendet werden"""
    
    COMMAND_STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('sent', 'Gesendet'),
        ('confirmed', 'Bestätigt'),
        ('failed', 'Fehlgeschlagen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    control_unit = models.ForeignKey(ControlUnit, on_delete=models.CASCADE, related_name='commands')
    
    command_type = models.CharField(max_length=50)
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=COMMAND_STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Befehl'
        verbose_name_plural = 'Befehle'
    
    def __str__(self):
        return f"Command {self.command_type} for {self.control_unit.name}"