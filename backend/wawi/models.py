# wawi/models.py
import uuid, os
from django.db import models
from django.utils import timezone
from django.core.files.storage import default_storage
from django.db.models import JSONField  # Import für Django 3.1+
# Alternative für PostgreSQL:
# from django.contrib.postgres.fields import JSONField
from members.models import Member

class CannabisStrain(models.Model):
    # Primärschlüssel
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basis-Informationen
    name = models.CharField(max_length=100, verbose_name="Sortenname")
    breeder = models.CharField(max_length=100, verbose_name="Hersteller/Züchter")
    batch_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Genetik-Informationen
    STRAIN_TYPE_CHOICES = [
        ('feminized', 'Feminisiert'),
        ('regular', 'Regulär'),
        ('autoflower', 'Autoflower'),
        ('f1_hybrid', 'F1 Hybrid'),
        ('cbd', 'CBD-Samen'),
    ]
    strain_type = models.CharField(
        max_length=20, 
        choices=STRAIN_TYPE_CHOICES, 
        default='feminized',
        verbose_name="Samentyp"
    )
    
    # Genetische Anteile
    indica_percentage = models.IntegerField(
        default=50, 
        verbose_name="Indica-Anteil (%)",
        help_text="Prozentualer Indica-Anteil (0-100)"
    )
    
    # Der Sativa-Anteil wird automatisch berechnet (100 - indica_percentage)
    @property
    def sativa_percentage(self):
        return 100 - self.indica_percentage
        
    # Herkunft/Ursprung der Genetik
    genetic_origin = models.CharField(
        max_length=200, blank=True, null=True,
        verbose_name="Genetische Herkunft"
    )
    
    # Wachstums-Eigenschaften
    flowering_time_min = models.IntegerField(
        default=50,
        verbose_name="Blütezeit Minimum (Tage)"
    )
    flowering_time_max = models.IntegerField(
        default=65,
        verbose_name="Blütezeit Maximum (Tage)"
    )
    
    height_indoor_min = models.IntegerField(
        default=80,
        verbose_name="Höhe Indoor Minimum (cm)"
    )
    height_indoor_max = models.IntegerField(
        default=120,
        verbose_name="Höhe Indoor Maximum (cm)"
    )
    
    height_outdoor_min = models.IntegerField(
        default=120,
        verbose_name="Höhe Outdoor Minimum (cm)",
        blank=True, null=True
    )
    height_outdoor_max = models.IntegerField(
        default=180,
        verbose_name="Höhe Outdoor Maximum (cm)",
        blank=True, null=True
    )
    
    yield_indoor_min = models.IntegerField(
        default=400,
        verbose_name="Ertrag Indoor Minimum (g/m²)",
        blank=True, null=True
    )
    yield_indoor_max = models.IntegerField(
        default=500,
        verbose_name="Ertrag Indoor Maximum (g/m²)",
        blank=True, null=True
    )
    
    yield_outdoor_min = models.IntegerField(
        default=500,
        verbose_name="Ertrag Outdoor Minimum (g/Pflanze)",
        blank=True, null=True
    )
    yield_outdoor_max = models.IntegerField(
        default=700,
        verbose_name="Ertrag Outdoor Maximum (g/Pflanze)",
        blank=True, null=True
    )
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Anfänger'),
        ('intermediate', 'Mittel'),
        ('advanced', 'Fortgeschritten'),
        ('expert', 'Experte'),
    ]
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='intermediate',
        verbose_name="Schwierigkeitsgrad"
    )
    
    # Chemische Eigenschaften
    thc_percentage_min = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=15.0,
        verbose_name="THC-Gehalt Minimum (%)"
    )
    thc_percentage_max = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=20.0,
        verbose_name="THC-Gehalt Maximum (%)"
    )
    
    cbd_percentage_min = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0.1,
        verbose_name="CBD-Gehalt Minimum (%)"
    )
    cbd_percentage_max = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="CBD-Gehalt Maximum (%)"
    )
    
    # Dominant-Terpene als mehrfache Auswahl
    TERPENE_CHOICES = [
        ('myrcene', 'Myrcen'),
        ('limonene', 'Limonen'),
        ('caryophyllene', 'Caryophyllen'),
        ('pinene', 'Pinen'),
        ('linalool', 'Linalool'),
        ('humulene', 'Humulen'),
        ('terpinolene', 'Terpinolen'),
        ('ocimene', 'Ocimen'),
    ]
    
    # Textfeld für die Terpene (als kommaseparierte Liste)
    dominant_terpenes = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="Dominante Terpene"
    )
    
    # Sensorische Eigenschaften
    FLAVOR_CHOICES = [
        ('sweet', 'Süß'),
        ('sour', 'Sauer'),
        ('spicy', 'Würzig'),
        ('earthy', 'Erdig'),
        ('woody', 'Holzig'),
        ('pine', 'Kiefer'),
        ('citrus', 'Zitrus'),
        ('berry', 'Beeren'),
        ('grape', 'Trauben'),
        ('tropical', 'Tropisch'),
        ('diesel', 'Diesel'),
        ('cheese', 'Käse'),
        ('coffee', 'Kaffee'),
        ('mint', 'Minze'),
        ('ammonia', 'Ammoniak'),
        ('skunk', 'Skunk'),
        ('floral', 'Blumig'),
    ]
    
    # Textfeld für die Geschmacksrichtungen (als kommaseparierte Liste)
    flavors = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="Geschmacksrichtungen"
    )
    
    EFFECT_CHOICES = [
        ('relaxed', 'Entspannend'),
        ('uplifting', 'Aufmunternd'),
        ('creative', 'Kreativ'),
        ('energetic', 'Energetisch'),
        ('focused', 'Fokussiert'),
        ('sleepy', 'Schläfrig'),
        ('euphoric', 'Euphorisch'),
        ('happy', 'Glücklich'),
        ('hungry', 'Hungrig'),
        ('talkative', 'Gesprächig'),
    ]
    
    # Textfeld für die Effekte (als kommaseparierte Liste)
    effects = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="Effekte/Wirkungen"
    )
    
    # Ausführliche Beschreibungen
    general_information = models.TextField(
        blank=True, null=True,
        verbose_name="Allgemeine Informationen"
    )
    
    growing_information = models.TextField(
        blank=True, null=True,
        verbose_name="Anbauspezifische Informationen"
    )
    
    # Erweiterte Informationen
    CLIMATE_CHOICES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('greenhouse', 'Gewächshaus'),
        ('all', 'Alle'),
    ]
    
    suitable_climate = models.CharField(
        max_length=20,
        choices=CLIMATE_CHOICES,
        default='all',
        verbose_name="Geeignetes Klima"
    )
    
    GROWING_METHOD_CHOICES = [
        ('soil', 'Erde'),
        ('hydro', 'Hydrokultur'),
        ('coco', 'Kokos'),
        ('all', 'Alle'),
    ]
    
    growing_method = models.CharField(
        max_length=20,
        choices=GROWING_METHOD_CHOICES,
        default='all',
        verbose_name="Anbaumethode"
    )
    
    resistance_mold = models.IntegerField(
        default=3,
        verbose_name="Schimmelresistenz (1-5)",
        help_text="1 = Sehr anfällig, 5 = Sehr resistent"
    )
    
    resistance_pests = models.IntegerField(
        default=3,
        verbose_name="Schädlingsresistenz (1-5)",
        help_text="1 = Sehr anfällig, 5 = Sehr resistent"
    )
    
    resistance_cold = models.IntegerField(
        default=3,
        verbose_name="Kälteresistenz (1-5)",
        help_text="1 = Sehr anfällig, 5 = Sehr resistent"
    )
    
    # Awards/Auszeichnungen
    awards = models.TextField(
        blank=True, null=True,
        verbose_name="Auszeichnungen"
    )
    
    # Jahr der Markteinführung
    release_year = models.IntegerField(
        blank=True, null=True,
        verbose_name="Jahr der Markteinführung"
    )
    
    # Bewertung (1-5 Sterne)
    rating = models.DecimalField(
        max_digits=3, decimal_places=1,
        default=4.0,
        verbose_name="Bewertung (1-5)"
    )
    
    # Preisliche Informationen
    price_per_seed = models.DecimalField(
        max_digits=8, decimal_places=2,
        blank=True, null=True,
        verbose_name="Preis pro Samen (€)"
    )
    
    seeds_per_pack = models.IntegerField(
        default=1,
        verbose_name="Anzahl Samen pro Packung"
    )
    
    # Zuordnung
    member = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='cannabis_strains'
    )
    
    # Metadata
    is_active = models.BooleanField(
        default=True,
        verbose_name="Aktiv"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generiere Batch-Nummer falls nicht vorhanden
        if not self.batch_number:
            today = timezone.now()
            # Zähle Strains, die heute erstellt wurden
            count = CannabisStrain.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).count() + 1
            
            # Generiere Batch-Nummer
            self.batch_number = f"strain:{today.strftime('%d:%m:%Y')}:{count:04d}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.breeder})"
    
    @property
    def lowest_unit_price(self):
        """Gibt den günstigsten Stückpreis zurück"""
        price_tiers = self.price_tiers.all()
        if price_tiers:
            return min(tier.unit_price for tier in price_tiers)
        return None

    @property
    def default_price_display(self):
        """Gibt den Standardpreis für die Anzeige zurück"""
        default_tier = self.price_tiers.filter(is_default=True).first()
        if default_tier:
            return f"{default_tier.quantity}× {default_tier.total_price}€"
        return "Kein Preis definiert"
    
    class Meta:
        verbose_name = "Cannabis-Sorte"
        verbose_name_plural = "Cannabis-Sorten"


class StrainImage(models.Model):
    """Modell für Bilder von Cannabis-Sorten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    strain = models.ForeignKey(
        CannabisStrain,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to='strain_images/%Y/%m/',
        verbose_name="Bild"
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name="Hauptbild"
    )
    caption = models.CharField(
        max_length=200,
        blank=True, null=True,
        verbose_name="Beschreibung"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Bild für {self.strain.name}"
    
    def save(self, *args, **kwargs):
        # Wenn dieses Bild als Hauptbild markiert wird, alle anderen Bilder dieser Sorte zurücksetzen
        if self.is_primary:
            StrainImage.objects.filter(strain=self.strain, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Speichere den Pfad zum Bild, bevor es gelöscht wird
        image_path = self.image.path if self.image else None
        
        # Lösche den Datensatz
        super().delete(*args, **kwargs)
        
        # Lösche die Datei, wenn sie existiert
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
    
    class Meta:
        verbose_name = "Sortenbild"
        verbose_name_plural = "Sortenbilder"


class StrainInventory(models.Model):
    """Modell für den Bestand an Cannabis-Samen"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    strain = models.OneToOneField(
        CannabisStrain,
        on_delete=models.CASCADE,
        related_name='inventory'
    )
    total_quantity = models.IntegerField(
        default=0,
        verbose_name="Gesamtmenge"
    )
    available_quantity = models.IntegerField(
        default=0,
        verbose_name="Verfügbare Menge"
    )
    last_restocked = models.DateTimeField(
        blank=True, null=True,
        verbose_name="Letzte Auffüllung"
    )
    
    def __str__(self):
        return f"Bestand: {self.strain.name} ({self.available_quantity} verfügbar)"
    
    class Meta:
        verbose_name = "Sortenbestand"
        verbose_name_plural = "Sortenbestände"

class StrainHistory(models.Model):
    """Modell zur Nachverfolgung von Änderungen an Cannabis-Sorten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    strain = models.ForeignKey(
        CannabisStrain,
        on_delete=models.CASCADE,
        related_name='history'
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='strain_history'
    )
    action = models.CharField(
        max_length=20,
        choices=[
            ('created', 'Erstellt'),
            ('updated', 'Aktualisiert'),
            ('deactivated', 'Deaktiviert'),
        ],
        default='updated',
        verbose_name="Aktion"
    )
    # Neue JSONFields
    changes = JSONField(
        blank=True, null=True,
        verbose_name="Detaillierte Änderungen"
    )
    image_data = JSONField(
        blank=True, null=True,
        verbose_name="Bildoperationsdetails"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Sortenhistorie"
        verbose_name_plural = "Sortenhistorien"
        ordering = ['-timestamp']  # Neueste Einträge zuerst

    def __str__(self):
        if self.member:
            return f"{self.get_action_display()} von {self.member.first_name} {self.member.last_name} am {self.timestamp.strftime('%d.%m.%Y %H:%M')}"
        return f"{self.get_action_display()} am {self.timestamp.strftime('%d.%m.%Y %H:%M')}"
    
class StrainPriceTier(models.Model):
    """Preisstaffel für Cannabis-Sorten"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    strain = models.ForeignKey(
        CannabisStrain,
        on_delete=models.CASCADE,
        related_name='price_tiers'
    )
    tier_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Staffelbezeichnung"
    )
    quantity = models.IntegerField(
        verbose_name="Menge (Samen pro Packung)"
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Gesamtpreis pro Packung"
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name="Standardpreis"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def unit_price(self):
        """Berechnet den Stückpreis"""
        if self.quantity > 0:
            return self.total_price / self.quantity
        return 0
    
    @property
    def discount_percentage(self):
        """Berechnet den Rabatt im Vergleich zur kleinsten Packung"""
        smallest_tier = self.strain.price_tiers.order_by('quantity').first()
        if smallest_tier and smallest_tier != self:
            smallest_unit_price = smallest_tier.unit_price
            if smallest_unit_price > 0:
                return ((smallest_unit_price - self.unit_price) / smallest_unit_price) * 100
        return 0
    
    @property
    def purchased_seeds(self):
        """Berechnet die Gesamtzahl der eingekauften Samen dieser Staffel"""
        purchases = self.purchase_history.aggregate(
            total_packs=models.Sum('quantity')
        )['total_packs'] or 0
        return purchases * self.quantity
    
    @property
    def flowering_plants(self):
        """Anzahl der Blütepflanzen aus dieser Staffel"""
        # Wird später mit CultivationBatch verknüpft
        return 0
    
    @property
    def mother_plants(self):
        """Anzahl der Mutterpflanzen aus dieser Staffel"""
        # Wird später mit CultivationBatch verknüpft
        return 0
    
    @property
    def available_seeds(self):
        """Berechnet verfügbare Samen"""
        return self.purchased_seeds - (self.flowering_plants + self.mother_plants)
    
    class Meta:
        verbose_name = "Preisstaffel"
        verbose_name_plural = "Preisstaffeln"
        ordering = ['quantity']
        unique_together = ['strain', 'quantity']


class StrainPurchaseHistory(models.Model):
    """Einkaufshistorie für Preisstaffeln"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price_tier = models.ForeignKey(
        StrainPriceTier,
        on_delete=models.CASCADE,
        related_name='purchase_history'
    )
    purchase_date = models.DateField(
        verbose_name="Einkaufsdatum"
    )
    quantity = models.IntegerField(
        verbose_name="Anzahl Packungen"
    )
    total_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Gesamtkosten"
    )
    supplier = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Lieferant"
    )
    invoice_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Rechnungsnummer"
    )
    notes = models.TextField(
        blank=True,
        verbose_name="Notizen"
    )
    purchased_by = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Eingekauft von"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Einkaufshistorie"
        verbose_name_plural = "Einkaufshistorien"
        ordering = ['-purchase_date']