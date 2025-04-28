# backend/rooms/models.py

from django.db import models

class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('bluetekammer', 'Blütekammer'),
        ('produktausgabe', 'Produktausgabe'),
        ('trocknungsraum', 'Trocknungsraum'),
        ('labor', 'Labor'),
        ('mutterraum', 'Mutterraum'),
        ('anzuchtraum', 'Anzuchtraum'),
        ('verarbeitung', 'Verarbeitung'),
        ('other', 'Sonstiges'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    capacity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='other')
    pflanzenanzahl = models.IntegerField(default=0, help_text="Anzahl der Pflanzen im Raum")
    
    # Neue Felder für die räumliche Darstellung
    length = models.IntegerField(default=500, help_text="Länge in cm")
    width = models.IntegerField(default=500, help_text="Breite in cm")
    height = models.IntegerField(default=250, help_text="Höhe in cm")
    grid_size = models.IntegerField(default=10, help_text="Rastergröße in cm")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    @property
    def volume(self):
        """Berechnet das Raumvolumen in Kubikmetern"""
        return (self.length * self.width * self.height) / 1000000
    
    class Meta:
        ordering = ['name']  # Sortierung alphabetisch nach Namen

class RoomItemType(models.Model):
    """Typen von Elementen, die in einem Raum platziert werden können"""
    CATEGORY_CHOICES = [
        ('furniture', 'Möbel'),
        ('lighting', 'Beleuchtung'),
        ('sensor', 'Sensorik'),
        ('access', 'Zugang'),
        ('other', 'Sonstiges'),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=100, help_text="Icon-Klassenname oder URL")
    default_width = models.IntegerField(default=100, help_text="Standardbreite in cm")
    default_height = models.IntegerField(default=100, help_text="Standardhöhe in cm")
    allowed_quantities = models.JSONField(default=list, blank=True, null=True, 
                                         help_text="Liste erlaubter Pflanzenmengen, z.B. [9,16,25]")
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
    
    class Meta:
        ordering = ['name']

class RoomItem(models.Model):
    """Konkrete Elemente, die in einem Raum platziert sind"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='items')
    item_type = models.ForeignKey(RoomItemType, on_delete=models.PROTECT)
    x_position = models.IntegerField(help_text="X-Position im Raumraster")
    y_position = models.IntegerField(help_text="Y-Position im Raumraster")
    width = models.IntegerField(help_text="Breite in Rastereinheiten")
    height = models.IntegerField(help_text="Höhe in Rastereinheiten")
    rotation = models.IntegerField(default=0, help_text="Rotation in Grad")
    
    # Felder für Tische mit Pflanzen
    plant_quantity = models.IntegerField(default=0, help_text="Anzahl der Pflanzen auf diesem Element")
    plant_arrangement = models.CharField(max_length=10, blank=True, null=True, help_text="z.B. '3x3', '4x4'")
    
    # Weitere Metadaten
    properties = models.JSONField(default=dict, blank=True, null=True, 
                                help_text="Weitere Eigenschaften des Elements als JSON")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item_type.name} in {self.room.name} at ({self.x_position}, {self.y_position})"

class Sensor(models.Model):
    """Sensoren, die mit Raum-Elementen verbunden sind"""
    SENSOR_TYPE_CHOICES = [
        ('temperature', 'Temperatur'),
        ('humidity', 'Luftfeuchtigkeit'),
        ('co2', 'CO2'),
        ('ph', 'pH-Wert'),
        ('ec', 'EC-Wert'),
        ('light', 'Lichtstärke'),
        ('dust', 'Staubwerte'),
        ('other', 'Sonstiges'),
    ]
    
    room_item = models.ForeignKey(RoomItem, on_delete=models.CASCADE, related_name='sensors')
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPE_CHOICES)
    data_source = models.CharField(max_length=255, blank=True, null=True, 
                                  help_text="API-Endpunkt oder Gerätedaten")
    last_reading = models.JSONField(default=dict, blank=True, null=True)
    last_updated = models.DateTimeField(blank=True, null=True)
    
    # Weitere Metadaten
    properties = models.JSONField(default=dict, blank=True, null=True)
    
    def __str__(self):
        return f"{self.get_sensor_type_display()} an {self.room_item}"