# trackandtrace/models.py
import uuid
from django.db import models
from django.utils import timezone
from members.models import Member
from rooms.models import Room

class BaseTrackingModel(models.Model):
    """Basis-Modell für alle Track & Trace Einträge"""
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responsible_member = models.ForeignKey(
        Member, 
        on_delete=models.PROTECT,
        related_name="%(class)s_responsibilities"
    )
    notes = models.TextField(blank=True)
    
    # Vernichtung
    is_destroyed = models.BooleanField(default=False)
    destruction_reason = models.CharField(max_length=255, blank=True)
    destruction_date = models.DateTimeField(null=True, blank=True)
    destroying_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="%(class)s_destructions",
        null=True,
        blank=True,
        help_text="Mitglied, das die Vernichtung durchgeführt hat"
    )
    
    # Überführung
    # Erweiterte Überführungsoptionen: nicht übergeführt, teilweise übergeführt, vollständig übergeführt
    TRANSFER_STATUS_CHOICES = [
        ('not_transferred', 'Nicht übergeführt'),
        ('partially_transferred', 'Teilweise übergeführt'),
        ('fully_transferred', 'Vollständig übergeführt'),
    ]
    transfer_status = models.CharField(
        max_length=30,
        choices=TRANSFER_STATUS_CHOICES,
        default='not_transferred',
        help_text="Überführungsstatus: nicht, teilweise oder vollständig übergeführt"
    )
    # Für Abwärtskompatibilität beibehalten
    is_transferred = models.BooleanField(default=False)
    transfer_date = models.DateTimeField(null=True, blank=True)
    last_transfer_date = models.DateTimeField(null=True, blank=True, help_text="Datum der letzten Überführung")
    transferring_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="%(class)s_transfers",
        null=True,
        blank=True,
        help_text="Mitglied, das die Überführung durchgeführt hat"
    )
    
    # Umgebungsdaten
    temperature = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Temperatur während des Arbeitsschritts in °C"
    )
    humidity = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Luftfeuchtigkeit während des Arbeitsschritts in %"
    )
    # Raumzuordnung
    room = models.ForeignKey(
        'rooms.Room',  # String-Referenz um zirkuläre Imports zu vermeiden
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)ss",
        help_text="Raum, in dem dieser Prozessschritt stattfindet"
    )
    
    class Meta:
        abstract = True

    def mark_as_destroyed(self, reason, destroying_member):
        """Markiert einen Eintrag als vernichtet"""
        self.is_destroyed = True
        self.destruction_reason = reason
        self.destruction_date = timezone.now()
        self.destroying_member = destroying_member
        self.save()
        
    def mark_as_fully_transferred(self, transferring_member):
        """Markiert einen Eintrag als vollständig übergeführt"""
        self.is_transferred = True  # Für Abwärtskompatibilität
        self.transfer_status = 'fully_transferred'
        self.transfer_date = timezone.now()
        self.last_transfer_date = timezone.now()
        self.transferring_member = transferring_member
        self.save()
        
    def mark_as_partially_transferred(self, transferring_member):
        """Markiert einen Eintrag als teilweise übergeführt"""
        self.transfer_status = 'partially_transferred'
        self.last_transfer_date = timezone.now()
        self.transferring_member = transferring_member
        self.save()
        
    # Hilfsmethode für Abwärtskompatibilität
    def mark_as_transferred(self, transferring_member):
        """
        Markiert einen Eintrag als übergeführt (vollständig) - 
        für Abwärtskompatibilität, nutzt intern mark_as_fully_transferred
        """
        self.mark_as_fully_transferred(transferring_member)


class SeedPurchase(BaseTrackingModel):
    """Modell für den Samen-Einkauf (erster Schritt)"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (SEED_YYYYMMDD_NNN)"
    )
    manufacturer = models.CharField(max_length=255, help_text="Hersteller/Lieferant der Samen")
    genetics = models.CharField(max_length=255, help_text="Genetische Abstammung")
    strain_name = models.CharField(max_length=255, help_text="Name der Cannabis-Sorte")
    sativa_percentage = models.IntegerField(help_text="Sativa-Anteil in Prozent")
    indica_percentage = models.IntegerField(help_text="Indica-Anteil in Prozent")
    thc_value = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="THC-Gehalt laut Hersteller in %"
    )
    cbd_value = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="CBD-Gehalt laut Hersteller in %"
    )
    purchase_date = models.DateField(help_text="Kaufdatum der Samen")
    total_seeds = models.IntegerField(help_text="Anzahl gekaufter Samen")
    remaining_seeds = models.IntegerField(help_text="Anzahl verbleibender Samen")
    image = models.ImageField(
        upload_to='seeds/', 
        null=True, 
        blank=True,
        help_text="Bild der Samen oder Verpackung"
    )
    document = models.FileField(
        upload_to='seed_docs/', 
        null=True, 
        blank=True,
        help_text="Begleitdokumente (Kaufbeleg, Zertifikate, etc.)"
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seed_purchases",
        help_text="Raum, in dem die Samen gelagert werden"
    )
    
    class Meta:
        verbose_name = "Samen-Einkauf"
        verbose_name_plural = "Samen-Einkäufe"
        ordering = ['-purchase_date', 'strain_name']
    
    def __str__(self):
        return f"{self.strain_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = SeedPurchase.objects.filter(
                batch_number__startswith=f"SEED_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"SEED_{today}_{new_num:03d}"
            
        # Bei erster Erstellung remaining_seeds = total_seeds
        if self._state.adding:  # Besser als `if not self.pk`
            self.remaining_seeds = self.total_seeds
            
        super().save(*args, **kwargs)


class MotherPlant(BaseTrackingModel):
    """Modell für Mutterpflanzen, die aus Samen gezogen werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (MOTHER_YYYYMMDD_NNN)"
    )
    seed_source = models.ForeignKey(
        SeedPurchase,
        on_delete=models.PROTECT,
        related_name="mother_plants",
        help_text="Ursprung der Mutterpflanze (Sameneinkauf)"
    )
    planting_date = models.DateField(help_text="Datum der Aussaat")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung"
    )
    plant_count = models.IntegerField(
        help_text="Anzahl der gepflanzten Mutterpflanzen"
    )
    remaining_plants = models.IntegerField(
        help_text="Anzahl der verbleibenden Mutterpflanzen"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('seedling', 'Keimling'),
            ('vegetative', 'Vegetative Phase'),
            ('mother', 'Mutterpflanze'),
        ],
        default='seedling',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Hydrokultur)",
        blank=True
    )
    fertilizer = models.CharField(
        max_length=255, 
        help_text="Verwendete Düngemittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 18/6, 24/0)",
        default="18/6",
        blank=True
    )
    image = models.ImageField(
        upload_to='mother_plants/', 
        null=True, 
        blank=True,
        help_text="Bild der Mutterpflanzen"
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,  # Wenn ein Raum gelöscht wird, bleibt der Eintrag bestehen
        null=True,
        blank=True,
        related_name="%(class)ss",  # Dynamischer related_name basierend auf der Klasse
        help_text="Raum, in dem dieser Prozessschritt stattfindet"
    )
    
    class Meta:
        verbose_name = "Mutterpflanze"
        verbose_name_plural = "Mutterpflanzen"
        ordering = ['-planting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = MotherPlant.objects.filter(
                batch_number__startswith=f"MOTHER_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"MOTHER_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        if self._state.adding:
            # Remaining-Plants ist initial gleich Plant-Count
            self.remaining_plants = self.plant_count
            
            # Verfügbare Samen reduzieren
            if self.seed_source and not self.seed_source.is_destroyed:
                # Überprüfen, ob genügend Samen verfügbar sind
                if self.seed_source.remaining_seeds < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Samen verfügbar. Vorhanden: {self.seed_source.remaining_seeds}, Benötigt: {self.plant_count}"
                    )
                
                # Anzahl der verwendeten Samen vom Quell-Samen abziehen
                self.seed_source.remaining_seeds -= self.plant_count
                self.seed_source.save()
            
        super().save(*args, **kwargs)

class Cutting(BaseTrackingModel):
    """Modell für Stecklinge, die von Mutterpflanzen geschnitten werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (CUT_YYYYMMDD_NNN)"
    )
    mother_plant_source = models.ForeignKey(
        MotherPlant,
        on_delete=models.PROTECT,
        related_name="cuttings",
        help_text="Ursprung der Stecklinge (Mutterpflanze)"
    )
    cutting_date = models.DateField(help_text="Datum des Schneidens")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (von der Mutterpflanze übernommen)"
    )
    cutting_count = models.IntegerField(
        help_text="Anzahl der geschnittenen Stecklinge"
    )
    remaining_cuttings = models.IntegerField(
        help_text="Anzahl der verbleibenden Stecklinge"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('cutting', 'Frischer Schnitt'),
            ('rooting', 'Bewurzelung'),
            ('vegetative', 'Vegetative Phase'),
        ],
        default='cutting',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Wasser)",
        blank=True
    )
    rooting_agent = models.CharField(
        max_length=255, 
        help_text="Verwendetes Bewurzelungsmittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 18/6, 24/0)",
        default="18/6",
        blank=True
    )
    image = models.ImageField(
        upload_to='cuttings/', 
        null=True, 
        blank=True,
        help_text="Bild der Stecklinge"
    )
    
    class Meta:
        verbose_name = "Steckling"
        verbose_name_plural = "Stecklinge"
        ordering = ['-cutting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Cutting.objects.filter(
                batch_number__startswith=f"CUT_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"CUT_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        if self._state.adding:
            # Genetik von der Mutterpflanze übernehmen, wenn nicht gesetzt
            if not self.genetic_name and self.mother_plant_source:
                self.genetic_name = self.mother_plant_source.genetic_name
                
            # Remaining-Cuttings ist initial gleich Cutting-Count
            self.remaining_cuttings = self.cutting_count
        
        super().save(*args, **kwargs)


class FloweringPlant(BaseTrackingModel):
    """Modell für Blühpflanzen, die entweder aus Samen oder Stecklingen gezogen werden"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (FLOWER_YYYYMMDD_NNN)"
    )
    # Duale Herkunft (entweder aus Samen oder aus Stecklingen)
    seed_source = models.ForeignKey(
        SeedPurchase,
        on_delete=models.PROTECT,
        related_name="flowering_plants",
        null=True,
        blank=True,
        help_text="Ursprung der Blühpflanze (Sameneinkauf), wenn direkt aus Samen"
    )
    cutting_source = models.ForeignKey(
        Cutting,
        on_delete=models.PROTECT,
        related_name="flowering_plants",
        null=True,
        blank=True,
        help_text="Ursprung der Blühpflanze (Steckling), wenn aus Steckling"
    )
    planting_date = models.DateField(help_text="Datum der Aussaat/Einpflanzung")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Quelle)"
    )
    plant_count = models.IntegerField(
        help_text="Anzahl der gepflanzten Blühpflanzen"
    )
    remaining_plants = models.IntegerField(
        help_text="Anzahl der verbleibenden Blühpflanzen"
    )
    growth_phase = models.CharField(
        max_length=50,
        choices=[
            ('vegetative', 'Vegetative Phase'),
            ('pre_flower', 'Vorblüte'),
            ('flowering', 'Blütephase'),
            ('late_flower', 'Spätblüte'),
            ('harvest_ready', 'Erntereif'),
        ],
        default='vegetative',
        help_text="Aktuelle Wachstumsphase"
    )
    growth_medium = models.CharField(
        max_length=255, 
        help_text="Wachstumsmedium (z.B. Erde, Kokos, Hydrokultur)",
        blank=True
    )
    fertilizer = models.CharField(
        max_length=255, 
        help_text="Verwendete Düngemittel",
        blank=True
    )
    light_cycle = models.CharField(
        max_length=50, 
        help_text="Lichtzyklus (z.B. 12/12, 11/13)",
        default="12/12",
        blank=True
    )
    expected_harvest_date = models.DateField(
        null=True,
        blank=True,
        help_text="Erwartetes Erntedatum"
    )
    image = models.ImageField(
        upload_to='flowering_plants/', 
        null=True, 
        blank=True,
        help_text="Bild der Blühpflanzen"
    )
    
    class Meta:
        verbose_name = "Blühpflanze"
        verbose_name_plural = "Blühpflanzen"
        ordering = ['-planting_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = FloweringPlant.objects.filter(
                batch_number__startswith=f"FLOWER_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"FLOWER_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Remaining-Plants ist initial gleich Plant-Count
            self.remaining_plants = self.plant_count
            
            # Automatische Genetik-Übernahme von Quelle
            if not self.genetic_name:
                if self.seed_source:
                    self.genetic_name = self.seed_source.strain_name
                elif self.cutting_source:
                    self.genetic_name = self.cutting_source.genetic_name
            
            # Überprüfung: Entweder Samen ODER Steckling muss angegeben sein, nicht beides
            if bool(self.seed_source) == bool(self.cutting_source):
                raise ValueError(
                    "Entweder muss eine Samenquelle ODER eine Stecklingsquelle angegeben werden, nicht beide oder keine."
                )
            
            # Quell-Objekt als übergeführt markieren und Anzahl reduzieren
            if self.seed_source and not self.seed_source.is_destroyed and not self.seed_source.is_transferred:
                # Überprüfen, ob genügend Samen verfügbar sind
                if self.seed_source.remaining_seeds < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Samen verfügbar. Vorhanden: {self.seed_source.remaining_seeds}, Benötigt: {self.plant_count}"
                    )
                # Samen abziehen
                self.seed_source.remaining_seeds -= self.plant_count
                # Wenn keine Samen mehr übrig, als übergeführt markieren
                if self.seed_source.remaining_seeds == 0:
                    self.seed_source.mark_as_transferred(self.responsible_member)
                else:
                    self.seed_source.save()
            
            elif self.cutting_source and not self.cutting_source.is_destroyed and not self.cutting_source.is_transferred:
                # Überprüfen, ob genügend Stecklinge verfügbar sind
                if self.cutting_source.remaining_cuttings < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Stecklinge verfügbar. Vorhanden: {self.cutting_source.remaining_cuttings}, Benötigt: {self.plant_count}"
                    )
                # Stecklinge abziehen
                self.cutting_source.remaining_cuttings -= self.plant_count
                # Wenn keine Stecklinge mehr übrig, als übergeführt markieren
                if self.cutting_source.remaining_cuttings == 0:
                    self.cutting_source.mark_as_transferred(self.responsible_member)
                else:
                    self.cutting_source.save()
        
        super().save(*args, **kwargs)


class Harvest(BaseTrackingModel):
    """Modell für die Ernte der Blühpflanzen"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (HARVEST_YYYYMMDD_NNN)"
    )
    flowering_plant_source = models.ForeignKey(
        FloweringPlant,
        on_delete=models.PROTECT,
        related_name="harvests",
        help_text="Ursprung der Ernte (Blühpflanze)"
    )
    harvest_date = models.DateField(help_text="Datum der Ernte")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Blühpflanze)"
    )
    plant_count = models.IntegerField(
        help_text="Anzahl der geernteten Pflanzen"
    )
    fresh_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Frischgewicht der Ernte in Gramm"
    )
    remaining_fresh_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Verbleibendes Frischgewicht in Gramm"
    )
    flower_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht der Blüten in Gramm"
    )
    leaf_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht der Blätter in Gramm"
    )
    stem_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht der Stängel in Gramm"
    )
    harvest_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Verwendete Erntemethode"
    )
    expected_drying_date = models.DateField(
        null=True,
        blank=True,
        help_text="Erwartetes Datum der Fertigtrocknung"
    )
    image = models.ImageField(
        upload_to='harvests/', 
        null=True, 
        blank=True,
        help_text="Bild der Ernte"
    )
    
    class Meta:
        verbose_name = "Ernte"
        verbose_name_plural = "Ernten"
        ordering = ['-harvest_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Harvest.objects.filter(
                batch_number__startswith=f"HARVEST_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"HARVEST_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Verbleibendes Frischgewicht ist initial gleich Frischgewicht
            self.remaining_fresh_weight = self.fresh_weight
            
            # Automatische Genetik-Übernahme von Quelle
            if not self.genetic_name and self.flowering_plant_source:
                self.genetic_name = self.flowering_plant_source.genetic_name
            
            # Blühpflanzquelle als übergeführt markieren
            if self.flowering_plant_source and not self.flowering_plant_source.is_destroyed and not self.flowering_plant_source.is_transferred:
                # Überprüfen, ob genügend Pflanzen verfügbar sind
                if self.flowering_plant_source.remaining_plants < self.plant_count:
                    raise ValueError(
                        f"Nicht genügend Pflanzen verfügbar. Vorhanden: {self.flowering_plant_source.remaining_plants}, Benötigt: {self.plant_count}"
                    )
                
                # Pflanzenanzahl reduzieren
                self.flowering_plant_source.remaining_plants -= self.plant_count
                
                # Wenn keine Pflanzen mehr übrig, als übergeführt markieren
                if self.flowering_plant_source.remaining_plants == 0:
                    self.flowering_plant_source.mark_as_transferred(self.responsible_member)
                else:
                    self.flowering_plant_source.save()
        
        super().save(*args, **kwargs)


class Drying(BaseTrackingModel):
    """Modell für den Trocknungsprozess nach der Ernte"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (DRY_YYYYMMDD_NNN)"
    )
    harvest_source = models.ForeignKey(
        Harvest,
        on_delete=models.PROTECT,
        related_name="dryings",
        help_text="Ursprung der Trocknung (Ernte)"
    )
    drying_start_date = models.DateField(help_text="Datum des Trocknungsbeginns")
    drying_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Datum des Trocknungsendes"
    )
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Ernte)"
    )
    fresh_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Frischgewicht in Gramm (übernommen von der Ernte)"
    )
    dried_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Trockengewicht in Gramm nach Abschluss der Trocknung"
    )
    remaining_dried_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Verbleibendes Trockengewicht in Gramm"
    )
    drying_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Verwendete Trocknungsmethode"
    )
    target_humidity = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Zielfeuchtigkeitsgehalt in %"
    )
    target_temperature = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Zieltemperatur während der Trocknung in °C"
    )
    image = models.ImageField(
        upload_to='dryings/', 
        null=True, 
        blank=True,
        help_text="Bild der Trocknung"
    )
    
    class Meta:
        verbose_name = "Trocknung"
        verbose_name_plural = "Trocknungen"
        ordering = ['-drying_start_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Drying.objects.filter(
                batch_number__startswith=f"DRY_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"DRY_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Automatische Übernahme von Ernte-Daten
            if not self.genetic_name and self.harvest_source:
                self.genetic_name = self.harvest_source.genetic_name
                
            if not self.fresh_weight and self.harvest_source:
                self.fresh_weight = self.harvest_source.remaining_fresh_weight
            
            # Erntequelle als übergeführt markieren
            # WICHTIG: Hier implementieren wir die verbesserte Überführungslogik
            if self.harvest_source and not self.harvest_source.is_destroyed and not self.harvest_source.is_transferred:
                # Hier die Änderung: Wir markieren die Ernte-Quelle als übergeführt,
                # unabhängig davon, ob noch Material übrig ist
                
                # Option 1: Vollständig übergeführt, wenn alles verwendet wird
                if self.fresh_weight >= self.harvest_source.remaining_fresh_weight:
                    # Wir überführen alles, also markieren wir als übergeführt
                    self.harvest_source.mark_as_transferred(self.responsible_member)
                else:
                    # Option 2: Teilweise Überführung - reduzieren des verbleibenden Gewichts
                    self.harvest_source.remaining_fresh_weight -= self.fresh_weight
                    self.harvest_source.save()
        
        super().save(*args, **kwargs)

    def mark_as_partially_transferred(self, transferring_member):
        """Markiert einen Eintrag als teilweise übergeführt"""
        self.transfer_status = 'partially_transferred'
        self.last_transfer_date = timezone.now()
        self.transferring_member = transferring_member
        
        # Wenn Trockengewicht gesetzt ist, aber verbleibendes Trockengewicht nicht,
        # setzen wir das verbleibende Trockengewicht gleich dem Trockengewicht
        if self.dried_weight and not self.remaining_dried_weight:
            self.remaining_dried_weight = self.dried_weight
        
        self.save()
        
    def mark_as_fully_transferred(self, transferring_member):
        """Markiert einen Eintrag als vollständig übergeführt"""
        self.is_transferred = True  # Für Abwärtskompatibilität
        self.transfer_status = 'fully_transferred'
        self.transfer_date = timezone.now()
        self.last_transfer_date = timezone.now()
        self.transferring_member = transferring_member
        
        # Stelle sicher, dass remaining_dried_weight gesetzt ist, bevor wir es auf 0 setzen
        if self.dried_weight and not self.remaining_dried_weight:
            self.remaining_dried_weight = self.dried_weight
            
        # Bei vollständiger Überführung verbleibendes Gewicht auf 0 setzen
        self.remaining_dried_weight = 0
        
        self.save()


class Processing(BaseTrackingModel):
    """Modell für die Verarbeitung nach der Trocknung"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (PROC_YYYYMMDD_NNN)"
    )
    drying_source = models.ForeignKey(
        Drying,
        on_delete=models.PROTECT,
        related_name="processings",
        help_text="Ursprung der Verarbeitung (Trocknung)"
    )
    processing_date = models.DateField(help_text="Datum der Verarbeitung")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Trocknung)"
    )
    
    # Gewichtsdaten
    input_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Eingangsgewicht in Gramm (aus Trocknung)"
    )
    remaining_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Verbleibendes Gewicht in Gramm"
    )
    
    # Verarbeitungsdetails
    processing_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Verwendete Verarbeitungsmethode (z.B. Trimmen, Mahlen, Extraktion)"
    )
    
    # Produkttypen
    PRODUCT_TYPE_CHOICES = [
        ('flower', 'Blüte'),
        ('trim', 'Schnittreste'),
        ('extract', 'Extrakt'),
        ('mix', 'Mischung')
    ]
    product_type = models.CharField(
        max_length=50,
        choices=PRODUCT_TYPE_CHOICES,
        default='flower',
        help_text="Art des erzeugten Produkts"
    )
    
    # Ertrags- und Qualitätsdaten
    flower_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht der verarbeiteten Blüten in Gramm"
    )
    trim_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht der Schnittreste in Gramm"
    )
    waste_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht des Abfalls in Gramm"
    )
    
    # Zusätzliche Details
    potency_estimate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Geschätzte Wirkstoffkonzentration in %"
    )
    expected_lab_date = models.DateField(
        null=True,
        blank=True,
        help_text="Erwartetes Datum der Laborprüfung"
    )
    image = models.ImageField(
        upload_to='processings/', 
        null=True, 
        blank=True,
        help_text="Bild der Verarbeitung oder des Endprodukts"
    )
    
    class Meta:
        verbose_name = "Verarbeitung"
        verbose_name_plural = "Verarbeitungen"
        ordering = ['-processing_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Processing.objects.filter(
                batch_number__startswith=f"PROC_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"PROC_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Automatische Übernahme von Trocknung-Daten
            if not self.genetic_name and self.drying_source:
                self.genetic_name = self.drying_source.genetic_name
                
            if not self.input_weight and self.drying_source:
                self.input_weight = self.drying_source.remaining_dried_weight
            
            # Verbleibendes Gewicht ist initial gleich Eingangsgewicht
            self.remaining_weight = self.input_weight
            
            # Trocknungsquelle als übergeführt markieren - verbesserte Überführungslogik
            # WICHTIG: Hier implementieren wir die verbesserte Überführungslogik
            if self.drying_source and not self.drying_source.is_destroyed:
                # Wenn das gesamte Trockengewicht verwendet wird
                if self.input_weight >= self.drying_source.remaining_dried_weight:
                    # Vollständige Überführung
                    self.drying_source.mark_as_fully_transferred(self.responsible_member)
                else:
                    # Teilweise Überführung
                    self.drying_source.remaining_dried_weight -= self.input_weight
                    self.drying_source.mark_as_partially_transferred(self.responsible_member)
                    self.drying_source.save()
        
        super().save(*args, **kwargs)

# LabTesting Modell für models.py
class LabTesting(BaseTrackingModel):
    """Modell für die Laborkontrolle nach der Verarbeitung"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (LAB_YYYYMMDD_NNN)"
    )
    processing_source = models.ForeignKey(
        Processing,
        on_delete=models.PROTECT,
        related_name="lab_testings",
        help_text="Ursprung der Laborkontrolle (Verarbeitung)"
    )
    sample_date = models.DateField(help_text="Datum der Probennahme")
    test_date = models.DateField(help_text="Datum der Durchführung des Tests")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Verarbeitung)"
    )
    
    # Status für die Laborkontrolle
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('in_progress', 'In Bearbeitung'),
        ('completed', 'Abgeschlossen'),
        ('failed', 'Nicht bestanden')
    ]
    test_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Status der Laborkontrolle"
    )
    
    # Gewichtsdaten
    sample_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Gewicht der Probe in Gramm"
    )
    remaining_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Verbleibendes Gewicht in Gramm nach der Laborkontrolle"
    )
    
    # Analyseergebnisse
    thc_content = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="THC-Gehalt in %"
    )
    cbd_content = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="CBD-Gehalt in %"
    )
    moisture_content = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Feuchtigkeitsgehalt in %"
    )
    
    # Qualitätsprüfung
    contaminants_check = models.BooleanField(
        default=False,
        help_text="Prüfung auf Verunreinigungen (bestanden=True)"
    )
    pesticides_check = models.BooleanField(
        default=False,
        help_text="Prüfung auf Pestizide (bestanden=True)"
    )
    microbes_check = models.BooleanField(
        default=False,
        help_text="Mikrobiologische Prüfung (bestanden=True)"
    )
    heavy_metals_check = models.BooleanField(
        default=False,
        help_text="Prüfung auf Schwermetalle (bestanden=True)"
    )
    
    # Testdetails
    lab_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Name des Labors, das die Analyse durchgeführt hat"
    )
    test_method = models.CharField(
        max_length=255,
        blank=True,
        help_text="Verwendete Prüfmethode"
    )
    notes_from_lab = models.TextField(
        blank=True,
        help_text="Notizen und Anmerkungen vom Labor"
    )
    
    # Dokumente
    lab_report = models.FileField(
        upload_to='lab_reports/',
        null=True,
        blank=True,
        help_text="Hochgeladener Laborbericht (PDF)"
    )
    
    # Ergebnisbewertung
    is_approved = models.BooleanField(
        default=False,
        help_text="Freigabe des Produkts nach Laborprüfung"
    )
    approval_date = models.DateField(
        null=True,
        blank=True,
        help_text="Datum der Produktfreigabe"
    )
    
    class Meta:
        verbose_name = "Laborkontrolle"
        verbose_name_plural = "Laborkontrollen"
        ordering = ['-test_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = LabTesting.objects.filter(
                batch_number__startswith=f"LAB_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"LAB_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Automatische Übernahme von Verarbeitungs-Daten
            if not self.genetic_name and self.processing_source:
                self.genetic_name = self.processing_source.genetic_name
                
            # Restgewicht ist initial gleich Probengewicht
            self.remaining_weight = self.sample_weight
            
            # Verarbeitungsquelle als übergeführt markieren - verbesserte Überführungslogik
            if self.processing_source and not self.processing_source.is_destroyed:
                # Wenn das gesamte Produkt für die Laborkontrolle verwendet wird
                if self.sample_weight >= self.processing_source.remaining_weight:
                    # Vollständige Überführung
                    self.processing_source.mark_as_fully_transferred(self.responsible_member)
                else:
                    # Teilweise Überführung - Restgewicht reduzieren
                    self.processing_source.remaining_weight = (
                        float(self.processing_source.remaining_weight) - float(self.sample_weight)
                    )
                    self.processing_source.mark_as_partially_transferred(self.responsible_member)
                    self.processing_source.save()
        
        # Bei Änderung des Status auf 'completed' automatisch das heutige Datum als Testdatum setzen
        if not is_new and self.test_status == 'completed' and not self.approval_date and self.is_approved:
            self.approval_date = timezone.now().date()
        
        super().save(*args, **kwargs)
        
    def all_checks_passed(self):
        """Prüft, ob alle Qualitätsprüfungen bestanden wurden"""
        return (self.contaminants_check and 
                self.pesticides_check and 
                self.microbes_check and 
                self.heavy_metals_check)
    
    def get_approval_status_display(self):
        """Gibt einen lesbaren Status der Freigabe zurück"""
        if self.test_status != 'completed':
            return "Prüfung ausstehend"
        
        if not self.is_approved:
            return "Nicht freigegeben"
        
        return f"Freigegeben am {self.approval_date}"
    

# Packaging Modell für models.py
class Packaging(BaseTrackingModel):
    """Modell für die Verpackung nach der Laborkontrolle"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (PACK_YYYYMMDD_NNN)"
    )
    lab_testing_source = models.ForeignKey(
        LabTesting,
        on_delete=models.PROTECT,
        related_name="packagings",
        help_text="Ursprung der Verpackung (Laborkontrolle)"
    )
    packaging_date = models.DateField(help_text="Datum der Verpackung")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Laborkontrolle)"
    )
    
    # Gewichtsdaten
    input_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Eingangsgewicht in Gramm"
    )
    remaining_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Verbleibendes Gewicht in Gramm"
    )
    
    # Verpackungsdetails
    PACKAGING_TYPE_CHOICES = [
        ('bulk', 'Bulk/Großverpackung'),
        ('single', 'Einzelverpackung'),
        ('mixed', 'Mischverpackung')
    ]
    packaging_type = models.CharField(
        max_length=20,
        choices=PACKAGING_TYPE_CHOICES,
        default='single',
        help_text="Art der Verpackung"
    )
    
    # Produktdetails
    PRODUCT_TYPE_CHOICES = [
        ('flower', 'Blüte'),
        ('extract', 'Extrakt'),
        ('oil', 'Öl'),
        ('edible', 'Essbar'),
        ('other', 'Sonstiges')
    ]
    product_type = models.CharField(
        max_length=20,
        choices=PRODUCT_TYPE_CHOICES,
        default='flower',
        help_text="Art des Produkts"
    )
    
    # Paketdetails
    package_count = models.IntegerField(
        default=1,
        help_text="Anzahl der erstellten Pakete"
    )
    unit_weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gewicht pro Einheit in Gramm"
    )
    
    # Verpackungsmaterial
    packaging_material = models.CharField(
        max_length=255,
        blank=True,
        help_text="Verwendetes Verpackungsmaterial"
    )
    
    # Qualitätssicherung
    is_quality_checked = models.BooleanField(
        default=False,
        help_text="Qualitätskontrolle durchgeführt"
    )
    quality_check_date = models.DateField(
        null=True,
        blank=True,
        help_text="Datum der Qualitätskontrolle"
    )
    quality_check_notes = models.TextField(
        blank=True,
        help_text="Anmerkungen zur Qualitätskontrolle"
    )
    
    # Labeling
    has_labels = models.BooleanField(
        default=False,
        help_text="Produkt ist etikettiert"
    )
    label_details = models.TextField(
        blank=True,
        help_text="Details zu den Etiketten"
    )
    
    # Lagerdetails
    shelf_life = models.IntegerField(
        null=True,
        blank=True,
        help_text="Haltbarkeit in Tagen"
    )
    storage_conditions = models.CharField(
        max_length=255,
        blank=True,
        help_text="Empfohlene Lagerbedingungen"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Ablaufdatum"
    )
    
    # Dokumente
    label_image = models.ImageField(
        upload_to='packaging_labels/',
        null=True,
        blank=True,
        help_text="Bild des Etiketts"
    )
    
    class Meta:
        verbose_name = "Verpackung"
        verbose_name_plural = "Verpackungen"
        ordering = ['-packaging_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = Packaging.objects.filter(
                batch_number__startswith=f"PACK_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"PACK_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Automatische Übernahme von Laborkontroll-Daten
            if not self.genetic_name and self.lab_testing_source:
                self.genetic_name = self.lab_testing_source.genetic_name
                
            # Restgewicht ist initial gleich Eingangsgewicht
            self.remaining_weight = self.input_weight
            
            # Automatisches Setzen des Ablaufdatums, wenn Haltbarkeit angegeben
            if self.shelf_life and not self.expiry_date:
                self.expiry_date = self.packaging_date + timezone.timedelta(days=self.shelf_life)
            
            # Laborkontrollquelle als übergeführt markieren - verbesserte Überführungslogik
            if self.lab_testing_source and not self.lab_testing_source.is_destroyed:
                # Wenn das gesamte freigegebene Material für die Verpackung verwendet wird
                if self.input_weight >= self.lab_testing_source.remaining_weight:
                    # Vollständige Überführung
                    self.lab_testing_source.mark_as_fully_transferred(self.responsible_member)
                else:
                    # Teilweise Überführung - Restgewicht reduzieren
                    self.lab_testing_source.remaining_weight = (
                        float(self.lab_testing_source.remaining_weight) - float(self.input_weight)
                    )
                    self.lab_testing_source.mark_as_partially_transferred(self.responsible_member)
                    self.lab_testing_source.save()
        
        super().save(*args, **kwargs)


# ProductDistribution Modell für models.py
class ProductDistribution(BaseTrackingModel):
    """Modell für die Produktausgabe nach der Verpackung"""
    batch_number = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Automatisch generierte Chargennummer (DIST_YYYYMMDD_NNN)"
    )
    packaging_source = models.ForeignKey(
        Packaging,
        on_delete=models.PROTECT,
        related_name="distributions",
        help_text="Ursprung der Produktausgabe (Verpackung)"
    )
    distribution_date = models.DateField(help_text="Datum der Ausgabe")
    genetic_name = models.CharField(
        max_length=255, 
        help_text="Genetische Bezeichnung (übernommen von Verpackung)"
    )
    
    # Wichtig: Zweites Mitgliederfeld für den Empfänger der Produktausgabe
    receiving_member = models.ForeignKey(
        Member, 
        on_delete=models.PROTECT,
        related_name="received_products",
        help_text="Mitglied, das das Produkt erhält"
    )
    
    # Gewichtsdaten
    quantity = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Menge des ausgegebenen Produkts in Gramm"
    )
    remaining_quantity = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Verbleibende Menge in Gramm (relevant für Rückgaben)"
    )
    
    # Package-Anzahl
    package_count = models.IntegerField(
        default=1,
        help_text="Anzahl der ausgegebenen Pakete"
    )
    
    # Ausgabedetails
    DISTRIBUTION_TYPE_CHOICES = [
        ('member', 'Mitgliedsausgabe'),
        ('return', 'Rückgabe'),
        ('donation', 'Spende'),
        ('disposal', 'Entsorgung'),
        ('other', 'Sonstiges')
    ]
    distribution_type = models.CharField(
        max_length=20,
        choices=DISTRIBUTION_TYPE_CHOICES,
        default='member',
        help_text="Art der Ausgabe"
    )
    
    # Zahlungsinformationen
    price_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Preis pro Einheit"
    )
    total_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Gesamtpreis"
    )
    is_paid = models.BooleanField(
        default=False,
        help_text="Zahlung erhalten"
    )
    payment_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Zahlungsmethode"
    )
    payment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Zahlungsdatum"
    )
    
    # Ausgabestatus
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('completed', 'Abgeschlossen'),
        ('canceled', 'Storniert'),
        ('returned', 'Zurückgegeben')
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Status der Ausgabe"
    )
    
    # Empfangsbestätigung
    is_confirmed = models.BooleanField(
        default=False,
        help_text="Empfang wurde bestätigt"
    )
    confirmation_date = models.DateField(
        null=True,
        blank=True,
        help_text="Datum der Empfangsbestätigung"
    )
    recipient_signature = models.FileField(
        upload_to='signatures/',
        null=True,
        blank=True,
        help_text="Unterschrift des Empfängers"
    )
    
    # Rückverfolgbarkeit
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="Tracking-Nummer oder Referenz"
    )
    
    # Dokumente
    distribution_document = models.FileField(
        upload_to='distribution_docs/',
        null=True,
        blank=True,
        help_text="Ausgabedokument oder Beleg"
    )
    
    class Meta:
        verbose_name = "Produktausgabe"
        verbose_name_plural = "Produktausgaben"
        ordering = ['-distribution_date', 'genetic_name']
    
    def __str__(self):
        return f"{self.genetic_name} ({self.batch_number})"
    
    def save(self, *args, **kwargs):
        # Automatische Batch-Nummer generieren, wenn nicht vorhanden
        if not self.batch_number:
            today = timezone.now().strftime('%Y%m%d')
            last_batch = ProductDistribution.objects.filter(
                batch_number__startswith=f"DIST_{today}"
            ).order_by('batch_number').last()
            
            if last_batch:
                last_num = int(last_batch.batch_number.split('_')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.batch_number = f"DIST_{today}_{new_num:03d}"
        
        # Bei erster Erstellung
        is_new = self._state.adding
        
        if is_new:
            # Automatische Übernahme von Verpackungs-Daten
            if not self.genetic_name and self.packaging_source:
                self.genetic_name = self.packaging_source.genetic_name
                
            # Restmenge ist initial gleich Ausgabemenge
            self.remaining_quantity = self.quantity
            
            # Automatische Berechnung des Gesamtpreises, wenn ein Preis pro Einheit angegeben ist
            if self.price_per_unit is not None and not self.total_price:
                self.total_price = self.price_per_unit * self.quantity
            
            # Verpackungsquelle als übergeführt markieren - verbesserte Überführungslogik
            if self.packaging_source and not self.packaging_source.is_destroyed:
                # Wenn das gesamte verpackte Material ausgegeben wird
                if self.quantity >= self.packaging_source.remaining_weight:
                    # Vollständige Überführung
                    self.packaging_source.mark_as_fully_transferred(self.responsible_member)
                else:
                    # Teilweise Überführung - Restgewicht reduzieren
                    self.packaging_source.remaining_weight = (
                        float(self.packaging_source.remaining_weight) - float(self.quantity)
                    )
                    self.packaging_source.mark_as_partially_transferred(self.responsible_member)
                    self.packaging_source.save()
                    
        # Bei Status-Änderung auf 'completed', Empfangsbestätigung automatisch setzen
        if not is_new and self.status == 'completed' and not self.is_confirmed:
            self.is_confirmed = True
            self.confirmation_date = timezone.now().date()
        
        super().save(*args, **kwargs)