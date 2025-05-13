# controller/models.py (Modifikation der Import- und Modellreferenzen)
import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

from members.models import Member  # Ihr Member-Modell
from rooms.models import Room      # Ihr Room-Modell

class BaseController(models.Model):
    """Basismodell für alle Controller-Typen mit gemeinsamen Eigenschaften"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Controller-Name")
    description = models.TextField(blank=True, null=True, verbose_name="Beschreibung")
    is_active = models.BooleanField(default=True, verbose_name="Aktiv")
    is_connected = models.BooleanField(default=False, verbose_name="Verbunden")
    mqtt_topic_prefix = models.CharField(
        max_length=100, 
        verbose_name="MQTT Topic-Präfix",
        help_text="Präfix für MQTT-Kommunikation, z.B. controller/irrigation/1",
        blank=True
    )
    room = models.ForeignKey(
        Room, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name="%(class)s_controllers",
        verbose_name="Raum"
    )
    created_by = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="%(class)s_created",
        verbose_name="Erstellt von"
    )
    last_modified_by = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="%(class)s_modified",
        verbose_name="Zuletzt bearbeitet von"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Erstellt am")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Aktualisiert am")
    last_communication = models.DateTimeField(null=True, blank=True, verbose_name="Letzte Kommunikation")
    
    class Meta:
        abstract = True
        verbose_name = "Controller"
        verbose_name_plural = "Controller"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_controller_type()})"
    
    def get_controller_type(self):
        """Gibt den Controller-Typ zurück (überschreiben in Unterklassen)"""
        return "Basis"
    
    def save(self, *args, **kwargs):
        # Wenn kein MQTT-Präfix angegeben ist, generiere einen Standard-Präfix
        if not self.mqtt_topic_prefix:
            controller_type = self.__class__.__name__.lower()
            self.mqtt_topic_prefix = f"controller/{controller_type}/{self.id}"
        super().save(*args, **kwargs)
    
    def get_status(self):
        """Ermittelt den aktuellen Status des Controllers (überschreiben in Unterklassen)"""
        return {
            "is_active": self.is_active,
            "is_connected": self.is_connected,
            "last_communication": self.last_communication
        }


class IrrigationController(BaseController):
    """Modell für Bewässerungssteuerungen"""
    PUMP_TYPE_CHOICES = [
        ('drip', 'Tropfbewässerung'),
        ('sprinkler', 'Sprinkler'),
        ('flood', 'Flut'),
        ('mist', 'Vernebelung'),
        ('custom', 'Benutzerdefiniert')
    ]
    
    pump_type = models.CharField(
        max_length=20,
        choices=PUMP_TYPE_CHOICES,
        default='drip',
        verbose_name="Pumpentyp"
    )
    water_source = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Wasserquelle",
        help_text="z.B. Tank 1, Hauptwasserleitung, etc."
    )
    flow_rate = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0.01)],
        verbose_name="Durchflussrate (l/min)"
    )
    max_volume_per_day = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True, 
        null=True,
        validators=[MinValueValidator(0.01)],
        verbose_name="Max. Volumen pro Tag (l)",
        help_text="Maximale Wassermenge pro Tag (0 für unbegrenzt)"
    )
    total_volume_used = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        verbose_name="Gesamtverbrauch (l)"
    )
    schedule_type = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Täglich'),
            ('weekly', 'Wöchentlich'),
            ('phase', 'Phasenbasiert'),
            ('sensor', 'Sensorgesteuert')
        ],
        default='daily',
        verbose_name="Zeitplantyp"
    )
    sensor_feedback_enabled = models.BooleanField(
        default=False,
        verbose_name="Sensorrückmeldung aktiviert",
        help_text="Steuert die Bewässerung basierend auf Bodenfeuchtesensoren"
    )
    emergency_stop = models.BooleanField(
        default=False,
        verbose_name="Notfall-Stopp",
        help_text="Sofortiger Stopp aller Bewässerungsaktivitäten"
    )
    
    class Meta:
        verbose_name = "Bewässerungssteuerung"
        verbose_name_plural = "Bewässerungssteuerungen"
    
    def get_controller_type(self):
        return "Bewässerung"
    
    def get_status(self):
        status = super().get_status()
        status.update({
            "pump_type": self.get_pump_type_display(),
            "flow_rate": self.flow_rate,
            "emergency_stop": self.emergency_stop,
            "current_schedule": self.get_current_schedule(),
            "today_volume": self.get_today_volume()
        })
        return status
    
    def get_current_schedule(self):
        """Ermittelt den aktuellen/nächsten Zeitplan"""
        now = timezone.now()
        current_day = now.weekday()  # 0-6 (Montag bis Sonntag)
        next_schedule = None 
        
        # Abhängig vom Schedule-Typ unterschiedliche Abfragen
        if self.schedule_type == 'daily':
            # Finde den nächsten Zeitplan für heute
            next_schedule = IrrigationSchedule.objects.filter(
                controller=self,
                day_of_week=None,  # Tägliche Pläne haben keinen spezifischen Wochentag
                start_time__gt=now.time()
            ).order_by('start_time').first()
            
            if not next_schedule:
                # Wenn kein weiterer Plan für heute, dann den ersten für morgen
                next_schedule = IrrigationSchedule.objects.filter(
                    controller=self,
                    day_of_week=None
                ).order_by('start_time').first()
                
        elif self.schedule_type == 'weekly':
            # Finde den nächsten Zeitplan für heute
            next_schedule = IrrigationSchedule.objects.filter(
                controller=self,
                day_of_week=current_day,
                start_time__gt=now.time()
            ).order_by('start_time').first()
            
            if not next_schedule:
                # Wenn kein weiterer Plan für heute, dann den ersten für den nächsten Tag
                for i in range(1, 8):  # Überprüfe die nächsten 7 Tage
                    next_day = (current_day + i) % 7
                    next_schedule = IrrigationSchedule.objects.filter(
                        controller=self,
                        day_of_week=next_day
                    ).order_by('start_time').first()
                    
                    if next_schedule:
                        break
        
        # Weitere Logik für andere Plantypen...
        
        if next_schedule:
            return {
                "id": next_schedule.id,
                "day": next_schedule.get_day_of_week_display() if next_schedule.day_of_week is not None else "Täglich",
                "start_time": next_schedule.start_time.strftime("%H:%M") if next_schedule.start_time else None,
                "duration": next_schedule.duration,
                "volume": next_schedule.volume
            }
        
        return None
    
    def get_today_volume(self):
        """Berechnet das heute verbrauchte Wasservolumen"""
        today = timezone.now().date()
        logs = ControllerLog.objects.filter(
            controller_type="irrigation",
            controller_id=self.id,
            timestamp__date=today,
            action_type="irrigation_cycle"
        )
        
        total_volume = 0
        for log in logs:
            # Extrahiere das Volumen aus dem Log (vereinfacht)
            if log.value and "volume" in log.value:
                try:
                    total_volume += float(log.value["volume"])
                except (ValueError, TypeError):
                    pass
        
        return total_volume


class IrrigationSchedule(models.Model):
    """Zeitpläne für Bewässerungssteuerungen"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    controller = models.ForeignKey(
        IrrigationController, 
        on_delete=models.CASCADE,
        related_name="schedules",
        verbose_name="Bewässerungssteuerung"
    )
    day_of_week = models.IntegerField(
        null=True, 
        blank=True,
        choices=[
            (0, 'Montag'),
            (1, 'Dienstag'),
            (2, 'Mittwoch'),
            (3, 'Donnerstag'),
            (4, 'Freitag'),
            (5, 'Samstag'),
            (6, 'Sonntag')
        ],
        verbose_name="Wochentag",
        help_text="Leer lassen für tägliche Wiederholung"
    )
    phase_day = models.IntegerField(
        null=True, 
        blank=True,
        verbose_name="Phasentag",
        help_text="Tag in der Wachstumsphase (nur für phasenbasierte Pläne)"
    )
    start_time = models.TimeField(
        verbose_name="Startzeit",
        help_text="Uhrzeit für den Beginn der Bewässerung"
    )
    duration = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        verbose_name="Dauer (Minuten)",
        help_text="Dauer der Bewässerung in Minuten"
    )
    volume = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        blank=True, 
        null=True,
        validators=[MinValueValidator(0.01)],
        verbose_name="Volumen (l)",
        help_text="Zu verabreichende Wassermenge (wenn leer, wird aus Durchflussrate und Dauer berechnet)"
    )
    intensity = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Intensität (%)",
        help_text="Prozentsatz der maximal möglichen Durchflussrate"
    )
    repeated_cycles = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="Wiederholte Zyklen",
        help_text="Anzahl der Zyklen mit Pausen dazwischen"
    )
    cycle_pause = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        verbose_name="Pause zwischen Zyklen (Minuten)",
        help_text="Pausendauer zwischen wiederholten Zyklen"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Aktiv"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Bewässerungszeitplan"
        verbose_name_plural = "Bewässerungszeitpläne"
        ordering = ['day_of_week', 'start_time']
        
    def __str__(self):
        day = self.get_day_of_week_display() if self.day_of_week is not None else "Täglich"
        return f"{self.controller.name} - {day} {self.start_time.strftime('%H:%M')}"
    
    def save(self, *args, **kwargs):
        # Berechne das Volumen, wenn nicht angegeben
        if not self.volume and self.controller:
            # Volumen = Flussrate (l/min) * Dauer (min) * Intensität (%)
            self.volume = float(self.controller.flow_rate) * self.duration * (self.intensity / 100)
        
        super().save(*args, **kwargs)


class LightController(BaseController):
    """Modell für Lichtsteuerungen"""
    LIGHT_TYPE_CHOICES = [
        ('led', 'LED'),
        ('hps', 'HPS (Natriumdampf)'),
        ('mh', 'MH (Metallhalogen)'),
        ('cfl', 'CFL (Energiesparlampe)'),
        ('mixed', 'Gemischt'),
        ('custom', 'Benutzerdefiniert')
    ]
    
    CYCLE_TYPE_CHOICES = [
        ('auto', 'Automatisch'),
        ('veg', 'Vegetativ (18/6)'),
        ('flower', 'Blüte (12/12)'),
        ('seedling', 'Sämling (20/4)'),
        ('clone', 'Klon (24/0)'),
        ('custom', 'Benutzerdefiniert')
    ]
    
    light_type = models.CharField(
        max_length=20,
        choices=LIGHT_TYPE_CHOICES,
        default='led',
        verbose_name="Lichttyp"
    )
    max_power = models.IntegerField(
        default=600,
        validators=[MinValueValidator(1)],
        verbose_name="Maximale Leistung (W)"
    )
    spectrum_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Spektrumtyp",
        help_text="z.B. Vollspektrum, Blüte, Vegetativ, etc."
    )
    supports_dimming = models.BooleanField(
        default=True,
        verbose_name="Dimmen unterstützt"
    )
    supports_spectrum_control = models.BooleanField(
        default=False,
        verbose_name="Spektrumkontrolle unterstützt"
    )
    cycle_type = models.CharField(
        max_length=20,
        choices=CYCLE_TYPE_CHOICES,
        default='veg',
        verbose_name="Zyklustyp"
    )
    current_day_in_cycle = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Aktueller Tag im Zyklus"
    )
    cycle_start_date = models.DateField(
        default=timezone.now,
        verbose_name="Zyklusstartdatum"
    )
    auto_increment_day = models.BooleanField(
        default=True,
        verbose_name="Tag automatisch erhöhen",
        help_text="Erhöht den Tag im Zyklus automatisch um Mitternacht"
    )
    emergency_off = models.BooleanField(
        default=False,
        verbose_name="Notfall-Aus",
        help_text="Sofortiges Ausschalten aller Lichter"
    )
    energy_consumption = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Energieverbrauch (kWh)"
    )
    
    class Meta:
        verbose_name = "Lichtsteuerung"
        verbose_name_plural = "Lichtsteuerungen"
    
    def get_controller_type(self):
        return "Licht"
    
    def get_status(self):
        status = super().get_status()
        
        # Aktuellen Lichtstatus ermitteln
        current_light_state = self.get_current_light_state()
        
        status.update({
            "light_type": self.get_light_type_display(),
            "cycle_type": self.get_cycle_type_display(),
            "current_day": self.current_day_in_cycle,
            "emergency_off": self.emergency_off,
            "current_light_state": current_light_state
        })
        return status
    
    def get_current_light_state(self):
        """Ermittelt den aktuellen Lichtstatus basierend auf Zeitplänen"""
        now = timezone.now()
        current_time = now.time()
        
        # Finde den aktuell gültigen Zeitpunkt
        light_points = LightSchedulePoint.objects.filter(
            schedule__controller=self,
            schedule__day_in_cycle=self.current_day_in_cycle,
            time_point__lte=current_time
        ).order_by('-time_point')
        
        if not light_points.exists():
            # Wenn kein Zeitpunkt für heute gefunden wurde, verwende den letzten von gestern
            yesterday_day = self.current_day_in_cycle - 1 if self.current_day_in_cycle > 1 else 1
            light_points = LightSchedulePoint.objects.filter(
                schedule__controller=self,
                schedule__day_in_cycle=yesterday_day
            ).order_by('-time_point')
        
        if light_points.exists():
            current_point = light_points.first()
            return {
                "is_on": current_point.intensity > 0,
                "intensity": current_point.intensity,
                "spectrum_red": current_point.spectrum_red,
                "spectrum_blue": current_point.spectrum_blue,
                "time_point": current_point.time_point.strftime("%H:%M")
            }
        
        # Fallback-Wert
        return {
            "is_on": False,
            "intensity": 0,
            "spectrum_red": 0,
            "spectrum_blue": 0,
            "time_point": None
        }
    
    def advance_cycle_day(self):
        """Erhöht den aktuellen Tag im Zyklus um 1"""
        self.current_day_in_cycle += 1
        self.save(update_fields=['current_day_in_cycle'])
        
        # Erstelle einen Log-Eintrag
        ControllerLog.objects.create(
            controller_type="light",
            controller_id=self.id,
            action_type="cycle_day_advanced",
            value={"new_day": self.current_day_in_cycle}
        )
        
        return self.current_day_in_cycle
    
    def calculate_daily_energy_consumption(self):
        """Berechnet den täglichen Energieverbrauch basierend auf Zeitplänen"""
        # Hole alle Zeitplanpunkte für den aktuellen Zyklustag
        schedule_points = LightSchedulePoint.objects.filter(
            schedule__controller=self,
            schedule__day_in_cycle=self.current_day_in_cycle
        ).order_by('time_point')
        
        # Wenn keine Punkte definiert sind, gib 0 zurück
        if not schedule_points.exists():
            return 0
        
        # Berechne die kWh basierend auf Intensität und Dauer
        total_kwh = 0
        prev_point = None
        
        for point in schedule_points:
            if prev_point:
                # Berechne die Zeitdifferenz in Stunden
                t1 = prev_point.time_point
                t2 = point.time_point
                hours = (t2.hour - t1.hour) + (t2.minute - t1.minute) / 60
                
                # Durchschnittliche Intensität für diesen Zeitraum
                avg_intensity = (prev_point.intensity + point.intensity) / 2 / 100
                
                # Energieverbrauch = Leistung (W) * Zeit (h) * Intensität / 1000 (für kWh)
                energy = self.max_power * hours * avg_intensity / 1000
                total_kwh += energy
            
            prev_point = point
        
        # Behandle den letzten Punkt bis Mitternacht
        if prev_point:
            # Zeit bis Mitternacht
            last_point_time = prev_point.time_point
            hours_to_midnight = 24 - last_point_time.hour - last_point_time.minute / 60
            
            # Energieverbrauch bis Mitternacht
            energy = self.max_power * hours_to_midnight * (prev_point.intensity / 100) / 1000
            total_kwh += energy
        
        return total_kwh


class LightSchedule(models.Model):
    """Modell für Lichtzyklen"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    controller = models.ForeignKey(
        LightController, 
        on_delete=models.CASCADE,
        related_name="schedules",
        verbose_name="Lichtsteuerung"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Zyklusname"
    )
    day_in_cycle = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Tag im Zyklus"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Aktiv"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Lichtzeitplan"
        verbose_name_plural = "Lichtzeitpläne"
        ordering = ['day_in_cycle']
        unique_together = ['controller', 'day_in_cycle']
        
    def __str__(self):
        return f"{self.controller.name} - Tag {self.day_in_cycle} - {self.name}"


class LightSchedulePoint(models.Model):
    """Modell für Zeitpunkte innerhalb eines Lichtzyklus"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(
        LightSchedule, 
        on_delete=models.CASCADE,
        related_name="points",
        verbose_name="Lichtzeitplan"
    )
    time_point = models.TimeField(
        verbose_name="Zeitpunkt",
        help_text="Uhrzeit für die Lichteinstellung"
    )
    intensity = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Intensität (%)",
        help_text="Prozentsatz der maximalen Helligkeit (0 = aus)"
    )
    spectrum_red = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Rot-Spektrum (%)",
        help_text="Intensität des roten Spektrumbereichs"
    )
    spectrum_blue = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Blau-Spektrum (%)",
        help_text="Intensität des blauen Spektrumbereichs"
    )
    transition_duration = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(120)],
        verbose_name="Übergangszeit (Minuten)",
        help_text="Dauer des sanften Übergangs (0 = sofort)"
    )
    
    class Meta:
        verbose_name = "Lichtzeitpunkt"
        verbose_name_plural = "Lichtzeitpunkte"
        ordering = ['time_point']
        
    def __str__(self):
        return f"{self.schedule} - {self.time_point.strftime('%H:%M')} - {self.intensity}%"


class ControllerLog(models.Model):
    """Protokoll für Controller-Aktivitäten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    controller_type = models.CharField(
        max_length=50,
        verbose_name="Controller-Typ"
    )
    controller_id = models.UUIDField(
        verbose_name="Controller-ID"
    )
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name="Zeitstempel"
    )
    action_type = models.CharField(
        max_length=100,
        verbose_name="Aktionstyp",
        help_text="z.B. irrigation_start, light_change, error, etc."
    )
    value = models.JSONField(
        null=True, 
        blank=True,
        verbose_name="Wert",
        help_text="JSON-Daten für den Aktionswert"
    )
    mqtt_command = models.TextField(
        null=True, 
        blank=True,
        verbose_name="MQTT-Befehl",
        help_text="Gesendeter MQTT-Befehl (falls vorhanden)"
    )
    success_status = models.BooleanField(
        default=True,
        verbose_name="Erfolgsstatus"
    )
    error_message = models.TextField(
        null=True, 
        blank=True,
        verbose_name="Fehlermeldung"
    )
    
    class Meta:
        verbose_name = "Controller-Log"
        verbose_name_plural = "Controller-Logs"
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.controller_type} - {self.action_type} - {self.timestamp.strftime('%d.%m.%Y %H:%M:%S')}"


class ResourceUsage(models.Model):
    """Ressourcenverbrauch für Controller"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    controller_type = models.CharField(
        max_length=50,
        verbose_name="Controller-Typ"
    )
    controller_id = models.UUIDField(
        verbose_name="Controller-ID"
    )
    resource_type = models.CharField(
        max_length=50,
        choices=[
            ('water', 'Wasser'),
            ('electricity', 'Strom'),
            ('nutrient', 'Nährstoffe'),
            ('co2', 'CO₂'),
            ('other', 'Sonstiges')
        ],
        verbose_name="Ressourcentyp"
    )
    date = models.DateField(
        verbose_name="Datum"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Menge"
    )
    unit = models.CharField(
        max_length=20,
        verbose_name="Einheit",
        help_text="z.B. l, kWh, kg, etc."
    )
    cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Kosten (€)"
    )
    
    class Meta:
        verbose_name = "Ressourcenverbrauch"
        verbose_name_plural = "Ressourcenverbräuche"
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.get_resource_type_display()} - {self.amount} {self.unit} - {self.date.strftime('%d.%m.%Y')}"