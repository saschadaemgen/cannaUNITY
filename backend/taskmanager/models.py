# backend/taskmanager/models.py

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from members.models import Member
from rooms.models import Room
import uuid

class TaskType(models.Model):
    """Definiert verschiedene Arten von Aufgaben"""
    DIFFICULTY_CHOICES = [
        ('leicht', 'Leicht'),
        ('mittel', 'Mittel'), 
        ('anspruchsvoll', 'Anspruchsvoll'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Aufgabenname")
    description = models.TextField(blank=True, verbose_name="Beschreibung")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='mittel')
    icon = models.CharField(max_length=100, blank=True, help_text="Icon-Klassenname für UI")
    color = models.CharField(max_length=7, default='#4CAF50', help_text="Hex-Farbcode für UI")
    max_slots_per_day = models.PositiveIntegerField(default=10, verbose_name="Max. Slots pro Tag")
    min_experience_level = models.PositiveIntegerField(default=0, verbose_name="Mindest-Erfahrungslevel")
    requires_training = models.BooleanField(default=False, verbose_name="Einweisung erforderlich")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_difficulty_display()})"
    
    class Meta:
        ordering = ['name']
        verbose_name = "Aufgabentyp"
        verbose_name_plural = "Aufgabentypen"

class TaskSchedule(models.Model):
    """Tägliche Aufgabenplanung - definiert welche Aufgaben an welchem Tag in welchem Raum stattfinden"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.ForeignKey(TaskType, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    date = models.DateField(verbose_name="Datum")
    start_time = models.TimeField(default='08:00', verbose_name="Startzeit")
    end_time = models.TimeField(default='17:00', verbose_name="Endzeit") 
    max_slots = models.PositiveIntegerField(verbose_name="Maximale Anzahl Slots")
    max_participants_per_slot = models.PositiveIntegerField(default=1, verbose_name="Max. Teilnehmer pro Slot")
    notes = models.TextField(blank=True, verbose_name="Hinweise")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='created_schedules')
    
    def __str__(self):
        return f"{self.task_type.name} - {self.date} in {self.room.name}"
    
    @property 
    def booked_slots_count(self):
        """Anzahl der gebuchten Slots für diesen Zeitplan"""
        from django.db.models import Count
        return self.time_slots.aggregate(
            booked=Count('bookings', filter=models.Q(bookings__status='confirmed'))
        )['booked'] or 0
    
    @property
    def available_slots_count(self):
        """Anzahl der verfügbaren Slots"""
        return self.max_slots - self.booked_slots_count
    
    @property
    def utilization_percentage(self):
        """Auslastung in Prozent"""
        if self.max_slots == 0:
            return 0
        return round((self.booked_slots_count / self.max_slots) * 100, 1)
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Startzeit muss vor Endzeit liegen")
    
    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['task_type', 'room', 'date']
        verbose_name = "Aufgabenplanung"
        verbose_name_plural = "Aufgabenplanungen"

class TimeSlot(models.Model):
    """Einzelne Zeitslots einer Aufgabenplanung"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(TaskSchedule, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.TimeField(verbose_name="Startzeit")
    end_time = models.TimeField(verbose_name="Endzeit")
    max_participants = models.PositiveIntegerField(default=1, verbose_name="Max. Teilnehmer")
    is_blocked = models.BooleanField(default=False, verbose_name="Gesperrt")
    block_reason = models.CharField(max_length=200, blank=True, verbose_name="Sperrgrund")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.schedule.task_type.name} - {self.start_time}-{self.end_time}"
    
    @property
    def current_bookings_count(self):
        """Aktuelle Anzahl bestätigter Buchungen"""
        return self.bookings.filter(status='confirmed').count()
    
    @property
    def is_fully_booked(self):
        """Prüft ob der Slot vollständig gebucht ist"""
        return self.current_bookings_count >= self.max_participants
    
    @property
    def available_spots(self):
        """Anzahl verfügbarer Plätze"""
        return self.max_participants - self.current_bookings_count
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Startzeit muss vor Endzeit liegen")
        
        # Prüfung ob Zeitslot innerhalb der Aufgabenplanung liegt
        if (self.start_time < self.schedule.start_time or 
            self.end_time > self.schedule.end_time):
            raise ValidationError("Zeitslot muss innerhalb der Aufgabenplanung liegen")
    
    class Meta:
        ordering = ['start_time']
        unique_together = ['schedule', 'start_time']
        verbose_name = "Zeitslot"
        verbose_name_plural = "Zeitslots"

class TaskBooking(models.Model):
    """Buchungen von Mitgliedern für bestimmte Zeitslots"""
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('confirmed', 'Bestätigt'),
        ('cancelled', 'Storniert'),
        ('completed', 'Abgeschlossen'),
        ('no_show', 'Nicht erschienen'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='bookings')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='task_bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    booked_at = models.DateTimeField(auto_now_add=True, verbose_name="Gebucht am")
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name="Storniert am")
    cancellation_reason = models.TextField(blank=True, verbose_name="Stornierungsgrund")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Abgeschlossen am")
    notes = models.TextField(blank=True, verbose_name="Notizen")
    rating = models.PositiveIntegerField(null=True, blank=True, verbose_name="Bewertung (1-5)")
    
    # Anwesenheit und Leistung
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name="Ankunftszeit")
    check_out_time = models.DateTimeField(null=True, blank=True, verbose_name="Abgangszeit") 
    work_quality_rating = models.PositiveIntegerField(null=True, blank=True, verbose_name="Arbeitsqualität (1-5)")
    supervisor_notes = models.TextField(blank=True, verbose_name="Anmerkungen Betreuer")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.member} - {self.time_slot} ({self.get_status_display()})"
    
    def cancel(self, reason=""):
        """Storniert die Buchung"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.cancellation_reason = reason
        self.save()
    
    def complete(self, rating=None, notes=""):
        """Markiert die Buchung als abgeschlossen"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if rating:
            self.rating = rating
        if notes:
            self.notes = notes
        self.save()
    
    @property
    def duration_worked(self):
        """Berechnet die tatsächlich gearbeitete Zeit"""
        if self.check_in_time and self.check_out_time:
            return self.check_out_time - self.check_in_time
        return None
    
    @property
    def is_past_due(self):
        """Prüft ob der Termin bereits verstrichen ist"""
        from datetime import datetime, time
        slot_datetime = datetime.combine(
            self.time_slot.schedule.date, 
            self.time_slot.end_time
        )
        return timezone.now() > timezone.make_aware(slot_datetime)
    
    def clean(self):
        # Prüfung auf Doppelbuchung
        existing = TaskBooking.objects.filter(
            time_slot=self.time_slot,
            member=self.member,
            status__in=['pending', 'confirmed']
        ).exclude(pk=self.pk)
        
        if existing.exists():
            raise ValidationError("Mitglied hat bereits eine aktive Buchung für diesen Zeitslot")
        
        # Prüfung ob Slot noch verfügbar
        if (self.time_slot.is_fully_booked and 
            self.status in ['pending', 'confirmed'] and 
            not self.pk):
            raise ValidationError("Zeitslot ist bereits vollständig gebucht")
    
    class Meta:
        ordering = ['-booked_at']
        unique_together = ['time_slot', 'member']
        verbose_name = "Aufgabenbuchung"
        verbose_name_plural = "Aufgabenbuchungen"

class TaskExperience(models.Model):
    """Erfahrungspunkte der Mitglieder für verschiedene Aufgabentypen"""
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='task_experiences')
    task_type = models.ForeignKey(TaskType, on_delete=models.CASCADE)
    experience_points = models.PositiveIntegerField(default=0, verbose_name="Erfahrungspunkte")
    completed_tasks = models.PositiveIntegerField(default=0, verbose_name="Abgeschlossene Aufgaben")
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name="Durchschnittsbewertung")
    last_completed = models.DateTimeField(null=True, blank=True, verbose_name="Zuletzt abgeschlossen")
    is_certified = models.BooleanField(default=False, verbose_name="Zertifiziert")
    certification_date = models.DateTimeField(null=True, blank=True, verbose_name="Zertifizierungsdatum")
    
    def __str__(self):
        return f"{self.member} - {self.task_type.name} (Level {self.level})"
    
    @property
    def level(self):
        """Berechnet das Level basierend auf Erfahrungspunkten"""
        if self.experience_points < 10:
            return 1
        elif self.experience_points < 25:
            return 2
        elif self.experience_points < 50:
            return 3
        elif self.experience_points < 100:
            return 4
        else:
            return 5
    
    @property
    def level_name(self):
        """Gibt den Level-Namen zurück"""
        levels = {
            1: "Anfänger",
            2: "Fortgeschritten", 
            3: "Erfahren",
            4: "Experte",
            5: "Meister"
        }
        return levels.get(self.level, "Unbekannt")
    
    def add_experience(self, points, rating=None):
        """Fügt Erfahrungspunkte hinzu"""
        self.experience_points += points
        self.completed_tasks += 1
        self.last_completed = timezone.now()
        
        if rating:
            # Durchschnittsbewertung aktualisieren
            total_rating = (self.average_rating * (self.completed_tasks - 1)) + rating
            self.average_rating = total_rating / self.completed_tasks
        
        self.save()
    
    class Meta:
        unique_together = ['member', 'task_type']
        ordering = ['-experience_points']
        verbose_name = "Aufgabenerfahrung"
        verbose_name_plural = "Aufgabenerfahrungen"