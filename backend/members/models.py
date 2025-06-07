# members/models.py
from django.db import models
import uuid
from datetime import date

class Member(models.Model):
    # Status-Optionen für Mitglieder
    STATUS_CHOICES = [
        ('active', 'Aktiv'),
        ('locked', 'Gesperrt'),
        ('reminder1', '1. Mahnung'),
        ('reminder2', '2. Mahnung'),
    ]
    
    # Anrede-Optionen
    GENDER_CHOICES = [
        ('male', 'Herr'),
        ('female', 'Frau'),
        ('diverse', 'Divers'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male', verbose_name="Anrede")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True)
    phone = models.CharField(max_length=20, blank=True, verbose_name="Telefonnummer")
    birthdate = models.DateField(null=True, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    city = models.CharField(max_length=100, blank=True)
    street = models.CharField(max_length=100, blank=True)
    house_number = models.CharField(max_length=10, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Beschäftigungsinformationen
    is_marginally_employed = models.BooleanField(default=False, verbose_name="Geringfügig beschäftigt")
    working_hours_per_month = models.PositiveSmallIntegerField(default=0, verbose_name="Arbeitsstunden pro Monat")
    max_working_hours = models.PositiveSmallIntegerField(default=40, verbose_name="Maximale Arbeitsstunden")
    hourly_wage = models.DecimalField(max_digits=6, decimal_places=2, default=12.00, verbose_name="Stundenlohn (€)")
    
    duty_hours = models.PositiveSmallIntegerField(default=0, verbose_name="Geleistete Pflichtstunden")
    kontostand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    beitrag = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Monatlicher Beitrag in Euro")
    physical_limitations = models.TextField(blank=True)
    mental_limitations = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    warnings = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        gender_display = dict(self.GENDER_CHOICES).get(self.gender, '')
        return f"{gender_display} {self.first_name} {self.last_name}"
        
    @property
    def formatted_birthdate(self):
        """Gibt das Geburtsdatum im deutschen Format zurück"""
        if self.birthdate:
            return self.birthdate.strftime('%d.%m.%Y')
        return None
        
    @property
    def age(self):
        """Berechnet das Alter des Mitglieds"""
        if not self.birthdate:
            return None
            
        today = date.today()
        return today.year - self.birthdate.year - (
            (today.month, today.day) < (self.birthdate.month, self.birthdate.day)
        )
        
    @property
    def age_class(self):
        """Bestimmt die Altersklasse basierend auf dem Geburtsdatum"""
        if not self.age:
            return "21+"
            
        if self.age < 21:
            return "18+"
        return "21+"